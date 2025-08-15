// Performance monitoring and optimization utilities

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  totalOperations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
  p99Duration: number;
  errorRate: number;
  throughput: number; // operations per second
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private activeMetrics: Map<string, PerformanceMetric> = new Map();

  /**
   * Start timing an operation
   */
  startTimer(operationName: string, metadata?: Record<string, any>): string {
    const id = `${operationName}_${Date.now()}_${Math.random()}`;
    const metric: PerformanceMetric = {
      name: operationName,
      startTime: performance.now(),
      metadata
    };

    this.activeMetrics.set(id, metric);
    return id;
  }

  /**
   * End timing an operation
   */
  endTimer(id: string): number | null {
    const metric = this.activeMetrics.get(id);
    if (!metric) return null;

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Store completed metric
    const operationMetrics = this.metrics.get(metric.name) || [];
    operationMetrics.push(metric);
    this.metrics.set(metric.name, operationMetrics);

    this.activeMetrics.delete(id);
    return metric.duration;
  }

  /**
   * Time a function execution
   */
  async timeFunction<T>(
    operationName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const id = this.startTimer(operationName, metadata);
    try {
      const result = await fn();
      this.endTimer(id);
      return result;
    } catch (error) {
      this.endTimer(id);
      this.recordError(operationName, error);
      throw error;
    }
  }

  /**
   * Record an error for an operation
   */
  recordError(operationName: string, error: any): void {
    const errorMetric: PerformanceMetric = {
      name: `${operationName}_error`,
      startTime: performance.now(),
      endTime: performance.now(),
      duration: 0,
      metadata: { error: error.message || String(error) }
    };

    const errorMetrics = this.metrics.get(`${operationName}_error`) || [];
    errorMetrics.push(errorMetric);
    this.metrics.set(`${operationName}_error`, errorMetrics);
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operationName: string): PerformanceStats | null {
    const metrics = this.metrics.get(operationName);
    const errorMetrics = this.metrics.get(`${operationName}_error`) || [];

    if (!metrics || metrics.length === 0) return null;

    const durations = metrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!)
      .sort((a, b) => a - b);

    if (durations.length === 0) return null;

    const totalOperations = metrics.length;
    const totalErrors = errorMetrics.length;
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minDuration = durations[0];
    const maxDuration = durations[durations.length - 1];
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    const p95Duration = durations[p95Index] || maxDuration;
    const p99Duration = durations[p99Index] || maxDuration;
    const errorRate = totalErrors / (totalOperations + totalErrors);

    // Calculate throughput (operations per second)
    const timeSpan = Math.max(...metrics.map(m => m.startTime)) - Math.min(...metrics.map(m => m.startTime));
    const throughput = timeSpan > 0 ? (totalOperations / timeSpan) * 1000 : 0;

    return {
      totalOperations,
      averageDuration,
      minDuration,
      maxDuration,
      p95Duration,
      p99Duration,
      errorRate,
      throughput
    };
  }

  /**
   * Get all operation names being monitored
   */
  getOperationNames(): string[] {
    return Array.from(this.metrics.keys()).filter(name => !name.endsWith('_error'));
  }

  /**
   * Clear metrics for an operation
   */
  clearMetrics(operationName?: string): void {
    if (operationName) {
      this.metrics.delete(operationName);
      this.metrics.delete(`${operationName}_error`);
    } else {
      this.metrics.clear();
      this.activeMetrics.clear();
    }
  }

  /**
   * Get a performance report for all operations
   */
  getReport(): Record<string, PerformanceStats> {
    const report: Record<string, PerformanceStats> = {};
    
    for (const operationName of this.getOperationNames()) {
      const stats = this.getStats(operationName);
      if (stats) {
        report[operationName] = stats;
      }
    }

    return report;
  }

  /**
   * Log performance report to console
   */
  logReport(): void {
    const report = this.getReport();
    console.log('\n=== Performance Report ===');
    
    for (const [operation, stats] of Object.entries(report)) {
      console.log(`\n${operation}:`);
      console.log(`  Operations: ${stats.totalOperations}`);
      console.log(`  Average: ${stats.averageDuration.toFixed(2)}ms`);
      console.log(`  Min/Max: ${stats.minDuration.toFixed(2)}ms / ${stats.maxDuration.toFixed(2)}ms`);
      console.log(`  P95/P99: ${stats.p95Duration.toFixed(2)}ms / ${stats.p99Duration.toFixed(2)}ms`);
      console.log(`  Error Rate: ${(stats.errorRate * 100).toFixed(2)}%`);
      console.log(`  Throughput: ${stats.throughput.toFixed(2)} ops/sec`);
    }
  }
}

/**
 * Memory usage monitoring
 */
export class MemoryMonitor {
  private snapshots: Array<{ timestamp: number; usage: NodeJS.MemoryUsage }> = [];

  /**
   * Take a memory usage snapshot
   */
  snapshot(label?: string): NodeJS.MemoryUsage {
    const usage = process.memoryUsage();
    this.snapshots.push({ timestamp: Date.now(), usage });
    
    if (label) {
      console.log(`Memory snapshot [${label}]:`, {
        rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`
      });
    }

    return usage;
  }

  /**
   * Get memory usage trend
   */
  getTrend(): { increasing: boolean; averageGrowth: number } {
    if (this.snapshots.length < 2) {
      return { increasing: false, averageGrowth: 0 };
    }

    const growthRates = [];
    for (let i = 1; i < this.snapshots.length; i++) {
      const prev = this.snapshots[i - 1].usage.heapUsed;
      const curr = this.snapshots[i].usage.heapUsed;
      growthRates.push((curr - prev) / prev);
    }

    const averageGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    return {
      increasing: averageGrowth > 0.01, // 1% growth threshold
      averageGrowth
    };
  }

  /**
   * Clear old snapshots to prevent memory leaks
   */
  cleanup(maxAge: number = 60000): void {
    const cutoff = Date.now() - maxAge;
    this.snapshots = this.snapshots.filter(snapshot => snapshot.timestamp > cutoff);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();
export const memoryMonitor = new MemoryMonitor();

/**
 * Decorator for automatic performance monitoring
 */
export function monitor(operationName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const name = operationName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.timeFunction(name, () => method.apply(this, args));
    };

    return descriptor;
  };
}