/**
 * English-only validation utilities
 */

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public suggestion?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validate that text contains only English characters
 * @param text - Text to validate
 * @param fieldName - Name of the field being validated (for error messages)
 * @throws ValidationError if text contains non-English characters
 */
export function validateEnglishOnly(
  text: string,
  fieldName: string = "text",
): void {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new ValidationError(
      `${fieldName} cannot be empty.`,
      "EMPTY_TEXT",
      "Please provide a descriptive English prompt.",
    );
  }

  // Check for CJK (Chinese, Japanese, Korean) characters
  const cjkRegex =
    /[\u1100-\u11FF\u3040-\u30FF\u3130-\u318F\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7AF]/;

  if (cjkRegex.test(text)) {
    throw new ValidationError(
      `${fieldName} only accepts English text. Please translate your prompt to English first.`,
      "NON_ENGLISH_TEXT",
      "Use your LLM to translate the prompt to English, then try again.",
    );
  }

  // Check for other non-Latin scripts (Arabic, Hebrew, Thai, etc.)
  const nonLatinRegex =
    /[\u0590-\u06FF\u0E00-\u0E7F\u1000-\u109F\u1200-\u137F]/;

  if (nonLatinRegex.test(text)) {
    throw new ValidationError(
      `${fieldName} only accepts English text. Please translate your prompt to English first.`,
      "NON_ENGLISH_TEXT",
      "Use your LLM to translate the prompt to English, then try again.",
    );
  }
}

/**
 * Validate an array of English-only text strings
 * @param texts - Array of texts to validate
 * @param fieldName - Name of the field being validated
 */
export function validateEnglishOnlyArray(
  texts: string[],
  fieldName: string = "text",
): void {
  if (!Array.isArray(texts)) {
    throw new ValidationError(
      `${fieldName} must be an array.`,
      "INVALID_TYPE",
      "Provide an array of English text strings.",
    );
  }

  texts.forEach((text, index) => {
    validateEnglishOnly(text, `${fieldName}[${index}]`);
  });
}

/**
 * Format validation error for MCP response
 * @param error - ValidationError or generic Error
 * @returns Formatted error response
 */
export function formatValidationError(error: Error) {
  if (error instanceof ValidationError) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Validation Error: ${error.message}

💡 Suggestion: ${error.suggestion ?? "Please check your input and try again."}

📝 Example of correct usage:
- "A beautiful sunset over a mountain landscape"
- "Modern minimalist logo design with blue accents"
- "Portrait of a person reading a book by a window"

This tool only accepts English text to ensure optimal results. Use your LLM to translate non-English prompts before using this tool.`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `Error: ${error.message}`,
      },
    ],
    isError: true,
  };
}
