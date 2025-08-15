// Rate limiting and request throttling utilities

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  delayMs?: number; // Delay between requests
}

export interface ThrottleOptions {
  maxConcurrent: number;
  minDelay: number; // Minimum delay between requests in ms
}

export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly delayMs: number;

  constructor(options: RateLimitOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
    this.delayMs = options.delayMs || 0;
  }

  /**
   * Check if request is allowed under rate limit
   */
  async isAllowed(): Promise<boolean> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    return this.requests.length < this.maxRequests;
  }

  /**
   * Wait until request is allowed, then record it
   */
  async waitForSlot(): Promise<void> {
    while (!(await this.isAllowed())) {
      await this.sleep(100); // Check every 100ms
    }
    
    this.requests.push(Date.now());
    
    if (this.delayMs > 0) {
      await this.sleep(this.delayMs);
    }
  }

  /**
   * Get time until next slot is available
   */
  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const resetTime = oldestRequest + this.windowMs;
    return Math.max(0, resetTime - Date.now());
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class RequestThrottler {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private lastRequestTime = 0;
  private readonly maxConcurrent: number;
  private readonly minDelay: number;

  constructor(options: ThrottleOptions) {
    this.maxConcurrent = options.maxConcurrent;
    this.minDelay = options.minDelay;
  }

  /**
   * Add a request to the throttled queue
   */
  async throttle<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const request = this.queue.shift();
    if (!request) return;

    this.running++;

    try {
      // Ensure minimum delay between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minDelay) {
        await this.sleep(this.minDelay - timeSinceLastRequest);
      }

      this.lastRequestTime = Date.now();
      await request();
    } finally {
      this.running--;
      // Process next request in queue
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Get current queue status
   */
  getStatus(): { running: number; queued: number; maxConcurrent: number } {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Pre-configured rate limiters for different services
export const ebayRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 10 requests per minute
  delayMs: 1000 // 1 second delay between requests
});

export const imageValidationThrottler = new RequestThrottler({
  maxConcurrent: 5,
  minDelay: 200 // 200ms between image validation requests
});

export const researchThrottler = new RequestThrottler({
  maxConcurrent: 3,
  minDelay: 500 // 500ms between research requests
});

/**
 * Decorator for adding rate limiting to methods
 */
export function rateLimit(rateLimiter: RateLimiter) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      await rateLimiter.waitForSlot();
      return method.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Decorator for adding throttling to methods
 */
export function throttle(throttler: RequestThrottler) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return throttler.throttle(() => method.apply(this, args));
    };

    return descriptor;
  };
}