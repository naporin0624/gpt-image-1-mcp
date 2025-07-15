# Japanese Translation

GPT Image 1 MCP provides first-class support for Japanese language prompts through automatic translation to English, optimizing results for OpenAI gpt-image-1 image generation.

## Overview

OpenAI gpt-image-1 performs best with English prompts, but many users prefer to work in Japanese. Our translation feature bridges this gap by:

- **Automatic Detection**: Recognizes Japanese text automatically
- **Context-Aware Translation**: Preserves artistic and technical terms
- **Optimized for gpt-image-1**: Translates in a way that maximizes image generation quality
- **Bidirectional Support**: Works with mixed Japanese-English prompts

## translate-prompt Tool

The `translate-prompt` tool provides sophisticated Japanese to English translation specifically optimized for image generation.

### Basic Usage

```typescript
await client.callTool("translate-prompt", {
  japanese_prompt: "美しい桜の花が咲く日本庭園",
});
```

### Parameters

| Parameter                  | Type    | Required | Description                             |
| -------------------------- | ------- | -------- | --------------------------------------- |
| `japanese_prompt`          | string  | Yes      | Japanese text to translate              |
| `context`                  | string  | No       | Translation context for better accuracy |
| `preserve_technical_terms` | boolean | No       | Keep technical terms unchanged          |

### Context Types

#### General Context

For everyday prompts and general descriptions:

```typescript
{
  japanese_prompt: '美しい風景写真',
  context: 'general'
}
```

#### Artistic Context

For creative and artistic descriptions:

```typescript
{
  japanese_prompt: '印象派スタイルの絵画',
  context: 'artistic'
}
```

#### Photographic Context

For photography-related prompts:

```typescript
{
  japanese_prompt: 'プロフェッショナルな商品写真',
  context: 'photographic'
}
```

#### Technical Context

For technical or specialized terminology:

```typescript
{
  japanese_prompt: '高解像度のデジタルアート',
  context: 'technical'
}
```

## Features

### Automatic Translation Integration

When using `generate-image` with Japanese text, translation happens automatically:

```typescript
// Japanese prompt is automatically translated
await client.callTool("generate-image", {
  prompt: "夕日に照らされた富士山の美しい風景",
  aspect_ratio: "landscape",
});
```

### Mixed Language Support

The system handles mixed Japanese-English prompts intelligently:

```typescript
await client.callTool("generate-image", {
  prompt: "A beautiful 日本庭園 with cherry blossoms in spring",
  aspect_ratio: "square",
});
```

### Technical Term Preservation

Important technical terms are preserved during translation:

```typescript
await client.callTool("translate-prompt", {
  japanese_prompt: "4K解像度のハイパーリアリスティックな写真",
  preserve_technical_terms: true,
});
```

## Response Format

The translation tool returns detailed information:

```json
{
  "success": true,
  "data": {
    "original_prompt": "美しい桜の花が咲く日本庭園",
    "english_prompt": "A beautiful Japanese garden with blooming cherry blossoms",
    "confidence": 0.95,
    "detected_language": "japanese",
    "preserved_terms": ["桜", "日本庭園"],
    "context_applied": "artistic",
    "suggestions": [
      "Consider adding style descriptors for better results",
      "Add lighting information for enhanced realism"
    ]
  }
}
```

## Best Practices

### Writing Effective Japanese Prompts

1. **Be Descriptive**: Use rich adjectives and detailed descriptions
2. **Specify Style**: Mention artistic styles, periods, or techniques
3. **Include Context**: Add setting, mood, and atmosphere details
4. **Use Proper Nouns**: Include specific names, places, or brands when relevant

### Examples of Good Japanese Prompts

```typescript
// Detailed artistic description
await client.callTool("translate-prompt", {
  japanese_prompt:
    "印象派スタイルの油絵で描かれた、夕暮れ時の静かな湖畔の風景。柔らかな光と影のコントラストが美しい。",
  context: "artistic",
});

// Technical photography prompt
await client.callTool("translate-prompt", {
  japanese_prompt:
    "プロフェッショナルな商品写真。白背景にスタジオライティングで照らされたスマートフォン。",
  context: "photographic",
});

// Character and scene description
await client.callTool("translate-prompt", {
  japanese_prompt:
    "和服を着た優雅な女性が、満開の桜の木の下で茶道をしている様子。",
  context: "general",
});
```

## Advanced Features

### Batch Translation

Translate multiple prompts efficiently:

