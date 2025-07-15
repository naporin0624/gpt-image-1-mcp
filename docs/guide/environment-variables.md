# Environment Variables

GPT Image 1 MCP can be configured through environment variables to customize behavior, set defaults, and manage API credentials.

## Overview

Environment variables provide a flexible way to configure the MCP server without modifying code. They control:

- **API Credentials**: OpenAI API key and authentication
- **Default Settings**: Image quality, aspect ratios, and styles
- **Feature Toggles**: Enable/disable specific functionality
- **Performance Tuning**: Rate limiting and caching options
- **File Management**: Output directories and naming conventions

## Required Variables

### OpenAI API Key

**`OPENAI_API_KEY`** (Required)

- **Description**: Your OpenAI API key for accessing OpenAI gpt-image-1 and GPT-4o Vision
- **Format**: `sk-...` (starts with "sk-")
- **Example**: `sk-1234567890abcdef1234567890abcdef`

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

## Image Generation Settings

### Quality Settings

**`DEFAULT_IMAGE_QUALITY`** (Optional)

- **Description**: Default quality level for image generation
- **Values**: `standard`, `hd`
- **Default**: `standard`

```bash
DEFAULT_IMAGE_QUALITY=hd
```

**`DEFAULT_IMAGE_SIZE`** (Optional)

- **Description**: Default aspect ratio for generated images
- **Values**: `square`, `landscape`, `portrait`, `1:1`, `16:9`, `9:16`
- **Default**: `square`

```bash
DEFAULT_IMAGE_SIZE=landscape
```

**`DEFAULT_STYLE`** (Optional)

- **Description**: Default style for image generation
- **Values**: `vivid`, `natural`
- **Default**: `vivid`

```bash
DEFAULT_STYLE=natural
```

### File Management

**`DEFAULT_OUTPUT_DIRECTORY`** (Optional)

- **Description**: Default directory for saving generated images
- **Format**: Relative or absolute path
- **Default**: `./generated_images`

```bash
DEFAULT_OUTPUT_DIRECTORY=/home/user/images
```

**`DEFAULT_NAMING_STRATEGY`** (Optional)

- **Description**: Default filename generation strategy
- **Values**: `timestamp`, `prompt`, `custom`, `hash`
- **Default**: `timestamp`

```bash
DEFAULT_NAMING_STRATEGY=prompt
```

**`DEFAULT_ORGANIZE_BY`** (Optional)

- **Description**: Default directory organization strategy
- **Values**: `none`, `date`, `aspect_ratio`, `quality`
- **Default**: `none`

```bash
DEFAULT_ORGANIZE_BY=date
```

**`AUTO_SAVE_IMAGES`** (Optional)

- **Description**: Automatically save generated images to disk
- **Values**: `true`, `false`
- **Default**: `true`

```bash
AUTO_SAVE_IMAGES=false
```

## Translation Settings

### Japanese Translation

**`AUTO_TRANSLATE_JAPANESE`** (Optional)

- **Description**: Automatically translate Japanese prompts to English
- **Values**: `true`, `false`
- **Default**: `true`

```bash
AUTO_TRANSLATE_JAPANESE=true
```

**`DEFAULT_TRANSLATION_CONTEXT`** (Optional)

- **Description**: Default context for Japanese translation
- **Values**: `general`, `artistic`, `photographic`, `technical`
- **Default**: `general`

```bash
DEFAULT_TRANSLATION_CONTEXT=artistic
```

**`PRESERVE_TECHNICAL_TERMS`** (Optional)

- **Description**: Preserve technical terms during translation
- **Values**: `true`, `false`
- **Default**: `true`

```bash
PRESERVE_TECHNICAL_TERMS=true
```

## Vision Analysis Settings

**`DEFAULT_ANALYSIS_TYPE`** (Optional)

- **Description**: Default analysis type for vision processing
- **Values**: `general`, `detailed`, `artistic`, `technical`
- **Default**: `general`

```bash
DEFAULT_ANALYSIS_TYPE=detailed
```

**`MAX_ANALYSIS_QUESTIONS`** (Optional)

- **Description**: Maximum number of questions for image analysis
- **Format**: Positive integer
- **Default**: `10`

