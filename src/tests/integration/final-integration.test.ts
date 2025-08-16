import { describe, it, expect, beforeEach } from 'vitest';
import { Pipeline } from '../../pipeline';
import { WebScrapingService } from '../../services/WebScrapingService';
import { ProductExtractor } from '../../services/ProductExtractor';
import { MarketResearchEngine } from '../../services/MarketResearchEngine';
import { ContentOptimizer } from '../../services/ContentOptimizer';
import { TemplateRenderer } from '../../services/TemplateRenderer';
import { ConfigurationService } from '../../services/ConfigurationService';
import { EbayOptimizerCLI } from '../../cli/EbayOptimizerCLI';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Final Integration Tests', () => {
  let pipeline: Pipeline;
  let configService: ConfigurationService;

  beforeEach(() => {
    configService = new ConfigurationService();
    const config = configService.getConfiguration();
    
    pipeline = new Pipeline({
      webScraper: new WebScrapingService(config.scraping),
      productExtractor: new ProductExtractor(config.extraction),
      marketResearcher: new MarketResearchEngine(config.research),
      contentOptimizer: new ContentOptimizer(config.optimization),
      templateRenderer: new TemplateRenderer(config.template)
    });
  });

  describe('Complete System Integration', () => {
    it('should process a complete eBay URL through the entire pipeline', async () => {
      const testUrl = 'https://www.ebay.com/itm/123456789';
      const templatePath = 'final-ebay-template.html';

      // Verify template exists
      expect(existsSync(templatePath)).toBe(true);

      const result = await pipeline.process(testUrl, templatePath);

      // Verify all components of the result
      expect(result.originalDetails).toBeDefined();
      expect(result.originalDetails.title).toBeTruthy();
      expect(result.originalDetails.price).toBeGreaterThan(0);
      expect(result.originalDetails.images).toBeInstanceOf(Array);

      expect(result.optimizedContent).toBeDefined();
      expect(result.optimizedContent.optimizedTitle).toBeTruthy();
      expect(result.optimizedContent.optimizedDescription).toBeTruthy();
      expect(result.optimizedContent.suggestedPrice).toBeGreaterThan(0);

      expect(result.renderedHtml).toBeTruthy();
      expect(result.renderedHtml).toContain('<!DOCTYPE html>');
      expect(result.renderedHtml).toContain(result.optimizedContent.optimizedTitle);
    }, 30000);

    it('should handle different product categories correctly', async () => {
      const testUrls = [
        'https://www.ebay.com/itm/electronics-123',
        'https://www.ebay.com/itm/clothing-456',
        'https://www.ebay.com/itm/collectibles-789'
      ];

      for (const url of testUrls) {
        const result = await pipeline.process(url, 'final-ebay-template.html');
        
        expect(result.originalDetails.title).toBeTruthy();
        expect(result.optimizedContent.keywords.length).toBeGreaterThan(0);
        expect(result.renderedHtml).toContain('<!DOCTYPE html>');
      }
    }, 60000);

    it('should maintain data consistency across pipeline stages', async () => {
      const testUrl = 'https://www.ebay.com/itm/consistency-test';
      const result = await pipeline.process(testUrl, 'final-ebay-template.html');

      // Verify original data is preserved
      expect(result.renderedHtml).toContain(result.originalDetails.condition);
      expect(result.renderedHtml).toContain(result.originalDetails.seller);
      
      // Verify optimized content is applied
      expect(result.renderedHtml).toContain(result.optimizedContent.optimizedTitle);
      expect(result.renderedHtml).toContain(result.optimizedContent.optimizedDescription);
      
      // Verify pricing consistency
      const priceInHtml = result.renderedHtml.match(/\$[\d,]+\.?\d*/);
      expect(priceInHtml).toBeTruthy();
    });
  });

  describe('CLI Integration', () => {
    it('should execute complete optimization through CLI interface', async () => {
      const cli = new EbayOptimizerCLI();
      const testUrl = 'https://www.ebay.com/itm/cli-test-123';
      
      // Mock console methods to capture output
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args) => {
        consoleLogs.push(args.join(' '));
        originalLog(...args);
      };

      try {
        await cli.optimize(testUrl, {
          output: 'test-output.html',
          template: 'final-ebay-template.html',
          interactive: false
        });

        // Verify CLI executed successfully
        expect(consoleLogs.some(log => log.includes('Optimization completed'))).toBe(true);
        expect(existsSync('test-output.html')).toBe(true);
        
        // Verify output file content
        const outputContent = readFileSync('test-output.html', 'utf-8');
        expect(outputContent).toContain('<!DOCTYPE html>');
        expect(outputContent).toContain('Top Rated eBay Seller');
        
      } finally {
        console.log = originalLog;
      }
    }, 30000);

    it('should validate URLs correctly through CLI', async () => {
      const cli = new EbayOptimizerCLI();
      
      // Test valid URL
      await expect(cli.validateUrl('https://www.ebay.com/itm/123456789')).resolves.not.toThrow();
      
      // Test invalid URL
      await expect(cli.validateUrl('https://amazon.com/invalid')).rejects.toThrow();
    });
  });

  describe('Configuration Integration', () => {
    it('should apply different configuration presets correctly', async () => {
      const presets = ['beginner', 'seller', 'power-user'];
      
      for (const preset of presets) {
        const config = configService.loadPreset(preset);
        const customPipeline = new Pipeline({
          webScraper: new WebScrapingService(config.scraping),
          productExtractor: new ProductExtractor(config.extraction),
          marketResearcher: new MarketResearchEngine(config.research),
          contentOptimizer: new ContentOptimizer(config.optimization),
          templateRenderer: new TemplateRenderer(config.template)
        });

        const result = await customPipeline.process(
          'https://www.ebay.com/itm/preset-test',
          'final-ebay-template.html'
        );

        expect(result.originalDetails).toBeDefined();
        expect(result.optimizedContent).toBeDefined();
        expect(result.renderedHtml).toBeTruthy();
      }
    }, 45000);

    it('should handle custom use-case configurations', async () => {
      const useCases = ['speed-focus', 'quality-focus', 'high-volume'];
      
      for (const useCase of useCases) {
        const config = configService.loadUseCase(useCase);
        const customPipeline = new Pipeline({
          webScraper: new WebScrapingService(config.scraping),
          productExtractor: new ProductExtractor(config.extraction),
          marketResearcher: new MarketResearchEngine(config.research),
          contentOptimizer: new ContentOptimizer(config.optimization),
          templateRenderer: new TemplateRenderer(config.template)
        });

        const result = await customPipeline.process(
          'https://www.ebay.com/itm/usecase-test',
          'final-ebay-template.html'
        );

        expect(result).toBeDefined();
        expect(result.renderedHtml).toContain('<!DOCTYPE html>');
      }
    }, 45000);
  });

  describe('Error Handling Integration', () => {
    it('should handle network failures gracefully', async () => {
      const invalidUrl = 'https://www.ebay.com/itm/nonexistent-999999999';
      
      await expect(pipeline.process(invalidUrl, 'final-ebay-template.html'))
        .rejects.toThrow();
    });

    it('should handle missing template files gracefully', async () => {
      const testUrl = 'https://www.ebay.com/itm/template-test';
      const nonexistentTemplate = 'nonexistent-template.html';
      
      await expect(pipeline.process(testUrl, nonexistentTemplate))
        .rejects.toThrow();
    });

    it('should provide meaningful error messages', async () => {
      try {
        await pipeline.process('invalid-url', 'final-ebay-template.html');
      } catch (error: any) {
        expect(error.message).toContain('Invalid eBay URL');
        expect(error.code).toBeDefined();
      }
    });
  });

  describe('Performance Integration', () => {
    it('should complete processing within acceptable time limits', async () => {
      const startTime = Date.now();
      const testUrl = 'https://www.ebay.com/itm/performance-test';
      
      await pipeline.process(testUrl, 'final-ebay-template.html');
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should handle concurrent processing requests', async () => {
      const urls = [
        'https://www.ebay.com/itm/concurrent-1',
        'https://www.ebay.com/itm/concurrent-2',
        'https://www.ebay.com/itm/concurrent-3'
      ];

      const promises = urls.map(url => 
        pipeline.process(url, 'final-ebay-template.html')
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.originalDetails).toBeDefined();
        expect(result.optimizedContent).toBeDefined();
        expect(result.renderedHtml).toBeTruthy();
      });
    }, 60000);
  });

  describe('Template Quality Integration', () => {
    it('should generate valid HTML templates', async () => {
      const testUrl = 'https://www.ebay.com/itm/html-validation';
      const result = await pipeline.process(testUrl, 'final-ebay-template.html');

      // Basic HTML validation
      expect(result.renderedHtml).toMatch(/^<!DOCTYPE html>/);
      expect(result.renderedHtml).toContain('<html');
      expect(result.renderedHtml).toContain('<head>');
      expect(result.renderedHtml).toContain('<body>');
      expect(result.renderedHtml).toContain('</html>');

      // Verify no unclosed tags (basic check)
      const openTags = (result.renderedHtml.match(/<[^/][^>]*>/g) || []).length;
      const closeTags = (result.renderedHtml.match(/<\/[^>]*>/g) || []).length;
      expect(Math.abs(openTags - closeTags)).toBeLessThan(10); // Allow some self-closing tags
    });

    it('should include all required template sections', async () => {
      const testUrl = 'https://www.ebay.com/itm/sections-test';
      const result = await pipeline.process(testUrl, 'final-ebay-template.html');

      const requiredSections = [
        'Product Description',
        'Item Specifics',
        'Image Gallery',
        'Top Rated eBay Seller'
      ];

      requiredSections.forEach(section => {
        expect(result.renderedHtml).toContain(section);
      });
    });

    it('should properly handle image galleries', async () => {
      const testUrl = 'https://www.ebay.com/itm/images-test';
      const result = await pipeline.process(testUrl, 'final-ebay-template.html');

      // Should contain image gallery section
      expect(result.renderedHtml).toContain('image-gallery');
      
      // Should have proper image tags
      const imageMatches = result.renderedHtml.match(/<img[^>]*src[^>]*>/gi);
      expect(imageMatches).toBeTruthy();
      expect(imageMatches!.length).toBeGreaterThan(0);
      expect(imageMatches!.length).toBeLessThanOrEqual(6); // Max 5 gallery + 1 main
    });
  });
});
