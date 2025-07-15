import { describe, test, expect } from "vitest";

import {
  validateText,
  validateTextArray,
  ValidationError,
  formatValidationError,
} from "../src/utils/validation.js";

describe("validation", () => {
  describe("validateText", () => {
    test("should accept valid text", () => {
      expect(() => validateText("Hello world")).not.toThrow();
      expect(() =>
        validateText("A beautiful sunset over mountains"),
      ).not.toThrow();
      expect(() =>
        validateText("Modern minimalist design with blue accents"),
      ).not.toThrow();
    });

    test("should accept text with numbers and punctuation", () => {
      expect(() => validateText("Hello, world! 123")).not.toThrow();
      expect(() => validateText("Email: test@example.com")).not.toThrow();
      expect(() => validateText("Price: $29.99 (discount 50%)")).not.toThrow();
    });

    test("should accept text with accented characters", () => {
      expect(() => validateText("Café résumé naïve")).not.toThrow();
      expect(() => validateText("Señor niño piñata")).not.toThrow();
    });

    test("should accept emojis", () => {
      expect(() => validateText("Hello world! 😊 🌟")).not.toThrow();
      expect(() => validateText("Sunset 🌅 and mountains 🏔️")).not.toThrow();
    });

    test("should accept Japanese text", () => {
      expect(() => validateText("こんにちは")).not.toThrow();
      expect(() => validateText("美しい風景")).not.toThrow();
      expect(() => validateText("Hello こんにちは")).not.toThrow();
    });

    test("should accept Chinese text", () => {
      expect(() => validateText("你好")).not.toThrow();
      expect(() => validateText("美丽的风景")).not.toThrow();
      expect(() => validateText("Hello 你好")).not.toThrow();
    });

    test("should accept Korean text", () => {
      expect(() => validateText("안녕하세요")).not.toThrow();
      expect(() => validateText("아름다운 풍경")).not.toThrow();
      expect(() => validateText("Hello 안녕하세요")).not.toThrow();
    });

    test("should accept Arabic text", () => {
      expect(() => validateText("مرحبا")).not.toThrow();
      expect(() => validateText("Hello مرحبا")).not.toThrow();
    });

    test("should accept Hebrew text", () => {
      expect(() => validateText("שלום")).not.toThrow();
      expect(() => validateText("Hello שלום")).not.toThrow();
    });

    test("should throw ValidationError for empty text", () => {
      expect(() => validateText("")).toThrow(ValidationError);
      expect(() => validateText("   ")).toThrow(ValidationError);

      try {
        validateText("", "prompt");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe("EMPTY_TEXT");
      }
    });
  });

  describe("validateTextArray", () => {
    test("should accept array of valid texts", () => {
      expect(() =>
        validateTextArray(["Hello", "world", "beautiful sunset"]),
      ).not.toThrow();
      expect(() => validateTextArray([])).not.toThrow();
    });

    test("should accept array with multi-language text", () => {
      expect(() => validateTextArray(["Hello", "こんにちは"])).not.toThrow();
      expect(() => validateTextArray(["你好", "world"])).not.toThrow();
    });

    test("should throw ValidationError for non-array input", () => {
      // Test helper for invalid inputs
      function testInvalidInput(input: unknown, fieldName?: string) {
        expect(() => validateTextArray(input as string[], fieldName)).toThrow(
          ValidationError,
        );
      }

      testInvalidInput("not an array");
      testInvalidInput(123);

      try {
        validateTextArray("not an array" as unknown as string[], "questions");
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
        "prompt cannot be empty",
        "EMPTY_TEXT",
        "Please provide a descriptive prompt",
      );

      const formatted = formatValidationError(validationError);

      expect(formatted.isError).toBe(true);
      expect(formatted.content[0]).toBeDefined();
      expect(formatted.content[0]!.type).toBe("text");
      expect(formatted.content[0]!.text).toContain("❌ Validation Error");
      expect(formatted.content[0]!.text).toContain("prompt cannot be empty");
      expect(formatted.content[0]!.text).toContain("💡 Suggestion");
      expect(formatted.content[0]!.text).toContain(
        "Please provide a descriptive prompt",
      );
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
