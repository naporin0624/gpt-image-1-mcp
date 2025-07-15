import { promises as fs } from "node:fs";
import { resolve, normalize } from "node:path";

import type { ImageInput } from "../types/edit.js";

/**
 * Maximum file size in bytes (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Allowed image file extensions
 */
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

/**
 * Load image data as buffer from different input types
 */
export async function loadImageAsBuffer(
  input: ImageInput,
): Promise<ArrayBuffer> {
  switch (input.type) {
    case "url":
      return await downloadImageFromUrl(input.value);
    case "base64":
      return convertBase64ToBuffer(input.value);
    case "local":
      return await loadLocalFileAsBuffer(input.value);
    default:
      throw new Error(
        `Unsupported image input type: ${(input as { type: string }).type}`,
      );
  }
}

/**
 * Convert buffer to base64 data URL
 */
export function convertBufferToBase64DataUrl(
  buffer: ArrayBuffer,
  mimeType: string,
): string {
  const base64 = Buffer.from(buffer).toString("base64");

  return `data:${mimeType};base64,${base64}`;
}

/**
 * Load local file as buffer with security validation
 */
async function loadLocalFileAsBuffer(filePath: string): Promise<ArrayBuffer> {
  // Normalize and resolve path to prevent directory traversal
  const normalizedPath = normalize(filePath);
  const resolvedPath = resolve(normalizedPath);

  // Security check: prevent directory traversal
  if (normalizedPath.includes("..")) {
    throw new Error("Invalid file path: directory traversal not allowed");
  }

  // Check file extension
  const ext = getFileExtension(resolvedPath);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported file extension: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
    );
  }

  try {
    // Check if file exists and get stats
    const stats = await fs.stat(resolvedPath);

    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${resolvedPath}`);
    }

    // Check file size
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error(
        `File too large: ${stats.size} bytes (max: ${MAX_FILE_SIZE} bytes)`,
      );
    }

    // Read file
    const buffer = await fs.readFile(resolvedPath);

    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load local file: ${error.message}`);
    }
    throw new Error(`Failed to load local file: ${String(error)}`);
  }
}

/**
 * Download image from URL
 */
async function downloadImageFromUrl(url: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (
      contentType == null ||
      contentType.length === 0 ||
      !contentType.startsWith("image/")
    ) {
      throw new Error(
        `Invalid content type: ${contentType ?? "null"}. Expected image/*`,
      );
    }

    const buffer = await response.arrayBuffer();

    // Check file size
    if (buffer.byteLength > MAX_FILE_SIZE) {
      throw new Error(
        `Image too large: ${buffer.byteLength} bytes (max: ${MAX_FILE_SIZE} bytes)`,
      );
    }

    return buffer;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to download image from URL: ${error.message}`);
    }
    throw new Error(`Failed to download image from URL: ${String(error)}`);
  }
}

/**
 * Convert base64 string to buffer
 */
function convertBase64ToBuffer(base64: string): ArrayBuffer {
  try {
    // Handle data URL format
    let base64Data = base64;
    if (base64.startsWith("data:")) {
      const commaIndex = base64.indexOf(",");
      if (commaIndex === -1) {
        throw new Error("Invalid base64 data URL format");
      }
      base64Data = base64.substring(commaIndex + 1);
    }

    // Validate base64 format
    if (!/^[\d+/A-Za-z]*={0,2}$/.test(base64Data)) {
      throw new Error("Invalid base64 format");
    }

    const buffer = Buffer.from(base64Data, "base64");

    // Check file size
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(
        `Base64 data too large: ${buffer.length} bytes (max: ${MAX_FILE_SIZE} bytes)`,
      );
    }

    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to convert base64 to buffer: ${error.message}`);
    }
    throw new Error(`Failed to convert base64 to buffer: ${String(error)}`);
  }
}

/**
 * Get file extension from path
 */
function getFileExtension(filePath: string): string {
  const lastDotIndex = filePath.lastIndexOf(".");

  return lastDotIndex === -1
    ? ""
    : filePath.substring(lastDotIndex).toLowerCase();
}

/**
 * Normalize image input from string to ImageInput type for backward compatibility
 */
export function normalizeImageInput(input: string | ImageInput): ImageInput {
  if (typeof input === "object") {
    return input; // Already in the new format
  }

  // Auto-detect type from string
  if (input.startsWith("data:")) {
    return { type: "base64", value: input };
  }

  if (input.startsWith("http://") || input.startsWith("https://")) {
    return { type: "url", value: input };
  }

  // Default to local file
  return { type: "local", value: input };
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(filePath: string): string {
  const ext = getFileExtension(filePath);

  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

/**
 * Get MIME type from buffer by checking magic bytes
 */
export function getMimeTypeFromBuffer(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer);

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    view.length >= 8 &&
    view[0] === 0x89 &&
    view[1] === 0x50 &&
    view[2] === 0x4e &&
    view[3] === 0x47 &&
    view[4] === 0x0d &&
    view[5] === 0x0a &&
    view[6] === 0x1a &&
    view[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (
    view.length >= 3 &&
    view[0] === 0xff &&
    view[1] === 0xd8 &&
    view[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // WebP: "RIFF" ... "WEBP"
  if (
    view.length >= 12 &&
    view[0] === 0x52 &&
    view[1] === 0x49 &&
    view[2] === 0x46 &&
    view[3] === 0x46 &&
    view[8] === 0x57 &&
    view[9] === 0x45 &&
    view[10] === 0x42 &&
    view[11] === 0x50
  ) {
    return "image/webp";
  }

  // GIF: "GIF87a" or "GIF89a"
  if (
    view.length >= 6 &&
    view[0] === 0x47 &&
    view[1] === 0x49 &&
    view[2] === 0x46 &&
    view[3] === 0x38 &&
    (view[4] === 0x37 || view[4] === 0x38) &&
    view[5] === 0x61
  ) {
    return "image/gif";
  }

  return "application/octet-stream";
}
