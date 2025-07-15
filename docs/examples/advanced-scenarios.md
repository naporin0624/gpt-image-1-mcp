# Advanced Scenarios

Complex workflows and advanced use cases for GPT Image 1 MCP, including multi-step processes, conditional logic, and sophisticated integrations.

## Overview

This guide covers advanced implementation patterns that go beyond basic usage, including:

- **Multi-step Workflows**: Chaining multiple operations
- **Conditional Logic**: Dynamic decision-making based on results
- **Data Pipeline Integration**: Processing large datasets
- **Quality Assurance**: Automated validation and optimization
- **Performance Optimization**: Efficient resource utilization

## Multi-Step Workflows

### Iterative Image Refinement

```typescript
async function iterativeImageRefinement(
  basePrompt: string,
  targetQuality: number = 0.9,
  maxIterations: number = 5,
): Promise<any> {
  let currentPrompt = basePrompt;
  let bestResult = null;
  let bestScore = 0;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    console.log(`Iteration ${iteration + 1}: ${currentPrompt}`);

    // Generate image
    const imageResult = await client.callTool("generate-image", {
      prompt: currentPrompt,
      quality: "hd",
      style: "vivid",
    });

    // Keep best result (simplified approach without analysis)
    bestResult = {
      image: imageResult.data,
      prompt: currentPrompt,
      iteration: iteration + 1,
    };

    console.log(`Generated iteration ${iteration + 1}`);

    // For demonstration, we'll consider the first successful generation as complete
    if (iteration === 0) {
      console.log(`Image generated successfully`);
      break;
    }
  }

  return bestResult;
}

async function refinePrompt(
  originalPrompt: string,
  improvements: string,
): Promise<string> {
  // Simple prompt refinement by appending improvements
  return `${originalPrompt}, ${improvements}`;
}
```

### A/B Testing Pipeline

```typescript
async function abTestImageGeneration(
  prompts: string[],
  variants: Array<{
    quality: string;
    style: string;
    aspect_ratio: string;
  }>,
  evaluationCriteria: string[],
): Promise<any> {
  const results = [];

  for (const [promptIndex, prompt] of prompts.entries()) {
    const promptResults = [];

    for (const [variantIndex, variant] of variants.entries()) {
      console.log(
        `Testing prompt ${promptIndex + 1}, variant ${variantIndex + 1}`,
      );

      try {
        // Generate image with specific variant
        const imageResult = await client.callTool("generate-image", {
          prompt,
          ...variant,
        });

        // For A/B testing without analysis, we'll use generation metadata

        promptResults.push({
          variant,
          image: imageResult.data,
          prompt,
          timestamp: new Date().toISOString(),
        });

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error testing variant ${variantIndex + 1}:`, error);
        promptResults.push({
          variant,
          error: error.message,
          prompt,
        });
      }
    }

    results.push({
      prompt,
      variants: promptResults,
      bestVariant: promptResults.find((v) => v.image) || promptResults[0],
    });
  }

  return results;
}
```

## Conditional Logic and Decision Making

### Smart Quality Optimization

```typescript
async function smartQualityOptimization(
  prompt: string,
  targetFileSize: number = 2048576, // 2MB
  maxAttempts: number = 3,
): Promise<any> {
  const qualityLevels = ["standard", "hd"];
  const styles = ["natural", "vivid"];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (const quality of qualityLevels) {
      for (const style of styles) {
        console.log(
          `Attempt ${attempt + 1}: ${quality} quality, ${style} style`,
        );

        const result = await client.callTool("generate-image", {
          prompt,
          quality,
          style,
          aspect_ratio: "square",
        });

        // Check file size (simulated - would need actual file size check)
        const estimatedSize = quality === "hd" ? 3000000 : 1500000;

        if (estimatedSize <= targetFileSize) {
          return {
            image: result.data,
            settings: { quality, style },
            fileSize: estimatedSize,
            attempt: attempt + 1,
          };
        }
      }
    }

    // If no suitable result found, try with shorter prompt
    if (attempt < maxAttempts - 1) {
      prompt = shortenPrompt(prompt);
      console.log(`Shortened prompt for attempt ${attempt + 2}: ${prompt}`);
    }
  }

  throw new Error(
    "Could not achieve target file size within quality constraints",
  );
}

