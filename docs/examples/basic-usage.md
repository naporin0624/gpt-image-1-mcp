# Basic Usage Examples

This guide provides practical examples of using GPT Image 1 MCP in real-world scenarios.

## Prerequisites

Before following these examples, ensure you have:

- GPT Image 1 MCP server running
- MCP client properly configured
- Valid OpenAI API key set up

## Quick Start

### Your First Image Generation

```typescript
// Generate a simple image
const result = await client.callTool("generate-image", {
  prompt:
    "A beautiful sunset over a calm lake with mountains in the background",
});

console.log("Image generated:", result.data.local_path);
console.log("Image URL:", result.data.image_url);
```

### Basic Image Analysis

```typescript
// Analyze an existing image
const analysis = await client.callTool("analyze-image", {
  image_url: "https://example.com/image.jpg",
});

console.log("Analysis:", analysis.data.description);
```

### Japanese Prompt Translation

```typescript
// Translate Japanese to English for better gpt-image-1 results
const translation = await client.callTool("translate-prompt", {
  japanese_prompt: "桜の花が咲く美しい日本庭園",
});

console.log("Translated prompt:", translation.data.english_prompt);

// Use the translated prompt for image generation
const result = await client.callTool("generate-image", {
  prompt: translation.data.english_prompt,
});
```

## Common Use Cases

### 1. Content Creation Workflow

```typescript
async function createContentImage(topic: string) {
  // Step 1: Generate image
  const imageResult = await client.callTool("generate-image", {
    prompt: `A professional illustration representing ${topic}, modern flat design style, vibrant colors`,
    aspect_ratio: "landscape",
    quality: "hd",
    style: "vivid",
  });

  // Step 2: Analyze the generated image
  const analysisResult = await client.callTool("analyze-image", {
    image_url: imageResult.data.image_url,
    questions: [
      "What is the main subject of this image?",
      "What colors are predominant?",
      "Is this suitable for professional use?",
    ],
  });

  return {
    image: imageResult.data,
    analysis: analysisResult.data,
  };
}

// Usage
const content = await createContentImage("artificial intelligence");
```

### 2. E-commerce Product Mockups

```typescript
async function generateProductMockup(productDescription: string) {
  const result = await client.callTool("generate-image", {
    prompt: `Professional product photography of ${productDescription}, clean white background, studio lighting, commercial photography style, high quality`,
    aspect_ratio: "square",
    quality: "hd",
    style: "natural",
    filename: `product_${Date.now()}`,
    organize_by: "date",
  });

  return result.data;
}

// Generate multiple product variants
const products = [
  "a sleek smartphone with metallic finish",
  "a minimalist wooden desk lamp",
  "a modern coffee mug with geometric patterns",
];

for (const product of products) {
  const mockup = await generateProductMockup(product);
  console.log(`Generated mockup for ${product}:`, mockup.local_path);
}
```

### 3. Social Media Content

```typescript
async function createSocialMediaPost(message: string, platform: string) {
  const aspectRatios = {
    instagram: "square",
    twitter: "landscape",
    pinterest: "portrait",
  };

  const result = await client.callTool("generate-image", {
    prompt: `Social media graphic with text "${message}", modern design, vibrant colors, engaging visual elements`,
    aspect_ratio: aspectRatios[platform],
    quality: "hd",
    style: "vivid",
    filename: `social_${platform}_${Date.now()}`,
  });

  return result.data;
}

// Create posts for different platforms
const message = "Join us for our exciting new product launch!";
const platforms = ["instagram", "twitter", "pinterest"];

for (const platform of platforms) {
  const post = await createSocialMediaPost(message, platform);
  console.log(`Created ${platform} post:`, post.local_path);
}
```

### 4. Educational Content

```typescript
async function createEducationalDiagram(concept: string) {
  const result = await client.callTool("generate-image", {
    prompt: `Educational diagram explaining ${concept}, clear labels, simple illustration style, informative and easy to understand`,
    aspect_ratio: "landscape",
    quality: "hd",
    style: "natural",
    analyze_after_generation: true,
  });

  return {
    image: result.data,
    analysis: result.data.analysis,
  };
}

// Create educational content
const diagram = await createEducationalDiagram("how solar panels work");
console.log("Educational diagram created:", diagram.image.local_path);
console.log("Content analysis:", diagram.analysis.description);
```

### 5. Brand Identity Assets

```typescript
async function generateBrandAssets(brandName: string, industry: string) {
  const assets = [];

  // Generate logo concepts
  const logoResult = await client.callTool("generate-image", {
    prompt: `Modern logo design for ${brandName}, a ${industry} company, clean minimal style, professional`,
    aspect_ratio: "square",
    quality: "hd",
    style: "natural",
    filename: `${brandName}_logo`,
  });
  assets.push({ type: "logo", ...logoResult.data });

  // Generate brand colors palette
  const paletteResult = await client.callTool("generate-image", {
    prompt: `Color palette for ${brandName} brand, ${industry} industry, professional color swatches, modern design`,
    aspect_ratio: "landscape",
    quality: "hd",
    style: "natural",
    filename: `${brandName}_colors`,
  });
  assets.push({ type: "palette", ...paletteResult.data });

  // Generate business card mockup
  const cardResult = await client.callTool("generate-image", {
    prompt: `Business card design for ${brandName}, ${industry} company, professional layout, modern typography`,
    aspect_ratio: "landscape",
    quality: "hd",
    style: "natural",
    filename: `${brandName}_business_card`,
  });
  assets.push({ type: "business_card", ...cardResult.data });

  return assets;
}

// Generate brand assets
const brandAssets = await generateBrandAssets("TechFlow", "technology");
brandAssets.forEach((asset) => {
  console.log(`Generated ${asset.type}:`, asset.local_path);
});
```

