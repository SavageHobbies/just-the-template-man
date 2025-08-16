import { describe, it, expect, beforeEach } from 'vitest';
import { ContentOptimizer } from './ContentOptimizer';
import { ProductDetails, ResearchData } from '../models';

describe('ContentOptimizer', () => {
  let optimizer: ContentOptimizer;
  let mockProductDetails: ProductDetails;
  let mockResearchData: ResearchData;

  beforeEach(() => {
    optimizer = new ContentOptimizer();
    
    mockProductDetails = {
      title: 'Apple iPhone 13 Pro Max 128GB Blue Unlocked',
      description: 'Brand new iPhone 13 Pro Max in stunning blue color. Features advanced camera system, A15 Bionic chip, and all-day battery life. Perfect for photography enthusiasts.',
      price: 899.99,
      condition: 'New',
      images: [
        { url: 'https://example.com/image1.jpg', size: 'large', isValid: true },
        { url: 'https://example.com/image2.jpg', size: 'medium', isValid: true }
      ],
      specifications: {
        'Storage': '128GB',
        'Color': 'Blue',
        'Carrier': 'Unlocked',
        'Warranty': '1 Year Apple Warranty'
      },
      seller: 'TechStore123',
      location: 'California, USA'
    };

    mockResearchData = {
      similarListings: [
        { title: 'iPhone 13 Pro Max 128GB', price: 950.00, condition: 'New', platform: 'eBay' },
        { title: 'Apple iPhone 13 Pro Max Blue', price: 920.00, condition: 'New', platform: 'Amazon' },
        { title: 'iPhone 13 Pro Max Unlocked', price: 880.00, condition: 'Like New', platform: 'eBay' }
      ],
      priceAnalysis: {
        averagePrice: 916.67,
        priceRange: { min: 880.00, max: 950.00 },
        recommendedPrice: 925.00,
        confidence: 0.85
      },
      keywordAnalysis: {
        popularKeywords: ['iPhone', '13', 'Pro', 'Max', 'Apple', 'Unlocked', 'Blue', 'Camera'],
        keywordFrequency: {
          'iPhone': 15,
          '13': 12,
          'Pro': 10,
          'Max': 8,
          'Apple': 7,
          'Unlocked': 6,
          'Blue': 5,
          'Camera': 4
        },
        searchVolume: {
          'iPhone': 10000,
          '13': 8000,
          'Pro': 6000,
          'Max': 5000,
          'Apple': 4000,
          'Unlocked': 3000,
          'Blue': 2000,
          'Camera': 1500
        }
      },
      marketTrends: [
        { period: '2024-01', averagePrice: 920.00, salesVolume: 150, trend: 'stable' }
      ]
    };
  });

  describe('Constructor and Basic Functionality', () => {
    it('should create ContentOptimizer instance', () => {
      expect(optimizer).toBeDefined();
      expect(optimizer).toBeInstanceOf(ContentOptimizer);
    });

    it('should have optimizeContent method', () => {
      expect(typeof optimizer.optimizeContent).toBe('function');
    });
  });

  describe('Input Validation', () => {
    it('should throw error when originalDetails is null', async () => {
      await expect(optimizer.optimizeContent(null as any, mockResearchData))
        .rejects.toThrow('Original product details are required');
    });

    it('should throw error when research data is null', async () => {
      await expect(optimizer.optimizeContent(mockProductDetails, null as any))
        .rejects.toThrow('Research data is required');
    });

    it('should throw error when product title is empty', async () => {
      const invalidProduct = { ...mockProductDetails, title: '' };
      await expect(optimizer.optimizeContent(invalidProduct, mockResearchData))
        .rejects.toThrow('Product title is required');
    });

    it('should throw error when product description is empty', async () => {
      const invalidProduct = { ...mockProductDetails, description: '' };
      await expect(optimizer.optimizeContent(invalidProduct, mockResearchData))
        .rejects.toThrow('Product description is required');
    });

    it('should throw error when keyword analysis is missing', async () => {
      const invalidResearch = { ...mockResearchData, keywordAnalysis: null as any };
      await expect(optimizer.optimizeContent(mockProductDetails, invalidResearch))
        .rejects.toThrow('Keyword analysis is required');
    });

    it('should throw error when price analysis is missing', async () => {
      const invalidResearch = { ...mockResearchData, priceAnalysis: null as any };
      await expect(optimizer.optimizeContent(mockProductDetails, invalidResearch))
        .rejects.toThrow('Price analysis is required');
    });
  });

  describe('Title Optimization', () => {
    it('should generate optimized title within character limit', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      expect(result.optimizedTitle).toBeDefined();
      expect(result.optimizedTitle.length).toBeLessThanOrEqual(80);
      expect(result.optimizedTitle.length).toBeGreaterThan(0);
    });

    it('should preserve core product information in optimized title', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      const originalWords = ['iPhone', '13', 'Pro', 'Max'];
      originalWords.forEach(word => {
        expect(result.optimizedTitle.toLowerCase()).toContain(word.toLowerCase());
      });
    });

    it('should incorporate high-value keywords when space allows', async () => {
      const shortTitleProduct = {
        ...mockProductDetails,
        title: 'iPhone 13 Pro Max'
      };
      
      const result = await optimizer.optimizeContent(shortTitleProduct, mockResearchData);
      
      // Should include some popular keywords from research
      const popularKeywords = mockResearchData.keywordAnalysis.popularKeywords;
      const hasAdditionalKeywords = popularKeywords.some(keyword => 
        result.optimizedTitle.toLowerCase().includes(keyword.toLowerCase()) &&
        !shortTitleProduct.title.toLowerCase().includes(keyword.toLowerCase())
      );
      
      expect(hasAdditionalKeywords).toBe(true);
    });

    it('should properly capitalize title words', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      // First word should be capitalized
      expect(result.optimizedTitle.charAt(0)).toMatch(/[A-Z]/);
      
      // Should not have all caps (unless it's an acronym)
      const words = result.optimizedTitle.split(' ');
      const hasProperCapitalization = words.some(word => 
        word.length > 1 && word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() === word
      );
      expect(hasProperCapitalization).toBe(true);
    });
  });

  describe('Description Optimization', () => {
    it('should generate optimized description with appropriate length', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      expect(result.optimizedDescription).toBeDefined();
      expect(result.optimizedDescription.length).toBeGreaterThanOrEqual(200);
      expect(result.optimizedDescription.length).toBeLessThanOrEqual(1000);
    });

    it('should include key features and benefits', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      expect(result.optimizedDescription).toContain('Features');
      expect(result.optimizedDescription).toContain('Benefits');
    });


    it('should include competitive advantages', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      // Should mention competitive aspects
      const competitiveTerms = ['competitive', 'value', 'shipping', 'guarantee'];
      const hasCompetitiveContent = competitiveTerms.some(term => 
        result.optimizedDescription.toLowerCase().includes(term)
      );
      expect(hasCompetitiveContent).toBe(true);
    });

    it('should expand short descriptions to meet minimum length', async () => {
      const shortDescProduct = {
        ...mockProductDetails,
        description: 'iPhone for sale.'
      };
      
      const result = await optimizer.optimizeContent(shortDescProduct, mockResearchData);
      
      expect(result.optimizedDescription.length).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Price Optimization', () => {
    it('should calculate suggested price based on market data', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      expect(result.suggestedPrice).toBeDefined();
      expect(typeof result.suggestedPrice).toBe('number');
      expect(result.suggestedPrice).toBeGreaterThan(0);
    });

    it('should suggest price within reasonable range of market average', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      const marketAverage = mockResearchData.priceAnalysis.averagePrice;
      const maxReasonablePrice = marketAverage * 1.5;
      const minReasonablePrice = marketAverage * 0.5;
      
      expect(result.suggestedPrice).toBeGreaterThanOrEqual(minReasonablePrice);
      expect(result.suggestedPrice).toBeLessThanOrEqual(maxReasonablePrice);
    });

    it('should be more conservative with low confidence data', async () => {
      const lowConfidenceResearch = {
        ...mockResearchData,
        priceAnalysis: {
          ...mockResearchData.priceAnalysis,
          confidence: 0.5,
          recommendedPrice: 1200.00 // Much higher than original
        }
      };
      
      const result = await optimizer.optimizeContent(mockProductDetails, lowConfidenceResearch);
      
      // Should be closer to original price due to low confidence
      const originalPrice = mockProductDetails.price;
      const priceChange = Math.abs(result.suggestedPrice - originalPrice) / originalPrice;
      expect(priceChange).toBeLessThan(0.3); // Less than 30% change
    });

    it('should round price to reasonable precision', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      // Should have at most 2 decimal places
      const decimalPlaces = (result.suggestedPrice.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe('Keyword Extraction', () => {
    it('should extract relevant keywords from research data', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      expect(result.keywords).toBeDefined();
      expect(Array.isArray(result.keywords)).toBe(true);
      expect(result.keywords.length).toBeGreaterThan(0);
      expect(result.keywords.length).toBeLessThanOrEqual(8);
    });

    it('should prioritize high-frequency keywords', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      // Top keywords from mock data should be included
      const topKeywords = ['iPhone', '13', 'Pro', 'Max'];
      const includedTopKeywords = topKeywords.filter(keyword => 
        result.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))
      );
      
      expect(includedTopKeywords.length).toBeGreaterThan(0);
    });
  });

  describe('Selling Points Generation', () => {
    it('should generate relevant selling points', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      expect(result.sellingPoints).toBeDefined();
      expect(Array.isArray(result.sellingPoints)).toBe(true);
      expect(result.sellingPoints.length).toBeGreaterThan(0);
      expect(result.sellingPoints.length).toBeLessThanOrEqual(6);
    });

    it('should include price-based selling points for good deals', async () => {
      const goodDealProduct = {
        ...mockProductDetails,
        price: 800.00 // Below market average
      };
      
      const result = await optimizer.optimizeContent(goodDealProduct, mockResearchData);
      
      const hasPriceSellingPoint = result.sellingPoints.some(point => 
        point.toLowerCase().includes('value') || 
        point.toLowerCase().includes('price') ||
        point.toLowerCase().includes('below market')
      );
      
      expect(hasPriceSellingPoint).toBe(true);
    });

    it('should include condition-based selling points', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      const hasConditionSellingPoint = result.sellingPoints.some(point => 
        point.toLowerCase().includes('new') || 
        point.toLowerCase().includes('condition') ||
        point.toLowerCase().includes('packaging')
      );
      
      expect(hasConditionSellingPoint).toBe(true);
    });
  });


  describe('Content Consistency Validation', () => {
    it('should maintain product identity in optimized title', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      // Core product words should be preserved
      const coreWords = ['iPhone', '13', 'Pro', 'Max'];
      coreWords.forEach(word => {
        expect(result.optimizedTitle.toLowerCase()).toContain(word.toLowerCase());
      });
    });

    it('should reject titles that deviate too much from original', async () => {
      // Mock a scenario where optimization would create inconsistent title
      const extremeResearch = {
        ...mockResearchData,
        keywordAnalysis: {
          ...mockResearchData.keywordAnalysis,
          popularKeywords: ['Samsung', 'Galaxy', 'Android', 'Tablet', 'Laptop']
        }
      };
      
      // This should not throw because the implementation should maintain core product identity
      const result = await optimizer.optimizeContent(mockProductDetails, extremeResearch);
      expect(result.optimizedTitle.toLowerCase()).toContain('iphone');
    });

    it('should cap dramatic price changes to reasonable levels', async () => {
      const dramaticPriceResearch = {
        ...mockResearchData,
        priceAnalysis: {
          ...mockResearchData.priceAnalysis,
          recommendedPrice: 1200.00, // 33% increase from original 899.99
          averagePrice: 1100.00, // Average that supports the price
          confidence: 0.9
        }
      };
      
      // Should cap the price change to reasonable levels (within 50% of average)
      const result = await optimizer.optimizeContent(mockProductDetails, dramaticPriceResearch);
      const averagePrice = dramaticPriceResearch.priceAnalysis.averagePrice;
      
      // Price should be capped at 1.5x average price
      expect(result.suggestedPrice).toBeLessThanOrEqual(averagePrice * 1.5);
      expect(result.suggestedPrice).toBeGreaterThanOrEqual(averagePrice * 0.5);
      
      // And the change from original should be reasonable
      const priceChange = Math.abs(result.suggestedPrice - mockProductDetails.price) / mockProductDetails.price;
      expect(priceChange).toBeLessThanOrEqual(0.5);
    });

    it('should ensure optimized title meets length requirements', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      expect(result.optimizedTitle.length).toBeLessThanOrEqual(80);
      expect(result.optimizedTitle.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty similar listings gracefully', async () => {
      const noSimilarListingsResearch = {
        ...mockResearchData,
        similarListings: []
      };
      
      const result = await optimizer.optimizeContent(mockProductDetails, noSimilarListingsResearch);
      
      expect(result).toBeDefined();
      expect(result.optimizedTitle).toBeDefined();
      expect(result.optimizedDescription).toBeDefined();
    });

    it('should handle missing specifications gracefully', async () => {
      const noSpecsProduct = {
        ...mockProductDetails,
        specifications: {}
      };
      
      const result = await optimizer.optimizeContent(noSpecsProduct, mockResearchData);
      
      expect(result).toBeDefined();
      expect(result.optimizedDescription).toBeDefined();
    });

    it('should handle very long original titles', async () => {
      const longTitleProduct = {
        ...mockProductDetails,
        title: 'Apple iPhone 13 Pro Max 128GB Blue Unlocked Smartphone with Advanced Camera System and A15 Bionic Chip Perfect for Photography'
      };
      
      const result = await optimizer.optimizeContent(longTitleProduct, mockResearchData);
      
      expect(result.optimizedTitle.length).toBeLessThanOrEqual(80);
    });

    it('should handle minimal keyword data', async () => {
      const minimalKeywordResearch = {
        ...mockResearchData,
        keywordAnalysis: {
          popularKeywords: ['iPhone'],
          keywordFrequency: { 'iPhone': 1 },
          searchVolume: { 'iPhone': 100 }
        }
      };
      
      const result = await optimizer.optimizeContent(mockProductDetails, minimalKeywordResearch);
      
      expect(result).toBeDefined();
      expect(result.keywords.length).toBeGreaterThan(0);
    });
  });

  describe('Content Quality Metrics', () => {
    it('should generate content with good keyword density', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      // Check that important keywords appear in description
      const importantKeywords = ['iPhone', '13', 'Pro', 'Max'];
      const keywordAppearances = importantKeywords.filter(keyword => 
        result.optimizedDescription.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // Should include at least half of the important keywords
      expect(keywordAppearances.length).toBeGreaterThanOrEqual(Math.floor(importantKeywords.length * 0.5));
    });

    it('should create compelling and readable content', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      // Check for engaging language patterns
      const engagingPhrases = ['discover', 'perfect', 'exceptional', 'quality', 'guarantee'];
      const hasEngagingContent = engagingPhrases.some(phrase => 
        result.optimizedDescription.toLowerCase().includes(phrase)
      );
      
      expect(hasEngagingContent).toBe(true);
    });

    it('should structure content with proper formatting', async () => {
      const result = await optimizer.optimizeContent(mockProductDetails, mockResearchData);
      
      // Should have bullet points or structured sections
      const hasStructure = result.optimizedDescription.includes('•') || 
                          result.optimizedDescription.includes('\n\n') ||
                          result.optimizedDescription.includes(':');
      
      expect(hasStructure).toBe(true);
    });
  });
});