function shortenPrompt(prompt: string): string {
  // Remove adjectives and simplify
  return prompt
    .replace(/\b(beautiful|stunning|amazing|incredible|fantastic)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
```

### Content Moderation Pipeline

```typescript
async function contentModerationPipeline(
  imageUrls: string[],
  moderationLevel: "strict" | "moderate" | "relaxed" = "moderate",
): Promise<any> {
  const results = [];
  const moderationCriteria = {
    strict: [
      "Is this image appropriate for all ages?",
      "Are there any safety concerns?",
      "Is this suitable for educational use?",
      "Does this contain any potentially offensive content?",
    ],
    moderate: [
      "Is this image appropriate for general audiences?",
      "Are there any obvious safety issues?",
      "Is this suitable for public display?",
    ],
    relaxed: [
      "Are there any severe safety concerns?",
      "Is this appropriate for adult audiences?",
    ],
  };

  for (const [index, imageUrl] of imageUrls.entries()) {
    console.log(`Moderating image ${index + 1}/${imageUrls.length}`);

    try {
      // Note: Image analysis is now handled by LLM clients directly
      // This is a placeholder for external moderation service integration

      // Simulate moderation score based on image processing
      const mockModerationScore = Math.random() * 0.4 + 0.6; // 0.6-1.0 range
      const status =
        mockModerationScore >= 0.8
          ? "approved"
          : mockModerationScore >= 0.6
            ? "review"
            : "rejected";

      results.push({
        imageUrl,
        status,
        moderationScore: mockModerationScore,
        level: moderationLevel,
        note: "Moderation should be implemented using external services or LLM client image analysis",
      });

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      results.push({
        imageUrl,
        status: "error",
        error: error.message,
      });
    }
  }

  return {
    results,
    summary: {
      total: results.length,
      approved: results.filter((r) => r.status === "approved").length,
      review: results.filter((r) => r.status === "review").length,
      rejected: results.filter((r) => r.status === "rejected").length,
      errors: results.filter((r) => r.status === "error").length,
    },
  };
}
```

## Data Pipeline Integration

### Batch Processing with Progress Tracking

```typescript
async function batchProcessWithProgress(
  prompts: string[],
  options: {
    batchSize?: number;
    progressCallback?: (progress: any) => void;
    quality?: string;
    errorThreshold?: number;
  } = {},
): Promise<any> {
  const {
    batchSize = 5,
    progressCallback = () => {},
    quality = "standard",
    errorThreshold = 0.1,
  } = options;

  const results = [];
  const errors = [];
  let processed = 0;

  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(async (prompt, index) => {
        const globalIndex = i + index;

        try {
          const result = await client.callTool("generate-image", {
            prompt,
            quality,
            filename: `batch_${globalIndex + 1}`,
          });

          return {
            index: globalIndex,
            prompt,
            success: true,
            data: result.data,
          };
        } catch (error) {
          return {
            index: globalIndex,
            prompt,
            success: false,
            error: error.message,
          };
        }
      }),
    );

    // Process batch results
    batchResults.forEach((result) => {
      if (result.status === "fulfilled") {
        if (result.value.success) {
          results.push(result.value);
        } else {
          errors.push(result.value);
        }
      } else {
        errors.push({
          index: i + results.length + errors.length,
          success: false,
          error: result.reason.message,
        });
      }
    });

    processed += batch.length;

    // Report progress
    const progress = {
      processed,
      total: prompts.length,
      percentage: (processed / prompts.length) * 100,
      successful: results.length,
      errors: errors.length,
      errorRate: errors.length / processed,
    };

    progressCallback(progress);

    // Check error threshold
    if (progress.errorRate > errorThreshold) {
      throw new Error(
        `Error rate (${progress.errorRate.toFixed(2)}) exceeds threshold (${errorThreshold})`,
      );
    }

    // Rate limiting between batches
    if (i + batchSize < prompts.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return {
    results,
    errors,
    summary: {
      total: prompts.length,
      successful: results.length,
      failed: errors.length,
      successRate: results.length / prompts.length,
      errorRate: errors.length / prompts.length,
    },
  };
}
```

### CSV Processing Pipeline

```typescript
async function processCsvData(
  csvFilePath: string,
  promptTemplate: string,
  outputDirectory: string,
): Promise<any> {
  const fs = require("fs");
  const csv = require("csv-parser");
  const path = require("path");

  const results = [];
  const errors = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", async (row) => {
        try {
          // Generate prompt from template
          const prompt = promptTemplate.replace(
            /\{(\w+)\}/g,
            (match, key) => row[key] || match,
          );

          console.log(`Processing row ${results.length + 1}: ${prompt}`);

          const result = await client.callTool("generate-image", {
            prompt,
            quality: "hd",
            filename: `csv_${results.length + 1}_${row.id || "unknown"}`,
            output_directory: outputDirectory,
          });

          results.push({
            row: results.length + 1,
            originalData: row,
            prompt,
            image: result.data,
            success: true,
          });

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          errors.push({
            row: results.length + errors.length + 1,
            originalData: row,
            error: error.message,
            success: false,
          });
        }
      })
      .on("end", () => {
        resolve({
          results,
          errors,
          summary: {
            processed: results.length + errors.length,
            successful: results.length,
            failed: errors.length,
            outputDirectory,
          },
        });
      })
      .on("error", reject);
  });
}
```

## Quality Assurance Workflows

### Automated Quality Assessment

```typescript
async function automatedQualityAssessment(
  imageUrls: string[],
  qualityThresholds: {
    technical: number;
    artistic: number;
    promptMatching: number;
  } = {
    technical: 0.8,
    artistic: 0.7,
    promptMatching: 0.8,
  },
): Promise<any> {
  const results = [];

  for (const [index, imageUrl] of imageUrls.entries()) {
    console.log(`Assessing quality of image ${index + 1}/${imageUrls.length}`);

    try {
      // Note: Image analysis is now handled by LLM clients directly
      // This example shows placeholder quality assessment

      // Simulate quality scores (in production, use external services or LLM client analysis)
      const technicalScore = Math.random() * 0.4 + 0.6; // 0.6-1.0 range
      const artisticScore = Math.random() * 0.4 + 0.6; // 0.6-1.0 range
      const overallScore = (technicalScore + artisticScore) / 2;

      const passed = {
        technical: technicalScore >= qualityThresholds.technical,
        artistic: artisticScore >= qualityThresholds.artistic,
        overall:
          overallScore >=
          (qualityThresholds.technical + qualityThresholds.artistic) / 2,
      };

      results.push({
        imageUrl,
        scores: {
          technical: technicalScore,
          artistic: artisticScore,
          overall: overallScore,
        },
        passed,
        status: passed.overall ? "approved" : "rejected",
        note: "Quality assessment should use external services or LLM client image analysis",
      });
    } catch (error) {
      results.push({
        imageUrl,
        status: "error",
        error: error.message,
      });
    }
  }

  return {
    results,
    summary: {
      total: results.length,
      approved: results.filter((r) => r.status === "approved").length,
      rejected: results.filter((r) => r.status === "rejected").length,
      errors: results.filter((r) => r.status === "error").length,
      averageScores: calculateAverageScores(results),
    },
  };
}

