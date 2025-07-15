# Rate Limiting

Comprehensive guide to rate limiting strategies, quotas, and optimization techniques for GPT Image 1 MCP to ensure efficient API usage and prevent rate limit errors.

## Overview

Rate limiting controls the frequency of API requests to prevent overwhelming the OpenAI services and ensure fair usage. This guide covers:

- **Rate Limits**: Understanding OpenAI's rate limits
- **Client-Side Limiting**: Implementing proactive rate limiting
- **Optimization**: Strategies to maximize efficiency
- **Monitoring**: Tracking usage and patterns
- **Recovery**: Handling rate limit errors gracefully

## OpenAI Rate Limits

### Image Generation (OpenAI gpt-image-1)

| Tier   | Requests per Minute (RPM) | Images per Hour |
| ------ | ------------------------- | --------------- |
| Free   | 5                         | 5               |
| Tier 1 | 20                        | 100             |
| Tier 2 | 50                        | 500             |
| Tier 3 | 200                       | 2000            |
| Tier 4 | 500                       | 5000            |

### Image Editing

Rate limits for image editing operations follow the same structure as image generation, as they use the same underlying API endpoints.

## Rate Limiting Implementation

### Basic Rate Limiter

```typescript
class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number,
  ) {}

  async throttle(): Promise<void> {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);

      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      return this.throttle();
    }

    this.requests.push(now);
  }
}
```

### Token Bucket Algorithm

```typescript
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async consume(tokens: number = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    // Wait for enough tokens
    const waitTime = ((tokens - this.tokens) / this.refillRate) * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitTime));

    return this.consume(tokens);
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}
```

### Adaptive Rate Limiter

```typescript
class AdaptiveRateLimiter {
  private currentRate: number;
  private lastSuccess: number = Date.now();
  private consecutiveFailures: number = 0;

  constructor(
    private baseRate: number,
    private maxRate: number,
    private minRate: number = 1,
  ) {
    this.currentRate = baseRate;
  }

  async throttle(): Promise<void> {
    const delay = 1000 / this.currentRate;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  onSuccess(): void {
    this.consecutiveFailures = 0;
    this.lastSuccess = Date.now();

    // Gradually increase rate if we haven't hit limits
    if (this.currentRate < this.maxRate) {
      this.currentRate = Math.min(this.maxRate, this.currentRate * 1.1);
    }
  }

  onRateLimit(): void {
    this.consecutiveFailures++;

    // Reduce rate more aggressively with consecutive failures
    const reductionFactor = Math.pow(0.5, this.consecutiveFailures);
    this.currentRate = Math.max(
      this.minRate,
      this.currentRate * reductionFactor,
    );
  }
}
```

## Usage Optimization

### Request Batching

```typescript
class RequestBatcher {
  private queue: Array<{
    request: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  private processing = false;

  constructor(
    private batchSize: number = 5,
    private batchDelay: number = 100,
  ) {}

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });

      if (!this.processing) {
        this.processBatch();
      }
    });
  }

  private async processBatch(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);

      const results = await Promise.allSettled(
        batch.map(({ request }) => request()),
      );

      results.forEach((result, index) => {
        const { resolve, reject } = batch[index];

        if (result.status === "fulfilled") {
          resolve(result.value);
        } else {
          reject(result.reason);
        }
      });

      if (this.queue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.batchDelay));
      }
    }

    this.processing = false;
  }
}
```

### Priority Queue

```typescript
interface PriorityRequest {
  priority: number;
  request: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class PriorityRateLimiter {
  private queue: PriorityRequest[] = [];
  private processing = false;

  constructor(private rateLimiter: RateLimiter) {}

  async add<T>(request: () => Promise<T>, priority: number = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ priority, request, resolve, reject });
      this.queue.sort((a, b) => b.priority - a.priority);

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const { request, resolve, reject } = this.queue.shift()!;

      try {
        await this.rateLimiter.throttle();
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
  }
}
```

## Configuration

### Environment Variables

```bash
# Rate limiting settings
RATE_LIMIT_REQUESTS_PER_MINUTE=50
RATE_LIMIT_IMAGES_PER_HOUR=100
RATE_LIMIT_ANALYSIS_PER_MINUTE=200

# Adaptive rate limiting
RATE_LIMIT_ADAPTIVE_ENABLED=true
RATE_LIMIT_MIN_RATE=1
RATE_LIMIT_MAX_RATE=100
RATE_LIMIT_BASE_RATE=10

# Request batching
BATCH_SIZE=5
BATCH_DELAY_MS=100
```

### MCP Configuration

