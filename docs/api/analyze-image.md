# analyze-image

Analyze images using OpenAI's GPT-4o Vision model to extract detailed information, descriptions, and insights from visual content.

## Overview

The `analyze-image` tool provides comprehensive image analysis capabilities, including content description, object detection, text recognition, and technical analysis. It's powered by GPT-4o Vision, offering state-of-the-art visual understanding.

## Basic Usage

```typescript
await client.callTool("analyze-image", {
  image_url: "https://example.com/image.jpg",
  analysis_type: "general",
});
```

## Parameters

### Required Parameters

| Parameter   | Type   | Description                                               |
| ----------- | ------ | --------------------------------------------------------- |
| `image_url` | string | URL of the image to analyze (must be publicly accessible) |

### Optional Parameters

| Parameter       | Type     | Default     | Description                               |
| --------------- | -------- | ----------- | ----------------------------------------- |
| `analysis_type` | string   | `"general"` | Type of analysis to perform               |
| `questions`     | string[] | `[]`        | Specific questions to ask about the image |

## Analysis Types

### General Analysis

Provides a comprehensive overview of the image content:

```typescript
await client.callTool("analyze-image", {
  image_url: "https://example.com/photo.jpg",
  analysis_type: "general",
});
```

**Returns:**

- Overall content description
- Main objects and subjects
- Basic color analysis
- Scene setting and context
- General mood and atmosphere

### Detailed Analysis

Offers in-depth examination of all visual elements:

```typescript
await client.callTool("analyze-image", {
  image_url: "https://example.com/photo.jpg",
  analysis_type: "detailed",
});
```

**Returns:**

- Comprehensive content description
- Detailed object identification with locations
- Text extraction and OCR
- Color palette analysis
- Composition and layout details
- Technical quality assessment

### Artistic Analysis

Focuses on artistic and aesthetic elements:

```typescript
await client.callTool("analyze-image", {
  image_url: "https://example.com/artwork.jpg",
  analysis_type: "artistic",
});
```

**Returns:**

- Artistic style identification
- Composition analysis
- Color theory application
- Mood and emotional content
- Technique and medium identification
- Historical or cultural context

### Technical Analysis

Analyzes technical aspects and quality:

```typescript
await client.callTool("analyze-image", {
  image_url: "https://example.com/technical.jpg",
  analysis_type: "technical",
});
```

**Returns:**

- Image quality assessment
- Technical specifications
- Lighting analysis
- Focus and depth of field
- Exposure and color accuracy
- Potential improvements

## Custom Questions

Ask specific questions about the image for targeted analysis:

```typescript
await client.callTool("analyze-image", {
  image_url: "https://example.com/product.jpg",
  questions: [
    "What is the main product in this image?",
    "What is the brand name visible?",
    "What is the product color?",
    "Are there any visible defects or damage?",
    "What is the background color?",
    "Is the product packaging intact?",
  ],
});
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "analysis_type": "detailed",
    "description": "A professional product photograph showing a modern smartphone...",
    "objects": [
      {
        "name": "smartphone",
        "confidence": 0.98,
        "location": "center of image",
        "attributes": ["black", "sleek", "modern"]
      },
      {
        "name": "white background",
        "confidence": 0.95,
        "location": "background",
        "attributes": ["clean", "studio-style"]
      }
    ],
    "colors": {
      "dominant": ["white", "black", "gray"],
      "accent": ["silver"],
      "palette": "#FFFFFF, #000000, #333333, #C0C0C0"
    },
    "text": {
      "detected": true,
      "content": ["Brand Name", "Model X"],
      "locations": ["bottom of device", "packaging"]
    },
    "technical_details": {
      "quality": "high",
      "resolution": "estimated 1920x1080",
      "lighting": "professional studio lighting",
      "composition": "centered with rule of thirds",
      "focus": "sharp with shallow depth of field"
    },
    "mood": "professional and modern",
    "style": "commercial product photography",
    "confidence": 0.94,
    "processing_time": 2.3,
    "questions": [
      {
        "question": "What is the main product?",
        "answer": "A modern smartphone with black finish",
        "confidence": 0.96
      },
      {
        "question": "What is the brand name?",
        "answer": "Brand Name Model X",
        "confidence": 0.89
      }
    ]
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "INVALID_IMAGE_URL",
    "message": "Unable to access the provided image URL",
    "details": {
      "url": "https://example.com/nonexistent.jpg",
      "status_code": 404
    }
  }
}
```

