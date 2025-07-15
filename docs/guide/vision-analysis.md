# Vision Analysis

GPT Image 1 MCP provides powerful image analysis capabilities using OpenAI's GPT-4o Vision model. This feature allows you to analyze, describe, and extract information from images with advanced AI.

## Overview

The vision analysis feature uses GPT-4o Vision to provide detailed image analysis, including:

- **Content description**: Detailed descriptions of what's in the image
- **Object detection**: Identification of objects, people, and scenes
- **Text recognition**: Reading text within images
- **Artistic analysis**: Understanding composition, style, and artistic elements
- **Technical analysis**: Analyzing technical aspects of images

## Basic Usage

### analyze-image Tool

The `analyze-image` tool is the primary way to analyze images:

```typescript
await client.callTool("analyze-image", {
  image_url: "https://example.com/image.jpg",
  analysis_type: "general",
});
```

### Parameters

| Parameter       | Type     | Required | Description                        |
| --------------- | -------- | -------- | ---------------------------------- |
| `image_url`     | string   | Yes      | URL of the image to analyze        |
| `analysis_type` | string   | No       | Type of analysis to perform        |
| `questions`     | string[] | No       | Specific questions about the image |

### Analysis Types

#### General Analysis

Provides a comprehensive overview of the image:

```typescript
{
  image_url: 'https://example.com/photo.jpg',
  analysis_type: 'general'
}
```

#### Detailed Analysis

Offers in-depth description and analysis:

```typescript
{
  image_url: 'https://example.com/photo.jpg',
  analysis_type: 'detailed'
}
```

#### Artistic Analysis

Focuses on artistic elements and composition:

```typescript
{
  image_url: 'https://example.com/artwork.jpg',
  analysis_type: 'artistic'
}
```

#### Technical Analysis

Analyzes technical aspects like quality, format, and technical details:

```typescript
{
  image_url: 'https://example.com/technical.jpg',
  analysis_type: 'technical'
}
```

## Advanced Features

### Custom Questions

Ask specific questions about the image:

```typescript
await client.callTool("analyze-image", {
  image_url: "https://example.com/product.jpg",
  questions: [
    "What is the brand of this product?",
    "What color is the packaging?",
    "Are there any visible defects?",
  ],
});
```

### Batch Analysis

Analyze multiple images efficiently:

```typescript
const images = [
  "https://example.com/image1.jpg",
  "https://example.com/image2.jpg",
  "https://example.com/image3.jpg",
];

for (const imageUrl of images) {
  const result = await client.callTool("analyze-image", {
    image_url: imageUrl,
    analysis_type: "general",
  });
  console.log(`Analysis for ${imageUrl}:`, result);
}
```

## Response Format

The analysis returns structured data:

```json
{
  "success": true,
  "data": {
    "description": "A detailed description of the image content",
    "objects": [
      {
        "name": "object_name",
        "confidence": 0.95,
        "location": "description of location"
      }
    ],
    "text": "Any text found in the image",
    "colors": ["primary", "secondary", "accent"],
    "mood": "description of mood/atmosphere",
    "style": "artistic or photographic style",
    "technical_details": {
      "quality": "high/medium/low",
      "composition": "description",
      "lighting": "description"
    },
    "answers": [
      {
        "question": "What is the brand?",
        "answer": "Nike",
        "confidence": 0.9
      }
    ]
  }
}
```

## Use Cases

### Content Moderation

Automatically analyze uploaded images for appropriate content:

```typescript
const result = await client.callTool("analyze-image", {
  image_url: userUploadedImage,
  questions: [
    "Is this image appropriate for all audiences?",
    "Are there any safety concerns?",
    "Does this contain any prohibited content?",
  ],
});
```

### E-commerce

Analyze product images for catalog management:

```typescript
const result = await client.callTool("analyze-image", {
  image_url: productImage,
  analysis_type: "detailed",
  questions: [
    "What is the main product in this image?",
    "What is the product color?",
    "Are there any visible defects?",
    "What is the product category?",
  ],
});
```

### Accessibility

Generate alt text for images:

```typescript
const result = await client.callTool("analyze-image", {
  image_url: webImage,
  questions: [
    "Provide a concise description suitable for alt text",
    "What are the key visual elements?",
  ],
});
```

### Research and Analysis

Analyze documents, charts, and diagrams:

```typescript
const result = await client.callTool("analyze-image", {
  image_url: chartImage,
  analysis_type: "technical",
  questions: [
    "What type of chart is this?",
    "What are the key data points?",
    "What trends are visible?",
  ],
});
```

## Error Handling

Common errors and how to handle them:

### Invalid Image URL

```typescript
try {
  const result = await client.callTool("analyze-image", {
    image_url: "invalid-url",
  });
} catch (error) {
  if (error.code === "INVALID_URL") {
    console.log("Please provide a valid image URL");
  }
}
```

### Image Format Not Supported

```typescript
if (error.code === "UNSUPPORTED_FORMAT") {
  console.log("Supported formats: JPEG, PNG, GIF, WebP");
}
```

### Rate Limiting

```typescript
if (error.code === "RATE_LIMIT") {
  console.log("Rate limit exceeded. Please try again later.");
}
```

## Best Practices

### Image Quality

- Use high-quality images for better analysis results
- Ensure good lighting and clear visibility
- Avoid heavily compressed or low-resolution images

### URL Accessibility

- Ensure image URLs are publicly accessible
- Use HTTPS URLs when possible
- Check that images load correctly before analysis

### Analysis Types

- Choose the appropriate analysis type for your use case
- Use "general" for most cases
- Use "detailed" when you need comprehensive information
- Use "artistic" for creative content
- Use "technical" for quality assessment

### Question Formulation

- Be specific in your questions
- Ask one concept per question
- Use clear, direct language
- Avoid ambiguous phrasing

## Limitations

- **File Size**: Images should be under 20MB
- **Formats**: Supports JPEG, PNG, GIF, WebP
- **Content**: Cannot analyze inappropriate or harmful content
- **Accuracy**: Analysis accuracy depends on image quality and clarity

## Next Steps

- [Getting Started](/guide/getting-started.md) - Set up the MCP server
- [Image Generation](/guide/image-generation.md) - Generate images with OpenAI gpt-image-1
- [API Reference](/api/analyze-image.md) - Detailed API documentation
- [Examples](/examples/basic-usage.md) - Practical examples and use cases
