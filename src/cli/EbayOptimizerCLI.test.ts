import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, existsSync } from 'fs';
import inquirer from 'inquirer';

// Mock all dependencies
vi.mock('fs');
vi.mock('inquirer');
vi.mock('../pipeline', () => ({
  Pipeline: vi.fn()
}));
vi.mock('../services/WebScrapingService', () => ({
  AxiosWebScrapingService: vi.fn().mockImplementation(() => ({}))
}));
vi.mock('../services/ProductExtractor', () => ({
  EbayProductExtractor: vi.fn().mockImplementation(() => ({}))
}));
vi.mock('../services/MarketResearchEngine', () => ({
  MarketResearchEngine: vi.fn().mockImplementation(() => ({}))
}));
vi.mock('../services/ContentOptimizer', () => ({
  ContentOptimizer: vi.fn().mockImplementation(() => ({}))
}));
vi.mock('../services/TemplateRenderer', () => ({
  TemplateRenderer: vi.fn().mockImplementation(() => ({}))
}));
vi.mock('../services/ResearchDataAnalyzer', () => ({
  ResearchDataAnalyzer: vi.fn().mockImplementation(() => ({}))
}));
vi.mock('../utils', () => ({
  isValidEbayUrl: vi.fn()
}));

// Mock console methods
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock process.exit
const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

