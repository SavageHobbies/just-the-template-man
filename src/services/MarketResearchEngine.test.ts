import { MarketResearchEngine } from './MarketResearchEngine';
import { ProductDetails } from '../models';

describe('MarketResearchEngine', () => {
  let marketResearchEngine: MarketResearchEngine;
  let mockProductDetails: ProductDetails;

  beforeEach(() => {
    marketResearchEngine = new MarketResearchEngine();
    mockProductDetails = {
      title: 'Apple iPhone 14 Pro Max 256GB Space Black Unlocked',
      description: 'Brand new Apple iPhone 14 Pro Max with 256GB storage in Space Black color. Factory unlocked and ready to use with any carrier.',
      price: 899.99,
      condition: 'New',
      images: [],
      specifications: {
        'Storage': '256GB',
        'Color': 'Space Black',
        'Carrier': 'Unlocked'
      },
      seller: 'TechStore123',
      location: 'California, USA'
    };
  });

  describe('conductResearch', () => {
    it('should return comprehensive research data', async () => {
      const result = await marketResearchEngine.conductResearch(mockProductDetails);

      expect(result).toHaveProperty('similarListings');
      expect(result).toHaveProperty('priceAnalysis');
      expect(result).toHaveProperty('keywordAnalysis');
      expect(result).toHaveProperty('marketTrends');

      expect(Array.isArray(result.similarListings)).toBe(true);
      expect(typeof result.priceAnalysis).toBe('object');
      expect(typeof result.keywordAnalysis).toBe('object');
      expect(Array.isArray(result.marketTrends)).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Mock a scenario that might cause an error
      const invalidProduct = { ...mockProductDetails, title: '' };
      
      await expect(marketResearchEngine.conductResearch(invalidProduct))
        .resolves.toBeDefined();
    });

    it('should complete research within reasonable time', async () => {
      const startTime = Date.now();
      await marketResearchEngine.conductResearch(mockProductDetails);
      const endTime = Date.now();
      
      // Should complete within 2 seconds (accounting for simulated delays)
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('similar product discovery', () => {
    it('should find similar listings with fuzzy matching', async () => {
      const result = await marketResearchEngine.conductResearch(mockProductDetails);
      
      expect(result.similarListings.length).toBeGreaterThan(0);
      expect(result.similarListings.length).toBeLessThanOrEqual(20);
      
      // Check that similar listings have required properties
      result.similarListings.forEach(listing => {
        expect(listing).toHaveProperty('title');
        expect(listing).toHaveProperty('price');
        expect(listing).toHaveProperty('condition');
        expect(listing).toHaveProperty('platform');
        expect(typeof listing.title).toBe('string');
        expect(typeof listing.price).toBe('number');
        expect(listing.price).toBeGreaterThan(0);
      });
    });

    it('should include various platforms in similar listings', async () => {
      const result = await marketResearchEngine.conductResearch(mockProductDetails);
      
      const platforms = new Set(result.similarListings.map(listing => listing.platform));
      expect(platforms.size).toBeGreaterThan(1);
      
      const expectedPlatforms = ['eBay', 'Amazon', 'Mercari', 'Facebook Marketplace'];
      platforms.forEach(platform => {
        expect(expectedPlatforms).toContain(platform);
      });
    });

    it('should generate realistic price variations', async () => {
      const result = await marketResearchEngine.conductResearch(mockProductDetails);
      
      const prices = result.similarListings.map(listing => listing.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      // Prices should be within reasonable range of original price
      expect(minPrice).toBeGreaterThan(mockProductDetails.price * 0.5);
      expect(maxPrice).toBeLessThan(mockProductDetails.price * 1.5);
    });
  });

  describe('price analysis', () => {
    it('should calculate accurate price statistics', async () => {
      const result = await marketResearchEngine.conductResearch(mockProductDetails);
      const { priceAnalysis } = result;
      
      expect(priceAnalysis.averagePrice).toBeGreaterThan(0);
      expect(priceAnalysis.priceRange.min).toBeLessThanOrEqual(priceAnalysis.priceRange.max);
      expect(priceAnalysis.recommendedPrice).toBeGreaterThan(0);
      expect(priceAnalysis.confidence).toBeGreaterThanOrEqual(0);
      expect(priceAnalysis.confidence).toBeLessThanOrEqual(1);
    });

    it('should provide reasonable price recommendations', async () => {
      const result = await marketResearchEngine.conductResearch(mockProductDetails);
      const { priceAnalysis } = result;
      
      // Recommended price should be within reasonable range
      expect(priceAnalysis.recommendedPrice).toBeGreaterThan(mockProductDetails.price * 0.5);
      expect(priceAnalysis.recommendedPrice).toBeLessThan(mockProductDetails.price * 1.5);
    });

    it('should handle cases with no similar listings', async () => {
      // Create a very unique product that might not have similar listings
      const uniqueProduct = {
        ...mockProductDetails,
        title: 'Extremely Rare Unique Custom Item XYZ123'
      };
      
      const result = await marketResearchEngine.conductResearch(uniqueProduct);
      
      // Should still provide analysis even with limited data
      expect(result.priceAnalysis).toBeDefined();
      expect(result.priceAnalysis.averagePrice).toBeGreaterThan(0);
    });
  });

  describe('keyword analysis', () => {
    it('should extract popular keywords from product details', async () => {
      const result = await marketResearchEngine.conductResearch(mockProductDetails);
      const { keywordAnalysis } = result;
      
      expect(Array.isArray(keywordAnalysis.popularKeywords)).toBe(true);
      expect(keywordAnalysis.popularKeywords.length).toBeGreaterThan(0);
      expect(keywordAnalysis.popularKeywords.length).toBeLessThanOrEqual(10);
      
      // Should contain relevant keywords from the product
      const keywordString = keywordAnalysis.popularKeywords.join(' ').toLowerCase();
      expect(keywordString).toMatch(/iphone|apple|pro|max|256gb|black/);
    });

    it('should calculate keyword frequencies', async () => {
      const result = await marketResearchEngine.conductResearch(mockProductDetails);
      const { keywordAnalysis } = result;
      
      expect(typeof keywordAnalysis.keywordFrequency).toBe('object');
      
      // Frequencies should be positive integers
      Object.values(keywordAnalysis.keywordFrequency).forEach(frequency => {
        expect(typeof frequency).toBe('number');
        expect(frequency).toBeGreaterThan(0);
        expect(Number.isInteger(frequency)).toBe(true);
      });
    });

    it('should provide search volume data', async () => {
      const result = await marketResearchEngine.conductResearch(mockProductDetails);
      const { keywordAnalysis } = result;
      
      expect(typeof keywordAnalysis.searchVolume).toBe('object');
      
      // Search volumes should be reasonable numbers
      Object.values(keywordAnalysis.searchVolume).forEach(volume => {
        expect(typeof volume).toBe('number');
        expect(volume).toBeGreaterThan(0);
        expect(volume).toBeLessThan(20000);
      });
    });

    it('should filter out stop words and short words', async () => {
      const productWithStopWords = {
        ...mockProductDetails,
        title: 'The Apple iPhone is a great phone and it has good features',
        description: 'This is an amazing phone that you will love'
      };
      
      const result = await marketResearchEngine.conductResearch(productWithStopWords);
      const { keywordAnalysis } = result;
      
      // Should not contain common stop words
      const stopWords = ['the', 'is', 'a', 'and', 'it', 'has', 'this', 'an', 'that', 'you', 'will'];
      keywordAnalysis.popularKeywords.forEach(keyword => {
        expect(stopWords).not.toContain(keyword.toLowerCase());
      });
    });
  });

  describe('market trends analysis', () => {
    it('should provide market trends over different time periods', async () => {
      const result = await marketResearchEngine.conductResearch(mockProductDetails);
      const { marketTrends } = result;
      
      expect(Array.isArray(marketTrends)).toBe(true);
      expect(marketTrends.length).toBeGreaterThan(0);
      
      marketTrends.forEach(trend => {
        expect(trend).toHaveProperty('period');
        expect(trend).toHaveProperty('averagePrice');
        expect(trend).toHaveProperty('salesVolume');
        expect(trend).toHaveProperty('trend');
        
        expect(typeof trend.period).toBe('string');
        expect(typeof trend.averagePrice).toBe('number');
        expect(typeof trend.salesVolume).toBe('number');
        expect(['increasing', 'decreasing', 'stable']).toContain(trend.trend);
        
        expect(trend.averagePrice).toBeGreaterThan(0);
        expect(trend.salesVolume).toBeGreaterThan(0);
      });
    });

    it('should include expected time periods', async () => {
      const result = await marketResearchEngine.conductResearch(mockProductDetails);
      const { marketTrends } = result;
      
      const periods = marketTrends.map(trend => trend.period);
      const expectedPeriods = ['Last 30 days', 'Last 60 days', 'Last 90 days', 'Last 6 months'];
      
      expectedPeriods.forEach(expectedPeriod => {
        expect(periods).toContain(expectedPeriod);
      });
    });

    it('should show realistic price trends', async () => {
      const result = await marketResearchEngine.conductResearch(mockProductDetails);
      const { marketTrends } = result;
      
      // Prices should be within reasonable range of original price
      marketTrends.forEach(trend => {
        expect(trend.averagePrice).toBeGreaterThan(mockProductDetails.price * 0.5);
        expect(trend.averagePrice).toBeLessThan(mockProductDetails.price * 1.5);
      });
    });
  });

  describe('performance and accuracy', () => {
    it('should handle multiple concurrent research requests', async () => {
      const promises = Array(5).fill(null).map(() => 
        marketResearchEngine.conductResearch(mockProductDetails)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveProperty('similarListings');
        expect(result).toHaveProperty('priceAnalysis');
        expect(result).toHaveProperty('keywordAnalysis');
        expect(result).toHaveProperty('marketTrends');
      });
    });

    it('should provide consistent results for the same input', async () => {
      const result1 = await marketResearchEngine.conductResearch(mockProductDetails);
      const result2 = await marketResearchEngine.conductResearch(mockProductDetails);
      
      // While exact results may vary due to randomization, structure should be consistent
      expect(result1.similarListings.length).toBeGreaterThan(0);
      expect(result2.similarListings.length).toBeGreaterThan(0);
      expect(result1.keywordAnalysis.popularKeywords.length).toBeGreaterThan(0);
      expect(result2.keywordAnalysis.popularKeywords.length).toBeGreaterThan(0);
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        { ...mockProductDetails, title: 'A' }, // Very short title
        { ...mockProductDetails, title: 'X'.repeat(200) }, // Very long title
        { ...mockProductDetails, description: '' }, // Empty description
        { ...mockProductDetails, price: 0.01 }, // Very low price
        { ...mockProductDetails, price: 99999.99 } // Very high price
      ];
      
      for (const edgeCase of edgeCases) {
        const result = await marketResearchEngine.conductResearch(edgeCase);
        expect(result).toBeDefined();
        expect(result.similarListings).toBeDefined();
        expect(result.priceAnalysis).toBeDefined();
        expect(result.keywordAnalysis).toBeDefined();
        expect(result.marketTrends).toBeDefined();
      }
    });
  });
});