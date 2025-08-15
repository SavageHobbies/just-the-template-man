// Tests for batch processing utilities

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BatchProcessor, ParallelProcessor } from './batch-processor';

describe('BatchProcessor', () => {
  let processor: BatchProcessor<number, string>;

  beforeEach(() => {
    processor = new BatchProcessor<number, string>();
  });

  describe('Basic Batch Processing', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5];
      const mockProcessor = vi.fn().mockImplementation(async (item: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return `processed-${item}`;
      });

      const result = await processor.processBatch(items, mockProcessor, {
        batchSize: 2,
        concurrency: 1
      });

      expect(result.successful).toHaveLength(5);
      expect(result.failed).toHaveLength(0);
      expect(result.totalProcessed).toBe(5);
      expect(mockProcessor).toHaveBeenCalledTimes(5);

      // Check results
      const values = result.successful.map(s => s.result);
      expect(values).toEqual(['processed-1', 'processed-2', 'processed-3', 'processed-4', 'processed-5']);
    });

    it('should handle processing errors', async () => {
      const items = [1, 2, 3, 4, 5];
      const mockProcessor = vi.fn().mockImplementation(async (item: number) => {
        if (item === 3) {
          throw new Error(`Error processing ${item}`);
        }
        return `processed-${item}`;
      });

      const result = await processor.processBatch(items, mockProcessor, {
        batchSize: 2,
        concurrency: 1
      });

      expect(result.successful).toHaveLength(4);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].item).toBe(3);
      expect(result.failed[0].error.message).toBe('Error processing 3');
    });

    it('should respect concurrency limits', async () => {
      const items = [1, 2, 3, 4, 5];
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const mockProcessor = vi.fn().mockImplementation(async (item: number) => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        concurrentCount--;
        return `processed-${item}`;
      });

      await processor.processBatch(items, mockProcessor, {
        batchSize: 10, // Large batch to test concurrency
        concurrency: 2
      });

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should add delays between batches', async () => {
      const items = [1, 2, 3, 4];
      const mockProcessor = vi.fn().mockResolvedValue('processed');
      const startTime = Date.now();

      await processor.processBatch(items, mockProcessor, {
        batchSize: 2,
        concurrency: 1,
        delayBetweenBatches: 100
      });

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should include at least one delay between batches
      expect(elapsed).toBeGreaterThan(90);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed operations', async () => {
      const items = [1, 2, 3];
      let attemptCount = 0;

      const mockProcessor = vi.fn().mockImplementation(async (item: number) => {
        attemptCount++;
        if (item === 2 && attemptCount < 3) {
          throw new Error('Temporary error');
        }
        return `processed-${item}`;
      });

      const result = await processor.processBatch(items, mockProcessor, {
        batchSize: 1,
        concurrency: 1,
        retryAttempts: 3,
        retryDelay: 10
      });

      expect(result.successful).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
      expect(mockProcessor).toHaveBeenCalledTimes(4); // 1 + 1 + 2 (with retries)
    });

    it('should fail after max retry attempts', async () => {
      const items = [1, 2];
      const mockProcessor = vi.fn().mockImplementation(async (item: number) => {
        if (item === 2) {
          throw new Error('Persistent error');
        }
        return `processed-${item}`;
      });

      const result = await processor.processBatch(items, mockProcessor, {
        batchSize: 1,
        concurrency: 1,
        retryAttempts: 2,
        retryDelay: 10
      });

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(mockProcessor).toHaveBeenCalledTimes(3); // 1 + 2 (with retries)
    });
  });

  describe('Progress Reporting', () => {
    it('should report progress during processing', async () => {
      const items = [1, 2, 3, 4, 5];
      const mockProcessor = vi.fn().mockResolvedValue('processed');
      const progressReports: Array<{ processed: number; total: number }> = [];

      await processor.processBatch(items, mockProcessor, {
        batchSize: 2,
        concurrency: 1,
        onProgress: (processed, total, results) => {
          progressReports.push({ processed, total });
        }
      });

      expect(progressReports).toHaveLength(3); // 3 batches
      expect(progressReports[0]).toEqual({ processed: 2, total: 5 });
      expect(progressReports[1]).toEqual({ processed: 4, total: 5 });
      expect(progressReports[2]).toEqual({ processed: 5, total: 5 });
    });

    it('should report errors during processing', async () => {
      const items = [1, 2, 3];
      const mockProcessor = vi.fn().mockImplementation(async (item: number) => {
        if (item === 2) {
          throw new Error(`Error ${item}`);
        }
        return `processed-${item}`;
      });

      const errorReports: Array<{ error: Error; item: number; attempt: number }> = [];

      await processor.processBatch(items, mockProcessor, {
        batchSize: 1,
        concurrency: 1,
        onError: (error, item, attempt) => {
          errorReports.push({ error, item, attempt });
        }
      });

      expect(errorReports).toHaveLength(1);
      expect(errorReports[0].item).toBe(2);
      expect(errorReports[0].attempt).toBe(1);
      expect(errorReports[0].error.message).toBe('Error 2');
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate timing metrics', async () => {
      const items = [1, 2, 3];
      const mockProcessor = vi.fn().mockImplementation(async (item: number) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return `processed-${item}`;
      });

      const result = await processor.processBatch(items, mockProcessor, {
        batchSize: 1,
        concurrency: 1
      });

      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.averageTime).toBeGreaterThan(0);
      expect(result.averageTime).toBe(result.totalTime / items.length);
    });
  });
});

