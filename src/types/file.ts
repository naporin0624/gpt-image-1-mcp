import { z } from "zod";

export const NamingStrategySchema = z.enum([
  "timestamp",
  "prompt",
  "custom",
  "hash",
]);

export const OrganizeBySchema = z.enum([
  "none",
  "date",
  "aspect_ratio",
  "quality",
]);

export const FileOutputOptionsSchema = z.object({
  save_to_file: z.boolean().default(true),
  output_directory: z.string().optional(),
  filename: z.string().optional(),
  naming_strategy: NamingStrategySchema.default("timestamp"),
  organize_by: OrganizeBySchema.default("none"),
});

export const SaveImageResultSchema = z.object({
  url: z.string().url(),
  local_path: z.string(),
  filename: z.string(),
  directory: z.string(),
  size_bytes: z.number(),
  format: z.string(),
  saved_at: z.string().datetime(),
});

export type NamingStrategy = z.infer<typeof NamingStrategySchema>;
export type OrganizeBy = z.infer<typeof OrganizeBySchema>;
export type FileOutputOptions = z.infer<typeof FileOutputOptionsSchema>;
export type SaveImageResult = z.infer<typeof SaveImageResultSchema>;

export interface FileManagerOptions {
  defaultOutputDir?: string;
  maxFileSizeBytes?: number;
  enableFileOutput?: boolean;
  autoCleanupDays?: number;
}

export interface DownloadOptions {
  url: string;
  outputPath: string;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface FileNameGenerationOptions {
  prompt?: string;
  aspectRatio?: string;
  quality?: string;
  strategy: NamingStrategy;
  customPrefix?: string;
  maxLength?: number;
}

export interface DirectoryOptions {
  baseDir: string;
  organizeBy: OrganizeBy;
  aspectRatio?: string;
  quality?: string;
  date?: Date;
}

export interface FileConflictResolution {
  strategy: "auto_rename" | "overwrite" | "skip";
  suffix?: string;
}

export class FileError extends Error {
  constructor(
    message: string,
    public code: string,
    public path?: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "FileError";
  }
}

export class DownloadError extends FileError {
  constructor(
    message: string,
    public url: string,
    public statusCode?: number,
    details?: Record<string, unknown>,
  ) {
    super(message, "DOWNLOAD_ERROR", undefined, details);
    this.name = "DownloadError";
  }
}

export class DiskSpaceError extends FileError {
  constructor(
    message: string,
    public requiredBytes: number,
    public availableBytes: number,
    path?: string,
  ) {
    super(message, "DISK_SPACE_ERROR", path, { requiredBytes, availableBytes });
    this.name = "DiskSpaceError";
  }
}
