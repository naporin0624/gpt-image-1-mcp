import { OpenAI } from "openai";

import {
  ImageEditError,
  MaskError,
  BatchProcessingError,
} from "../types/edit.js";
import { aspectRatioToSize } from "../types/image.js";

import { FileManager } from "./file-manager.js";
import { loadImageAsBuffer, normalizeImageInput } from "./image-input.js";

import type {
  EditImageInput,
  EditImageResult,
  BatchEditInput,
  BatchEditResult,
  MaskInput,
  MaskResult,
  EditedImageData,
  ImageInput,
} from "../types/edit.js";
import type {
  GenerateImageInput,
  OptimizedGenerateImageResponse,
} from "../types/image.js";

export class OpenAIService {
  private client: OpenAI;
  private fileManager: FileManager;
  private readonly MAX_RESPONSE_TOKENS = 20000;
  private readonly WARNING_THRESHOLD = 15000;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    this.client = new OpenAI({
      apiKey,
      maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES ?? "3"),
      timeout: parseInt(process.env.OPENAI_API_TIMEOUT ?? "120000"),
    });

    this.fileManager = new FileManager({
      defaultOutputDir: process.env.DEFAULT_OUTPUT_DIR ?? "./generated_images",
      maxFileSizeBytes:
        parseInt(process.env.MAX_FILE_SIZE_MB ?? "50") * 1024 * 1024,
      enableFileOutput: process.env.ENABLE_FILE_OUTPUT !== "false",
      autoCleanupDays: parseInt(process.env.KEEP_FILES_DAYS ?? "30"),
    });
  }

  private estimateResponseTokens(
    imageSizeBytes: number,
    includeBase64: boolean,
  ): number {
    const metadataTokens = 200; // Rough estimate for JSON structure

    if (!includeBase64) {
      return metadataTokens;
    }

    // Base64 is ~4/3 size of original
    const base64Chars = Math.ceil((imageSizeBytes * 4) / 3);
    // 1 token ≈ 4 characters
    const base64Tokens = Math.ceil(base64Chars / 4);
    // Add 20% overhead for JSON escaping

    return Math.ceil((metadataTokens + base64Tokens) * 1.2);
  }

  async generateImage(
    input: GenerateImageInput,
  ): Promise<OptimizedGenerateImageResponse> {
    try {
      const size = aspectRatioToSize(input.aspect_ratio);

      // Build parameters only with what gpt-image-1 supports
      const generateParams: OpenAI.ImageGenerateParams = {
        model: "gpt-image-1",
        prompt: input.prompt,
        size,
        ...(input.quality && { quality: input.quality }),
        n: 1,
      };

      // Add optional parameters only if provided and supported
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (input.output_format) {
        generateParams.output_format = input.output_format;
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (input.moderation) {
        generateParams.moderation = input.moderation;
      }

      const openaiResponse = await this.client.images.generate(generateParams);

      if (openaiResponse.data == null || openaiResponse.data.length === 0) {
        throw new Error("No image data returned from OpenAI");
      }

      const imageData = openaiResponse.data[0];
      if (
        imageData == null ||
        (imageData.url == null && imageData.b64_json == null)
      ) {
        throw new Error("No image data returned from OpenAI");
      }

      // gpt-image-1 returns b64_json instead of URL
      const imageUrl = imageData.url;
      const b64Data = imageData.b64_json;

      // Build base response with metadata always included
      const customResponse: OptimizedGenerateImageResponse = {
        metadata: {
          width: 0,
          height: 0,
          format: "",
          size_bytes: 0,
          created_at: "",
        },
      };
      let fileResult: {
        local_path: string;
        filename: string;
        directory: string;
        size_bytes: number;
        format: string;
        saved_at: string;
      } | null = null;

      // Always save to file to get metadata, but handle errors gracefully
      try {
        const dataUrl =
          imageUrl != null
            ? imageUrl
            : `data:image/${input.output_format ?? "png"};base64,${b64Data}`;
        fileResult = await this.fileManager.saveImage(
          dataUrl,
          {
            save_to_file: input.save_to_file,
            output_directory: input.output_directory,
            filename: input.filename,
            naming_strategy: input.naming_strategy,
            organize_by: input.organize_by,
          },
          {
            prompt: input.prompt,
            aspectRatio: input.aspect_ratio,
            quality: input.quality ?? "medium",
            format: input.output_format ?? "png",
          },
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Failed to save image to file:", error);
      }

      // Add file path when save_to_file=true (always return when saved)
      if (input.save_to_file && fileResult) {
        customResponse.file_path = fileResult.local_path;
      }

      // Always include metadata
      customResponse.metadata = {
        width: parseInt(size.split("x")[0] ?? "1024"),
        height: parseInt(size.split("x")[1] ?? "1024"),
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        format: fileResult?.format ?? input.output_format ?? "png",
        size_bytes: fileResult?.size_bytes ?? 0,
        created_at: fileResult?.saved_at ?? new Date().toISOString(),
      };

      // Include warnings if needed
      const warnings: string[] = [];

      // Handle base64 inclusion based on include_base64 parameter
      if (input.include_base64) {
        const imageSizeBytes = fileResult?.size_bytes ?? 0;
        const estimatedTokens = this.estimateResponseTokens(
          imageSizeBytes,
          true,
        );

        if (estimatedTokens > this.MAX_RESPONSE_TOKENS) {
          warnings.push(
            `Image too large for base64 response (${estimatedTokens} tokens > ${this.MAX_RESPONSE_TOKENS} limit). Use file_path instead.`,
          );
        } else {
          if (estimatedTokens > this.WARNING_THRESHOLD) {
            warnings.push(
              `Large response size warning: ${estimatedTokens} tokens. Consider using file_path for better performance.`,
            );
          }

          // Include base64 data
          if (b64Data != null && b64Data.length > 0) {
            customResponse.base64_image = b64Data;
          } else if (imageUrl != null && imageUrl.length > 0) {
            // For URLs, we'd need to fetch and convert - for now just warn
            warnings.push(
              "Base64 requested but only URL available. Use file_path instead.",
            );
          }
        }
      }

      if (warnings.length > 0) {
        customResponse.warnings = warnings;
      }

      return customResponse;
    } catch (error) {
      throw this.handleOpenAIError(error);
    }
  }

  async editImage(input: EditImageInput): Promise<EditImageResult> {
    const startTime = Date.now();

    try {
      // Load source image using new image input system
      const normalizedInput = normalizeImageInput(input.source_image);
      const imageBuffer = await loadImageAsBuffer(normalizedInput);

      // Always use 1024x1024 for consistency
      const size = "1024x1024";

      const baseParams = {
        image: new File([new Uint8Array(imageBuffer)], "source.png", {
          type: "image/png",
        }),
        prompt: input.edit_prompt,
        model: input.model,
        size: size as OpenAI.Images.ImageEditParams["size"],
        n: 1,
      };

      const optionalParams: Record<string, unknown> = {};
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (input.quality) {
        optionalParams.quality = input.quality;
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (input.background) {
        optionalParams.background = input.background;
      }

      const response = await this.client.images.edit({
        ...baseParams,
        ...optionalParams,
      } as OpenAI.Images.ImageEditParams);

      const editTime = Date.now() - startTime;

      if (!response.data?.[0]) {
        throw new Error("No image returned from OpenAI");
      }

      const imageData = response.data[0];
      let openaiImageUrl: string | undefined;
      let fileResult:
        | {
            local_path: string;
            filename: string;
            directory: string;
            size_bytes: number;
            format: string;
            saved_at: string;
          }
        | null
        | undefined;

      // Handle different response formats
      if (imageData.b64_json != null && imageData.b64_json.length > 0) {
        // gpt-image-1 returns base64 - save to file immediately to avoid large responses
        const base64Data = imageData.b64_json;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const dataUrl = `data:image/${input.output_format ?? "png"};base64,${base64Data}`;

        try {
          fileResult = await this.fileManager.saveImage(
            dataUrl,
            {
              save_to_file: true, // Always save base64 data to file
              output_directory: input.output_directory,
              filename:
                input.filename_prefix !== "" && input.filename_prefix.length > 0
                  ? `${input.filename_prefix}${Date.now()}`
                  : undefined,
              naming_strategy: input.naming_strategy,
              organize_by: input.organize_by,
            },
            {
              prompt: input.edit_prompt,
              aspectRatio: "square", // Need to detect from source image
              quality: "medium",
              format: input.output_format ?? "png",
            },
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn("Failed to save base64 image to file:", error);
          // If file save fails, we still need to provide the data somehow
          // but this should be rare and we'll log it
        }
      } else if (imageData.url !== undefined && imageData.url.length > 0) {
        // dall-e-2 returns URL - can return URL directly
        openaiImageUrl = imageData.url;

        // Save to file if requested
        if (input.save_to_file) {
          try {
            fileResult = await this.fileManager.saveImage(
              imageData.url,
              {
                save_to_file: input.save_to_file,
                output_directory: input.output_directory,
                filename:
                  input.filename_prefix !== "" &&
                  input.filename_prefix.length > 0
                    ? `${input.filename_prefix}${Date.now()}`
                    : undefined,
                naming_strategy: input.naming_strategy,
                organize_by: input.organize_by,
              },
              {
                prompt: input.edit_prompt,
                aspectRatio: "square", // Need to detect from source image
                quality: "medium",
                format: input.output_format ?? "png",
              },
            );
          } catch (error) {
            // eslint-disable-next-line no-console
            console.warn("Failed to save edited image to file:", error);
          }
        }
      } else {
        throw new Error("No image data in response");
      }

      const editedImage: EditedImageData = {
        image_url: openaiImageUrl, // OpenAI URL only (undefined for base64)
        local_file_path: fileResult?.local_path,
        file_size: fileResult?.size_bytes,
        revised_prompt: imageData.revised_prompt ?? input.edit_prompt,
        original_prompt: input.edit_prompt,
        edit_type: input.edit_type,
        strength: input.strength,
        model_used: input.model,
        // Backward compatibility fields
        local_path: fileResult?.local_path,
        filename: fileResult?.filename,
        directory: fileResult?.directory,
        size_bytes: fileResult?.size_bytes,
        format: fileResult?.format,
        saved_at: fileResult?.saved_at,
      };

      return {
        original_image: {
          url:
            normalizedInput.type === "url"
              ? normalizedInput.value
              : `${normalizedInput.type}:${normalizedInput.value.substring(0, 50)}...`,
          format: "unknown",
          dimensions: { width: 1024, height: 1024 },
        },
        edited_image: editedImage,
        metadata: {
          edit_time_ms: editTime,
          model_used: input.model,
          composition_preserved: input.preserve_composition,
          mask_applied: input.mask_area !== undefined,
        },
      };
    } catch (error) {
      throw this.handleImageEditError(error);
    }
  }

  // REMOVED: createVariation method - variations not supported by gpt-image-1
  // Use editImage with edit_type: "variation" instead

  async batchEdit(input: BatchEditInput): Promise<BatchEditResult> {
    const startTime = Date.now();
    const results: {
      original_url: string;
      success: boolean;
      edited_image?: EditedImageData;
      error?: string;
    }[] = [];
    const settings = input.batch_settings || {
      parallel_processing: true,
      max_concurrent: 3,
    };
    let processedCount = 0;
    let failedCount = 0;

    // Handle both new images array and legacy image_urls for backward compatibility
    const imageInputs =
      input.images.length > 0
        ? input.images
        : input.image_urls
          ? input.image_urls.map((url) => ({
              type: "url" as const,
              value: url,
            }))
          : [];

    try {
      const processImage = async (imageInput: ImageInput, index: number) => {
        try {
          // Map batch edit types to edit image types
          const editTypeMap: Record<string, string> = {
            style_transfer: "style_transfer",
            background_change: "background_change",
            color_adjustment: "variation",
            enhancement: "variation",
          };

          const editResult = await this.editImage({
            source_image: imageInput,
            edit_prompt: input.edit_prompt,
            edit_type: editTypeMap[input.edit_type] as
              | "inpaint"
              | "outpaint"
              | "variation"
              | "style_transfer"
              | "object_removal"
              | "background_change",
            model: "gpt-image-1",
            background: "auto",
            quality: "auto",
            save_to_file: input.save_to_file,
            output_directory: input.output_directory,
            filename_prefix: input.filename_prefix
              ? `${input.filename_prefix}${index + 1}_`
              : "edited_",
            naming_strategy: input.naming_strategy,
            organize_by: input.organize_by,
            strength: 0.8,
            preserve_composition: true,
            output_format: "png",
          });

          processedCount++;

          return {
            original_url:
              imageInput.type === "url"
                ? imageInput.value
                : `${imageInput.type}:${imageInput.value.substring(0, 50)}...`,
            success: true,
            edited_image: editResult.edited_image,
          };
        } catch (error) {
          failedCount++;

          return {
            original_url:
              imageInput.type === "url"
                ? imageInput.value
                : `${imageInput.type}:${imageInput.value.substring(0, 50)}...`,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      };

      if (settings.parallel_processing) {
        const maxConcurrent = settings.max_concurrent || 3;
        const chunks = [];

        for (let i = 0; i < imageInputs.length; i += maxConcurrent) {
          chunks.push(imageInputs.slice(i, i + maxConcurrent));
        }

        for (const chunk of chunks) {
          const promises = chunk.map((imageInput, index) =>
            processImage(imageInput, index),
          );
          const chunkResults = await Promise.allSettled(promises);

          for (const result of chunkResults) {
            if (result.status === "fulfilled") {
              results.push(result.value);
            } else {
              failedCount++;
              results.push({
                original_url: "unknown",
                success: false,
                error:
                  result.reason instanceof Error
                    ? result.reason.message
                    : "Unknown error",
              });
            }
          }
        }
      } else {
        for (let i = 0; i < imageInputs.length; i++) {
          const imageInput = imageInputs[i];
          if (imageInput != null) {
            const result = await processImage(imageInput, i);
            results.push(result);
          }
        }
      }

      const totalTime = Date.now() - startTime;

      return {
        total_images: imageInputs.length,
        processed_images: processedCount,
        failed_images: failedCount,
        results,
        metadata: {
          total_time_ms: totalTime,
          average_time_per_image_ms: totalTime / imageInputs.length,
          model_used: "gpt-image-1",
          parallel_processing: settings.parallel_processing || false,
        },
      };
    } catch (error) {
      const failedUrls = imageInputs
        .filter((_, index) => !(results[index]?.success ?? false))
        .map((input) =>
          input.type === "url"
            ? input.value
            : `${input.type}:${input.value.substring(0, 50)}...`,
        );
      const successfulUrls = imageInputs
        .filter((_, index) => results[index]?.success ?? false)
        .map((input) =>
          input.type === "url"
            ? input.value
            : `${input.type}:${input.value.substring(0, 50)}...`,
        );

      throw new BatchProcessingError(
        "Batch processing failed",
        failedUrls,
        successfulUrls,
        { originalError: error },
      );
    }
  }

  async generateMask(input: MaskInput): Promise<MaskResult> {
    try {
      // This is a placeholder implementation
      // In real implementation, you would use a specialized mask generation service
      await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Generate a mask for the following image${input.target_object !== undefined ? ` focusing on: ${input.target_object}` : ""}. Describe the mask areas in detail.`,
              },
              {
                type: "image_url",
                image_url: { url: input.image_url },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      // const maskDescription = response.choices[0]?.message?.content || "";

      return {
        original_image: input.image_url,
        mask_image: input.image_url, // Placeholder - would be actual mask image
        mask_type: input.mask_type,
        confidence: 0.8,
        detected_objects:
          input.target_object !== undefined ? [input.target_object] : [],
        metadata: {
          generation_time_ms: 1000,
          model_used: "gpt-4o",
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          precision_level: input.precision ?? "medium",
        },
      };
    } catch (error) {
      throw new MaskError("Mask generation failed", { originalError: error });
    }
  }

  // REMOVED: transferStyle method - style transfer is now handled through edit-image endpoint
  // Use editImage with edit_type: "style_transfer" instead

  private handleImageEditError(error: unknown): Error {
    if (
      error instanceof ImageEditError ||
      error instanceof MaskError ||
      error instanceof BatchProcessingError
    ) {
      return error;
    }

    return this.handleOpenAIError(error);
  }

  private handleOpenAIError(error: unknown): Error {
    if (error != null && typeof error === "object" && "error" in error) {
      const openaiError = error as {
        error: { type: string; message: string } | null;
      };

      if (openaiError.error === null) {
        return new Error("OpenAI API error: Unknown error");
      }

      const errorDetails = openaiError.error;

      if (errorDetails.type === "insufficient_quota") {
        return new Error(
          "OpenAI API quota exceeded. Please check your billing.",
        );
      }

      if (errorDetails.type === "rate_limit_exceeded") {
        return new Error(
          "OpenAI API rate limit exceeded. Please try again later.",
        );
      }

      if (errorDetails.type === "invalid_request_error") {
        return new Error(
          `Invalid request: ${errorDetails.message || "Unknown error"}`,
        );
      }

      if (errorDetails.type === "authentication_error") {
        return new Error(
          "OpenAI API authentication failed. Please check your API key.",
        );
      }
    }

    if (error instanceof Error) {
      return new Error(`OpenAI API error: ${error.message || "Unknown error"}`);
    }

    return new Error("OpenAI API error: Unknown error");
  }

  // REMOVED: downloadImageAsBuffer - replaced with loadImageAsBuffer from image-input utility
  // This provides better type safety, security validation, and support for local files
}
