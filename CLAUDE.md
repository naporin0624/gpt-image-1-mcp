# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenAI gpt-image-1 MCP server with advanced image generation and editing capabilities. This TypeScript project provides an MCP server that:

- Generates images using OpenAI's gpt-image-1 model with advanced text rendering and instruction following
- Analyzes images using GPT-4o vision
- Supports image editing, inpainting, outpainting with native transparency support
- Supports batch editing operations
- Provides comprehensive input validation

## Development Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev          # Run with tsx (hot reload)
pnpm build        # Build TypeScript
pnpm start        # Run built version

# Testing
pnpm test         # Run tests once
pnpm test:watch   # Run tests in watch mode

# Code Quality
pnpm lint         # Run ESLint and Prettier checks
pnpm fmt          # Auto-fix code formatting
pnpm typecheck    # Type-check without emitting

# Specific linting
pnpm lint:eslint  # ESLint only
pnpm lint:prettier # Prettier only
```

## Architecture Overview

The project follows the structure defined in `features/mcp.yml`:

```
src/
├── index.ts              # MCP server entry point
├── types/
│   ├── image.ts         # gpt-image-1 related types
│   └── edit.ts          # Image editing types
└── utils/
    ├── validation.ts    # Input validation
    ├── openai.ts       # OpenAI API integration
    ├── fileManager.ts  # File management utilities
    └── imageUtils.ts   # Image processing utilities
```

## Key Implementation Details

### MCP Tools

1. **generate-image**: gpt-image-1 image generation with advanced text rendering and instruction following
2. **edit-image**: AI-powered image editing with inpainting, outpainting, style transfer, and transformations
3. **batch-edit**: Apply same edit to multiple images with parallel processing

**Note**: Variations are handled through edit-image with edit_type="variation"

**⚠️ Removed**: analyze-image tool has been removed. LLM clients can directly read images via file paths for analysis, providing better separation of concerns.

### Image Size Support (gpt-image-1)

- Square: 1024x1024 (1:1)
- Landscape: 1792x1024 (16:9) or 1536x1024
- Portrait: 1024x1792 (9:16) or 1024x1536

### Key gpt-image-1 Features

- **Advanced Text Rendering**: Crisp, legible typography and logos in images
- **Superior Instruction Following**: Inherits GPT-4o language understanding
- **Native Transparency**: Built-in transparent background support
- **Multi-modal Editing**: Text-to-image, image-to-image, inpainting, outpainting in one endpoint
- **Token-based Pricing**: More cost-effective for iterative workflows

### Response Structure Optimization

**Default Response (Optimized for MCP Token Limits):**

- Returns `file_path` and `metadata` only (< 1K tokens)
- No base64 data by default to avoid MCP response size limits
- Always includes image metadata (dimensions, format, size, timestamp)

**Optional Base64 Response:**

- Use `include_base64=true` parameter to include base64 data
- Automatically validates response size against MCP token limits (20K max)
- Returns warnings if image would exceed limits
- Fallbacks to file_path when size constraints prevent base64 inclusion

**Example Response Structure:**

```json
{
  "file_path": "/generated_images/image_20250715_051115.png",
  "metadata": {
    "width": 1024,
    "height": 1024,
    "format": "png",
    "size_bytes": 102400,
    "created_at": "2025-01-15T05:11:15Z"
  },
  "base64_image": "iVBORw0KGgoAAAA...", // Only when include_base64=true and size permits
  "warnings": ["Optional warnings about response size"]
}
```

### Environment Variables

Create a `.env` file based on `.env.example` with:

- `OPENAI_API_KEY` (required)
- `DEFAULT_IMAGE_SIZE`, `DEFAULT_IMAGE_QUALITY`, `DEFAULT_STYLE`
- `DEFAULT_OUTPUT_DIR` (default: "./generated_images")
- File management and validation settings

### Testing Strategy

- Unit tests for validation, image generation, and utilities
- Integration tests for API interactions
- E2E tests for complete workflows

## Migration from DALL-E

**gpt-image-1 Advantages over DALL-E 3:**

- Better prompt adherence and spatial reasoning
- Accurate text and logo rendering
- Native transparency and multiple output formats (PNG, JPEG, WebP)
- Integrated editing capabilities in single API calls
- Token-based pricing with cost optimization

## Security Note

⚠️ **IMPORTANT**: The `.mcp.json` file currently contains an exposed OpenAI API key. This should be moved to environment variables immediately. Never commit API keys to version control.

## Implementation Status

This is a newly initialized project with comprehensive planning in `features/mcp.yml`. The implementation follows these phases:

1. Core MCP server and OpenAI integration
2. Input validation and error handling
3. Vision analysis integration
4. Image editing and variation capabilities
5. Advanced features (batch processing, file management)
6. Documentation and polish

## Common Development Tasks

When implementing new features:

1. Follow the TypeScript strict mode configuration
2. Use Zod for runtime validation
3. Implement proper error handling with retry logic
4. Add comprehensive tests using Vitest
5. Ensure input validation is properly implemented and tested