```bash
MAX_ANALYSIS_QUESTIONS=5
```

## Performance Settings

### Rate Limiting

**`RATE_LIMIT_REQUESTS_PER_MINUTE`** (Optional)

- **Description**: Maximum requests per minute to OpenAI API
- **Format**: Positive integer
- **Default**: `50`

```bash
RATE_LIMIT_REQUESTS_PER_MINUTE=30
```

**`RATE_LIMIT_IMAGES_PER_HOUR`** (Optional)

- **Description**: Maximum images generated per hour
- **Format**: Positive integer
- **Default**: `100`

```bash
RATE_LIMIT_IMAGES_PER_HOUR=50
```

### Caching

**`ENABLE_RESULT_CACHING`** (Optional)

- **Description**: Enable caching of API responses
- **Values**: `true`, `false`
- **Default**: `true`

```bash
ENABLE_RESULT_CACHING=true
```

**`CACHE_DURATION_HOURS`** (Optional)

- **Description**: Cache duration in hours
- **Format**: Positive integer
- **Default**: `24`

```bash
CACHE_DURATION_HOURS=12
```

### Request Timeouts

**`API_TIMEOUT_SECONDS`** (Optional)

- **Description**: Timeout for OpenAI API requests in seconds
- **Format**: Positive integer
- **Default**: `60`

```bash
API_TIMEOUT_SECONDS=120
```

**`IMAGE_GENERATION_TIMEOUT_SECONDS`** (Optional)

- **Description**: Specific timeout for image generation requests
- **Format**: Positive integer
- **Default**: `180`

```bash
IMAGE_GENERATION_TIMEOUT_SECONDS=300
```

## Advanced Settings

### Experimental Features

**`ENABLE_BACKGROUND_REMOVAL`** (Optional)

- **Description**: Enable experimental background removal feature
- **Values**: `true`, `false`
- **Default**: `false`

```bash
ENABLE_BACKGROUND_REMOVAL=true
```

**`ENABLE_BATCH_PROCESSING`** (Optional)

- **Description**: Enable batch processing of multiple requests
- **Values**: `true`, `false`
- **Default**: `true`

```bash
ENABLE_BATCH_PROCESSING=true
```

### Logging and Debugging

**`LOG_LEVEL`** (Optional)

- **Description**: Logging level for the MCP server
- **Values**: `debug`, `info`, `warn`, `error`
- **Default**: `info`

```bash
LOG_LEVEL=debug
```

**`ENABLE_REQUEST_LOGGING`** (Optional)

- **Description**: Log all API requests for debugging
- **Values**: `true`, `false`
- **Default**: `false`

```bash
ENABLE_REQUEST_LOGGING=true
```

**`LOG_FILE_PATH`** (Optional)

- **Description**: Path to log file (if not set, logs to console)
- **Format**: File path
- **Default**: None (console logging)

```bash
LOG_FILE_PATH=/var/log/mcp-server.log
```

## Configuration Examples

### Development Environment

```bash
# .env.development
OPENAI_API_KEY=sk-your-development-key
DEFAULT_IMAGE_QUALITY=standard
DEFAULT_OUTPUT_DIRECTORY=./dev_images
AUTO_TRANSLATE_JAPANESE=true
ENABLE_REQUEST_LOGGING=true
LOG_LEVEL=debug
RATE_LIMIT_REQUESTS_PER_MINUTE=10
```

### Production Environment

```bash
# .env.production
OPENAI_API_KEY=sk-your-production-key
DEFAULT_IMAGE_QUALITY=hd
DEFAULT_OUTPUT_DIRECTORY=/app/images
AUTO_TRANSLATE_JAPANESE=true
ENABLE_RESULT_CACHING=true
LOG_LEVEL=warn
RATE_LIMIT_REQUESTS_PER_MINUTE=50
API_TIMEOUT_SECONDS=120
```

### High-Performance Setup

```bash
# .env.high-performance
OPENAI_API_KEY=sk-your-key
DEFAULT_IMAGE_QUALITY=standard
ENABLE_RESULT_CACHING=true
CACHE_DURATION_HOURS=6
ENABLE_BATCH_PROCESSING=true
RATE_LIMIT_REQUESTS_PER_MINUTE=100
API_TIMEOUT_SECONDS=30
```

