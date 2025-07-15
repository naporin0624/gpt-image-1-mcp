# translate-prompt

Translate Japanese prompts to English with optimization for OpenAI gpt-image-1 image generation, preserving context and technical terms while maximizing generation quality.

## Overview

The `translate-prompt` tool provides intelligent Japanese-to-English translation specifically designed for image generation workflows. It goes beyond basic translation to optimize prompts for OpenAI gpt-image-1, ensuring better image generation results.

## Basic Usage

```typescript
await client.callTool("translate-prompt", {
  japanese_prompt: "美しい桜の花が咲く日本庭園",
});
```

## Parameters

### Required Parameters

| Parameter         | Type   | Description                |
| ----------------- | ------ | -------------------------- |
| `japanese_prompt` | string | Japanese text to translate |

### Optional Parameters

| Parameter                  | Type    | Default     | Description                             |
| -------------------------- | ------- | ----------- | --------------------------------------- |
| `context`                  | string  | `"general"` | Translation context for better accuracy |
| `preserve_technical_terms` | boolean | `true`      | Keep technical/artistic terms unchanged |

## Context Types

### General Context

For everyday prompts and general descriptions:

```typescript
await client.callTool("translate-prompt", {
  japanese_prompt: "美しい風景写真",
  context: "general",
});
```

**Best for:**

- Simple descriptions
- Everyday objects and scenes
- General photography
- Basic concepts

### Artistic Context

For creative and artistic descriptions:

```typescript
await client.callTool("translate-prompt", {
  japanese_prompt: "印象派スタイルの油絵",
  context: "artistic",
});
```

**Best for:**

- Art styles and movements
- Creative descriptions
- Artistic techniques
- Aesthetic concepts

### Photographic Context

For photography-related prompts:

```typescript
await client.callTool("translate-prompt", {
  japanese_prompt: "スタジオライティングでの商品写真",
  context: "photographic",
});
```

**Best for:**

- Camera settings and techniques
- Lighting descriptions
- Photography styles
- Technical photography terms

### Technical Context

For technical or specialized terminology:

```typescript
await client.callTool("translate-prompt", {
  japanese_prompt: "4K解像度のデジタルアート",
  context: "technical",
});
```

**Best for:**

- Technical specifications
- Digital art terms
- Professional terminology
- Specialized concepts

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "original_prompt": "美しい桜の花が咲く日本庭園",
    "english_prompt": "A beautiful Japanese garden with blooming cherry blossoms",
    "optimized_prompt": "A beautiful traditional Japanese garden with blooming sakura cherry blossoms, serene atmosphere, natural lighting, photorealistic style",
    "confidence": 0.95,
    "detected_language": "japanese",
    "context_applied": "general",
    "preserved_terms": ["sakura", "Japanese garden"],
    "enhancements": [
      "Added 'traditional' for cultural context",
      "Included 'serene atmosphere' for mood",
      "Added 'natural lighting' for better generation",
      "Specified 'photorealistic style' for clarity"
    ],
    "suggestions": [
      "Consider adding time of day for better lighting",
      "Specify camera angle for composition",
      "Add weather conditions for atmosphere"
    ],
    "processing_time": 1.2
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "LANGUAGE_NOT_DETECTED",
    "message": "No Japanese text detected in the prompt",
    "details": {
      "detected_language": "english",
      "confidence": 0.98
    }
  }
}
```

## Translation Features

### Automatic Optimization

The tool automatically enhances prompts for better OpenAI gpt-image-1 results:

```typescript
// Basic translation
await client.callTool("translate-prompt", {
  japanese_prompt: "猫",
});
// Result: "A cat" → "A beautiful domestic cat with detailed fur texture"

