# generate-image

Generate high-quality images using OpenAI's gpt-image-1 model through the MCP server.

## Overview

The `generate-image` tool provides a comprehensive interface to gpt-image-1 with support for multiple aspect ratios, quality settings, transparency, and file management options.

## Basic Usage

```typescript
await client.callTool("generate-image", {
  prompt: "A serene Japanese garden with cherry blossoms in spring",
  aspect_ratio: "landscape",
  quality: "hd",
});
```

## Parameters

### Required Parameters

| Parameter | Type   | Description                                   |
| --------- | ------ | --------------------------------------------- |
| `prompt`  | string | Detailed description of the image to generate |

### Optional Parameters

| Parameter                  | Type    | Default                | Description                      |
| -------------------------- | ------- | ---------------------- | -------------------------------- |
| `aspect_ratio`             | string  | `"square"`             | Image aspect ratio               |
| `quality`                  | string  | `"standard"`           | Image quality level              |
| `style`                    | string  | `"vivid"`              | Image style                      |
| `output_directory`         | string  | `"./generated_images"` | Directory to save images         |
| `filename`                 | string  | Auto-generated         | Custom filename                  |
| `save_to_file`             | boolean | `true`                 | Whether to save image locally    |
| `naming_strategy`          | string  | `"timestamp"`          | Filename generation strategy     |
| `organize_by`              | string  | `"none"`               | Subdirectory organization        |
| `analyze_after_generation` | boolean | `false`                | Analyze generated image          |
| `remove_background`        | boolean | `false`                | Remove background (experimental) |

## Aspect Ratios

### Available Options

| Value                     | Dimensions | Use Case                          |
| ------------------------- | ---------- | --------------------------------- |
| `"square"` or `"1:1"`     | 1024×1024  | Social media, profile pictures    |
| `"landscape"` or `"16:9"` | 1792×1024  | Desktop wallpapers, presentations |
| `"portrait"` or `"9:16"`  | 1024×1792  | Mobile wallpapers, posters        |

```typescript
// Square image
await client.callTool("generate-image", {
  prompt: "A modern logo design",
  aspect_ratio: "square",
});

// Landscape image
await client.callTool("generate-image", {
  prompt: "A panoramic mountain landscape",
  aspect_ratio: "landscape",
});

// Portrait image
await client.callTool("generate-image", {
  prompt: "A tall skyscraper reaching into the clouds",
  aspect_ratio: "portrait",
});
```

## Quality Settings

### Standard Quality

- **Value**: `"standard"`
- **Generation Time**: Faster
- **Use Case**: Draft images, quick iterations

### HD Quality

- **Value**: `"hd"`
- **Generation Time**: Slower
- **Use Case**: Final images, high-quality outputs

```typescript
// Standard quality for quick previews
await client.callTool("generate-image", {
  prompt: "A concept sketch of a futuristic car",
  quality: "standard",
});

// HD quality for final images
await client.callTool("generate-image", {
  prompt: "A photorealistic portrait of a person",
  quality: "hd",
});
```

## Style Options

### Vivid Style

- **Value**: `"vivid"`
- **Characteristics**: High contrast, saturated colors, dramatic
- **Use Case**: Artistic images, creative content

### Natural Style

- **Value**: `"natural"`
- **Characteristics**: Subtle, realistic, balanced
- **Use Case**: Photorealistic images, professional content

```typescript
// Vivid style for artistic images
await client.callTool("generate-image", {
  prompt: "A fantasy dragon breathing fire",
  style: "vivid",
});

// Natural style for realistic images
await client.callTool("generate-image", {
  prompt: "A professional headshot of a business person",
  style: "natural",
});
```

## File Management

### Naming Strategies

| Strategy      | Description            | Example                      |
| ------------- | ---------------------- | ---------------------------- |
| `"timestamp"` | Uses current timestamp | `20240115_143022.png`        |
| `"prompt"`    | Based on prompt text   | `japanese_garden_spring.png` |
| `"custom"`    | Uses provided filename | `my_image.png`               |
| `"hash"`      | MD5 hash of prompt     | `a1b2c3d4e5f6.png`           |

### Organization Options

| Option           | Description         | Directory Structure              |
| ---------------- | ------------------- | -------------------------------- |
| `"none"`         | No organization     | `./generated_images/`            |
| `"date"`         | Organize by date    | `./generated_images/2024/01/15/` |
| `"aspect_ratio"` | Organize by ratio   | `./generated_images/landscape/`  |
| `"quality"`      | Organize by quality | `./generated_images/hd/`         |

```typescript
// Custom filename with date organization
await client.callTool("generate-image", {
  prompt: "A sunset over the ocean",
  filename: "sunset_masterpiece",
  naming_strategy: "custom",
  organize_by: "date",
});
```

