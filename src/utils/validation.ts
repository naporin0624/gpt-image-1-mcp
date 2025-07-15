/**
 * Text validation utilities
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
 * Validate that text is not empty
 * @param text - Text to validate
 * @param fieldName - Name of the field being validated (for error messages)
 * @throws ValidationError if text is empty
 */
export function validateText(text: string, fieldName: string = "text"): void {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new ValidationError(
      `${fieldName} cannot be empty.`,
      "EMPTY_TEXT",
      "Please provide a descriptive prompt.",
    );
  }
}

/**
 * Validate an array of text strings
 * @param texts - Array of texts to validate
 * @param fieldName - Name of the field being validated
 */
export function validateTextArray(
  texts: string[],
  fieldName: string = "text",
): void {
  if (!Array.isArray(texts)) {
    throw new ValidationError(
      `${fieldName} must be an array.`,
      "INVALID_TYPE",
      "Provide an array of text strings.",
    );
  }

  texts.forEach((text, index) => {
    validateText(text, `${fieldName}[${index}]`);
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

Please check your input and try again.`,
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
