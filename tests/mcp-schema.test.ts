import { describe, it, expect } from "vitest";

import { GenerateImageInputSchema, mapLegacyQuality } from "../src/types/image";

describe("MCP Schema Alignment", () => {
  describe("Quality Parameter Mapping", () => {
    it("should accept legacy quality values through mapping", () => {
      // Red: This should fail initially because GenerateImageInputSchema
      // doesn't accept "standard" directly
      const legacyInput = {
        prompt: "A red apple",
        quality: "standard" as string,
      };

      // Apply mapping before validation
      const mappedInput = {
        ...legacyInput,
        quality: mapLegacyQuality(legacyInput.quality),
      };

      expect(() => GenerateImageInputSchema.parse(mappedInput)).not.toThrow();
      expect(mappedInput.quality).toBe("medium");
    });

    it("should map hd to high quality", () => {
      const legacyInput = {
        prompt: "A blue car",
        quality: "hd" as string,
      };

      const mappedInput = {
        ...legacyInput,
        quality: mapLegacyQuality(legacyInput.quality),
      };

      expect(() => GenerateImageInputSchema.parse(mappedInput)).not.toThrow();
      expect(mappedInput.quality).toBe("high");
    });

    it("should pass through new quality values unchanged", () => {
      const modernInput = {
        prompt: "A green tree",
        quality: "medium" as string,
      };

      const mappedInput = {
        ...modernInput,
        quality: mapLegacyQuality(modernInput.quality),
      };

      expect(() => GenerateImageInputSchema.parse(mappedInput)).not.toThrow();
      expect(mappedInput.quality).toBe("medium");
    });
  });

  describe("Missing Parameters", () => {
    it("should accept background parameter", () => {
      const input = {
        prompt: "A transparent image",
        background: "transparent",
      };

      expect(() => GenerateImageInputSchema.parse(input)).not.toThrow();
    });

    it("should accept output_format parameter", () => {
      const input = {
        prompt: "A PNG image",
        output_format: "png",
      };

      expect(() => GenerateImageInputSchema.parse(input)).not.toThrow();
    });

    it("should accept moderation parameter", () => {
      const input = {
        prompt: "A safe image",
        moderation: "auto",
      };

      expect(() => GenerateImageInputSchema.parse(input)).not.toThrow();
    });
  });

  describe("Style Parameter", () => {
    it("should accept style parameter", () => {
      const input = {
        prompt: "A vivid sunset",
        style: "vivid",
      };

      expect(() => GenerateImageInputSchema.parse(input)).not.toThrow();
    });
  });
});
