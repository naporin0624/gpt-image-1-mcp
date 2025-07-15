# Batch Editing Examples

This page demonstrates how to efficiently process multiple images using the batch editing capabilities of gpt-image-1, perfect for workflows requiring consistent edits across multiple images.

## Introduction to Batch Processing

Batch editing allows you to apply the same transformation to multiple images simultaneously, with features like:

- **Parallel Processing**: Process multiple images concurrently
- **Consistent Results**: Apply uniform edits across all images
- **Error Handling**: Continue processing even if some images fail
- **Progress Tracking**: Monitor processing status in real-time

## Basic Batch Processing

### Unified Style Application

Apply consistent styling to a collection of product images for e-commerce or marketing purposes.

**Original Images:**

| Image 1                                      | Image 2                                      | Image 3                                      |
| -------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| ![Shoe 1](/examples/batch/sources/shoe1.png) | ![Shoe 2](/examples/batch/sources/shoe2.png) | ![Shoe 3](/examples/batch/sources/shoe3.png) |

**Edit Prompt:** "Apply minimalist white background with soft shadows"

**Results:**

| Result 1                                                        | Result 2                                                        | Result 3                                                        |
| --------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------- |
| ![Styled 1](/examples/batch/results/styled-1_1752595942155.png) | ![Styled 2](/examples/batch/results/styled-2_1752595937737.png) | ![Styled 3](/examples/batch/results/styled-3_1752595945260.png) |

**Code Example:**

```typescript
const results = await mcp.callTool("batch-edit", {
  images: [
    { type: "local", value: "./products/shoe1.png" },
    { type: "local", value: "./products/shoe2.png" },
    { type: "local", value: "./products/shoe3.png" },
  ],
  edit_prompt: "Apply minimalist white background with soft shadows",
  edit_type: "background_change",
  batch_settings: {
    parallel_processing: true,
    max_concurrent: 3,
  },
});
```

## Advanced Batch Settings

### Parallel Processing Configuration

Optimize processing speed by configuring concurrent operations:

```typescript
const results = await mcp.callTool("batch-edit", {
  images: [
    { type: "local", value: "./image1.png" },
    { type: "local", value: "./image2.png" },
    { type: "local", value: "./image3.png" },
  ],
  edit_prompt: "Apply warm sunset color grading",
  edit_type: "color_adjustment",
  batch_settings: {
    parallel_processing: true,
    max_concurrent: 5,
    error_handling: "continue_on_error",
    progress_callback: true,
  },
});
```

### Error Handling Strategies

Choose how to handle failures during batch processing:

```typescript
// Fail fast - stop on first error
const results1 = await mcp.callTool('batch-edit', {
  images: [...],
  edit_prompt: "Your edit description",
  edit_type: "style_transfer",
  batch_settings: {
    error_handling: "fail_fast"
  }
});

// Continue on error - process all images regardless of failures
const results2 = await mcp.callTool('batch-edit', {
  images: [...],
  edit_prompt: "Your edit description",
  edit_type: "style_transfer",
  batch_settings: {
    error_handling: "continue_on_error"
  }
});

// Retry failed - attempt to retry failed images
const results3 = await mcp.callTool('batch-edit', {
  images: [...],
  edit_prompt: "Your edit description",
  edit_type: "style_transfer",
  batch_settings: {
    error_handling: "retry_failed"
  }
});
```

## File Organization

### Custom Output Directory

Organize your batch processed images with custom directory structures:

```typescript
const results = await mcp.callTool('batch-edit', {
  images: [...],
  edit_prompt: "Apply corporate branding style",
  edit_type: "style_transfer",
  output_directory: "./processed/corporate-style",
  filename_prefix: "branded-",
  organize_by: "date" // Options: "none", "date", "aspect_ratio", "quality"
});
```

### Naming Strategies

Control how processed images are named:

```typescript
const results = await mcp.callTool('batch-edit', {
  images: [...],
  edit_prompt: "Apply vintage filter",
  edit_type: "style_transfer",
  naming_strategy: "prompt", // Options: "timestamp", "prompt", "custom", "hash"
  filename_prefix: "vintage-"
});
```

## Common Use Cases

### E-commerce Product Processing

Process multiple product images for consistent presentation:

```typescript
const results = await mcp.callTool("batch-edit", {
  images: [
    { type: "local", value: "./products/item1.jpg" },
    { type: "local", value: "./products/item2.jpg" },
    { type: "local", value: "./products/item3.jpg" },
  ],
  edit_prompt:
    "Remove background and add clean white background with subtle drop shadow",
  edit_type: "background_change",
  batch_settings: {
    parallel_processing: true,
    max_concurrent: 3,
  },
  output_directory: "./processed/products",
});
```

### Social Media Content Creation

Create consistent social media posts from multiple images:

