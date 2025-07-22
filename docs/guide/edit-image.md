# edit-image

Edit existing images with AI-powered modifications using OpenAI's gpt-image-1 model, including inpainting, outpainting, style transfer, and background changes.

## Overview

The `edit-image` tool provides comprehensive image editing capabilities powered by gpt-image-1, allowing you to modify, enhance, and transform existing images with natural language instructions.

## Basic Usage

```typescript
await client.callTool("edit-image", {
  source_image: "/path/to/image.png",
  edit_prompt: "Add a sunset sky background",
  edit_type: "background_change",
});
```

## Parameters

### Required Parameters

| Parameter      | Type   | Description                                       |
| -------------- | ------ | ------------------------------------------------- |
| `source_image` | string | Path to source image file or base64 encoded image |
| `edit_prompt`  | string | Description of desired changes                    |
| `edit_type`    | string | Type of edit to perform                           |

### Optional Parameters

| Parameter              | Type    | Default             | Description                             |
| ---------------------- | ------- | ------------------- | --------------------------------------- |
| `strength`             | number  | `0.8`               | Edit strength (0.0 to 1.0)              |
| `mask_area`            | string  | `null`              | Mask specification for targeted editing |
| `preserve_composition` | boolean | `true`              | Maintain original image composition     |
| `output_directory`     | string  | `"./edited_images"` | Directory to save edited images         |
| `filename_prefix`      | string  | `"edited_"`         | Prefix for edited image filename        |
| `save_to_file`         | boolean | `true`              | Whether to save edited image locally    |
| `output_format`        | string  | `"png"`             | Output format (png, jpeg, webp)         |
| `include_base64`       | boolean | `false`             | Include base64 data in response         |

Saved filenames now automatically use the chosen `output_format` extension.

## Edit Types

### inpaint

Fill in or modify specific areas of an image:

```typescript
await client.callTool("edit-image", {
  source_image: "portrait.jpg",
  edit_prompt: "Change the person's shirt to a blue suit jacket",
  edit_type: "inpaint",
  mask_area: "upper torso region",
});
```

### outpaint

Extend the image beyond its original boundaries:

```typescript
await client.callTool("edit-image", {
  source_image: "landscape.jpg",
  edit_prompt: "Extend the mountain range to the left and right",
  edit_type: "outpaint",
  strength: 0.7,
});
```

### background_change

Replace or modify the background:

```typescript
await client.callTool("edit-image", {
  source_image: "product.png",
  edit_prompt: "Place on a marble surface with soft lighting",
  edit_type: "background_change",
  preserve_composition: true,
});
```

### style_transfer

Apply artistic styles or transformations:

```typescript
await client.callTool("edit-image", {
  source_image: "photo.jpg",
  edit_prompt: "Transform into an impressionist painting style",
  edit_type: "style_transfer",
  strength: 0.9,
});
```

### object_removal

Remove unwanted objects from the image:

```typescript
await client.callTool("edit-image", {
  source_image: "scene.jpg",
  edit_prompt: "Remove the person in the background",
  edit_type: "object_removal",
  mask_area: "background person",
});
```

### variation

Create variations of the original image:

```typescript
await client.callTool("edit-image", {
  source_image: "original.png",
  edit_prompt: "Create a variation with different lighting",
  edit_type: "variation",
  strength: 0.6,
});
```

## Input Validation

### English-Only Requirement

All edit prompts must be in English for optimal performance:

```typescript
// ✅ Correct - English prompt
await client.callTool("edit-image", {
  source_image: "image.jpg",
  edit_prompt: "Add cherry blossoms in the foreground",
  edit_type: "inpaint",
});

// ❌ Rejected - Non-English text
await client.callTool("edit-image", {
  source_image: "image.jpg",
  edit_prompt: "前景に桜の花を追加",
  edit_type: "inpaint",
});
```

### Translation Workflow

Use your LLM to translate non-English edit instructions:

```typescript
// Step 1: Translate with your LLM
const englishPrompt = await yourLLM.translate("前景に桜の花を追加");
// Result: "Add cherry blossoms in the foreground"

// Step 2: Edit image
const result = await client.callTool("edit-image", {
  source_image: "image.jpg",
  edit_prompt: englishPrompt,
  edit_type: "inpaint",
});
```

## Response Format

### Default Response (Optimized for MCP)

```json
{
  "success": true,
  "data": {
    "file_path": "./edited_images/edited_20240115_143022.png",
    "metadata": {
      "original_image": "/path/to/original.jpg",
      "edit_prompt": "Add a sunset sky background",
      "edit_type": "background_change",
      "strength": 0.8,
      "processing_time": 8.2,
      "file_size": 1524288,
      "dimensions": {
        "width": 1024,
        "height": 1024
      },
      "format": "png",
      "created_at": "2024-01-15T14:30:22Z"
    }
  }
}
```

### Optional Base64 Response

```typescript
await client.callTool("edit-image", {
  source_image: "small_image.jpg",
  edit_prompt: "Enhance colors",
  edit_type: "style_transfer",
  include_base64: true,
});
```

