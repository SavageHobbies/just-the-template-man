// Performance benchmarking utilities

import { performanceMonitor, memoryMonitor } from './performance-monitor';

export interface BenchmarkOptions {
  iterations?: number;
  warmupIterations?: number;
  maxDuration?: number; // Maximum duration in milliseconds
  memoryTracking?: boolean;
  name?: string;
}

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  p95Time: number;
  p99Time: number;
  throughput: number; // operations per second
  memoryUsage?: {
    initial: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
    final: NodeJS.MemoryUsage;
    growth: number;
  };
}

export class Benchmark {
  /**
   * Run a performance benchmark on a function
   */
  static async run<T>(
    fn: () => Promise<T> | T,
    options: BenchmarkOptions = {}
  ): Promise<BenchmarkResult> {
    const {
      iterations = 100,
      warmupIterations = 10,
      maxDuration = 30000, // 30 seconds max
      memoryTracking = false,
      name = 'benchmark'
    } = options;

    console.log(`Starting benchmark: ${name}`);
    console.log(`Warmup iterations: ${warmupIterations}`);
    console.log(`Target iterations: ${iterations}`);

    // Memory tracking setup
    let initialMemory: NodeJS.MemoryUsage | undefined;
    let peakMemory: NodeJS.MemoryUsage | undefined;
    let finalMemory: NodeJS.MemoryUsage | undefined;

    if (memoryTracking) {
      initialMemory = memoryMonitor.snapshot(`${name}-initial`);
      peakMemory = initialMemory;
    }

    // Warmup phase
    console.log('Running warmup...');
    for (let i = 0; i < warmupIterations; i++) {
      await fn();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Benchmark phase
    console.log('Running benchmark...');
    const times: number[] = [];
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const iterationStart = performance.now();
      await fn();
      const iterationEnd = performance.now();
      
      times.push(iterationEnd - iterationStart);

      // Check memory usage
      if (memoryTracking) {
        const currentMemory = process.memoryUsage();
        if (!peakMemory || currentMemory.heapUsed > peakMemory.heapUsed) {
          peakMemory = currentMemory;
        }
      }

      // Check if we've exceeded max duration
      if (Date.now() - startTime > maxDuration) {
        console.log(`Benchmark stopped early after ${i + 1} iterations (max duration reached)`);
        break;
      }

      // Progress reporting
      if ((i + 1) % Math.max(1, Math.floor(iterations / 10)) === 0) {
        const progress = ((i + 1) / iterations * 100).toFixed(1);
        console.log(`Progress: ${progress}% (${i + 1}/${iterations})`);
      }
    }

    if (memoryTracking) {
      finalMemory = memoryMonitor.snapshot(`${name}-final`);
    }

    // Calculate statistics
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    const sortedTimes = [...times].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);
    const p95Time = sortedTimes[p95Index] || maxTime;
    const p99Time = sortedTimes[p99Index] || maxTime;
    
    const throughput = (times.length / totalTime) * 1000; // ops per second

    const result: BenchmarkResult = {
      name,
      iterations: times.length,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      p95Time,
      p99Time,
      throughput
    };

    if (memoryTracking && initialMemory && peakMemory && finalMemory) {
      result.memoryUsage = {
        initial: initialMemory,
        peak: peakMemory,
        final: finalMemory,
        growth: finalMemory.heapUsed - initialMemory.heapUsed
      };
    }

