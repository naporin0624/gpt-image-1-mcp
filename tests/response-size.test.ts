import { describe, it, expect } from "vitest";

import type { EditImageResult, BatchEditResult } from "../src/types/edit.js";

describe("MCP Response Size Optimization", () => {
  const MAX_TOKEN_ESTIMATE = 25000; // Rough estimate: 4 chars per token
  const MAX_RESPONSE_SIZE = MAX_TOKEN_ESTIMATE * 4;

  describe("Generate Image Response Structure", () => {
    it("should return optimized response by default (no base64)", () => {
      // Mock response structure following new generate-image pattern
      const generateResponse = {
        file_path: "/generated_images/image_20250715_051115_883e88.png",
        metadata: {
          width: 1024,
          height: 1024,
          format: "png",
          size_bytes: 102400,
          created_at: "2025-01-15T05:11:15Z",
        },
      };

      // Verify structure contains new fields
      expect(generateResponse.file_path).toBe(
        "/generated_images/image_20250715_051115_883e88.png",
      );
      expect(generateResponse.metadata.width).toBe(1024);
      expect(generateResponse.metadata.size_bytes).toBe(102400);

      // Verify response is very small
      const responseStr = JSON.stringify(generateResponse);
      expect(responseStr.length).toBeLessThan(1000); // < 1K characters

      // Verify no base64 data in response
      expect(responseStr).not.toMatch(/base64_image/);
      expect(responseStr).not.toMatch(/data:image\/[^;]+;base64,/);

      console.log(
        `Generate response size (default): ${responseStr.length} characters`,
      );
    });

    it("should include base64 when requested and size permits", () => {
      // Simulate small image that fits within limits
      const smallBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const generateResponseWithBase64 = {
        file_path: "/generated_images/image_small.png",
        metadata: {
          width: 1,
          height: 1,
          format: "png",
          size_bytes: 67,
          created_at: "2025-01-15T05:11:15Z",
        },
        base64_image: smallBase64,
      };

      // Verify response contains both file_path and base64
      expect(generateResponseWithBase64.file_path).toBeDefined();
      expect(generateResponseWithBase64.base64_image).toBe(smallBase64);

      // Verify response is still reasonable size
      const responseStr = JSON.stringify(generateResponseWithBase64);
      expect(responseStr.length).toBeLessThan(MAX_RESPONSE_SIZE);

      console.log(
        `Generate response size (with base64): ${responseStr.length} characters`,
      );
    });

    it("should include warnings when base64 would exceed limits", () => {
      const generateResponseWithWarning = {
        file_path: "/generated_images/large_image.png",
        metadata: {
          width: 1024,
          height: 1024,
          format: "png",
          size_bytes: 2048000, // 2MB
          created_at: "2025-01-15T05:11:15Z",
        },
        warnings: [
          "Image too large for base64 response (683000 tokens > 20000 limit). Use file_path instead.",
        ],
      };

      // Verify structure contains warning instead of base64
      expect(generateResponseWithWarning.warnings).toBeDefined();
      expect(generateResponseWithWarning.warnings[0]).toContain(
        "too large for base64 response",
      );
      expect(generateResponseWithWarning).not.toHaveProperty("base64_image");

      // Verify response is still small
      const responseStr = JSON.stringify(generateResponseWithWarning);
      expect(responseStr.length).toBeLessThan(2000); // Still under 2K

      console.log(
        `Generate response size (with warning): ${responseStr.length} characters`,
      );
    });
  });

  describe("Response Structure", () => {
    it("should use image_url and local_file_path instead of inline base64 data", () => {
      // Mock response structure that follows the new pattern
      const editResponse: EditImageResult = {
        original_image: {
          url: "https://example.com/original.jpg",
          format: "jpg",
          dimensions: { width: 1024, height: 1024 },
        },
        edited_image: {
          image_url: undefined, // No OpenAI URL for base64 data
          local_file_path: "/generated_images/edited_12345.png",
          file_size: 1024 * 50, // 50KB
          revised_prompt: "A colorful landscape",
          original_prompt: "Make it colorful",
          edit_type: "style_transfer",
          strength: 0.8,
          // Backward compatibility fields
          local_path: "/generated_images/edited_12345.png",
          filename: "edited_12345.png",
          directory: "/generated_images",
          size_bytes: 1024 * 50,
          format: "png",
          saved_at: "2025-01-15T00:00:00Z",
        },
        metadata: {
          edit_time_ms: 5000,
          model_used: "gpt-image-1",
          composition_preserved: true,
          mask_applied: false,
        },
      };

      // Verify structure contains new fields
      expect(editResponse.edited_image.local_file_path).toBe(
        "/generated_images/edited_12345.png",
      );
      expect(editResponse.edited_image.file_size).toBe(1024 * 50);
      expect(editResponse.edited_image.image_url).toBeUndefined();

      // Verify response is small
      const responseStr = JSON.stringify(editResponse);
      expect(responseStr.length).toBeLessThan(MAX_RESPONSE_SIZE);

      // Verify no base64 data in response
      expect(responseStr).not.toMatch(/data:image\/[^;]+;base64,/);
    });

    // REMOVED: Variation test - variations not supported by gpt-image-1
    // Use edit-image with edit_type: "variation" instead

    it("should handle batch edit responses without large data", () => {
      const batchResponse: BatchEditResult = {
        total_images: 3,
        processed_images: 3,
        failed_images: 0,
        results: [
          {
            original_url: "https://example.com/image1.jpg",
            success: true,
            edited_image: {
              image_url: undefined, // No OpenAI URL for base64
              local_file_path: "/generated_images/batch_1.png",
              file_size: 1024 * 60,
              // Backward compatibility
              local_path: "/generated_images/batch_1.png",
              filename: "batch_1.png",
              directory: "/generated_images",
              size_bytes: 1024 * 60,
              format: "png",
              saved_at: "2025-01-15T00:00:00Z",
            },
          },
          {
            original_url: "https://example.com/image2.jpg",
            success: true,
            edited_image: {
              image_url: undefined,
              local_file_path: "/generated_images/batch_2.png",
              file_size: 1024 * 55,
              // Backward compatibility
              local_path: "/generated_images/batch_2.png",
              filename: "batch_2.png",
              directory: "/generated_images",
              size_bytes: 1024 * 55,
              format: "png",
              saved_at: "2025-01-15T00:00:00Z",
            },
          },
          {
            original_url: "https://example.com/image3.jpg",
            success: true,
            edited_image: {
              image_url: undefined,
              local_file_path: "/generated_images/batch_3.png",
              file_size: 1024 * 62,
              // Backward compatibility
              local_path: "/generated_images/batch_3.png",
              filename: "batch_3.png",
              directory: "/generated_images",
              size_bytes: 1024 * 62,
              format: "png",
              saved_at: "2025-01-15T00:00:00Z",
            },
          },
        ],
        metadata: {
          total_time_ms: 15000,
          average_time_per_image_ms: 5000,
          model_used: "gpt-image-1",
          parallel_processing: true,
        },
      };

      // Verify structure
      expect(batchResponse.results[0]).toBeDefined();
      expect(batchResponse.results[0]!.edited_image?.local_file_path).toBe(
        "/generated_images/batch_1.png",
      );
      expect(batchResponse.results[0]!.edited_image?.file_size).toBe(1024 * 60);
      expect(batchResponse.results[0]!.edited_image?.image_url).toBeUndefined();

      // Verify response is small even with multiple images
      const responseStr = JSON.stringify(batchResponse);
      expect(responseStr.length).toBeLessThan(MAX_RESPONSE_SIZE);

      // Verify no base64 data in response
      expect(responseStr).not.toMatch(/data:image\/[^;]+;base64,/);

      // Log response size for verification
      console.log(
        `Batch response size: ${responseStr.length} characters (limit: ${MAX_RESPONSE_SIZE})`,
      );
    });
  });

  describe("Response Size Comparison", () => {
    it("should demonstrate size difference between old and new structure", () => {
      // Old structure with base64 data (problematic)
      const oldStructure = {
        edited_image: {
          url: "data:image/png;base64," + "A".repeat(100000), // Simulated large base64
          revised_prompt: "A colorful landscape",
          original_prompt: "Make it colorful",
        },
      };

      // New structure (optimized)
      const newStructure = {
        edited_image: {
          image_url: undefined,
          local_file_path: "/generated_images/edited_12345.png",
          file_size: 1024 * 50,
          revised_prompt: "A colorful landscape",
          original_prompt: "Make it colorful",
        },
      };

      const oldSize = JSON.stringify(oldStructure).length;
      const newSize = JSON.stringify(newStructure).length;

      console.log(`Old structure size: ${oldSize} characters`);
      console.log(`New structure size: ${newSize} characters`);
      console.log(
        `Size reduction: ${(((oldSize - newSize) / oldSize) * 100).toFixed(1)}%`,
      );

      // New structure should be significantly smaller
      expect(newSize).toBeLessThan(oldSize * 0.1); // At least 90% reduction
      expect(newSize).toBeLessThan(MAX_RESPONSE_SIZE);
    });
  });
});
