# Image Generation

Generate stunning images using OpenAI's gpt-image-1 through the MCP interface.

## Overview

The `generate-image` tool provides access to gpt-image-1's advanced image generation capabilities featuring:

- **Advanced Text Rendering**: Crisp, legible typography and logos
- **Native Transparency**: Built-in transparent background support
- **Superior Instruction Following**: Inherits GPT-4o's language understanding
- **Multiple Output Formats**: PNG, JPEG, WebP with optimized compression
- **Flexible Dimensions**: Optimized aspect ratios for different use cases

## Aspect Ratios

Choose from three aspect ratios optimized for different use cases:

### Square (1:1)

- Resolution: 1024x1024
- Perfect for: Icons, avatars, social media posts
- Use case: Profile pictures, app icons, thumbnails

### Landscape (16:9)

- Resolution: 1536x1024 (optimized for gpt-image-1)
- Perfect for: Headers, banners, presentations
- Use case: Website heroes, blog headers, desktop wallpapers

### Portrait (9:16)

- Resolution: 1024x1536 (optimized for gpt-image-1)
- Perfect for: Mobile screens, stories, posters
- Use case: Phone wallpapers, Instagram stories, book covers

## Quality Options

### Standard Quality

- Faster generation time
- Lower token cost
- Suitable for drafts and iterations

### HD Quality

- Maximum detail and clarity
- Longer generation time
- Best for final production images

## Style Variations

### Vivid Style

- Enhanced colors and contrast
- More artistic interpretation
- Dramatic and eye-catching results

### Natural Style

- Realistic rendering
- Subtle colors and lighting
- Photographic quality

## Prompt Engineering

### Best Practices

1. **Be Specific**: Include details about composition, lighting, and mood
2. **Use Art Terms**: Reference artistic styles, techniques, or movements
3. **Specify Medium**: Mention if you want photography, illustration, 3D render, etc.
4. **Include Context**: Describe the environment and atmosphere

### Example Prompts

**Product Photography**

```
A minimalist product shot of a sleek smartphone on a white marble surface,
soft studio lighting, shallow depth of field, professional photography
```

**Illustration**

```
A whimsical children's book illustration of a friendly dragon reading
stories to woodland creatures, watercolor style, warm autumn colors
```

**Concept Art**

```
Futuristic cityscape at sunset, cyberpunk aesthetic, neon lights
reflecting on wet streets, flying vehicles, digital art style
```

## English-Only Input Requirement

The server requires English prompts for optimal gpt-image-1 performance:

```typescript
// ✅ Correct - English prompt
{
  prompt: "A serene Japanese garden with blooming cherry blossoms",
  aspect_ratio: "landscape"
}

// ❌ Rejected - Non-English text
{
  prompt: "桜の花が咲く静かな日本庭園",
  aspect_ratio: "landscape"
}
// Error: VALIDATION_ERROR - Please translate to English first
```

### Translation Workflow

Use your LLM to translate non-English prompts:

```
1. User: "桜の花が咲く静かな日本庭園を描いて"
2. LLM: "A serene Japanese garden with blooming cherry blossoms"
3. MCP: Generate image with English prompt
```

## File Management

### Naming Strategies

- **timestamp**: `image_20250114_123456.png`
- **prompt**: `serene_japanese_garden.png`
- **custom**: Your specified filename
- **hash**: `img_a1b2c3d4.png`

### Organization Options

- **none**: All images in one directory
- **date**: Organized by date (`2025-01-14/`)
- **aspect_ratio**: Grouped by ratio (`landscape/`)
- **quality**: Separated by quality (`hd/`)

## Advanced Features

### Image Editing

Edit and enhance generated images:

```typescript
// Generate base image
const baseImage = await client.callTool("generate-image", {
  prompt: "A mountain landscape",
  aspect_ratio: "landscape",
});

// Edit the image
const editedImage = await client.callTool("edit-image", {
  source_image: baseImage.data.file_path,
  edit_prompt: "Add dramatic storm clouds",
  edit_type: "background_change",
});
```

### Batch Editing

Apply the same edit to multiple images:

```typescript
const result = await client.callTool("batch-edit", {
  image_urls: ["image1.png", "image2.png", "image3.png"],
  edit_prompt: "Convert to black and white",
  edit_type: "style_transfer",
});
```

## Tips for Success

1. **Iterate Quickly**: Start with standard quality for experimentation
2. **Save Versions**: Keep track of successful prompts
3. **Combine Styles**: Mix artistic references for unique results
4. **Use Negatives**: Specify what you don't want in the image
5. **Test Variations**: Try different aspect ratios for the same concept

## Limitations

- Maximum prompt length: 4000 characters
- No explicit content generation
- Some artistic styles may be interpreted differently
- Generation time varies based on server load

## Next Steps

- Learn about [English-Only Input](/guide/japanese-translation) and translation workflows
- Explore [Image Editing](/guide/edit-image) capabilities for post-processing
- Try [Batch Editing](/guide/batch-edit) for processing multiple images
- Check out [Examples](/examples/basic-usage) for more use cases