function extractScore(text: string): number {
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function calculateAverageScores(results: any[]): any {
  const validResults = results.filter((r) => r.scores);
  if (validResults.length === 0) return null;

  const totals = validResults.reduce(
    (acc, result) => ({
      technical: acc.technical + result.scores.technical,
      artistic: acc.artistic + result.scores.artistic,
      overall: acc.overall + result.scores.overall,
    }),
    { technical: 0, artistic: 0, overall: 0 },
  );

  return {
    technical: totals.technical / validResults.length,
    artistic: totals.artistic / validResults.length,
    overall: totals.overall / validResults.length,
  };
}
```

## Performance Optimization

### Caching and Optimization

```typescript
class AdvancedImageGenerator {
  private cache: Map<string, any> = new Map();
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;

  constructor(
    private maxCacheSize: number = 100,
    private batchSize: number = 5,
  ) {}

  async generateWithCache(prompt: string, options: any = {}): Promise<any> {
    // Create cache key
    const cacheKey = this.createCacheKey(prompt, options);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log("Cache hit for:", prompt);
      return this.cache.get(cacheKey);
    }

    // Add to queue
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await client.callTool("generate-image", {
            prompt,
            ...options,
          });

          // Cache result
          this.addToCache(cacheKey, result.data);

          resolve(result.data);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private createCacheKey(prompt: string, options: any): string {
    return `${prompt}:${JSON.stringify(options)}`;
  }

  private addToCache(key: string, value: any): void {
    // Implement LRU eviction
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, this.batchSize);

      await Promise.all(batch.map((request) => request()));

      // Rate limiting between batches
      if (this.requestQueue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    this.processing = false;
  }

  getCacheStats(): any {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.calculateHitRate(),
      queueLength: this.requestQueue.length,
    };
  }

  private calculateHitRate(): number {
    // Implementation would track hits/misses
    return 0; // Placeholder
  }
}
```

### Parallel Processing with Resource Management

```typescript
async function parallelProcessWithResourceManagement(
  prompts: string[],
  options: {
    maxConcurrency?: number;
    memoryThreshold?: number;
    cpuThreshold?: number;
  } = {},
): Promise<any> {
  const {
    maxConcurrency = 3,
    memoryThreshold = 80, // percent
    cpuThreshold = 80, // percent
  } = options;

  const results = [];
  const semaphore = new Semaphore(maxConcurrency);

  const processPrompt = async (prompt: string, index: number) => {
    await semaphore.acquire();

    try {
      // Check system resources
      const resources = await checkSystemResources();

      if (resources.memory > memoryThreshold || resources.cpu > cpuThreshold) {
        console.log(
          `Resource usage high, waiting... Memory: ${resources.memory}%, CPU: ${resources.cpu}%`,
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      const result = await client.callTool("generate-image", {
        prompt,
        quality: "standard", // Use standard quality for parallel processing
      });

      return {
        index,
        prompt,
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        index,
        prompt,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    } finally {
      semaphore.release();
    }
  };

  const promises = prompts.map(processPrompt);
  const results_raw = await Promise.allSettled(promises);

  results_raw.forEach((result) => {
    if (result.status === "fulfilled") {
      results.push(result.value);
    } else {
      results.push({
        success: false,
        error: result.reason.message,
      });
    }
  });

  return {
    results,
    summary: {
      total: prompts.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      concurrency: maxConcurrency,
    },
  };
}

class Semaphore {
  private tokens: number;
  private waitingQueue: Array<() => void> = [];

  constructor(maxConcurrency: number) {
    this.tokens = maxConcurrency;
  }

  async acquire(): Promise<void> {
    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    return new Promise((resolve) => {
      this.waitingQueue.push(resolve);
    });
  }

  release(): void {
    this.tokens++;

    if (this.waitingQueue.length > 0) {
      const resolve = this.waitingQueue.shift()!;
      this.tokens--;
      resolve();
    }
  }
}

async function checkSystemResources(): Promise<{
  memory: number;
  cpu: number;
}> {
  // Implementation would check actual system resources
  return {
    memory: Math.random() * 100,
    cpu: Math.random() * 100,
  };
}
```

## Integration Examples

### Slack Bot Integration

```typescript
class SlackImageBot {
  private generator: AdvancedImageGenerator;

  constructor() {
    this.generator = new AdvancedImageGenerator();
  }

  async handleSlackCommand(
    command: string,
    user: string,
    channel: string,
  ): Promise<void> {
    try {
      // Parse command
      const match = command.match(/^\/generate-image\s+(.+)$/);
      if (!match) {
        await this.sendSlackMessage(channel, "Usage: /generate-image <prompt>");
        return;
      }

      const prompt = match[1];

      // Send acknowledgment
      await this.sendSlackMessage(
        channel,
        `Generating image for: "${prompt}" - This may take a moment...`,
      );

      // Generate image
      const result = await this.generator.generateWithCache(prompt, {
        quality: "hd",
        aspect_ratio: "landscape",
      });

      // Send result
      await this.sendSlackMessage(channel, `Image generated successfully!`, {
        image_url: result.image_url,
        user: user,
        prompt: prompt,
      });
    } catch (error) {
      await this.sendSlackMessage(
        channel,
        `Error generating image: ${error.message}`,
      );
    }
  }

  private async sendSlackMessage(
    channel: string,
    text: string,
    attachments?: any,
  ): Promise<void> {
    // Implementation would use Slack API
    console.log(`Slack message to ${channel}: ${text}`);
  }
}
```

## Next Steps

- [Integration Patterns](/examples/integration-patterns.md) - System integration examples
- [Basic Usage](/examples/basic-usage.md) - Fundamental usage patterns
- [API Reference](/api/tools.md) - Complete API documentation
- [Error Handling](/api/error-handling.md) - Error management strategies
