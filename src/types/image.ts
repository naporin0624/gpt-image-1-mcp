import { z } from "zod";

export const AspectRatioSchema = z.enum([
  "square",
  "landscape",
  "portrait",
  "1:1",
  "16:9",
  "9:16",
]);
export const AspectRatioGpt2Schema = z.enum([
  "square",
  "landscape",
  "portrait",
  "1:1",
  "16:9",
  "9:16",
  "square_2k",
  "landscape_2k",
  "portrait_2k",
  "auto",
]);
export const ImageQualitySchema = z.enum(["high", "medium", "low"]);
export const GenerateQualityGpt1Schema = z.enum([
  "standard",
  "hd",
  "high",
  "medium",
  "low",
]);
export const GenerateQualityGpt2Schema = z.enum([
  "low",
  "medium",
  "high",
  "auto",
]);
export const ImageStyleSchema = z.enum(["vivid", "natural"]);
export const ImageSizeSchema = z.enum([
  "1024x1024",
  "1536x1024", // gpt-image-1 landscape
  "1024x1536", // gpt-image-1 portrait
]);

export const BackgroundSchema = z.enum(["transparent", "opaque", "auto"]);
export const OutputFormatSchema = z.enum(["png", "jpeg", "webp"]);
export const ModerationSchema = z.enum(["auto", "low"]);

const GenerateImageBaseSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  style: ImageStyleSchema.optional(),
  background: BackgroundSchema.optional().default("auto"),
  output_format: OutputFormatSchema.optional().default("png"),
  moderation: ModerationSchema.optional().default("auto"),
  analyze_after_generation: z.boolean().optional().default(false),
  remove_background: z.boolean().optional().default(false),
  include_base64: z.boolean().optional().default(false),
  // File output options
  save_to_file: z.boolean().optional().default(true),
  output_directory: z.string().optional(),
  filename: z.string().optional(),
  naming_strategy: z
    .enum(["timestamp", "prompt", "custom", "hash"])
    .optional()
    .default("timestamp"),
  organize_by: z
    .enum(["none", "date", "aspect_ratio", "quality"])
    .optional()
    .default("none"),
});

export const GenerateImageGpt1Schema = GenerateImageBaseSchema.extend({
  model: z
    .literal("gpt-image-1")
    .describe("Model to use. Omit to default to gpt-image-2."),
  aspect_ratio: AspectRatioSchema.optional().default("square"),
  quality: GenerateQualityGpt1Schema.optional(),
});

export const GenerateImageGpt2Schema = GenerateImageBaseSchema.extend({
  model: z
    .literal("gpt-image-2")
    .describe("Model to use. Omit to default to gpt-image-2."),
  aspect_ratio: AspectRatioGpt2Schema.optional().default("square"),
  quality: GenerateQualityGpt2Schema.optional(),
});

export const GenerateImageInputSchema = z.preprocess(
  (val) =>
    typeof val === "object" && val !== null && !("model" in val)
      ? { ...(val as Record<string, unknown>), model: "gpt-image-2" }
      : val,
  z.discriminatedUnion("model", [
    GenerateImageGpt1Schema,
    GenerateImageGpt2Schema,
  ]),
);

export const ImageGenerationResultSchema = z.object({
  image: z.object({
    url: z.string().url(),
    revised_prompt: z.string(),
    original_prompt: z.string(),
    was_translated: z.boolean(),
    aspect_ratio: z.string(),
    size: ImageSizeSchema,
    // File output fields
    local_path: z.string().optional(),
    filename: z.string().optional(),
    directory: z.string().optional(),
    size_bytes: z.number().optional(),
    format: z.string().optional(),
    saved_at: z.string().optional(),
  }),
  analysis: z
    .object({
      description: z.string(),
      detected_elements: z.array(z.string()),
      colors: z.array(z.string()),
      style_analysis: z.string(),
    })
    .optional(),
  metadata: z.object({
    generation_time_ms: z.number(),
    model_used: z.string(),
    background_removed: z.boolean(),
  }),
});

export type AspectRatio = z.infer<typeof AspectRatioSchema>;
export type AspectRatioGpt2 = z.infer<typeof AspectRatioGpt2Schema>;
export type GenerateQualityGpt1 = z.infer<typeof GenerateQualityGpt1Schema>;
export type GenerateQualityGpt2 = z.infer<typeof GenerateQualityGpt2Schema>;
export type GenerateImageGpt1Input = z.infer<typeof GenerateImageGpt1Schema>;
export type GenerateImageGpt2Input = z.infer<typeof GenerateImageGpt2Schema>;
export type ImageSizeGpt2 =
  | "1024x1024"
  | "1536x1024"
  | "1024x1536"
  | "2048x2048"
  | "2048x1152"
  | "1152x2048"
  | "auto";
export type ImageQuality = z.infer<typeof ImageQualitySchema>;
export type ImageStyle = z.infer<typeof ImageStyleSchema>;
export type ImageSize = z.infer<typeof ImageSizeSchema>;
export type Background = z.infer<typeof BackgroundSchema>;
export type OutputFormat = z.infer<typeof OutputFormatSchema>;
export type Moderation = z.infer<typeof ModerationSchema>;
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;
export type ImageGenerationResult = z.infer<typeof ImageGenerationResultSchema>;

// New optimized response structure for MCP
export interface OptimizedGenerateImageResponse {
  file_path?: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size_bytes: number;
    created_at: string;
  };
  base64_image?: string;
  warnings?: string[];
}

export const aspectRatioToSize = (aspectRatio: AspectRatio): ImageSize => {
  switch (aspectRatio) {
    case "square":
    case "1:1":
      return "1024x1024";
    case "landscape":
    case "16:9":
      return "1536x1024"; // gpt-image-1 uses 1536x1024 instead of 1792x1024
    case "portrait":
    case "9:16":
      return "1024x1536"; // gpt-image-1 uses 1024x1536 instead of 1024x1792
    default:
      return "1024x1024";
  }
};

export const aspectRatioToSizeGpt2 = (
  aspectRatio: AspectRatioGpt2,
): ImageSizeGpt2 => {
  switch (aspectRatio) {
    case "square":
    case "1:1":
      return "1024x1024";
    case "landscape":
    case "16:9":
      return "1536x1024";
    case "portrait":
    case "9:16":
      return "1024x1536";
    case "square_2k":
      return "2048x2048";
    case "landscape_2k":
      return "2048x1152";
    case "portrait_2k":
      return "1152x2048";
    case "auto":
      return "auto";
  }
};

export const mapLegacyQuality = (quality: string): ImageQuality => {
  switch (quality) {
    case "standard":
      return "medium";
    case "hd":
      return "high";
    case "high":
    case "medium":
    case "low":
      return quality as ImageQuality;
    default:
      return "medium";
  }
};
