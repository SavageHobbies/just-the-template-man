import {
  ProductDetails,
  ResearchData,
  OptimizedContent,
  KeywordAnalysis,
  PriceAnalysis
} from '../models';
import { ContentOptimizer as IContentOptimizer } from './interfaces';

export class ContentOptimizer implements IContentOptimizer {
  private readonly MAX_TITLE_LENGTH = 80; // eBay title character limit
  private readonly MIN_DESCRIPTION_LENGTH = 200;
  private readonly MAX_DESCRIPTION_LENGTH = 1000;

  constructor() {
    // Initialize content optimizer
  }

  async optimizeContent(
    originalDetails: ProductDetails,
    research: ResearchData
  ): Promise<OptimizedContent> {
    // Validate inputs
    this.validateInputs(originalDetails, research);

    // Generate optimized title using keyword analysis
    const optimizedTitle = this.generateOptimizedTitle(originalDetails, research.keywordAnalysis);

    // Create compelling description highlighting key features
    const optimizedDescription = this.generateOptimizedDescription(originalDetails, research);

    // Calculate suggested price based on market data
    const suggestedPrice = this.calculateSuggestedPrice(originalDetails, research.priceAnalysis);

    // Extract relevant keywords for SEO
    const keywords = this.extractRelevantKeywords(research.keywordAnalysis);

    // Generate selling points from research and original details
    const sellingPoints = this.generateSellingPoints(originalDetails, research);

    // Validate generated content consistency
    this.validateContentConsistency(originalDetails, {
      optimizedTitle,
      optimizedDescription,
      suggestedPrice,
      keywords,
      sellingPoints
    });

    return {
      optimizedTitle,
      optimizedDescription,
      suggestedPrice,
      keywords,
      sellingPoints
    };
  }

  private validateInputs(originalDetails: ProductDetails, research: ResearchData): void {
    if (!originalDetails) {
      throw new Error('Original product details are required');
    }

    if (!originalDetails.title || originalDetails.title.trim().length === 0) {
      throw new Error('Product title is required');
    }

    if (!originalDetails.description || originalDetails.description.trim().length === 0) {
      throw new Error('Product description is required');
    }

    if (!research) {
      throw new Error('Research data is required');
    }

    if (!research.keywordAnalysis) {
      throw new Error('Keyword analysis is required');
    }

    if (!research.priceAnalysis) {
      throw new Error('Price analysis is required');
    }
  }

  private generateOptimizedTitle(originalDetails: ProductDetails, keywordAnalysis: KeywordAnalysis): string {
    const { title } = originalDetails;
    const { popularKeywords, keywordFrequency } = keywordAnalysis;

    // Extract key product information from original title
    const originalWords = this.extractWordsFromTitle(title);
    
    // Get high-value keywords not already in title
    const missingKeywords = popularKeywords.filter(keyword => 
      !title.toLowerCase().includes(keyword.toLowerCase())
    );

    // Sort keywords by frequency and search volume
    const prioritizedKeywords = missingKeywords
      .sort((a, b) => (keywordFrequency[b] || 0) - (keywordFrequency[a] || 0))
      .slice(0, 3); // Limit to top 3 missing keywords

    // Build optimized title
    let optimizedTitle = title.trim();

    // Add high-value keywords if space allows
    for (const keyword of prioritizedKeywords) {
      const testTitle = `${optimizedTitle} ${keyword}`;
      if (testTitle.length <= this.MAX_TITLE_LENGTH) {
        optimizedTitle = testTitle;
      } else {
        break;
      }
    }

    // Ensure title is within character limit
    if (optimizedTitle.length > this.MAX_TITLE_LENGTH) {
      optimizedTitle = this.truncateTitle(optimizedTitle, this.MAX_TITLE_LENGTH);
    }

    // Capitalize first letter of each word for better presentation
    optimizedTitle = this.capitalizeTitle(optimizedTitle);

    return optimizedTitle;
  }

  private extractWordsFromTitle(title: string): string[] {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  private truncateTitle(title: string, maxLength: number): string {
    if (title.length <= maxLength) {
      return title;
    }

    // Find the last complete word that fits
    const truncated = title.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex);
    }
    
