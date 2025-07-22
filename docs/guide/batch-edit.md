# batch-edit

Apply the same AI-powered edits to multiple images simultaneously using OpenAI's gpt-image-1 model with parallel processing and progress tracking.

## Overview

The `batch-edit` tool enables efficient bulk editing of multiple images with the same modifications, featuring parallel processing, error handling, and progress tracking for production workflows.

## Basic Usage

```typescript
await client.callTool("batch-edit", {
  image_urls: [
    "/path/to/image1.jpg",
    "/path/to/image2.jpg",
    "/path/to/image3.jpg",
  ],
  edit_prompt: "Apply vintage sepia filter",
  edit_type: "style_transfer",
});
```

## Parameters

### Required Parameters

| Parameter     | Type     | Description                               |
| ------------- | -------- | ----------------------------------------- |
| `image_urls`  | string[] | Array of image file paths or URLs to edit |
| `edit_prompt` | string   | Description of desired changes            |
| `edit_type`   | string   | Type of edit to apply to all images       |

### Optional Parameters

| Parameter          | Type    | Default            | Description                           |
| ------------------ | ------- | ------------------ | ------------------------------------- |
| `batch_settings`   | object  | `{}`               | Batch processing configuration        |
| `output_directory` | string  | `"./batch_edited"` | Directory to save edited images       |
| `filename_prefix`  | string  | `"batch_"`         | Prefix for edited image filenames     |
| `save_to_file`     | boolean | `true`             | Whether to save edited images locally |
| `output_format`    | string  | `"png"`            | Output format (png, jpeg, webp)       |
| `naming_strategy`  | string  | `"timestamp"`      | Filename generation strategy          |
| `organize_by`      | string  | `"none"`           | Subdirectory organization method      |

Saved filenames use the requested `output_format` extension.

## Batch Settings

Configure parallel processing and error handling:

```typescript
{
  batch_settings: {
    max_concurrent: 5,              // Maximum parallel operations
    parallel_processing: true,      // Enable parallel processing
    error_handling: "continue_on_error", // Error handling strategy
    progress_callback: true,        // Enable progress tracking
    retry_failed: true             // Retry failed operations
  }
}
```

### Batch Settings Options

| Setting               | Type    | Default               | Description                          |
| --------------------- | ------- | --------------------- | ------------------------------------ |
| `max_concurrent`      | number  | `3`                   | Maximum concurrent operations (1-10) |
| `parallel_processing` | boolean | `true`                | Process images in parallel           |
| `error_handling`      | string  | `"continue_on_error"` | How to handle errors                 |
| `progress_callback`   | boolean | `true`                | Enable progress tracking             |
| `retry_failed`        | boolean | `false`               | Retry failed operations once         |

### Error Handling Strategies

| Strategy              | Description                                 |
| --------------------- | ------------------------------------------- |
| `"fail_fast"`         | Stop processing on first error              |
| `"continue_on_error"` | Continue processing remaining images        |
| `"retry_failed"`      | Retry failed operations once, then continue |

## Edit Types

All edit types from the `edit-image` tool are supported:

- **style_transfer**: Apply artistic styles or filters
- **background_change**: Modify or replace backgrounds
- **color_adjustment**: Adjust colors, brightness, contrast
- **enhancement**: Improve image quality and details
- **object_removal**: Remove unwanted objects (with masking)
- **inpaint**: Fill in or modify specific areas
- **outpaint**: Extend image boundaries

## Input Validation

### English-Only Requirement

All edit prompts must be in English for optimal gpt-image-1 performance:

```typescript
// ✅ Correct - English prompt
await client.callTool("batch-edit", {
  image_urls: ["img1.jpg", "img2.jpg"],
  edit_prompt: "Enhance colors and increase contrast",
  edit_type: "enhancement",
});

// ❌ Validation error - Non-English text
await client.callTool("batch-edit", {
  image_urls: ["img1.jpg", "img2.jpg"],
  edit_prompt: "色を強調してコントラストを上げる",
  edit_type: "enhancement",
});
```

### LLM Translation Workflow