// Artistic translation
await client.callTool("translate-prompt", {
  japanese_prompt: "猫",
  context: "artistic",
});
// Result: "A cat" → "An artistic portrayal of a cat with expressive eyes and detailed fur, painted in a realistic style"
```

### Cultural Context Preservation

```typescript
await client.callTool("translate-prompt", {
  japanese_prompt: "侘寂の美学を表現した茶室",
  context: "artistic",
});
// Result: "A tea room expressing the wabi-sabi aesthetic of imperfect beauty"
```

### Technical Term Handling

```typescript
await client.callTool("translate-prompt", {
  japanese_prompt: "HDR写真のボケ効果",
  context: "photographic",
  preserve_technical_terms: true,
});
// Result: "HDR photography with bokeh effect"
```

## Use Cases

### Creative Content Generation

```typescript
async function createArtisticImage(japaneseDescription: string) {
  // Translate with artistic context
  const translation = await client.callTool("translate-prompt", {
    japanese_prompt: japaneseDescription,
    context: "artistic",
  });

  // Generate image with optimized prompt
  const image = await client.callTool("generate-image", {
    prompt: translation.data.optimized_prompt,
    style: "vivid",
    quality: "hd",
  });

  return {
    original: japaneseDescription,
    translated: translation.data.english_prompt,
    optimized: translation.data.optimized_prompt,
    image: image.data,
  };
}
```

### Product Photography

```typescript
async function generateProductPhoto(productDescription: string) {
  const translation = await client.callTool("translate-prompt", {
    japanese_prompt: productDescription,
    context: "photographic",
  });

  const image = await client.callTool("generate-image", {
    prompt: translation.data.optimized_prompt,
    aspect_ratio: "square",
    style: "natural",
    quality: "hd",
  });

  return image.data;
}
```

### Batch Translation

```typescript
async function batchTranslatePrompts(prompts: string[]) {
  const results = [];

  for (const prompt of prompts) {
    const translation = await client.callTool("translate-prompt", {
      japanese_prompt: prompt,
      context: "general",
    });

    results.push({
      original: prompt,
      translated: translation.data.english_prompt,
      optimized: translation.data.optimized_prompt,
      confidence: translation.data.confidence,
    });

    // Respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}
```

### Quality Assessment

```typescript
async function assessTranslationQuality(japanesePrompt: string) {
  const translation = await client.callTool("translate-prompt", {
    japanese_prompt: japanesePrompt,
    context: "general",
  });

  const { confidence, suggestions, enhancements } = translation.data;

  return {
    quality: confidence > 0.9 ? "high" : confidence > 0.7 ? "medium" : "low",
    confidence,
    improvements: suggestions,
    enhancements,
  };
}
```

## Advanced Features

### Mixed Language Support

```typescript
await client.callTool("translate-prompt", {
  japanese_prompt: "A beautiful 日本庭園 with cherry blossoms in 春の季節",
});
// Result: "A beautiful Japanese garden with cherry blossoms in spring season"
```

### Contextual Enhancement

```typescript
// Before enhancement
await client.callTool("translate-prompt", {
  japanese_prompt: "花",
  context: "general",
});
// Result: "A flower" → "A beautiful flower with vibrant petals"

// After enhancement
await client.callTool("translate-prompt", {
  japanese_prompt: "花",
  context: "artistic",
});
// Result: "A flower" → "An artistic rendering of a delicate flower with intricate petals, soft natural lighting, detailed botanical illustration style"
```

### Style-Specific Optimization

```typescript
const contexts = ["general", "artistic", "photographic", "technical"];
const results = {};

for (const context of contexts) {
  results[context] = await client.callTool("translate-prompt", {
    japanese_prompt: "美しい風景",
    context,
  });
}

// Compare optimizations across contexts
console.log(results);
```

## Error Handling

### Common Error Codes

| Error Code              | Description               | Solution                                        |
| ----------------------- | ------------------------- | ----------------------------------------------- |
| `LANGUAGE_NOT_DETECTED` | No Japanese text found    | Ensure input contains Japanese characters       |
| `INVALID_CONTEXT`       | Invalid context type      | Use: general, artistic, photographic, technical |
| `PROMPT_TOO_LONG`       | Input text exceeds limit  | Reduce prompt length below 1000 characters      |
| `TRANSLATION_FAILED`    | Translation service error | Retry with simpler text                         |

### Error Handling Example

```typescript
async function safeTranslatePrompt(japaneseText: string) {
  try {
    const result = await client.callTool("translate-prompt", {
      japanese_prompt: japaneseText,
      context: "general",
    });

    return result.data;
  } catch (error) {
    switch (error.code) {
      case "LANGUAGE_NOT_DETECTED":
        throw new Error("Please provide Japanese text for translation");
      case "INVALID_CONTEXT":
        throw new Error(
          "Invalid context. Use: general, artistic, photographic, or technical",
        );
      case "PROMPT_TOO_LONG":
        throw new Error(
          "Text is too long. Please reduce to under 1000 characters",
        );
      default:
        throw new Error("Translation failed. Please try again");
    }
  }
}
```

## Best Practices

### Writing Effective Japanese Prompts

1. **Be Descriptive**: Use rich adjectives and detailed descriptions
2. **Include Context**: Add setting, mood, and atmosphere details
3. **Specify Style**: Mention artistic styles, periods, or techniques
4. **Use Cultural Terms**: Include specific cultural concepts when relevant

### Examples of Good Prompts

```typescript
// Good: Detailed and contextual
await client.callTool("translate-prompt", {
  japanese_prompt:
    "夕暮れ時の静かな湖畔で、柔らかな光に照らされた一本の桜の木。水面には桜の花びらが浮かんでいる。",
});

// Better: More specific and artistic
await client.callTool("translate-prompt", {
  japanese_prompt:
    "印象派スタイルの油絵で描かれた、夕暮れ時の静かな湖畔の風景。柔らかな光と影のコントラストが美しく、水面には桜の花びらが浮かんでいる。",
  context: "artistic",
});
```

### Context Selection Guidelines

- **General**: Simple, everyday descriptions
- **Artistic**: Creative works, art styles, aesthetic concepts
- **Photographic**: Camera techniques, lighting, professional photography
- **Technical**: Specifications, digital art, professional terminology

## Integration Examples

### With Image Generation

```typescript
async function generateFromJapanese(japanesePrompt: string) {
  // 1. Translate and optimize
  const translation = await client.callTool("translate-prompt", {
    japanese_prompt: japanesePrompt,
    context: "artistic",
  });

  // 2. Generate image
  const image = await client.callTool("generate-image", {
    prompt: translation.data.optimized_prompt,
    quality: "hd",
    style: "vivid",
  });

  // 3. Analyze result
  const analysis = await client.callTool("analyze-image", {
    image_url: image.data.image_url,
    questions: [
      "Does this match the original Japanese concept?",
      "What cultural elements are present?",
    ],
  });

  return {
    translation: translation.data,
    image: image.data,
    analysis: analysis.data,
  };
}
```

### Quality Improvement Workflow

```typescript
async function improveJapanesePrompt(japanesePrompt: string) {
  const translation = await client.callTool("translate-prompt", {
    japanese_prompt: japanesePrompt,
    context: "general",
  });

  if (translation.data.confidence < 0.8) {
    // Try different contexts for better results
    const contexts = ["artistic", "photographic", "technical"];
    const results = await Promise.all(
      contexts.map((context) =>
        client.callTool("translate-prompt", {
          japanese_prompt: japanesePrompt,
          context,
        }),
      ),
    );

    // Select best translation
    const bestTranslation = results.reduce((best, current) =>
      current.data.confidence > best.data.confidence ? current : best,
    );

    return bestTranslation.data;
  }

  return translation.data;
}
```

## Performance Optimization

### Caching Strategy

```typescript
const translationCache = new Map();

async function cachedTranslate(
  japanesePrompt: string,
  context: string = "general",
) {
  const cacheKey = `${japanesePrompt}:${context}`;

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const result = await client.callTool("translate-prompt", {
    japanese_prompt: japanesePrompt,
    context,
  });

  translationCache.set(cacheKey, result.data);
  return result.data;
}
```

### Batch Processing

```typescript
async function processBatchTranslations(
  prompts: string[],
  context: string = "general",
) {
  const batchSize = 5;
  const results = [];

  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((prompt) =>
        client.callTool("translate-prompt", {
          japanese_prompt: prompt,
          context,
        }),
      ),
    );

    results.push(...batchResults);

    // Rate limiting
    if (i + batchSize < prompts.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
```

## Next Steps

- [Japanese Translation Guide](/guide/japanese-translation.md) - Comprehensive usage guide
- [Image Generation API](/api/generate-image.md) - Use translated prompts for generation
- [API Overview](/api/tools.md) - Other available tools
- [Examples](/examples/basic-usage.md) - Practical usage examples
