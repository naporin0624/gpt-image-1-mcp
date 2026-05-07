import { describe, it, expect } from "vitest";

import {
  BatchEditInputSchema,
  EditImageInputSchema,
  EditImageGpt1Schema,
  EditImageGpt2Schema,
} from "../src/types/edit.js";
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

  describe("EditImageInputSchema (discriminated union)", () => {
    const singleImage = { type: "url", value: "https://example.com/a.png" };
    const baseInput = {
      source_image: singleImage,
      edit_prompt: "x",
      edit_type: "style_transfer",
    };

    it("defaults model to gpt-image-2 when omitted", () => {
      const result = EditImageInputSchema.parse(baseInput);
      expect(result.model).toBe("gpt-image-2");
    });

    it("accepts a single source_image on the gpt-image-1 branch", () => {
      expect(() =>
        EditImageInputSchema.parse({ ...baseInput, model: "gpt-image-1" }),
      ).not.toThrow();
    });

    it("rejects an array source_image on the gpt-image-1 branch", () => {
      expect(() =>
        EditImageInputSchema.parse({
          ...baseInput,
          model: "gpt-image-1",
          source_image: [singleImage, singleImage],
        }),
      ).toThrow();
    });

    it("accepts an array of 1-10 source_images on the gpt-image-2 branch", () => {
      const tenImages = Array.from({ length: 10 }, () => singleImage);
      expect(() =>
        EditImageInputSchema.parse({
          ...baseInput,
          model: "gpt-image-2",
          source_image: tenImages,
        }),
      ).not.toThrow();
    });

    it("rejects more than 10 source_images on the gpt-image-2 branch", () => {
      const elevenImages = Array.from({ length: 11 }, () => singleImage);
      expect(() =>
        EditImageInputSchema.parse({
          ...baseInput,
          model: "gpt-image-2",
          source_image: elevenImages,
        }),
      ).toThrow();
    });

    it("rejects an empty array source_image on the gpt-image-2 branch", () => {
      expect(() =>
        EditImageInputSchema.parse({
          ...baseInput,
          model: "gpt-image-2",
          source_image: [],
        }),
      ).toThrow();
    });

    it("accepts a single source_image on the gpt-image-2 branch", () => {
      expect(() =>
        EditImageGpt2Schema.parse({ ...baseInput, model: "gpt-image-2" }),
      ).not.toThrow();
    });

    it("rejects mismatched model literal in gpt1 branch", () => {
      expect(() =>
        EditImageGpt1Schema.parse({ ...baseInput, model: "gpt-image-2" }),
      ).toThrow();
    });
  });

  describe("BATCH_TO_EDIT_TYPE", () => {
    it("maps every BatchEdit edit_type to a valid EditImage edit_type", async () => {
      const { BATCH_TO_EDIT_TYPE } = await import("../src/types/edit.js");
      const batchTypes = [
        "style_transfer",
        "background_change",
        "color_adjustment",
        "enhancement",
      ] as const;
      const validEditTypes = new Set([
        "inpaint",
        "outpaint",
        "variation",
        "style_transfer",
        "object_removal",
        "background_change",
      ]);
      for (const t of batchTypes) {
        expect(validEditTypes.has(BATCH_TO_EDIT_TYPE[t])).toBe(true);
      }
    });
  });

  describe("BatchEditInputSchema", () => {
    const baseInput = {
      images: [{ type: "url", value: "https://example.com/a.png" }],
      edit_prompt: "x",
      edit_type: "style_transfer",
    };

    it("defaults model to gpt-image-2 when omitted", () => {
      const result = BatchEditInputSchema.parse(baseInput);
      expect(result.model).toBe("gpt-image-2");
    });

    it("accepts model: gpt-image-1", () => {
      const result = BatchEditInputSchema.parse({
        ...baseInput,
        model: "gpt-image-1",
      });
      expect(result.model).toBe("gpt-image-1");
    });

    it("rejects an unknown model literal", () => {
      expect(() =>
        BatchEditInputSchema.parse({ ...baseInput, model: "gpt-image-3" }),
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
