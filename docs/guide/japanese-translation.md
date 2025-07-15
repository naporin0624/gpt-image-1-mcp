# English-Only Input and Translation Guide

GPT Image 1 MCP requires English-only text input for optimal performance with OpenAI's gpt-image-1 model. This guide explains the design rationale and provides best practices for non-English users.

## Overview

This MCP server uses an **English-only input validation** architecture that:

- **Validates all text inputs**: Prompts, descriptions, and style guidance must be in English
- **Rejects non-English text**: Provides clear error messages with helpful guidance
- **Leverages gpt-image-1's strengths**: Optimized for gpt-image-1's superior English language understanding
- **Simplifies architecture**: No internal translation logic required
- **Improves performance**: Direct English processing, faster responses

## Why English-Only?

### gpt-image-1 Advantages

gpt-image-1 is built on GPT-4o's language engine, providing:

- **Superior instruction following** in English
- **Advanced text rendering** capabilities
- **Better spatial reasoning** with English descriptions
- **Consistent quality** across generations

### Architectural Benefits

- **Reduced complexity**: No internal translation API calls
- **Better user control**: Users choose their preferred translation method
- **Lower latency**: Direct processing without translation overhead
- **Cost optimization**: No additional translation API costs
- **Clearer responsibility**: LLMs handle translation, MCP handles image generation

## Using Non-English Prompts

### LLM-First Translation Workflow

For Japanese users, follow this recommended workflow:

```
1. Write your prompt in Japanese
2. Ask your LLM to translate to English
3. Use the translated prompt with the MCP server
4. Generate images with superior gpt-image-1 quality
```

#### Example Workflow

**Step 1: Japanese Prompt**

```
User: "桜の花が咲いている美しい日本庭園を描いて"
```

**Step 2: LLM Translation**

```
LLM: "A beautiful Japanese garden with cherry blossoms in bloom"
```

**Step 3: MCP Image Generation**

```typescript
await client.callTool("generate-image", {
  prompt: "A beautiful Japanese garden with cherry blossoms in bloom",
  aspect_ratio: "landscape",
  quality: "hd",
});
```

### Translation Best Practices

#### Use Your LLM for Translation

**Good:**

```
User: "この文章を英語に翻訳して、画像生成用に最適化してください: 印象派スタイルの油絵で描かれた夕暮れの風景"
LLM: "A sunset landscape painted in impressionist oil painting style, with soft brushstrokes and warm lighting"
```

**Better:**

```
User: "Translate and optimize this for gpt-image-1: 印象派スタイルの油絵で描かれた夕暮れの風景"
LLM: "An impressionist oil painting of a sunset landscape with visible brushstrokes, vibrant warm colors blending in the sky, and soft golden light illuminating the scene"
```

#### Preserve Cultural Context

When translating cultural concepts:

```
Japanese: "侘寂の美学を表現した茶室"
English: "A traditional Japanese tea room expressing wabi-sabi aesthetic philosophy with weathered wood, subtle imperfections, and serene simplicity"
```

## Validation Error Handling

### Error Messages

When non-English text is detected, you'll receive helpful errors:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Only English text is supported for optimal gpt-image-1 performance",
    "details": {
      "field": "prompt",
      "detected_language": "japanese",
      "suggestion": "Please translate your prompt to English using your LLM client first"
    }
  }
}
```

### Common Error Scenarios

#### Mixed Language Input

```typescript
// This will be rejected
await client.callTool("generate-image", {
  prompt: "A beautiful 日本庭園 with flowers",
});

// Error: Mixed language detected
```

#### Non-English Prompts

```typescript
// This will be rejected
await client.callTool("generate-image", {
  prompt: "美しい桜の花",
});

// Error: Japanese text detected
```

## Integration Patterns

### Client-Side Translation

```typescript
class EnglishOptimizedImageGenerator {
  constructor(
    private llmClient: LLMClient,
    private mcpClient: MCPClient,
  ) {}

