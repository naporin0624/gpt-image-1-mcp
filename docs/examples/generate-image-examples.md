# Image Generation Examples

This page showcases the power of gpt-image-1 for generating high-quality images with advanced text rendering and instruction following capabilities.

## Introduction to gpt-image-1

GPT-image-1 is OpenAI's advanced image generation model that combines the language understanding of GPT-4o with superior image creation capabilities. It excels at:

- **Advanced Text Rendering**: Crisp, legible typography and logos
- **Superior Instruction Following**: Better prompt adherence and spatial reasoning
- **Native Transparency**: Built-in transparent background support
- **Multiple Formats**: PNG, JPEG, and WebP output

## Text Rendering Examples

### Company Logo

Perfect for creating professional logos with clear, readable text.

**Prompt:** "A modern tech company logo with the text 'FUTURE AI' in sleek metallic letters"

**Parameters:**

- Quality: `hd`
- Aspect Ratio: `landscape` (1536x1024)
- Format: `png`

![Logo Example](/examples/generate/logo-example.png)

**Code Example:**

```typescript
const result = await mcp.callTool("generate-image", {
  prompt:
    "A modern tech company logo with the text 'FUTURE AI' in sleek metallic letters",
  quality: "hd",
  aspect_ratio: "landscape",
  output_directory: "./logos",
});
```

### Typography Art

Create inspiring typography designs with elegant fonts and backgrounds.

**Prompt:** "Inspirational quote 'Dream Big, Code Bigger' in elegant typography on gradient background"

**Parameters:**

- Quality: `standard`
- Aspect Ratio: `square` (1024x1024)
- Format: `png`

![Typography Example](/examples/generate/typography-example.png)

**Code Example:**

```typescript
const result = await mcp.callTool("generate-image", {
  prompt:
    "Inspirational quote 'Dream Big, Code Bigger' in elegant typography on gradient background",
  quality: "standard",
  aspect_ratio: "square",
});
```

## Transparent Background Examples

### 3D Mascot

Generate characters and objects with native transparency support.

**Prompt:** "A 3D floating robot mascot with transparent background"

**Parameters:**

- Quality: `hd`
- Aspect Ratio: `square` (1024x1024)
- Format: `png`

![Transparent Mascot](/examples/generate/transparent-mascot.png)

**Code Example:**

```typescript
const result = await mcp.callTool("generate-image", {
  prompt: "A 3D floating robot mascot with transparent background",
  quality: "hd",
  aspect_ratio: "square",
  output_format: "png", // PNG format preserves transparency
});
```

// Saved file will have a .png extension

## Landscape Scenes

### Futuristic Cityscape

Create detailed landscape scenes with complex compositions.

**Prompt:** "Futuristic city skyline at sunset with flying vehicles"

**Parameters:**

- Quality: `hd`
- Aspect Ratio: `landscape` (1536x1024)
- Format: `png`

![Cityscape Example](/examples/generate/cityscape.png)

**Code Example:**

```typescript
const result = await mcp.callTool("generate-image", {
  prompt: "Futuristic city skyline at sunset with flying vehicles",
  quality: "hd",
  aspect_ratio: "landscape",
  output_directory: "./landscapes",
});
```

## Portrait Examples

### Detailed Object Portrait

Generate detailed vertical composition images with complex styling.

**Prompt:** "Steampunk mechanical owl with brass gears and steam, detailed vertical composition"

**Parameters:**

- Quality: `hd`
- Aspect Ratio: `portrait` (1024x1536)
- Format: `png`

![Mechanical Owl Portrait](/examples/generate/mechanical-owl-portrait.png)

**Code Example:**

```typescript
const result = await mcp.callTool("generate-image", {
  prompt:
    "Steampunk mechanical owl with brass gears and steam, detailed vertical composition",
  quality: "hd",
  aspect_ratio: "portrait",
  output_directory: "./portraits",
});
```

## Best Practices

### Prompt Engineering

1. **Be Specific**: Include details about style, composition, and elements
2. **Use Quality Descriptors**: Words like "professional", "high-quality", "detailed"
3. **Specify Text**: For text-heavy images, be explicit about the exact text content
4. **Mention Background**: Specify transparent, solid color, or specific background scenes

### Parameter Selection

- **Quality**: Use `hd` for professional work, `standard` for faster generation
- **Aspect Ratio**: Choose based on intended use (social media, print, web)
- **Format**: PNG for transparency, JPEG for smaller file sizes

### Performance Tips

- Generate multiple variations by running the same prompt multiple times
- Use batch processing for similar images
- Consider file size when choosing quality settings

## Common Use Cases

### Marketing Materials

- Logos and branding
- Social media graphics
- Product presentations

### Web Development

- Hero images
- Icons and illustrations
- Background images

### Content Creation

- Blog post images
- Tutorial graphics
- Presentation visuals

## Advanced Features

### File Management

```typescript
const result = await mcp.callTool("generate-image", {
  prompt: "Your prompt here",
  output_directory: "./custom-folder",
  filename: "custom-name",
  naming_strategy: "custom",
});
```

### Response Optimization

```typescript
const result = await mcp.callTool("generate-image", {
  prompt: "Your prompt here",
  include_base64: true, // Include base64 in response
  analyze_after_generation: true, // Analyze generated image
});
```

## Next Steps

Ready to try image editing? Check out our [Image Editing Examples](/examples/edit-image-examples) to learn how to modify and enhance your generated images.

For batch processing multiple images, see our [Batch Processing Examples](/examples/batch-edit-examples).