```json
{
  "mcpServers": {
    "gpt-image-1-mcp": {
      "env": {
        "RATE_LIMIT_REQUESTS_PER_MINUTE": "50",
        "RATE_LIMIT_IMAGES_PER_HOUR": "100",
        "RATE_LIMIT_ADAPTIVE_ENABLED": "true"
      }
    }
  }
}
```

## Rate Limit Monitoring

### Usage Tracker

```typescript
class UsageTracker {
  private usage = new Map<string, number[]>();

  track(endpoint: string): void {
    const now = Date.now();
    const key = `${endpoint}:${Math.floor(now / 60000)}`; // Per minute

    if (!this.usage.has(key)) {
      this.usage.set(key, []);
    }

    this.usage.get(key)!.push(now);

    // Cleanup old entries
    this.cleanup();
  }

  getUsage(endpoint: string, minutes: number = 1): number {
    const now = Date.now();
    const cutoff = now - minutes * 60000;

    return Array.from(this.usage.entries())
      .filter(([key]) => key.startsWith(endpoint))
      .reduce((total, [, timestamps]) => {
        return total + timestamps.filter((ts) => ts > cutoff).length;
      }, 0);
  }

  private cleanup(): void {
    const cutoff = Date.now() - 60 * 60000; // 1 hour

    for (const [key, timestamps] of this.usage.entries()) {
      const filtered = timestamps.filter((ts) => ts > cutoff);

      if (filtered.length === 0) {
        this.usage.delete(key);
      } else {
        this.usage.set(key, filtered);
      }
    }
  }
}
```

### Rate Limit Headers

```typescript
class RateLimitHeaders {
  static parse(headers: Headers): RateLimitInfo {
    return {
      limit: parseInt(headers.get("X-RateLimit-Limit") || "0"),
      remaining: parseInt(headers.get("X-RateLimit-Remaining") || "0"),
      reset: parseInt(headers.get("X-RateLimit-Reset") || "0"),
      retryAfter: parseInt(headers.get("Retry-After") || "0"),
    };
  }

  static shouldBackoff(info: RateLimitInfo): boolean {
    return info.remaining <= 2 || info.retryAfter > 0;
  }

  static calculateBackoff(info: RateLimitInfo): number {
    if (info.retryAfter > 0) {
      return info.retryAfter * 1000;
    }

    const resetTime = info.reset * 1000;
    const now = Date.now();
    const timeUntilReset = resetTime - now;

    return Math.max(0, timeUntilReset / info.remaining);
  }
}
```

## Practical Examples

### Image Generation with Rate Limiting

```typescript
class RateLimitedImageGenerator {
  private rateLimiter: RateLimiter;
  private usageTracker: UsageTracker;

  constructor() {
    this.rateLimiter = new RateLimiter(50, 60000); // 50 requests per minute
    this.usageTracker = new UsageTracker();
  }

  async generateImage(prompt: string, options: any = {}): Promise<any> {
    await this.rateLimiter.throttle();

    try {
      const result = await client.callTool("generate-image", {
        prompt,
        ...options,
      });

      this.usageTracker.track("generate-image");
      return result;
    } catch (error) {
      if (error.code === "RATE_LIMIT_EXCEEDED") {
        // Handle rate limit error
        console.log("Rate limit exceeded, backing off...");
        await new Promise((resolve) => setTimeout(resolve, 60000));
        return this.generateImage(prompt, options);
      }
      throw error;
    }
  }
}
```

### Batch Processing with Rate Limiting

```typescript
async function processBatchWithRateLimit(
  prompts: string[],
  options: {
    maxConcurrent?: number;
    delayBetweenBatches?: number;
  } = {},
): Promise<any[]> {
  const { maxConcurrent = 5, delayBetweenBatches = 1000 } = options;

  const results = [];
  const rateLimiter = new RateLimiter(50, 60000);

  for (let i = 0; i < prompts.length; i += maxConcurrent) {
    const batch = prompts.slice(i, i + maxConcurrent);

    const batchPromises = batch.map(async (prompt) => {
      await rateLimiter.throttle();

      try {
        return await client.callTool("generate-image", { prompt });
      } catch (error) {
        if (error.code === "RATE_LIMIT_EXCEEDED") {
          // Retry with exponential backoff
          await new Promise((resolve) => setTimeout(resolve, 60000));
          return await client.callTool("generate-image", { prompt });
        }
        throw error;
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);

    // Delay between batches
    if (i + maxConcurrent < prompts.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}
```

### Adaptive Rate Limiting

