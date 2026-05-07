# Changelog

All notable changes to gpt-image MCP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-05-07

### Added

- **gpt-image-2 model support** alongside existing gpt-image-1
  - 2K aspect ratio presets: `square_2k` (2048×2048), `landscape_2k` (2048×1152), `portrait_2k` (1152×2048)
  - `aspect_ratio: "auto"` lets the API choose dimensions
  - Multi-image input for `edit-image` (up to 10 sources for compositions)
  - `quality: "auto"` enum value
- **Discriminated union schemas** (`z.discriminatedUnion("model", ...)`) for `generate-image`, `edit-image`, and `batch-edit`
  - `model` defaults to `gpt-image-2` when omitted (via `z.preprocess`)
- **Auto-generated MCP `inputSchema`** from Zod via `zod-to-json-schema`
  - `withOptionalModel` helper drops `model` from `required[]` so clients treat it as optional
- `BATCH_TO_EDIT_TYPE` mapping table for batch-edit's narrower enum

### Changed

- **Package renamed** from `@napolab/gpt-image-1-mcp` to `@napolab/gpt-image-mcp`
- **Bin entry renamed** from `gpt-image-1-mcp` to `gpt-image-mcp`
- `mapLegacyQuality` is now applied inside `OpenAIService.generateGpt1` instead of the request handler

### Migration

- Existing tools that omit `model` continue to work and now use `gpt-image-2` by default
- To pin to gpt-image-1, pass `"model": "gpt-image-1"` explicitly
- Update MCP client config: replace `"@napolab/gpt-image-1-mcp"` with `"@napolab/gpt-image-mcp"`

## [1.0.0] - 2025-01-15

### Added

- **Initial release** of gpt-image-1 MCP server
- **Image generation** using OpenAI's gpt-image-1 model
  - Advanced text rendering with crisp typography
  - Native transparency support
  - Multiple aspect ratios (square, landscape, portrait)
  - HD and standard quality options
  - Multiple output formats (PNG, JPEG, WebP)
- **Image editing capabilities**
  - Inpainting and outpainting
  - Background changes and object removal
  - Style transfer and variations
  - Discriminated union image inputs for flexible source handling
- **Batch processing**
  - Parallel image editing with configurable concurrency
  - Progress tracking and error handling
  - Batch settings for production workflows
- **MCP protocol integration**
  - Token-optimized response formats
  - Optional base64 data inclusion
  - Comprehensive error handling
- **File management**
  - Flexible naming strategies (timestamp, prompt, custom, hash)
  - Directory organization options
  - Automatic directory creation
- **Configuration system**
  - Environment variable configuration
  - Default settings for common use cases
  - Rate limiting and caching options
- **Input validation**
  - Zod-based schema validation
  - English-only prompt validation for optimal results
  - Comprehensive error messages
- **Comprehensive documentation**
  - API reference with detailed examples
  - Integration guides for different MCP clients
  - Best practices and troubleshooting guides

### Technical Details

- **Dependencies**
  - `@modelcontextprotocol/sdk` ^0.5.0 for MCP protocol support
  - `openai` ^4.0.0 for API integration
  - `zod` ^3.23.0 for runtime validation
  - `fs-extra` ^11.3.0 for file operations
- **Development Setup**
  - TypeScript with strict mode
  - ESLint and Prettier for code quality
  - Vitest for testing
  - tsup for building
- **Build System**
  - ES modules support
  - Optimized bundle with tree shaking
  - Development hot reload with tsx

### Architecture

- **src/index.ts** - MCP server entry point
- **src/types/** - TypeScript type definitions
- **src/utils/** - Core utilities for OpenAI integration, validation, and file management
- **tests/** - Comprehensive test suite

### Performance

- **Token optimization** - Responses optimized for MCP protocol limits
- **Caching support** - Optional result caching for improved performance
- **Rate limiting** - Configurable request throttling
- **Memory efficiency** - Optimized for handling large images and batch operations

---

## Development Notes

This changelog will be updated with each release. For unreleased changes, see the git commit history.

### Versioning Strategy

- **Major versions** (X.0.0) - Breaking changes to API or significant architectural changes
- **Minor versions** (X.Y.0) - New features, tool additions, or significant enhancements
- **Patch versions** (X.Y.Z) - Bug fixes, documentation updates, and minor improvements

### Upcoming Features

Planned features for future releases:

- Additional image formats support
- Enhanced batch processing capabilities
- Advanced editing options
- Performance optimizations
- Extended MCP client compatibility
