# MCP Configuration

Configure gpt-image-1 MCP with various MCP-compatible clients including Claude Desktop, Cline, and other Model Context Protocol implementations.

## Overview

The Model Context Protocol (MCP) enables gpt-image-1 to integrate with various AI clients and applications. This guide covers:

- **Client Configuration**: Setting up different MCP clients
- **Server Configuration**: Configuring the MCP server
- **Authentication**: Managing API keys and credentials
- **Advanced Settings**: Performance tuning and customization

## Quick Start

### Basic Configuration

Add the server to your MCP client configuration:

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/@napolab/gpt-image-1-mcp-mcp/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-api-key-here"
      }
    }
  }
}
```

## Client-Specific Configuration

### Claude Desktop

Configure in `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "node",
      "args": ["/path/to/@napolab/gpt-image-1-mcp-mcp/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-api-key"
      }
    }
  }
}
```

### Cline (VS Code Extension)

Configure in VS Code settings or `.vscode/settings.json`:

```json
{
  "cline.mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "node",
      "args": ["/path/to/@napolab/gpt-image-1-mcp-mcp/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-api-key"
      }
    }
  }
}
```

### Custom MCP Client

For custom implementations, use the standard MCP protocol:

```typescript
import { MCPClient } from "@modelcontextprotocol/sdk";

const client = new MCPClient({
  name: "@napolab/gpt-image-1-mcp",
  version: "1.0.0",
});

await client.connect({
  command: "node",
  args: ["/path/to/@napolab/gpt-image-1-mcp-mcp/dist/index.js"],
  env: {
    OPENAI_API_KEY: "sk-your-openai-api-key",
  },
});
```

## Configuration Options

### Basic Settings

#### Server Path Configuration

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "cwd": "/path/to/project/root"
    }
  }
}
```

#### Development Mode

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/path/to/@napolab/gpt-image-1-mcp-mcp"
    }
  }
}
```

### Environment Variables

#### Required Variables

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-api-key"
      }
    }
  }
}
```

#### Optional Configuration

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-api-key",
        "DEFAULT_IMAGE_QUALITY": "hd",
        "DEFAULT_IMAGE_SIZE": "landscape",
        "DEFAULT_STYLE": "vivid",
        "AUTO_TRANSLATE_JAPANESE": "true",
        "DEFAULT_OUTPUT_DIRECTORY": "/path/to/images",
        "RATE_LIMIT_REQUESTS_PER_MINUTE": "50"
      }
    }
  }
}
```

### Advanced Configuration

#### Performance Tuning

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "node",
      "args": ["--max-old-space-size=4096", "/path/to/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-api-key",
        "ENABLE_RESULT_CACHING": "true",
        "CACHE_DURATION_HOURS": "24",
        "API_TIMEOUT_SECONDS": "120"
      }
    }
  }
}
```

#### Debugging Configuration

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "node",
      "args": ["--inspect=9229", "/path/to/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-api-key",
        "LOG_LEVEL": "debug",
        "ENABLE_REQUEST_LOGGING": "true"
      }
    }
  }
}
```

## Multiple Instances

### Different Configurations

Run multiple instances with different settings:

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp-hd": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-api-key",
        "DEFAULT_IMAGE_QUALITY": "hd",
        "DEFAULT_OUTPUT_DIRECTORY": "/path/to/hd-images"
      }
    },
    "@napolab/gpt-image-1-mcp-standard": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-api-key",
        "DEFAULT_IMAGE_QUALITY": "standard",
        "DEFAULT_OUTPUT_DIRECTORY": "/path/to/standard-images"
      }
    }
  }
}
```

### Environment-Specific Configuration

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp-dev": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-dev-api-key",
        "LOG_LEVEL": "debug",
        "RATE_LIMIT_REQUESTS_PER_MINUTE": "10"
      }
    },
    "@napolab/gpt-image-1-mcp-prod": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-prod-api-key",
        "LOG_LEVEL": "warn",
        "RATE_LIMIT_REQUESTS_PER_MINUTE": "100"
      }
    }
  }
}
```

## Security Configuration

### API Key Management

#### Environment File Method

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "${OPENAI_API_KEY}"
      }
    }
  }
}
```

Then set the environment variable:

```bash
export OPENAI_API_KEY=sk-your-api-key
```

#### Secure File Permissions

```bash
# Secure your configuration file
chmod 600 ~/.config/mcp/config.json
```

