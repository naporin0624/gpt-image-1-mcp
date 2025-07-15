# Error Handling

Comprehensive error handling strategies and best practices for GPT Image 1 MCP, including error codes, retry logic, and recovery mechanisms.

## Overview

GPT Image 1 MCP provides robust error handling with detailed error information, automatic recovery mechanisms, and comprehensive logging. This guide covers:

- **Error Types**: Understanding different error categories
- **Error Codes**: Complete reference of error codes and meanings
- **Retry Logic**: Implementing intelligent retry strategies
- **Recovery Mechanisms**: Handling failures gracefully
- **Monitoring**: Tracking and logging errors

## Error Response Format

All errors follow a consistent format across all tools:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": {
      "additional": "context-specific information",
      "timestamp": "2024-01-15T10:30:00Z",
      "request_id": "req_123456789"
    }
  }
}
```

## Error Categories

### Authentication Errors

#### API_KEY_INVALID

- **Description**: OpenAI API key is invalid or expired
- **HTTP Status**: 401
- **Retry**: No (fix API key)

```json
{
  "success": false,
  "error": {
    "code": "API_KEY_INVALID",
    "message": "Invalid OpenAI API key",
    "details": {
      "key_format": "sk-...",
      "suggestion": "Check your OpenAI API key format and permissions"
    }
  }
}
```

#### API_KEY_MISSING

- **Description**: No API key provided
- **HTTP Status**: 401
- **Retry**: No (provide API key)

```json
{
  "success": false,
  "error": {
    "code": "API_KEY_MISSING",
    "message": "OpenAI API key is required",
    "details": {
      "env_var": "OPENAI_API_KEY",
      "suggestion": "Set the OPENAI_API_KEY environment variable"
    }
  }
}
```

### Rate Limiting Errors

#### RATE_LIMIT_EXCEEDED

- **Description**: API rate limit exceeded
- **HTTP Status**: 429
- **Retry**: Yes (with exponential backoff)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "limit": "50 requests per minute",
      "reset_time": "2024-01-15T10:31:00Z",
      "retry_after": 60
    }
  }
}
```

#### QUOTA_EXCEEDED

- **Description**: API quota/credits exceeded
- **HTTP Status**: 429
- **Retry**: No (upgrade plan or add credits)

```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "API quota exceeded",
    "details": {
      "current_usage": "100%",
      "billing_period": "monthly",
      "suggestion": "Upgrade your OpenAI plan or add credits"
    }
  }
}
```

### Validation Errors

#### VALIDATION_ERROR

- **Description**: Input validation failed (e.g., non-English text detected)
- **HTTP Status**: 400
- **Retry**: No (fix input)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Only English text is supported for optimal gpt-image-1 performance",
    "details": {
      "field": "prompt",
      "detected_language": "japanese",
      "suggestion": "Please translate your prompt to English using your LLM client first",
      "example": "Use your LLM: 'Translate to English: 美しい桜の花'"
    }
  }
}
```

#### INVALID_PARAMS

- **Description**: Invalid parameters provided
- **HTTP Status**: 400
- **Retry**: No (fix parameters)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Invalid parameters provided",
    "details": {
      "invalid_fields": ["aspect_ratio", "quality"],
      "aspect_ratio": "Must be one of: square, landscape, portrait",
      "quality": "Must be one of: standard, hd"
    }
  }
}
```

#### PROMPT_TOO_LONG

- **Description**: Prompt exceeds maximum length
- **HTTP Status**: 400
- **Retry**: No (shorten prompt)

```json
{
  "success": false,
  "error": {
    "code": "PROMPT_TOO_LONG",
    "message": "Prompt exceeds maximum length",
    "details": {
      "current_length": 1500,
      "max_length": 1000,
      "suggestion": "Reduce prompt length or split into multiple requests"
    }
  }
}
```

### Content Policy Errors

#### CONTENT_POLICY_VIOLATION

- **Description**: Content violates OpenAI's usage policies
- **HTTP Status**: 400
- **Retry**: No (modify content)

```json
{
  "success": false,
  "error": {
    "code": "CONTENT_POLICY_VIOLATION",
    "message": "Content violates usage policies",
    "details": {
      "violation_type": "inappropriate_content",
      "flagged_content": "specific problematic text",
      "suggestion": "Revise the prompt to comply with usage policies"
    }
  }
}
```

### Network and Service Errors

#### SERVICE_UNAVAILABLE

- **Description**: OpenAI service is temporarily unavailable
- **HTTP Status**: 503
- **Retry**: Yes (with backoff)

