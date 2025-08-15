// Tests for the main pipeline

import { describe, it, expect, vi } from 'vitest';
import { Pipeline, PipelineConfig } from './pipeline';
import { 
  WebScrapingService, 
  ProductExtractor, 
  MarketResearchEngine, 
  ContentOptimizer, 
  TemplateRenderer 
} from './services/interfaces';
import { WebpageContent, ProductDetails, ResearchData, OptimizedContent } from './models';

// Mock implementations for testing
const mockWebScraper: WebScrapingService = {
  scrapeUrl: vi.fn().mockResolvedValue({
    html: '<html>test</html>',
    title: 'Test Page',
    metadata: {},
    timestamp: new Date()
  } as WebpageContent)
};

const mockProductExtractor: ProductExtractor = {
  extractProductDetails: vi.fn().mockResolvedValue({
    title: 'Test Product',
    description: 'Test Description',
    price: 100,
    condition: 'New',
    images: [],
    specifications: {},
    seller: 'test-seller',
    location: 'Test Location'
  } as ProductDetails)
};

const mockMarketResearcher: MarketResearchEngine = {
  conductResearch: vi.fn().mockResolvedValue({
    similarListings: [],
    priceAnalysis: {
      averagePrice: 95,
      priceRange: { min: 80, max: 120 },
      recommendedPrice: 95,
      confidence: 0.8
    },
    keywordAnalysis: {
      popularKeywords: ['test', 'product'],
      keywordFrequency: { 'test': 10, 'product': 8 },
      searchVolume: { 'test': 1000, 'product': 800 }
    },
    marketTrends: []
  } as ResearchData)
};

const mockContentOptimizer: ContentOptimizer = {
  optimizeContent: vi.fn().mockResolvedValue({
    optimizedTitle: 'Optimized Test Product',
    optimizedDescription: 'Optimized Description',
    suggestedPrice: 95,
    keywords: ['test', 'product'],
    sellingPoints: ['Great quality', 'Fast shipping'],
    conditionNotes: 'Excellent condition'
  } as OptimizedContent)
};

const mockTemplateRenderer: TemplateRenderer = {
  renderTemplate: vi.fn().mockResolvedValue('<html>Rendered Template</html>')
};

describe('Pipeline', () => {
  const config: PipelineConfig = {
    webScraper: mockWebScraper,
    productExtractor: mockProductExtractor,
    marketResearcher: mockMarketResearcher,
    contentOptimizer: mockContentOptimizer,
    templateRenderer: mockTemplateRenderer
  };

  const pipeline = new Pipeline(config);

  it('should process a valid eBay URL successfully', async () => {
    const result = await pipeline.process(
      'https://www.ebay.com/itm/123456789',
      'template.html'
    );

    expect(result).toHaveProperty('originalDetails');
    expect(result).toHaveProperty('optimizedContent');
    expect(result).toHaveProperty('renderedHtml');
    expect(result.renderedHtml).toBe('<html>Rendered Template</html>');
  });

  it('should throw error for invalid eBay URL', async () => {
    await expect(
      pipeline.process('https://amazon.com/item/123', 'template.html')
    ).rejects.toThrow('Invalid eBay URL provided');
  });

  it('should call all services in correct order', async () => {
    await pipeline.process('https://www.ebay.com/itm/123456789', 'template.html');

    expect(mockWebScraper.scrapeUrl).toHaveBeenCalledWith('https://www.ebay.com/itm/123456789');
    expect(mockProductExtractor.extractProductDetails).toHaveBeenCalled();
    expect(mockMarketResearcher.conductResearch).toHaveBeenCalled();
    expect(mockContentOptimizer.optimizeContent).toHaveBeenCalled();
    expect(mockTemplateRenderer.renderTemplate).toHaveBeenCalled();
  });
});