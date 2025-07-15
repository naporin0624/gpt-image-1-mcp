import { describe, test, expect } from "vitest";

import {
  validateEnglishOnly,
  validateEnglishOnlyArray,
  ValidationError,
  formatValidationError,
} from "../src/utils/validation.js";

describe("validation", () => {
  describe("validateEnglishOnly", () => {
    test("should accept valid English text", () => {
      expect(() => validateEnglishOnly("Hello world")).not.toThrow();
      expect(() =>
        validateEnglishOnly("A beautiful sunset over mountains"),
      ).not.toThrow();
      expect(() =>
        validateEnglishOnly("Modern minimalist design with blue accents"),
      ).not.toThrow();
    });

    test("should accept English text with numbers and punctuation", () => {
      expect(() => validateEnglishOnly("Hello, world! 123")).not.toThrow();
      expect(() =>
        validateEnglishOnly("Email: test@example.com"),
      ).not.toThrow();
      expect(() =>
        validateEnglishOnly("Price: $29.99 (discount 50%)"),
      ).not.toThrow();
    });

    test("should accept English text with accented characters", () => {
      expect(() => validateEnglishOnly("Café résumé naïve")).not.toThrow();
      expect(() => validateEnglishOnly("Señor niño piñata")).not.toThrow();
    });

    test("should accept emojis", () => {
      expect(() => validateEnglishOnly("Hello world! 😊 🌟")).not.toThrow();
      expect(() =>
        validateEnglishOnly("Sunset 🌅 and mountains 🏔️"),
      ).not.toThrow();
    });

    test("should reject Japanese text", () => {
      expect(() => validateEnglishOnly("こんにちは")).toThrow(ValidationError);
      expect(() => validateEnglishOnly("美しい風景")).toThrow(ValidationError);
      expect(() => validateEnglishOnly("Hello こんにちは")).toThrow(
        ValidationError,
      );
    });

    test("should reject Chinese text", () => {
      expect(() => validateEnglishOnly("你好")).toThrow(ValidationError);
      expect(() => validateEnglishOnly("美丽的风景")).toThrow(ValidationError);
      expect(() => validateEnglishOnly("Hello 你好")).toThrow(ValidationError);
    });

    test("should reject Korean text", () => {
      expect(() => validateEnglishOnly("안녕하세요")).toThrow(ValidationError);
      expect(() => validateEnglishOnly("아름다운 풍경")).toThrow(
        ValidationError,
      );
      expect(() => validateEnglishOnly("Hello 안녕하세요")).toThrow(
        ValidationError,
      );
    });

    test("should reject Arabic text", () => {
      expect(() => validateEnglishOnly("مرحبا")).toThrow(ValidationError);
      expect(() => validateEnglishOnly("Hello مرحبا")).toThrow(ValidationError);
    });

    test("should reject Hebrew text", () => {
      expect(() => validateEnglishOnly("שלום")).toThrow(ValidationError);
      expect(() => validateEnglishOnly("Hello שלום")).toThrow(ValidationError);
    });

    test("should throw ValidationError with correct properties", () => {
      try {
        validateEnglishOnly("こんにちは", "prompt");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe("NON_ENGLISH_TEXT");
        expect((error as ValidationError).message).toContain(
          "prompt only accepts English text",
        );
        expect((error as ValidationError).suggestion).toContain(
          "Use your LLM to translate",
        );
      }
    });

    test("should throw ValidationError for empty text", () => {
      expect(() => validateEnglishOnly("")).toThrow(ValidationError);
      expect(() => validateEnglishOnly("   ")).toThrow(ValidationError);

      try {
        validateEnglishOnly("", "prompt");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe("EMPTY_TEXT");
      }
    });
  });

  describe("validateEnglishOnlyArray", () => {
    test("should accept array of valid English texts", () => {
      expect(() =>
        validateEnglishOnlyArray(["Hello", "world", "beautiful sunset"]),
      ).not.toThrow();
      expect(() => validateEnglishOnlyArray([])).not.toThrow();
    });

    test("should reject array with non-English text", () => {
      expect(() => validateEnglishOnlyArray(["Hello", "こんにちは"])).toThrow(
        ValidationError,
      );
      expect(() => validateEnglishOnlyArray(["你好", "world"])).toThrow(
        ValidationError,
      );
    });

    test("should throw ValidationError for non-array input", () => {
      // Test helper for invalid inputs
      function testInvalidInput(input: unknown, fieldName?: string) {
        expect(() =>
          validateEnglishOnlyArray(input as string[], fieldName),
        ).toThrow(ValidationError);
      }

      testInvalidInput("not an array");
      testInvalidInput(123);

      try {
        validateEnglishOnlyArray(
          "not an array" as unknown as string[],
          "questions",
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe("INVALID_TYPE");
        expect((error as ValidationError).message).toContain(
          "questions must be an array",
        );
      }
    });
  });

  describe("formatValidationError", () => {
    test("should format ValidationError correctly", () => {
      const validationError = new ValidationError(
        "prompt only accepts English text",
        "NON_ENGLISH_TEXT",
        "Use your LLM to translate the prompt to English",
      );

      const formatted = formatValidationError(validationError);

      expect(formatted.isError).toBe(true);
      expect(formatted.content[0]).toBeDefined();
      expect(formatted.content[0]!.type).toBe("text");
      expect(formatted.content[0]!.text).toContain("❌ Validation Error");
      expect(formatted.content[0]!.text).toContain(
        "prompt only accepts English text",
      );
      expect(formatted.content[0]!.text).toContain("💡 Suggestion");
      expect(formatted.content[0]!.text).toContain("Use your LLM to translate");
      expect(formatted.content[0]!.text).toContain(
        "📝 Example of correct usage",
      );
    });

    test("should format generic Error correctly", () => {
      const genericError = new Error("Generic error message");
      const formatted = formatValidationError(genericError);

      expect(formatted.isError).toBe(true);
      expect(formatted.content[0]).toBeDefined();
      expect(formatted.content[0]!.type).toBe("text");
      expect(formatted.content[0]!.text).toBe("Error: Generic error message");
    });
  });
});