```typescript
class AdaptiveGenerator {
  private adaptiveRateLimiter: AdaptiveRateLimiter;

  constructor() {
    this.adaptiveRateLimiter = new AdaptiveRateLimiter(
      10, // base rate
      50, // max rate
      1, // min rate
    );
  }

  async generateWithAdaptiveRateLimit(prompt: string): Promise<any> {
    await this.adaptiveRateLimiter.throttle();

    try {
      const result = await client.callTool("generate-image", { prompt });
      this.adaptiveRateLimiter.onSuccess();
      return result;
    } catch (error) {
      if (error.code === "RATE_LIMIT_EXCEEDED") {
        this.adaptiveRateLimiter.onRateLimit();

        // Retry with new rate
        return this.generateWithAdaptiveRateLimit(prompt);
      }
      throw error;
    }
  }
}
```

## Best Practices

### Design Patterns

1. **Client-Side Rate Limiting**: Implement proactive rate limiting
2. **Request Queuing**: Queue requests during high traffic
3. **Exponential Backoff**: Increase delays after rate limit hits
4. **Circuit Breakers**: Prevent cascading failures

### Performance Optimization

```typescript
class OptimizedRateLimiter {
  private limiter: RateLimiter;
  private batcher: RequestBatcher;
  private cache: Map<string, any>;

  constructor() {
    this.limiter = new RateLimiter(50, 60000);
    this.batcher = new RequestBatcher(5, 100);
    this.cache = new Map();
  }

  async generateImage(prompt: string): Promise<any> {
    // Check cache first
    const cacheKey = `image:${prompt}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Use batcher to optimize API calls
    const result = await this.batcher.add(async () => {
      await this.limiter.throttle();
      return await client.callTool("generate-image", { prompt });
    });

    // Cache result
    this.cache.set(cacheKey, result);
    return result;
  }
}
```

### Error Recovery

```typescript
async function robustGeneration(prompt: string): Promise<any> {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      return await client.callTool("generate-image", { prompt });
    } catch (error) {
      if (error.code === "RATE_LIMIT_EXCEEDED") {
        retryCount++;

        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Rate limited, waiting ${delay}ms (attempt ${retryCount})`);

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }

  throw new Error("Max retries exceeded");
}
```

## Monitoring and Alerts

### Usage Dashboard

```typescript
class UsageDashboard {
  private tracker: UsageTracker;

  constructor() {
    this.tracker = new UsageTracker();
  }

  getStats(): UsageStats {
    return {
      currentRPM: this.tracker.getUsage("generate-image", 1),
      currentHourly: this.tracker.getUsage("generate-image", 60),
      utilizationPercent: this.calculateUtilization(),
      timeUntilReset: this.getTimeUntilReset(),
    };
  }

  private calculateUtilization(): number {
    const currentRPM = this.tracker.getUsage("generate-image", 1);
    const limit = 50; // From environment
    return (currentRPM / limit) * 100;
  }

  private getTimeUntilReset(): number {
    // Implementation depends on your rate limiting strategy
    return 60 - ((Date.now() / 1000) % 60);
  }
}
```

### Alert System

```typescript
class RateLimitAlerts {
  private thresholds = {
    warning: 0.8, // 80% utilization
    critical: 0.95, // 95% utilization
  };

  checkAndAlert(stats: UsageStats): void {
    const utilization = stats.utilizationPercent / 100;

    if (utilization >= this.thresholds.critical) {
      this.sendAlert("CRITICAL", "Rate limit near exhaustion", stats);
    } else if (utilization >= this.thresholds.warning) {
      this.sendAlert("WARNING", "High rate limit usage", stats);
    }
  }

  private sendAlert(level: string, message: string, stats: UsageStats): void {
    console.log(`[${level}] ${message}`, stats);
    // Implement your alerting mechanism here
  }
}
```

## Troubleshooting

### Common Issues

1. **Rate Limit Exceeded**: Implement exponential backoff
2. **Quota Exhausted**: Upgrade plan or optimize usage
3. **Request Queuing**: Implement proper queue management
4. **Memory Leaks**: Clean up old tracking data

### Debug Tools

```typescript
class RateLimitDebugger {
  static logRateLimit(error: any): void {
    console.log("Rate Limit Debug:", {
      code: error.code,
      details: error.details,
      retryAfter: error.details?.retry_after,
      resetTime: error.details?.reset_time,
      timestamp: new Date().toISOString(),
    });
  }

  static analyzeUsagePattern(tracker: UsageTracker): void {
    const stats = {
      last1Min: tracker.getUsage("generate-image", 1),
      last5Min: tracker.getUsage("generate-image", 5),
      last15Min: tracker.getUsage("generate-image", 15),
      last60Min: tracker.getUsage("generate-image", 60),
    };

    console.log("Usage Pattern Analysis:", stats);
  }
}
```

## Next Steps

- [Error Handling](/api/error-handling.md) - Comprehensive error management
- [API Overview](/api/tools.md) - Complete API reference
- [Environment Variables](/guide/environment-variables.md) - Configuration options
- [Examples](/examples/basic-usage.md) - Practical implementation examples
