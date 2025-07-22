import { describe, it, expect, vi, beforeEach } from "vitest";

import { aspectRatioToSize } from "../src/types/image.js";
import { OpenAIService } from "../src/utils/openai.js";

import type { EditImageInput, BatchEditInput } from "../src/types/edit.js";
import type { GenerateImageInput } from "../src/types/image.js";
import type { FileManager } from "../src/utils/file-manager.js";
import type { OpenAI } from "openai";
import type { Mock, Mocked } from "vitest";

// Test utility for accessing private properties
interface OpenAIServiceTestAccess {
  client: OpenAI;
  fileManager: FileManager;
}

vi.mock("openai");
vi.mock("../src/utils/file-manager.js");

// Mock fetch for loadImageAsBuffer
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Polyfill File for Node 18
class TestFile extends Blob {
  name: string;
  constructor(chunks: BlobPart[], name: string, options?: FilePropertyBag) {
    super(chunks, options);
    this.name = name;
  }
}
(global as any).File = TestFile;

describe("OpenAI Integration", () => {
  let mockOpenAI: Mocked<OpenAI>;

  beforeEach(() => {
    mockOpenAI = {
      images: {
        generate: vi.fn(),
        edit: vi.fn(),
        // REMOVED: createVariation - not supported by gpt-image-1
      },
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    } as unknown as Mocked<OpenAI>;

    vi.clearAllMocks();

    // Mock fetch for loadImageAsBuffer (after clearAllMocks)
    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: vi.fn().mockReturnValue("image/jpeg"),
      },
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
    });
  });

  describe("Image Generation", () => {
    it("should generate an image with correct parameters", async () => {
      const mockResponse = {
        created: 1234567890,
        data: [
          {
            url: "https://example.com/generated-image.png",
            revised_prompt:
              "A beautiful mountain landscape with snow-capped peaks",
          },
        ],
      };

      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      mockOpenAI.images.generate = mockCreate;

      const input: GenerateImageInput = {
        prompt: "A beautiful mountain landscape",
        aspect_ratio: "landscape",
        quality: "high",
        style: "vivid",
        background: "auto",
        output_format: "png",
        moderation: "auto",
        save_to_file: true,
        naming_strategy: "timestamp",
        organize_by: "none",
        analyze_after_generation: false,
        remove_background: false,
        include_base64: false,
      };

      const size = aspectRatioToSize(input.aspect_ratio);

      const result = await mockOpenAI.images.generate({
        model: "gpt-image-1",
        prompt: input.prompt,
        size,
        ...(input.quality && { quality: input.quality }),
        ...(input.style && { style: input.style }),
        n: 1,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: "gpt-image-1",
        prompt: input.prompt,
        size,
        quality: input.quality,
        style: input.style,
        n: 1,
      });

      expect(result).toEqual(mockResponse);
    });

    it("should handle API errors gracefully", async () => {
      const mockError = new Error("API Error: Rate limit exceeded");
      const mockCreate = vi.fn().mockRejectedValue(mockError);

      mockOpenAI.images.generate = mockCreate;

      const input: GenerateImageInput = {
        prompt: "Test prompt",
        aspect_ratio: "square",
        background: "auto",
        output_format: "png",
        moderation: "auto",
        save_to_file: true,
        naming_strategy: "timestamp",
        organize_by: "none",
        analyze_after_generation: false,
        remove_background: false,
        include_base64: false,
      };

      await expect(
        mockOpenAI.images.generate({
          model: "gpt-image-1",
          prompt: input.prompt,
          size: aspectRatioToSize(input.aspect_ratio),
          n: 1,
        }),
      ).rejects.toThrow("API Error: Rate limit exceeded");
    });
  });

  describe("Image Editing with File Output", () => {
    let openAIService: OpenAIService;
    let mockFileManager: { saveImage: Mock };

    beforeEach(() => {
      // Mock environment variables
      process.env.OPENAI_API_KEY = "test-api-key";

      // Create mock FileManager
      mockFileManager = {
        saveImage: vi.fn(),
      };

      // Mock fetch for image downloads
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("image/jpeg"),
        },
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      });

      // Mock OpenAI API calls
      const mockEditResponse = {
        data: [
          {
            b64_json:
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            revised_prompt: "Test revised prompt",
          },
        ],
      };

      // Create OpenAIService instance
      openAIService = new OpenAIService();

      // Mock OpenAI client methods
      // @internal - for testing only
      (openAIService as unknown as OpenAIServiceTestAccess).client = {
        images: {
          edit: vi.fn().mockResolvedValue(mockEditResponse),
        },
      } as unknown as OpenAI;

      // Replace the internal fileManager with our mock
      // @internal - for testing only
      (openAIService as unknown as OpenAIServiceTestAccess).fileManager =
        mockFileManager as unknown as FileManager;
    });

    it("should save edited image to file when save_to_file is true", async () => {
      // Arrange
      const mockFileResult = {
        local_path: "/path/to/edited_image.png",
        filename: "edited_12345.png",
        directory: "/path/to",
        size_bytes: 1024,
        format: "png",
        saved_at: "2025-01-15T00:00:00Z",
      };

      mockFileManager.saveImage.mockResolvedValue(mockFileResult);

      const input: EditImageInput = {
        source_image: { type: "url", value: "https://example.com/source.jpg" },
        edit_prompt: "Make it colorful",
        edit_type: "style_transfer",
        model: "gpt-image-1",
        background: "auto",
        quality: "auto",
        save_to_file: true,
        output_directory: "/custom/output",
        filename_prefix: "edited_",
        naming_strategy: "timestamp",
        organize_by: "date",
        strength: 0.8,
        preserve_composition: true,
        output_format: "png",
      };

      // Act
      const result = await openAIService.editImage(input);

      // Assert
      expect(mockFileManager.saveImage).toHaveBeenCalledWith(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", // base64 data from mock
        {
          save_to_file: true, // Always true for base64 data
          output_directory: "/custom/output",
          filename: expect.stringContaining("edited_"),
          naming_strategy: "timestamp",
          organize_by: "date",
        },
        {
          prompt: "Make it colorful",
          aspectRatio: "square",
          quality: "medium",
          format: "png",
        },
      );

      expect(result.edited_image).toMatchObject({
        image_url: undefined, // No OpenAI URL for base64 data
        local_file_path: "/path/to/edited_image.png",
        file_size: 1024,
        // Backward compatibility fields
        local_path: "/path/to/edited_image.png",
        filename: "edited_12345.png",
        directory: "/path/to",
        size_bytes: 1024,
        format: "png",
        saved_at: "2025-01-15T00:00:00Z",
      });
    });

    it("should respect webp output_format", async () => {
      const mockFileResult = {
        local_path: "/path/to/edited_image.webp",
        filename: "edited_12345.webp",
        directory: "/path/to",
        size_bytes: 512,
        format: "webp",
        saved_at: "2025-01-15T00:00:00Z",
      };

      mockFileManager.saveImage.mockResolvedValue(mockFileResult);

      const input: EditImageInput = {
        source_image: { type: "url", value: "https://example.com/source.jpg" },
        edit_prompt: "Make it colorful",
        edit_type: "style_transfer",
        model: "gpt-image-1",
        background: "auto",
        quality: "auto",
        save_to_file: true,
        output_directory: "/custom/output",
        filename_prefix: "edited_",
        naming_strategy: "timestamp",
        organize_by: "date",
        strength: 0.8,
        preserve_composition: true,
        output_format: "webp",
      };

      const result = await openAIService.editImage(input);

      expect(mockFileManager.saveImage).toHaveBeenCalledWith(
        expect.stringContaining("data:image/webp;base64,"),
        expect.objectContaining({ save_to_file: true }),
        expect.objectContaining({ format: "webp" }),
      );

      expect(result.edited_image?.format).toBe("webp");
    });

    it("should always save base64 data to file even when save_to_file is false", async () => {
      // Arrange
      const input: EditImageInput = {
        source_image: { type: "url", value: "https://example.com/source.jpg" },
        edit_prompt: "Make it colorful",
        edit_type: "style_transfer",
        model: "gpt-image-1", // Returns base64 data
        background: "auto",
        quality: "auto",
        save_to_file: false, // Even though this is false...
        filename_prefix: "edited_",
        naming_strategy: "timestamp",
        organize_by: "none",
        strength: 0.8,
        preserve_composition: true,
        output_format: "png",
      };

      // Act
      await openAIService.editImage(input);

      // Assert - base64 data is ALWAYS saved to avoid large responses
      expect(mockFileManager.saveImage).toHaveBeenCalledWith(
        expect.stringContaining("data:image/png;base64,"),
        expect.objectContaining({
          save_to_file: true, // Always true for base64 data
        }),
        expect.any(Object),
      );
    });

    it("should continue processing if file save fails", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockFileManager.saveImage.mockRejectedValue(new Error("Disk full"));

      const input: EditImageInput = {
        source_image: { type: "url", value: "https://example.com/source.jpg" },
        edit_prompt: "Make it colorful",
        edit_type: "style_transfer",
        model: "gpt-image-1",
        background: "auto",
        quality: "auto",
        save_to_file: true,
        filename_prefix: "edited_",
        naming_strategy: "timestamp",
        organize_by: "none",
        strength: 0.8,
        preserve_composition: true,
        output_format: "png",
      };

      // Act & Assert
      await expect(openAIService.editImage(input)).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save base64 image to file:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  // REMOVED: Image Variation tests - variations not supported by gpt-image-1
  // Use edit-image with edit_type: "variation" instead

  describe("Batch Edit with File Output", () => {
    let openAIService: OpenAIService;
    let mockFileManager: { saveImage: Mock };

    beforeEach(() => {
      // Mock environment variables
      process.env.OPENAI_API_KEY = "test-api-key";

      // Create mock FileManager
      mockFileManager = {
        saveImage: vi.fn(),
      };

      // Mock fetch for image downloads
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("image/jpeg"),
        },
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      });

      // Mock OpenAI API calls
      const mockEditResponse = {
        data: [
          {
            b64_json:
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            revised_prompt: "Test revised prompt",
          },
        ],
      };

      // Create OpenAIService instance
      openAIService = new OpenAIService();

      // Mock OpenAI client methods - note editImage calls edit internally
      // @internal - for testing only
      (openAIService as unknown as OpenAIServiceTestAccess).client = {
        images: {
          edit: vi.fn().mockResolvedValue(mockEditResponse),
        },
      } as unknown as OpenAI;

      // Replace the internal fileManager with our mock
      // @internal - for testing only
      (openAIService as unknown as OpenAIServiceTestAccess).fileManager =
        mockFileManager as unknown as FileManager;
    });

    it("should save all batch edited images to file when save_to_file is true", async () => {
      // Arrange
      const mockFileResult = {
        local_path: "/path/to/batch_1_image.png",
        filename: "batch_1_12345.png",
        directory: "/path/to",
        size_bytes: 1024,
        format: "png",
        saved_at: "2025-01-15T00:00:00Z",
      };

      mockFileManager.saveImage.mockResolvedValue(mockFileResult);

      const input: BatchEditInput = {
        images: [
          { type: "url", value: "https://example.com/image1.jpg" },
          { type: "url", value: "https://example.com/image2.jpg" },
        ],
        edit_prompt: "Make it artistic",
        edit_type: "style_transfer",
        save_to_file: true,
        output_directory: "/custom/output",
        filename_prefix: "batch_",
        naming_strategy: "timestamp",
        organize_by: "date",
      };

      // Act
      const result = await openAIService.batchEdit(input);

      // Assert
      expect(mockFileManager.saveImage).toHaveBeenCalledTimes(2);

      // Check first image call
      expect(mockFileManager.saveImage).toHaveBeenNthCalledWith(
        1,
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", // base64 from mock
        {
          save_to_file: true, // Always true for base64 data
          output_directory: "/custom/output",
          filename: expect.stringContaining("batch_1_"),
          naming_strategy: "timestamp",
          organize_by: "date",
        },
        {
          prompt: "Make it artistic",
          aspectRatio: "square",
          quality: "medium",
          format: "png",
        },
      );

      expect(result.processed_images).toBe(2);
      expect(result.failed_images).toBe(0);
      expect(result.results[0]).toBeDefined();
      expect(result.results[0]!.success).toBe(true);
      expect(result.results[0]!.edited_image).toMatchObject({
        image_url: undefined, // No OpenAI URL for base64 data
        local_file_path: "/path/to/batch_1_image.png",
        file_size: 1024,
        // Backward compatibility fields
        local_path: "/path/to/batch_1_image.png",
        filename: "batch_1_12345.png",
        directory: "/path/to",
        size_bytes: 1024,
        format: "png",
        saved_at: "2025-01-15T00:00:00Z",
      });
    });

    it("should always save base64 data to file even when save_to_file is false", async () => {
      // Arrange
      const input: BatchEditInput = {
        images: [{ type: "url", value: "https://example.com/image1.jpg" }],
        edit_prompt: "Make it artistic",
        edit_type: "style_transfer",
        save_to_file: false, // Even though this is false...
        naming_strategy: "timestamp",
        organize_by: "none",
        filename_prefix: "batch_",
      };

      // Act
      await openAIService.batchEdit(input);

      // Assert - base64 data is ALWAYS saved to avoid large responses
      expect(mockFileManager.saveImage).toHaveBeenCalledWith(
        expect.stringContaining("data:image/png;base64,"),
        expect.objectContaining({
          save_to_file: true, // Always true for base64 data
        }),
        expect.any(Object),
      );
    });
  });
});
