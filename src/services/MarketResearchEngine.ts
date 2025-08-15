import {
  ProductDetails,
  ResearchData,
  SimilarListing,
  PriceAnalysis,
  KeywordAnalysis,
  MarketTrend
} from '../models';
import { MarketResearchEngine as IMarketResearchEngine } from './interfaces';
import { researchDataCache } from '../utils/cache';
import { researchThrottler } from '../utils/rate-limiter';
import { performanceMonitor, monitor } from '../utils/performance-monitor';

/**
 * Market Research Engine implementation for analyzing product market data
 * Provides similar product discovery, price analysis, and keyword research
 */
export class MarketResearchEngine implements IMarketResearchEngine {
  private readonly SIMILARITY_THRESHOLD = 0.6;
  private readonly MAX_SIMILAR_LISTINGS = 20;
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  /**
   * Conducts comprehensive market research for a product with caching
   * @param productDetails - Product details to research
   * @returns Complete research data including similar listings, pricing, and keywords
   */
  async conductResearch(productDetails: ProductDetails): Promise<ResearchData> {
    // Create cache key from product details
    const cacheKey = {
      title: productDetails.title,
      condition: productDetails.condition,
      price: productDetails.price
    };

    // Check cache first
    const cached = await researchDataCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Use throttling for external API calls
      const [similarListings, keywordAnalysis, marketTrends] = await Promise.all([
        researchThrottler.throttle(() => this.findSimilarProducts(productDetails)),
        researchThrottler.throttle(() => this.analyzeKeywords(productDetails)),
        researchThrottler.throttle(() => this.analyzeMarketTrends(productDetails))
      ]);

      const priceAnalysis = this.analyzePricing(similarListings, productDetails.price);

      const researchData: ResearchData = {
        similarListings,
        priceAnalysis,
        keywordAnalysis,
        marketTrends
      };

      // Cache the result
      await researchDataCache.set(cacheKey, researchData);

      return researchData;
    } catch (error) {
      throw new Error(`Market research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Finds similar products using fuzzy matching algorithms
   * @param productDetails - Product to find similar items for
   * @returns Array of similar listings
   */
  private async findSimilarProducts(productDetails: ProductDetails): Promise<SimilarListing[]> {
    // Simulate API delay
    await this.delay(500);

    // Extract key terms from product title for matching
    const keyTerms = this.extractKeyTerms(productDetails.title);
    
    // Generate mock similar listings based on product characteristics
    const similarListings: SimilarListing[] = [];
    
    // Generate variations of the product with different prices and conditions
    const basePrice = productDetails.price;
    const platforms = ['eBay', 'Amazon', 'Mercari', 'Facebook Marketplace'];
    const conditions = ['New', 'Used - Like New', 'Used - Good', 'Used - Fair'];
    
    for (let i = 0; i < this.MAX_SIMILAR_LISTINGS; i++) {
      const similarity = Math.random();
      if (similarity >= this.SIMILARITY_THRESHOLD) {
        const priceVariation = 0.7 + (Math.random() * 0.6); // 70% to 130% of base price
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        
        // Create similar title with some variation
        const similarTitle = this.generateSimilarTitle(productDetails.title, keyTerms);
        
        similarListings.push({
          title: similarTitle,
          price: Math.round(basePrice * priceVariation * 100) / 100,
          condition,
          platform,
          soldDate: Math.random() > 0.3 ? this.generateRecentDate() : undefined
        });
      }
    }

    return similarListings.sort((a, b) => b.price - a.price);
  }

  /**
   * Analyzes pricing data from similar listings
   * @param similarListings - Array of similar product listings
   * @param originalPrice - Original product price
   * @returns Price analysis with averages, ranges, and recommendations
   */
  private analyzePricing(similarListings: SimilarListing[], originalPrice: number): PriceAnalysis {
    if (similarListings.length === 0) {
      return {
        averagePrice: originalPrice,
        priceRange: { min: originalPrice * 0.8, max: originalPrice * 1.2 },
        recommendedPrice: originalPrice,
        confidence: 0.1
      };
    }

    const prices = similarListings.map(listing => listing.price);
    const soldPrices = similarListings
      .filter(listing => listing.soldDate)
      .map(listing => listing.price);

    // Calculate statistics
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Use sold prices for recommendation if available, otherwise use all prices
    const recommendationPrices = soldPrices.length > 0 ? soldPrices : prices;
    const recommendedPrice = recommendationPrices.reduce((sum, price) => sum + price, 0) / recommendationPrices.length;
    
    // Calculate confidence based on data quality
    const confidence = Math.min(
      (similarListings.length / this.MAX_SIMILAR_LISTINGS) * 0.5 + 
      (soldPrices.length / similarListings.length) * 0.5,
      1.0
    );

    return {
      averagePrice: Math.round(averagePrice * 100) / 100,
      priceRange: { 
        min: Math.round(minPrice * 100) / 100, 
        max: Math.round(maxPrice * 100) / 100 
      },
      recommendedPrice: Math.round(recommendedPrice * 100) / 100,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  /**
   * Analyzes keywords from product title and description
   * @param productDetails - Product details to analyze
   * @returns Keyword analysis with popular terms and frequencies
   */
  private async analyzeKeywords(productDetails: ProductDetails): Promise<KeywordAnalysis> {
    // Simulate API delay
    await this.delay(300);

    const text = `${productDetails.title} ${productDetails.description}`.toLowerCase();
    const words = this.extractWords(text);
    
    // Filter out common stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
      'you', 'your', 'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our', 'i', 'me', 'my',
      'he', 'him', 'his', 'she', 'her', 'hers', 'from', 'up', 'out', 'down', 'off', 'over', 'under',
      'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
      'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
      'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now'
    ]);

    const filteredWords = words.filter(word => 
      word.length > 2 && !stopWords.has(word) && !/^\d+$/.test(word)
    );

    // Calculate word frequencies
    const keywordFrequency: Record<string, number> = {};
    filteredWords.forEach(word => {
      keywordFrequency[word] = (keywordFrequency[word] || 0) + 1;
    });

    // Get popular keywords (sorted by frequency)
    const popularKeywords = Object.entries(keywordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    // Generate mock search volume data
    const searchVolume: Record<string, number> = {};
    popularKeywords.forEach(keyword => {
      searchVolume[keyword] = Math.floor(Math.random() * 10000) + 100;
    });

    return {
      popularKeywords,
      keywordFrequency,
      searchVolume
    };
  }

  /**
   * Analyzes market trends for the product category
   * @param productDetails - Product details to analyze trends for
   * @returns Array of market trends over time
   */
  private async analyzeMarketTrends(productDetails: ProductDetails): Promise<MarketTrend[]> {
    // Simulate API delay
    await this.delay(400);

    const trends: MarketTrend[] = [];
    const basePrice = productDetails.price;
    const periods = ['Last 30 days', 'Last 60 days', 'Last 90 days', 'Last 6 months'];
    
    let previousPrice = basePrice;
    
    periods.forEach((period, index) => {
      // Generate realistic price trends
      const priceChange = (Math.random() - 0.5) * 0.2; // ±10% change
      const currentPrice = previousPrice * (1 + priceChange);
      
      const salesVolume = Math.floor(Math.random() * 500) + 50;
      
      // Determine trend direction
      let trend: 'increasing' | 'decreasing' | 'stable';
      const priceDiff = (currentPrice - previousPrice) / previousPrice;
      
      if (Math.abs(priceDiff) < 0.05) {
        trend = 'stable';
      } else if (priceDiff > 0) {
        trend = 'increasing';
      } else {
        trend = 'decreasing';
      }

      trends.push({
        period,
        averagePrice: Math.round(currentPrice * 100) / 100,
        salesVolume,
        trend
      });

      previousPrice = currentPrice;
    });

    return trends.reverse(); // Show most recent first
  }

  /**
   * Extracts key terms from a product title for similarity matching
   * @param title - Product title to extract terms from
   * @returns Array of key terms
   */
  private extractKeyTerms(title: string): string[] {
    const words = this.extractWords(title.toLowerCase());
    
    // Filter for meaningful terms (brands, models, descriptors)
    return words.filter(word => 
      word.length > 2 && 
      !/^(the|and|or|for|with|in|on|at|to|a|an)$/.test(word)
    ).slice(0, 5); // Take top 5 key terms
  }

  /**
   * Generates a similar title based on key terms
   * @param originalTitle - Original product title
   * @param keyTerms - Key terms to include
   * @returns Generated similar title
   */
  private generateSimilarTitle(originalTitle: string, keyTerms: string[]): string {
    const variations = [
      'Excellent', 'Great', 'Perfect', 'Amazing', 'Fantastic', 'Premium', 'Quality',
      'Authentic', 'Genuine', 'Original', 'Rare', 'Vintage', 'Classic', 'Modern'
    ];
    
    const conditions = ['New', 'Like New', 'Mint', 'Excellent', 'Very Good', 'Good'];
    
    // Use some key terms and add variations
    const usedTerms = keyTerms.slice(0, 3);
    const variation = variations[Math.floor(Math.random() * variations.length)];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return `${variation} ${usedTerms.join(' ')} - ${condition} Condition`;
  }

  /**
   * Extracts words from text, removing punctuation and splitting on whitespace
   * @param text - Text to extract words from
   * @returns Array of words
   */
  private extractWords(text: string): string[] {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Generates a random recent date within the last 90 days
   * @returns Random date
   */
  private generateRecentDate(): Date {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 90);
    return new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  }

  /**
   * Creates a delay for simulating API calls
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}