// Integration tests for performance optimizations

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AxiosWebScrapingService } from './WebScrapingService';
import { EbayProductExtractor } from './ProductExtractor';
import { MarketResearchEngine } from './MarketResearchEngine';
import { webContentCache, researchDataCache, imageValidationCache } from '../utils/cache';
import { performanceMonitor, memoryMonitor } from '../utils/performance-monitor';

// Mock axios for testing
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      head: vi.fn()
    })),
    get: vi.fn(),
    head: vi.fn(),
    isAxiosError: vi.fn()
  }
}));
}));

describe('Performance Integration Tests', () => {
  let webScrapingService: AxiosWebScrapingService;
  let productExtractor: EbayProductExtractor;
  let marketResearchEngine: MarketResearchEngine;

  beforeEach(async () => {
    webScrapingService = new AxiosWebScrapingService();
    productExtractor = new EbayProductExtractor();
    marketResearchEngine = new MarketResearchEngine();

    // Clear all caches
    await webContentCache.clear();
    await researchDataCache.clear();
    await imageValidationCache.clear();
    
    // Clear performance metrics
    performanceMonitor.clearMetrics();
  });

  afterEach(async () => {
    await webContentCache.clear();
    await researchDataCache.clear();
    await imageValidationCache.clear();
  });

  describe('Web Scraping Performance', () => {
    it('should cache web content and improve subsequent requests', async () => {
      const mockHtml = '<html><head><title>Test Product</title></head><body>Test content</body></html>';
      const mockAxios = await import('axios');
      
      (mockAxios.default.create as any)().get.mockResolvedValue({
        data: mockHtml,
        status: 200
      });

      const testUrl = 'https://www.ebay.com/itm/123456789';

      // First request - should hit the network
      const startTime1 = Date.now();
      const result1 = await webScrapingService.scrapeUrl(testUrl);
      const endTime1 = Date.now();

      expect(result1.html).toBe(mockHtml);
      expect(result1.title).toBe('Test Product');

      // Second request - should hit cache
      const startTime2 = Date.now();
      const result2 = await webScrapingService.scrapeUrl(testUrl);
      const endTime2 = Date.now();

      expect(result2.html).toBe(mockHtml);
      expect(result2.title).toBe('Test Product');

      // Cache hit should be significantly faster
      const firstRequestTime = endTime1 - startTime1;
      const secondRequestTime = endTime2 - startTime2;
      
      expect(secondRequestTime).toBeLessThan(firstRequestTime / 2);

      // Verify cache was used
      expect(await webContentCache.has(testUrl)).toBe(true);
    });

    it('should track performance metrics for web scraping', async () => {
      const mockAxios = await import('axios');
      (mockAxios.default.create as any)().get.mockResolvedValue({
        data: '<html><title>Test</title></html>',
        status: 200
      });

      const testUrl = 'https://www.ebay.com/itm/123456789';
      
      // Make multiple requests
      await webScrapingService.scrapeUrl(testUrl);
      await webScrapingService.scrapeUrl(testUrl);
      await webScrapingService.scrapeUrl(testUrl);

      const stats = performanceMonitor.getStats('web-scraping');
      
      expect(stats).toBeDefined();
      expect(stats!.totalOperations).toBe(3);
      expect(stats!.averageDuration).toBeGreaterThan(0);
      expect(stats!.errorRate).toBe(0);
    });
  });

  describe('Image Validation Performance', () => {
    it('should cache image validation results', async () => {
      const mockAxios = await import('axios');
      const mockHead = mockAxios.default.head as any;
      
      mockHead.mockResolvedValue({
        status: 200,
        headers: { 'content-type': 'image/jpeg' }
      });

      const testImages = [
        { url: 'https://example.com/image1.jpg', altText: 'Image 1', size: 'large' as const, isValid: false },
        { url: 'https://example.com/image2.jpg', altText: 'Image 2', size: 'large' as const, isValid: false },
        { url: 'https://example.com/image3.jpg', altText: 'Image 3', size: 'large' as const, isValid: false }
      ];

      // First validation - should hit the network
      const startTime1 = Date.now();
      const result1 = await productExtractor.validateImageUrls(testImages);
      const endTime1 = Date.now();

      expect(result1).toHaveLength(3);
      expect(result1.every(img => img.isValid)).toBe(true);

      // Second validation - should hit cache
      const startTime2 = Date.now();
      const result2 = await productExtractor.validateImageUrls(testImages);
      const endTime2 = Date.now();

      expect(result2).toHaveLength(3);
      expect(result2.every(img => img.isValid)).toBe(true);

      // Cache hit should be faster
      const firstValidationTime = endTime1 - startTime1;
      const secondValidationTime = endTime2 - startTime2;
      
      expect(secondValidationTime).toBeLessThan(firstValidationTime / 2);

      // Verify cache was used
      for (const image of testImages) {
        expect(await imageValidationCache.has(image.url)).toBe(true);
      }
    });

    it('should process image validation in parallel', async () => {
      const mockAxios = await import('axios');
      const mockHead = mockAxios.default.head as any;
      
      let concurrentRequests = 0;
      let maxConcurrent = 0;

      mockHead.mockImplementation(async () => {
        concurrentRequests++;
        maxConcurrent = Math.max(maxConcurrent, concurrentRequests);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        concurrentRequests--;
        return {
          status: 200,
          headers: { 'content-type': 'image/jpeg' }
        };
      });

      const testImages = Array.from({ length: 10 }, (_, i) => ({
        url: `https://example.com/image${i}.jpg`,
        altText: `Image ${i}`,
        size: 'large' as const,
        isValid: false
      }));

      const startTime = Date.now();
      await productExtractor.validateImageUrls(testImages);
      const endTime = Date.now();

      // Should have processed multiple images concurrently
      expect(maxConcurrent).toBeGreaterThan(1);
      expect(maxConcurrent).toBeLessThanOrEqual(5); // Max concurrency limit

      // Should be faster than sequential processing
      const elapsed = endTime - startTime;
      expect(elapsed).toBeLessThan(1000); // Much less than 10 * 100ms
    });
  });

  describe('Market Research Performance', () => {
    it('should cache research data', async () => {
      const testProduct = {
        title: 'Test Product',
        description: 'Test description',
        price: 100,
        condition: 'New',
        images: [],
        specifications: {},
        seller: 'test-seller',
        location: 'Test Location'
      };

      // First research - should perform actual research
      const startTime1 = Date.now();
      const result1 = await marketResearchEngine.conductResearch(testProduct);
      const endTime1 = Date.now();

      expect(result1.similarListings).toBeDefined();
      expect(result1.priceAnalysis).toBeDefined();
      expect(result1.keywordAnalysis).toBeDefined();
      expect(result1.marketTrends).toBeDefined();

      // Second research - should hit cache
      const startTime2 = Date.now();
      const result2 = await marketResearchEngine.conductResearch(testProduct);
      const endTime2 = Date.now();

      expect(result2).toEqual(result1);

      // Cache hit should be faster
      const firstResearchTime = endTime1 - startTime1;
      const secondResearchTime = endTime2 - startTime2;
      
      expect(secondResearchTime).toBeLessThan(firstResearchTime / 2);

      // Verify cache was used
      const cacheKey = {
        title: testProduct.title,
        condition: testProduct.condition,
        price: testProduct.price
      };
      expect(await researchDataCache.has(cacheKey)).toBe(true);
    });

    it('should track performance metrics for market research', async () => {
      const testProduct = {
        title: 'Test Product',
        description: 'Test description',
        price: 100,
        condition: 'New',
        images: [],
        specifications: {},
        seller: 'test-seller',
        location: 'Test Location'
      };

      // Make multiple research requests
      await marketResearchEngine.conductResearch(testProduct);
      await marketResearchEngine.conductResearch(testProduct);

      const stats = performanceMonitor.getStats('market-research');
      
      expect(stats).toBeDefined();
      expect(stats!.totalOperations).toBe(2);
      expect(stats!.averageDuration).toBeGreaterThan(0);
    });
  });

  describe('Memory Usage Monitoring', () => {
    it('should monitor memory usage during processing', async () => {
      const initialSnapshot = memoryMonitor.snapshot('initial');
      
      // Simulate some processing
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        data: 'x'.repeat(1000)
      }));

      const midSnapshot = memoryMonitor.snapshot('mid-processing');
      
      // Clear the data
      largeData.length = 0;
      
      const finalSnapshot = memoryMonitor.snapshot('final');

      expect(initialSnapshot.heapUsed).toBeDefined();
      expect(midSnapshot.heapUsed).toBeDefined();
      expect(finalSnapshot.heapUsed).toBeDefined();

      // Memory usage should have increased during processing
      expect(midSnapshot.heapUsed).toBeGreaterThan(initialSnapshot.heapUsed);
    });

    it('should detect memory trends', async () => {
      // Take multiple snapshots to establish a trend
      memoryMonitor.snapshot();
      
      // Simulate memory growth
      const data1 = new Array(1000).fill('data');
      memoryMonitor.snapshot();
      
      const data2 = new Array(1000).fill('more data');
      memoryMonitor.snapshot();

      const trend = memoryMonitor.getTrend();
      
      expect(trend.averageGrowth).toBeDefined();
      
      // Clean up
      data1.length = 0;
      data2.length = 0;
    });
  });

  describe('End-to-End Performance', () => {
    it('should demonstrate performance improvements across the pipeline', async () => {
      const mockAxios = await import('axios');
      
      // Mock web scraping
      (mockAxios.default.create as any)().get.mockResolvedValue({
        data: `
          <html>
            <head><title>Test Product - Great Deal!</title></head>
            <body>
              <div class="price">$99.99</div>
              <div class="condition">New</div>
              <div class="description">Great product description</div>
              <img src="https://example.com/image1.jpg" />
              <img src="https://example.com/image2.jpg" />
            </body>
          </html>
        `,
        status: 200
      });

      // Mock image validation
      (mockAxios.default.head as any).mockResolvedValue({
        status: 200,
        headers: { 'content-type': 'image/jpeg' }
      });

      const testUrl = 'https://www.ebay.com/itm/123456789';

      // First complete pipeline run
      const startTime1 = Date.now();
      
      const webContent1 = await webScrapingService.scrapeUrl(testUrl);
      const productDetails1 = await productExtractor.extractProductDetails(webContent1);
      const researchData1 = await marketResearchEngine.conductResearch(productDetails1);
      
      const endTime1 = Date.now();

      // Second complete pipeline run (should benefit from caching)
      const startTime2 = Date.now();
      
      const webContent2 = await webScrapingService.scrapeUrl(testUrl);
      const productDetails2 = await productExtractor.extractProductDetails(webContent2);
      const researchData2 = await marketResearchEngine.conductResearch(productDetails2);
      
      const endTime2 = Date.now();

      // Verify results are consistent
      expect(webContent2.title).toBe(webContent1.title);
      expect(productDetails2.title).toBe(productDetails1.title);
      expect(researchData2.priceAnalysis.averagePrice).toBe(researchData1.priceAnalysis.averagePrice);

      // Second run should be significantly faster due to caching
      const firstRunTime = endTime1 - startTime1;
      const secondRunTime = endTime2 - startTime2;
      
      expect(secondRunTime).toBeLessThan(firstRunTime / 2);

      // Generate performance report
      const report = performanceMonitor.getReport();
      
      expect(report['web-scraping']).toBeDefined();
      expect(report['market-research']).toBeDefined();
      expect(report['image-validation']).toBeDefined();

      // All operations should have been tracked
      expect(report['web-scraping'].totalOperations).toBe(2);
      expect(report['market-research'].totalOperations).toBe(2);
    });
  });
});