### Network Security

#### Localhost Only

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-api-key",
        "BIND_ADDRESS": "127.0.0.1"
      }
    }
  }
}
```

## Docker Configuration

### Docker Compose

```yaml
version: "3.8"
services:
  mcp-server:
    build: .
    environment:
      - OPENAI_API_KEY=sk-your-api-key
      - DEFAULT_IMAGE_QUALITY=hd
    volumes:
      - ./images:/app/images
    ports:
      - "3000:3000"
```

### MCP Client Configuration for Docker

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-e",
        "OPENAI_API_KEY=sk-your-api-key",
        "-v",
        "/host/images:/app/images",
        "@napolab/gpt-image-1-mcp-mcp"
      ]
    }
  }
}
```

## Validation and Testing

### Configuration Validation

Test your configuration:

```bash
# Test the server directly
node dist/index.js

# Test with MCP client
mcp-client test @napolab/gpt-image-1-mcp
```

### Health Check

```typescript
// Health check endpoint
await client.callTool("health-check", {});
```

### Tool Verification

```typescript
// List available tools
const tools = await client.listTools();
console.log("Available tools:", tools);

// Test image generation
const result = await client.callTool("generate-image", {
  prompt: "Test image",
  quality: "standard",
});
```

## Troubleshooting

### Common Configuration Issues

#### Server Not Starting

```bash
Error: Cannot find module '/path/to/dist/index.js'
```

**Solution**: Ensure the path is absolute and the file exists:

```bash
# Build the project first
npm run build

# Verify the file exists
ls -la /absolute/path/to/dist/index.js
```

#### API Key Issues

```bash
Error: Invalid API key
```

**Solution**: Verify your OpenAI API key:

```bash
# Test API key
curl -H "Authorization: Bearer sk-your-api-key" \
  https://api.openai.com/v1/models
```

#### Permission Denied

```bash
Error: EACCES: permission denied
```

**Solution**: Check file permissions:

```bash
chmod +x /path/to/dist/index.js
```

### Debug Configuration

#### Enable Verbose Logging

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-api-key",
        "LOG_LEVEL": "debug",
        "ENABLE_REQUEST_LOGGING": "true"
      }
    }
  }
}
```

#### Test Connection

```typescript
// Test MCP connection
try {
  await client.connect();
  console.log("Connected successfully");
} catch (error) {
  console.error("Connection failed:", error);
}
```

## Best Practices

### Configuration Management

1. **Use Absolute Paths**: Always use absolute paths for server commands
2. **Environment Variables**: Store sensitive data in environment variables
3. **Version Control**: Don't commit API keys to version control
4. **Documentation**: Document your configuration choices

### Performance Optimization

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "node",
      "args": [
        "--max-old-space-size=4096",
        "--optimize-for-size",
        "/path/to/dist/index.js"
      ],
      "env": {
        "OPENAI_API_KEY": "sk-your-api-key",
        "ENABLE_RESULT_CACHING": "true",
        "RATE_LIMIT_REQUESTS_PER_MINUTE": "50"
      }
    }
  }
}
```

### Monitoring and Logging

```json
{
  "mcpServers": {
    "@napolab/gpt-image-1-mcp": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-api-key",
        "LOG_LEVEL": "info",
        "LOG_FILE_PATH": "/var/log/mcp-server.log",
        "ENABLE_REQUEST_LOGGING": "false"
      }
    }
  }
}
```

## Platform-Specific Notes

### macOS

```bash
# Configuration location
~/Library/Application Support/Claude/claude_desktop_config.json

# Example path
/Users/username/projects/@napolab/gpt-image-1-mcp-mcp/dist/index.js
```

### Windows

```bash
# Configuration location
%APPDATA%\Claude\claude_desktop_config.json

# Example path (use forward slashes)
C:/Users/username/projects/@napolab/gpt-image-1-mcp-mcp/dist/index.js
```

### Linux

```bash
# Configuration location
~/.config/claude/claude_desktop_config.json

# Example path
/home/username/projects/@napolab/gpt-image-1-mcp-mcp/dist/index.js
```

## Next Steps

- [Getting Started](/guide/getting-started.md) - Basic setup guide
- [Environment Variables](/guide/environment-variables.md) - Detailed configuration options
- [API Reference](/api/tools.md) - Available tools and methods
- [Examples](/examples/) - Usage examples
