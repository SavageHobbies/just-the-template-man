/**
 * Tests for retry utilities
 */

import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import {
  RetryManager,
  createRetryManager,
  withRetry,
  CircuitBreaker
} from './retry';
import { WebScrapingError, ErrorCode, MarketResearchError } from './errors';

// Mock the delay function
vi.mock('./logger', () => ({
  getLogger: () => ({
    startOperation: vi.fn(),
    completeOperation: vi.fn(),
    failOperation: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}));

describe('RetryManager', () => {
  let retryManager: RetryManager;

  beforeEach(() => {
    retryManager = new RetryManager();
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await retryManager.executeWithRetry(
        'testOperation',
        mockFn,
        { maxAttempts: 3 }
      );

      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const retryableError = new MarketResearchError('Temporary failure', ErrorCode.API_UNAVAILABLE, true);
      const mockFn = vi.fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      const result = await retryManager.executeWithRetry(
        'testOperation',
        mockFn,
        { maxAttempts: 3, baseDelay: 10 }
      );

      expect(result.result).toBe('success');
      expect(result.attempts).toBe(3);
      expect(result.errors).toHaveLength(2);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const nonRetryableError = new WebScrapingError('Invalid URL', ErrorCode.INVALID_URL, false);
      const mockFn = jest.fn().mockRejectedValue(nonRetryableError);

      await expect(
        retryManager.executeWithRetry('testOperation', mockFn, { maxAttempts: 3 })
      ).rejects.toThrow(nonRetryableError);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should exhaust all attempts for retryable errors', async () => {
      const retryableError = new MarketResearchError('Always fails', ErrorCode.API_UNAVAILABLE, true);
      const mockFn = jest.fn().mockRejectedValue(retryableError);

      await expect(
        retryManager.executeWithRetry(
          'testOperation',
          mockFn,
          { maxAttempts: 3, baseDelay: 10 }
        )
      ).rejects.toThrow(retryableError);

      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should use custom retry condition', async () => {
      const customError = new Error('Custom error');
      const mockFn = jest.fn()
        .mockRejectedValueOnce(customError)
        .mockResolvedValue('success');

      const customRetryCondition = (error: unknown) => 
        error instanceof Error && error.message === 'Custom error';

      const result = await retryManager.executeWithRetry(
        'testOperation',
        mockFn,
        { 
          maxAttempts: 3, 
          baseDelay: 10,
          retryCondition: customRetryCondition
        }
      );

      expect(result.result).toBe('success');
      expect(result.attempts).toBe(2);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should call onRetry callback', async () => {
      const retryableError = new MarketResearchError('Temporary failure', ErrorCode.API_UNAVAILABLE, true);
      const mockFn = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      const onRetryCallback = jest.fn();

      await retryManager.executeWithRetry(
        'testOperation',
        mockFn,
        { 
          maxAttempts: 3, 
          baseDelay: 10,
          onRetry: onRetryCallback
        }
      );

      expect(onRetryCallback).toHaveBeenCalledWith(retryableError, 1);
    });

    it('should handle callback errors gracefully', async () => {
      const retryableError = new MarketResearchError('Temporary failure', ErrorCode.API_UNAVAILABLE, true);
      const mockFn = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      const failingCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback failed');
      });

      // Should not throw due to callback failure
      const result = await retryManager.executeWithRetry(
        'testOperation',
        mockFn,
        { 
          maxAttempts: 3, 
          baseDelay: 10,
          onRetry: failingCallback
        }
      );

      expect(result.result).toBe('success');
      expect(failingCallback).toHaveBeenCalled();
    });
  });

  describe('Backoff strategies', () => {
    let mockFn: jest.Mock;
    let retryableError: MarketResearchError;

    beforeEach(() => {
      retryableError = new MarketResearchError('Temporary failure', ErrorCode.API_UNAVAILABLE, true);
      mockFn = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');
    });

    it('should use exponential backoff', async () => {
      const startTime = Date.now();
      
      await retryManager.executeWithRetry(
        'testOperation',
        mockFn,
        { 
          maxAttempts: 3, 
          baseDelay: 100,
          backoffStrategy: 'exponential',
          jitter: false
        }
      );

      const duration = Date.now() - startTime;
      // Should have delays of ~100ms and ~200ms (exponential)
      expect(duration).toBeGreaterThan(250);
    });

    it('should use linear backoff', async () => {
      const startTime = Date.now();
      
      await retryManager.executeWithRetry(
        'testOperation',
        mockFn,
        { 
          maxAttempts: 3, 
          baseDelay: 100,
          backoffStrategy: 'linear',
          jitter: false
        }
      );

      const duration = Date.now() - startTime;
      // Should have delays of ~100ms and ~200ms (linear)
      expect(duration).toBeGreaterThan(250);
    });

    it('should use fixed backoff', async () => {
      const startTime = Date.now();
      
      await retryManager.executeWithRetry(
        'testOperation',
        mockFn,
        { 
          maxAttempts: 3, 
          baseDelay: 100,
          backoffStrategy: 'fixed',
          jitter: false
        }
      );

      const duration = Date.now() - startTime;
      // Should have delays of ~100ms and ~100ms (fixed)
      expect(duration).toBeGreaterThan(150);
      expect(duration).toBeLessThan(350);
    });

    it('should respect maxDelay', async () => {
      await retryManager.executeWithRetry(
        'testOperation',
        mockFn,
        { 
          maxAttempts: 3, 
          baseDelay: 1000,
          maxDelay: 50,
          backoffStrategy: 'exponential',
          jitter: false
        }
      );

      // Should complete quickly due to maxDelay limit
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });
});

