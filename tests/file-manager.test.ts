import {
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  utimesSync,
  createWriteStream,
  statSync,
  readdirSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { FileError, DownloadError, DiskSpaceError } from "../src/types/file.js";
import { FileManager } from "../src/utils/file-manager.js";

import type {
  FileOutputOptions,
  FileNameGenerationOptions,
  DirectoryOptions,
} from "../src/types/file.js";
import type { WriteStream } from "node:fs";

// Mock modules
vi.mock("node:fs", async () => {
  const actual = await vi.importActual("node:fs");

  return {
    ...actual,
    createWriteStream: vi.fn(),
    statSync: vi.fn(),
    readdirSync: vi.fn(),
    unlinkSync: vi.fn(),
  };
});

vi.mock("node:stream/promises", () => ({
  pipeline: vi.fn(),
}));

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("FileManager", () => {
  let fileManager: FileManager;
  let testDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    testDir = join(tmpdir(), `test-file-manager-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    fileManager = new FileManager({
      defaultOutputDir: testDir,
      maxFileSizeBytes: 50 * 1024 * 1024, // 50MB
      enableFileOutput: true,
      autoCleanupDays: 30,
    });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  describe("downloadImage", () => {
    it.skip("should download image successfully", async () => {
      const mockImageData = Buffer.from("fake image data");
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(mockImageData);
          controller.close();
        },
      });

      const mockHeaders = new Map([
        ["content-type", "image/png"],
        ["content-length", "15"],
      ]);

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: {
          get: vi.fn((name: string) => {
            return mockHeaders.get(name.toLowerCase()) ?? null;
          }),
        },
        body: mockReadableStream,
      };

      mockFetch.mockResolvedValue(mockResponse);

      const mockWriter = {
        on: vi.fn(),
        destroy: vi.fn(),
      };

      vi.mocked(createWriteStream).mockReturnValue(
        mockWriter as unknown as WriteStream,
      );
      mockWriter.on.mockImplementation((event, callback) => {
        if (event === "finish") {
          callback();
        }
      });

      // Mock pipeline to simulate successful write
      const mockPipeline = vi
        .fn()
        .mockImplementation(async (source, destination, transform) => {
          // Simulate the actual pipeline operation with the transform
          const reader = source.getReader();
          let totalBytes = 0;

          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done === true) break;

            // Process through the transform (the async generator)
            const generator = transform(source);
            const { value: chunk } = await generator.next();
            if (chunk != null) {
              totalBytes += chunk.length;
            }
          }

          // Simulate successful pipeline operation
          const finishCall = mockWriter.on.mock.calls.find(
            (call) => call[0] === "finish",
          );
          if (finishCall) {
            const finishCallback = finishCall[1];
            setTimeout(finishCallback, 0);
          }

          return Promise.resolve();
        });

      vi.mocked(pipeline).mockImplementation(mockPipeline);

      const result = await fileManager.downloadImage({
        url: "https://example.com/image.png",
        outputPath: join(testDir, "test-image.png"),
      });

      expect(result).toEqual({
        path: join(testDir, "test-image.png"),
        size: 0, // Mock doesn't simulate actual byte transfer
        format: "png",
        downloadTime: expect.any(Number),
      });
    });

    it("should throw DownloadError on HTTP error", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: {
          get: vi.fn(() => null),
        },
      };

      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        fileManager.downloadImage({
          url: "https://example.com/nonexistent.png",
          outputPath: join(testDir, "test-image.png"),
        }),
      ).rejects.toThrow(DownloadError);
    }, 10000);

    it("should retry on network error", async () => {
      const mockImageData = Buffer.from("fake image data");
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(mockImageData);
          controller.close();
        },
      });

      const mockHeaders = new Map([
        ["content-type", "image/png"],
        ["content-length", "15"],
      ]);

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: {
          get: vi.fn((name: string) => {
            return mockHeaders.get(name.toLowerCase()) ?? null;
          }),
        },
        body: mockReadableStream,
      };

      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(mockResponse);

      const mockWriter = {
        on: vi.fn(),
        destroy: vi.fn(),
      };

      vi.mocked(createWriteStream).mockReturnValue(
        mockWriter as unknown as WriteStream,
      );
      mockWriter.on.mockImplementation((event, callback) => {
        if (event === "finish") {
          callback();
        }
      });

      // Mock pipeline
      vi.mocked(pipeline).mockResolvedValue(undefined);

      const result = await fileManager.downloadImage({
        url: "https://example.com/image.png",
        outputPath: join(testDir, "test-image.png"),
        retryCount: 3,
        retryDelay: 100,
      });

      expect(result.path).toBe(join(testDir, "test-image.png"));
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should handle timeout", async () => {
      const mockAbortController = {
        abort: vi.fn(),
        signal: {
          aborted: false,
          onabort: null,
          reason: undefined,
          throwIfAborted: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        },
      };
      vi.spyOn(global, "AbortController").mockImplementation(
        () => mockAbortController satisfies AbortController,
      );

      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      mockFetch.mockRejectedValue(abortError);

      vi.spyOn(global, "setTimeout").mockImplementation((callback) => {
        if (typeof callback === "function") {
          callback();
        }

        return 1 as unknown as ReturnType<typeof setTimeout>;
      });

      await expect(
        fileManager.downloadImage({
          url: "https://example.com/image.png",
          outputPath: join(testDir, "test-image.png"),
          timeout: 100,
        }),
      ).rejects.toThrow();
    });
  });

  describe("generateFileName", () => {
    it("should generate timestamp-based filename", () => {
      const options: FileNameGenerationOptions = {
        strategy: "timestamp",
        prompt: "A beautiful sunset",
      };

      const filename = fileManager.generateFileName(options, ".png");

      expect(filename).toMatch(/^image_\d{8}_\d{6}_[\da-f]{6}\.png$/);
    });

    it("should generate prompt-based filename", () => {
      const options: FileNameGenerationOptions = {
        strategy: "prompt",
        prompt: "A beautiful sunset landscape",
        maxLength: 50,
      };

      const filename = fileManager.generateFileName(options, ".png");

      expect(filename).toMatch(
        /^a_beautiful_sunset_landscape_\d{8}_\d{6}\.png$/,
      );
    });

    it("should generate custom filename", () => {
      const options: FileNameGenerationOptions = {
        strategy: "custom",
        customPrefix: "my_image",
      };

      const filename = fileManager.generateFileName(options, ".png");

      expect(filename).toMatch(/^my_image_\d{3}\.png$/);
    });

    it("should generate hash-based filename", () => {
      const options: FileNameGenerationOptions = {
        strategy: "hash",
        prompt: "A beautiful sunset",
      };

      const filename = fileManager.generateFileName(options, ".png");

      expect(filename).toMatch(/^[\da-f]{8}\.png$/);
    });

    it("should sanitize filename to prevent path traversal", () => {
      const options: FileNameGenerationOptions = {
        strategy: "prompt",
        prompt: "../../../etc/passwd",
      };

      const filename = fileManager.generateFileName(options, ".png");

      expect(filename).not.toContain("../");
      expect(filename).not.toContain("/");
    });

    it("should handle long prompts by truncating", () => {
      const options: FileNameGenerationOptions = {
        strategy: "prompt",
        prompt:
          "This is a very long prompt that should be truncated to fit within the maximum length limit",
        maxLength: 30,
      };

      const filename = fileManager.generateFileName(options, ".png");

      expect(filename.length).toBeLessThanOrEqual(50); // Including timestamp and extension
    });

    it("should support jpeg extension", () => {
      const options: FileNameGenerationOptions = { strategy: "timestamp" };

      const filename = fileManager.generateFileName(options, ".jpeg");

      expect(filename.endsWith(".jpeg")).toBe(true);
    });

    it("should support webp extension", () => {
      const options: FileNameGenerationOptions = { strategy: "hash", prompt: "sample" };

      const filename = fileManager.generateFileName(options, ".webp");

      expect(filename.endsWith(".webp")).toBe(true);
    });
  });

  describe("ensureDirectory", () => {
    it("should create directory if it doesn't exist", async () => {
      const dirPath = join(testDir, "new-directory");

      await fileManager.ensureDirectory(dirPath);

      expect(existsSync(dirPath)).toBe(true);
    });

    it("should not throw if directory already exists", async () => {
      const dirPath = join(testDir, "existing-directory");
      mkdirSync(dirPath);

      await expect(fileManager.ensureDirectory(dirPath)).resolves.not.toThrow();
    });

    it("should create nested directories", async () => {
      const dirPath = join(testDir, "nested", "directory", "structure");

      await fileManager.ensureDirectory(dirPath);

      expect(existsSync(dirPath)).toBe(true);
    });
  });

  describe("getOrganizedDirectory", () => {
    it("should return base directory for 'none' organization", () => {
      const options: DirectoryOptions = {
        baseDir: testDir,
        organizeBy: "none",
      };

      const result = fileManager.getOrganizedDirectory(options);

      expect(result).toBe(testDir);
    });

    it("should organize by date", () => {
      const testDate = new Date("2025-07-15T10:30:00Z");
      const options: DirectoryOptions = {
        baseDir: testDir,
        organizeBy: "date",
        date: testDate,
      };

      const result = fileManager.getOrganizedDirectory(options);

      expect(result).toBe(join(testDir, "2025-07-15"));
    });

    it("should organize by aspect ratio", () => {
      const options: DirectoryOptions = {
        baseDir: testDir,
        organizeBy: "aspect_ratio",
        aspectRatio: "landscape",
      };

      const result = fileManager.getOrganizedDirectory(options);

      expect(result).toBe(join(testDir, "landscape"));
    });

    it("should organize by quality", () => {
      const options: DirectoryOptions = {
        baseDir: testDir,
        organizeBy: "quality",
        quality: "high",
      };

      const result = fileManager.getOrganizedDirectory(options);

      expect(result).toBe(join(testDir, "high"));
    });
  });

  describe("saveImage", () => {
    it("should save image with all options", async () => {
      const mockImageData = Buffer.from("fake image data");
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(mockImageData);
          controller.close();
        },
      });

      const mockHeaders = new Map([
        ["content-type", "image/png"],
        ["content-length", "15"],
      ]);

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: {
          get: vi.fn((name: string) => {
            return mockHeaders.get(name.toLowerCase()) ?? null;
          }),
        },
        body: mockReadableStream,
      };

      mockFetch.mockResolvedValue(mockResponse);

      const mockWriter = {
        on: vi.fn(),
        destroy: vi.fn(),
      };

      vi.mocked(createWriteStream).mockReturnValue(
        mockWriter as unknown as WriteStream,
      );
      mockWriter.on.mockImplementation((event, callback) => {
        if (event === "finish") {
          callback();
        }
      });

      // Mock pipeline
      vi.mocked(pipeline).mockResolvedValue(undefined);

      const options: FileOutputOptions = {
        save_to_file: true,
        output_directory: testDir,
        filename: "custom-name",
        naming_strategy: "custom",
        organize_by: "none",
      };

      const result = await fileManager.saveImage(
        "https://example.com/image.png",
        options,
        {
          prompt: "Test prompt",
          aspectRatio: "square",
          quality: "medium",
          format: "png",
        },
      );

      expect(result).toBeDefined();
      expect(result!.filename).toBe("custom-name.png");
      expect(result!.directory).toBe(testDir);
      expect(result!.size_bytes).toBe(0); // Mock doesn't simulate actual byte transfer
      expect(result!.format).toBe("png");
    });

    it("should skip saving if save_to_file is false", async () => {
      const options: FileOutputOptions = {
        save_to_file: false,
        naming_strategy: "timestamp",
        organize_by: "none",
      };

      const result = await fileManager.saveImage(
        "https://example.com/image.png",
        options,
        { prompt: "Test prompt", format: "png" },
      );

      expect(result).toBeNull();
    });

    it("should handle file conflicts by auto-renaming", async () => {
      const mockImageData = Buffer.from("fake image data");
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(mockImageData);
          controller.close();
        },
      });

      const mockHeaders = new Map([
        ["content-type", "image/png"],
        ["content-length", "15"],
      ]);

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: {
          get: vi.fn((name: string) => {
            return mockHeaders.get(name.toLowerCase()) ?? null;
          }),
        },
        body: mockReadableStream,
      };

      mockFetch.mockResolvedValue(mockResponse);

      const mockWriter = {
        on: vi.fn(),
        destroy: vi.fn(),
      };

      vi.mocked(createWriteStream).mockReturnValue(
        mockWriter as unknown as WriteStream,
      );
      mockWriter.on.mockImplementation((event, callback) => {
        if (event === "finish") {
          callback();
        }
      });

      // Mock pipeline
      vi.mocked(pipeline).mockResolvedValue(undefined);

      // Create a file that will conflict
      const conflictingFile = join(testDir, "existing-file.png");
      writeFileSync(conflictingFile, "existing content");

      const options: FileOutputOptions = {
        save_to_file: true,
        output_directory: testDir,
        filename: "existing-file",
        naming_strategy: "custom",
        organize_by: "none",
      };

      const result = await fileManager.saveImage(
        "https://example.com/image.png",
        options,
        { prompt: "Test prompt" },
      );

      expect(result).toBeDefined();
      expect(result!.filename).toMatch(/^existing-file_\d{3}_\d+\.png$/);
      expect(result!.local_path).not.toBe(conflictingFile);
    });

    it("should save image with webp format", async () => {
      const mockImageData = Buffer.from("fake webp data");
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(mockImageData);
          controller.close();
        },
      });

      const mockHeaders = new Map([
        ["content-type", "image/webp"],
        ["content-length", "15"],
      ]);

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: {
          get: vi.fn((name: string) => {
            return mockHeaders.get(name.toLowerCase()) ?? null;
          }),
        },
        body: mockReadableStream,
      };

      mockFetch.mockResolvedValue(mockResponse);

      const mockWriter = {
        on: vi.fn(),
        destroy: vi.fn(),
      };

      vi.mocked(createWriteStream).mockReturnValue(
        mockWriter as unknown as WriteStream,
      );
      mockWriter.on.mockImplementation((event, callback) => {
        if (event === "finish") {
          callback();
        }
      });

      vi.mocked(pipeline).mockResolvedValue(undefined);

      const options: FileOutputOptions = {
        save_to_file: true,
        output_directory: testDir,
        filename: "image", // should add extension automatically
        naming_strategy: "custom",
        organize_by: "none",
      };

      const result = await fileManager.saveImage(
        "https://example.com/image.webp",
        options,
        { prompt: "Test", format: "webp" },
      );

      expect(result).toBeDefined();
      expect(result!.filename.endsWith(".webp")).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should throw FileError for invalid path", async () => {
      await expect(fileManager.ensureDirectory("")).rejects.toThrow(FileError);
    });

    it("should throw DiskSpaceError when disk space is insufficient", async () => {
      const fileManagerWithLowLimit = new FileManager({
        defaultOutputDir: testDir,
        maxFileSizeBytes: 10 * 1024 * 1024, // 10MB limit
      });

      const mockHeaders = new Map([
        ["content-type", "image/png"],
        ["content-length", "104857600"], // 100MB
      ]);

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: {
          get: vi.fn((name: string) => {
            return mockHeaders.get(name.toLowerCase()) ?? null;
          }),
        },
        body: null,
      };

      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        fileManagerWithLowLimit.downloadImage({
          url: "https://example.com/large-image.png",
          outputPath: join(testDir, "large-image.png"),
        }),
      ).rejects.toThrow(DiskSpaceError);
    }, 10000);
  });

  describe("cleanup", () => {
    it.skip("should clean up old files", async () => {
      // Create a real old file
      const oldFile = join(testDir, "old-file.png");
      writeFileSync(oldFile, "old content");

      // Change the mtime to make it appear old (using native fs)
      const oldTime = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days old
      utimesSync(oldFile, oldTime, oldTime);

      // Verify the file exists before cleanup
      expect(existsSync(oldFile)).toBe(true);

      await fileManager.cleanupOldFiles(testDir);

      // Verify the old file was deleted (just check that it no longer exists)
      expect(existsSync(oldFile)).toBe(false);
    });

    it("should preserve recent files during cleanup", async () => {
      const recentFile = join(testDir, "recent-file.png");
      writeFileSync(recentFile, "recent content");

      // Mock file stats to make it appear recent
      const mockStatSync = vi.mocked(statSync);
      const mockReaddirSync = vi.mocked(readdirSync);
      const mockUnlinkSync = vi.mocked(unlinkSync);

      // @ts-ignore
      mockReaddirSync.mockReturnValue(["recent-file.png"]);
      // @ts-ignore
      mockStatSync.mockReturnValue({
        mtime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        isFile: () => true,
        isDirectory: () => false,
      });
      mockUnlinkSync.mockImplementation(() => {});

      await fileManager.cleanupOldFiles(testDir);

      expect(mockUnlinkSync).not.toHaveBeenCalled();
    });
  });
});
