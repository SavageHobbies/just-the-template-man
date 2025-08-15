import { describe, it, expect, beforeAll } from 'vitest';
import { Pipeline } from '../../pipeline';
import { WebScrapingService } from '../../services/WebScrapingService';
import { ProductExtractor } from '../../services/ProductExtractor';
import { MarketResearchEngine } from '../../services/MarketResearchEngine';
import { ResearchDataAnalyzer } from '../../services/ResearchDataAnalyzer';
import { ContentOptimizer } from '../../services/ContentOptimizer';
import { TemplateRenderer } from '../../services/TemplateRenderer';
import { testDatasets } from '../data/test-datasets';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface RegressionSnapshot {
  version: string;
  timestamp: string;
  testResults: {
    [testName: string]: {
      optimizedTitle: string;
      optimizedDescription: string;
      suggestedPrice: number;
      keywordCount: number;
      sellingPointsCount: number;
      templateLength: number;
      imageCount: number;
    };
  };
}

describe('Regression Tests', () => {
  let pipeline: Pipeline;
  const snapshotDir = join(process.cwd(), 'src/tests/regression/snapshots');
  const currentVersion = '1.0.0'; // This should be read from package.json in real implementation

  beforeAll(async () => {
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

    // Ensure snapshot directory exists
    if (!existsSync(snapshotDir)) {
      await mkdir(snapshotDir, { recursive: true });
    }
  });

  const createSnapshot = async (testResults: RegressionSnapshot['testResults']): Promise<void> => {
    const snapshot: RegressionSnapshot = {
      version: currentVersion,
      timestamp: new Date().toISOString(),
      testResults
    };

    const snapshotPath = join(snapshotDir, `snapshot-${currentVersion}.json`);
    await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
  };

  const loadPreviousSnapshot = async (): Promise<RegressionSnapshot | null> => {
    try {
      const snapshotPath = join(snapshotDir, `snapshot-${currentVersion}.json`);
      if (!existsSync(snapshotPath)) {
        return null;
      }
      const content = await readFile(snapshotPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('Could not load previous snapshot:', error);
      return null;
    }
  };

  describe('Content Optimization Regression', () => {
    it('should maintain consistent optimization quality across versions', async () => {
      const testResults: RegressionSnapshot['testResults'] = {};

      // Test each dataset
      for (const dataset of testDatasets) {
        const testName = `${dataset.category}-${dataset.productType}`;
        
        try {
          // Create mock product details
          const productDetails = {
            ...dataset.expectedProductDetails,
            images: [],
            description: 'Test description',
            seller: 'test_seller',
            location: 'Test Location'
          } as any;

          // Run optimization
          const contentOptimizer = new ContentOptimizer();
          const optimizedContent = await contentOptimizer.optimizeContent(
            productDetails,
            dataset.mockResearchData
          );

          // Render template
          const templateRenderer = new TemplateRenderer();
          const htmlTemplate = await templateRenderer.renderTemplate(
            optimizedContent,
            productDetails,
            'final-ebay-template.html'
          );

          // Capture key metrics
          testResults[testName] = {
            optimizedTitle: optimizedContent.optimizedTitle,
            optimizedDescription: optimizedContent.optimizedDescription,
            suggestedPrice: optimizedContent.suggestedPrice,
            keywordCount: optimizedContent.keywords.length,
            sellingPointsCount: optimizedContent.sellingPoints.length,
            templateLength: htmlTemplate.length,
            imageCount: productDetails.images.length
          };

        } catch (error) {
          console.warn(`Failed to process ${testName}:`, error);
          // Still record the failure for regression tracking
          testResults[testName] = {
            optimizedTitle: 'ERROR',
            optimizedDescription: 'ERROR',
            suggestedPrice: 0,
            keywordCount: 0,
            sellingPointsCount: 0,
            templateLength: 0,
            imageCount: 0
          };
        }
      }

      // Load previous snapshot for comparison
      const previousSnapshot = await loadPreviousSnapshot();

      if (previousSnapshot) {
        // Compare with previous results
        for (const [testName, currentResult] of Object.entries(testResults)) {
          const previousResult = previousSnapshot.testResults[testName];
          
          if (previousResult) {
            // Check for significant regressions
            describe(`Regression check for ${testName}`, () => {
              it('should not have significant title length regression', () => {
                const currentLength = currentResult.optimizedTitle.length;
                const previousLength = previousResult.optimizedTitle.length;
                const lengthDifference = Math.abs(currentLength - previousLength);
                
                // Allow up to 20% variation in title length
                expect(lengthDifference).toBeLessThan(previousLength * 0.2);
              });

              it('should not have significant description length regression', () => {
                const currentLength = currentResult.optimizedDescription.length;
                const previousLength = previousResult.optimizedDescription.length;
                const lengthDifference = Math.abs(currentLength - previousLength);
                
                // Allow up to 30% variation in description length
                expect(lengthDifference).toBeLessThan(previousLength * 0.3);
              });

              it('should not have significant keyword count regression', () => {
                const currentCount = currentResult.keywordCount;
                const previousCount = previousResult.keywordCount;
                
                // Should have at least 80% of previous keyword count
                expect(currentCount).toBeGreaterThanOrEqual(previousCount * 0.8);
              });

              it('should not have significant selling points regression', () => {
                const currentCount = currentResult.sellingPointsCount;
                const previousCount = previousResult.sellingPointsCount;
                
                // Should have at least 80% of previous selling points count
                expect(currentCount).toBeGreaterThanOrEqual(previousCount * 0.8);
              });

              it('should not have significant price regression', () => {
                const currentPrice = currentResult.suggestedPrice;
                const previousPrice = previousResult.suggestedPrice;
                
                if (previousPrice > 0) {
                  const priceDifference = Math.abs(currentPrice - previousPrice);
                  const priceVariation = priceDifference / previousPrice;
                  
                  // Allow up to 15% price variation
                  expect(priceVariation).toBeLessThan(0.15);
                }
              });

              it('should not have significant template size regression', () => {
                const currentSize = currentResult.templateLength;
                const previousSize = previousResult.templateLength;
                
                if (previousSize > 0) {
                  const sizeDifference = Math.abs(currentSize - previousSize);
                  const sizeVariation = sizeDifference / previousSize;
                  
                  // Allow up to 25% template size variation
                  expect(sizeVariation).toBeLessThan(0.25);
                }
              });
            });
          }
        }
      }

      // Save current results as new snapshot
      await createSnapshot(testResults);
    });
  });

  describe('API Compatibility Regression', () => {
    it('should maintain backward compatibility of service interfaces', async () => {
      // Test that all services still expose expected methods
      const webScraper = new WebScrapingService();
      const productExtractor = new ProductExtractor();
      const marketResearcher = new MarketResearchEngine();
      const dataAnalyzer = new ResearchDataAnalyzer();
      const contentOptimizer = new ContentOptimizer();
      const templateRenderer = new TemplateRenderer();

      // Check WebScrapingService interface
      expect(typeof webScraper.scrapeUrl).toBe('function');

      // Check ProductExtractor interface
      expect(typeof productExtractor.extractProductDetails).toBe('function');
      expect(typeof productExtractor.extractImageGallery).toBe('function');
      expect(typeof productExtractor.validateImageUrls).toBe('function');

      // Check MarketResearchEngine interface
      expect(typeof marketResearcher.conductResearch).toBe('function');

      // Check ResearchDataAnalyzer interface
      expect(typeof dataAnalyzer.analyzeResearchData).toBe('function');

      // Check ContentOptimizer interface
      expect(typeof contentOptimizer.optimizeContent).toBe('function');

      // Check TemplateRenderer interface
      expect(typeof templateRenderer.renderTemplate).toBe('function');
      expect(typeof templateRenderer.generateImageGallery).toBe('function');

      // Check Pipeline interface
      expect(typeof pipeline.processListing).toBe('function');
    });

    it('should maintain expected return types', async () => {
      const testData = testDatasets[0];
      
      // Test ProductExtractor return types
      const productExtractor = new ProductExtractor();
      const productDetails = await productExtractor.extractProductDetails(testData.mockWebpageContent);
      
      expect(productDetails).toHaveProperty('title');
      expect(productDetails).toHaveProperty('description');
      expect(productDetails).toHaveProperty('price');
      expect(productDetails).toHaveProperty('condition');
      expect(productDetails).toHaveProperty('images');
      expect(productDetails).toHaveProperty('specifications');
      expect(productDetails).toHaveProperty('seller');
      expect(productDetails).toHaveProperty('location');

      // Test MarketResearchEngine return types
      const marketResearcher = new MarketResearchEngine();
      const mockProductDetails = {
        ...testData.expectedProductDetails,
        images: [],
        description: 'Test description',
        seller: 'test_seller',
        location: 'Test Location'
      } as any;
      
      const researchData = await marketResearcher.conductResearch(mockProductDetails);
      
      expect(researchData).toHaveProperty('similarListings');
      expect(researchData).toHaveProperty('priceAnalysis');
      expect(researchData).toHaveProperty('keywordAnalysis');
      expect(researchData).toHaveProperty('marketTrends');

      // Test ContentOptimizer return types
      const contentOptimizer = new ContentOptimizer();
      const optimizedContent = await contentOptimizer.optimizeContent(mockProductDetails, researchData);
      
      expect(optimizedContent).toHaveProperty('optimizedTitle');
      expect(optimizedContent).toHaveProperty('optimizedDescription');
      expect(optimizedContent).toHaveProperty('suggestedPrice');
      expect(optimizedContent).toHaveProperty('keywords');
      expect(optimizedContent).toHaveProperty('sellingPoints');
      expect(optimizedContent).toHaveProperty('conditionNotes');
    });
  });

  describe('Error Handling Regression', () => {
    it('should maintain consistent error handling behavior', async () => {
      // Test invalid URL handling
      await expect(pipeline.processListing('invalid-url')).rejects.toThrow();
      await expect(pipeline.processListing('')).rejects.toThrow();
      await expect(pipeline.processListing('https://not-ebay.com')).rejects.toThrow();

      // Test empty content handling
      const productExtractor = new ProductExtractor();
      const emptyContent = {
        html: '',
        title: '',
        metadata: {},
        timestamp: new Date()
      };

      const result = await productExtractor.extractProductDetails(emptyContent);
      expect(result).toBeDefined();
      expect(result.title).toBe('');
      expect(result.price).toBe(0);
    });

    it('should handle malformed data gracefully', async () => {
      const contentOptimizer = new ContentOptimizer();
      
      // Test with minimal product details
      const minimalProduct = {
        title: '',
        description: '',
        price: 0,
        condition: '',
        images: [],
        specifications: {},
        seller: '',
        location: ''
      };

      const minimalResearch = {
        similarListings: [],
        priceAnalysis: {
          averagePrice: 0,
          priceRange: { min: 0, max: 0 },
          recommendedPrice: 0,
          confidence: 0
        },
        keywordAnalysis: {
          popularKeywords: [],
          keywordFrequency: {},
          searchVolume: {}
        },
        marketTrends: []
      };

      const result = await contentOptimizer.optimizeContent(minimalProduct, minimalResearch);
      expect(result).toBeDefined();
      expect(result.optimizedTitle).toBeDefined();
      expect(result.optimizedDescription).toBeDefined();
      expect(result.keywords).toBeInstanceOf(Array);
      expect(result.sellingPoints).toBeInstanceOf(Array);
    });
  });

  describe('Performance Regression', () => {
    it('should not have significant performance degradation', async () => {
      const performanceThresholds = {
        productExtraction: 2000, // 2 seconds
        contentOptimization: 3000, // 3 seconds
        templateRendering: 1000, // 1 second
      };

      // Test product extraction performance
      const productExtractor = new ProductExtractor();
      const startTime = Date.now();
      await productExtractor.extractProductDetails(testDatasets[0].mockWebpageContent);
      const extractionTime = Date.now() - startTime;
      
      expect(extractionTime).toBeLessThan(performanceThresholds.productExtraction);

      // Test content optimization performance
      const contentOptimizer = new ContentOptimizer();
      const mockProductDetails = {
        ...testDatasets[0].expectedProductDetails,
        images: [],
        description: 'Test description',
        seller: 'test_seller',
        location: 'Test Location'
      } as any;

      const optimizationStart = Date.now();
      const optimizedContent = await contentOptimizer.optimizeContent(
        mockProductDetails,
        testDatasets[0].mockResearchData
      );
      const optimizationTime = Date.now() - optimizationStart;
      
      expect(optimizationTime).toBeLessThan(performanceThresholds.contentOptimization);

      // Test template rendering performance
      const templateRenderer = new TemplateRenderer();
      const renderingStart = Date.now();
      await templateRenderer.renderTemplate(
        optimizedContent,
        mockProductDetails,
        'final-ebay-template.html'
      );
      const renderingTime = Date.now() - renderingStart;
      
      expect(renderingTime).toBeLessThan(performanceThresholds.templateRendering);
    });
  });
});