describe('createRetryManager', () => {
  it('should create a new RetryManager instance', () => {
    const manager = createRetryManager();
    expect(manager).toBeInstanceOf(RetryManager);
  });
});

describe('withRetry decorator', () => {
  class TestClass {
    @withRetry({ maxAttempts: 3, baseDelay: 10 })
    async testMethod(shouldFail: boolean): Promise<string> {
      if (shouldFail) {
        throw new MarketResearchError('Method failed', ErrorCode.API_UNAVAILABLE, true);
      }
      return 'success';
    }

    @withRetry({ maxAttempts: 2 })
    async nonRetryableMethod(): Promise<string> {
      throw new WebScrapingError('Non-retryable', ErrorCode.INVALID_URL, false);
    }
  }

  let testInstance: TestClass;

  beforeEach(() => {
    testInstance = new TestClass();
  });

  it('should retry decorated methods', async () => {
    const spy = jest.spyOn(testInstance, 'testMethod');
    
    // First call fails, second succeeds
    let callCount = 0;
    spy.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new MarketResearchError('First attempt fails', ErrorCode.API_UNAVAILABLE, true);
      }
      return 'success';
    });

    const result = await testInstance.testMethod(false);
    
    expect(result).toBe('success');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should not retry non-retryable errors', async () => {
    const spy = jest.spyOn(testInstance, 'nonRetryableMethod');

    await expect(testInstance.nonRetryableMethod()).rejects.toThrow('Non-retryable');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(3, 1000, 'TestComponent'); // 3 failures, 1 second recovery
  });

  it('should allow execution when circuit is closed', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');

    const result = await circuitBreaker.execute('testOperation', mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should open circuit after threshold failures', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));

    // Fail 3 times to open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute('testOperation', mockFn)).rejects.toThrow();
    }

    // Circuit should now be open
    const status = circuitBreaker.getStatus();
    expect(status.state).toBe('OPEN');
    expect(status.failures).toBe(3);

    // Next call should be blocked
    await expect(circuitBreaker.execute('testOperation', mockFn)).rejects.toThrow('Circuit breaker is OPEN');
    expect(mockFn).toHaveBeenCalledTimes(3); // Should not have been called again
  });

  it('should transition to half-open after recovery timeout', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute('testOperation', mockFn)).rejects.toThrow();
    }

    // Wait for recovery timeout (simulate by manipulating time)
    const originalNow = Date.now;
    Date.now = jest.fn(() => originalNow() + 2000); // 2 seconds later

    // Should transition to half-open and allow one attempt
    const successFn = jest.fn().mockResolvedValue('success');
    const result = await circuitBreaker.execute('testOperation', successFn);

    expect(result).toBe('success');
    expect(circuitBreaker.getStatus().state).toBe('CLOSED');

    // Restore Date.now
    Date.now = originalNow;
  });

  it('should reset circuit on successful execution in half-open state', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute('testOperation', mockFn)).rejects.toThrow();
    }

    // Simulate recovery timeout
    const originalNow = Date.now;
    Date.now = jest.fn(() => originalNow() + 2000);

    // Successful execution should reset the circuit
    const successFn = jest.fn().mockResolvedValue('success');
    await circuitBreaker.execute('testOperation', successFn);

    const status = circuitBreaker.getStatus();
    expect(status.state).toBe('CLOSED');
    expect(status.failures).toBe(0);

    Date.now = originalNow;
  });

  it('should provide current status', () => {
    const status = circuitBreaker.getStatus();

    expect(status).toHaveProperty('state');
    expect(status).toHaveProperty('failures');
    expect(status).toHaveProperty('lastFailureTime');
    expect(status.state).toBe('CLOSED');
    expect(status.failures).toBe(0);
  });
});