```typescript
const japanesePrompts = [
  "美しい山の風景",
  "現代的なオフィス空間",
  "伝統的な日本料理",
];

for (const prompt of japanesePrompts) {
  const result = await client.callTool("translate-prompt", {
    japanese_prompt: prompt,
    context: "general",
  });
  console.log(`${prompt} -> ${result.data.english_prompt}`);
}
```

### Quality Enhancement

The translation system provides suggestions for improving prompts:

```typescript
const result = await client.callTool("translate-prompt", {
  japanese_prompt: "猫",
  context: "general",
});

// Result includes suggestions:
// "Consider adding descriptive details like breed, color, or setting"
```

### Cultural Context Handling

The system understands cultural concepts and translates them appropriately:

```typescript
// Japanese cultural concepts
await client.callTool("translate-prompt", {
  japanese_prompt: "侘寂の美学を表現した茶室",
  context: "artistic",
});
// Result: "A tea room expressing the wabi-sabi aesthetic"
```

## Integration with Image Generation

### Seamless Workflow

```typescript
// 1. Translate Japanese prompt
const translation = await client.callTool("translate-prompt", {
  japanese_prompt: "夕日に照らされた富士山",
  context: "photographic",
});

// 2. Generate image with translated prompt
const image = await client.callTool("generate-image", {
  prompt: translation.data.english_prompt,
  aspect_ratio: "landscape",
  quality: "hd",
});

// 3. Analyze the result
const analysis = await client.callTool("analyze-image", {
  image_url: image.data.image_url,
  questions: ["Does this capture the essence of the original Japanese prompt?"],
});
```

### Prompt Optimization

The translation service optimizes prompts for better OpenAI gpt-image-1 results:

```typescript
// Before optimization
const basicTranslation = await client.callTool("translate-prompt", {
  japanese_prompt: "綺麗な花",
});
// Result: "Beautiful flower"

// After optimization
const optimizedTranslation = await client.callTool("translate-prompt", {
  japanese_prompt: "綺麗な花",
  context: "artistic",
});
// Result: "A beautiful, vibrant flower with delicate petals in soft natural lighting"
```

## Error Handling

### Common Issues

#### Language Detection Errors

```typescript
try {
  const result = await client.callTool("translate-prompt", {
    japanese_prompt: "This is actually English text",
  });
} catch (error) {
  if (error.code === "LANGUAGE_DETECTION_ERROR") {
    console.log("Text appears to be in a different language");
  }
}
```

#### Translation Confidence

```typescript
const result = await client.callTool("translate-prompt", {
  japanese_prompt: "複雑な専門用語を含む文章",
});

if (result.data.confidence < 0.8) {
  console.log("Translation may need manual review");
}
```

## Configuration

### Environment Variables

Configure translation behavior through environment variables:

```bash
# Enable automatic translation for generate-image
AUTO_TRANSLATE_JAPANESE=true

# Set default translation context
DEFAULT_TRANSLATION_CONTEXT=general

# Enable technical term preservation
PRESERVE_TECHNICAL_TERMS=true
```

### MCP Client Configuration

```json
{
  "mcpServers": {
    "gpt-image-1-mcp": {
      "env": {
        "AUTO_TRANSLATE_JAPANESE": "true",
        "DEFAULT_TRANSLATION_CONTEXT": "artistic"
      }
    }
  }
}
```

## Use Cases

### Creative Content Creation

- Translate artistic vision from Japanese to optimized English prompts
- Preserve cultural nuances while maximizing OpenAI gpt-image-1 performance
- Generate culturally appropriate imagery from Japanese descriptions

### Professional Photography

- Convert Japanese photography briefs to technical English specifications
- Maintain professional terminology while ensuring accuracy
- Generate reference images for Japanese client projects

### Educational Materials

- Create visual aids from Japanese educational content
- Translate historical or cultural descriptions for image generation
- Generate illustrations for Japanese language learning materials

### Marketing and Branding

- Convert Japanese brand concepts to visual prompts
- Maintain brand voice while optimizing for image generation
- Create culturally sensitive marketing imagery

## Limitations

- **Dialect Support**: Primarily supports standard Japanese (標準語)
- **Context Sensitivity**: May require manual context specification for highly specialized terms
- **Cultural Nuances**: Some cultural concepts may lose subtlety in translation
- **Real-time Translation**: Processing time increases with prompt complexity

## Next Steps

- [Getting Started](/guide/getting-started.md) - Set up the MCP server
- [Image Generation](/guide/image-generation.md) - Generate images with translated prompts
- [API Reference](/api/translate-prompt.md) - Detailed API documentation
- [Examples](/examples/basic-usage.md) - Practical usage examples
