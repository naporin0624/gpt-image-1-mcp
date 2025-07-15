import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { config } from "dotenv";

import { EditImageInputSchema, BatchEditInputSchema } from "./types/edit.js";
import type {
  OptimizedGenerateImageResponse} from "./types/image.js";
import {
  GenerateImageInputSchema,
  mapLegacyQuality
} from "./types/image.js";

import { OpenAIService } from "./utils/openai.js";
import {
  validateEnglishOnly,
  formatValidationError,
} from "./utils/validation.js";

config();

const openaiService = new OpenAIService();

const server = new Server(
  {
    name: "gpt-image-1-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate-image",
        description:
          "Generate images using gpt-image-1 with advanced text rendering and instruction following",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description:
                "Image description (English only - use LLM to translate if needed)",
            },
            aspect_ratio: {
              type: "string",
              enum: ["square", "landscape", "portrait", "1:1", "16:9", "9:16"],
              default: "square",
              description:
                "Aspect ratio (square=1024x1024, landscape=1792x1024, portrait=1024x1792)",
            },
            quality: {
              type: "string",
              enum: ["standard", "hd", "high", "medium", "low"],
              description: "Image quality",
            },
            output_format: {
              type: "string",
              enum: ["png", "jpeg", "webp"],
              default: "png",
              description: "Output image format",
            },
            moderation: {
              type: "string",
              enum: ["auto", "low"],
              default: "auto",
              description: "Content moderation level",
            },
            analyze_after_generation: {
              type: "boolean",
              default: false,
              description: "Analyze the generated image and return description",
            },
            remove_background: {
              type: "boolean",
              default: false,
              description:
                "Attempt to remove background (experimental, requires post-processing)",
            },
            include_base64: {
              type: "boolean",
              default: false,
              description: "Include base64 in response if size permits",
            },
            save_to_file: {
              type: "boolean",
              default: true,
              description: "Save the generated image to local file",
            },
            output_directory: {
              type: "string",
              description:
                "Directory to save the image (defaults to ./generated_images)",
            },
            filename: {
              type: "string",
              description: "Custom filename (without extension)",
            },
            naming_strategy: {
              type: "string",
              enum: ["timestamp", "prompt", "custom", "hash"],
              default: "timestamp",
              description: "Strategy for generating filenames",
            },
            organize_by: {
              type: "string",
              enum: ["none", "date", "aspect_ratio", "quality"],
              default: "none",
              description: "Subdirectory organization strategy",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "edit-image",
        description:
          "Edit existing images with gpt-image-1 powered modifications including inpainting, outpainting, and style transfer",
        inputSchema: {
          type: "object",
          properties: {
            source_image: {
              type: "string",
              description: "Image URL or base64 encoded image",
            },
            edit_prompt: {
              type: "string",
              description: "Description of desired changes (English only)",
            },
            edit_type: {
              type: "string",
              enum: [
                "inpaint",
                "outpaint",
                "variation",
                "style_transfer",
                "object_removal",
                "background_change",
              ],
              description: "Type of edit to perform",
            },
            mask_area: {
              type: "string",
              description: "Mask specification for targeted editing (optional)",
            },
            strength: {
              type: "number",
              minimum: 0.0,
              maximum: 1.0,
              default: 0.8,
              description: "Edit strength (0.0 = minimal, 1.0 = maximum)",
            },
            preserve_composition: {
              type: "boolean",
              default: true,
              description: "Maintain original image composition",
            },
            output_format: {
              type: "string",
              enum: ["png", "jpeg", "webp"],
              default: "png",
              description: "Output image format",
            },
            save_to_file: {
              type: "boolean",
              default: true,
              description: "Save the edited image to local file",
            },
            output_directory: {
              type: "string",
              description: "Directory to save edited image",
            },
            filename_prefix: {
              type: "string",
              default: "edited_",
              description: "Prefix for edited image filename",
            },
            naming_strategy: {
              type: "string",
              enum: ["timestamp", "prompt", "custom", "hash"],
              default: "timestamp",
              description: "Strategy for generating filenames",
            },
            organize_by: {
              type: "string",
              enum: ["none", "date", "aspect_ratio", "quality"],
              default: "none",
              description: "Subdirectory organization strategy",
            },
          },
          required: ["source_image", "edit_prompt", "edit_type"],
        },
      },
      // REMOVED: create-variation tool - variations not supported by gpt-image-1
      // Use edit-image with edit_type: "variation" instead
      {
        name: "batch-edit",
        description: "Apply same edit to multiple images",
        inputSchema: {
          type: "object",
          properties: {
            image_urls: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of image URLs to edit",
            },
            edit_prompt: {
              type: "string",
              description:
                "Edit description to apply to all images (English only)",
            },
            edit_type: {
              type: "string",
              enum: [
                "style_transfer",
                "background_change",
                "color_adjustment",
                "enhancement",
              ],
              description: "Type of edit to apply",
            },
            batch_settings: {
              type: "object",
              properties: {
                parallel_processing: {
                  type: "boolean",
                  default: true,
                  description: "Process images in parallel",
                },
                progress_callback: {
                  type: "boolean",
                  default: true,
                  description: "Enable progress tracking",
                },
                error_handling: {
                  type: "string",
                  enum: ["fail_fast", "continue_on_error", "retry_failed"],
                  default: "continue_on_error",
                  description: "How to handle errors during batch processing",
                },
                max_concurrent: {
                  type: "number",
                  minimum: 1,
                  maximum: 10,
                  default: 3,
                  description: "Maximum concurrent operations",
                },
              },
            },
            save_to_file: {
              type: "boolean",
              default: true,
              description: "Save the edited images to local files",
            },
            output_directory: {
              type: "string",
              description: "Directory to save edited images",
            },
            filename_prefix: {
              type: "string",
              default: "batch_",
              description: "Prefix for edited image filenames",
            },
            naming_strategy: {
              type: "string",
              enum: ["timestamp", "prompt", "custom", "hash"],
              default: "timestamp",
              description: "Strategy for generating filenames",
            },
            organize_by: {
              type: "string",
              enum: ["none", "date", "aspect_ratio", "quality"],
              default: "none",
              description: "Subdirectory organization strategy",
            },
          },
          required: ["image_urls", "edit_prompt", "edit_type"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "generate-image":
      try {
        // Apply quality mapping before Zod validation
        const safeArgs = args || {};
        const mappedArgs = {
          ...safeArgs,
          ...(safeArgs.quality != null && typeof safeArgs.quality === "string"
            ? { quality: mapLegacyQuality(safeArgs.quality) }
            : {}),
        };

        const input = GenerateImageInputSchema.parse(mappedArgs);

        // Validate English-only input
        validateEnglishOnly(input.prompt, "prompt");

        const result: OptimizedGenerateImageResponse =
          await openaiService.generateImage(input);

        return {
          content: [
            {
              type: "text",
              text: `Generated image successfully!

Prompt: "${input.prompt}"
Size: ${result.metadata?.width || "unknown"}x${result.metadata?.height || "unknown"}
Aspect ratio: ${input.aspect_ratio}
Quality: ${input.quality || "medium"}
Model: gpt-image-1

${
  result.file_path
    ? `Local file: ${result.file_path}
File size: ${result.metadata?.size_bytes || 0} bytes
Format: ${result.metadata?.format || "unknown"}
Created at: ${result.metadata?.created_at || "unknown"}
`
    : ""
}${
                result.base64_image
                  ? `Base64 data included in response (${Math.ceil((result.base64_image as string).length * 0.75)} bytes)`
                  : ""
              }${
                result.warnings && (result.warnings as string[]).length > 0
                  ? `\n\nWarnings:\n${(result.warnings as string[]).map((w) => `- ${w}`).join("\n")}`
                  : ""
              }`,
            },
          ],
        };
      } catch (error) {
        return formatValidationError(error as Error);
      }

    case "edit-image":
      try {
        const input = EditImageInputSchema.parse(args);

        // Validate English-only input
        validateEnglishOnly(input.edit_prompt, "edit_prompt");

        const result = await openaiService.editImage(input);

        return {
          content: [
            {
              type: "text",
              text: `Image editing completed successfully!

Original Image: ${result.original_image.url}
Edit Type: ${result.edited_image.edit_type}
Edit Strength: ${result.edited_image.strength}
Edit prompt: "${result.edited_image.original_prompt}"

Edited Image URL: ${result.edited_image.image_url || result.edited_image.local_file_path || "N/A"}
${
  result.edited_image.local_path != null
    ? `Local file: ${result.edited_image.local_path}
File size: ${result.edited_image.size_bytes} bytes
Format: ${result.edited_image.format}
Saved at: ${result.edited_image.saved_at}`
    : ""
}

Edit time: ${result.metadata.edit_time_ms}ms
Model used: ${result.metadata.model_used}
Composition preserved: ${result.metadata.composition_preserved}
Mask applied: ${result.metadata.mask_applied}`,
            },
          ],
        };
      } catch (error) {
        return formatValidationError(error as Error);
      }

    // REMOVED: create-variation case - variations not supported by gpt-image-1
    // Use edit-image with edit_type: "variation" instead

    case "batch-edit":
      try {
        const input = BatchEditInputSchema.parse(args);

        // Validate English-only input
        validateEnglishOnly(input.edit_prompt, "edit_prompt");

        const result = await openaiService.batchEdit(input);

        return {
          content: [
            {
              type: "text",
              text: `Batch editing completed!

Total Images: ${result.total_images}
Successfully Processed: ${result.processed_images}
Failed: ${result.failed_images}
Edit Type: ${input.edit_type}
Edit Prompt: "${input.edit_prompt}"

Results Summary:
${result.results
  .map(
    (item, index) => `
Image ${index + 1}: ${item.success ? "✓ Success" : "✗ Failed"}
- Original: ${item.original_url}
${
  item.success && item.edited_image
    ? `- Edited: ${item.edited_image.image_url || item.edited_image.local_file_path || "N/A"}
${item.edited_image.local_path != null ? `- Local file: ${item.edited_image.local_path}` : ""}`
    : ""
}
${!item.success && item.error != null ? `- Error: ${item.error}` : ""}
`,
  )
  .join("")}

Processing time: ${result.metadata.total_time_ms}ms
Average time per image: ${result.metadata.average_time_per_image_ms}ms
Model used: ${result.metadata.model_used}
Parallel processing: ${result.metadata.parallel_processing}`,
            },
          ],
        };
      } catch (error) {
        return formatValidationError(error as Error);
      }

    default:
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // eslint-disable-next-line no-console
  console.error("MCP Image Generation Server started");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // eslint-disable-next-line no-console
  main().catch(console.error);
}

export { server };
