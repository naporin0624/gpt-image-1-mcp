# Getting Started

This guide will help you set up and start using GPT Image 1 MCP in your projects.

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- pnpm package manager
- An OpenAI API key with access to gpt-image-1 and GPT-4o Vision
- A Model Context Protocol (MCP) compatible client

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/naporin0624/gen-image-mcp.git
cd gen-image-mcp
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit the `.env` file and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

### 4. Build the Project

```bash
pnpm build
```

## Running the Server

### Development Mode

For development with hot reload:

```bash
pnpm dev
```

### Production Mode

For production use:

```bash
pnpm start
```

## MCP Client Configuration

Add the server to your MCP client configuration:

```json
{
  "mcpServers": {
    "gpt-image-1-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/gen-image-mcp/dist/index.js"],
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
- `analyze-image` - Analyze images with GPT-4o Vision
- `translate-prompt` - Translate Japanese prompts to English

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
- Explore [Vision Analysis](/guide/vision-analysis) capabilities
- Configure [Environment Variables](/guide/environment-variables)
- Check out [Examples](/examples/basic-usage)

## Troubleshooting

### Common Issues

**API Key Not Working**

- Ensure your API key has access to gpt-image-1 and GPT-4o Vision
- Check that the key is correctly set in your `.env` file

**MCP Connection Failed**

- Verify the absolute path to the built `index.js` file
- Ensure the server is built (`pnpm build`)
- Check MCP client logs for errors

**Image Generation Failed**

- Verify your OpenAI account has sufficient credits
- Check rate limits on your API key
- Review error messages in the response

For more help, see our [troubleshooting guide](/guide/troubleshooting) or [open an issue](https://github.com/naporin0624/gen-image-mcp/issues).
