# MCP Tools Overview

GPT Image 1 MCP provides tools for image generation through the Model Context Protocol.

## Available Tools

### generate-image

Generate images using OpenAI's gpt-image-1 model.

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

### edit-image

Edit existing images with AI-powered modifications including inpainting, outpainting, and style transfer.

**Parameters:**

- `source_image` (string, required): Image URL or base64 encoded image
- `edit_prompt` (string, required): Description of desired changes
- `edit_type` (string, required): Type of edit ("inpaint", "outpaint", "variation", "style_transfer", etc.)
- `strength` (number): Edit strength (0.0 = minimal, 1.0 = maximum)

**Returns:**

- Edited image file path
- Metadata about the edited image

### batch-edit

Apply the same edit to multiple images efficiently.

**Parameters:**

- `image_urls` (string[], required): Array of image URLs to edit
- `edit_prompt` (string, required): Edit description to apply to all images
- `edit_type` (string, required): Type of edit to apply
- `batch_settings` (object): Configuration for batch processing

**Returns:**

- Array of edited image file paths
- Processing status for each image

## Image Analysis

For image analysis capabilities, LLM clients can directly read image files using the file paths returned by the generation and editing tools. This provides better separation of concerns and allows the LLM to use its native vision capabilities.

## Note on Translation

For non-English prompts, it's recommended to use your LLM client to translate prompts to English before using the image generation tools, as gpt-image-1 works best with English input.

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