    return result;
  }

  /**
   * Compare multiple functions performance
   */
  static async compare<T>(
    functions: Array<{ name: string; fn: () => Promise<T> | T }>,
    options: BenchmarkOptions = {}
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const { name, fn } of functions) {
      console.log(`\n--- Benchmarking: ${name} ---`);
      const result = await this.run(fn, { ...options, name });
      results.push(result);
    }

    // Print comparison
    console.log('\n=== Benchmark Comparison ===');
    console.log('Name'.padEnd(20) + 'Avg Time'.padEnd(12) + 'Throughput'.padEnd(15) + 'Relative');
    console.log('-'.repeat(60));

    const fastest = results.reduce((min, result) => 
      result.averageTime < min.averageTime ? result : min
    );

    for (const result of results) {
      const relative = (result.averageTime / fastest.averageTime).toFixed(2);
      const avgTime = `${result.averageTime.toFixed(2)}ms`;
      const throughput = `${result.throughput.toFixed(2)} ops/s`;
      
      console.log(
        result.name.padEnd(20) + 
        avgTime.padEnd(12) + 
        throughput.padEnd(15) + 
        `${relative}x`
      );
    }

    return results;
  }

  /**
   * Print detailed benchmark result
   */
  static printResult(result: BenchmarkResult): void {
    console.log(`\n=== Benchmark Results: ${result.name} ===`);
    console.log(`Iterations: ${result.iterations}`);
    console.log(`Total Time: ${result.totalTime.toFixed(2)}ms`);
    console.log(`Average Time: ${result.averageTime.toFixed(2)}ms`);
    console.log(`Min Time: ${result.minTime.toFixed(2)}ms`);
    console.log(`Max Time: ${result.maxTime.toFixed(2)}ms`);
    console.log(`P95 Time: ${result.p95Time.toFixed(2)}ms`);
    console.log(`P99 Time: ${result.p99Time.toFixed(2)}ms`);
    console.log(`Throughput: ${result.throughput.toFixed(2)} ops/sec`);

    if (result.memoryUsage) {
      const { initial, peak, final, growth } = result.memoryUsage;
      console.log('\n--- Memory Usage ---');
      console.log(`Initial Heap: ${(initial.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Peak Heap: ${(peak.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Final Heap: ${(final.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Memory Growth: ${(growth / 1024 / 1024).toFixed(2)} MB`);
    }
  }

  /**
   * Run a stress test with increasing load
   */
  static async stressTest<T>(
    fn: () => Promise<T> | T,
    options: {
      name?: string;
      startLoad?: number;
      maxLoad?: number;
      stepSize?: number;
      duration?: number; // Duration per load level in ms
    } = {}
  ): Promise<Array<{ load: number; result: BenchmarkResult }>> {
    const {
      name = 'stress-test',
      startLoad = 1,
      maxLoad = 100,
      stepSize = 10,
      duration = 5000
    } = options;

    const results: Array<{ load: number; result: BenchmarkResult }> = [];

    console.log(`Starting stress test: ${name}`);
    console.log(`Load range: ${startLoad} to ${maxLoad} (step: ${stepSize})`);
    console.log(`Duration per level: ${duration}ms`);

    for (let load = startLoad; load <= maxLoad; load += stepSize) {
      console.log(`\n--- Testing load level: ${load} ---`);
      
      const iterations = Math.max(10, Math.floor(duration / 100)); // Estimate iterations
      const result = await this.run(fn, {
        name: `${name}-load-${load}`,
        iterations,
        maxDuration: duration,
        memoryTracking: true
      });

      results.push({ load, result });

      // Check if performance is degrading significantly
      if (results.length > 1) {
        const previous = results[results.length - 2].result;
        const current = result;
        
        const degradation = (current.averageTime - previous.averageTime) / previous.averageTime;
        
        if (degradation > 2.0) { // 200% degradation
          console.log(`Significant performance degradation detected (${(degradation * 100).toFixed(1)}%)`);
          console.log('Stopping stress test early');
          break;
        }
      }
    }

    // Print stress test summary
    console.log('\n=== Stress Test Summary ===');
    console.log('Load'.padEnd(8) + 'Avg Time'.padEnd(12) + 'Throughput'.padEnd(15) + 'Memory Growth');
    console.log('-'.repeat(50));

    for (const { load, result } of results) {
      const avgTime = `${result.averageTime.toFixed(2)}ms`;
      const throughput = `${result.throughput.toFixed(2)} ops/s`;
      const memGrowth = result.memoryUsage 
        ? `${(result.memoryUsage.growth / 1024 / 1024).toFixed(2)} MB`
        : 'N/A';
      
      console.log(
        load.toString().padEnd(8) + 
        avgTime.padEnd(12) + 
        throughput.padEnd(15) + 
        memGrowth
      );
    }

    return results;
  }
}

/**
 * Utility for creating benchmark suites
 */
export class BenchmarkSuite {
  private benchmarks: Array<{ name: string; fn: () => Promise<any> | any }> = [];

  add(name: string, fn: () => Promise<any> | any): this {
    this.benchmarks.push({ name, fn });
    return this;
  }

  async run(options: BenchmarkOptions = {}): Promise<BenchmarkResult[]> {
    return Benchmark.compare(this.benchmarks, options);
  }
}

// Export convenience functions
export const benchmark = Benchmark.run;
export const compare = Benchmark.compare;
export const stressTest = Benchmark.stressTest;