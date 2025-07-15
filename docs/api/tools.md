# MCP Tools Overview

GPT Image 1 MCP provides several tools for image generation and analysis through the Model Context Protocol.

## Available Tools

### generate-image

Generate images using OpenAI's OpenAI gpt-image-1 model.

**Parameters:**

- `prompt` (string, required): Image description
- `aspect_ratio` (string): "square", "landscape", or "portrait"
- `quality` (string): "standard" or "hd"
- `style` (string): "vivid" or "natural"
- `output_directory` (string): Directory to save the image
- `filename` (string): Custom filename
- `save_to_file` (boolean): Whether to save locally

**Returns:**

- Image URL
- Local file path (if saved)
- Generation metadata

### analyze-image

Analyze images using GPT-4o Vision.

**Parameters:**

- `image_url` (string, required): URL of the image to analyze
- `analysis_type` (string): "general", "detailed", "artistic", or "technical"
- `questions` (string[]): Specific questions about the image

**Returns:**

- Analysis results
- Detected elements
- Answers to specific questions

### translate-prompt

Translate Japanese prompts to English for better OpenAI gpt-image-1 results.

**Parameters:**

- `japanese_prompt` (string, required): Japanese text to translate
- `context` (string): Translation context
- `preserve_technical_terms` (boolean): Keep technical terms unchanged

**Returns:**

- Translated English prompt
- Translation confidence score

## Tool Response Format

All tools follow a consistent response format:

```json
{
  "success": boolean,
  "data": {
    // Tool-specific data
  },
  "error": {
    "message": string,
    "code": string
  }
}
```

## Error Handling

Common error codes:

- `INVALID_PARAMS`: Invalid or missing parameters
- `API_ERROR`: OpenAI API error
- `RATE_LIMIT`: Rate limit exceeded
- `AUTH_ERROR`: Authentication failed

## Usage Examples

See the [Examples](/examples/basic-usage) section for detailed usage patterns.
