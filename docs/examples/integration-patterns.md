# Integration Patterns

Common integration patterns and architectures for GPT Image 1 MCP, including system integrations, workflow automation, and platform-specific implementations.

## Overview

This guide covers practical integration patterns for incorporating GPT Image 1 MCP into various systems and workflows:

- **Platform Integrations**: CMS, e-commerce, social media
- **Workflow Automation**: CI/CD, content pipelines, bulk processing
- **Event-Driven Architecture**: Webhooks, message queues, real-time processing
- **Custom Applications**: Web apps, mobile apps, desktop tools
- **Enterprise Solutions**: Scalable architectures and monitoring

## Content Management Systems

### WordPress Integration

```typescript
class WordPressImageGenerator {
  private client: MCPClient;

  constructor(
    private wpApiUrl: string,
    private wpApiKey: string,
  ) {
    this.client = new MCPClient("@napolab/gpt-image-1-mcp");
  }

  async generateFeaturedImage(postId: number, title: string, excerpt: string) {
    // Generate English prompt from post content
    const prompt = `Featured image for article: ${title}. ${excerpt}`;

    // Generate image
    const image = await this.client.callTool("generate-image", {
      prompt: prompt,
      aspect_ratio: "landscape",
      quality: "hd",
    });

    // Upload to WordPress Media Library
    const mediaResponse = await this.uploadToWordPress(
      image.data.image_url,
      `featured-${postId}.jpg`,
    );

    // Set as featured image
    await this.setFeaturedImage(postId, mediaResponse.id);

    return {
      postId,
      imageUrl: image.data.image_url,
      wordpressMediaId: mediaResponse.id,
      prompt: prompt,
    };
  }

  private async uploadToWordPress(imageUrl: string, filename: string) {
    const imageBuffer = await fetch(imageUrl).then((res) => res.buffer());

    const formData = new FormData();
    formData.append("file", imageBuffer, filename);

    const response = await fetch(`${this.wpApiUrl}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.wpApiKey}`,
      },
      body: formData,
    });

    return response.json();
  }

  private async setFeaturedImage(postId: number, mediaId: number) {
    return fetch(`${this.wpApiUrl}/wp-json/wp/v2/posts/${postId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.wpApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        featured_media: mediaId,
      }),
    });
  }
}
```

### Shopify Integration

```typescript
class ShopifyProductImageGenerator {
  private client: MCPClient;

  constructor(
    private shopifyDomain: string,
    private accessToken: string,
  ) {
    this.client = new MCPClient("@napolab/gpt-image-1-mcp");
  }

  async generateProductImages(productId: string, productData: any) {
    const { title, description, tags, vendor } = productData;

    // Generate multiple image variations
    const prompts = [
      `Product photo of ${title} on white background, professional product photography`,
      `Lifestyle photo featuring ${title}. ${description}`,
      `${vendor} brand ${title} in ${tags.join(", ")} style`,
    ];

    const images = [];

    for (const [index, prompt] of prompts.entries()) {
      const image = await this.client.callTool("generate-image", {
        prompt: prompt,
        aspect_ratio: "square",
        quality: "hd",
      });

      // Upload to Shopify
      const shopifyImage = await this.uploadToShopify(
        productId,
        image.data.image_url,
        `product-${productId}-${index + 1}.jpg`,
      );

      images.push({
        shopifyId: shopifyImage.id,
        url: shopifyImage.src,
        prompt: prompt,
      });

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return images;
  }

  private async uploadToShopify(
    productId: string,
    imageUrl: string,
    filename: string,
  ) {
    const response = await fetch(
      `https://${this.shopifyDomain}/admin/api/2024-01/products/${productId}/images.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": this.accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: {
            src: imageUrl,
            filename: filename,
          },
        }),
      },
    );

    const data = await response.json();
    return data.image;
  }
}
```

## Social Media Automation

### Twitter/X Bot Integration

```typescript
class TwitterImageBot {
  private client: MCPClient;
  private twitterClient: any;

  constructor(twitterCredentials: any) {
    this.client = new MCPClient("@napolab/gpt-image-1-mcp");
    this.twitterClient = new TwitterApi(twitterCredentials);
  }

  async createScheduledPost(englishText: string, scheduledTime: Date) {
    // Generate image
    const image = await this.client.callTool("generate-image", {
      prompt: englishText,
      aspect_ratio: "landscape",
      quality: "hd",
    });

    // Download and upload to Twitter
    const mediaId = await this.uploadMedia(image.data.image_url);

    // Schedule tweet
    const tweet = await this.twitterClient.v2.tweet({
      text: `${englishText} #AI #GeneratedArt`,
      media: { media_ids: [mediaId] },
    });

    return {
      tweetId: tweet.data.id,
      imageUrl: image.data.image_url,
      text: englishText,
    };
  }

