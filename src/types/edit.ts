import { z } from "zod";

export const EditTypeSchema = z.enum([
  "inpaint",
  "outpaint",
  "variation",
  "style_transfer",
  "object_removal",
  "background_change",
]);

// gpt-image-1 only - DALL-E support removed
export const EditModelSchema = z.enum(["gpt-image-1"]);

export const EditStrengthSchema = z.number().min(0.0).max(1.0);

// Image input discriminated union
export const ImageInputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("url"),
    value: z.string().url("Valid URL is required"),
  }),
  z.object({
    type: z.literal("base64"),
    value: z.string().min(1, "Base64 data is required"),
  }),
  z.object({
    type: z.literal("local"),
    value: z.string().min(1, "File path is required"),
  }),
]);

export const EditImageInputSchema = z.object({
  source_image: ImageInputSchema,
  edit_prompt: z.string().min(1, "Edit prompt is required"),
  edit_type: EditTypeSchema,
  model: EditModelSchema.optional().default("gpt-image-1"),
  mask_area: z.string().optional(),
  strength: EditStrengthSchema.optional().default(0.8),
  preserve_composition: z.boolean().optional().default(true),
  output_format: z.enum(["png", "jpeg", "webp"]).optional().default("png"),
  background: z
    .enum(["transparent", "opaque", "auto"])
    .optional()
    .default("auto"),
  quality: z.enum(["auto", "high", "medium", "low"]).optional().default("auto"),
  // File management
  save_to_file: z.boolean().optional().default(true),
  output_directory: z.string().optional(),
  filename_prefix: z.string().optional().default("edited_"),
  // Inherit from FileOutputOptions
  naming_strategy: z
    .enum(["timestamp", "prompt", "custom", "hash"])
    .optional()
    .default("timestamp"),
  organize_by: z
    .enum(["none", "date", "aspect_ratio", "quality"])
    .optional()
    .default("none"),
});

export const EditImageResultSchema = z.object({
  original_image: z.object({
    url: z.string(),
    format: z.string(),
    dimensions: z.object({
      width: z.number(),
      height: z.number(),
    }),
  }),
  edited_image: z.object({
    image_url: z.string().url().optional(), // OpenAI URL only
    local_file_path: z.string().optional(), // Local file path
    file_size: z.number().optional(), // File size in bytes
    revised_prompt: z.string(),
    original_prompt: z.string(),
    edit_type: EditTypeSchema,
    strength: EditStrengthSchema,
    // Deprecated file output fields (kept for backward compatibility)
    local_path: z.string().optional(),
    filename: z.string().optional(),
    directory: z.string().optional(),
    size_bytes: z.number().optional(),
    format: z.string().optional(),
    saved_at: z.string().optional(),
  }),
  metadata: z.object({
    edit_time_ms: z.number(),
    model_used: z.string(),
    composition_preserved: z.boolean(),
    mask_applied: z.boolean(),
  }),
});

// REMOVED: VariationInputSchema - variations not supported by gpt-image-1

// REMOVED: VariationResultSchema - variations not supported by gpt-image-1

export const BatchEditInputSchema = z.object({
  images: z.array(ImageInputSchema).min(1, "At least one image is required"),
  // Deprecated: kept for backward compatibility
  image_urls: z
    .array(z.string().url())
    .min(1, "At least one image URL is required")
    .optional(),
  edit_prompt: z.string().min(1, "Edit prompt is required"),
  edit_type: z.enum([
    "style_transfer",
    "background_change",
    "color_adjustment",
    "enhancement",
  ]),
  batch_settings: z
    .object({
      parallel_processing: z.boolean().optional().default(true),
      progress_callback: z.boolean().optional().default(true),
      error_handling: z
        .enum(["fail_fast", "continue_on_error", "retry_failed"])
        .optional()
        .default("continue_on_error"),
      max_concurrent: z.number().min(1).max(10).optional().default(3),
    })
    .optional(),
  // File management
  save_to_file: z.boolean().optional().default(true),
  output_directory: z.string().optional(),
  filename_prefix: z.string().optional().default("batch_"),
  naming_strategy: z
    .enum(["timestamp", "prompt", "custom", "hash"])
    .optional()
    .default("timestamp"),
  organize_by: z
    .enum(["none", "date", "aspect_ratio", "quality"])
    .optional()
    .default("none"),
});