```typescript
// Step 1: Translate with your LLM
const englishPrompt =
  await yourLLM.translate("色を強調してコントラストを上げる");
// Result: "Enhance colors and increase contrast"

// Step 2: Batch edit with English prompt
const result = await client.callTool("batch-edit", {
  image_urls: ["img1.jpg", "img2.jpg"],
  edit_prompt: englishPrompt,
  edit_type: "enhancement",
});
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "batch_id": "batch_20240115_143022",
    "total_images": 5,
    "processed_images": 5,
    "successful_edits": 4,
    "failed_edits": 1,
    "processing_time": 45.2,
    "results": [
      {
        "index": 0,
        "source_image": "/path/to/image1.jpg",
        "success": true,
        "file_path": "./batch_edited/batch_1_20240115_143022.png",
        "processing_time": 8.5,
        "file_size": 1024576
      },
      {
        "index": 1,
        "source_image": "/path/to/image2.jpg",
        "success": false,
        "error": {
          "code": "EDIT_FAILED",
          "message": "Image editing operation failed"
        }
      }
    ],
    "summary": {
      "success_rate": 0.8,
      "total_file_size": 4096000,
      "average_processing_time": 9.04,
      "output_directory": "./batch_edited"
    }
  }
}
```

### Progress Tracking

When `progress_callback` is enabled:

```json
{
  "progress": {
    "total": 10,
    "completed": 3,
    "failed": 0,
    "percentage": 30,
    "current_operation": "Processing image 4 of 10",
    "estimated_time_remaining": 45
  }
}
```

## Advanced Usage

### High-Volume Processing

```typescript
// Process 50 images with optimized settings
await client.callTool("batch-edit", {
  image_urls: imageUrlArray, // 50 images
  edit_prompt: "Apply Instagram-style filter",
  edit_type: "style_transfer",
  batch_settings: {
    max_concurrent: 8,
    parallel_processing: true,
    error_handling: "continue_on_error",
    retry_failed: true,
  },
  organize_by: "date",
});
```

### Quality-Focused Processing

```typescript
// High-quality processing with error handling
await client.callTool("batch-edit", {
  image_urls: ["product1.jpg", "product2.jpg", "product3.jpg"],
  edit_prompt: "Remove background and make transparent",
  edit_type: "background_change",
  batch_settings: {
    max_concurrent: 2,
    parallel_processing: true,
    error_handling: "fail_fast",
  },
  output_format: "png",
  naming_strategy: "custom",
});
```

### Style Transfer Workflow

```typescript
// Apply consistent branding across images
await client.callTool("batch-edit", {
  image_urls: socialMediaImages,
  edit_prompt: "Apply warm, professional branding filter with subtle vignette",
  edit_type: "style_transfer",
  batch_settings: {
    max_concurrent: 5,
    progress_callback: true,
  },
  organize_by: "aspect_ratio",
  filename_prefix: "branded_",
});
```

## Error Handling

### Common Errors

| Error Code            | Description                    | Solution                     |
| --------------------- | ------------------------------ | ---------------------------- |
| `BATCH_SIZE_EXCEEDED` | Too many images in batch       | Reduce batch size or split   |
| `INVALID_IMAGE_URLS`  | One or more image URLs invalid | Check image paths/URLs       |
| `CONCURRENT_LIMIT`    | max_concurrent exceeds limit   | Reduce concurrent operations |
| `PROCESSING_TIMEOUT`  | Batch processing timed out     | Reduce batch size or timeout |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "BATCH_SIZE_EXCEEDED",
    "message": "Batch size exceeds maximum limit",
    "details": {
      "provided_count": 100,
      "max_allowed": 50,
      "suggestion": "Split into smaller batches of 50 images or less"
    }
  }
}
```

### Partial Success Handling

```typescript
// Handle partial success scenarios
const result = await client.callTool("batch-edit", {
  image_urls: imageArray,
  edit_prompt: "Enhance brightness",
  edit_type: "color_adjustment",
  batch_settings: {
    error_handling: "continue_on_error",
  },
});

// Process results
const successful = result.data.results.filter((r) => r.success);
const failed = result.data.results.filter((r) => !r.success);

console.log(`Processed ${successful.length} images successfully`);
console.log(`Failed to process ${failed.length} images`);

