# Getting Started

Add AI image generation and editing capabilities to your projects using the OpenAI gpt-image-1 MCP server.

## Overview

This MCP server provides the following capabilities:

- High-quality image generation using OpenAI gpt-image-1
- Advanced text rendering and logo generation
- Image editing and variation creation
- Batch processing for multiple image operations

## Installation

### Recommended: Using Claude MCP Command

```bash
$ claude mcp add gpt-image-1 -s user \
    -e OPENAI_API_KEY=your-api-key-here \
    -e DEFAULT_IMAGE_SIZE=square \
    -e DEFAULT_IMAGE_QUALITY=hd \
    -- npx @napolab/gpt-image-1-mcp
```

### Manual Configuration

Add the following to your MCP client configuration:

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "npx",
      "args": ["@napolab/gpt-image-1-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-api-key-here",
        "DEFAULT_IMAGE_SIZE": "square",
        "DEFAULT_IMAGE_QUALITY": "hd"
      }
    }
  }
}
```

### Development Setup

```bash
# Clone repository
git clone https://github.com/naporin0624/gen-image-mcp.git
cd gen-image-mcp
pnpm install
pnpm build
```

## Environment Variables

| Variable                | Required | Default              | Description                                    |
| ----------------------- | -------- | -------------------- | ---------------------------------------------- |
| `OPENAI_API_KEY`        | ✅       | -                    | OpenAI API key                                 |
| `DEFAULT_IMAGE_SIZE`    | ❌       | `square`             | Default image size (square/landscape/portrait) |
| `DEFAULT_IMAGE_QUALITY` | ❌       | `standard`           | Default image quality (standard/hd)            |
| `DEFAULT_OUTPUT_DIR`    | ❌       | `./generated_images` | Image save directory                           |
| `OPENAI_API_TIMEOUT`    | ❌       | `60000`              | API timeout (milliseconds)                     |
| `OPENAI_MAX_RETRIES`    | ❌       | `3`                  | Maximum retry attempts                         |

## Available Tools

After setup, the following tools will be available:

- **`generate-image`** - Generate images using gpt-image-1
- **`edit-image`** - Image editing, inpainting, and outpainting
- **`batch-edit`** - Apply edits to multiple images

## First Image Generation

```typescript
// Example usage with MCP client
await client.callTool("generate-image", {
  prompt: "A serene Japanese garden with cherry blossoms",
  aspect_ratio: "landscape",
  quality: "hd",
});
```

## Next Steps

- Learn detailed features in the [Image Generation Guide](/guide/image-generation)
- Check editing capabilities in the [Image Edit Guide](/guide/edit-image)
- Understand batch processing in the [Batch Edit Guide](/guide/batch-edit)
- Reference sample code in [Examples](/examples/basic-usage)

## Common Issues

**API Key Error**

- Verify gpt-image-1 and GPT-4o Vision access permissions
- Re-check environment variable configuration

**MCP Connection Error**

- Confirm Node.js 20+ installation
- Verify npx package access permissions
- Check MCP client logs

**Image Generation Error**

- Verify OpenAI account credit balance
- Check API key rate limits
- Review detailed error messages

Report issues at [GitHub Issues](https://github.com/naporin0624/gen-image-mcp/issues).
