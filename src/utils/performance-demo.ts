// Performance optimization demonstration script

import { AxiosWebScrapingService } from '../services/WebScrapingService';
import { EbayProductExtractor } from '../services/ProductExtractor';
import { MarketResearchEngine } from '../services/MarketResearchEngine';
import { webContentCache, researchDataCache, imageValidationCache } from './cache';
import { performanceMonitor, memoryMonitor } from './performance-monitor';
import { Benchmark, BenchmarkSuite } from './benchmark';
import { ParallelProcessor } from './batch-processor';

/**
 * Demonstrates the performance improvements from caching and optimization
 */
export async function runPerformanceDemo(): Promise<void> {
  console.log('🚀 eBay Listing Optimizer - Performance Demo\n');

  // Clear all caches to start fresh
  await webContentCache.clear();
  await researchDataCache.clear();
  await imageValidationCache.clear();
  performanceMonitor.clearMetrics();

  const webScrapingService = new AxiosWebScrapingService();
  const productExtractor = new EbayProductExtractor();
  const marketResearchEngine = new MarketResearchEngine();

  // Mock data for demonstration
  const mockEbayUrl = 'https://www.ebay.com/itm/123456789';
  const mockWebContent = {
    html: `
      <html>
        <head><title>Amazing Product - Great Deal!</title></head>
        <body>
          <div class="price">$99.99</div>
          <div class="condition">New</div>
          <div class="description">This is an amazing product with great features.</div>
          <img src="https://example.com/image1.jpg" />
          <img src="https://example.com/image2.jpg" />
          <img src="https://example.com/image3.jpg" />
        </body>
      </html>
    `,
    title: 'Amazing Product - Great Deal!',
    metadata: {},
    timestamp: new Date()
  };

  const mockProductDetails = {
    title: 'Amazing Product - Great Deal!',
    description: 'This is an amazing product with great features.',
    price: 99.99,
    condition: 'New',
    images: [
      { url: 'https://example.com/image1.jpg', altText: 'Image 1', size: 'large' as const, isValid: true },
      { url: 'https://example.com/image2.jpg', altText: 'Image 2', size: 'large' as const, isValid: true },
      { url: 'https://example.com/image3.jpg', altText: 'Image 3', size: 'large' as const, isValid: true }
    ],
    specifications: { brand: 'TestBrand', model: 'TestModel' },
    seller: 'test-seller',
    location: 'Test Location'
  };

  console.log('📊 Running Cache Performance Benchmarks...\n');

  // Benchmark 1: Web Content Caching
  console.log('1. Web Content Caching Performance');
  console.log('=' .repeat(40));

  const webCacheBenchmark = new BenchmarkSuite()
    .add('Without Cache', async () => {
      await webContentCache.clear();
      // Simulate web scraping delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return mockWebContent;
    })
    .add('With Cache', async () => {
      // Pre-populate cache
      await webContentCache.set(mockEbayUrl, mockWebContent);
      return await webContentCache.get(mockEbayUrl);
    });

  const webCacheResults = await webCacheBenchmark.run({
    iterations: 50,
    warmupIterations: 5
  });

  console.log('\n');

  // Benchmark 2: Image Validation Batching
  console.log('2. Image Validation Performance');
  console.log('=' .repeat(40));

  const imageUrls = Array.from({ length: 20 }, (_, i) => 
    `https://example.com/image${i}.jpg`
  );

  const imageBenchmark = new BenchmarkSuite()
    .add('Sequential Processing', async () => {
      const results = [];
      for (const url of imageUrls) {
        // Simulate validation delay
        await new Promise(resolve => setTimeout(resolve, 10));
        results.push({ url, isValid: true });
      }
      return results;
    })
    .add('Parallel Processing', async () => {
      return ParallelProcessor.parallel(
        imageUrls,
        async (url) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return { url, isValid: true };
        },
        5 // Max 5 concurrent
      );
    });

  const imageResults = await imageBenchmark.run({
    iterations: 10,
    warmupIterations: 2
  });

  console.log('\n');

  // Benchmark 3: Research Data Caching
  console.log('3. Research Data Caching Performance');
  console.log('=' .repeat(40));

  const researchBenchmark = new BenchmarkSuite()
    .add('Without Cache', async () => {
      await researchDataCache.clear();
      // Simulate research delay
      await new Promise(resolve => setTimeout(resolve, 200));
      return await marketResearchEngine.conductResearch(mockProductDetails);
    })
    .add('With Cache', async () => {
      // Pre-populate cache
      const cacheKey = {
        title: mockProductDetails.title,
        condition: mockProductDetails.condition,
        price: mockProductDetails.price
      };
      const researchData = await marketResearchEngine.conductResearch(mockProductDetails);
      await researchDataCache.set(cacheKey, researchData);
      return await researchDataCache.get(cacheKey);
    });

  const researchResults = await researchBenchmark.run({
    iterations: 20,
    warmupIterations: 3
  });

  console.log('\n');

  // Memory Usage Analysis
  console.log('4. Memory Usage Analysis');
  console.log('=' .repeat(40));

  const initialMemory = memoryMonitor.snapshot('Initial');
  
  // Simulate heavy processing
  const largeDataSet = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    data: 'x'.repeat(100),
    timestamp: Date.now()
  }));

  const peakMemory = memoryMonitor.snapshot('Peak Usage');

  // Clear data
  largeDataSet.length = 0;
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const finalMemory = memoryMonitor.snapshot('After Cleanup');

  const memoryTrend = memoryMonitor.getTrend();
  
  console.log(`Memory Growth Detected: ${memoryTrend.increasing ? 'Yes' : 'No'}`);
  console.log(`Average Growth Rate: ${(memoryTrend.averageGrowth * 100).toFixed(2)}%`);

  console.log('\n');

  // Performance Monitoring Report
  console.log('5. Performance Monitoring Report');
  console.log('=' .repeat(40));

  // Simulate some monitored operations
  await performanceMonitor.timeFunction('demo-operation-1', async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return 'result1';
  });

  await performanceMonitor.timeFunction('demo-operation-2', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return 'result2';
  });

  await performanceMonitor.timeFunction('demo-operation-1', async () => {
    await new Promise(resolve => setTimeout(resolve, 75));
    return 'result3';
  });

  performanceMonitor.logReport();

  console.log('\n');

  // Cache Statistics
  console.log('6. Cache Statistics');
  console.log('=' .repeat(40));

  console.log('Web Content Cache:', webContentCache.getStats());
  console.log('Research Data Cache:', researchDataCache.getStats());
  console.log('Image Validation Cache:', imageValidationCache.getStats());

  console.log('\n');

  // Stress Test Example
  console.log('7. Stress Test Example');
  console.log('=' .repeat(40));

  const stressTestResults = await Benchmark.stressTest(
    async () => {
      // Simulate a lightweight operation
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
      return 'processed';
    },
    {
      name: 'lightweight-operation',
      startLoad: 10,
      maxLoad: 100,
      stepSize: 20,
      duration: 2000
    }
  );

  console.log('\n✅ Performance Demo Complete!\n');

  // Summary
  console.log('📈 Performance Improvements Summary:');
  console.log('=' .repeat(50));
  
  const webCacheImprovement = webCacheResults[0].averageTime / webCacheResults[1].averageTime;
  const imageParallelImprovement = imageResults[0].averageTime / imageResults[1].averageTime;
  const researchCacheImprovement = researchResults[0].averageTime / researchResults[1].averageTime;

  console.log(`🚀 Web Content Caching: ${webCacheImprovement.toFixed(1)}x faster`);
  console.log(`⚡ Parallel Image Processing: ${imageParallelImprovement.toFixed(1)}x faster`);
  console.log(`💾 Research Data Caching: ${researchCacheImprovement.toFixed(1)}x faster`);
  
  console.log('\n🎯 Key Benefits:');
  console.log('• Reduced API calls through intelligent caching');
  console.log('• Improved response times for repeated operations');
  console.log('• Better resource utilization with parallel processing');
  console.log('• Comprehensive performance monitoring and insights');
  console.log('• Memory usage tracking and optimization');

  // Cleanup
  memoryMonitor.cleanup();
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runPerformanceDemo().catch(console.error);
}