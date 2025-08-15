/**
 * Retry utility with comprehensive error handling and backoff strategies
 */

import { BaseError, isRetryableError, ErrorCode } from './errors';
import { getLogger, PerformanceMonitor } from './logger';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  jitter: boolean;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  totalDuration: number;
  errors: unknown[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffStrategy: 'exponential',
  jitter: true,
  retryCondition: isRetryableError
};

/**
 * Retry utility class with various backoff strategies
 */
export class RetryManager {
  private logger = getLogger();

  /**
   * Execute a function with retry logic
   */
  async executeWithRetry<T>(
    operation: string,
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    component?: string
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    const errors: unknown[] = [];
    const operationId = `${component || 'UNKNOWN'}:${operation}`;
    
    this.logger.startOperation(`retry-${operation}`, component, {
      maxAttempts: finalConfig.maxAttempts,
      backoffStrategy: finalConfig.backoffStrategy
    });

    const startTime = Date.now();

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        this.logger.debug(
          `Executing attempt ${attempt}/${finalConfig.maxAttempts} for ${operation}`,
          { attempt, maxAttempts: finalConfig.maxAttempts },
          component,
          operation
        );

        const result = await PerformanceMonitor.measure(
          `${operation}-attempt-${attempt}`,
          fn,
          component
        );

        const totalDuration = Date.now() - startTime;
        
        this.logger.completeOperation(
          `retry-${operation}`,
          component,
          { 
            attempts: attempt,
            totalDuration,
            success: true
          },
          totalDuration
        );

        return {
          result,
          attempts: attempt,
          totalDuration,
          errors
        };

      } catch (error) {
        errors.push(error);
        
        this.logger.warn(
          `Attempt ${attempt}/${finalConfig.maxAttempts} failed for ${operation}`,
          { 
            attempt, 
            maxAttempts: finalConfig.maxAttempts,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          component,
          operation
        );

        // Check if we should retry
        const shouldRetry = attempt < finalConfig.maxAttempts && 
                           (finalConfig.retryCondition ? finalConfig.retryCondition(error) : isRetryableError(error));

        if (!shouldRetry) {
          if (attempt < finalConfig.maxAttempts) {
            this.logger.error(
              `Non-retryable error encountered for ${operation}, aborting retries`,
              error instanceof BaseError ? error : undefined,
              { attempt, error: error instanceof Error ? error.message : 'Unknown error' },
              component,
              operation
            );
          }
          break;
        }

        // Call retry callback if provided
        if (finalConfig.onRetry) {
          try {
            finalConfig.onRetry(error, attempt);
          } catch (callbackError) {
            this.logger.warn(
              `Retry callback failed for ${operation}`,
              { callbackError: callbackError instanceof Error ? callbackError.message : 'Unknown error' },
              component,
              operation
            );
          }
        }

        // Calculate delay for next attempt
        if (attempt < finalConfig.maxAttempts) {
          const delay = this.calculateDelay(attempt, finalConfig);
          
          this.logger.debug(
            `Waiting ${delay}ms before retry attempt ${attempt + 1} for ${operation}`,
            { delay, nextAttempt: attempt + 1 },
            component,
            operation
          );

          await this.delay(delay);
        }
      }
    }

    // All attempts failed
    const totalDuration = Date.now() - startTime;
    const lastError = errors[errors.length - 1];
    
    this.logger.failOperation(
      `retry-${operation}`,
      lastError instanceof Error ? lastError : new Error('All retry attempts failed'),
      component,
      {
        attempts: finalConfig.maxAttempts,
        totalDuration,
        allErrors: errors.map(e => e instanceof Error ? e.message : 'Unknown error')
      }
    );

    // Throw the last error or create a comprehensive error
    if (lastError instanceof BaseError) {
      throw lastError;
    } else if (lastError instanceof Error) {
      throw lastError;
    } else {
      throw new Error(`Operation ${operation} failed after ${finalConfig.maxAttempts} attempts`);
    }
  }

  /**
   * Calculate delay based on backoff strategy
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay: number;

    switch (config.backoffStrategy) {
      case 'linear':
        delay = config.baseDelay * attempt;
        break;
      case 'exponential':
        delay = config.baseDelay * Math.pow(2, attempt - 1);
        break;
      case 'fixed':
      default:
        delay = config.baseDelay;
        break;
    }

    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);

    // Apply jitter if enabled
    if (config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(0, Math.round(delay));
  }

  /**
   * Promise-based delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Convenience function to create a retry manager instance
 */
export function createRetryManager(): RetryManager {
  return new RetryManager();
}

/**
 * Decorator for automatic retry functionality
 */
export function withRetry<T extends any[], R>(
  config: Partial<RetryConfig> = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) {
    const originalMethod = descriptor.value!;
    const retryManager = new RetryManager();

    descriptor.value = async function (...args: T): Promise<R> {
      const component = target.constructor.name;
      const operation = propertyKey;

      const result = await retryManager.executeWithRetry(
        operation,
        () => originalMethod.apply(this, args),
        config,
        component
      );

      return result.result;
    };

    return descriptor;
  };
}

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private logger = getLogger();

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000, // 1 minute
    private readonly component?: string
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        this.logger.info(
          `Circuit breaker transitioning to HALF_OPEN for ${operation}`,
          { state: this.state, failures: this.failures },
          this.component,
          operation
        );
      } else {
        const error = new Error(`Circuit breaker is OPEN for ${operation}`);
        this.logger.warn(
          `Circuit breaker blocked execution of ${operation}`,
          { state: this.state, failures: this.failures },
          this.component,
          operation
        );
        throw error;
      }
    }

    try {
      const result = await fn();
      
      if (this.state === 'HALF_OPEN') {
        this.reset();
        this.logger.info(
          `Circuit breaker reset to CLOSED for ${operation}`,
          { state: this.state },
          this.component,
          operation
        );
      }
      
      return result;
    } catch (error) {
      this.recordFailure(operation);
      throw error;
    }
  }

  /**
   * Record a failure and potentially open the circuit
   */
  private recordFailure(operation: string): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.logger.error(
        `Circuit breaker opened for ${operation} after ${this.failures} failures`,
        undefined,
        { state: this.state, failures: this.failures, threshold: this.failureThreshold },
        this.component,
        operation
      );
    }
  }

  /**
   * Reset the circuit breaker
   */
  private reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }

  /**
   * Get current circuit breaker status
   */
  getStatus(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}