## Advanced Features

### Automatic Analysis

Generate an image and immediately analyze it:

```typescript
await client.callTool("generate-image", {
  prompt: "A complex technical diagram",
  analyze_after_generation: true,
});
```

### Transparency Support

Native transparency support with gpt-image-1:

```typescript
await client.callTool("generate-image", {
  prompt: "A product with transparent background",
  remove_background: true,
});
```

### Skip File Saving

Generate without saving to disk:

```typescript
await client.callTool("generate-image", {
  prompt: "A temporary preview image",
  save_to_file: false,
});
```

## Response Format

```json
{
  "success": true,
  "data": {
    "image_url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
    "local_path": "./generated_images/20240115_143022.png",
    "metadata": {
      "prompt": "A serene Japanese garden with cherry blossoms",
      "aspect_ratio": "landscape",
      "quality": "hd",
      "style": "vivid",
      "generation_time": 12.5,
      "file_size": 2048576,
      "dimensions": {
        "width": 1792,
        "height": 1024
      }
    },
    "analysis": {
      "description": "Analysis results if analyze_after_generation is true"
    }
  }
}
```

## Error Handling

### Common Errors

| Error Code       | Description                    | Solution                    |
| ---------------- | ------------------------------ | --------------------------- |
| `INVALID_PROMPT` | Prompt violates content policy | Revise prompt content       |
| `QUOTA_EXCEEDED` | API quota exceeded             | Check usage limits          |
| `RATE_LIMIT`     | Rate limit reached             | Wait before retry           |
| `INVALID_PARAMS` | Invalid parameter values       | Check parameter format      |
| `FILE_ERROR`     | File system error              | Check directory permissions |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PROMPT",
    "message": "Prompt contains prohibited content",
    "details": {
      "prompt": "Your prompt text",
      "violation_type": "content_policy"
    }
  }
}
```

### Retry Logic

```typescript
async function generateWithRetry(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.callTool("generate-image", params);
    } catch (error) {
      if (error.code === "RATE_LIMIT" && i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
      throw error;
    }
  }
}
```

## Best Practices

### Prompt Engineering

1. **Be Specific**: Include details about style, composition, and elements
2. **Use Descriptive Language**: Rich adjectives and clear descriptions
3. **Specify Style**: Mention artistic style, medium, or technique
4. **Include Context**: Setting, lighting, mood, and atmosphere

```typescript
// Good prompt
await client.callTool("generate-image", {
  prompt:
    "A hyperrealistic oil painting of a majestic golden eagle soaring above snow-capped mountains during golden hour, with dramatic lighting and cinematic composition",
});

// Basic prompt
await client.callTool("generate-image", {
  prompt: "An eagle flying",
});
```

### Performance Optimization

1. **Use Standard Quality** for iterations and previews
2. **Batch Similar Requests** to optimize API usage
3. **Cache Results** to avoid regenerating similar images
4. **Use Appropriate Aspect Ratios** for your use case

### File Management

1. **Organize Images** using the `organize_by` parameter
2. **Use Descriptive Filenames** with the `filename` parameter
3. **Set Appropriate Directories** with `output_directory`
4. **Clean Up Old Images** regularly to manage disk space

## Examples

### Basic Image Generation

```typescript
const result = await client.callTool("generate-image", {
  prompt: "A cozy coffee shop interior with warm lighting",
});

console.log("Generated image:", result.data.local_path);
```

### High-Quality Product Image

```typescript
const result = await client.callTool("generate-image", {
  prompt:
    "A professional product photo of a smartwatch on a clean white background, studio lighting, commercial photography style",
  aspect_ratio: "square",
  quality: "hd",
  style: "natural",
  filename: "smartwatch_product",
});
```

### Artistic Portrait

```typescript
const result = await client.callTool("generate-image", {
  prompt:
    "An impressionist-style portrait of a woman in a garden, painted in the style of Monet, soft brushstrokes, dappled sunlight",
  aspect_ratio: "portrait",
  quality: "hd",
  style: "vivid",
  organize_by: "date",
});
```

### Technical Diagram

```typescript
const result = await client.callTool("generate-image", {
  prompt:
    "A clean, technical diagram showing the architecture of a web application, with labeled components and data flow arrows",
  aspect_ratio: "landscape",
  quality: "hd",
  style: "natural",
  analyze_after_generation: true,
});
```

## Next Steps

- [Vision Analysis](/guide/vision-analysis.md) - Analyze your generated images
- [API Overview](/api/tools.md) - Explore other MCP tools
- [Examples](/examples/basic-usage.md) - See practical usage examples
- [Getting Started](/guide/getting-started.md) - Basic setup and configuration
