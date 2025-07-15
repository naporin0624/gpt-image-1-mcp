import { describe, it, expect } from "vitest";

import {
  AspectRatioSchema,
  GenerateImageInputSchema,
  aspectRatioToSize,
} from "../src/types/image.js";

describe("Image Types", () => {
  describe("AspectRatioSchema", () => {
    it("should accept valid aspect ratios", () => {
      const validRatios = [
        "square",
        "landscape",
        "portrait",
        "1:1",
        "16:9",
        "9:16",
      ];

      validRatios.forEach((ratio) => {
        expect(() => AspectRatioSchema.parse(ratio)).not.toThrow();
      });
    });

    it("should reject invalid aspect ratios", () => {
      const invalidRatios = ["invalid", "4:3", "custom"];

      invalidRatios.forEach((ratio) => {
        expect(() => AspectRatioSchema.parse(ratio)).toThrow();
      });
    });
  });

  describe("GenerateImageInputSchema", () => {
    it("should accept valid input with required fields only", () => {
      const input = {
        prompt: "A beautiful sunset over mountains",
      };

      expect(() => GenerateImageInputSchema.parse(input)).not.toThrow();
    });

    it("should accept valid input with all fields", () => {
      const input = {
        prompt: "A beautiful sunset over mountains",
        aspect_ratio: "landscape",
        quality: "high",
        style: "vivid",
        analyze_after_generation: true,
        remove_background: false,
      };

      expect(() => GenerateImageInputSchema.parse(input)).not.toThrow();
    });

    it("should reject input without prompt", () => {
      const input = {
        aspect_ratio: "square",
      };

      expect(() => GenerateImageInputSchema.parse(input)).toThrow();
    });

    it("should reject input with empty prompt", () => {
      const input = {
        prompt: "",
      };

      expect(() => GenerateImageInputSchema.parse(input)).toThrow();
    });

    it("should apply default values", () => {
      const input = {
        prompt: "Test prompt",
      };

      const result = GenerateImageInputSchema.parse(input);
      expect(result.aspect_ratio).toBe("square");
      expect(result.analyze_after_generation).toBe(false);
      expect(result.remove_background).toBe(false);
    });
  });

  describe("aspectRatioToSize", () => {
    it("should convert aspect ratios to correct sizes", () => {
      expect(aspectRatioToSize("square")).toBe("1024x1024");
      expect(aspectRatioToSize("1:1")).toBe("1024x1024");
      expect(aspectRatioToSize("landscape")).toBe("1536x1024");
      expect(aspectRatioToSize("16:9")).toBe("1536x1024");
      expect(aspectRatioToSize("portrait")).toBe("1024x1536");
      expect(aspectRatioToSize("9:16")).toBe("1024x1536");
    });
  });
});
