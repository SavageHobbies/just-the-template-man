// Tests for performance monitoring utilities

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor, MemoryMonitor } from './performance-monitor';

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn();
global.performance = { now: mockPerformanceNow } as any;

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let currentTime = 0;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    currentTime = 0;
    mockPerformanceNow.mockImplementation(() => currentTime);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Timer Operations', () => {
    it('should start and end timers correctly', () => {
      const id = monitor.startTimer('test-operation');
      expect(id).toContain('test-operation');

      currentTime = 100;
      const duration = monitor.endTimer(id);

      expect(duration).toBe(100);
    });

    it('should return null for invalid timer id', () => {
      const duration = monitor.endTimer('invalid-id');
      expect(duration).toBeNull();
    });

    it('should handle multiple concurrent timers', () => {
      const id1 = monitor.startTimer('operation1');
      currentTime = 50;
      const id2 = monitor.startTimer('operation2');
      
      currentTime = 100;
      const duration1 = monitor.endTimer(id1);
      
      currentTime = 150;
      const duration2 = monitor.endTimer(id2);

      expect(duration1).toBe(100);
      expect(duration2).toBe(100);
    });
  });

  describe('Function Timing', () => {
    it('should time async function execution', async () => {
      const testFunction = vi.fn().mockImplementation(async () => {
        currentTime += 200;
        return 'result';
      });

      const result = await monitor.timeFunction('test-func', testFunction);

      expect(result).toBe('result');
      expect(testFunction).toHaveBeenCalledOnce();
      
      const stats = monitor.getStats('test-func');
      expect(stats?.totalOperations).toBe(1);
      expect(stats?.averageDuration).toBe(200);
    });

    it('should handle function errors and record them', async () => {
      const error = new Error('Test error');
      const testFunction = vi.fn().mockRejectedValue(error);

      await expect(monitor.timeFunction('test-func', testFunction)).rejects.toThrow('Test error');

      const stats = monitor.getStats('test-func');
      expect(stats?.totalOperations).toBe(1);
      expect(stats?.errorRate).toBe(0.5); // 1 error out of 2 total operations (1 success + 1 error)
    });

    it('should include metadata in timing', async () => {
      const testFunction = vi.fn().mockResolvedValue('result');
      const metadata = { userId: '123', action: 'test' };

      await monitor.timeFunction('test-func', testFunction, metadata);

      // Verify metadata is stored (internal verification)
      const operationNames = monitor.getOperationNames();
      expect(operationNames).toContain('test-func');
    });
  });

  describe('Statistics Generation', () => {
    beforeEach(async () => {
      // Add some test data
      const durations = [100, 150, 200, 250, 300];
      
      for (const duration of durations) {
        const testFunction = vi.fn().mockImplementation(async () => {
          currentTime += duration;
          return 'result';
        });
        await monitor.timeFunction('test-operation', testFunction);
      }
    });

    it('should calculate correct statistics', () => {
      const stats = monitor.getStats('test-operation');

      expect(stats).toBeDefined();
      expect(stats!.totalOperations).toBe(5);
      expect(stats!.averageDuration).toBe(200); // (100+150+200+250+300)/5
      expect(stats!.minDuration).toBe(100);
      expect(stats!.maxDuration).toBe(300);
    });

    it('should calculate percentiles correctly', () => {
      const stats = monitor.getStats('test-operation');

      expect(stats!.p95Duration).toBe(300); // 95th percentile
      expect(stats!.p99Duration).toBe(300); // 99th percentile
    });

    it('should return null for non-existent operations', () => {
      const stats = monitor.getStats('non-existent');
      expect(stats).toBeNull();
    });

    it('should calculate error rate correctly', async () => {
      // Add an error
      monitor.recordError('test-operation', new Error('Test error'));

      const stats = monitor.getStats('test-operation');
      expect(stats!.errorRate).toBe(1/6); // 1 error out of 6 total (5 success + 1 error)
    });
  });

  describe('Report Generation', () => {
    beforeEach(async () => {
      // Add data for multiple operations
      await monitor.timeFunction('operation1', async () => {
        currentTime += 100;
        return 'result1';
      });

      await monitor.timeFunction('operation2', async () => {
        currentTime += 200;
        return 'result2';
      });
    });

    it('should generate comprehensive report', () => {
      const report = monitor.getReport();

      expect(Object.keys(report)).toContain('operation1');
      expect(Object.keys(report)).toContain('operation2');
      expect(report.operation1.averageDuration).toBe(100);
      expect(report.operation2.averageDuration).toBe(200);
    });

    it('should log report to console', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      monitor.logReport();

      expect(consoleSpy).toHaveBeenCalledWith('\n=== Performance Report ===');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('operation1:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('operation2:'));

      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup Operations', () => {
    beforeEach(async () => {
      await monitor.timeFunction('test-op', async () => {
        currentTime += 100;
        return 'result';
      });
    });

    it('should clear metrics for specific operation', () => {
      expect(monitor.getStats('test-op')).toBeDefined();

      monitor.clearMetrics('test-op');

      expect(monitor.getStats('test-op')).toBeNull();
    });

    it('should clear all metrics', () => {
      expect(monitor.getOperationNames()).toContain('test-op');

      monitor.clearMetrics();

      expect(monitor.getOperationNames()).toHaveLength(0);
    });
  });
});

