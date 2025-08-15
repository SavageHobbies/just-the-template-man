// Tests for rate limiting utilities

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, RequestThrottler } from './rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      maxRequests: 3,
      windowMs: 1000, // 1 second window
      delayMs: 100
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      expect(await rateLimiter.isAllowed()).toBe(true);
      expect(await rateLimiter.isAllowed()).toBe(true);
      expect(await rateLimiter.isAllowed()).toBe(true);
    });

    it('should block requests exceeding limit', async () => {
      // Use up the limit
      await rateLimiter.waitForSlot();
      await rateLimiter.waitForSlot();
      await rateLimiter.waitForSlot();
      
      // Next request should be blocked
      expect(await rateLimiter.isAllowed()).toBe(false);
    });

    it('should reset after time window', async () => {
      // Use up the limit
      await rateLimiter.waitForSlot();
      await rateLimiter.waitForSlot();
      await rateLimiter.waitForSlot();
      
      expect(await rateLimiter.isAllowed()).toBe(false);
      
      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(await rateLimiter.isAllowed()).toBe(true);
    });

    it('should calculate time until reset correctly', async () => {
      await rateLimiter.waitForSlot();
      
      const timeUntilReset = rateLimiter.getTimeUntilReset();
      expect(timeUntilReset).toBeGreaterThan(0);
      expect(timeUntilReset).toBeLessThanOrEqual(1000);
    });

    it('should return 0 time until reset when no requests made', () => {
      const timeUntilReset = rateLimiter.getTimeUntilReset();
      expect(timeUntilReset).toBe(0);
    });
  });

  describe('waitForSlot', () => {
    it('should wait for available slot when limit exceeded', async () => {
      // Use up all slots first
      await rateLimiter.waitForSlot();
      await rateLimiter.waitForSlot();
      await rateLimiter.waitForSlot();
      
      // Now the next request should wait
      const startTime = Date.now();
      await rateLimiter.waitForSlot();
      const endTime = Date.now();
      
      const elapsed = endTime - startTime;
      
      // Should have waited for at least most of the window duration
      expect(elapsed).toBeGreaterThan(800); // Allow some tolerance
    });

    it('should apply delay between requests', async () => {
      const startTime = Date.now();
      
      await rateLimiter.waitForSlot();
      
      const endTime = Date.now();
      const elapsed = endTime - startTime;
      
      // Should include the delay
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });
});

describe('RequestThrottler', () => {
  let throttler: RequestThrottler;

  beforeEach(() => {
    throttler = new RequestThrottler({
      maxConcurrent: 2,
      minDelay: 100
    });
  });

  describe('Concurrency Control', () => {
    it('should limit concurrent requests', async () => {
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const createRequest = () => throttler.throttle(async () => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        concurrentCount--;
        return 'done';
      });

      // Start 5 requests simultaneously
      const promises = Array(5).fill(0).map(() => createRequest());
      await Promise.all(promises);

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should enforce minimum delay between requests', async () => {
      const timestamps: number[] = [];

      const createRequest = () => throttler.throttle(async () => {
        timestamps.push(Date.now());
        return 'done';
      });

      // Execute requests sequentially through throttler
      await createRequest();
      await createRequest();
      await createRequest();

      // Check delays between requests
      for (let i = 1; i < timestamps.length; i++) {
        const delay = timestamps[i] - timestamps[i - 1];
        expect(delay).toBeGreaterThanOrEqual(90); // Allow some tolerance
      }
    });

    it('should return correct status', async () => {
      const status1 = throttler.getStatus();
      expect(status1.running).toBe(0);
      expect(status1.queued).toBe(0);
      expect(status1.maxConcurrent).toBe(2);

      // Start some requests
      const promise1 = throttler.throttle(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'done1';
      });

      const promise2 = throttler.throttle(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'done2';
      });

      const promise3 = throttler.throttle(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'done3';
      });

      // Give some time for requests to start
      await new Promise(resolve => setTimeout(resolve, 10));

      const status2 = throttler.getStatus();
      expect(status2.running).toBeLessThanOrEqual(2);
      expect(status2.queued).toBeGreaterThanOrEqual(0);

      await Promise.all([promise1, promise2, promise3]);
    });
  });

  describe('Error Handling', () => {
    it('should handle request errors properly', async () => {
      const error = new Error('Test error');

      const request = throttler.throttle(async () => {
        throw error;
      });

      await expect(request).rejects.toThrow('Test error');
    });

    it('should continue processing other requests after error', async () => {
      const results: string[] = [];

      const requests = [
        throttler.throttle(async () => {
          throw new Error('Error 1');
        }),
        throttler.throttle(async () => {
          results.push('Success 1');
          return 'Success 1';
        }),
        throttler.throttle(async () => {
          throw new Error('Error 2');
        }),
        throttler.throttle(async () => {
          results.push('Success 2');
          return 'Success 2';
        })
      ];

      const settled = await Promise.allSettled(requests);

      expect(settled[0].status).toBe('rejected');
      expect(settled[1].status).toBe('fulfilled');
      expect(settled[2].status).toBe('rejected');
      expect(settled[3].status).toBe('fulfilled');

      expect(results).toEqual(['Success 1', 'Success 2']);
    });
  });
});

describe('Decorators', () => {
  it('should apply rate limiting to methods', async () => {
    const rateLimiter = new RateLimiter({
      maxRequests: 2,
      windowMs: 1000
    });

    class TestClass {
      callCount = 0;

      async testMethod() {
        await rateLimiter.waitForSlot();
        this.callCount++;
        return this.callCount;
      }
    }

    const instance = new TestClass();

    // These should work fine
    await instance.testMethod();
    await instance.testMethod();

    expect(instance.callCount).toBe(2);

    // This should be delayed
    const startTime = Date.now();
    await instance.testMethod();
    const endTime = Date.now();

    expect(endTime - startTime).toBeGreaterThan(900);
    expect(instance.callCount).toBe(3);
  });

  it('should apply throttling to methods', async () => {
    const throttler = new RequestThrottler({
      maxConcurrent: 1,
      minDelay: 100
    });

    class TestClass {
      async testMethod(value: string) {
        return throttler.throttle(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return `processed: ${value}`;
        });
      }
    }

    const instance = new TestClass();
    const startTime = Date.now();

    const results = await Promise.all([
      instance.testMethod('a'),
      instance.testMethod('b'),
      instance.testMethod('c')
    ]);

    const endTime = Date.now();
    const elapsed = endTime - startTime;

    expect(results).toEqual([
      'processed: a',
      'processed: b', 
      'processed: c'
    ]);

    // Should take at least 200ms due to delays (100ms between each + processing time)
    expect(elapsed).toBeGreaterThan(200);
  });
});