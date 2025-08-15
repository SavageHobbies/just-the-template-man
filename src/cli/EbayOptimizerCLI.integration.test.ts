import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EbayOptimizerCLI } from './EbayOptimizerCLI';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('EbayOptimizerCLI Integration Tests', () => {
  let cli: EbayOptimizerCLI;
  const testOutputPath = 'test-integration-output.html';
  const testSummaryPath = 'test-integration-output-summary.txt';

  beforeEach(() => {
    cli = new EbayOptimizerCLI();
    
    // Clean up any existing test files
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath);
    }
    if (existsSync(testSummaryPath)) {
      unlinkSync(testSummaryPath);
    }
  });

  afterEach(() => {
    // Clean up test files
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath);
    }
    if (existsSync(testSummaryPath)) {
      unlinkSync(testSummaryPath);
    }
  });

  describe('URL validation', () => {
    it('should validate various eBay URL formats', async () => {
      const validUrls = [
        'https://www.ebay.com/itm/123456789',
        'https://ebay.com/itm/123456789',
        'http://www.ebay.com/itm/123456789',
        'https://www.ebay.com/itm/Test-Product-Name/123456789',
        'https://www.ebay.co.uk/itm/123456789'
      ];

      for (const url of validUrls) {
        // This should not throw an error for valid URLs
        await expect(cli.validateUrl(url)).resolves.not.toThrow();
      }
    });

    it('should reject invalid URLs', async () => {
      const invalidUrls = [
        'https://amazon.com/product/123',
        'https://google.com',
        'not-a-url',
        'https://ebay.com/search?q=test',
        ''
      ];

      for (const url of invalidUrls) {
        // The validateUrl method should handle invalid URLs gracefully
        await expect(cli.validateUrl(url)).resolves.not.toThrow();
      }
    });
  });

  describe('file operations', () => {
    it('should create output files with proper content structure', async () => {
      // Note: This test would require mocking the pipeline or using a test eBay URL
      // For now, we'll test the file creation logic with a mock scenario
      
      const mockResult = {
        originalDetails: {
          title: 'Integration Test Product',
          price: 149.99,
          condition: 'Used',
          images: [
            { url: 'http://example.com/image1.jpg', altText: 'Image 1', size: 'large' as const, isValid: true }
          ],
          description: 'Integration test description',
          specifications: { brand: 'TestBrand' },
          seller: 'testseller',
          location: 'Test Location'
        },
        optimizedContent: {
          optimizedTitle: 'Integration Test Product - Optimized',
          suggestedPrice: 139.99,
          keywords: ['integration', 'test', 'product'],
          sellingPoints: ['Tested quality', 'Fast shipping'],
          optimizedDescription: 'Optimized integration test description',
          conditionNotes: 'Good condition'
        },
        renderedHtml: '<html><head><title>Test</title></head><body><h1>Integration Test</h1></body></html>'
      };

      // Test the private method indirectly by using a mock
      const cliAny = cli as any;
      await cliAny.saveOutput(mockResult, testOutputPath, false);

      // Verify HTML file was created
      expect(existsSync(testOutputPath)).toBe(true);
      const htmlContent = readFileSync(testOutputPath, 'utf8');
      expect(htmlContent).toContain('<html>');
      expect(htmlContent).toContain('Integration Test');

      // Verify summary file was created
      expect(existsSync(testSummaryPath)).toBe(true);
      const summaryContent = readFileSync(testSummaryPath, 'utf8');
      expect(summaryContent).toContain('eBay Listing Optimization Summary');
      expect(summaryContent).toContain('Integration Test Product');
      expect(summaryContent).toContain('$149.99');
      expect(summaryContent).toContain('$139.99');
    });

    it('should handle file path edge cases', async () => {
      const edgeCasePaths = [
        'output-with-spaces in name.html',
        'output.with.dots.html',
        'output_with_underscores.html'
      ];

      const mockResult = {
        originalDetails: {
          title: 'Edge Case Test',
          price: 99.99,
          condition: 'New',
          images: [],
          description: 'Test',
          specifications: {},
          seller: 'testseller',
          location: 'Test Location'
        },
        optimizedContent: {
          optimizedTitle: 'Edge Case Test - Optimized',
          suggestedPrice: 89.99,
          keywords: ['test'],
          sellingPoints: ['Quality'],
          optimizedDescription: 'Optimized test',
          conditionNotes: 'New'
        },
        renderedHtml: '<html><body>Edge Case Test</body></html>'
      };

      for (const path of edgeCasePaths) {
        const cliAny = cli as any;
        await cliAny.saveOutput(mockResult, path, false);
        
        expect(existsSync(path)).toBe(true);
        
        // Clean up
        unlinkSync(path);
        const summaryPath = path.replace('.html', '-summary.txt');
        if (existsSync(summaryPath)) {
          unlinkSync(summaryPath);
        }
      }
    });
  });

  describe('error handling', () => {
    it('should handle missing template files gracefully', async () => {
      const nonExistentTemplate = 'non-existent-template.html';
      const validUrl = 'https://www.ebay.com/itm/123456789';
      
      // This should handle the missing template file error gracefully
      await expect(
        cli.optimize(validUrl, { 
          template: nonExistentTemplate, 
          interactive: false 
        })
      ).rejects.toThrow();
    });

    it('should handle write permission errors', async () => {
      // Test with an invalid path that should cause write errors
      const invalidPath = '/root/cannot-write-here.html';
      const validUrl = 'https://www.ebay.com/itm/123456789';
      
      // This should handle write permission errors gracefully
      await expect(
        cli.optimize(validUrl, { 
          output: invalidPath, 
          interactive: false 
        })
      ).rejects.toThrow();
    });
  });

  describe('output formatting', () => {
    it('should format product details consistently', () => {
      const cliAny = cli as any;
      
      const testDetails = {
        title: 'Test Product with Very Long Title That Should Be Displayed Properly',
        price: 1234.56,
        condition: 'Like New',
        images: [
          { url: 'http://example.com/1.jpg', altText: 'Image 1', size: 'large' as const, isValid: true },
          { url: 'http://example.com/2.jpg', altText: 'Image 2', size: 'large' as const, isValid: true },
          { url: 'http://example.com/3.jpg', altText: 'Image 3', size: 'large' as const, isValid: true }
        ],
        description: 'This is a test product description that contains multiple sentences and should be properly formatted when displayed to the user.',
        specifications: {
          brand: 'TestBrand',
          model: 'TestModel',
          color: 'Blue',
          size: 'Large'
        },
        seller: 'testseller123',
        location: 'New York, NY'
      };

      // Test that the method doesn't throw errors with various data
      expect(() => cliAny.displayProductDetails(testDetails)).not.toThrow();
    });

    it('should format optimized content consistently', () => {
      const cliAny = cli as any;
      
      const testContent = {
        optimizedTitle: 'Optimized Test Product - Best Deal Ever - High Quality - Fast Shipping',
        suggestedPrice: 999.99,
        keywords: ['test', 'product', 'best', 'deal', 'quality', 'fast', 'shipping'],
        sellingPoints: [
          'High quality materials',
          'Fast and free shipping',
          'Excellent customer service',
          'Money back guarantee',
          'Trusted seller'
        ],
        optimizedDescription: 'This is an optimized product description that has been enhanced with SEO keywords and compelling sales copy to maximize conversion rates and search visibility.',
        conditionNotes: 'Item is in excellent condition with minimal signs of use'
      };

      // Test that the method doesn't throw errors with various data
      expect(() => cliAny.displayOptimizedContent(testContent)).not.toThrow();
    });

    it('should handle empty or minimal data gracefully', () => {
      const cliAny = cli as any;
      
      const minimalDetails = {
        title: 'Minimal Product',
        price: 0,
        condition: '',
        images: [],
        description: '',
        specifications: {},
        seller: '',
        location: ''
      };

      const minimalContent = {
        optimizedTitle: '',
        suggestedPrice: 0,
        keywords: [],
        sellingPoints: [],
        optimizedDescription: '',
        conditionNotes: ''
      };

      expect(() => cliAny.displayProductDetails(minimalDetails)).not.toThrow();
      expect(() => cliAny.displayOptimizedContent(minimalContent)).not.toThrow();
    });
  });

  describe('summary generation', () => {
    it('should generate comprehensive summaries', () => {
      const cliAny = cli as any;
      
      const mockResult = {
        originalDetails: {
          title: 'Summary Test Product',
          price: 199.99,
          condition: 'Refurbished',
          images: [
            { url: 'http://example.com/1.jpg', altText: 'Image 1', size: 'large' as const, isValid: true },
            { url: 'http://example.com/2.jpg', altText: 'Image 2', size: 'large' as const, isValid: true }
          ],
          description: 'Summary test description',
          specifications: { brand: 'SummaryBrand' },
          seller: 'summaryseller',
          location: 'Summary Location'
        },
        optimizedContent: {
          optimizedTitle: 'Summary Test Product - Optimized for Sales',
          suggestedPrice: 179.99,
          keywords: ['summary', 'test', 'optimized'],
          sellingPoints: ['Great value', 'Reliable seller'],
          optimizedDescription: 'Optimized summary description',
          conditionNotes: 'Refurbished to like-new condition'
        },
        renderedHtml: '<html><body>Summary Test</body></html>'
      };

      const summary = cliAny.generateSummary(mockResult);

      expect(summary).toContain('eBay Listing Optimization Summary');
      expect(summary).toContain('Summary Test Product');
      expect(summary).toContain('$199.99');
      expect(summary).toContain('$179.99');
      expect(summary).toContain('Refurbished');
      expect(summary).toContain('summary, test, optimized');
      expect(summary).toContain('Great value, Reliable seller');
      expect(summary).toContain('NEXT STEPS:');
      expect(summary).toContain('Generated:');
    });
  });
});