## Advanced Patterns

### 1. Batch Processing with Error Handling

```typescript
async function batchGenerateImages(prompts: string[]) {
  const results = [];
  const errors = [];

  for (const [index, prompt] of prompts.entries()) {
    try {
      console.log(`Processing ${index + 1}/${prompts.length}: ${prompt}`);

      const result = await client.callTool("generate-image", {
        prompt,
        aspect_ratio: "square",
        quality: "standard",
        filename: `batch_${index + 1}`,
      });

      results.push({
        index,
        prompt,
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error(`Error processing prompt ${index + 1}:`, error.message);
      errors.push({
        index,
        prompt,
        error: error.message,
      });
    }

    // Add delay to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { results, errors };
}

// Usage
const prompts = [
  "A serene mountain landscape",
  "A bustling city street at night",
  "A cozy library interior",
  "A futuristic spacecraft",
];

const batchResult = await batchGenerateImages(prompts);
console.log(`Successfully generated ${batchResult.results.length} images`);
console.log(`Errors: ${batchResult.errors.length}`);
```

### 2. Progressive Enhancement

```typescript
async function createProgressiveImage(basePrompt: string) {
  // Start with standard quality
  const standardResult = await client.callTool("generate-image", {
    prompt: basePrompt,
    quality: "standard",
    filename: "preview",
  });

  // Analyze the preview
  const analysis = await client.callTool("analyze-image", {
    image_url: standardResult.data.image_url,
    questions: [
      "Is this image composition good?",
      "Are the colors appropriate?",
      "What could be improved?",
    ],
  });

  // Enhance based on analysis
  const enhancedPrompt = `${basePrompt}, ${analysis.data.answers.map((a) => a.answer).join(", ")}`;

  const hdResult = await client.callTool("generate-image", {
    prompt: enhancedPrompt,
    quality: "hd",
    filename: "final",
  });

  return {
    preview: standardResult.data,
    analysis: analysis.data,
    final: hdResult.data,
  };
}

// Usage
const progressive = await createProgressiveImage("A modern office workspace");
```

### 3. Multilingual Content Creation

```typescript
async function createMultilingualContent(japanesePrompt: string) {
  // Translate Japanese prompt
  const translation = await client.callTool("translate-prompt", {
    japanese_prompt: japanesePrompt,
    context: "artistic",
    preserve_technical_terms: true,
  });

  // Generate image with translated prompt
  const imageResult = await client.callTool("generate-image", {
    prompt: translation.data.english_prompt,
    aspect_ratio: "landscape",
    quality: "hd",
    style: "vivid",
  });

  // Analyze generated image
  const analysis = await client.callTool("analyze-image", {
    image_url: imageResult.data.image_url,
    analysis_type: "detailed",
  });

  return {
    original_prompt: japanesePrompt,
    translated_prompt: translation.data.english_prompt,
    image: imageResult.data,
    analysis: analysis.data,
  };
}

// Usage
const multilingualContent =
  await createMultilingualContent("美しい桜の花が咲く春の日本庭園");
```

## Error Handling Best Practices

### Robust Error Handling

```typescript
async function safeImageGeneration(prompt: string, options = {}) {
  try {
    const result = await client.callTool("generate-image", {
      prompt,
      ...options,
    });
    return { success: true, data: result.data };
  } catch (error) {
    console.error("Image generation failed:", error);

    switch (error.code) {
      case "RATE_LIMIT":
        return {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: 60000, // 1 minute
        };

      case "INVALID_PROMPT":
        return {
          success: false,
          error: "Prompt violates content policy. Please revise.",
          suggestion: "Try using more general terms",
        };

      case "QUOTA_EXCEEDED":
        return {
          success: false,
          error: "API quota exceeded. Check your usage limits.",
        };

      default:
        return {
          success: false,
          error: "An unexpected error occurred. Please try again.",
        };
    }
  }
}
```

### Retry Logic

```typescript
async function generateWithRetry(prompt: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await client.callTool("generate-image", { prompt });
      return result;
    } catch (error) {
      if (error.code === "RATE_LIMIT" && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(
          `Rate limited. Waiting ${waitTime}ms before retry ${attempt}...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
}
```

## Performance Tips

1. **Use appropriate quality settings**: Start with standard quality for iterations
2. **Implement caching**: Store results to avoid regenerating similar images
3. **Batch similar requests**: Group related image generations
4. **Handle rate limits gracefully**: Implement exponential backoff
5. **Optimize prompts**: Clear, specific prompts generate better results faster

## Next Steps

- [Advanced Scenarios](/examples/advanced-scenarios.md) - Complex workflows and patterns
- [Integration Patterns](/examples/integration-patterns.md) - Integrate with other systems
- [API Reference](/api/tools.md) - Complete API documentation
- [Vision Analysis](/guide/vision-analysis.md) - Analyze generated images