### Creative Workflow

```bash
# .env.creative
OPENAI_API_KEY=sk-your-key
DEFAULT_IMAGE_QUALITY=hd
DEFAULT_STYLE=vivid
DEFAULT_OUTPUT_DIRECTORY=./creative_projects
DEFAULT_ORGANIZE_BY=date
AUTO_TRANSLATE_JAPANESE=true
DEFAULT_TRANSLATION_CONTEXT=artistic
PRESERVE_TECHNICAL_TERMS=true
```

## Loading Environment Variables

### Using .env Files

Create a `.env` file in your project root:

```bash
# Copy from example
cp .env.example .env

# Edit with your values
nano .env
```

### System Environment Variables

Set variables in your shell:

```bash
# Bash/Zsh
export OPENAI_API_KEY=sk-your-key
export DEFAULT_IMAGE_QUALITY=hd

# Fish
set -x OPENAI_API_KEY sk-your-key
set -x DEFAULT_IMAGE_QUALITY hd
```

### Docker Environment

```dockerfile
# Dockerfile
ENV OPENAI_API_KEY=sk-your-key
ENV DEFAULT_IMAGE_QUALITY=hd
```

Or use docker-compose:

```yaml
# docker-compose.yml
version: "3.8"
services:
  mcp-server:
    build: .
    environment:
      - OPENAI_API_KEY=sk-your-key
      - DEFAULT_IMAGE_QUALITY=hd
    env_file:
      - .env
```

## Validation and Error Handling

### Required Variable Validation

The server validates required variables on startup:

```typescript
// Server startup validation
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

if (!process.env.OPENAI_API_KEY.startsWith("sk-")) {
  throw new Error("Invalid OPENAI_API_KEY format");
}
```

### Configuration Validation

```typescript
// Example validation checks
const config = {
  imageQuality: ["standard", "hd"].includes(process.env.DEFAULT_IMAGE_QUALITY),
  aspectRatio: ["square", "landscape", "portrait"].includes(
    process.env.DEFAULT_IMAGE_SIZE,
  ),
  translationContext: [
    "general",
    "artistic",
    "photographic",
    "technical",
  ].includes(process.env.DEFAULT_TRANSLATION_CONTEXT),
};
```

## Security Considerations

### API Key Security

- **Never commit API keys to version control**
- **Use environment-specific keys**
- **Rotate keys regularly**
- **Restrict API key permissions**

```bash
# Good practices
echo ".env" >> .gitignore
chmod 600 .env
```

### File Permissions

```bash
# Secure environment files
chmod 600 .env
chown app:app .env
```

### Container Security

```dockerfile
# Use non-root user
USER app:app

# Don't include .env in image
.env
```

## Troubleshooting

### Common Issues

#### API Key Not Found

```bash
Error: OPENAI_API_KEY is required
```

**Solution**: Set the `OPENAI_API_KEY` environment variable

#### Invalid API Key Format

```bash
Error: Invalid OPENAI_API_KEY format
```

**Solution**: Ensure the key starts with "sk-"

#### Permission Denied

```bash
Error: Cannot write to output directory
```

**Solution**: Check directory permissions and `DEFAULT_OUTPUT_DIRECTORY`

#### Rate Limit Exceeded

```bash
Error: Rate limit exceeded
```

**Solution**: Adjust `RATE_LIMIT_REQUESTS_PER_MINUTE` or upgrade API plan

### Debugging Configuration

```bash
# Enable debug logging
LOG_LEVEL=debug

# Log all requests
ENABLE_REQUEST_LOGGING=true

# Check loaded configuration
node -e "console.log(process.env)" | grep -E "(OPENAI|DEFAULT|ENABLE)"
```

## Next Steps

- [Getting Started](/guide/getting-started.md) - Basic server setup
- [MCP Configuration](/guide/mcp-configuration.md) - Client configuration
- [API Reference](/api/tools.md) - Tool documentation
- [Examples](/examples/basic-usage.md) - Usage examples
