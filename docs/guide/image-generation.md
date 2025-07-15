# Image Generation

Generate stunning images using OpenAI's gpt-image-1 through the MCP interface.

## Overview

The `generate-image` tool provides access to gpt-image-1's advanced image generation capabilities with superior text rendering, transparency support, and enhanced instruction following across multiple aspect ratios, quality settings, and artistic styles.

## Aspect Ratios

Choose from three aspect ratios optimized for different use cases:

### Square (1:1)

- Resolution: 1024x1024
- Perfect for: Icons, avatars, social media posts
- Use case: Profile pictures, app icons, thumbnails

### Landscape (16:9)

- Resolution: 1792x1024
- Perfect for: Headers, banners, presentations
- Use case: Website heroes, blog headers, desktop wallpapers

### Portrait (9:16)

- Resolution: 1024x1792
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

## Japanese Prompt Support

The server automatically translates Japanese prompts for optimal results:

```typescript
// Japanese prompt
{
  prompt: "桜の花が咲く静かな日本庭園",
  aspect_ratio: "landscape"
}

// Automatically translated to:
// "A serene Japanese garden with blooming cherry blossoms"
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

### Batch Generation

Generate multiple variations of a prompt:

```typescript
// Coming soon: batch-generate tool
{
  prompt: "Abstract geometric pattern",
  variations: 4,
  aspect_ratio: "square"
}
```

### Prompt Enhancement

Automatically improve prompts for better results:

```typescript
// Coming soon: enhance-prompt tool
{
  prompt: "sunset beach",
  enhance_level: "detailed"
}
// Returns: "A breathtaking sunset over a pristine beach..."
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

- Explore [Vision Analysis](/guide/vision-analysis) to analyze generated images
- Learn about [Japanese Translation](/guide/japanese-translation) features
- Check out [Examples](/examples/basic-usage) for more use cases