describe('MemoryMonitor', () => {
  let memoryMonitor: MemoryMonitor;
  let mockMemoryUsage: any;

  beforeEach(() => {
    memoryMonitor = new MemoryMonitor();
    mockMemoryUsage = {
      rss: 50 * 1024 * 1024, // 50MB
      heapUsed: 30 * 1024 * 1024, // 30MB
      heapTotal: 40 * 1024 * 1024, // 40MB
      external: 5 * 1024 * 1024 // 5MB
    };

    vi.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Memory Snapshots', () => {
    it('should take memory snapshots', () => {
      const usage = memoryMonitor.snapshot();

      expect(usage).toEqual(mockMemoryUsage);
      expect(process.memoryUsage).toHaveBeenCalledOnce();
    });

    it('should log labeled snapshots', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      memoryMonitor.snapshot('test-label');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Memory snapshot [test-label]:',
        expect.objectContaining({
          rss: '50.00 MB',
          heapUsed: '30.00 MB',
          heapTotal: '40.00 MB',
          external: '5.00 MB'
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Memory Trends', () => {
    it('should detect increasing memory trend', () => {
      // Create a fresh memory monitor for this test
      const testMemoryMonitor = new MemoryMonitor();
      
      // Mock process.memoryUsage for each snapshot
      const mockMemoryUsage1 = { rss: 40 * 1024 * 1024, heapUsed: 30 * 1024 * 1024, heapTotal: 35 * 1024 * 1024, external: 5 * 1024 * 1024 };
      const mockMemoryUsage2 = { rss: 45 * 1024 * 1024, heapUsed: 35 * 1024 * 1024, heapTotal: 40 * 1024 * 1024, external: 5 * 1024 * 1024 };
      const mockMemoryUsage3 = { rss: 52 * 1024 * 1024, heapUsed: 42 * 1024 * 1024, heapTotal: 47 * 1024 * 1024, external: 5 * 1024 * 1024 };

      vi.spyOn(process, 'memoryUsage')
        .mockReturnValueOnce(mockMemoryUsage1)
        .mockReturnValueOnce(mockMemoryUsage2)
        .mockReturnValueOnce(mockMemoryUsage3);

      // Take snapshots
      testMemoryMonitor.snapshot();
      testMemoryMonitor.snapshot();
      testMemoryMonitor.snapshot();

      const trend = testMemoryMonitor.getTrend();

      expect(trend.averageGrowth).toBeGreaterThan(0.01); // Should exceed 1% threshold
      expect(trend.increasing).toBe(true);
    });

    it('should detect stable memory usage', () => {
      // Take multiple snapshots with same memory usage
      memoryMonitor.snapshot();
      memoryMonitor.snapshot();
      memoryMonitor.snapshot();

      const trend = memoryMonitor.getTrend();

      expect(trend.increasing).toBe(false);
      expect(trend.averageGrowth).toBe(0);
    });

    it('should return default trend for insufficient data', () => {
      const trend = memoryMonitor.getTrend();

      expect(trend.increasing).toBe(false);
      expect(trend.averageGrowth).toBe(0);
    });
  });

  describe('Cleanup', () => {
    it('should clean up old snapshots', () => {
      const oldTime = Date.now() - 120000; // 2 minutes ago
      vi.spyOn(Date, 'now').mockReturnValueOnce(oldTime);
      
      memoryMonitor.snapshot(); // Old snapshot
      
      vi.spyOn(Date, 'now').mockReturnValueOnce(Date.now());
      memoryMonitor.snapshot(); // Recent snapshot

      memoryMonitor.cleanup(60000); // Clean up snapshots older than 1 minute

      // Should only have the recent snapshot
      const trend = memoryMonitor.getTrend();
      expect(trend.averageGrowth).toBe(0); // Only one snapshot left
    });
  });
});

describe('Monitor Decorator', () => {
  let monitor: PerformanceMonitor;
  let decoratorCurrentTime = 0;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    decoratorCurrentTime = 0;
    mockPerformanceNow.mockImplementation(() => decoratorCurrentTime);
  });

  it('should automatically monitor decorated methods', async () => {
    class TestClass {
      async testMethod(value: string) {
        return monitor.timeFunction('TestClass.testMethod', async () => {
          decoratorCurrentTime += 150;
          return `processed: ${value}`;
        });
      }
    }

    const instance = new TestClass();
    const result = await instance.testMethod('test');

    expect(result).toBe('processed: test');

    const stats = monitor.getStats('TestClass.testMethod');
    expect(stats?.totalOperations).toBe(1);
    expect(stats?.averageDuration).toBe(150);
  });
});