```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "OpenAI service is temporarily unavailable",
    "details": {
      "service": "OpenAI gpt-image-1",
      "retry_after": 300,
      "suggestion": "Try again in a few minutes"
    }
  }
}
```

#### TIMEOUT

- **Description**: Request timed out
- **HTTP Status**: 408
- **Retry**: Yes (with increased timeout)

```json
{
  "success": false,
  "error": {
    "code": "TIMEOUT",
    "message": "Request timed out",
    "details": {
      "timeout_duration": 60,
      "suggestion": "Try again or increase timeout setting"
    }
  }
}
```

### Tool-Specific Errors

#### IMAGE_GENERATION_FAILED

- **Description**: Image generation failed
- **HTTP Status**: 500
- **Retry**: Yes (limited retries)

```json
{
  "success": false,
  "error": {
    "code": "IMAGE_GENERATION_FAILED",
    "message": "Failed to generate image",
    "details": {
      "prompt": "user's prompt",
      "error_type": "generation_error",
      "suggestion": "Try simplifying the prompt or adjusting parameters"
    }
  }
}
```

#### INVALID_IMAGE_URL

- **Description**: Invalid or inaccessible image URL
- **HTTP Status**: 400
- **Retry**: No (fix URL)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_IMAGE_URL",
    "message": "Invalid or inaccessible image URL",
    "details": {
      "url": "https://example.com/image.jpg",
      "status_code": 404,
      "suggestion": "Ensure the URL is publicly accessible"
    }
  }
}
```

## Retry Strategies

### Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      if (shouldRetry(error)) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  throw new Error("Max retries exceeded");
}

function shouldRetry(error: any): boolean {
  const retryableCodes = [
    "RATE_LIMIT_EXCEEDED",
    "SERVICE_UNAVAILABLE",
    "TIMEOUT",
    "NETWORK_ERROR",
  ];

  return retryableCodes.includes(error.code);
}
```

### Rate Limit Handling

```typescript
async function handleRateLimit(error: any) {
  if (error.code === "RATE_LIMIT_EXCEEDED") {
    const retryAfter = error.details.retry_after || 60;
    console.log(`Rate limited. Waiting ${retryAfter} seconds...`);

    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return true; // Indicate retry is possible
  }

  return false;
}
```

### Smart Retry Logic

```typescript
async function smartRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    retryCondition?: (error: any) => boolean;
  } = {},
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    retryCondition = shouldRetry,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !retryCondition(error)) {
        throw error;
      }

      // Handle rate limiting specially
      if (error.code === "RATE_LIMIT_EXCEEDED") {
        const retryAfter = error.details.retry_after || 60;
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      // Exponential backoff for other retryable errors
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

## Error Handling Patterns

### Graceful Degradation

```typescript
async function generateImageWithFallback(prompt: string) {
  try {
    // Try high quality first
    return await client.callTool("generate-image", {
      prompt,
      quality: "hd",
      style: "vivid",
    });
  } catch (error) {
    if (error.code === "RATE_LIMIT_EXCEEDED") {
      // Fallback to standard quality
      console.log("HD rate limited, falling back to standard quality");
      return await client.callTool("generate-image", {
        prompt,
        quality: "standard",
        style: "natural",
      });
    }
    throw error;
  }
}
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = "open";
    }
  }
}
```

### Comprehensive Error Handler

```typescript
class ErrorHandler {
  private static logError(error: any, context: string) {
    console.error(`[${context}] Error:`, {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
    });
  }

