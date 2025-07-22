# gpt-image-1 MCP

[![npm version](https://badge.fury.io/js/@napolab/gpt-image-1-mcp.svg)](https://badge.fury.io/js/@napolab/gpt-image-1-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenAI](https://img.shields.io/badge/OpenAI-gpt--image--1-blue.svg)](https://openai.com/)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://naporin0624.github.io/gpt-image-1-mcp/)

MCP server for AI-powered image generation using OpenAI's gpt-image-1 model with advanced text rendering and native transparency support.

## Features

- **Advanced text rendering with gpt-image-1** - Crisp, legible typography and logos in generated images
- **Native transparency support** - Built-in transparent background without post-processing
- **Multi-format output (PNG, JPEG, WebP)** - Flexible format options with optimized compression
- **Matching file extensions** - Saved images now use the requested output format
- **Flexible dimensions and aspect ratios** - Square (1024×1024), landscape (1536×1024), and portrait (1024×1536)
- **Batch image editing capabilities** - Process multiple images with parallel processing
- **Token-optimized MCP responses** - Efficient response formats for MCP protocol limits

## Installation

### Recommended: Using npx

```json
{
  "mcpServers": {
    "gpt-image-1-mcp": {
      "command": "npx",
      "args": ["@napolab/gpt-image-1-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-api-key"
      }
    }
  }
}
```

### Alternative: Local Installation

```bash
npm install -g @napolab/gpt-image-1-mcp
```

### Claude Desktop Configuration

Configure in `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "gpt-image-1-mcp": {
      "command": "npx",
      "args": ["@napolab/gpt-image-1-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-api-key"
      }
    }
  }
}
```

## Configuration

### Environment Variables

| Variable                | Required | Default              | Description                    |
| ----------------------- | -------- | -------------------- | ------------------------------ |
| `OPENAI_API_KEY`        | Yes      | -                    | Your OpenAI API key            |
| `DEFAULT_OUTPUT_DIR`    | No       | `./generated_images` | Default output directory       |
| `DEFAULT_IMAGE_SIZE`    | No       | `1024x1024`          | Default image dimensions       |
| `DEFAULT_IMAGE_QUALITY` | No       | `standard`           | Default quality (standard/hd)  |
| `DEFAULT_OUTPUT_FORMAT` | No       | `png`                | Default format (png/jpeg/webp) |

## Available Tools

### generate-image

Generate images using gpt-image-1 with advanced text rendering and superior instruction following.

**Parameters:**

| Parameter          | Type    | Required | Default              | Description                          |
| ------------------ | ------- | -------- | -------------------- | ------------------------------------ |
| `prompt`           | string  | Yes      | -                    | Image description (English only)     |
| `aspect_ratio`     | string  | No       | `square`             | "square", "landscape", or "portrait" |
| `quality`          | string  | No       | `standard`           | "standard" or "hd"                   |
| `output_directory` | string  | No       | `./generated_images` | Directory to save the image          |
| `filename`         | string  | No       | -                    | Custom filename                      |
| `save_to_file`     | boolean | No       | `true`               | Whether to save locally              |
| `include_base64`   | boolean | No       | `false`              | Include base64 in response           |

**Example:**

```typescript
await client.callTool("generate-image", {
  prompt: "A serene Japanese garden with cherry blossoms",
  aspect_ratio: "landscape",
  quality: "hd",
});
```

### edit-image

Edit existing images with AI-powered modifications including inpainting, outpainting, style transfer, and background changes.

**Parameters:**

| Parameter              | Type    | Required | Default | Description                                   |
| ---------------------- | ------- | -------- | ------- | --------------------------------------------- |
| `source_image`         | object  | Yes      | -       | Image input (URL, base64, or local file)      |
| `edit_prompt`          | string  | Yes      | -       | Description of desired changes (English only) |
| `edit_type`            | string  | Yes      | -       | Type of edit to perform                       |
| `strength`             | number  | No       | `0.8`   | Edit strength (0.0 to 1.0)                    |
| `preserve_composition` | boolean | No       | `true`  | Maintain original composition                 |
| `output_format`        | string  | No       | `png`   | Output format                                 |

**Edit Types:**

- `inpaint` - Fill in or modify specific areas
- `outpaint` - Extend image beyond boundaries
- `background_change` - Replace or modify background
- `style_transfer` - Apply artistic styles
- `object_removal` - Remove unwanted objects
- `variation` - Create variations of original

**Example:**

```typescript
await client.callTool("edit-image", {
  source_image: {
    type: "local",
    value: "/path/to/image.jpg",
  },
  edit_prompt: "Add a sunset sky background",
  edit_type: "background_change",
});
```

### batch-edit

Apply the same edit to multiple images efficiently with parallel processing.

**Parameters:**

| Parameter        | Type   | Required | Default | Description                     |
| ---------------- | ------ | -------- | ------- | ------------------------------- |
| `images`         | array  | Yes      | -       | Array of image inputs           |
| `edit_prompt`    | string | Yes      | -       | Edit description (English only) |
| `edit_type`      | string | Yes      | -       | Type of edit to apply           |
| `batch_settings` | object | No       | -       | Batch processing configuration  |

**Example:**

```typescript
await client.callTool("batch-edit", {
  images: [
    { type: "local", value: "/path/to/image1.jpg" },
    { type: "local", value: "/path/to/image2.jpg" },
  ],
  edit_prompt: "Apply vintage sepia filter",
  edit_type: "style_transfer",
});
```

## Usage Examples

### Basic Image Generation

```typescript
// Generate a simple image
const result = await client.callTool("generate-image", {
  prompt: "A modern minimalist logo design",
  aspect_ratio: "square",
  quality: "hd",
});

console.log("Generated image:", result.data.file_path);
```

### Advanced Options

```typescript
// Generate with all parameters
const result = await client.callTool("generate-image", {
  prompt: "Professional product photography of a smartphone",
  aspect_ratio: "portrait",
  quality: "hd",
  output_directory: "./product_images",
  filename: "smartphone_hero",
  output_format: "png",
  include_base64: true,
});
```

// Output file will be saved as smartphone_hero.png

### Image Editing

```typescript
// Generate base image
const baseImage = await client.callTool("generate-image", {
  prompt: "A mountain landscape",
  aspect_ratio: "landscape",
});

// Edit the generated image
const editedImage = await client.callTool("edit-image", {
  source_image: {
    type: "local",
    value: baseImage.data.file_path,
  },
  edit_prompt: "Add dramatic storm clouds",
  edit_type: "background_change",
  strength: 0.7,
});
```

### Batch Processing

```typescript
// Process multiple images
const result = await client.callTool("batch-edit", {
  images: [
    { type: "local", value: "image1.jpg" },
    { type: "local", value: "image2.jpg" },
    { type: "local", value: "image3.jpg" },
  ],
  edit_prompt: "Apply Instagram-style filter",
  edit_type: "style_transfer",
  batch_settings: {
    max_concurrent: 3,
    error_handling: "continue_on_error",
  },
});
```

## Development

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Type checking
npm run typecheck
```

### Building

```bash
# Build for production
npm run build

# Development mode with hot reload
npm run dev
```

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [Documentation](https://naporin0624.github.io/gpt-image-1-mcp/) - Full documentation and examples
- [GitHub Issues](https://github.com/naporin0624/gen-image-mcp/issues)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/docs)
