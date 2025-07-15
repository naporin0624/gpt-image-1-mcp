import { promises as fs } from "node:fs";

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

import {
  loadImageAsBuffer,
  convertBufferToBase64DataUrl,
  normalizeImageInput,
  getMimeTypeFromExtension,
  getMimeTypeFromBuffer,
} from "../src/utils/image-input.js";

import type { ImageInput } from "../src/types/edit.js";
import type { Stats } from "node:fs";

// Mock fs module
vi.mock("fs", () => ({
  promises: {
    stat: vi.fn(),
    readFile: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("image-input utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("normalizeImageInput", () => {
    test("should return ImageInput object unchanged", () => {
      const input: ImageInput = {
        type: "url",
        value: "https://example.com/image.png",
      };
      const result = normalizeImageInput(input);
      expect(result).toEqual(input);
    });

    test("should detect base64 data URL", () => {
      const input =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
      const result = normalizeImageInput(input);
      expect(result).toEqual({ type: "base64", value: input });
    });

    test("should detect HTTP URL", () => {
      const input = "http://example.com/image.png";
      const result = normalizeImageInput(input);
      expect(result).toEqual({ type: "url", value: input });
    });

    test("should detect HTTPS URL", () => {
      const input = "https://example.com/image.png";
      const result = normalizeImageInput(input);
      expect(result).toEqual({ type: "url", value: input });
    });

    test("should default to local file path", () => {
      const input = "./images/test.png";
      const result = normalizeImageInput(input);
      expect(result).toEqual({ type: "local", value: input });
    });

    test("should handle absolute paths as local", () => {
      const input = "/home/user/images/test.png";
      const result = normalizeImageInput(input);
      expect(result).toEqual({ type: "local", value: input });
    });
  });

  describe("loadImageAsBuffer - URL input", () => {
    test("should successfully download image from URL", async () => {
      const mockBuffer = new ArrayBuffer(1024);
      const mockResponse = {
        ok: true,
        headers: new Map([["content-type", "image/png"]]),
        arrayBuffer: () => Promise.resolve(mockBuffer),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const input: ImageInput = {
        type: "url",
        value: "https://example.com/image.png",
      };
      const result = await loadImageAsBuffer(input);

      expect(result).toBe(mockBuffer);
      expect(mockFetch).toHaveBeenCalledWith("https://example.com/image.png");
    });

    test("should throw error for HTTP error response", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const input: ImageInput = {
        type: "url",
        value: "https://example.com/nonexistent.png",
      };

      await expect(loadImageAsBuffer(input)).rejects.toThrow(
        "Failed to download image from URL: HTTP 404: Not Found",
      );
    });

    test("should throw error for non-image content type", async () => {
      const mockResponse = {
        ok: true,
        headers: new Map([["content-type", "text/html"]]),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const input: ImageInput = {
        type: "url",
        value: "https://example.com/not-image.html",
      };

      await expect(loadImageAsBuffer(input)).rejects.toThrow(
        "Failed to download image from URL: Invalid content type: text/html. Expected image/*",
      );
    });

    test("should throw error for oversized image", async () => {
      const largeBuffer = new ArrayBuffer(11 * 1024 * 1024); // 11MB
      const mockResponse = {
        ok: true,
        headers: new Map([["content-type", "image/png"]]),
        arrayBuffer: () => Promise.resolve(largeBuffer),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const input: ImageInput = {
        type: "url",
        value: "https://example.com/large.png",
      };

      await expect(loadImageAsBuffer(input)).rejects.toThrow(
        "Failed to download image from URL: Image too large:",
      );
    });
  });

  describe("loadImageAsBuffer - base64 input", () => {
    test("should successfully convert base64 to buffer", async () => {
      const base64Data =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
      const input: ImageInput = { type: "base64", value: base64Data };

      const result = await loadImageAsBuffer(input);

      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBeGreaterThan(0);
    });

    test("should handle base64 data URL format", async () => {
      const dataUrl =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
      const input: ImageInput = { type: "base64", value: dataUrl };

      const result = await loadImageAsBuffer(input);

      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBeGreaterThan(0);
    });

    test("should throw error for invalid base64 format", async () => {
      const input: ImageInput = { type: "base64", value: "invalid-base64!" };

      await expect(loadImageAsBuffer(input)).rejects.toThrow(
        "Failed to convert base64 to buffer: Invalid base64 format",
      );
    });

    test("should throw error for invalid data URL format", async () => {
      const input: ImageInput = {
        type: "base64",
        value: "data:image/png;base64invalid",
      };

      await expect(loadImageAsBuffer(input)).rejects.toThrow(
        "Failed to convert base64 to buffer: Invalid base64 data URL format",
      );
    });

    test("should throw error for oversized base64 data", async () => {
      // Create a large base64 string (over 10MB when decoded)
      const largeBase64 = "A".repeat(14 * 1024 * 1024); // This will be ~10.5MB when base64 decoded
      const input: ImageInput = { type: "base64", value: largeBase64 };

      await expect(loadImageAsBuffer(input)).rejects.toThrow(
        "Failed to convert base64 to buffer: Base64 data too large:",
      );
    });
  });

  describe("loadImageAsBuffer - local file input", () => {
    test("should successfully load local file", async () => {
      const mockBuffer = Buffer.from("fake image data");
      const mockStats = {
        isFile: () => true,
        size: 1024,
      };

      vi.mocked(fs.stat).mockResolvedValueOnce(mockStats as Stats);
      vi.mocked(fs.readFile).mockResolvedValueOnce(mockBuffer);

      const input: ImageInput = { type: "local", value: "./test.png" };
      const result = await loadImageAsBuffer(input);

      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(fs.stat).toHaveBeenCalled();
      expect(fs.readFile).toHaveBeenCalled();
    });

    test("should throw error for directory traversal attempt", async () => {
      const input: ImageInput = { type: "local", value: "../../../etc/passwd" };

      await expect(loadImageAsBuffer(input)).rejects.toThrow(
        "Invalid file path: directory traversal not allowed",
      );
    });

    test("should throw error for unsupported file extension", async () => {
      const input: ImageInput = { type: "local", value: "./test.txt" };

      await expect(loadImageAsBuffer(input)).rejects.toThrow(
        "Unsupported file extension: .txt",
      );
    });

    test("should throw error for non-existent file", async () => {
      vi.mocked(fs.stat).mockRejectedValueOnce(
        new Error("ENOENT: no such file or directory"),
      );

      const input: ImageInput = { type: "local", value: "./nonexistent.png" };

      await expect(loadImageAsBuffer(input)).rejects.toThrow(
        "Failed to load local file: ENOENT: no such file or directory",
      );
    });

    test("should throw error for directory instead of file", async () => {
      const mockStats = {
        isFile: () => false,
        size: 0,
      };

      vi.mocked(fs.stat).mockResolvedValueOnce(mockStats as Stats);

      const input: ImageInput = { type: "local", value: "./images.png" };

      await expect(loadImageAsBuffer(input)).rejects.toThrow(
        "Failed to load local file: Path is not a file:",
      );
    });

    test("should throw error for oversized file", async () => {
      const mockStats = {
        isFile: () => true,
        size: 11 * 1024 * 1024, // 11MB
      };

      vi.mocked(fs.stat).mockResolvedValueOnce(mockStats as Stats);

      const input: ImageInput = { type: "local", value: "./large.png" };

      await expect(loadImageAsBuffer(input)).rejects.toThrow(
        "Failed to load local file: File too large:",
      );
    });

    test("should accept various supported file extensions", async () => {
      const mockBuffer = Buffer.from("fake image data");
      const mockStats = {
        isFile: () => true,
        size: 1024,
      };

      // Reset mocks for each iteration
      vi.clearAllMocks();
      vi.mocked(fs.stat).mockResolvedValue(mockStats as Stats);
      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

      const supportedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

      for (const ext of supportedExtensions) {
        const input: ImageInput = { type: "local", value: `./test${ext}` };
        await expect(loadImageAsBuffer(input)).resolves.toBeInstanceOf(
          ArrayBuffer,
        );
      }
    });
  });

  describe("convertBufferToBase64DataUrl", () => {
    test("should convert buffer to base64 data URL", () => {
      const buffer = Buffer.from("test data").buffer;
      const result = convertBufferToBase64DataUrl(buffer, "image/png");

      expect(result).toMatch(/^data:image\/png;base64,/);
      expect(result).toContain("dGVzdCBkYXRh");
    });

    test("should handle different MIME types", () => {
      const buffer = Buffer.from("test").buffer;

      const pngResult = convertBufferToBase64DataUrl(buffer, "image/png");
      expect(pngResult).toContain("data:image/png;base64,");

      const jpegResult = convertBufferToBase64DataUrl(buffer, "image/jpeg");
      expect(jpegResult).toContain("data:image/jpeg;base64,");
    });
  });

  describe("getMimeTypeFromExtension", () => {
    test("should return correct MIME types for supported extensions", () => {
      expect(getMimeTypeFromExtension("test.png")).toBe("image/png");
      expect(getMimeTypeFromExtension("test.jpg")).toBe("image/jpeg");
      expect(getMimeTypeFromExtension("test.jpeg")).toBe("image/jpeg");
      expect(getMimeTypeFromExtension("test.webp")).toBe("image/webp");
      expect(getMimeTypeFromExtension("test.gif")).toBe("image/gif");
    });

    test("should handle uppercase extensions", () => {
      expect(getMimeTypeFromExtension("test.PNG")).toBe("image/png");
      expect(getMimeTypeFromExtension("test.JPG")).toBe("image/jpeg");
    });

    test("should return default MIME type for unsupported extensions", () => {
      expect(getMimeTypeFromExtension("test.txt")).toBe(
        "application/octet-stream",
      );
      expect(getMimeTypeFromExtension("test.unknown")).toBe(
        "application/octet-stream",
      );
    });

    test("should handle files without extensions", () => {
      expect(getMimeTypeFromExtension("test")).toBe("application/octet-stream");
    });
  });

  describe("getMimeTypeFromBuffer", () => {
    test("should detect PNG format from magic bytes", () => {
      const pngMagic = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const buffer = pngMagic.buffer;

      expect(getMimeTypeFromBuffer(buffer)).toBe("image/png");
    });

    test("should detect JPEG format from magic bytes", () => {
      const jpegMagic = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const buffer = jpegMagic.buffer;

      expect(getMimeTypeFromBuffer(buffer)).toBe("image/jpeg");
    });

    test("should detect WebP format from magic bytes", () => {
      const webpMagic = new Uint8Array([
        0x52,
        0x49,
        0x46,
        0x46, // "RIFF"
        0x00,
        0x00,
        0x00,
        0x00, // file size (placeholder)
        0x57,
        0x45,
        0x42,
        0x50, // "WEBP"
      ]);
      const buffer = webpMagic.buffer;

      expect(getMimeTypeFromBuffer(buffer)).toBe("image/webp");
    });

    test("should detect GIF format from magic bytes", () => {
      const gif87Magic = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]); // "GIF87a"
      const gif89Magic = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x38, 0x61]); // "GIF89a"

      expect(getMimeTypeFromBuffer(gif87Magic.buffer)).toBe("image/gif");
      expect(getMimeTypeFromBuffer(gif89Magic.buffer)).toBe("image/gif");
    });

    test("should return default MIME type for unknown formats", () => {
      const unknownMagic = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      const buffer = unknownMagic.buffer;

      expect(getMimeTypeFromBuffer(buffer)).toBe("application/octet-stream");
    });

    test("should handle empty buffer", () => {
      const emptyBuffer = new ArrayBuffer(0);
      expect(getMimeTypeFromBuffer(emptyBuffer)).toBe(
        "application/octet-stream",
      );
    });
  });

  describe("loadImageAsBuffer - error cases", () => {
    test("should throw error for unsupported input type", async () => {
      const input = { type: "unsupported", value: "test" } as {
        type: string;
        value: string;
      };

      await expect(loadImageAsBuffer(input)).rejects.toThrow(
        "Unsupported image input type: unsupported",
      );
    });
  });
});
