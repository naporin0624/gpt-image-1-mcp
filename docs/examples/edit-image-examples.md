# Image Editing Examples

This page demonstrates the AI-powered image editing capabilities of gpt-image-1, showcasing various editing techniques including inpainting, outpainting, style transfer, and more.

## Introduction to Image Editing

GPT-image-1 offers sophisticated image editing capabilities that go beyond traditional photo editing tools. With AI-powered understanding, it can:

- **Inpaint**: Remove or replace specific objects seamlessly
- **Outpaint**: Extend images beyond their original boundaries
- **Style Transfer**: Apply artistic styles while preserving content
- **Object Removal**: Intelligently remove unwanted elements
- **Background Change**: Replace backgrounds contextually

## Inpainting Examples

### Remove Unwanted Objects

Inpainting allows you to remove objects from images while maintaining natural-looking results.

**Original Image:**
![Room with Box](/examples/edit/source/room-with-box.png)

**Edit Prompt:** "Remove the cardboard box from the floor"

**Result:**
![Inpaint Result](/examples/edit/results/inpaint-1752595554588.png)

**Code Example:**

```typescript
const result = await mcp.callTool("edit-image", {
  source_image: {
    type: "local",
    value: "./source/room-with-box.png",
  },
  edit_prompt: "Remove the cardboard box from the floor",
  edit_type: "inpaint",
});
```

## Outpainting Examples

### Extend Image Boundaries

Outpainting extends your images beyond their original borders while maintaining consistency.

**Original Image:**
![Partial Landscape](/examples/edit/source/partial-landscape.png)

**Edit Prompt:** "Extend the mountain landscape to show more sky and peaks"

**Result:**
![Outpaint Result](/examples/edit/results/outpaint-1752595588804.png)

**Code Example:**

```typescript
const result = await mcp.callTool("edit-image", {
  source_image: {
    type: "local",
    value: "./source/partial-landscape.png",
  },
  edit_prompt: "Extend the mountain landscape to show more sky and peaks",
  edit_type: "outpaint",
});
```

## Style Transfer Examples

### Transform Artistic Styles

Apply various artistic styles to your images while preserving the original composition.

**Original Image:**
![Original Photo](/examples/edit/source/photo.png)

**Edit Prompt:** "Transform into watercolor painting style"

**Result:**
![Style Transfer Result](/examples/edit/results/style-transfer-1752595627557.png)

**Code Example:**

```typescript
const result = await mcp.callTool("edit-image", {
  source_image: {
    type: "local",
    value: "./source/photo.png",
  },
  edit_prompt: "Transform into watercolor painting style",
  edit_type: "style_transfer",
});
```

## Object Removal Examples

### Smart Object Removal

Remove specific objects or people from images while maintaining natural backgrounds.

**Original Image:**
![Street Photo](/examples/edit/source/street-photo.png)

**Edit Prompt:** "Remove all people from the street"

**Result:**
![Object Removal Result](/examples/edit/results/object-removal-1752595668554.png)

**Code Example:**

```typescript
const result = await mcp.callTool("edit-image", {
  source_image: {
    type: "local",
    value: "./source/street-photo.png",
  },
  edit_prompt: "Remove all people from the street",
  edit_type: "object_removal",
});
```

## Background Change Examples

### Replace Backgrounds

Change the background of your images while preserving the main subject.

**Original Image:**
![Product Photo](/examples/edit/source/product.png)

**Edit Prompt:** "Replace background with modern office setting"

**Result:**
![Background Change Result](/examples/edit/results/bg-change-1752595733984.png)

**Code Example:**

```typescript
const result = await mcp.callTool("edit-image", {
  source_image: {
    type: "local",
    value: "./source/product.png",
  },
  edit_prompt: "Replace background with modern office setting",
  edit_type: "background_change",
});
```

## Advanced Parameters

### Edit Strength Control

Control the intensity of your edits with the strength parameter:

```typescript
const result = await mcp.callTool("edit-image", {
  source_image: {
    type: "local",
    value: "./source/image.png",
  },
  edit_prompt: "Your edit description",
  edit_type: "style_transfer",
  strength: 0.5, // 0.0 = minimal, 1.0 = maximum
});
```

### Preserve Composition

Maintain the original image composition while making edits:

```typescript
const result = await mcp.callTool("edit-image", {
  source_image: {
    type: "local",
    value: "./source/image.png",
  },
  edit_prompt: "Your edit description",
  edit_type: "inpaint",
  preserve_composition: true,
});
```

### Multiple Input Sources

Work with different image sources:

```typescript
// Local file
const result1 = await mcp.callTool("edit-image", {
  source_image: {
    type: "local",
    value: "./path/to/image.png",
  },
  edit_prompt: "Edit description",
  edit_type: "inpaint",
});

// URL
const result2 = await mcp.callTool("edit-image", {
  source_image: {
    type: "url",
    value: "https://example.com/image.jpg",
  },
  edit_prompt: "Edit description",
  edit_type: "style_transfer",
});

// Base64
const result3 = await mcp.callTool("edit-image", {
  source_image: {
    type: "base64",
    value: "data:image/png;base64,iVBORw0KGgoAAAA...",
  },
  edit_prompt: "Edit description",
  edit_type: "background_change",
});
```

## Best Practices

### Prompt Engineering for Edits

1. **Be Specific**: Clearly describe what you want changed
2. **Use Action Words**: "Remove", "Replace", "Transform", "Extend"
3. **Describe Context**: Mention surrounding elements and desired style
4. **Iterative Refinement**: Start with broad edits, then refine

### Edit Type Selection

- **Inpaint**: For removing or replacing specific objects
- **Outpaint**: For extending image boundaries
- **Style Transfer**: For artistic transformations
- **Object Removal**: For removing unwanted elements
- **Background Change**: For replacing backgrounds

### Performance Optimization

- Use appropriate edit strength (0.3-0.8 for most cases)
- Consider file size when choosing output formats
- Batch similar edits for efficiency

## Common Use Cases

### E-commerce

- Product background removal
- Lifestyle scene creation
- Color variations

### Content Creation

- Social media adaptations
- Thumbnail creation
- Visual storytelling

### Photography

- Object removal
- Background replacement
- Artistic effects

## Troubleshooting

### Common Issues

1. **Inconsistent Results**: Try adjusting the edit strength
2. **Unwanted Artifacts**: Use more specific prompts
3. **Composition Changes**: Enable preserve_composition

### Error Handling

```typescript
try {
  const result = await mcp.callTool("edit-image", {
    source_image: {
      type: "local",
      value: "./source/image.png",
    },
    edit_prompt: "Your edit description",
    edit_type: "inpaint",
  });
} catch (error) {
  console.error("Edit failed:", error);
}
```

## Next Steps

Ready to process multiple images at once? Check out our [Batch Processing Examples](/examples/batch-edit-examples) to learn how to edit multiple images efficiently.

For generating original images, see our [Image Generation Examples](/examples/generate-image-examples).