describe('EbayOptimizerCLI', () => {
  let EbayOptimizerCLI: any;
  let cli: any;
  let mockPipeline: any;
  let mockIsValidEbayUrl: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock pipeline
    mockPipeline = {
      process: vi.fn().mockResolvedValue({
        originalDetails: {
          title: 'Test Product',
          price: 99.99,
          condition: 'New',
          images: [
            { url: 'http://example.com/image1.jpg', altText: 'Image 1', size: 'large', isValid: true },
            { url: 'http://example.com/image2.jpg', altText: 'Image 2', size: 'large', isValid: true }
          ],
          description: 'Test product description',
          specifications: { brand: 'TestBrand', model: 'TestModel' },
          seller: 'testseller',
          location: 'Test Location'
        },
        optimizedContent: {
          optimizedTitle: 'Optimized Test Product - Best Deal',
          suggestedPrice: 89.99,
          keywords: ['test', 'product', 'best'],
          sellingPoints: ['High quality', 'Fast shipping', 'Great value'],
          optimizedDescription: 'This is an optimized description for the test product.',
          conditionNotes: 'Excellent condition'
        },
        renderedHtml: '<html><body>Test HTML Template</body></html>'
      })
    };

    // Setup mocks
    const { Pipeline } = await import('../pipeline');
    (Pipeline as any).mockImplementation(() => mockPipeline);

    const { isValidEbayUrl } = await import('../utils');
    mockIsValidEbayUrl = isValidEbayUrl as any;

    // Import CLI after mocks are set up
    const cliModule = await import('./EbayOptimizerCLI');
    EbayOptimizerCLI = cliModule.EbayOptimizerCLI;
    cli = new EbayOptimizerCLI();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateUrl', () => {
    it('should validate a correct eBay URL', async () => {
      const validUrl = 'https://www.ebay.com/itm/123456789';
      mockIsValidEbayUrl.mockReturnValue(true);

      await cli.validateUrl(validUrl);

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔍 URL Validation'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('✅ Valid eBay URL'));
    });

    it('should reject an invalid URL', async () => {
      const invalidUrl = 'https://amazon.com/invalid';
      mockIsValidEbayUrl.mockReturnValue(false);

      await cli.validateUrl(invalidUrl);

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('❌ Invalid eBay URL'));
    });
  });

  describe('optimize', () => {
    const validUrl = 'https://www.ebay.com/itm/123456789';
    const options = {
      output: 'test-output.html',
      template: 'test-template.html',
      interactive: false
    };

    beforeEach(() => {
      mockIsValidEbayUrl.mockReturnValue(true);

      // Mock file system
      const mockExistsSync = existsSync as any;
      mockExistsSync.mockReturnValue(false);

      const mockWriteFileSync = writeFileSync as any;
      mockWriteFileSync.mockImplementation(() => {});
    });

    it('should successfully optimize a listing in non-interactive mode', async () => {
      await cli.optimize(validUrl, options);

      expect(mockPipeline.process).toHaveBeenCalledWith(validUrl, 'test-template.html');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🚀 eBay Listing Optimizer'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('✅ Optimization complete!'));
      expect(writeFileSync).toHaveBeenCalledWith('test-output.html', '<html><body>Test HTML Template</body></html>', 'utf8');
    });

    it('should handle invalid URLs gracefully', async () => {
      const invalidUrl = 'https://amazon.com/invalid';
      mockIsValidEbayUrl.mockReturnValue(false);

      await cli.optimize(invalidUrl, options);

      expect(mockPipeline.process).not.toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('❌ Invalid eBay URL'));
    });

    it('should handle pipeline errors gracefully', async () => {
      const error = new Error('Pipeline processing failed');
      mockPipeline.process.mockRejectedValue(error);

      try {
        await cli.optimize(validUrl, options);
      } catch (e) {
        expect(e).toEqual(new Error('process.exit called'));
      }

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('❌ Error during optimization:'));
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Pipeline processing failed'));
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should use default options when not provided', async () => {
      await cli.optimize(validUrl, {});

      expect(mockPipeline.process).toHaveBeenCalledWith(validUrl, 'final-ebay-template.html');
      expect(writeFileSync).toHaveBeenCalledWith('optimized-listing.html', expect.any(String), 'utf8');
    });

    it('should generate a summary file alongside the HTML', async () => {
      await cli.optimize(validUrl, options);

      expect(writeFileSync).toHaveBeenCalledWith('test-output.html', expect.any(String), 'utf8');
      expect(writeFileSync).toHaveBeenCalledWith('test-output-summary.txt', expect.stringContaining('eBay Listing Optimization Summary'), 'utf8');
    });
  });

  describe('interactive mode', () => {
    const validUrl = 'https://www.ebay.com/itm/123456789';
    const options = {
      output: 'test-output.html',
      template: 'test-template.html',
      interactive: true
    };

    beforeEach(() => {
      mockIsValidEbayUrl.mockReturnValue(true);

      // Mock file system
      const mockExistsSync = existsSync as any;
      mockExistsSync.mockReturnValue(false);

      const mockWriteFileSync = writeFileSync as any;
      mockWriteFileSync.mockImplementation(() => {});
    });

    it('should prompt user for HTML preview in interactive mode', async () => {
      const mockInquirer = inquirer as any;
      mockInquirer.prompt.mockResolvedValueOnce({ viewHtml: true });
      mockInquirer.prompt.mockResolvedValueOnce({ confirmSave: true });

      await cli.optimize(validUrl, options);

      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'viewHtml',
          message: 'Would you like to preview the generated HTML template?',
          default: false
        }
      ]);
    });

    it('should prompt for save confirmation in interactive mode', async () => {
      const mockInquirer = inquirer as any;
      mockInquirer.prompt.mockResolvedValueOnce({ viewHtml: false });
      mockInquirer.prompt.mockResolvedValueOnce({ confirmSave: true });

      await cli.optimize(validUrl, options);

      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'confirmSave',
          message: 'Save optimized HTML template to test-output.html?',
          default: true
        }
      ]);
    });

    it('should handle file overwrite prompts', async () => {
      const mockExistsSync = existsSync as any;
      mockExistsSync.mockReturnValue(true);

      const mockInquirer = inquirer as any;
      mockInquirer.prompt.mockResolvedValueOnce({ viewHtml: false });
      mockInquirer.prompt.mockResolvedValueOnce({ overwrite: false });
      mockInquirer.prompt.mockResolvedValueOnce({ newPath: 'new-output.html' });
      mockInquirer.prompt.mockResolvedValueOnce({ confirmSave: true });

      await cli.optimize(validUrl, options);

      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'File test-output.html already exists. Overwrite?',
          default: false
        }
      ]);

      expect(writeFileSync).toHaveBeenCalledWith('new-output.html', expect.any(String), 'utf8');
    });

    it('should skip saving if user declines', async () => {
      const mockInquirer = inquirer as any;
      mockInquirer.prompt.mockResolvedValueOnce({ viewHtml: false });
      mockInquirer.prompt.mockResolvedValueOnce({ confirmSave: false });

      await cli.optimize(validUrl, options);

      expect(writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('output formatting', () => {
    beforeEach(() => {
      mockIsValidEbayUrl.mockReturnValue(true);
    });

    it('should display product details correctly', async () => {
      const validUrl = 'https://www.ebay.com/itm/123456789';
      const options = { interactive: false };

      await cli.optimize(validUrl, options);

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📦 Original Product Details:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Title: Test Product'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Price: $99.99'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Condition: New'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Images: 2 found'));
    });

    it('should display optimized content correctly', async () => {
      const validUrl = 'https://www.ebay.com/itm/123456789';
      const options = { interactive: false };

      await cli.optimize(validUrl, options);

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('✨ Optimized Content:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Optimized Title: Optimized Test Product - Best Deal'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Suggested Price: $89.99'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Keywords: test, product, best'));
    });

    it('should truncate long descriptions in display', async () => {
      const longDescription = 'A'.repeat(200);
      mockPipeline.process.mockResolvedValue({
        originalDetails: {
          title: 'Test Product',
          price: 99.99,
          condition: 'New',
          images: [],
          description: longDescription,
          specifications: {},
          seller: 'testseller',
          location: 'Test Location'
        },
        optimizedContent: {
          optimizedTitle: 'Optimized Test Product',
          suggestedPrice: 89.99,
          keywords: ['test'],
          sellingPoints: ['High quality'],
          optimizedDescription: longDescription,
          conditionNotes: 'Good'
        },
        renderedHtml: '<html></html>'
      });

      const validUrl = 'https://www.ebay.com/itm/123456789';
      const options = { interactive: false };

      await cli.optimize(validUrl, options);

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('...'));
    });
  });
});