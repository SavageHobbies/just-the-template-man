import { describe, it, expect, beforeEach } from 'vitest';
import { ResearchDataAnalyzer } from './ResearchDataAnalyzer';
import {
  ResearchData,
  SimilarListing,
  PriceAnalysis,
  KeywordAnalysis,
  MarketTrend,
  ResearchInsights
} from '../models';

describe('ResearchDataAnalyzer', () => {
  let analyzer: ResearchDataAnalyzer;
  let mockResearchData: ResearchData;

  beforeEach(() => {
    analyzer = new ResearchDataAnalyzer();
    
    // Create comprehensive mock research data
    mockResearchData = {
      similarListings: [
        {
          title: 'iPhone 13 Pro Max 128GB Unlocked',
          price: 899.99,
          condition: 'Used - Like New',
          platform: 'eBay',
          soldDate: new Date('2024-01-15')
        },
        {
          title: 'Apple iPhone 13 Pro Max 128GB',
          price: 849.99,
          condition: 'Used - Good',
          platform: 'Amazon',
          soldDate: new Date('2024-01-10')
        },
        {
          title: 'iPhone 13 Pro Max Unlocked 128GB',
          price: 950.00,
          condition: 'New',
          platform: 'Mercari'
        },
        {
          title: 'iPhone 13 Pro Max 128GB Blue',
          price: 825.00,
          condition: 'Used - Good',
          platform: 'Facebook Marketplace',
          soldDate: new Date('2024-01-08')
        },
        {
          title: 'Apple iPhone 13 Pro Max',
          price: 875.50,
          condition: 'Used - Like New',
          platform: 'eBay',
          soldDate: new Date('2024-01-12')
        }
      ],
      priceAnalysis: {
        averagePrice: 880.10,
        priceRange: { min: 825.00, max: 950.00 },
        recommendedPrice: 862.37,
        confidence: 0.85
      },
      keywordAnalysis: {
        popularKeywords: ['iphone', '13', 'pro', 'max', '128gb', 'unlocked', 'apple', 'blue', 'smartphone', 'mobile'],
        keywordFrequency: {
          'iphone': 8,
          '13': 6,
          'pro': 6,
          'max': 6,
          '128gb': 5,
          'unlocked': 4,
          'apple': 3,
          'blue': 2,
          'smartphone': 1,
          'mobile': 1
        },
        searchVolume: {
          'iphone': 8500,
          '13': 6200,
          'pro': 5800,
          'max': 4900,
          '128gb': 3200,
          'unlocked': 2800,
          'apple': 9500,
          'blue': 1200,
          'smartphone': 4500,
          'mobile': 3800
        }
      },
      marketTrends: [
        {
          period: 'Last 30 days',
          averagePrice: 875.00,
          salesVolume: 245,
          trend: 'increasing'
        },
        {
          period: 'Last 60 days',
          averagePrice: 860.00,
          salesVolume: 220,
          trend: 'increasing'
        },
        {
          period: 'Last 90 days',
          averagePrice: 845.00,
          salesVolume: 195,
          trend: 'stable'
        },
        {
          period: 'Last 6 months',
          averagePrice: 820.00,
          salesVolume: 180,
          trend: 'increasing'
        }
      ]
    };
  });

  describe('analyzeResearchData', () => {
    it('should analyze research data and return comprehensive insights', async () => {
      const insights = await analyzer.analyzeResearchData(mockResearchData);

      expect(insights).toBeDefined();
      expect(insights.summary).toBeDefined();
      expect(insights.pricingInsight).toBeDefined();
      expect(insights.keywordInsight).toBeDefined();
      expect(insights.marketInsight).toBeDefined();
      expect(insights.overallConfidence).toBeGreaterThan(0);
      expect(insights.overallConfidence).toBeLessThanOrEqual(1);
      expect(insights.actionableRecommendations).toBeInstanceOf(Array);
    });

    it('should handle empty research data gracefully', async () => {
      const emptyData: ResearchData = {
        similarListings: [],
        priceAnalysis: {
          averagePrice: 100,
          priceRange: { min: 100, max: 100 },
          recommendedPrice: 100,
          confidence: 0.1
        },
        keywordAnalysis: {
          popularKeywords: [],
          keywordFrequency: {},
          searchVolume: {}
        },
        marketTrends: []
      };

      const insights = await analyzer.analyzeResearchData(emptyData);
      
      expect(insights.overallConfidence).toBeLessThan(0.5);
      expect(insights.pricingInsight.confidence).toBe(0.1);
      expect(insights.keywordInsight.topKeywords).toHaveLength(0);
    });

    it('should throw error for invalid research data', async () => {
      const invalidData = null as any;
      
      await expect(analyzer.analyzeResearchData(invalidData)).rejects.toThrow();
    });
  });

  describe('pricing analysis', () => {
    it('should recommend price increase when below market', async () => {
      // Modify data to simulate below-market pricing
      const belowMarketData = {
        ...mockResearchData,
        priceAnalysis: {
          ...mockResearchData.priceAnalysis,
          recommendedPrice: 920.00, // Higher than average
          confidence: 0.8
        }
      };

      const insights = await analyzer.analyzeResearchData(belowMarketData);
      
      expect(insights.pricingInsight.recommendation).toBe('increase');
      expect(insights.pricingInsight.marketPosition).toBe('below_market');
      expect(insights.pricingInsight.suggestedPrice).toBe(920.00);
    });

    it('should recommend price decrease when above market', async () => {
      // Modify data to simulate above-market pricing
      const aboveMarketData = {
        ...mockResearchData,
        priceAnalysis: {
          ...mockResearchData.priceAnalysis,
          recommendedPrice: 750.00, // Lower than average
          confidence: 0.8
        }
      };

      const insights = await analyzer.analyzeResearchData(aboveMarketData);
      
      expect(insights.pricingInsight.recommendation).toBe('decrease');
      expect(insights.pricingInsight.marketPosition).toBe('above_market');
      expect(insights.pricingInsight.suggestedPrice).toBe(750.00);
    });

    it('should recommend maintain price when at market', async () => {
      const insights = await analyzer.analyzeResearchData(mockResearchData);
      
      expect(insights.pricingInsight.recommendation).toBe('maintain');
      expect(insights.pricingInsight.marketPosition).toBe('at_market');
    });

    it('should have lower confidence with limited sold listings', async () => {
      const limitedSoldData = {
        ...mockResearchData,
        similarListings: mockResearchData.similarListings.map(listing => ({
          ...listing,
          soldDate: undefined // Remove sold dates
        }))
      };

      const insights = await analyzer.analyzeResearchData(limitedSoldData);
      
      expect(insights.overallConfidence).toBeLessThan(mockResearchData.priceAnalysis.confidence);
    });
  });

  describe('keyword analysis', () => {
    it('should identify top keywords by search volume', async () => {
      const insights = await analyzer.analyzeResearchData(mockResearchData);
      
      expect(insights.keywordInsight.topKeywords).toContain('apple');
      expect(insights.keywordInsight.topKeywords).toContain('iphone');
      expect(insights.keywordInsight.topKeywords.length).toBeLessThanOrEqual(5);
    });

    it('should identify missing high-volume keywords', async () => {
      // Add a high-volume keyword that's not in the frequency data
      const modifiedData = {
        ...mockResearchData,
        keywordAnalysis: {
          ...mockResearchData.keywordAnalysis,
          searchVolume: {
            ...mockResearchData.keywordAnalysis.searchVolume,
            'premium': 7000 // High volume keyword not in frequency
          }
        }
      };

      const insights = await analyzer.analyzeResearchData(modifiedData);
      
      expect(insights.keywordInsight.missingKeywords).toContain('premium');
    });

    it('should categorize keywords by competition level', async () => {
      const insights = await analyzer.analyzeResearchData(mockResearchData);
      
      const searchVolumeAnalysis = insights.keywordInsight.searchVolumeAnalysis;
      expect(Object.keys(searchVolumeAnalysis).length).toBeGreaterThan(0);
      
      // Check that competition levels are assigned
      Object.values(searchVolumeAnalysis).forEach(analysis => {
        expect(['low', 'medium', 'high']).toContain(analysis.competition);
        expect(analysis.volume).toBeGreaterThan(0);
      });
    });

    it('should identify keyword opportunities', async () => {
      const insights = await analyzer.analyzeResearchData(mockResearchData);
      
      // Should find keywords in the medium competition range (1000-5000 volume)
      expect(insights.keywordInsight.keywordOpportunities.length).toBeGreaterThanOrEqual(0);
      insights.keywordInsight.keywordOpportunities.forEach(keyword => {
        const volume = mockResearchData.keywordAnalysis.searchVolume[keyword];
        expect(volume).toBeGreaterThanOrEqual(1000);
        expect(volume).toBeLessThanOrEqual(5000);
      });
    });
  });

  describe('market trend analysis', () => {
    it('should identify growing market trend', async () => {
      const insights = await analyzer.analyzeResearchData(mockResearchData);
      
      expect(insights.marketInsight.marketTrend).toBe('growing');
    });

    it('should identify declining market trend', async () => {
      const decliningData = {
        ...mockResearchData,
        marketTrends: [
          {
            period: 'Last 30 days',
            averagePrice: 800.00,
            salesVolume: 150,
            trend: 'decreasing' as const
          },
          {
            period: 'Last 60 days',
            averagePrice: 820.00,
            salesVolume: 180,
            trend: 'decreasing' as const
          }
        ]
      };

      const insights = await analyzer.analyzeResearchData(decliningData);
      
      expect(insights.marketInsight.marketTrend).toBe('declining');
    });

    it('should assess competitive position based on sold listings ratio', async () => {
      const insights = await analyzer.analyzeResearchData(mockResearchData);
      
      // With 4 out of 5 listings sold, should be strong position
      expect(insights.marketInsight.competitivePosition).toBe('strong');
    });

    it('should determine demand level from sales volume', async () => {
      const insights = await analyzer.analyzeResearchData(mockResearchData);
      
      // Average sales volume is ~210, should be medium demand
      expect(insights.marketInsight.demandLevel).toBe('medium');
    });

    it('should provide seasonality analysis', async () => {
      const insights = await analyzer.analyzeResearchData(mockResearchData);
      
      expect(insights.marketInsight.seasonality).toBeDefined();
      expect(typeof insights.marketInsight.seasonality).toBe('string');
    });

    it('should generate market-specific recommendations', async () => {
      const insights = await analyzer.analyzeResearchData(mockResearchData);
      
      expect(insights.marketInsight.recommendations).toBeInstanceOf(Array);
      expect(insights.marketInsight.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('confidence scoring', () => {
    it('should calculate higher confidence with more data', async () => {
      const moreDataResearch = {
        ...mockResearchData,
        similarListings: [
          ...mockResearchData.similarListings,
          ...Array(10).fill(null).map((_, i) => ({
            title: `Additional listing ${i}`,
            price: 850 + i * 10,
            condition: 'Used - Good',
            platform: 'eBay',
            soldDate: new Date()
          }))
        ]
      };

      const insights = await analyzer.analyzeResearchData(moreDataResearch);
      const originalInsights = await analyzer.analyzeResearchData(mockResearchData);
      
      expect(insights.overallConfidence).toBeGreaterThan(originalInsights.overallConfidence);
    });

    it('should have lower confidence with limited data', async () => {
      const limitedData = {
        ...mockResearchData,
        similarListings: mockResearchData.similarListings.slice(0, 2),
        keywordAnalysis: {
          popularKeywords: ['iphone'],
          keywordFrequency: { 'iphone': 1 },
          searchVolume: { 'iphone': 1000 }
        },
        marketTrends: mockResearchData.marketTrends.slice(0, 1)
      };

      const insights = await analyzer.analyzeResearchData(limitedData);
      
      expect(insights.overallConfidence).toBeLessThan(0.7);
    });
  });

  describe('summary generation', () => {
    it('should generate comprehensive summary', async () => {
      const insights = await analyzer.analyzeResearchData(mockResearchData);
      
      expect(insights.summary).toBeDefined();
      expect(insights.summary.length).toBeGreaterThan(50);
      expect(insights.summary).toContain('$');
      expect(insights.summary).toContain(insights.pricingInsight.suggestedPrice.toFixed(2));
    });

    it('should include market condition in summary', async () => {
      const insights = await analyzer.analyzeResearchData(mockResearchData);
      
      expect(insights.summary).toContain(insights.marketInsight.marketTrend);
      expect(insights.summary).toContain(insights.marketInsight.demandLevel);
    });
  });

  describe('actionable recommendations', () => {
    it('should generate actionable recommendations', async () => {
      const insights = await analyzer.analyzeResearchData(mockResearchData);
      
      expect(insights.actionableRecommendations).toBeInstanceOf(Array);
      expect(insights.actionableRecommendations.length).toBeGreaterThan(0);
      expect(insights.actionableRecommendations.length).toBeLessThanOrEqual(5);
    });

    it('should include pricing recommendations when needed', async () => {
      const belowMarketData = {
        ...mockResearchData,
        priceAnalysis: {
          ...mockResearchData.priceAnalysis,
          recommendedPrice: 920.00,
          confidence: 0.8
        }
      };

      const insights = await analyzer.analyzeResearchData(belowMarketData);
      
      const pricingRec = insights.actionableRecommendations.find(rec => 
        rec.includes('Increase price') || rec.includes('Decrease price')
      );
      expect(pricingRec).toBeDefined();
    });

    it('should include keyword recommendations when opportunities exist', async () => {
      const insights = await analyzer.analyzeResearchData(mockResearchData);
      
      if (insights.keywordInsight.missingKeywords.length > 0) {
        const keywordRec = insights.actionableRecommendations.find(rec => 
          rec.includes('Add high-value keywords')
        );
        expect(keywordRec).toBeDefined();
      }
    });

    it('should include market recommendations', async () => {
      const insights = await analyzer.analyzeResearchData(mockResearchData);
      
      // Should include at least one market-based recommendation
      const marketRecs = insights.actionableRecommendations.filter(rec => 
        rec.includes('Market') || rec.includes('market') || 
        rec.includes('position') || rec.includes('competitive')
      );
      expect(marketRecs.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle malformed price analysis', async () => {
      const malformedData = {
        ...mockResearchData,
        priceAnalysis: {
          averagePrice: NaN,
          priceRange: { min: 0, max: 0 },
          recommendedPrice: 0,
          confidence: -1
        }
      };

      await expect(analyzer.analyzeResearchData(malformedData)).rejects.toThrow();
    });

    it('should handle empty keyword analysis', async () => {
      const emptyKeywordData = {
        ...mockResearchData,
        keywordAnalysis: {
          popularKeywords: [],
          keywordFrequency: {},
          searchVolume: {}
        }
      };

      const insights = await analyzer.analyzeResearchData(emptyKeywordData);
      
      expect(insights.keywordInsight.topKeywords).toHaveLength(0);
      expect(insights.keywordInsight.missingKeywords).toHaveLength(0);
    });

    it('should handle missing market trends', async () => {
      const noTrendsData = {
        ...mockResearchData,
        marketTrends: []
      };

      const insights = await analyzer.analyzeResearchData(noTrendsData);
      
      expect(insights.marketInsight.marketTrend).toBe('stable');
      expect(insights.marketInsight.seasonality).toBeDefined();
    });
  });
});