describe('ParallelProcessor', () => {
  describe('Parallel Processing', () => {
    it('should process items in parallel', async () => {
      const items = [1, 2, 3, 4, 5];
      const mockProcessor = vi.fn().mockImplementation(async (item: number) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return `processed-${item}`;
      });

      const startTime = Date.now();
      const results = await ParallelProcessor.parallel(items, mockProcessor, 3);
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      expect(results).toEqual(['processed-1', 'processed-2', 'processed-3', 'processed-4', 'processed-5']);
      
      // Should be faster than sequential processing
      const elapsed = endTime - startTime;
      expect(elapsed).toBeLessThan(250); // Should be much less than 5 * 50ms
    });

    it('should respect concurrency limits', async () => {
      const items = [1, 2, 3, 4, 5];
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const mockProcessor = vi.fn().mockImplementation(async (item: number) => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        concurrentCount--;
        return `processed-${item}`;
      });

      await ParallelProcessor.parallel(items, mockProcessor, 2);

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should fail fast on errors', async () => {
      const items = [1, 2, 3, 4, 5];
      const mockProcessor = vi.fn().mockImplementation(async (item: number) => {
        if (item === 3) {
          throw new Error(`Error processing ${item}`);
        }
        await new Promise(resolve => setTimeout(resolve, 50));
        return `processed-${item}`;
      });

      await expect(ParallelProcessor.parallel(items, mockProcessor, 2))
        .rejects.toThrow('Error processing 3');
    });
  });

  describe('Parallel Settled Processing', () => {
    it('should process all items even with errors', async () => {
      const items = [1, 2, 3, 4, 5];
      const mockProcessor = vi.fn().mockImplementation(async (item: number) => {
        if (item === 3) {
          throw new Error(`Error processing ${item}`);
        }
        return `processed-${item}`;
      });

      const results = await ParallelProcessor.parallelSettled(items, mockProcessor, 2);

      expect(results).toHaveLength(5);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('fulfilled');
      expect(results[2].status).toBe('rejected');
      expect(results[3].status).toBe('fulfilled');
      expect(results[4].status).toBe('fulfilled');

      expect((results[0] as any).value).toBe('processed-1');
      expect((results[2] as any).reason.message).toBe('Error processing 3');
    });
  });

  describe('Sliding Window Processing', () => {
    it('should process items in sliding windows', async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const mockProcessor = vi.fn().mockImplementation(async (item: number) => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return `processed-${item}`;
      });

      const startTime = Date.now();
      const results = await ParallelProcessor.slidingWindow(items, mockProcessor, 2, 50);
      const endTime = Date.now();

      expect(results).toHaveLength(6);
      expect(results).toEqual([
        'processed-1', 'processed-2', 'processed-3', 
        'processed-4', 'processed-5', 'processed-6'
      ]);

      // Should include delays between windows
      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThan(100); // At least 2 delays of 50ms each
    });

    it('should handle window size larger than items', async () => {
      const items = [1, 2, 3];
      const mockProcessor = vi.fn().mockResolvedValue('processed');

      const results = await ParallelProcessor.slidingWindow(items, mockProcessor, 5, 10);

      expect(results).toHaveLength(3);
      expect(mockProcessor).toHaveBeenCalledTimes(3);
    });

    it('should not add delay after last window', async () => {
      const items = [1, 2];
      const mockProcessor = vi.fn().mockImplementation(async (item: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return `processed-${item}`;
      });

      const startTime = Date.now();
      await ParallelProcessor.slidingWindow(items, mockProcessor, 1, 100);
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      // Should only have one delay (between first and second item)
      expect(elapsed).toBeLessThan(150); // Less than 2 delays
      expect(elapsed).toBeGreaterThan(90); // But more than just processing time
    });
  });
});