// Retry failed images
if (failed.length > 0) {
  const retryUrls = failed.map((f) => f.source_image);
  // Retry with different parameters
}
```

## Performance Optimization

### Batch Size Guidelines

| Image Count | Recommended max_concurrent | Expected Duration |
| ----------- | -------------------------- | ----------------- |
| 1-10        | 3                          | 1-3 minutes       |
| 11-25       | 5                          | 3-8 minutes       |
| 26-50       | 8                          | 8-15 minutes      |
| 51-100      | 10                         | 15-30 minutes     |

### Memory Management

```typescript
// Process large batches in chunks
async function processLargeBatch(imageUrls: string[], chunkSize: number = 25) {
  const results = [];

  for (let i = 0; i < imageUrls.length; i += chunkSize) {
    const chunk = imageUrls.slice(i, i + chunkSize);

    const chunkResult = await client.callTool("batch-edit", {
      image_urls: chunk,
      edit_prompt: "Apply consistent branding",
      edit_type: "style_transfer",
      batch_settings: {
        max_concurrent: 5,
        error_handling: "continue_on_error",
      },
    });

    results.push(...chunkResult.data.results);

    // Brief pause between chunks
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return results;
}
```

## Use Cases

### E-commerce Product Processing

```typescript
// Standardize product images
await client.callTool("batch-edit", {
  image_urls: productImages,
  edit_prompt: "Remove background, place on clean white background",
  edit_type: "background_change",
  batch_settings: {
    max_concurrent: 4,
    error_handling: "continue_on_error",
  },
  output_format: "png",
  organize_by: "date",
});
```

### Social Media Content

```typescript
// Create consistent branding
await client.callTool("batch-edit", {
  image_urls: socialPosts,
  edit_prompt: "Apply brand colors and subtle logo watermark",
  edit_type: "style_transfer",
  batch_settings: {
    max_concurrent: 6,
    progress_callback: true,
  },
  filename_prefix: "social_",
  organize_by: "aspect_ratio",
});
```

### Content Migration

```typescript
// Update legacy content
await client.callTool("batch-edit", {
  image_urls: legacyImages,
  edit_prompt: "Modernize colors and improve contrast",
  edit_type: "enhancement",
  batch_settings: {
    max_concurrent: 3,
    error_handling: "retry_failed",
  },
  organize_by: "quality",
});
```

## Integration Examples

### Workflow Automation

```typescript
// Automated processing pipeline
async function processUploadedImages(imageUrls: string[]) {
  // Step 1: Batch edit for consistency
  const editResult = await client.callTool("batch-edit", {
    image_urls: imageUrls,
    edit_prompt: "Optimize for web display",
    edit_type: "enhancement",
    batch_settings: {
      max_concurrent: 4,
      error_handling: "continue_on_error",
    },
  });

  // Step 2: Process successful edits
  const successfulImages = editResult.data.results
    .filter((r) => r.success)
    .map((r) => r.file_path);

  // Step 3: Upload to CDN, update database, etc.
  return await uploadToCDN(successfulImages);
}
```

### Quality Assurance

```typescript
// Batch process with quality checks
async function qualityBatchEdit(imageUrls: string[]) {
  const result = await client.callTool("batch-edit", {
    image_urls: imageUrls,
    edit_prompt: "Enhance quality while maintaining natural look",
    edit_type: "enhancement",
    batch_settings: {
      max_concurrent: 3,
      error_handling: "fail_fast",
    },
  });

  // Quality validation
  const qualityCheck = result.data.results.every(
    (r) => r.success && r.file_size > 100000, // Minimum size check
  );

  if (!qualityCheck) {
    throw new Error("Quality standards not met");
  }

  return result;
}
```

## Limitations

- **Maximum Batch Size**: 100 images per batch
- **Concurrent Operations**: Maximum 10 parallel processes
- **Processing Time**: Large batches may take 30+ minutes
- **Memory Usage**: High memory usage for large batches
- **File Size**: Each image limited to 20MB

## Best Practices

1. **Start Small**: Test with 2-3 images before large batches
2. **Monitor Progress**: Use progress callbacks for large batches
3. **Handle Errors**: Always implement error handling
4. **Optimize Concurrency**: Balance speed vs. resource usage
5. **Organize Output**: Use appropriate organization strategies

## Next Steps

- [Image Editing](/guide/edit-image) - Single image editing capabilities
- [Image Generation](/guide/image-generation) - Generate images from scratch
- [Error Handling](/api/error-handling) - Comprehensive error management
- [Examples](/examples/batch-edit-examples) - Integration workflow examples
