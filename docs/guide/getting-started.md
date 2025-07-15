# Getting Started

This guide will help you set up and start using gpt-image-1 MCP in your projects.

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- An OpenAI API key with access to gpt-image-1
- A Model Context Protocol (MCP) compatible client

## Installation

### Recommended: Using npx (No Installation Required)

```bash
# Use directly with npx - no installation needed
npx @napolab/gpt-image-1-mcp
```

### Alternative: Global Installation

```bash
# Install globally
npm install -g @napolab/gpt-image-1-mcp

# Then run
@napolab/gpt-image-1-mcp
```

### Configure Environment

Set your OpenAI API key as an environment variable:

```bash
# Linux/macOS
export OPENAI_API_KEY="sk-your-api-key-here"

# Windows (Command Prompt)
set OPENAI_API_KEY=sk-your-api-key-here

# Windows (PowerShell)
$env:OPENAI_API_KEY="sk-your-api-key-here"
```

## Running the Server

### Using npx (Recommended)

```bash
# Run with npx (automatically uses latest version)
npx @napolab/gpt-image-1-mcp
```

### Using Global Installation

```bash
# If installed globally
@napolab/gpt-image-1-mcp
```

### Development Mode (For Contributors)

For development with hot reload:

```bash
git clone https://github.com/naporin0624/gen-image-mcp.git
cd gen-image-mcp
pnpm install
pnpm dev
```

## MCP Client Configuration

Add the server to your MCP client configuration:

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "npx",
      "args": ["@napolab/gpt-image-1-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-api-key-here"
      }
    }
  }
}
```

## Verify Installation

Once configured, your MCP client should show the following available tools:

- `generate-image` - Generate images using OpenAI gpt-image-1
- `edit-image` - Edit and enhance generated images
- `batch-edit` - Apply edits to multiple images

## First Image Generation

Try generating your first image:

```typescript
// Using the MCP client
await client.callTool("generate-image", {
  prompt: "A serene Japanese garden with cherry blossoms",
  aspect_ratio: "landscape",
  quality: "hd",
});
```

## Next Steps

- Learn about [Image Generation](/guide/image-generation) features
- Understand multilingual input patterns with LLM translation
- Configure [Environment Variables](/guide/environment-variables)
- Check out [Examples](/examples/basic-usage)

## Troubleshooting

### Common Issues

**API Key Not Working**

- Ensure your API key has access to gpt-image-1 and GPT-4o Vision
- Check that the key is correctly set as an environment variable

**MCP Connection Failed**

- Ensure npx can access the @napolab/gpt-image-1-mcp package
- Check that Node.js 18+ is installed
- Verify your internet connection for npm package downloads
- Check MCP client logs for errors

**Image Generation Failed**

- Verify your OpenAI account has sufficient credits
- Check rate limits on your API key
- Review error messages in the response

For more help, see our [troubleshooting guide](/guide/troubleshooting) or [open an issue](https://github.com/naporin0624/gen-image-mcp/issues).
