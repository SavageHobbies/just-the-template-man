// Batch processing utilities for concurrent operations

export interface BatchOptions<T, R> {
  batchSize: number;
  concurrency: number;
  delayBetweenBatches?: number;
  retryAttempts?: number;
  retryDelay?: number;
  onProgress?: (processed: number, total: number, results: R[]) => void;
  onError?: (error: Error, item: T, attempt: number) => void;
}

export interface BatchResult<T, R> {
  successful: Array<{ item: T; result: R }>;
  failed: Array<{ item: T; error: Error }>;
  totalProcessed: number;
  totalTime: number;
  averageTime: number;
}

export class BatchProcessor<T, R> {
  /**
   * Process items in batches with concurrency control
   */
  async processBatch(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: BatchOptions<T, R>
  ): Promise<BatchResult<T, R>> {
    const startTime = Date.now();
    const successful: Array<{ item: T; result: R }> = [];
    const failed: Array<{ item: T; error: Error }> = [];

    // Split items into batches
    const batches = this.createBatches(items, options.batchSize);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      // Process batch with concurrency control
      const batchResults = await this.processConcurrentBatch(
        batch,
        processor,
        options
      );

      successful.push(...batchResults.successful);
      failed.push(...batchResults.failed);

      // Report progress
      if (options.onProgress) {
        options.onProgress(
          successful.length + failed.length,
          items.length,
          successful.map(s => s.result)
        );
      }

      // Delay between batches if specified
      if (options.delayBetweenBatches && batchIndex < batches.length - 1) {
        await this.sleep(options.delayBetweenBatches);
      }
    }

    const totalTime = Date.now() - startTime;
    const averageTime = totalTime / items.length;

    return {
      successful,
      failed,
      totalProcessed: successful.length + failed.length,
      totalTime,
      averageTime
    };
  }

  /**
   * Process a single batch with concurrency control
   */
  private async processConcurrentBatch(
    batch: T[],
    processor: (item: T) => Promise<R>,
    options: BatchOptions<T, R>
  ): Promise<{ successful: Array<{ item: T; result: R }>; failed: Array<{ item: T; error: Error }> }> {
    const successful: Array<{ item: T; result: R }> = [];
    const failed: Array<{ item: T; error: Error }> = [];

    // Create semaphore for concurrency control
    const semaphore = new Semaphore(options.concurrency);

    const promises = batch.map(async (item) => {
      await semaphore.acquire();
      
      try {
        const result = await this.processWithRetry(item, processor, options);
        successful.push({ item, result });
      } catch (error) {
        failed.push({ item, error: error as Error });
      } finally {
        semaphore.release();
      }
    });

    await Promise.all(promises);
    return { successful, failed };
  }

  /**
   * Process single item with retry logic
   */
  private async processWithRetry(
    item: T,
    processor: (item: T) => Promise<R>,
    options: BatchOptions<T, R>
  ): Promise<R> {
    const maxAttempts = options.retryAttempts || 1;
    const retryDelay = options.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await processor(item);
      } catch (error) {
        if (options.onError) {
          options.onError(error as Error, item, attempt);
        }

        if (attempt === maxAttempts) {
          throw error;
        }

        // Wait before retry
        await this.sleep(retryDelay * attempt);
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  /**
   * Split array into batches
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    
    if (this.waitQueue.length > 0) {
      this.permits--;
      const resolve = this.waitQueue.shift()!;
      resolve();
    }
  }
}

/**
 * Utility for parallel processing with different strategies
 */
export class ParallelProcessor {
  /**
   * Process items in parallel with a maximum concurrency limit
   */
  static async parallel<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    maxConcurrency: number = 5
  ): Promise<R[]> {
    const semaphore = new Semaphore(maxConcurrency);
    
    const promises = items.map(async (item) => {
      await semaphore.acquire();
      try {
        return await processor(item);
      } finally {
        semaphore.release();
      }
    });

    return Promise.all(promises);
  }

  /**
   * Process items in parallel but settle all promises (don't fail fast)
   */
  static async parallelSettled<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    maxConcurrency: number = 5
  ): Promise<Array<{ status: 'fulfilled' | 'rejected'; value?: R; reason?: Error }>> {
    const semaphore = new Semaphore(maxConcurrency);
    
    const promises = items.map(async (item) => {
      await semaphore.acquire();
      try {
        const value = await processor(item);
        return { status: 'fulfilled' as const, value };
      } catch (error) {
        return { status: 'rejected' as const, reason: error as Error };
      } finally {
        semaphore.release();
      }
    });

    return Promise.all(promises);
  }

  /**
   * Process items with a sliding window approach
   */
  static async slidingWindow<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    windowSize: number = 5,
    delay: number = 100
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += windowSize) {
      const window = items.slice(i, i + windowSize);
      const windowResults = await Promise.all(
        window.map(item => processor(item))
      );
      
      results.push(...windowResults);
      
      // Add delay between windows
      if (i + windowSize < items.length && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }
}

// Pre-configured batch processor instances
export const imageBatchProcessor = new BatchProcessor<string, boolean>();
export const researchBatchProcessor = new BatchProcessor<any, any>();