---
layout: home

hero:
  name: "GPT Image 1 MCP"
  text: "AI-Powered Image Generation"
  tagline: "Generate stunning images with OpenAI gpt-image-1 and analyze them with GPT-4o Vision through MCP"
  image:
    src: /images/hero.png
    alt: AI Image Generation
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View API
      link: /api/tools

features:
  - icon: 🎨
    title: OpenAI gpt-image-1 Integration
    details: Generate high-quality images with superior text rendering, transparency support, and advanced instruction following
  - icon: 👁️
    title: Vision Analysis
    details: Analyze images using GPT-4o Vision for detailed insights
  - icon: 🌏
    title: Japanese Support
    details: Automatic translation of Japanese prompts for optimal results
  - icon: ⚡
    title: MCP Protocol
    details: Seamless integration with Model Context Protocol enabled applications
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

## Why GPT Image 1 MCP?

This MCP server bridges the gap between AI-powered image generation and modern development workflows. Whether you're building creative applications, analyzing visual content, or exploring AI capabilities, our server provides the tools you need.

### Key Features

- **Multiple Aspect Ratios**: Support for square (1:1), landscape (16:9), and portrait (9:16) formats
- **Quality Options**: Choose between standard and HD quality for your specific needs
- **Style Variations**: Generate images in vivid or natural styles
- **Batch Generation**: Create multiple variations efficiently
- **Smart Translation**: Automatically translate Japanese prompts for better results

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