  private async uploadMedia(imageUrl: string): Promise<string> {
    const imageBuffer = await fetch(imageUrl).then((res) => res.buffer());
    const mediaId = await this.twitterClient.v1.uploadMedia(imageBuffer, {
      mimeType: "image/jpeg",
    });
    return mediaId;
  }
}
```

### Instagram Integration

```typescript
class InstagramImageGenerator {
  private client: MCPClient;

  constructor(
    private instagramBusinessId: string,
    private accessToken: string,
  ) {
    this.client = new MCPClient("@napolab/gpt-image-1-mcp");
  }

  async createInstagramPost(caption: string, hashtags: string[]) {
    // Generate image from caption
    const image = await this.client.callTool("generate-image", {
      prompt: caption,
      aspect_ratio: "square",
      quality: "hd",
    });

    // Create Instagram media object
    const mediaObjectResponse = await fetch(
      `https://graph.facebook.com/v18.0/${this.instagramBusinessId}/media`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: image.data.image_url,
          caption: `${caption}\n\n${hashtags.join(" ")}`,
          access_token: this.accessToken,
        }),
      },
    );

    const mediaObject = await mediaObjectResponse.json();

    // Publish the media
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${this.instagramBusinessId}/media_publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creation_id: mediaObject.id,
          access_token: this.accessToken,
        }),
      },
    );

    return await publishResponse.json();
  }
}
```

## Workflow Automation

### GitHub Actions Integration

```yaml
name: Generate Images for Documentation

on:
  push:
    paths:
      - "docs/content/**"
  workflow_dispatch:
    inputs:
      regenerate_all:
        description: "Regenerate all images"
        required: false
        type: boolean

jobs:
  generate-images:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm install

      - name: Generate documentation images
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          node scripts/generate-doc-images.js

      - name: Commit generated images
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add docs/images/
          git commit -m "Auto-generate documentation images" || exit 0
          git push
```

### Jenkins Pipeline Integration

```groovy
pipeline {
    agent any

    environment {
        OPENAI_API_KEY = credentials('openai-api-key')
    }

    stages {
        stage('Generate Product Images') {
            steps {
                script {
                    def products = readJSON file: 'products.json'

                    products.each { product ->
                        sh """
                            node scripts/generate-product-image.js \
                                --product-id="${product.id}" \
                                --title="${product.title}" \
                                --description="${product.description}"
                        """
                    }
                }
            }
        }

        stage('Upload to CDN') {
            steps {
                sh 'aws s3 sync ./generated-images s3://my-cdn-bucket/images/'
            }
        }

        stage('Update Database') {
            steps {
                sh 'node scripts/update-product-images.js'
            }
        }
    }
}
```

## Event-Driven Architecture

### AWS Lambda Integration

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const client = new MCPClient("@napolab/gpt-image-1-mcp");

  try {
    const { prompt, userId, requestId } = JSON.parse(event.body || "{}");

    // Generate image
    const image = await client.callTool("generate-image", {
      prompt,
      quality: "hd",
    });

    // Store in S3
    const s3Key = `generated-images/${userId}/${requestId}.jpg`;
    await uploadToS3(image.data.image_url, s3Key);

    // Send notification via SNS
    await sendNotification(userId, {
      imageUrl: `https://cdn.example.com/${s3Key}`,
      requestId,
      status: "completed",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        imageUrl: `https://cdn.example.com/${s3Key}`,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};