    return truncated;
  }

  private capitalizeTitle(title: string): string {
    return title
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        // Don't capitalize common prepositions and articles unless they're the first word
        const lowercaseWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        const isFirstWord = title.split(' ').indexOf(word) === 0;
        
        if (!isFirstWord && lowercaseWords.includes(word.toLowerCase())) {
          return word.toLowerCase();
        }
        
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  private generateOptimizedDescription(originalDetails: ProductDetails, research: ResearchData): string {
    const { title, description, specifications } = originalDetails;
    
    // Clean the original title and description
    const cleanTitle = this.cleanText(title);
    const cleanDescription = this.cleanText(description);
    
    // Extract product features from specifications
    const productFeatures = this.extractProductFeatures(specifications);
    
    // Build engaging product description focused on the product, not condition
    const sections = [
      `Discover this exceptional ${cleanTitle} - perfect for discerning buyers seeking quality and value.`,
      productFeatures.length > 0 ? `Key Features & Benefits:\n${productFeatures.map(f => `• ${f}`).join('\n')}` : '',
      'Fast and secure shipping',
      'Satisfaction guaranteed'
    ].filter(section => section.length > 0);

    return sections.join('\n\n');
  }

  private extractProductFeatures(specifications: Record<string, string>): string[] {
    const features: string[] = [];
    
    // Convert specifications to readable features, excluding condition
    Object.entries(specifications).forEach(([key, value]) => {
      if (value && value.trim().length > 0 && !key.toLowerCase().includes('condition')) {
        // Format as readable feature
        if (key.toLowerCase().includes('brand')) {
          features.push(`${key}: ${value}`);
        } else if (key.toLowerCase().includes('model') || key.toLowerCase().includes('mpn')) {
          features.push(`${key}: ${value}`);
        } else if (key.toLowerCase().includes('size') || key.toLowerCase().includes('dimension')) {
          features.push(`${key}: ${value}`);
        } else {
          features.push(`${key}: ${value}`);
        }
      }
    });
    
    // Add generic quality features if no specific features found
    if (features.length === 0) {
      features.push('High-quality construction');
      features.push('Reliable performance');
      features.push('Excellent value for money');
    }
    
    return features.slice(0, 5);
  }

  private cleanText(text: string): string {
    if (!text) return '';
    
    return text
      // Fix missing spaces between words
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Fix missing spaces after punctuation
      .replace(/([.,:;])([A-Za-z])/g, '$1 $2')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove repetitive condition text
      .replace(/condition[^.]*?condition[^.]*/gi, 'condition')
      // Clean up
      .trim();
  }

  private generateOpeningLine(originalDetails: ProductDetails, keywordAnalysis: KeywordAnalysis): string {
    const { title } = originalDetails;
    const topKeywords = keywordAnalysis.popularKeywords.slice(0, 2);
    
    // Create an engaging opening that includes top keywords
    const productName = title.split(' ').slice(0, 3).join(' ');
    const keywordPhrase = topKeywords.length > 0 ? ` featuring ${topKeywords.join(' and ')}` : '';
    
    return `Discover this exceptional ${productName}${keywordPhrase} - perfect for discerning buyers seeking quality and value.`;
  }

  private extractKeyFeatures(description: string, specifications: Record<string, string>): string[] {
    const features: string[] = [];

    // Extract features from specifications
    Object.entries(specifications).forEach(([key, value]) => {
      if (value && value.trim().length > 0) {
        features.push(`${key}: ${value}`);
      }
    });

    // Extract bullet points or numbered lists from description
    const bulletRegex = /[•\-\*]\s*(.+)/g;
    let match;
    while ((match = bulletRegex.exec(description)) !== null) {
      features.push(match[1].trim());
    }

    // Extract sentences that mention key product attributes
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const featureKeywords = ['feature', 'include', 'comes with', 'equipped', 'designed', 'made', 'quality', 'premium'];
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      if (featureKeywords.some(keyword => lowerSentence.includes(keyword))) {
        features.push(sentence.trim());
      }
    });

    return features.slice(0, 5); // Limit to top 5 features
  }

  private generateBenefitsSection(keyFeatures: string[], keywordAnalysis: KeywordAnalysis): string {
    if (keyFeatures.length === 0) {
      return '';
    }

    const benefitsIntro = 'Key Features & Benefits:';
    const benefitsList = keyFeatures
      .map(feature => `• ${feature}`)
      .join('\n');

    return `${benefitsIntro}\n${benefitsList}`;
  }


  private generateCompetitiveAdvantages(originalDetails: ProductDetails, similarListings: any[]): string {
    if (similarListings.length === 0) {
      return '';
    }

    const advantages: string[] = [];

    // Price competitiveness
    const avgPrice = similarListings.reduce((sum, listing) => sum + listing.price, 0) / similarListings.length;
    if (originalDetails.price < avgPrice * 0.95) {
      advantages.push('Competitively priced below market average');
    }

    // Seller location advantage
    if (originalDetails.location) {
      advantages.push(`Fast shipping from ${originalDetails.location}`);
    }

    // Quality assurance
    advantages.push('Carefully inspected and accurately described');
    advantages.push('Satisfaction guaranteed with hassle-free returns');

    if (advantages.length === 0) {
      return '';
    }

    return `Why Choose This Item:\n${advantages.map(adv => `• ${adv}`).join('\n')}`;
  }

  private generateCallToAction(): string {
    const ctas = [
      'Don\'t miss out - order now while supplies last!',
      'Buy with confidence - your satisfaction is our priority.',
      'Questions? Feel free to message us anytime.',
      'Add to cart today and enjoy fast, secure shipping.'
    ];

    return ctas[Math.floor(Math.random() * ctas.length)];
  }

  private expandDescription(description: string, originalDetails: ProductDetails): string {
    const expansions: string[] = [];

    // Add more detail about specifications
    if (Object.keys(originalDetails.specifications).length > 0) {
      expansions.push('\nDetailed Specifications:');
      Object.entries(originalDetails.specifications).forEach(([key, value]) => {
        expansions.push(`${key}: ${value}`);
      });
    }

    // Add shipping and handling information
    expansions.push('\nShipping & Handling:');
    expansions.push('• Fast and secure packaging');
    expansions.push('• Multiple shipping options available');
    expansions.push('• Tracking information provided');

    return description + '\n' + expansions.join('\n');
  }

  private truncateDescription(description: string, maxLength: number): string {
    if (description.length <= maxLength) {
      return description;
    }

    // Find the last complete sentence that fits
    const truncated = description.substring(0, maxLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );

    if (lastSentenceEnd > maxLength * 0.8) {
      return truncated.substring(0, lastSentenceEnd + 1);
    }

    // If no good sentence break, find last complete word
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpaceIndex) + '...';
  }

  private calculateSuggestedPrice(originalDetails: ProductDetails, priceAnalysis: PriceAnalysis): number {
    const { price: originalPrice } = originalDetails;
    const { recommendedPrice, averagePrice, confidence } = priceAnalysis;

    // Use recommended price from analysis as base
    let suggestedPrice = recommendedPrice;

    // Apply confidence-based adjustment
    if (confidence < 0.7) {
      // Low confidence - be more conservative, stay closer to original
      const conservativeAdjustment = (recommendedPrice - originalPrice) * 0.5;
      suggestedPrice = originalPrice + conservativeAdjustment;
    }

    // Ensure price is reasonable (not more than 50% above or below average)
    const maxPrice = averagePrice * 1.5;
    const minPrice = averagePrice * 0.5;

    suggestedPrice = Math.max(minPrice, Math.min(maxPrice, suggestedPrice));

    // Round to reasonable precision (2 decimal places)
    return Math.round(suggestedPrice * 100) / 100;
  }

  private extractRelevantKeywords(keywordAnalysis: KeywordAnalysis): string[] {
    const { popularKeywords, keywordFrequency, searchVolume } = keywordAnalysis;

    // Combine and score keywords
    const keywordScores: Record<string, number> = {};

    // Score based on popularity
    popularKeywords.forEach((keyword, index) => {
      keywordScores[keyword] = (popularKeywords.length - index) * 2;
    });

    // Add frequency scores
    Object.entries(keywordFrequency).forEach(([keyword, frequency]) => {
      keywordScores[keyword] = (keywordScores[keyword] || 0) + frequency;
    });

    // Add search volume scores (normalized)
    const maxSearchVolume = Math.max(...Object.values(searchVolume));
    Object.entries(searchVolume).forEach(([keyword, volume]) => {
      const normalizedScore = (volume / maxSearchVolume) * 10;
      keywordScores[keyword] = (keywordScores[keyword] || 0) + normalizedScore;
    });

    // Sort by score and return top keywords
    return Object.entries(keywordScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([keyword]) => keyword);
  }

  private generateSellingPoints(originalDetails: ProductDetails, research: ResearchData): string[] {
    const sellingPoints: string[] = [];

    // Price-based selling points
    const { priceAnalysis } = research;
    if (originalDetails.price < priceAnalysis.averagePrice * 0.9) {
      sellingPoints.push('Great value - priced below market average');
    }

    // Condition-based selling points
    const condition = originalDetails.condition.toLowerCase();
    if (condition.includes('new')) {
      sellingPoints.push('Brand new condition with original packaging');
    } else if (condition.includes('excellent') || condition.includes('like new')) {
      sellingPoints.push('Excellent condition - barely used');
    }

    // Feature-based selling points from specifications
    Object.entries(originalDetails.specifications).forEach(([key, value]) => {
      if (value && key.toLowerCase().includes('warranty')) {
        sellingPoints.push(`${key}: ${value}`);
      }
    });

    // Generic quality selling points
    sellingPoints.push('Fast and secure shipping');
    sellingPoints.push('Satisfaction guaranteed');
    sellingPoints.push('Detailed photos and accurate description');

    return sellingPoints.slice(0, 6); // Limit to 6 selling points
  }


  private validateContentConsistency(originalDetails: ProductDetails, optimizedContent: OptimizedContent): void {
    const { title, price } = originalDetails;
    const { optimizedTitle, suggestedPrice } = optimizedContent;

    // Validate title consistency - should contain core product information
    const originalWords = this.extractWordsFromTitle(title);
    const optimizedWords = this.extractWordsFromTitle(optimizedTitle);
    
    const commonWords = originalWords.filter(word => 
      optimizedWords.some(optWord => optWord.includes(word) || word.includes(optWord))
    );

    if (commonWords.length < originalWords.length * 0.5) {
      throw new Error('Optimized title deviates too much from original product identity');
    }

    // Validate price reasonableness
    const priceChange = Math.abs(suggestedPrice - price) / price;
    if (priceChange > 0.5) {
      throw new Error('Suggested price change is too dramatic - may indicate inconsistency');
    }

    // Validate title length
    if (optimizedTitle.length > this.MAX_TITLE_LENGTH) {
      throw new Error(`Optimized title exceeds maximum length of ${this.MAX_TITLE_LENGTH} characters`);
    }
  }
}
