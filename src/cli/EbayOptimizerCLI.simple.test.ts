import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external dependencies before importing the CLI
vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  existsSync: vi.fn().mockReturnValue(false)
}));

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({ viewHtml: false, confirmSave: true })
  }
}));

vi.mock('../pipeline', () => ({
  Pipeline: vi.fn().mockImplementation(() => ({
    process: vi.fn().mockResolvedValue({
      originalDetails: {
        title: 'Test Product',
        price: 99.99,
        condition: 'New',
        images: [],
        description: 'Test description',
        specifications: {},
        seller: 'testseller',
        location: 'Test Location'
      },
      optimizedContent: {
        optimizedTitle: 'Optimized Test Product',
        suggestedPrice: 89.99,
        keywords: ['test'],
        sellingPoints: ['Quality'],
        optimizedDescription: 'Optimized description',
        conditionNotes: 'Good'
      },
      renderedHtml: '<html><body>Test</body></html>'
    })
  }))
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
  isValidEbayUrl: vi.fn().mockReturnValue(true)
}));

// Mock console to suppress output during tests
const originalConsole = console;
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
};

describe('EbayOptimizerCLI Core Functionality', () => {
  let EbayOptimizerCLI: any;
  let cli: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Replace console with mocked version
    Object.assign(console, mockConsole);
    
    // Import CLI after all mocks are set up
    const cliModule = await import('./EbayOptimizerCLI');
    EbayOptimizerCLI = cliModule.EbayOptimizerCLI;
    cli = new EbayOptimizerCLI();
  });

  afterEach(() => {
    // Restore original console
    Object.assign(console, originalConsole);
  });

  it('should create CLI instance successfully', () => {
    expect(cli).toBeDefined();
    expect(typeof cli.optimize).toBe('function');
    expect(typeof cli.validateUrl).toBe('function');
  });

  it('should have proper pipeline configuration', () => {
    expect(cli).toHaveProperty('pipeline');
  });

  it('should validate URLs using isValidEbayUrl utility', async () => {
    const { isValidEbayUrl } = await import('../utils');
    
    await cli.validateUrl('https://www.ebay.com/itm/123456789');
    
    expect(isValidEbayUrl).toHaveBeenCalledWith('https://www.ebay.com/itm/123456789');
  });

  it('should call pipeline.process with correct parameters', async () => {
    const { Pipeline } = await import('../pipeline');
    const mockPipelineInstance = (Pipeline as any).mock.results[0].value;
    
    await cli.optimize('https://www.ebay.com/itm/123456789', {
      template: 'test-template.html',
      interactive: false
    });
    
    expect(mockPipelineInstance.process).toHaveBeenCalledWith(
      'https://www.ebay.com/itm/123456789',
      'test-template.html'
    );
  });

  it('should write files when optimization completes', async () => {
    const { writeFileSync } = await import('fs');
    
    await cli.optimize('https://www.ebay.com/itm/123456789', {
      output: 'test-output.html',
      interactive: false
    });
    
    expect(writeFileSync).toHaveBeenCalledWith(
      'test-output.html',
      '<html><body>Test</body></html>',
      'utf8'
    );
    
    expect(writeFileSync).toHaveBeenCalledWith(
      'test-output-summary.txt',
      expect.stringContaining('eBay Listing Optimization Summary'),
      'utf8'
    );
  });

  it('should use default options when none provided', async () => {
    const { Pipeline } = await import('../pipeline');
    const mockPipelineInstance = (Pipeline as any).mock.results[0].value;
    
    await cli.optimize('https://www.ebay.com/itm/123456789', {});
    
    expect(mockPipelineInstance.process).toHaveBeenCalledWith(
      'https://www.ebay.com/itm/123456789',
      'final-ebay-template.html'
    );
  });

  it('should generate summary with correct content', async () => {
    const mockResult = {
      originalDetails: {
        title: 'Test Product',
        price: 99.99,
        condition: 'New',
        images: [{ url: 'test.jpg', altText: 'Test', size: 'large', isValid: true }],
        description: 'Test description',
        specifications: { brand: 'TestBrand' },
        seller: 'testseller',
        location: 'Test Location'
      },
      optimizedContent: {
        optimizedTitle: 'Optimized Test Product',
        suggestedPrice: 89.99,
        keywords: ['test', 'product'],
        sellingPoints: ['Quality', 'Value'],
        optimizedDescription: 'Optimized description',
        conditionNotes: 'Good condition'
      },
      renderedHtml: '<html><body>Test</body></html>'
    };

    const summary = (cli as any).generateSummary(mockResult);

    expect(summary).toContain('eBay Listing Optimization Summary');
    expect(summary).toContain('Test Product');
    expect(summary).toContain('$99.99');
    expect(summary).toContain('$89.99');
    expect(summary).toContain('test, product');
    expect(summary).toContain('Quality, Value');
    expect(summary).toContain('NEXT STEPS:');
  });
});