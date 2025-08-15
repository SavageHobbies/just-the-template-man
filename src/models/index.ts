// Core data models for the eBay Listing Optimizer

export interface WebpageContent {
  html: string;
  title: string;
  metadata: Record<string, string>;
  timestamp: Date;
}

export interface ImageData {
  url: string;
  altText?: string;
  size: 'thumbnail' | 'medium' | 'large';
  isValid: boolean;
}

export interface ProductDetails {
  title: string;
  description: string;
  price: number;
  condition: string;
  images: ImageData[];
  specifications: Record<string, string>;
  seller: string;
  location: string;
}

export interface SimilarListing {
  title: string;
  price: number;
  condition: string;
  soldDate?: Date;
  platform: string;
}

export interface PriceAnalysis {
  averagePrice: number;
  priceRange: { min: number; max: number };
  recommendedPrice: number;
  confidence: number;
}

export interface KeywordAnalysis {
  popularKeywords: string[];
  keywordFrequency: Record<string, number>;
  searchVolume: Record<string, number>;
}

export interface MarketTrend {
  period: string;
  averagePrice: number;
  salesVolume: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ResearchData {
  similarListings: SimilarListing[];
  priceAnalysis: PriceAnalysis;
  keywordAnalysis: KeywordAnalysis;
  marketTrends: MarketTrend[];
}

export interface OptimizedContent {
  optimizedTitle: string;
  optimizedDescription: string;
  suggestedPrice: number;
  keywords: string[];
  sellingPoints: string[];
  conditionNotes: string;
}

export interface PricingInsight {
  recommendation: 'increase' | 'decrease' | 'maintain';
  suggestedPrice: number;
  confidence: number;
  reasoning: string;
  marketPosition: 'below_market' | 'at_market' | 'above_market';
}

export interface KeywordInsight {
  topKeywords: string[];
  missingKeywords: string[];
  keywordOpportunities: string[];
  searchVolumeAnalysis: Record<string, { volume: number; competition: 'low' | 'medium' | 'high' }>;
}

export interface MarketInsight {
  marketTrend: 'growing' | 'declining' | 'stable';
  competitivePosition: 'strong' | 'moderate' | 'weak';
  demandLevel: 'high' | 'medium' | 'low';
  seasonality: string;
  recommendations: string[];
}

export interface ResearchInsights {
  summary: string;
  pricingInsight: PricingInsight;
  keywordInsight: KeywordInsight;
  marketInsight: MarketInsight;
  overallConfidence: number;
  actionableRecommendations: string[];
}

// Re-export configuration types
export * from './configuration';