async function uploadToS3(imageUrl: string, key: string) {
  const AWS = require("aws-sdk");
  const s3 = new AWS.S3();

  const imageBuffer = await fetch(imageUrl).then((res) => res.buffer());

  await s3
    .putObject({
      Bucket: "my-image-bucket",
      Key: key,
      Body: imageBuffer,
      ContentType: "image/jpeg",
    })
    .promise();
}

async function sendNotification(userId: string, message: any) {
  const AWS = require("aws-sdk");
  const sns = new AWS.SNS();

  await sns
    .publish({
      TopicArn: "arn:aws:sns:region:account:image-generation-notifications",
      Message: JSON.stringify(message),
      MessageAttributes: {
        userId: {
          DataType: "String",
          StringValue: userId,
        },
      },
    })
    .promise();
}
```

### Message Queue Integration

```typescript
import { Worker } from "bullmq";
import IORedis from "ioredis";

const redis = new IORedis(process.env.REDIS_URL);

const imageGenerationWorker = new Worker(
  "image-generation",
  async (job) => {
    const client = new MCPClient("@napolab/gpt-image-1-mcp");
    const { prompt, options, userId, requestId } = job.data;

    try {
      // Update job progress
      await job.updateProgress(10);

      await job.updateProgress(30);

      // Generate image
      const image = await client.callTool("generate-image", {
        prompt: prompt,
        ...options,
      });

      await job.updateProgress(70);

      await job.updateProgress(90);

      // Store result
      await storeResult(userId, requestId, {
        image: image.data,
        prompt: prompt,
      });

      await job.updateProgress(100);

      return {
        success: true,
        imageUrl: image.data.image_url,
      };
    } catch (error) {
      throw new Error(`Image generation failed: ${error.message}`);
    }
  },
  {
    connection: redis,
    concurrency: 5,
  },
);