```typescript
const results = await mcp.callTool("batch-edit", {
  images: [
    { type: "local", value: "./events/photo1.jpg" },
    { type: "local", value: "./events/photo2.jpg" },
    { type: "local", value: "./events/photo3.jpg" },
  ],
  edit_prompt: "Apply vibrant Instagram-style filter with increased saturation",
  edit_type: "color_adjustment",
  batch_settings: {
    parallel_processing: true,
    max_concurrent: 2,
  },
  output_directory: "./social-media/posts",
});
```

### Brand Consistency

Apply brand guidelines across multiple images:

```typescript
const results = await mcp.callTool("batch-edit", {
  images: [
    { type: "local", value: "./marketing/banner1.png" },
    { type: "local", value: "./marketing/banner2.png" },
    { type: "local", value: "./marketing/banner3.png" },
  ],
  edit_prompt: "Apply company brand colors and modern corporate aesthetic",
  edit_type: "style_transfer",
  batch_settings: {
    parallel_processing: true,
    max_concurrent: 3,
  },
  output_directory: "./branded-materials",
});
```

## Performance Optimization

### Concurrent Processing Limits

Balance speed and resource usage:

```typescript
// For resource-constrained environments
const results = await mcp.callTool('batch-edit', {
  images: [...],
  edit_prompt: "Your edit description",
  edit_type: "style_transfer",
  batch_settings: {
    max_concurrent: 2 // Process 2 images at a time
  }
});

// For high-performance environments
const results = await mcp.callTool('batch-edit', {
  images: [...],
  edit_prompt: "Your edit description",
  edit_type: "background_change",
  batch_settings: {
    max_concurrent: 10 // Process up to 10 images concurrently
  }
});
```

### Memory Management

Handle large batches efficiently:

```typescript
// Process large batches in chunks
const chunkSize = 10;
const imageChunks = [];

for (let i = 0; i < allImages.length; i += chunkSize) {
  imageChunks.push(allImages.slice(i, i + chunkSize));
}

const allResults = [];
for (const chunk of imageChunks) {
  const chunkResults = await mcp.callTool("batch-edit", {
    images: chunk,
    edit_prompt: "Your edit description",
    edit_type: "style_transfer",
    batch_settings: {
      parallel_processing: true,
      max_concurrent: 5,
    },
  });
  allResults.push(...chunkResults);
}
```

## Result Handling

### Processing Results

Handle batch processing results effectively:

```typescript
const results = await mcp.callTool('batch-edit', {
  images: [...],
  edit_prompt: "Apply artistic effect",
  edit_type: "style_transfer"
});

// Check overall success
console.log(`Processed: ${results.successfully_processed}/${results.total_images}`);

// Handle individual results
results.results.forEach((result, index) => {
  if (result.success) {
    console.log(`Image ${index + 1}: Success - ${result.local_file}`);
  } else {
    console.log(`Image ${index + 1}: Failed - ${result.error}`);
  }
});
```

### Error Recovery

Implement retry logic for failed images:

```typescript
const results = await mcp.callTool('batch-edit', {
  images: [...],
  edit_prompt: "Apply color correction",
  edit_type: "color_adjustment",
  batch_settings: {
    error_handling: "continue_on_error"
  }
});

// Retry failed images
const failedImages = results.results
  .filter(result => !result.success)
  .map(result => result.original_image);

if (failedImages.length > 0) {
  const retryResults = await mcp.callTool('batch-edit', {
    images: failedImages,
    edit_prompt: "Apply color correction",
    edit_type: "color_adjustment",
    batch_settings: {
      max_concurrent: 1 // Slower processing for problematic images
    }
  });
}
```

## Best Practices

### Batch Size Optimization

- **Small Batches (1-5 images)**: Use for complex edits or limited resources
- **Medium Batches (6-20 images)**: Ideal for most use cases
- **Large Batches (21+ images)**: Consider chunking for better memory management

### Edit Type Considerations

- **Style Transfer**: Best for artistic transformations
- **Background Change**: Perfect for product photography
- **Color Adjustment**: Ideal for consistency across photo sets
- **Enhancement**: Great for improving image quality

### Resource Management

- Monitor concurrent processing limits
- Use appropriate error handling strategies
- Consider file sizes and output formats
- Implement progress tracking for large batches

## Troubleshooting

### Common Issues

1. **Memory Issues**: Reduce max_concurrent setting
2. **Inconsistent Results**: Ensure images are similar in composition
3. **Slow Processing**: Increase max_concurrent for faster systems

### Performance Monitoring

```typescript
const startTime = Date.now();
const results = await mcp.callTool('batch-edit', {
  images: [...],
  edit_prompt: "Apply edit",
  edit_type: "style_transfer",
  batch_settings: {
    progress_callback: true
  }
});
const endTime = Date.now();

console.log(`Processing time: ${endTime - startTime}ms`);
console.log(`Average per image: ${(endTime - startTime) / results.total_images}ms`);
```

## Next Steps

Ready to combine batch processing with other image operations? Explore:

- [Image Generation Examples](/examples/generate-image-examples) for creating source images
- [Image Editing Examples](/examples/edit-image-examples) for single image transformations

For more advanced workflows, consider integrating batch processing with automated content pipelines and workflow management systems.