  static async handle<T>(
    operation: () => Promise<T>,
    context: string,
    options: {
      retry?: boolean;
      fallback?: () => Promise<T>;
      notify?: (error: any) => void;
    } = {},
  ): Promise<T> {
    try {
      if (options.retry) {
        return await smartRetry(operation);
      } else {
        return await operation();
      }
    } catch (error) {
      this.logError(error, context);

      if (options.notify) {
        options.notify(error);
      }

      if (options.fallback) {
        console.log(`[${context}] Attempting fallback...`);
        try {
          return await options.fallback();
        } catch (fallbackError) {
          this.logError(fallbackError, `${context}-fallback`);
          throw fallbackError;
        }
      }

      throw error;
    }
  }
}
```

## Usage Examples

### Basic Error Handling

```typescript
async function generateImage(prompt: string) {
  try {
    const result = await client.callTool("generate-image", {
      prompt,
      quality: "hd",
    });

    return result.data;
  } catch (error) {
    console.error("Image generation failed:", error.message);

    switch (error.code) {
      case "VALIDATION_ERROR":
        throw new Error(
          "Please translate your prompt to English using your LLM first.",
        );
      case "RATE_LIMIT_EXCEEDED":
        throw new Error("Rate limit exceeded. Please try again later.");
      case "CONTENT_POLICY_VIOLATION":
        throw new Error(
          "Content violates policies. Please revise your prompt.",
        );
      case "QUOTA_EXCEEDED":
        throw new Error("API quota exceeded. Please upgrade your plan.");
      default:
        throw new Error("Image generation failed. Please try again.");
    }
  }
}
```

### Advanced Error Handling

```typescript
async function robustImageGeneration(prompt: string) {
  return await ErrorHandler.handle(
    () => client.callTool("generate-image", { prompt, quality: "hd" }),
    "image-generation",
    {
      retry: true,
      fallback: () =>
        client.callTool("generate-image", {
          prompt,
          quality: "standard",
        }),
      notify: (error) => {
        if (error.code === "QUOTA_EXCEEDED") {
          // Send notification to admin
          console.log("ALERT: API quota exceeded");
        }
      },
    },
  );
}
```

### Batch Processing with Error Handling

```typescript
async function processBatch(prompts: string[]) {
  const results = [];
  const errors = [];

  for (const [index, prompt] of prompts.entries()) {
    try {
      const result = await smartRetry(() =>
        client.callTool("generate-image", { prompt }),
      );

      results.push({
        index,
        prompt,
        success: true,
        data: result.data,
      });
    } catch (error) {
      errors.push({
        index,
        prompt,
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }
  }

  return { results, errors };
}
```

## Monitoring and Logging

### Error Metrics

```typescript
class ErrorMetrics {
  private static metrics = new Map<string, number>();

  static increment(errorCode: string) {
    const current = this.metrics.get(errorCode) || 0;
    this.metrics.set(errorCode, current + 1);
  }

  static getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  static reset() {
    this.metrics.clear();
  }
}

// Usage
try {
  await client.callTool("generate-image", { prompt });
} catch (error) {
  ErrorMetrics.increment(error.code);
  throw error;
}
```

### Health Monitoring

```typescript
async function healthCheck() {
  const tests = [
    { name: "API Key", test: () => testApiKey() },
    { name: "Image Generation", test: () => testImageGeneration() },
    { name: "Image Editing", test: () => testImageEditing() },
  ];

  const results = await Promise.allSettled(
    tests.map(async ({ name, test }) => {
      try {
        await test();
        return { name, status: "healthy" };
      } catch (error) {
        return { name, status: "unhealthy", error: error.message };
      }
    }),
  );

  return results.map((result) =>
    result.status === "fulfilled" ? result.value : result.reason,
  );
}
```

## Best Practices

### Error Prevention

1. **Validate Input**: Check parameters before API calls
2. **Set Timeouts**: Configure appropriate timeouts
3. **Rate Limiting**: Implement client-side rate limiting
4. **Content Filtering**: Pre-filter content for policy violations

### Error Recovery

1. **Retry Logic**: Implement intelligent retry mechanisms
2. **Fallbacks**: Provide alternative approaches
3. **Graceful Degradation**: Reduce quality/features when needed
4. **Circuit Breakers**: Prevent cascading failures

### Error Reporting

1. **Structured Logging**: Use consistent log formats
2. **Error Tracking**: Monitor error patterns
3. **Alerting**: Set up alerts for critical errors
4. **User Feedback**: Provide clear error messages to users

## Configuration

### Environment Variables

```bash
# Error handling configuration
ERROR_RETRY_ATTEMPTS=3
ERROR_RETRY_DELAY=1000
ERROR_CIRCUIT_BREAKER_THRESHOLD=5
ERROR_CIRCUIT_BREAKER_TIMEOUT=60000
ERROR_LOG_LEVEL=error
```

### MCP Configuration

```json
{
  "mcpServers": {
    "gpt-image-1-mcp": {
      "env": {
        "ERROR_RETRY_ATTEMPTS": "3",
        "ERROR_RETRY_DELAY": "1000",
        "ERROR_LOG_LEVEL": "error"
      }
    }
  }
}
```

## Next Steps

- [Rate Limiting](/api/rate-limiting.md) - Detailed rate limiting strategies
- [API Overview](/api/tools.md) - Complete API reference
- [Environment Variables](/guide/environment-variables.md) - Configuration options
- [Examples](/examples/basic-usage.md) - Practical implementation examples
