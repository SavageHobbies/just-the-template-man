// Data validation and quality assurance utilities

import {
  ProductDetails,
  OptimizedContent,
  ResearchData,
  ImageData,
  PriceAnalysis,
  KeywordAnalysis,
  ResearchInsights
} from '../models';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100 quality score
}

export interface QualityMetrics {
  completeness: number; // 0-100
  accuracy: number; // 0-100
  consistency: number; // 0-100
  optimization: number; // 0-100
  overall: number; // 0-100
}

/**
 * Validates extracted product details
 */
export class ProductDetailsValidator {
  validate(details: Partial<ProductDetails>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Required field validation
    if (!details.title || details.title.trim().length === 0) {
      errors.push('Product title is required');
      score -= 25;
    } else if (details.title.length < 10) {
      warnings.push('Product title is very short (less than 10 characters)');
      score -= 5;
    } else if (details.title.length > 80) {
      warnings.push('Product title is very long (over 80 characters)');
      score -= 5;
    }

    if (!details.description || details.description.trim().length === 0) {
      errors.push('Product description is required');
      score -= 25;
    } else if (details.description.length < 50) {
      warnings.push('Product description is very short (less than 50 characters)');
      score -= 10;
    }

    if (details.price === undefined || details.price === null) {
      errors.push('Product price is required');
      score -= 20;
    } else if (details.price <= 0) {
      errors.push('Product price must be greater than 0');
      score -= 15;
    } else if (details.price > 100000) {
      warnings.push('Product price is unusually high (over $100,000)');
      score -= 5;
    }

    if (!details.condition || details.condition.trim().length === 0) {
      errors.push('Product condition is required');
      score -= 15;
    } else {
      const validConditions = ['new', 'used', 'refurbished', 'for parts or not working', 'open box'];
      if (!validConditions.some(c => details.condition!.toLowerCase().includes(c))) {
        warnings.push('Product condition may not be in standard eBay format');
        score -= 5;
      }
    }

    // Image validation
    if (!details.images || details.images.length === 0) {
      warnings.push('No product images found');
      score -= 15;
    } else {
      const invalidImages = details.images.filter(img => !img.isValid);
      if (invalidImages.length > 0) {
        warnings.push(`${invalidImages.length} invalid image(s) found`);
        score -= Math.min(10, invalidImages.length * 2);
      }
    }

    // Optional field validation
    if (!details.seller || details.seller.trim().length === 0) {
      warnings.push('Seller information is missing');
      score -= 5;
    }

    if (!details.location || details.location.trim().length === 0) {
      warnings.push('Location information is missing');
      score -= 5;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  calculateQualityMetrics(details: ProductDetails): QualityMetrics {
    const completeness = this.calculateCompleteness(details);
    const accuracy = this.calculateAccuracy(details);
    const consistency = this.calculateConsistency(details);
    
    const overall = (completeness + accuracy + consistency) / 3;

    return {
      completeness,
      accuracy,
      consistency,
      optimization: 0, // Not applicable for raw product details
      overall
    };
  }

  private calculateCompleteness(details: ProductDetails): number {
    let score = 0;
    const maxScore = 100;

    // Required fields (60 points total)
    if (details.title && details.title.trim().length > 0) score += 15;
    if (details.description && details.description.trim().length > 0) score += 15;
    if (details.price > 0) score += 15;
    if (details.condition && details.condition.trim().length > 0) score += 15;

    // Optional but valuable fields (40 points total)
    if (details.images && details.images.length > 0) score += 15;
    if (details.seller && details.seller.trim().length > 0) score += 5;
    if (details.location && details.location.trim().length > 0) score += 5;
    if (details.specifications && Object.keys(details.specifications).length > 0) score += 15;

    return Math.min(maxScore, score);
  }

  private calculateAccuracy(details: ProductDetails): number {
    let score = 100;

    // Price accuracy checks
    if (details.price <= 0) score -= 20;
    if (details.price > 100000) score -= 10;

    // Title accuracy checks
    if (details.title.length < 10) score -= 10;
    if (details.title.length > 80) score -= 5;

    // Description accuracy checks
    if (details.description.length < 50) score -= 15;

    // Image accuracy checks
    if (details.images) {
      const invalidImages = details.images.filter(img => !img.isValid);
      score -= Math.min(20, invalidImages.length * 5);
    }

    return Math.max(0, score);
  }

  private calculateConsistency(details: ProductDetails): number {
    let score = 100;

    // Check for consistency between title and description
    if (details.title && details.description) {
      const titleWords = details.title.toLowerCase().split(/\s+/);
      const descWords = details.description.toLowerCase().split(/\s+/);
      const commonWords = titleWords.filter(word => 
        word.length > 3 && descWords.includes(word)
      );
      
      if (commonWords.length < 2) {
        score -= 15; // Title and description don't seem related
      }
    }

    // Check for reasonable price vs condition consistency
    if (details.condition && details.price) {
      const isNew = details.condition.toLowerCase().includes('new');
      const isUsed = details.condition.toLowerCase().includes('used');
      
      if (isNew && details.price < 10) {
        score -= 10; // Suspiciously low price for new item
      }
      if (isUsed && details.price > 50000) {
        score -= 5; // High price for used item (might be valid)
      }
    }

    return Math.max(0, score);
  }
}/**

 * Validates optimized content quality
 */
export class OptimizedContentValidator {
  validate(content: Partial<OptimizedContent>, originalDetails?: ProductDetails): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Required field validation
    if (!content.optimizedTitle || content.optimizedTitle.trim().length === 0) {
      errors.push('Optimized title is required');
      score -= 25;
    } else {
      if (content.optimizedTitle.length < 15) {
        warnings.push('Optimized title is short (less than 15 characters)');
        score -= 10;
      }
      if (content.optimizedTitle.length > 80) {
        errors.push('Optimized title exceeds eBay limit (80 characters)');
        score -= 15;
      }
    }

    if (!content.optimizedDescription || content.optimizedDescription.trim().length === 0) {
      errors.push('Optimized description is required');
      score -= 25;
    } else if (content.optimizedDescription.length < 100) {
      warnings.push('Optimized description is short (less than 100 characters)');
      score -= 10;
    }

    if (content.suggestedPrice === undefined || content.suggestedPrice === null) {
      errors.push('Suggested price is required');
      score -= 20;
    } else if (content.suggestedPrice <= 0) {
      errors.push('Suggested price must be greater than 0');
      score -= 15;
    }

    // Keywords validation
    if (!content.keywords || content.keywords.length === 0) {
      warnings.push('No keywords provided');
      score -= 15;
    } else {
      if (content.keywords.length < 3) {
        warnings.push('Very few keywords provided (less than 3)');
        score -= 10;
      }
      if (content.keywords.some(k => k.length < 2)) {
        warnings.push('Some keywords are too short');
        score -= 5;
      }
    }

    // Selling points validation
    if (!content.sellingPoints || content.sellingPoints.length === 0) {
      warnings.push('No selling points provided');
      score -= 10;
    } else if (content.sellingPoints.length < 3) {
      warnings.push('Few selling points provided (less than 3)');
      score -= 5;
    }

    // Consistency with original details
    if (originalDetails) {
      const consistencyScore = this.checkConsistencyWithOriginal(content, originalDetails);
      score = Math.min(score, score * (consistencyScore / 100));
      
      if (consistencyScore < 80) {
        warnings.push('Optimized content may not be consistent with original details');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  calculateQualityMetrics(content: OptimizedContent, originalDetails?: ProductDetails): QualityMetrics {
    const completeness = this.calculateCompleteness(content);
    const accuracy = this.calculateAccuracy(content);
    const consistency = originalDetails ? 
      this.checkConsistencyWithOriginal(content, originalDetails) : 100;
    const optimization = this.calculateOptimization(content, originalDetails);
    
    const overall = (completeness + accuracy + consistency + optimization) / 4;

    return {
      completeness,
      accuracy,
      consistency,
      optimization,
      overall
    };
  }

  private calculateCompleteness(content: OptimizedContent): number {
    let score = 0;

    if (content.optimizedTitle && content.optimizedTitle.trim().length > 0) score += 25;
    if (content.optimizedDescription && content.optimizedDescription.trim().length > 0) score += 25;
    if (content.suggestedPrice > 0) score += 20;
    if (content.keywords && content.keywords.length > 0) score += 15;
    if (content.sellingPoints && content.sellingPoints.length > 0) score += 10;

    return score;
  }

  private calculateAccuracy(content: OptimizedContent): number {
    let score = 100;

    // Title accuracy
    if (content.optimizedTitle) {
      if (content.optimizedTitle.length > 80) score -= 20;
      if (content.optimizedTitle.length < 15) score -= 15;
    }

    // Description accuracy
    if (content.optimizedDescription) {
      if (content.optimizedDescription.length < 100) score -= 10;
    }

    // Price accuracy
    if (content.suggestedPrice <= 0) score -= 25;
    if (content.suggestedPrice > 100000) score -= 10;

    // Keywords accuracy
    if (content.keywords) {
      const shortKeywords = content.keywords.filter(k => k.length < 2);
      score -= Math.min(15, shortKeywords.length * 3);
    }

    return Math.max(0, score);
  }

  private calculateOptimization(content: OptimizedContent, originalDetails?: ProductDetails): number {
    let score = 50; // Base score

    // Title optimization
    if (content.optimizedTitle && originalDetails?.title) {
      if (content.optimizedTitle.length > originalDetails.title.length) score += 10;
      if (content.keywords?.some(k => content.optimizedTitle.toLowerCase().includes(k.toLowerCase()))) {
        score += 15;
      }
    }

    // Description optimization
    if (content.optimizedDescription && originalDetails?.description) {
      if (content.optimizedDescription.length > originalDetails.description.length) score += 10;
      if (content.sellingPoints?.length && content.sellingPoints.length > 0) score += 10;
    }

    // Keyword optimization
    if (content.keywords && content.keywords.length >= 5) score += 5;

    return Math.min(100, score);
  }

  private checkConsistencyWithOriginal(content: Partial<OptimizedContent>, original: ProductDetails): number {
    let score = 100;

    // Price consistency (should be reasonable compared to original)
    if (content.suggestedPrice && original.price) {
      const priceRatio = content.suggestedPrice / original.price;
      if (priceRatio < 0.5 || priceRatio > 2.0) {
        score -= 20; // Price changed by more than 100%
      } else if (priceRatio < 0.8 || priceRatio > 1.2) {
        score -= 10; // Price changed by more than 20%
      }
    }

    // Title consistency (should contain key elements from original)
    if (content.optimizedTitle && original.title) {
      const originalWords = original.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const optimizedWords = content.optimizedTitle.toLowerCase().split(/\s+/);
      const commonWords = originalWords.filter(w => optimizedWords.includes(w));
      
      if (commonWords.length < Math.min(2, originalWords.length * 0.3)) {
        score -= 15; // Not enough common words
      }
    }

    return Math.max(0, score);
  }
}

/**
 * Validates research data quality
 */
export class ResearchDataValidator {
  validate(data: Partial<ResearchData>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Similar listings validation
    if (!data.similarListings || data.similarListings.length === 0) {
      warnings.push('No similar listings found');
      score -= 20;
    } else {
      if (data.similarListings.length < 3) {
        warnings.push('Very few similar listings found (less than 3)');
        score -= 10;
      }

      // Validate individual listings
      const invalidListings = data.similarListings.filter(listing => 
        !listing.title || !listing.price || listing.price <= 0 || !listing.platform
      );
      if (invalidListings.length > 0) {
        warnings.push(`${invalidListings.length} invalid similar listing(s) found`);
        score -= Math.min(15, invalidListings.length * 3);
      }
    }

    // Price analysis validation
    if (!data.priceAnalysis) {
      errors.push('Price analysis is required');
      score -= 30;
    } else {
      if (data.priceAnalysis.averagePrice <= 0) {
        errors.push('Average price must be greater than 0');
        score -= 15;
      }
      if (data.priceAnalysis.recommendedPrice <= 0) {
        errors.push('Recommended price must be greater than 0');
        score -= 15;
      }
      if (data.priceAnalysis.confidence < 0 || data.priceAnalysis.confidence > 1) {
        errors.push('Price confidence must be between 0 and 1');
        score -= 10;
      }
      if (data.priceAnalysis.priceRange.min >= data.priceAnalysis.priceRange.max) {
        errors.push('Price range minimum must be less than maximum');
        score -= 10;
      }
    }

    // Keyword analysis validation
    if (!data.keywordAnalysis) {
      warnings.push('Keyword analysis is missing');
      score -= 15;
    } else {
      if (!data.keywordAnalysis.popularKeywords || data.keywordAnalysis.popularKeywords.length === 0) {
        warnings.push('No popular keywords found');
        score -= 10;
      }
      if (!data.keywordAnalysis.keywordFrequency || Object.keys(data.keywordAnalysis.keywordFrequency).length === 0) {
        warnings.push('No keyword frequency data found');
        score -= 5;
      }
    }

    // Market trends validation
    if (!data.marketTrends || data.marketTrends.length === 0) {
      warnings.push('No market trends data found');
      score -= 10;
    } else {
      const invalidTrends = data.marketTrends.filter(trend => 
        !trend.period || trend.averagePrice <= 0 || !['increasing', 'decreasing', 'stable'].includes(trend.trend)
      );
      if (invalidTrends.length > 0) {
        warnings.push(`${invalidTrends.length} invalid market trend(s) found`);
        score -= Math.min(10, invalidTrends.length * 2);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  calculateQualityMetrics(data: ResearchData): QualityMetrics {
    const completeness = this.calculateCompleteness(data);
    const accuracy = this.calculateAccuracy(data);
    const consistency = this.calculateConsistency(data);
    
    const overall = (completeness + accuracy + consistency) / 3;

    return {
      completeness,
      accuracy,
      consistency,
      optimization: 0, // Not applicable for research data
      overall
    };
  }

  private calculateCompleteness(data: ResearchData): number {
    let score = 0;

    if (data.similarListings && data.similarListings.length > 0) score += 30;
    if (data.priceAnalysis) score += 40;
    if (data.keywordAnalysis) score += 20;
    if (data.marketTrends && data.marketTrends.length > 0) score += 10;

    return score;
  }

  private calculateAccuracy(data: ResearchData): number {
    let score = 100;

    // Price analysis accuracy
    if (data.priceAnalysis) {
      if (data.priceAnalysis.averagePrice <= 0) score -= 20;
      if (data.priceAnalysis.confidence < 0.3) score -= 15;
      if (data.priceAnalysis.priceRange.min >= data.priceAnalysis.priceRange.max) score -= 15;
    }

    // Similar listings accuracy
    if (data.similarListings) {
      const invalidListings = data.similarListings.filter(l => l.price <= 0 || !l.title);
      score -= Math.min(20, invalidListings.length * 5);
    }

    // Market trends accuracy
    if (data.marketTrends) {
      const invalidTrends = data.marketTrends.filter(t => 
        t.averagePrice <= 0 || !['increasing', 'decreasing', 'stable'].includes(t.trend)
      );
      score -= Math.min(15, invalidTrends.length * 3);
    }

    return Math.max(0, score);
  }

  private calculateConsistency(data: ResearchData): number {
    let score = 100;

    // Check consistency between similar listings and price analysis
    if (data.similarListings && data.priceAnalysis && data.similarListings.length > 0) {
      const listingPrices = data.similarListings.map(l => l.price);
      const avgFromListings = listingPrices.reduce((a, b) => a + b, 0) / listingPrices.length;
      
      const priceDiff = Math.abs(avgFromListings - data.priceAnalysis.averagePrice) / data.priceAnalysis.averagePrice;
      if (priceDiff > 0.3) {
        score -= 20; // More than 30% difference
      } else if (priceDiff > 0.15) {
        score -= 10; // More than 15% difference
      }
    }

    return Math.max(0, score);
  }
}/**

 * Pipeline data consistency validator
 */
export class PipelineConsistencyValidator {
  /**
   * Validates data consistency across pipeline stages
   */
  validatePipelineConsistency(
    originalDetails: ProductDetails,
    researchData: ResearchData,
    optimizedContent: OptimizedContent
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Price consistency across pipeline
    const priceConsistency = this.validatePriceConsistency(
      originalDetails.price,
      researchData.priceAnalysis,
      optimizedContent.suggestedPrice
    );
    score -= (100 - priceConsistency.score);
    errors.push(...priceConsistency.errors);
    warnings.push(...priceConsistency.warnings);

    // Content consistency
    const contentConsistency = this.validateContentConsistency(
      originalDetails,
      optimizedContent
    );
    score -= (100 - contentConsistency.score) * 0.5; // Weight content consistency less
    warnings.push(...contentConsistency.warnings);

    // Research alignment
    const researchAlignment = this.validateResearchAlignment(
      researchData,
      optimizedContent
    );
    score -= (100 - researchAlignment.score) * 0.3; // Weight research alignment less
    warnings.push(...researchAlignment.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  private validatePriceConsistency(
    originalPrice: number,
    priceAnalysis: PriceAnalysis,
    suggestedPrice: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check if suggested price is within reasonable range of market analysis
    const marketMin = priceAnalysis.priceRange.min;
    const marketMax = priceAnalysis.priceRange.max;
    
    if (suggestedPrice < marketMin * 0.8 || suggestedPrice > marketMax * 1.2) {
      warnings.push('Suggested price is outside reasonable market range');
      score -= 20;
    }

    // Check if suggested price aligns with recommended price from analysis
    const recommendedDiff = Math.abs(suggestedPrice - priceAnalysis.recommendedPrice) / priceAnalysis.recommendedPrice;
    if (recommendedDiff > 0.2) {
      warnings.push('Suggested price differs significantly from research recommendation');
      score -= 15;
    }

    // Check if price change from original is reasonable
    const originalDiff = Math.abs(suggestedPrice - originalPrice) / originalPrice;
    if (originalDiff > 1.0) {
      warnings.push('Suggested price differs dramatically from original (>100%)');
      score -= 10;
    }

    return { isValid: errors.length === 0, errors, warnings, score: Math.max(0, score) };
  }

  private validateContentConsistency(
    originalDetails: ProductDetails,
    optimizedContent: OptimizedContent
  ): ValidationResult {
    const warnings: string[] = [];
    let score = 100;

    // Check title consistency
    const originalTitleWords = originalDetails.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const optimizedTitleWords = optimizedContent.optimizedTitle.toLowerCase().split(/\s+/);
    const commonTitleWords = originalTitleWords.filter(w => optimizedTitleWords.includes(w));
    
    if (commonTitleWords.length < Math.min(2, originalTitleWords.length * 0.3)) {
      warnings.push('Optimized title may not preserve key elements from original');
      score -= 15;
    }


    return { isValid: true, errors: [], warnings, score: Math.max(0, score) };
  }

  private validateResearchAlignment(
    researchData: ResearchData,
    optimizedContent: OptimizedContent
  ): ValidationResult {
    const warnings: string[] = [];
    let score = 100;

    // Check if popular keywords from research are used in optimized content
    if (researchData.keywordAnalysis?.popularKeywords) {
      const usedKeywords = researchData.keywordAnalysis.popularKeywords.filter(keyword =>
        optimizedContent.keywords?.includes(keyword) ||
        optimizedContent.optimizedTitle.toLowerCase().includes(keyword.toLowerCase()) ||
        optimizedContent.optimizedDescription.toLowerCase().includes(keyword.toLowerCase())
      );

      const usageRatio = usedKeywords.length / researchData.keywordAnalysis.popularKeywords.length;
      if (usageRatio < 0.3) {
        warnings.push('Optimized content uses few popular keywords from research');
        score -= 15;
      }
    }

    return { isValid: true, errors: [], warnings, score: Math.max(0, score) };
  }
}/*
*
 * Automated quality scoring for generated listings
 */
export class ListingQualityScorer {
  /**
   * Calculates comprehensive quality score for a generated listing
   */
  calculateListingQuality(
    originalDetails: ProductDetails,
    researchData: ResearchData,
    optimizedContent: OptimizedContent
  ): QualityMetrics & { breakdown: Record<string, number>; recommendations: string[] } {
    const productValidator = new ProductDetailsValidator();
    const contentValidator = new OptimizedContentValidator();
    const researchValidator = new ResearchDataValidator();
    const consistencyValidator = new PipelineConsistencyValidator();

    // Individual component scores
    const productMetrics = productValidator.calculateQualityMetrics(originalDetails);
    const contentMetrics = contentValidator.calculateQualityMetrics(optimizedContent, originalDetails);
    const researchMetrics = researchValidator.calculateQualityMetrics(researchData);
    const consistencyResult = consistencyValidator.validatePipelineConsistency(
      originalDetails, researchData, optimizedContent
    );

    // Weighted overall scores
    const completeness = (productMetrics.completeness * 0.2 + contentMetrics.completeness * 0.8);
    const accuracy = (productMetrics.accuracy * 0.3 + contentMetrics.accuracy * 0.4 + researchMetrics.accuracy * 0.3);
    const consistency = (productMetrics.consistency * 0.3 + contentMetrics.consistency * 0.3 + consistencyResult.score * 0.4);
    const optimization = contentMetrics.optimization;

    const overall = (completeness + accuracy + consistency + optimization) / 4;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      productMetrics, contentMetrics, researchMetrics, consistencyResult
    );

    return {
      completeness,
      accuracy,
      consistency,
      optimization,
      overall,
      breakdown: {
        productQuality: productMetrics.overall,
        contentQuality: contentMetrics.overall,
        researchQuality: researchMetrics.overall,
        pipelineConsistency: consistencyResult.score
      },
      recommendations
    };
  }

  private generateRecommendations(
    productMetrics: QualityMetrics,
    contentMetrics: QualityMetrics,
    researchMetrics: QualityMetrics,
    consistencyResult: ValidationResult
  ): string[] {
    const recommendations: string[] = [];

    // Product quality recommendations
    if (productMetrics.completeness < 80) {
      recommendations.push('Improve product data completeness by adding missing specifications or images');
    }
    if (productMetrics.accuracy < 80) {
      recommendations.push('Review product data accuracy, especially pricing and condition information');
    }

    // Content quality recommendations
    if (contentMetrics.completeness < 80) {
      recommendations.push('Enhance optimized content by adding more keywords and selling points');
    }
    if (contentMetrics.optimization < 70) {
      recommendations.push('Improve content optimization by incorporating more research insights');
    }

    // Research quality recommendations
    if (researchMetrics.completeness < 70) {
      recommendations.push('Gather more comprehensive market research data');
    }
    if (researchMetrics.accuracy < 80) {
      recommendations.push('Verify research data accuracy and remove invalid entries');
    }

    // Consistency recommendations
    if (consistencyResult.score < 80) {
      recommendations.push('Improve consistency between original data, research, and optimized content');
    }

    // Specific warnings from consistency check
    recommendations.push(...consistencyResult.warnings.map(w => `Consistency: ${w}`));

    return recommendations;
  }
}

/**
 * Main validation orchestrator
 */
export class DataValidationOrchestrator {
  private productValidator = new ProductDetailsValidator();
  private contentValidator = new OptimizedContentValidator();
  private researchValidator = new ResearchDataValidator();
  private consistencyValidator = new PipelineConsistencyValidator();
  private qualityScorer = new ListingQualityScorer();

  /**
   * Validates all data in the pipeline
   */
  validatePipeline(
    originalDetails: ProductDetails,
    researchData: ResearchData,
    optimizedContent: OptimizedContent
  ): {
    productValidation: ValidationResult;
    contentValidation: ValidationResult;
    researchValidation: ValidationResult;
    consistencyValidation: ValidationResult;
    qualityMetrics: QualityMetrics & { breakdown: Record<string, number>; recommendations: string[] };
    overallValid: boolean;
    overallScore: number;
  } {
    const productValidation = this.productValidator.validate(originalDetails);
    const contentValidation = this.contentValidator.validate(optimizedContent, originalDetails);
    const researchValidation = this.researchValidator.validate(researchData);
    const consistencyValidation = this.consistencyValidator.validatePipelineConsistency(
      originalDetails, researchData, optimizedContent
    );
    const qualityMetrics = this.qualityScorer.calculateListingQuality(
      originalDetails, researchData, optimizedContent
    );

    return {
      productValidation,
      contentValidation,
      researchValidation,
      consistencyValidation,
      qualityMetrics,
      overallValid: productValidation.isValid && contentValidation.isValid && 
                   researchValidation.isValid && consistencyValidation.isValid,
      overallScore: qualityMetrics.overall
    };
  }

  /**
   * Validates individual components
   */
  validateProductDetails(details: ProductDetails) {
    return this.productValidator.validate(details);
  }

  validateOptimizedContent(content: OptimizedContent, originalDetails?: ProductDetails) {
    return this.contentValidator.validate(content, originalDetails);
  }

  validateResearchData(data: ResearchData) {
    return this.researchValidator.validate(data);
  }
}
