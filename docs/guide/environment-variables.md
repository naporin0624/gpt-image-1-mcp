# Environment Variables

Configure gpt-image-1 MCP server behavior through environment variables in your MCP client configuration.

## Overview

Environment variables are set in the MCP client configuration (e.g., Claude Desktop's `config.json`) to customize:

- **API Credentials**: OpenAI API key and authentication settings
- **File Management**: Output directories and file handling
- **Performance Tuning**: Request timeouts and retry settings

## Required Variables

### OpenAI API Key

**`OPENAI_API_KEY`** (Required)

- **Description**: Your OpenAI API key for accessing gpt-image-1 model
- **Type**: String
- **Format**: `sk-...` (starts with "sk-")

## Optional Variables

### OpenAI API Settings

**`OPENAI_MAX_RETRIES`** (Optional)

- **Description**: Maximum number of retry attempts for OpenAI API requests
- **Type**: Integer
- **Default**: `3`
- **Impact**: Higher values increase reliability but may slow down error responses

**`OPENAI_API_TIMEOUT`** (Optional)

- **Description**: Timeout for OpenAI API requests in milliseconds
- **Type**: Integer
- **Default**: `120000` (2 minutes)
- **Impact**: Higher values allow longer operations but may cause client timeouts

### File Management

**`DEFAULT_OUTPUT_DIR`** (Optional)

- **Description**: Default directory for saving generated images
- **Type**: String (relative or absolute path)
- **Default**: `./generated_images`
- **Impact**: Changes where images are saved by default

**`MAX_FILE_SIZE_MB`** (Optional)

- **Description**: Maximum file size limit in megabytes
- **Type**: Integer
- **Default**: `50`
- **Impact**: Larger values allow bigger images but consume more storage

**`ENABLE_FILE_OUTPUT`** (Optional)

- **Description**: Enable file output functionality
- **Type**: Boolean (`"true"`, `"false"`)
- **Default**: `"true"`
- **Impact**: When `"false"`, images are only returned in responses, not saved to disk

**`KEEP_FILES_DAYS`** (Optional)

- **Description**: Number of days to keep generated files before auto-cleanup
- **Type**: Integer
- **Default**: `30`
- **Impact**: Lower values save storage space but remove files sooner

### Internal Variables

**`PACKAGE_VERSION`** (Automatically set)

- **Description**: Package version string (set automatically by build process)
- **Type**: String
- **Note**: Do not set manually

## MCP Configuration Examples

### Basic Setup

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

### Development Environment

```json
{
  "mcpServers": {
    "gpt-image-1-mcp": {
      "command": "npx",
      "args": ["@napolab/gpt-image-1-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-development-key",
        "DEFAULT_OUTPUT_DIR": "./dev_images",
        "MAX_FILE_SIZE_MB": "25",
        "KEEP_FILES_DAYS": "7"
      }
    }
  }
}
```

### Production Environment

```json
{
  "mcpServers": {
    "gpt-image-1-mcp": {
      "command": "npx",
      "args": ["@napolab/gpt-image-1-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-production-key",
        "DEFAULT_OUTPUT_DIR": "/app/images",
        "MAX_FILE_SIZE_MB": "100",
        "KEEP_FILES_DAYS": "30",
        "OPENAI_MAX_RETRIES": "5",
        "OPENAI_API_TIMEOUT": "180000"
      }
    }
  }
}
```

### High-Performance Setup

```json
{
  "mcpServers": {
    "gpt-image-1-mcp": {
      "command": "npx",
      "args": ["@napolab/gpt-image-1-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-key",
        "DEFAULT_OUTPUT_DIR": "/fast-storage/images",
        "MAX_FILE_SIZE_MB": "200",
        "OPENAI_MAX_RETRIES": "2",
        "OPENAI_API_TIMEOUT": "60000"
      }
    }
  }
}
```

### Memory-Optimized Setup

```json
{
  "mcpServers": {
    "gpt-image-1-mcp": {
      "command": "npx",
      "args": ["@napolab/gpt-image-1-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-key",
        "ENABLE_FILE_OUTPUT": "false"
      }
    }
  }
}
```

## Implementation Details

### How Environment Variables Are Used

The MCP server loads environment variables during initialization:

```typescript
// OpenAI client configuration
this.client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES ?? "3"),
  timeout: parseInt(process.env.OPENAI_API_TIMEOUT ?? "120000"),
});

// File manager configuration
this.fileManager = new FileManager({
  defaultOutputDir: process.env.DEFAULT_OUTPUT_DIR ?? "./generated_images",
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_MB ?? "50") * 1024 * 1024,
  enableFileOutput: process.env.ENABLE_FILE_OUTPUT !== "false",
  autoCleanupDays: parseInt(process.env.KEEP_FILES_DAYS ?? "30"),
});
```

### Validation

The server validates required variables on startup:

```typescript
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}
```

## Security Considerations

### API Key Security

- **Never commit API keys to version control**
- **Use environment-specific keys**
- **Rotate keys regularly**
- **Restrict API key permissions**

### MCP Configuration Security

```json
{
  "mcpServers": {
    "gpt-image-1-mcp": {
      "command": "npx",
      "args": ["@napolab/gpt-image-1-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-key"
      }
    }
  }
}
```

⚠️ **Important**: The MCP configuration file may contain sensitive information. Ensure proper file permissions:

```bash
chmod 600 config.json
```

## Troubleshooting

### Common Issues

#### API Key Not Found

```
Error: OPENAI_API_KEY environment variable is required
```

**Solution**: Add `OPENAI_API_KEY` to the `env` section of your MCP configuration

#### Invalid API Key Format

```
Error: OpenAI API authentication failed
```

**Solution**: Ensure the key starts with "sk-" and is valid

#### Permission Denied

```
Error: Cannot write to output directory
```

**Solution**: Check directory permissions and `DEFAULT_OUTPUT_DIR` setting

#### File Size Limit Exceeded

```
Error: File size exceeds maximum limit
```

**Solution**: Increase `MAX_FILE_SIZE_MB` value in your MCP configuration

### Debugging Configuration

To verify your configuration is working:

1. Check MCP server logs for environment variable loading
2. Test with a simple image generation request
3. Verify file output directory is created (if `ENABLE_FILE_OUTPUT` is `"true"`)

## Next Steps

- [Getting Started](/guide/getting-started.md) - Basic server setup
- [MCP Configuration](/guide/mcp-configuration.md) - Complete client configuration
- [API Reference](/api/tools.md) - Tool documentation
- [Examples](/examples/basic-usage.md) - Usage examples