import { createHash } from "node:crypto";
import {
  createWriteStream,
  existsSync,
  statSync,
  unlinkSync,
  readdirSync,
} from "node:fs";
import { join, dirname, extname, basename } from "node:path";
import { pipeline } from "node:stream/promises";

import { ensureDir } from "fs-extra";

import {
  FileError,
  DownloadError,
  DiskSpaceError,
  type FileManagerOptions,
  type DownloadOptions,
  type FileNameGenerationOptions,
  type DirectoryOptions,
  type FileOutputOptions,
  type SaveImageResult,
  type FileConflictResolution,
} from "../types/file.js";

interface DownloadResult {
  path: string;
  size: number;
  format: string;
  downloadTime: number;
}

interface ImageMetadata {
  prompt?: string;
  aspectRatio?: string;
  quality?: string;
  format?: string;
}

export class FileManager {
  private options: Required<FileManagerOptions>;
  private customFileCounter = new Map<string, number>();

  constructor(options: FileManagerOptions = {}) {
    this.options = {
      defaultOutputDir: options.defaultOutputDir ?? "./generated_images",
      maxFileSizeBytes: options.maxFileSizeBytes ?? 50 * 1024 * 1024, // 50MB
      enableFileOutput: options.enableFileOutput ?? true,
      autoCleanupDays: options.autoCleanupDays ?? 30,
    };
  }

  async downloadImage(options: DownloadOptions): Promise<DownloadResult> {
    const {
      url,
      outputPath,
      timeout = 120000,
      retryCount = 3,
      retryDelay = 1000,
    } = options;
    const startTime = Date.now();

    // Ensure output directory exists
    await this.ensureDirectory(dirname(outputPath));

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Image-Gen-MCP/1.0",
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new DownloadError(
            `HTTP ${response.status}: ${response.statusText}`,
            url,
            response.status,
          );
        }

        const contentLength = parseInt(
          response.headers.get("content-length") ?? "0",
          10,
        );
        const contentType = response.headers.get("content-type") ?? "";

        // Check file size limits
        if (contentLength > this.options.maxFileSizeBytes) {
          throw new DiskSpaceError(
            `File size (${contentLength} bytes) exceeds maximum allowed size (${this.options.maxFileSizeBytes} bytes)`,
            contentLength,
            this.options.maxFileSizeBytes,
            outputPath,
          );
        }

        // Validate content type
        if (!contentType.startsWith("image/")) {
          throw new DownloadError(
            `Invalid content type: ${contentType}. Expected image content.`,
            url,
            response.status,
          );
        }

        if (!response.body) {
          throw new DownloadError("No response body", url, response.status);
        }

        const writer = createWriteStream(outputPath);
        let downloadedBytes = 0;
        const self = this;

