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
  - icon: 🖼️
    title: Multiple Formats
    details: Support for PNG, JPEG, WebP with native transparency. Square, landscape, and portrait aspect ratios
  - icon: ⚡
    title: MCP Protocol
    details: Seamless integration with Model Context Protocol enabled applications with optimized response formats
---

## Quick Start

### Prerequisites

1. **Get OpenAI API Key**
   - Sign up at [OpenAI Platform](https://platform.openai.com/)
   - Navigate to API Keys section
   - Create a new API key
   - Ensure you have credits available for gpt-image-1 model

### Configuration

Add to your MCP client configuration (e.g., Claude Desktop's `config.json`):

```json
{
  "mcpServers": {
    "gpt-image-1-mcp": {
      "command": "npx",
      "args": ["@napolab/gpt-image-1-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-api-key-here"
      }
    }
  }
}
```

### Usage

- Use the `generate-image` tool in your MCP client
- Try: "Create a vibrant sunset over mountains with 'Adventure Awaits' text"

## Why gpt-image-1 MCP?

This MCP server bridges the gap between AI-powered image generation and modern development workflows. Whether you're building creative applications, analyzing visual content, or exploring AI capabilities, our server provides the tools you need.

### Key Features

- **gpt-image-1 Model**: Latest OpenAI model with superior instruction following and spatial reasoning
- **Advanced Text Rendering**: Crisp, legible typography and logos in generated images
- **Native Transparency**: Built-in transparent background support without post-processing
- **Multi-modal Editing**: Text-to-image, image-to-image, inpainting, and outpainting in one endpoint
- **Multiple Formats**: PNG, JPEG, and WebP output with optimized compression
- **Flexible Dimensions**: Square (1024×1024), landscape (1536×1024), and portrait (1024×1536)
- **Token-Optimized**: Efficient MCP responses with optional base64 data inclusion

Ready to start generating amazing images? [Get Started →](/guide/getting-started)