async function storeResult(userId: string, requestId: string, data: any) {
  // Store in database
  await database.imageGenerations.create({
    userId,
    requestId,
    ...data,
    createdAt: new Date(),
  });
}
```

## Web Application Integration

### Next.js API Routes

```typescript
// pages/api/generate-image.ts
import { NextApiRequest, NextApiResponse } from "next";
import { MCPClient } from "@anthropic/mcp-client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, options } = req.body;
  const client = new MCPClient("@napolab/gpt-image-1-mcp");

  try {
    const result = await client.callTool("generate-image", {
      prompt,
      ...options,
    });

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
```

### React Component Integration

```tsx
import React, { useState, useCallback } from "react";

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  onImageGenerated,
}) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          options: {
            quality: "hd",
            aspect_ratio: "landscape",
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        onImageGenerated?.(data.data.image_url);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("画像生成に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [prompt, onImageGenerated]);

  return (
    <div className="image-generator">
      <div className="input-section">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="画像の説明を入力してください..."
          className="prompt-input"
        />
        <button
          onClick={generateImage}
          disabled={loading || !prompt.trim()}
          className="generate-button"
        >
          {loading ? "生成中..." : "画像を生成"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className="result-section">
          <img src={result.image_url} alt="Generated image" />
          <div className="metadata">
            <p>プロンプト: {result.revised_prompt}</p>
            <p>生成時間: {new Date(result.created).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};
```

## Desktop Application Integration

### Electron Application

```typescript
// main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import { MCPClient } from "@anthropic/mcp-client";

const client = new MCPClient("@napolab/gpt-image-1-mcp");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");
}

ipcMain.handle("generate-image", async (event, { prompt, options }) => {
  try {
    const result = await client.callTool("generate-image", {
      prompt,
      ...options,
    });

    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle(
  "edit-image",
  async (event, { sourceImage, editPrompt, editType }) => {
    try {
      const result = await client.callTool("edit-image", {
        source_image: sourceImage,
        edit_prompt: editPrompt,
        edit_type: editType,
      });

      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
);

app.whenReady().then(createWindow);
```

### Tauri Application

```typescript
// src-tauri/src/main.rs
use tauri::command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
struct GenerateImageRequest {
    prompt: String,
    quality: Option<String>,
    aspect_ratio: Option<String>,
}

#[derive(Debug, Serialize)]
struct GenerateImageResponse {
    success: bool,
    image_url: Option<String>,
    error: Option<String>,
}

#[command]
async fn generate_image(request: GenerateImageRequest) -> GenerateImageResponse {
    // Implementation using MCP client
    // This would typically call out to the MCP server
    GenerateImageResponse {
        success: true,
        image_url: Some("https://example.com/generated-image.jpg".to_string()),
        error: None,
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![generate_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Monitoring and Observability

### Prometheus Metrics

```typescript
import { register, Counter, Histogram, Gauge } from "prom-client";

// Define metrics
const imageGenerationRequests = new Counter({
  name: "image_generation_requests_total",
  help: "Total number of image generation requests",
  labelNames: ["status", "quality", "aspect_ratio"],
});

const imageGenerationDuration = new Histogram({
  name: "image_generation_duration_seconds",
  help: "Duration of image generation requests",
  labelNames: ["quality", "aspect_ratio"],
});

const activeGenerations = new Gauge({
  name: "active_image_generations",
  help: "Number of currently active image generations",
});

class MonitoredImageGenerator {
  private client: MCPClient;

  constructor() {
    this.client = new MCPClient("@napolab/gpt-image-1-mcp");
  }

  async generateImage(prompt: string, options: any = {}) {
    const startTime = Date.now();
    activeGenerations.inc();

    try {
      const result = await this.client.callTool("generate-image", {
        prompt,
        ...options,
      });

      // Record success metrics
      imageGenerationRequests.inc({
        status: "success",
        quality: options.quality || "standard",
        aspect_ratio: options.aspect_ratio || "square",
      });

      const duration = (Date.now() - startTime) / 1000;
      imageGenerationDuration.observe(
        {
          quality: options.quality || "standard",
          aspect_ratio: options.aspect_ratio || "square",
        },
        duration,
      );

      return result.data;
    } catch (error) {
      // Record error metrics
      imageGenerationRequests.inc({
        status: "error",
        quality: options.quality || "standard",
        aspect_ratio: options.aspect_ratio || "square",
      });

      throw error;
    } finally {
      activeGenerations.dec();
    }
  }
}
```

### Health Check Endpoint

```typescript
import express from "express";
import { register } from "prom-client";

const app = express();
const imageGenerator = new MonitoredImageGenerator();

app.get("/health", async (req, res) => {
  try {
    // Test image generation
    await imageGenerator.generateImage("test", {
      quality: "standard",
      aspect_ratio: "square",
    });

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/metrics", (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(register.metrics());
});

app.listen(3000, () => {
  console.log("Health check server running on port 3000");
});
```

## Best Practices

### Architecture Guidelines

1. **Microservices**: Separate image generation from core application logic
2. **Caching**: Cache generated images and translations
3. **Queue Management**: Use message queues for high-volume processing
4. **Rate Limiting**: Implement client-side rate limiting
5. **Error Handling**: Comprehensive error handling and retry logic
6. **Monitoring**: Track performance and usage metrics
7. **Security**: Secure API keys and validate inputs

### Performance Optimization

```typescript
class OptimizedImageService {
  private cache: Map<string, any> = new Map();
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  async generateImageOptimized(prompt: string, options: any = {}) {
    // Check cache first
    const cacheKey = `${prompt}:${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Add to queue
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await this.client.callTool("generate-image", {
            prompt,
            ...options,
          });

          this.cache.set(cacheKey, result.data);
          resolve(result.data);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, 3); // Process 3 at a time
      await Promise.all(batch.map((fn) => fn()));

      // Rate limiting
      if (this.queue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    this.processing = false;
  }
}
```

## Next Steps

- [Advanced Scenarios](/examples/advanced-scenarios.md) - Complex workflow examples
- [Basic Usage](/examples/basic-usage.md) - Getting started examples
- [API Reference](/api/tools.md) - Complete API documentation
- [Environment Variables](/guide/environment-variables.md) - Configuration options
