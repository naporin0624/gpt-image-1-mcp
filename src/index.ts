import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";

import {
  BatchEditInputSchema,
  EditImageInputSchema,
  EditImageMcpInputSchema,
} from "./types/edit";
import {
  GenerateImageInputSchema,
  GenerateImageMcpInputSchema,
  type OptimizedGenerateImageResponse,
} from "./types/image";

import { normalizeImageInput } from "./utils/image-input";
import { withOptionalModel } from "./utils/json-schema";
import { OpenAIService } from "./utils/openai";
import { validateText, formatValidationError } from "./utils/validation";

import type { z } from "zod";

type ToolInputSchema = {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
};

const buildInputSchema = <T extends z.ZodTypeAny>(schema: T): ToolInputSchema =>
  withOptionalModel(
    zodToJsonSchema(schema, {
      target: "jsonSchema7",
      $refStrategy: "none",
    }) as Record<string, unknown>,
  ) as ToolInputSchema;

// Use flat MCP-facing schemas (no top-level anyOf). Anthropic's tool
// input_schema rejects oneOf/anyOf/allOf at the top level, so the
// discriminated unions (GenerateImageInputSchema / EditImageInputSchema) are
// only used for runtime validation in CallToolRequestSchema below.
const generateImageInputSchema = buildInputSchema(GenerateImageMcpInputSchema);
const editImageInputSchema = buildInputSchema(EditImageMcpInputSchema);
const batchEditInputSchema = buildInputSchema(BatchEditInputSchema);

// Type guards for runtime type checking
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item): item is string => typeof item === "string")
  );
}
function hasImageUrls(obj: unknown): obj is { image_urls: string[] } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "image_urls" in obj &&
    isStringArray((obj as Record<string, unknown>).image_urls)
  );
}
function hasImages(obj: unknown): obj is { images: unknown[] } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "images" in obj &&
    Array.isArray((obj as Record<string, unknown>).images)
  );
}
function hasSourceImage(obj: unknown): obj is { source_image: string } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "source_image" in obj &&
    typeof (obj as Record<string, unknown>).source_image === "string"
  );
}
const openaiService = new OpenAIService();
export const server = new Server(
  {
    name: "gpt-image-mcp",
    version: process.env.PACKAGE_VERSION,
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
          'Generate images using gpt-image-1 or gpt-image-2. Omit `model` to use gpt-image-2 (default). gpt-image-2 unlocks 2K presets (square_2k / landscape_2k / portrait_2k) and aspect_ratio: "auto".',
        inputSchema: generateImageInputSchema,
      },
      {
        name: "edit-image",
        description:
          "Edit existing images with gpt-image-1 or gpt-image-2 (default: gpt-image-2). Inpaint, outpaint, style transfer, and other transformations. With gpt-image-2, source_image accepts an array (1-10 images) for compositions.",
        inputSchema: editImageInputSchema,
      },
      {
        name: "batch-edit",
        description:
          "Apply the same edit to multiple images using gpt-image-1 or gpt-image-2 (default: gpt-image-2).",
        inputSchema: batchEditInputSchema,
      },
    ],
  };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "generate-image":
      try {
        const input = GenerateImageInputSchema.parse(args ?? {});

        // Validate input
        validateText(input.prompt, "prompt");

        const result: OptimizedGenerateImageResponse =
          await openaiService.generateImage(input);

        return {
          content: [
            {
              type: "text",
              text: `Generated image successfully!

Prompt: "${input.prompt}"
Size: ${result.metadata.width}x${result.metadata.height}
Aspect ratio: ${input.aspect_ratio}
Quality: ${input.quality || "medium"}
Model: ${input.model}

${
  result.file_path != null && result.file_path.length > 0
    ? `Local file: ${result.file_path}
File size: ${result.metadata.size_bytes} bytes
Format: ${result.metadata.format}
Created at: ${result.metadata.created_at}
`
    : ""
}${
                result.base64_image != null && result.base64_image.length > 0
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
        const rawInput = args || {};

        // Handle backward compatibility for source_image
        const processedInput = {
          ...rawInput,
          source_image: hasSourceImage(rawInput)
            ? normalizeImageInput(rawInput.source_image)
            : rawInput.source_image,
        };

        const input = EditImageInputSchema.parse(processedInput);

        // Validate input
        validateText(input.edit_prompt, "edit_prompt");

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

Edited Image URL: ${result.edited_image.image_url ?? result.edited_image.local_file_path ?? "N/A"}
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
        const rawInput = args || {};

        // Validate that at least one of images or image_urls is provided
        if (!hasImages(rawInput) && !hasImageUrls(rawInput)) {
          throw new Error(
            "Either 'images' or 'image_urls' parameter must be provided",
          );
        }

        // Handle backward compatibility for image_urls -> images
        const processedInput = {
          ...rawInput,
          // Convert image_urls to images format if needed
          ...(hasImageUrls(rawInput) && !hasImages(rawInput)
            ? {
                images: rawInput.image_urls.map((url: string) =>
                  normalizeImageInput(url),
                ),
              }
            : {}),
        };

        const input = BatchEditInputSchema.parse(processedInput);

        // Validate input
        validateText(input.edit_prompt, "edit_prompt");

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
    ? `- Edited: ${item.edited_image.image_url ?? item.edited_image.local_file_path ?? "N/A"}
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

// eslint-disable-next-line no-console
main().catch(console.error);