export const BatchEditResultSchema = z.object({
  total_images: z.number(),
  processed_images: z.number(),
  failed_images: z.number(),
  results: z.array(
    z.object({
      original_url: z.string(),
      success: z.boolean(),
      edited_image: z
        .object({
          image_url: z.string().url().optional(), // OpenAI URL only
          local_file_path: z.string().optional(), // Local file path
          file_size: z.number().optional(), // File size in bytes
          // Deprecated file output fields (kept for backward compatibility)
          local_path: z.string().optional(),
          filename: z.string().optional(),
          directory: z.string().optional(),
          size_bytes: z.number().optional(),
          format: z.string().optional(),
          saved_at: z.string().optional(),
        })
        .optional(),
      error: z.string().optional(),
    }),
  ),
  metadata: z.object({
    total_time_ms: z.number(),
    average_time_per_image_ms: z.number(),
    model_used: z.string(),
    parallel_processing: z.boolean(),
  }),
});

export const MaskInputSchema = z.object({
  image_url: z.string().url("Valid image URL is required"),
  mask_type: z
    .enum(["object_detection", "semantic_segmentation", "manual", "auto"])
    .optional()
    .default("auto"),
  target_object: z.string().optional(),
  precision: z.enum(["low", "medium", "high"]).optional().default("medium"),
});

export const MaskResultSchema = z.object({
  original_image: z.string(),
  mask_image: z.string(),
  mask_type: z.string(),
  confidence: z.number().min(0).max(1),
  detected_objects: z.array(z.string()).optional(),
  metadata: z.object({
    generation_time_ms: z.number(),
    model_used: z.string(),
    precision_level: z.string(),
  }),
});

// REMOVED: StyleTransferInputSchema - style transfer is now handled through edit-image endpoint
// Use edit-image with edit_type: "style_transfer" and multiple reference images instead

// REMOVED: StyleTransferResultSchema - style transfer is now handled through edit-image endpoint
// Use edit-image with edit_type: "style_transfer" and multiple reference images instead

// Type exports
export type EditType = z.infer<typeof EditTypeSchema>;
export type EditModel = z.infer<typeof EditModelSchema>;
export type EditStrength = z.infer<typeof EditStrengthSchema>;
export type ImageInput = z.infer<typeof ImageInputSchema>;
export type EditImageInput = z.infer<typeof EditImageInputSchema>;
export type EditImageResult = z.infer<typeof EditImageResultSchema>;
// REMOVED: VariationInput, VariationResult - variations not supported by gpt-image-1
// REMOVED: StyleTransferInput, StyleTransferResult - use edit-image with style_transfer type instead
export type BatchEditInput = z.infer<typeof BatchEditInputSchema>;
export type BatchEditResult = z.infer<typeof BatchEditResultSchema>;
export type MaskInput = z.infer<typeof MaskInputSchema>;
export type MaskResult = z.infer<typeof MaskResultSchema>;

// Extracted types for internal use (to replace any types)
export type EditedImageData = EditImageResult["edited_image"] & {
  model_used?: string;
};
// REMOVED: VariationData - variations not supported by gpt-image-1
// REMOVED: StyledImageData - use edit-image with style_transfer type instead

// Error types for image editing
export class ImageEditError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ImageEditError";
  }
}

export class MaskError extends ImageEditError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "MASK_ERROR", details);
    this.name = "MaskError";
  }
}

export class BatchProcessingError extends ImageEditError {
  constructor(
    message: string,
    public failedImages: string[],
    public successfulImages: string[],
    details?: Record<string, unknown>,
  ) {
    super(message, "BATCH_PROCESSING_ERROR", details);
    this.name = "BatchProcessingError";
  }
}

// REMOVED: StyleTransferError - style transfer is now handled through edit-image endpoint
// Use ImageEditError for style transfer errors instead
