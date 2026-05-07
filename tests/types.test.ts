import { describe, it, expect } from "vitest";

import {
  AspectRatioSchema,
  GenerateImageInputSchema,
  GenerateImageGpt1Schema,
  GenerateImageGpt2Schema,
  aspectRatioToSize,
  aspectRatioToSizeGpt2,
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
    it("defaults model to gpt-image-2 when omitted", () => {
      const result = GenerateImageInputSchema.parse({ prompt: "x" });
      expect(result.model).toBe("gpt-image-2");
    });

    it("respects explicit model: gpt-image-1", () => {
      const result = GenerateImageInputSchema.parse({
        prompt: "x",
        model: "gpt-image-1",
      });
      expect(result.model).toBe("gpt-image-1");
    });

    it("rejects gpt-image-1 + square_2k via the union", () => {
      expect(() =>
        GenerateImageInputSchema.parse({
          prompt: "x",
          model: "gpt-image-1",
          aspect_ratio: "square_2k",
        }),
      ).toThrow();
    });

    it("accepts gpt-image-2 + square_2k via the union", () => {
      expect(() =>
        GenerateImageInputSchema.parse({
          prompt: "x",
          model: "gpt-image-2",
          aspect_ratio: "square_2k",
        }),
      ).not.toThrow();
    });

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

  describe("aspectRatioToSizeGpt2", () => {
    it("returns the same fixed sizes as gpt-image-1 for shared presets", () => {
      expect(aspectRatioToSizeGpt2("square")).toBe("1024x1024");
      expect(aspectRatioToSizeGpt2("1:1")).toBe("1024x1024");
      expect(aspectRatioToSizeGpt2("landscape")).toBe("1536x1024");
      expect(aspectRatioToSizeGpt2("16:9")).toBe("1536x1024");
      expect(aspectRatioToSizeGpt2("portrait")).toBe("1024x1536");
      expect(aspectRatioToSizeGpt2("9:16")).toBe("1024x1536");
    });

    it("returns 2K sizes for the new presets", () => {
      expect(aspectRatioToSizeGpt2("square_2k")).toBe("2048x2048");
      expect(aspectRatioToSizeGpt2("landscape_2k")).toBe("2048x1152");
      expect(aspectRatioToSizeGpt2("portrait_2k")).toBe("1152x2048");
    });

    it("returns 'auto' for the auto preset", () => {
      expect(aspectRatioToSizeGpt2("auto")).toBe("auto");
    });
  });

  describe("GenerateImageGpt2Schema", () => {
    it("accepts square_2k / landscape_2k / portrait_2k / auto aspect ratios", () => {
      for (const ratio of [
        "square_2k",
        "landscape_2k",
        "portrait_2k",
        "auto",
      ] as const) {
        expect(() =>
          GenerateImageGpt2Schema.parse({
            model: "gpt-image-2",
            prompt: "x",
            aspect_ratio: ratio,
          }),
        ).not.toThrow();
      }
    });

    it("accepts auto quality", () => {
      expect(() =>
        GenerateImageGpt2Schema.parse({
          model: "gpt-image-2",
          prompt: "x",
          quality: "auto",
        }),
      ).not.toThrow();
    });

    it("rejects gpt-image-1 only legacy quality values", () => {
      for (const quality of ["standard", "hd"] as const) {
        expect(() =>
          GenerateImageGpt2Schema.parse({
            model: "gpt-image-2",
            prompt: "x",
            quality,
          }),
        ).toThrow();
      }
    });

    it("rejects model literal other than gpt-image-2", () => {
      expect(() =>
        GenerateImageGpt2Schema.parse({
          model: "gpt-image-1",
          prompt: "x",
        }),
      ).toThrow();
    });
  });

  describe("GenerateImageGpt1Schema", () => {
    it("rejects gpt-image-2 only aspect ratios (square_2k, auto, ...)", () => {
      for (const ratio of [
        "square_2k",
        "landscape_2k",
        "portrait_2k",
        "auto",
      ] as const) {
        expect(() =>
          GenerateImageGpt1Schema.parse({
            model: "gpt-image-1",
            prompt: "x",
            aspect_ratio: ratio,
          }),
        ).toThrow();
      }
    });

    it("accepts legacy quality values (standard, hd, high, medium, low)", () => {
      for (const quality of [
        "standard",
        "hd",
        "high",
        "medium",
        "low",
      ] as const) {
        expect(() =>
          GenerateImageGpt1Schema.parse({
            model: "gpt-image-1",
            prompt: "x",
            quality,
          }),
        ).not.toThrow();
      }
    });

    it("rejects auto quality (gpt-image-2 only)", () => {
      expect(() =>
        GenerateImageGpt1Schema.parse({
          model: "gpt-image-1",
          prompt: "x",
          quality: "auto",
        }),
      ).toThrow();
    });
  });
});