## Error Handling

### Common Errors

| Error Code             | Description                    | Solution                   |
| ---------------------- | ------------------------------ | -------------------------- |
| `INVALID_SOURCE_IMAGE` | Source image not found/invalid | Check image path or format |
| `VALIDATION_ERROR`     | Invalid input detected         | Check input format         |
| `UNSUPPORTED_FORMAT`   | Unsupported image format       | Use PNG, JPEG, or WebP     |
| `EDIT_FAILED`          | Image editing operation failed | Try different parameters   |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SOURCE_IMAGE",
    "message": "Source image file not found or inaccessible",
    "details": {
      "source_image": "/path/to/missing.jpg",
      "suggestion": "Check that the image file exists and is accessible"
    }
  }
}
```

## Advanced Features

### Mask-Based Editing

Specify exact areas to edit:

```typescript
await client.callTool("edit-image", {
  source_image: "portrait.jpg",
  edit_prompt: "Change eye color to green",
  edit_type: "inpaint",
  mask_area: "eyes region",
  strength: 0.6,
});
```

### Composition Preservation

Maintain original layout and structure:

```typescript
await client.callTool("edit-image", {
  source_image: "product_photo.jpg",
  edit_prompt: "Change background to gradient blue",
  edit_type: "background_change",
  preserve_composition: true,
});
```

### Multi-Format Output

Generate different formats:

```typescript
const formats = ["png", "jpeg", "webp"];

for (const format of formats) {
  await client.callTool("edit-image", {
    source_image: "original.png",
    edit_prompt: "Enhance contrast",
    edit_type: "style_transfer",
    output_format: format,
    filename_prefix: `enhanced_${format}_`,
  });
}
```

## Best Practices

### Edit Prompt Engineering

1. **Be Specific**: Clearly describe the desired changes
2. **Use Visual Terms**: Include colors, textures, and lighting details
3. **Specify Context**: Mention the area or object to modify
4. **Set Expectations**: Describe the desired outcome precisely

### Example Prompts

**Good Prompts:**

```
"Replace the cloudy sky with a clear blue sky with wispy white clouds"
"Add warm golden hour lighting to the entire scene"
"Remove the red car from the left side of the street"
"Transform the photo into a vintage sepia-toned style"
```

**Basic Prompts:**

```
"Change sky"
"Add lighting"
"Remove car"
"Make vintage"
```

### Performance Optimization

1. **Use Appropriate Strength**: Lower values for subtle changes
2. **Preserve Composition**: When maintaining original layout
3. **Choose Right Format**: PNG for transparency, JPEG for photos
4. **Cache Results**: Store successful edits for reuse

## Use Cases

### Product Photography

```typescript
// Remove background for e-commerce
await client.callTool("edit-image", {
  source_image: "product.jpg",
  edit_prompt: "Remove background, make transparent",
  edit_type: "background_change",
  output_format: "png",
});

// Add lifestyle context
await client.callTool("edit-image", {
  source_image: "product.png",
  edit_prompt: "Place on a modern kitchen counter",
  edit_type: "background_change",
});
```

### Content Creation

```typescript
// Create thumbnail variations
await client.callTool("edit-image", {
  source_image: "video_frame.jpg",
  edit_prompt: "Add dramatic lighting and increase contrast",
  edit_type: "style_transfer",
  strength: 0.7,
});
```

### Photo Restoration

```typescript
// Remove unwanted objects
await client.callTool("edit-image", {
  source_image: "family_photo.jpg",
  edit_prompt: "Remove the person in the background",
  edit_type: "object_removal",
  preserve_composition: true,
});
```

## Integration with Other Tools

### Workflow with generate-image

```typescript
// Generate base image
const generated = await client.callTool("generate-image", {
  prompt: "A mountain landscape at dawn",
  aspect_ratio: "landscape",
});

// Edit the generated image
const edited = await client.callTool("edit-image", {
  source_image: generated.data.file_path,
  edit_prompt: "Add dramatic storm clouds",
  edit_type: "background_change",
});
```

### Batch Processing

```typescript
// Edit multiple images with same modifications
const images = ["image1.jpg", "image2.jpg", "image3.jpg"];

for (const image of images) {
  await client.callTool("edit-image", {
    source_image: image,
    edit_prompt: "Apply vintage filter",
    edit_type: "style_transfer",
    strength: 0.8,
  });
}
```

## Limitations

- **Input Format**: Supports PNG, JPEG, GIF, WebP input images
- **Maximum File Size**: 20MB per image
- **Processing Time**: Complex edits may take 10-30 seconds
- **Composition**: Some edits may alter original composition
- **Quality**: Results depend on source image quality

## Next Steps

- [Batch Editing](/guide/batch-edit) - Edit multiple images efficiently
- [Image Generation](/guide/image-generation) - Generate images from scratch
- [Error Handling](/api/error-handling) - Handle editing errors gracefully
- [Examples](/examples/edit-image-examples) - See practical editing examples