        try {
          await pipeline(
            response.body,
            async function* (source: ReadableStream<Uint8Array>) {
              for await (const chunk of source) {
                downloadedBytes += chunk.length;
                if (downloadedBytes > self.options.maxFileSizeBytes) {
                  throw new DiskSpaceError(
                    `Download size exceeded limit during transfer`,
                    downloadedBytes,
                    self.options.maxFileSizeBytes,
                    outputPath,
                  );
                }
                yield chunk;
              }
            },
            writer,
          );

          const downloadTime = Date.now() - startTime;
          const format = this.getImageFormat(contentType, outputPath);

          return {
            path: outputPath,
            size: downloadedBytes,
            format,
            downloadTime,
          };
        } catch (error) {
          throw new FileError(
            `Failed to write file: ${error instanceof Error ? error.message : "Unknown error"}`,
            "WRITE_ERROR",
            outputPath,
            { originalError: error },
          );
        }
      } catch (error) {
        lastError = this.handleDownloadError(error, url, attempt, retryCount);

        if (attempt < retryCount) {
          await this.delay(retryDelay * (attempt + 1)); // Exponential backoff
          continue;
        }

        throw lastError;
      }
    }

    throw (
      lastError || new DownloadError("Download failed after all retries", url)
    );
  }

  generateFileName(
    options: FileNameGenerationOptions,
    extension = ".png",
  ): string {
    const { strategy, prompt, customPrefix, maxLength = 100 } = options;
    const now = new Date();
    const timestamp =
      now.toISOString().slice(0, 10).replace(/-/g, "") +
      "_" +
      now.toISOString().slice(11, 19).replace(/:/g, "");

    switch (strategy) {
      case "timestamp": {
        const hash = this.generateHash(prompt ?? "").slice(0, 6);

        return `image_${timestamp}_${hash}${extension}`;
      }

      case "prompt": {
        if (prompt == null) {
          throw new FileError(
            "Prompt is required for prompt-based naming",
            "INVALID_OPTION",
          );
        }

        const sanitizedPrompt = this.sanitizeFilename(prompt);
        const truncated = sanitizedPrompt.slice(
          0,
          maxLength - timestamp.length - extension.length - 1,
        );

        return `${truncated}_${timestamp}${extension}`;
      }

      case "custom": {
        const prefix = customPrefix ?? "generated";
        const counter = this.getNextCounter(prefix);

        return `${prefix}_${counter.toString().padStart(3, "0")}${extension}`;
      }

      case "hash": {
        const hash = this.generateHash(prompt ?? timestamp).slice(0, 8);

        return `${hash}${extension}`;
      }

      default:
        throw new FileError(
          `Unknown naming strategy: ${strategy}`,
          "INVALID_OPTION",
        );
    }
  }

  async ensureDirectory(dirPath: string): Promise<void> {
    if (!dirPath || dirPath.trim() === "") {
      throw new FileError("Directory path cannot be empty", "INVALID_PATH");
    }

    try {
      await ensureDir(dirPath);
    } catch (error) {
      throw new FileError(
        `Failed to create directory: ${error instanceof Error ? error.message : "Unknown error"}`,
        "DIRECTORY_ERROR",
        dirPath,
        { originalError: error },
      );
    }
  }

  getOrganizedDirectory(options: DirectoryOptions): string {
    const { baseDir, organizeBy, aspectRatio, quality, date } = options;

    switch (organizeBy) {
      case "none":
        return baseDir;

      case "date": {
        const targetDate = date || new Date();
        const dateStr = targetDate.toISOString().slice(0, 10); // YYYY-MM-DD

        return join(baseDir, dateStr);
      }

      case "aspect_ratio": {
        if (aspectRatio == null) {
          throw new FileError(
            "Aspect ratio is required for aspect_ratio organization",
            "INVALID_OPTION",
          );
        }

        return join(baseDir, aspectRatio);
      }

      case "quality": {
        if (quality == null) {
          throw new FileError(
            "Quality is required for quality organization",
            "INVALID_OPTION",
          );
        }

        return join(baseDir, quality);
      }

      default:
        throw new FileError(
          `Unknown organization strategy: ${organizeBy}`,
          "INVALID_OPTION",
        );
    }
  }

  async saveImage(
    url: string,
    options: FileOutputOptions,
    metadata: ImageMetadata,
  ): Promise<SaveImageResult | null> {
    if (!options.save_to_file) {
      return null;
    }

    // Determine output directory
    const baseDir = options.output_directory ?? this.options.defaultOutputDir;
    const directoryOptions: DirectoryOptions = {
      baseDir,
      organizeBy: options.organize_by,
      date: new Date(),
    };
    if (metadata.aspectRatio != null && metadata.aspectRatio.length > 0) {
      directoryOptions.aspectRatio = metadata.aspectRatio;
    }
    if (metadata.quality != null && metadata.quality.length > 0) {
      directoryOptions.quality = metadata.quality;
    }
    const outputDir = this.getOrganizedDirectory(directoryOptions);

    await this.ensureDirectory(outputDir);

    // Generate filename
    const extension = `.${(metadata.format ?? "png").replace(/^\./, "")}`;

    const filename =
      options.filename != null
        ? this.resolveCustomFilename(options.filename, outputDir, extension)
        : this.generateFileName(
            {
              strategy: options.naming_strategy,
              ...(metadata.prompt != null &&
                metadata.prompt.length > 0 && { prompt: metadata.prompt }),
              ...(metadata.aspectRatio != null &&
                metadata.aspectRatio.length > 0 && {
                  aspectRatio: metadata.aspectRatio,
                }),
              ...(metadata.quality != null &&
                metadata.quality.length > 0 && { quality: metadata.quality }),
            },
            extension,
          );

    const outputPath = join(outputDir, filename);

    // Handle file conflicts
    const finalPath = await this.resolveFileConflict(outputPath, {
      strategy: "auto_rename",
    });

    // Download the image
    const downloadResult = await this.downloadImage({
      url,
      outputPath: finalPath,
    });

    return {
      url,
      local_path: finalPath,
      filename: basename(finalPath),
      directory: dirname(finalPath),
      size_bytes: downloadResult.size,
      format: downloadResult.format,
      saved_at: new Date().toISOString(),
    };
  }

  async cleanupOldFiles(directory: string): Promise<void> {
    if (!existsSync(directory)) {
      return;
    }

    const cutoffDate = new Date(
      Date.now() - this.options.autoCleanupDays * 24 * 60 * 60 * 1000,
    );

    try {
      const files = readdirSync(directory);

      for (const file of files) {
        const filePath = join(directory, file);
        const stats = statSync(filePath);

        if (stats.isFile() && stats.mtime < cutoffDate) {
          unlinkSync(filePath);
        }
      }
    } catch (error) {
      // Log error but don't throw to avoid breaking the main flow
      // eslint-disable-next-line no-console
      console.warn(`Failed to cleanup old files in ${directory}:`, error);
    }
  }

  private async resolveFileConflict(
    filePath: string,
    resolution: FileConflictResolution,
  ): Promise<string> {
    if (!existsSync(filePath)) {
      return filePath;
    }

    switch (resolution.strategy) {
      case "overwrite":
        return filePath;

      case "skip":
        throw new FileError("File already exists", "FILE_EXISTS", filePath);

      case "auto_rename":
      default: {
        const ext = extname(filePath);
        const baseName = basename(filePath, ext);
        const dir = dirname(filePath);

        let counter = 1;
        let newPath: string;

        do {
          newPath = join(
            dir,
            `${baseName}_${counter.toString().padStart(3, "0")}_${Date.now()}${ext}`,
          );
          counter++;
        } while (existsSync(newPath));

        return newPath;
      }
    }
  }

  private resolveCustomFilename(
    filename: string,
    _directory: string,
    extension = ".png",
  ): string {
    const sanitized = this.sanitizeFilename(filename);
    const ext = extname(sanitized) || extension;
    const base = basename(sanitized, ext);

    return `${base}${ext.startsWith(".") ? ext : `.${ext}`}`;
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^\s\w-]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase()
      .slice(0, 100);
  }

  private generateHash(input: string): string {
    return createHash("sha256").update(input).digest("hex");
  }

  private getNextCounter(prefix: string): number {
    const current = this.customFileCounter.get(prefix) ?? 0;
    const next = current + 1;
    this.customFileCounter.set(prefix, next);

    return next;
  }

  private getImageFormat(contentType: string, filePath: string): string {
    if (contentType.includes("png")) return "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg"))
      return "jpg";
    if (contentType.includes("gif")) return "gif";
    if (contentType.includes("webp")) return "webp";

    // Fallback to file extension
    const ext = extname(filePath).slice(1).toLowerCase();

    return ext || "png";
  }

  private handleDownloadError(
    error: unknown,
    url: string,
    attempt: number,
    maxAttempts: number,
  ): Error {
    // Pass through custom errors as-is
    if (error instanceof DiskSpaceError || error instanceof FileError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return new DownloadError("Download timeout", url, undefined, {
          attempt,
          maxAttempts,
        });
      }

      return new DownloadError(
        `Network error: ${error.message}`,
        url,
        undefined,
        { attempt, maxAttempts },
      );
    }

    return new DownloadError("Unknown download error", url, undefined, {
      attempt,
      maxAttempts,
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
