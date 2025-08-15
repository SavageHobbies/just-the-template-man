import {
  ResearchData,
  ResearchInsights,
  PricingInsight,
  KeywordInsight,
  MarketInsight,
  SimilarListing,
  PriceAnalysis,
  KeywordAnalysis,
  MarketTrend
} from '../models';
import { ResearchDataAnalyzer as IResearchDataAnalyzer } from './interfaces';

/**
 * Research Data Analyzer implementation for processing market research data
 * Provides insights, recommendations, and confidence scoring for listing optimization
 */
export class ResearchDataAnalyzer implements IResearchDataAnalyzer {
  private readonly MIN_LISTINGS_FOR_HIGH_CONFIDENCE = 10;
  private readonly MIN_SOLD_LISTINGS_FOR_PRICING = 5;
  private readonly KEYWORD_OPPORTUNITY_THRESHOLD = 0.3;
  private readonly PRICE_DEVIATION_THRESHOLD = 0.03; // 3%

  /**
   * Analyzes research data and generates actionable insights
   * @param researchData - The market research data to analyze
   * @returns Promise containing analyzed insights and recommendations
   */
  async analyzeResearchData(researchData: ResearchData): Promise<ResearchInsights> {
    try {
      // Validate input data
      if (!researchData || !researchData.priceAnalysis || !researchData.keywordAnalysis || !researchData.marketTrends) {
        throw new Error('Invalid research data: missing required fields');
      }

      // Check for malformed price data
      if (isNaN(researchData.priceAnalysis.averagePrice) || 
          isNaN(researchData.priceAnalysis.recommendedPrice) ||
          researchData.priceAnalysis.confidence < 0 || 
          researchData.priceAnalysis.confidence > 1) {
        throw new Error('Invalid price analysis data');
      }

      // Analyze different aspects of the research data
      const pricingInsight = this.analyzePricingData(researchData.priceAnalysis, researchData.similarListings);
      const keywordInsight = this.analyzeKeywordData(researchData.keywordAnalysis);
      const marketInsight = this.analyzeMarketTrends(researchData.marketTrends, researchData.similarListings);

      // Calculate overall confidence based on data quality
      const overallConfidence = this.calculateOverallConfidence(researchData);

      // Generate summary and actionable recommendations
      const summary = this.generateSummary(pricingInsight, keywordInsight, marketInsight);
      const actionableRecommendations = this.generateActionableRecommendations(
        pricingInsight,
        keywordInsight,
        marketInsight
      );

      return {
        summary,
        pricingInsight,
        keywordInsight,
        marketInsight,
        overallConfidence,
        actionableRecommendations
      };
    } catch (error) {
      throw new Error(`Research data analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyzes pricing data to generate pricing insights and recommendations
   * @param priceAnalysis - Price analysis data
   * @param similarListings - Array of similar listings
   * @returns Pricing insight with recommendations
   */
  private analyzePricingData(priceAnalysis: PriceAnalysis, similarListings: SimilarListing[]): PricingInsight {
    const { averagePrice, recommendedPrice, confidence, priceRange } = priceAnalysis;
    
    // Determine market position
    let marketPosition: 'below_market' | 'at_market' | 'above_market';
    const priceDeviation = (recommendedPrice - averagePrice) / averagePrice;
    
    if (Math.abs(priceDeviation) <= this.PRICE_DEVIATION_THRESHOLD) {
      marketPosition = 'at_market';
    } else if (priceDeviation > 0) {
      marketPosition = 'below_market'; // Recommended price is higher, so current is below market
    } else {
      marketPosition = 'above_market'; // Recommended price is lower, so current is above market
    }

    // Generate pricing recommendation
    let recommendation: 'increase' | 'decrease' | 'maintain';
    let reasoning: string;
    
    const soldListings = similarListings.filter(listing => listing.soldDate);
    const soldPriceAverage = soldListings.length > 0 
      ? soldListings.reduce((sum, listing) => sum + listing.price, 0) / soldListings.length
      : averagePrice;

    if (marketPosition === 'below_market' && confidence > 0.6) {
      recommendation = 'increase';
      reasoning = `Current pricing is ${Math.abs(priceDeviation * 100).toFixed(1)}% below market average. ` +
        `Based on ${soldListings.length} sold listings, you can likely increase price to $${recommendedPrice.toFixed(2)}.`;
    } else if (marketPosition === 'above_market' && confidence > 0.6) {
      recommendation = 'decrease';
      reasoning = `Current pricing is ${Math.abs(priceDeviation * 100).toFixed(1)}% above market average. ` +
        `Consider reducing to $${recommendedPrice.toFixed(2)} for better competitiveness.`;
    } else {
      recommendation = 'maintain';
      reasoning = confidence > 0.6 
        ? `Current pricing is well-positioned within market range ($${priceRange.min.toFixed(2)} - $${priceRange.max.toFixed(2)}).`
        : `Limited market data available. Current pricing appears reasonable based on available information.`;
    }

    return {
      recommendation,
      suggestedPrice: recommendedPrice,
      confidence,
      reasoning,
      marketPosition
    };
  }

  /**
   * Analyzes keyword data to identify opportunities and gaps
   * @param keywordAnalysis - Keyword analysis data
   * @returns Keyword insight with opportunities and recommendations
   */
  private analyzeKeywordData(keywordAnalysis: KeywordAnalysis): KeywordInsight {
    const { popularKeywords, keywordFrequency, searchVolume } = keywordAnalysis;

    // Identify top keywords by search volume
    const topKeywords = popularKeywords
      .sort((a, b) => (searchVolume[b] || 0) - (searchVolume[a] || 0))
      .slice(0, 5);

    // Find missing high-volume keywords (keywords with high search volume but low frequency in current content)
    const missingKeywords = Object.entries(searchVolume)
      .filter(([keyword, volume]) => {
        const frequency = keywordFrequency[keyword] || 0;
        const normalizedFrequency = frequency / Math.max(...Object.values(keywordFrequency));
        const normalizedVolume = volume / Math.max(...Object.values(searchVolume));
        return normalizedVolume > this.KEYWORD_OPPORTUNITY_THRESHOLD && normalizedFrequency < this.KEYWORD_OPPORTUNITY_THRESHOLD;
      })
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([keyword]) => keyword);

    // Identify keyword opportunities (high search volume, medium competition)
    const keywordOpportunities = popularKeywords
      .filter(keyword => {
        const volume = searchVolume[keyword] || 0;
        return volume > 1000 && volume < 5000; // Sweet spot for competition vs volume
      })
      .slice(0, 3);

    // Analyze search volume and competition
    const searchVolumeAnalysis: Record<string, { volume: number; competition: 'low' | 'medium' | 'high' }> = {};
    popularKeywords.forEach(keyword => {
      const volume = searchVolume[keyword] || 0;
      let competition: 'low' | 'medium' | 'high';
      
      if (volume < 1000) {
        competition = 'low';
      } else if (volume < 5000) {
        competition = 'medium';
      } else {
        competition = 'high';
      }

      searchVolumeAnalysis[keyword] = { volume, competition };
    });

    return {
      topKeywords,
      missingKeywords,
      keywordOpportunities,
      searchVolumeAnalysis
    };
  }

  /**
   * Analyzes market trends to understand market dynamics
   * @param marketTrends - Array of market trends
   * @param similarListings - Array of similar listings
   * @returns Market insight with trend analysis and recommendations
   */
  private analyzeMarketTrends(marketTrends: MarketTrend[], similarListings: SimilarListing[]): MarketInsight {
    // Analyze overall market trend
    const recentTrends = marketTrends.slice(0, 2); // Most recent trends
    const increasingTrends = recentTrends.filter(trend => trend.trend === 'increasing').length;
    const decreasingTrends = recentTrends.filter(trend => trend.trend === 'decreasing').length;
    
    let marketTrend: 'growing' | 'declining' | 'stable';
    if (increasingTrends > decreasingTrends) {
      marketTrend = 'growing';
    } else if (decreasingTrends > increasingTrends) {
      marketTrend = 'declining';
    } else {
      marketTrend = 'stable';
    }

    // Analyze competitive position based on listing quality and pricing
    const soldListings = similarListings.filter(listing => listing.soldDate);
    const soldRatio = soldListings.length / similarListings.length;
    
    let competitivePosition: 'strong' | 'moderate' | 'weak';
    if (soldRatio > 0.7) {
      competitivePosition = 'strong';
    } else if (soldRatio > 0.4) {
      competitivePosition = 'moderate';
    } else {
      competitivePosition = 'weak';
    }

    // Analyze demand level based on sales volume
    const totalSalesVolume = marketTrends.reduce((sum, trend) => sum + trend.salesVolume, 0);
    const averageSalesVolume = totalSalesVolume / marketTrends.length;
    
    let demandLevel: 'high' | 'medium' | 'low';
    if (averageSalesVolume > 300) {
      demandLevel = 'high';
    } else if (averageSalesVolume > 150) {
      demandLevel = 'medium';
    } else {
      demandLevel = 'low';
    }

    // Generate seasonality insights (simplified)
    const seasonality = this.analyzeSeasonality(marketTrends);

    // Generate market-specific recommendations
    const recommendations = this.generateMarketRecommendations(
      marketTrend,
      competitivePosition,
      demandLevel,
      seasonality
    );

    return {
      marketTrend,
      competitivePosition,
      demandLevel,
      seasonality,
      recommendations
    };
  }

  /**
   * Analyzes seasonality patterns from market trends
   * @param marketTrends - Array of market trends
   * @returns Seasonality analysis string
   */
  private analyzeSeasonality(marketTrends: MarketTrend[]): string {
    // Simplified seasonality analysis based on sales volume patterns
    const volumes = marketTrends.map(trend => trend.salesVolume);
    const maxVolume = Math.max(...volumes);
    const minVolume = Math.min(...volumes);
    const volatility = (maxVolume - minVolume) / maxVolume;

    if (volatility > 0.5) {
      return 'High seasonal variation detected - consider timing your listings strategically';
    } else if (volatility > 0.3) {
      return 'Moderate seasonal patterns - monitor trends for optimal timing';
    } else {
      return 'Stable demand throughout periods - consistent listing performance expected';
    }
  }

  /**
   * Generates market-specific recommendations
   * @param marketTrend - Overall market trend
   * @param competitivePosition - Competitive position
   * @param demandLevel - Demand level
   * @param seasonality - Seasonality analysis
   * @returns Array of recommendations
   */
  private generateMarketRecommendations(
    marketTrend: 'growing' | 'declining' | 'stable',
    competitivePosition: 'strong' | 'moderate' | 'weak',
    demandLevel: 'high' | 'medium' | 'low',
    seasonality: string
  ): string[] {
    const recommendations: string[] = [];

    // Market trend recommendations
    if (marketTrend === 'growing') {
      recommendations.push('Market is growing - consider premium positioning and highlighting unique features');
    } else if (marketTrend === 'declining') {
      recommendations.push('Market is declining - focus on competitive pricing and value proposition');
    } else {
      recommendations.push('Stable market - maintain consistent quality and competitive positioning');
    }

    // Competitive position recommendations
    if (competitivePosition === 'weak') {
      recommendations.push('Improve listing quality with better photos, detailed descriptions, and competitive pricing');
    } else if (competitivePosition === 'strong') {
      recommendations.push('Strong position - consider premium pricing or bundling strategies');
    }

    // Demand level recommendations
    if (demandLevel === 'high') {
      recommendations.push('High demand detected - optimize for quick sale with competitive pricing');
    } else if (demandLevel === 'low') {
      recommendations.push('Lower demand - focus on SEO optimization and unique selling points');
    }

    return recommendations;
  }

  /**
   * Calculates overall confidence score based on data quality
   * @param researchData - Complete research data
   * @returns Confidence score between 0 and 1
   */
  private calculateOverallConfidence(researchData: ResearchData): number {
    const { similarListings, priceAnalysis, keywordAnalysis, marketTrends } = researchData;

    // Data quantity factors
    const listingQuantityScore = Math.min(similarListings.length / this.MIN_LISTINGS_FOR_HIGH_CONFIDENCE, 1);
    const soldListingsScore = Math.min(
      similarListings.filter(l => l.soldDate).length / this.MIN_SOLD_LISTINGS_FOR_PRICING,
      1
    );
    const keywordDataScore = Math.min(keywordAnalysis.popularKeywords.length / 10, 1);
    const trendDataScore = Math.min(marketTrends.length / 4, 1);

    // Data quality factors
    const priceConfidenceScore = priceAnalysis.confidence;
    const platformDiversityScore = Math.min(
      new Set(similarListings.map(l => l.platform)).size / 3,
      1
    );

    // Weighted average of all confidence factors
    const weights = {
      listingQuantity: 0.2,
      soldListings: 0.25,
      keywordData: 0.15,
      trendData: 0.1,
      priceConfidence: 0.2,
      platformDiversity: 0.1
    };

    const overallConfidence = 
      listingQuantityScore * weights.listingQuantity +
      soldListingsScore * weights.soldListings +
      keywordDataScore * weights.keywordData +
      trendDataScore * weights.trendData +
      priceConfidenceScore * weights.priceConfidence +
      platformDiversityScore * weights.platformDiversity;

    return Math.round(overallConfidence * 100) / 100;
  }

  /**
   * Generates a comprehensive summary of the analysis
   * @param pricingInsight - Pricing analysis results
   * @param keywordInsight - Keyword analysis results
   * @param marketInsight - Market analysis results
   * @returns Summary string
   */
  private generateSummary(
    pricingInsight: PricingInsight,
    keywordInsight: KeywordInsight,
    marketInsight: MarketInsight
  ): string {
    const priceAction = pricingInsight.recommendation === 'maintain' ? 'maintain current' : pricingInsight.recommendation;
    const marketCondition = marketInsight.marketTrend === 'stable' ? 'stable' : `${marketInsight.marketTrend} market`;
    const keywordCount = keywordInsight.missingKeywords.length;

    return `Market analysis suggests ${priceAction} pricing at $${pricingInsight.suggestedPrice.toFixed(2)} ` +
      `in a ${marketCondition} with ${marketInsight.demandLevel} demand. ` +
      `${keywordCount > 0 ? `${keywordCount} keyword optimization opportunities identified.` : 'Keyword usage is well-optimized.'} ` +
      `Competitive position is ${marketInsight.competitivePosition}.`;
  }

  /**
   * Generates actionable recommendations based on all insights
   * @param pricingInsight - Pricing analysis results
   * @param keywordInsight - Keyword analysis results
   * @param marketInsight - Market analysis results
   * @returns Array of actionable recommendations
   */
  private generateActionableRecommendations(
    pricingInsight: PricingInsight,
    keywordInsight: KeywordInsight,
    marketInsight: MarketInsight
  ): string[] {
    const recommendations: string[] = [];

    // Pricing recommendations
    if (pricingInsight.recommendation !== 'maintain') {
      recommendations.push(
        `${pricingInsight.recommendation === 'increase' ? 'Increase' : 'Decrease'} price to $${pricingInsight.suggestedPrice.toFixed(2)} ` +
        `(confidence: ${(pricingInsight.confidence * 100).toFixed(0)}%)`
      );
    }

    // Keyword recommendations
    if (keywordInsight.missingKeywords.length > 0) {
      recommendations.push(
        `Add high-value keywords: ${keywordInsight.missingKeywords.slice(0, 3).join(', ')}`
      );
    }

    if (keywordInsight.keywordOpportunities.length > 0) {
      recommendations.push(
        `Target medium-competition keywords: ${keywordInsight.keywordOpportunities.join(', ')}`
      );
    }

    // Market recommendations
    recommendations.push(...marketInsight.recommendations);

    // Limit to top 5 most actionable recommendations
    return recommendations.slice(0, 5);
  }
}