## Use Cases

### E-commerce and Product Analysis

```typescript
async function analyzeProductImage(imageUrl: string) {
  const result = await client.callTool("analyze-image", {
    image_url: imageUrl,
    analysis_type: "detailed",
    questions: [
      "What is the main product?",
      "What is the product category?",
      "What color is the product?",
      "What is the brand if visible?",
      "What is the product condition?",
      "Are there any visible defects?",
      "What is the background style?",
      "Is this suitable for e-commerce listing?",
    ],
  });

  return result.data;
}
```

### Content Moderation

```typescript
async function moderateImage(imageUrl: string) {
  const result = await client.callTool("analyze-image", {
    image_url: imageUrl,
    analysis_type: "general",
    questions: [
      "Is this image appropriate for all audiences?",
      "Are there any safety concerns?",
      "Does this contain any prohibited content?",
      "Is this suitable for a family-friendly platform?",
      "Are there any copyright concerns visible?",
    ],
  });

  return result.data;
}
```

### Accessibility Support

```typescript
async function generateAltText(imageUrl: string) {
  const result = await client.callTool("analyze-image", {
    image_url: imageUrl,
    analysis_type: "general",
    questions: [
      "Provide a concise description suitable for alt text",
      "What are the key visual elements?",
      "What is the main subject or focus?",
      "What context is important for understanding?",
    ],
  });

  return result.data.questions[0].answer;
}
```

### Document Analysis

```typescript
async function analyzeDocument(imageUrl: string) {
  const result = await client.callTool("analyze-image", {
    image_url: imageUrl,
    analysis_type: "technical",
    questions: [
      "What type of document is this?",
      "What text can be read from this document?",
      "What is the document quality?",
      "Are there any signatures or stamps?",
      "What is the document structure?",
      "Is this a complete document?",
    ],
  });

  return result.data;
}
```

### Art and Creative Analysis

```typescript
async function analyzeArtwork(imageUrl: string) {
  const result = await client.callTool("analyze-image", {
    image_url: imageUrl,
    analysis_type: "artistic",
    questions: [
      "What artistic style is this?",
      "What medium was used?",
      "What is the composition technique?",
      "What mood does this convey?",
      "What colors dominate the palette?",
      "What historical period does this represent?",
    ],
  });

  return result.data;
}
```

## Error Handling

### Common Error Codes

| Error Code            | Description                | Solution                             |
| --------------------- | -------------------------- | ------------------------------------ |
| `INVALID_IMAGE_URL`   | URL is not accessible      | Check URL validity and accessibility |
| `UNSUPPORTED_FORMAT`  | Image format not supported | Use JPEG, PNG, GIF, or WebP          |
| `IMAGE_TOO_LARGE`     | Image exceeds size limit   | Reduce image size below 20MB         |
| `RATE_LIMIT_EXCEEDED` | Too many requests          | Wait before making more requests     |
| `ANALYSIS_FAILED`     | Vision analysis failed     | Retry with different parameters      |

### Error Handling Example