  async generateFromJapanese(japanesePrompt: string) {
    // Step 1: Translate with your LLM
    const translationRequest = `Translate this to English and optimize for image generation: ${japanesePrompt}`;
    const englishPrompt = await this.llmClient.complete(translationRequest);

    // Step 2: Generate with MCP
    const result = await this.mcpClient.callTool("generate-image", {
      prompt: englishPrompt,
      quality: "hd",
    });

    return {
      originalPrompt: japanesePrompt,
      englishPrompt,
      image: result.data,
    };
  }
}
```

### Batch Translation Workflow

```typescript
async function batchTranslateAndGenerate(japanesePrompts: string[]) {
  const results = [];

  for (const jpPrompt of japanesePrompts) {
    // Translate each prompt
    const englishPrompt = await translateWithLLM(jpPrompt);

    // Generate image
    const image = await client.callTool("generate-image", {
      prompt: englishPrompt,
    });

    results.push({
      original: jpPrompt,
      translated: englishPrompt,
      image: image.data,
    });

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

async function translateWithLLM(japaneseText: string): Promise<string> {
  // Use your preferred LLM for translation
  // This could be Claude, GPT-4, or any other LLM
  const translationPrompt = `Translate this Japanese text to English, optimizing for image generation with gpt-image-1: ${japaneseText}`;

  // Implementation depends on your LLM client
  return await yourLLMClient.complete(translationPrompt);
}
```

## Quality Optimization Tips

### Translation for Image Generation

When using LLMs for translation, include these instructions:

**Basic Translation:**

```
"Translate to English: [Japanese text]"
```

**Optimized Translation:**

```
"Translate this Japanese text to English and optimize for gpt-image-1 image generation. Include specific visual details, lighting, composition, and artistic style: [Japanese text]"
```

**Cultural Preservation:**

```
"Translate to English while preserving cultural context and adding visual details that would help an AI understand the Japanese aesthetic: [Japanese text]"
```

### Examples of Optimized Translations

| Japanese | Basic Translation | Optimized Translation                                                                    |
| -------- | ----------------- | ---------------------------------------------------------------------------------------- |
| 桜の花   | Cherry blossoms   | Delicate pink cherry blossoms on branches with soft petals falling                       |
| 日本庭園 | Japanese garden   | Traditional Japanese zen garden with carefully arranged stones, moss, and pruned trees   |
| 侘寂     | Wabi-sabi         | Wabi-sabi aesthetic with weathered textures, subtle imperfections, and serene simplicity |

## Best Practices

### For Japanese Users

1. **Use LLM translation first**: Don't try to submit Japanese text directly
2. **Be specific in translation requests**: Ask for image-generation-optimized translations
3. **Preserve cultural context**: Ensure cultural concepts are explained in English
4. **Review translations**: Check that the English captures your intended meaning
5. **Iterate if needed**: Refine translations based on generated results

### For LLM Integration

1. **Include context**: Tell your LLM you're translating for image generation
2. **Request optimization**: Ask for visual details and artistic descriptions
3. **Handle cultural concepts**: Ensure cultural terms are explained
4. **Maintain prompt structure**: Keep the translated prompt well-organized

## Alternative Translation Services

If you prefer external translation services:

### DeepL Integration

```typescript
import { DeepL } from "deepl-api";

const deepl = new DeepL(process.env.DEEPL_API_KEY);

async function translateWithDeepL(text: string) {
  const result = await deepl.translate(text, "JA", "EN");
  return result.text;
}
```

### Google Translate Integration

```typescript
import { Translate } from "@google-cloud/translate";

const translate = new Translate();

async function translateWithGoogle(text: string) {
  const [translation] = await translate.translate(text, "en");
  return translation;
}
```

## Configuration

### Environment Variables

```bash
# Enable strict English validation (default: true)
ENGLISH_ONLY_VALIDATION=true

# Set validation strictness level
VALIDATION_LEVEL=strict  # strict, moderate, relaxed
```

### Error Response Customization

You can configure how validation errors are returned:

```bash
# Include helpful translation suggestions in errors
INCLUDE_TRANSLATION_HELP=true

# Provide example prompts in error messages
INCLUDE_EXAMPLE_PROMPTS=true
```

## Migration from Translation Tool

If you were previously using the translate-prompt tool:

### Before (deprecated)

```typescript
// Old workflow with translate-prompt
const translation = await client.callTool("translate-prompt", {
  japanese_prompt: "美しい風景",
});

const image = await client.callTool("generate-image", {
  prompt: translation.data.english_prompt,
});
```

### After (recommended)

```typescript
// New workflow with LLM translation
const englishPrompt = await yourLLM.translate("美しい風景");

const image = await client.callTool("generate-image", {
  prompt: englishPrompt,
});
```

## FAQ

**Q: Why doesn't the MCP server handle translation internally?**
A: This design provides better separation of concerns, allows users to choose their preferred translation method, and optimizes for gpt-image-1's English language strengths.

**Q: Can I use Google Translate or DeepL instead of an LLM?**
A: Yes, but LLMs typically provide better context-aware translations for creative prompts.

**Q: What happens if I accidentally include Japanese characters?**
A: The server will reject the request with a helpful error message explaining how to translate the text.

**Q: Does this affect image quality?**
A: No, it improves quality by ensuring gpt-image-1 receives optimal English prompts.

## Next Steps

- [Getting Started](/guide/getting-started.md) - Set up the MCP server
- [Image Generation](/guide/image-generation.md) - Learn image generation best practices
- [API Reference](/api/generate-image.md) - Detailed API documentation
- [Examples](/examples/basic-usage.md) - Practical usage examples
