---
layout: home

hero:
  name: "gpt-image-1 MCP"
  text: "AI-Powered Image Generation"
  tagline: "Generate stunning images with OpenAI gpt-image-1 featuring advanced text rendering and native transparency through MCP"
  image:
    src: /images/hero.png
    alt: AI Image Generation
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View Tools
      link: /api/tools

features:
  - icon: 🎨
    title: gpt-image-1 Powered
    details: Advanced text rendering, native transparency, and superior instruction following with GPT-4o language understanding
  - icon: 🎯
    title: English-Optimized
    details: Optimized for English input with validation to ensure best quality. Use your LLM for translation when needed
  - icon: 🖼️
    title: Multiple Formats
    details: Support for PNG, JPEG, WebP with native transparency. Square, landscape, and portrait aspect ratios
  - icon: ⚡
    title: MCP Protocol
    details: Seamless integration with Model Context Protocol enabled applications with optimized response formats
---

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up your OpenAI API key
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run the MCP server
pnpm dev
```

## Why gpt-image-1 MCP?

This MCP server bridges the gap between AI-powered image generation and modern development workflows. Whether you're building creative applications, analyzing visual content, or exploring AI capabilities, our server provides the tools you need.

### Key Features

- **Advanced Text Rendering**: Crisp, legible typography and logos in generated images
- **Native Transparency**: Built-in transparent background support without post-processing
- **Multiple Formats**: PNG, JPEG, and WebP output with optimized compression
- **Flexible Dimensions**: Square (1024×1024), landscape (1536×1024), and portrait (1024×1536)
- **Style Control**: Choose between vivid and natural styles for different use cases
- **Token-Optimized**: Efficient MCP responses with optional base64 data inclusion

## Integration Example

```json
{
  "mcpServers": {
    "gpt-image-1-mcp": {
      "command": "node",
      "args": ["path/to/gpt-image-1-mcp/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Ready to start generating amazing images? [Get Started →](/guide/getting-started)