```typescript
async function safeAnalyzeImage(imageUrl: string) {
  try {
    const result = await client.callTool("analyze-image", {
      image_url: imageUrl,
      analysis_type: "general",
    });

    return result.data;
  } catch (error) {
    switch (error.code) {
      case "INVALID_IMAGE_URL":
        throw new Error("Please provide a valid, accessible image URL");
      case "UNSUPPORTED_FORMAT":
        throw new Error("Please use JPEG, PNG, GIF, or WebP format");
      case "IMAGE_TOO_LARGE":
        throw new Error("Image is too large. Please reduce size below 20MB");
      case "RATE_LIMIT_EXCEEDED":
        throw new Error("Rate limit exceeded. Please wait before retrying");
      default:
        throw new Error("Analysis failed. Please try again");
    }
  }
}
```

## Best Practices

### Image Quality

- **Use high-resolution images** for better analysis accuracy
- **Ensure good lighting** in the original image
- **Avoid heavily compressed images** that may lose important details
- **Use appropriate image formats** (JPEG for photos, PNG for graphics)

### URL Requirements

- **Ensure public accessibility** - URLs must be publicly accessible
- **Use HTTPS when possible** for security
- **Verify URL validity** before sending requests
- **Check image loading** to ensure it displays correctly

### Question Formulation

- **Be specific** in your questions
- **Ask one concept per question** for clearer answers
- **Use clear, direct language** without ambiguity
- **Avoid leading questions** that might bias responses

### Performance Optimization

- **Cache results** for repeated analysis of the same image
- **Use appropriate analysis types** - don't use 'detailed' when 'general' suffices
- **Batch related questions** in a single request
- **Consider rate limits** when processing multiple images

## Limitations

- **File Size**: Images must be under 20MB
- **Formats**: Supports JPEG, PNG, GIF, WebP
- **Accessibility**: Images must be publicly accessible via URL
- **Content**: Cannot analyze inappropriate or harmful content
- **Accuracy**: Results depend on image quality and clarity
- **Languages**: Text recognition works best with common languages

## Advanced Features

### Batch Analysis

```typescript
async function batchAnalyzeImages(imageUrls: string[]) {
  const results = [];

  for (const url of imageUrls) {
    try {
      const result = await client.callTool("analyze-image", {
        image_url: url,
        analysis_type: "general",
      });
      results.push({ url, success: true, data: result.data });
    } catch (error) {
      results.push({ url, success: false, error: error.message });
    }

    // Respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}
```

### Comparative Analysis

```typescript
async function compareImages(imageUrl1: string, imageUrl2: string) {
  const [analysis1, analysis2] = await Promise.all([
    client.callTool("analyze-image", {
      image_url: imageUrl1,
      analysis_type: "detailed",
    }),
    client.callTool("analyze-image", {
      image_url: imageUrl2,
      analysis_type: "detailed",
    }),
  ]);

  return {
    image1: analysis1.data,
    image2: analysis2.data,
    similarities: findSimilarities(analysis1.data, analysis2.data),
    differences: findDifferences(analysis1.data, analysis2.data),
  };
}
```

## Integration with Other Tools

### With Image Generation

```typescript
// Generate image and analyze result
const generated = await client.callTool("generate-image", {
  prompt: "A professional product photo of a smartphone",
  quality: "hd",
});

const analysis = await client.callTool("analyze-image", {
  image_url: generated.data.image_url,
  analysis_type: "technical",
  questions: [
    "Does this match the original prompt?",
    "What is the image quality?",
    "Are there any issues with the generation?",
  ],
});
```

### With Translation

```typescript
// Analyze image with Japanese questions
const analysis = await client.callTool("analyze-image", {
  image_url: imageUrl,
  questions: [
    "この画像の主な内容は何ですか？",
    "どのような色が使われていますか？",
    "この画像の品質はどうですか？",
  ],
});
```

## Next Steps

- [Vision Analysis Guide](/guide/vision-analysis.md) - Comprehensive usage guide
- [API Overview](/api/tools.md) - Other available tools
- [Examples](/examples/basic-usage.md) - Practical usage examples
- [Error Handling](/api/error-handling.md) - Detailed error management
