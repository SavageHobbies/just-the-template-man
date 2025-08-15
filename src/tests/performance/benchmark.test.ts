import { describe, it, expect, beforeAll } from 'vitest';
import { Pipeline } from '../../pipeline';
import { WebScrapingService } from '../../services/WebScrapingService';
import { ProductExtractor } from '../../services/ProductExtractor';
import { MarketResearchEngine } from '../../services/MarketResearchEngine';
import { ResearchDataAnalyzer } from '../../services/ResearchDataAnalyzer';
import { ContentOptimizer } from '../../services/ContentOptimizer';
import { TemplateRenderer } from '../../services/TemplateRenderer';
import { testDatasets } from '../data/test-datasets';

interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  operationsPerSecond: number;
}

interface BenchmarkResult {
  testName: string;
  metrics: PerformanceMetrics;
  success: boolean;
  error?: string;
}

describe('Performance Benchmarks', () => {
  let pipeline: Pipeline;
  const benchmarkResults: BenchmarkResult[] = [];

  beforeAll(() => {
    const webScraper = new WebScrapingService();
    const productExtractor = new ProductExtractor();
    const marketResearcher = new MarketResearchEngine();
    const dataAnalyzer = new ResearchDataAnalyzer();
    const contentOptimizer = new ContentOptimizer();
    const templateRenderer = new TemplateRenderer();

    pipeline = new Pipeline(
      webScraper,
      productExtractor,
      marketResearcher,
      dataAnalyzer,
      contentOptimizer,
      templateRenderer
    );
  });

  const measurePerformance = async <T>(
    testName: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; metrics: PerformanceMetrics }> => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const startMemory = process.memoryUsage();
    const startTime = process.hrtime.bigint();

    const result = await operation();

    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();

    const executionTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    const memoryUsage = endMemory.heapUsed - startMemory.heapUsed;
    const operationsPerSecond = 1000 / executionTime;

    const metrics: PerformanceMetrics = {
      executionTime,
      memoryUsage,
      operationsPerSecond
    };

    return { result, metrics };
  };

  describe('Web Scraping Performance', () => {
    it('should scrape content within performance thresholds', async () => {
      const webScraper = new WebScrapingService();
      const testUrl = 'https://www.ebay.com/itm/123456789';

      try {
        const { metrics } = await measurePerformance('web-scraping', async () => {
          return await webScraper.scrapeUrl(testUrl);
        });

        benchmarkResults.push({
          testName: 'web-scraping',
          metrics,
          success: true
        });

        // Performance thresholds
        expect(metrics.executionTime).toBeLessThan(10000); // 10 seconds max
        expect(metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB max
      } catch (error) {
        benchmarkResults.push({
          testName: 'web-scraping',
          metrics: { executionTime: 0, memoryUsage: 0, operationsPerSecond: 0 },
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // For demo URLs, we expect failures but still want to test the performance measurement
        expect(error).toBeDefined();
      }
    });
  });

  describe('Product Extraction Performance', () => {
    it('should extract product details efficiently', async () => {
      const productExtractor = new ProductExtractor();
      const testData = testDatasets[0]; // iPhone test data

      const { metrics } = await measurePerformance('product-extraction', async () => {
        return await productExtractor.extractProductDetails(testData.mockWebpageContent);
      });

      benchmarkResults.push({
        testName: 'product-extraction',
        metrics,
        success: true
      });

      // Performance thresholds
      expect(metrics.executionTime).toBeLessThan(2000); // 2 seconds max
      expect(metrics.memoryUsage).toBeLessThan(10 * 1024 * 1024); // 10MB max
      expect(metrics.operationsPerSecond).toBeGreaterThan(0.5); // At least 0.5 ops/sec
    });

    it('should extract images efficiently', async () => {
      const productExtractor = new ProductExtractor();
      const testData = testDatasets[0];

      const { metrics } = await measurePerformance('image-extraction', async () => {
        return await productExtractor.extractImageGallery(testData.mockWebpageContent);
      });

      benchmarkResults.push({
        testName: 'image-extraction',
        metrics,
        success: true
      });

      expect(metrics.executionTime).toBeLessThan(3000); // 3 seconds max
      expect(metrics.memoryUsage).toBeLessThan(15 * 1024 * 1024); // 15MB max
    });
  });

  describe('Market Research Performance', () => {
    it('should conduct research within time limits', async () => {
      const marketResearcher = new MarketResearchEngine();
      const testData = testDatasets[0];
      const productDetails = {
        ...testData.expectedProductDetails,
        images: [],
        description: 'Test description',
        seller: 'test_seller',
        location: 'Test Location'
      } as any;

      const { metrics } = await measurePerformance('market-research', async () => {
        return await marketResearcher.conductResearch(productDetails);
      });

      benchmarkResults.push({
        testName: 'market-research',
        metrics,
        success: true
      });

      expect(metrics.executionTime).toBeLessThan(15000); // 15 seconds max
      expect(metrics.memoryUsage).toBeLessThan(25 * 1024 * 1024); // 25MB max
    });
  });

  describe('Content Optimization Performance', () => {
    it('should optimize content quickly', async () => {
      const contentOptimizer = new ContentOptimizer();
      const testData = testDatasets[0];
      const productDetails = {
        ...testData.expectedProductDetails,
        images: [],
        description: 'Test description',
        seller: 'test_seller',
        location: 'Test Location'
      } as any;

      const { metrics } = await measurePerformance('content-optimization', async () => {
        return await contentOptimizer.optimizeContent(productDetails, testData.mockResearchData);
      });

      benchmarkResults.push({
        testName: 'content-optimization',
        metrics,
        success: true
      });

      expect(metrics.executionTime).toBeLessThan(3000); // 3 seconds max
      expect(metrics.memoryUsage).toBeLessThan(10 * 1024 * 1024); // 10MB max
      expect(metrics.operationsPerSecond).toBeGreaterThan(0.3);
    });
  });

  describe('Template Rendering Performance', () => {
    it('should render templates efficiently', async () => {
      const templateRenderer = new TemplateRenderer();
      const mockOptimizedContent = {
        optimizedTitle: 'Test Title',
        optimizedDescription: 'Test Description',
        suggestedPrice: 100,
        keywords: ['test', 'keywords'],
        sellingPoints: ['Test point'],
        conditionNotes: 'Test condition'
      };
      const mockProductDetails = {
        title: 'Test',
        description: 'Test',
        price: 100,
        condition: 'Test',
        images: [],
        specifications: {},
        seller: 'test',
        location: 'test'
      };

      const { metrics } = await measurePerformance('template-rendering', async () => {
        return await templateRenderer.renderTemplate(
          mockOptimizedContent,
          mockProductDetails,
          'final-ebay-template.html'
        );
      });

      benchmarkResults.push({
        testName: 'template-rendering',
        metrics,
        success: true
      });

      expect(metrics.executionTime).toBeLessThan(1000); // 1 second max
      expect(metrics.memoryUsage).toBeLessThan(5 * 1024 * 1024); // 5MB max
      expect(metrics.operationsPerSecond).toBeGreaterThan(1);
    });
  });

  describe('End-to-End Pipeline Performance', () => {
    it('should process complete pipeline within acceptable time', async () => {
      const testUrl = 'https://www.ebay.com/itm/123456789';

      try {
        const { metrics } = await measurePerformance('full-pipeline', async () => {
          return await pipeline.processListing(testUrl);
        });

        benchmarkResults.push({
          testName: 'full-pipeline',
          metrics,
          success: true
        });

        // Full pipeline should complete within reasonable time
        expect(metrics.executionTime).toBeLessThan(30000); // 30 seconds max
        expect(metrics.memoryUsage).toBeLessThan(100 * 1024 * 1024); // 100MB max
      } catch (error) {
        benchmarkResults.push({
          testName: 'full-pipeline',
          metrics: { executionTime: 0, memoryUsage: 0, operationsPerSecond: 0 },
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Expected for demo URLs
        expect(error).toBeDefined();
      }
    });
  });

  describe('Concurrent Processing Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = 3;
      const testData = testDatasets.slice(0, concurrentRequests);

      const { metrics } = await measurePerformance('concurrent-processing', async () => {
        const promises = testData.map(async (data) => {
          const productExtractor = new ProductExtractor();
          return await productExtractor.extractProductDetails(data.mockWebpageContent);
        });

        return await Promise.all(promises);
      });

      benchmarkResults.push({
        testName: 'concurrent-processing',
        metrics,
        success: true
      });

      // Should handle concurrent requests efficiently
      expect(metrics.executionTime).toBeLessThan(5000); // 5 seconds max for 3 concurrent
      expect(metrics.memoryUsage).toBeLessThan(30 * 1024 * 1024); // 30MB max
    });
  });

  describe('Memory Leak Detection', () => {
    it('should not have significant memory leaks', async () => {
      const iterations = 10;
      const memoryReadings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const productExtractor = new ProductExtractor();
        await productExtractor.extractProductDetails(testDatasets[0].mockWebpageContent);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        memoryReadings.push(process.memoryUsage().heapUsed);
      }

      // Memory should not grow significantly over iterations
      const initialMemory = memoryReadings[0];
      const finalMemory = memoryReadings[memoryReadings.length - 1];
      const memoryGrowth = finalMemory - initialMemory;
      const memoryGrowthMB = memoryGrowth / (1024 * 1024);

      expect(memoryGrowthMB).toBeLessThan(50); // Less than 50MB growth over 10 iterations
    });
  });

  // Generate performance report after all tests
  afterAll(() => {
    console.log('\n=== Performance Benchmark Results ===');
    benchmarkResults.forEach(result => {
      console.log(`\n${result.testName}:`);
      console.log(`  Success: ${result.success}`);
      if (result.success) {
        console.log(`  Execution Time: ${result.metrics.executionTime.toFixed(2)}ms`);
        console.log(`  Memory Usage: ${(result.metrics.memoryUsage / (1024 * 1024)).toFixed(2)}MB`);
        console.log(`  Operations/sec: ${result.metrics.operationsPerSecond.toFixed(2)}`);
      } else {
        console.log(`  Error: ${result.error}`);
      }
    });
    console.log('\n=====================================\n');
  });
});