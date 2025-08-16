// Tests for data validation and quality assurance

import { describe, it, expect } from 'vitest';
import {
  ProductDetailsValidator,
  OptimizedContentValidator,
  ResearchDataValidator,
  PipelineConsistencyValidator,
  ListingQualityScorer,
  DataValidationOrchestrator
} from './validation';
import {
  ProductDetails,
  OptimizedContent,
  ResearchData,
  ImageData,
  PriceAnalysis,
  KeywordAnalysis,
  MarketTrend
} from '../models';

describe('ProductDetailsValidator', () => {
  const validator = new ProductDetailsValidator();

  const validProductDetails: ProductDetails = {
    title: 'Apple iPhone 14 Pro Max 256GB Space Black Unlocked',
    description: 'Brand new Apple iPhone 14 Pro Max with 256GB storage in Space Black color. Factory unlocked and ready to use with any carrier.',
    price: 999.99,
    condition: 'New',
    images: [
      { url: 'https://example.com/image1.jpg', size: 'large', isValid: true },
      { url: 'https://example.com/image2.jpg', size: 'medium', isValid: true }
    ],
    specifications: { brand: 'Apple', model: 'iPhone 14 Pro Max', storage: '256GB' },
    seller: 'TechStore123',
    location: 'New York, NY'
  };

  it('should validate complete product details successfully', () => {
    const result = validator.validate(validProductDetails);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.score).toBeGreaterThan(90);
  });

  it('should detect missing required fields', () => {
    const incompleteDetails = {
      title: '',
      description: '',
      price: 0,
      condition: ''
    } as Partial<ProductDetails>;

    const result = validator.validate(incompleteDetails);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Product title is required');
    expect(result.errors).toContain('Product description is required');
    expect(result.errors).toContain('Product price must be greater than 0');
    expect(result.errors).toContain('Product condition is required');
    expect(result.score).toBeLessThan(50);
  });

  it('should warn about short title and description', () => {
    const shortDetails: Partial<ProductDetails> = {
      title: 'iPhone',
      description: 'Phone for sale',
      price: 100,
      condition: 'Used'
    };

    const result = validator.validate(shortDetails);
    
    expect(result.warnings).toContain('Product title is very short (less than 10 characters)');
    expect(result.warnings).toContain('Product description is very short (less than 50 characters)');
  });

  it('should warn about unusually high price', () => {
    const expensiveDetails: Partial<ProductDetails> = {
      ...validProductDetails,
      price: 150000
    };

    const result = validator.validate(expensiveDetails);
    
    expect(result.warnings).toContain('Product price is unusually high (over $100,000)');
  });

  it('should calculate quality metrics correctly', () => {
    const metrics = validator.calculateQualityMetrics(validProductDetails);
    
    expect(metrics.completeness).toBeGreaterThan(90);
    expect(metrics.accuracy).toBeGreaterThan(90);
    expect(metrics.consistency).toBeGreaterThan(80);
    expect(metrics.overall).toBeGreaterThan(85);
  });

  it('should detect invalid images', () => {
    const detailsWithInvalidImages: ProductDetails = {
      ...validProductDetails,
      images: [
        { url: 'https://example.com/valid.jpg', size: 'large', isValid: true },
        { url: 'https://broken.com/invalid.jpg', size: 'medium', isValid: false }
      ]
    };

    const result = validator.validate(detailsWithInvalidImages);
    
    expect(result.warnings).toContain('1 invalid image(s) found');
  });
});

describe('OptimizedContentValidator', () => {
  const validator = new OptimizedContentValidator();

  const validOptimizedContent: OptimizedContent = {
    optimizedTitle: 'Apple iPhone 14 Pro Max 256GB Space Black Unlocked - Brand New',
    optimizedDescription: 'Experience the ultimate in smartphone technology with the Apple iPhone 14 Pro Max. This premium device features 256GB of storage, stunning Space Black finish, and comes factory unlocked for use with any carrier. Perfect for professionals and tech enthusiasts.',
    suggestedPrice: 949.99,
    keywords: ['iPhone', 'Apple', 'smartphone', 'unlocked', '256GB'],
    sellingPoints: ['Latest iPhone model', 'Large storage capacity', 'Factory unlocked', 'Premium build quality']
  };

  const originalDetails: ProductDetails = {
    title: 'iPhone 14 Pro Max 256GB',
    description: 'iPhone for sale',
    price: 999.99,
    condition: 'New',
    images: [],
    specifications: {},
    seller: 'TestSeller',
    location: 'Test Location'
  };

  it('should validate complete optimized content successfully', () => {
    const result = validator.validate(validOptimizedContent, originalDetails);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.score).toBeGreaterThan(85);
  });

  it('should detect missing required fields', () => {
    const incompleteContent = {
      optimizedTitle: '',
      optimizedDescription: '',
      suggestedPrice: 0
    } as Partial<OptimizedContent>;

    const result = validator.validate(incompleteContent);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Optimized title is required');
    expect(result.errors).toContain('Optimized description is required');
    expect(result.errors).toContain('Suggested price must be greater than 0');
  });

  it('should detect title length violations', () => {
    const longTitleContent: Partial<OptimizedContent> = {
      optimizedTitle: 'This is an extremely long title that exceeds the eBay character limit of 80 characters and should trigger an error',
      optimizedDescription: 'Valid description',
      suggestedPrice: 100
    };

    const result = validator.validate(longTitleContent);
    
    expect(result.errors).toContain('Optimized title exceeds eBay limit (80 characters)');
  });

  it('should calculate quality metrics correctly', () => {
    const metrics = validator.calculateQualityMetrics(validOptimizedContent, originalDetails);
    
    expect(metrics.completeness).toBeGreaterThan(90);
    expect(metrics.accuracy).toBeGreaterThan(90);
    expect(metrics.optimization).toBeGreaterThan(60);
    expect(metrics.overall).toBeGreaterThan(80);
  });

  it('should warn about inconsistency with original details', () => {
    const inconsistentContent: OptimizedContent = {
      ...validOptimizedContent,
      suggestedPrice: 3000, // Much higher than original $999.99 (3x ratio)
      optimizedTitle: 'Samsung Galaxy Phone' // Completely different product
    };

    const result = validator.validate(inconsistentContent, originalDetails);
    
    expect(result.warnings).toContain('Optimized content may not be consistent with original details');
  });
});

describe('ResearchDataValidator', () => {
  const validator = new ResearchDataValidator();

  const validResearchData: ResearchData = {
    similarListings: [
      { title: 'iPhone 14 Pro Max 256GB', price: 950, condition: 'New', platform: 'eBay' },
      { title: 'Apple iPhone 14 Pro Max', price: 980, condition: 'Used', platform: 'Amazon' },
      { title: 'iPhone 14 Pro Max Space Black', price: 920, condition: 'New', platform: 'eBay' }
    ],
    priceAnalysis: {
      averagePrice: 950,
      priceRange: { min: 900, max: 1000 },
      recommendedPrice: 949,
      confidence: 0.85
    },
    keywordAnalysis: {
      popularKeywords: ['iPhone', 'Apple', 'smartphone', 'unlocked'],
      keywordFrequency: { 'iPhone': 10, 'Apple': 8, 'smartphone': 6 },
      searchVolume: { 'iPhone': 1000, 'Apple': 800 }
    },
    marketTrends: [
      { period: '2024-01', averagePrice: 940, salesVolume: 100, trend: 'stable' },
      { period: '2024-02', averagePrice: 950, salesVolume: 120, trend: 'increasing' }
    ]
  };

  it('should validate complete research data successfully', () => {
    const result = validator.validate(validResearchData);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.score).toBeGreaterThan(90);
  });

  it('should warn about missing similar listings', () => {
    const noListingsData: Partial<ResearchData> = {
      ...validResearchData,
      similarListings: []
    };

    const result = validator.validate(noListingsData);
    
    expect(result.warnings).toContain('No similar listings found');
  });

  it('should detect invalid price analysis', () => {
    const invalidPriceData: Partial<ResearchData> = {
      ...validResearchData,
      priceAnalysis: {
        averagePrice: -100,
        priceRange: { min: 1000, max: 500 }, // Invalid range
        recommendedPrice: 0,
        confidence: 1.5 // Invalid confidence
      }
    };

    const result = validator.validate(invalidPriceData);
    
    expect(result.errors).toContain('Average price must be greater than 0');
    expect(result.errors).toContain('Price range minimum must be less than maximum');
    expect(result.errors).toContain('Recommended price must be greater than 0');
    expect(result.errors).toContain('Price confidence must be between 0 and 1');
  });

  it('should calculate quality metrics correctly', () => {
    const metrics = validator.calculateQualityMetrics(validResearchData);
    
    expect(metrics.completeness).toBeGreaterThan(90);
    expect(metrics.accuracy).toBeGreaterThan(90);
    expect(metrics.consistency).toBeGreaterThan(80);
    expect(metrics.overall).toBeGreaterThan(85);
  });

  it('should detect invalid market trends', () => {
    const invalidTrendsData: Partial<ResearchData> = {
      ...validResearchData,
      marketTrends: [
        { period: '', averagePrice: -50, salesVolume: 100, trend: 'invalid' as any }
      ]
    };

    const result = validator.validate(invalidTrendsData);
    
    expect(result.warnings).toContain('1 invalid market trend(s) found');
  });
});

describe('PipelineConsistencyValidator', () => {
  const validator = new PipelineConsistencyValidator();

  const originalDetails: ProductDetails = {
    title: 'iPhone 14 Pro Max 256GB',
    description: 'iPhone for sale',
    price: 999.99,
    condition: 'New',
    images: [],
    specifications: {},
    seller: 'TestSeller',
    location: 'Test Location'
  };

  const researchData: ResearchData = {
    similarListings: [
      { title: 'iPhone 14 Pro Max', price: 950, condition: 'New', platform: 'eBay' }
    ],
    priceAnalysis: {
      averagePrice: 950,
      priceRange: { min: 900, max: 1000 },
      recommendedPrice: 949,
      confidence: 0.85
    },
    keywordAnalysis: {
      popularKeywords: ['iPhone', 'Apple', 'smartphone'],
      keywordFrequency: { 'iPhone': 10 },
      searchVolume: { 'iPhone': 1000 }
    },
    marketTrends: []
  };

  const optimizedContent: OptimizedContent = {
    optimizedTitle: 'Apple iPhone 14 Pro Max 256GB Space Black - Premium Smartphone',
    optimizedDescription: 'Premium Apple iPhone with advanced features',
    suggestedPrice: 949,
    keywords: ['iPhone', 'Apple', 'smartphone'],
    sellingPoints: ['Latest model', 'High quality']
  };

  it('should validate consistent pipeline data successfully', () => {
    const result = validator.validatePipelineConsistency(
      originalDetails,
      researchData,
      optimizedContent
    );
    
    expect(result.isValid).toBe(true);
    expect(result.score).toBeGreaterThan(80);
  });

  it('should detect price inconsistency', () => {
    const inconsistentContent: OptimizedContent = {
      ...optimizedContent,
      suggestedPrice: 2000 // Way outside market range
    };

    const result = validator.validatePipelineConsistency(
      originalDetails,
      researchData,
      inconsistentContent
    );
    
    expect(result.warnings).toContain('Suggested price is outside reasonable market range');
  });

  it('should detect title inconsistency', () => {
    const inconsistentContent: OptimizedContent = {
      ...optimizedContent,
      optimizedTitle: 'Samsung Galaxy Phone' // Completely different product
    };

    const result = validator.validatePipelineConsistency(
      originalDetails,
      researchData,
      inconsistentContent
    );
    
    expect(result.warnings).toContain('Optimized title may not preserve key elements from original');
  });
});

describe('ListingQualityScorer', () => {
  const scorer = new ListingQualityScorer();

  const originalDetails: ProductDetails = {
    title: 'iPhone 14 Pro Max 256GB Space Black',
    description: 'Apple iPhone 14 Pro Max with 256GB storage in excellent condition',
    price: 999.99,
    condition: 'New',
    images: [{ url: 'https://example.com/image.jpg', size: 'large', isValid: true }],
    specifications: { brand: 'Apple', storage: '256GB' },
    seller: 'TechStore',
    location: 'New York'
  };

  const researchData: ResearchData = {
    similarListings: [
      { title: 'iPhone 14 Pro Max', price: 950, condition: 'New', platform: 'eBay' },
      { title: 'Apple iPhone 14 Pro Max', price: 980, condition: 'Used', platform: 'Amazon' }
    ],
    priceAnalysis: {
      averagePrice: 965,
      priceRange: { min: 900, max: 1000 },
      recommendedPrice: 949,
      confidence: 0.85
    },
    keywordAnalysis: {
      popularKeywords: ['iPhone', 'Apple', 'smartphone', 'unlocked'],
      keywordFrequency: { 'iPhone': 10, 'Apple': 8 },
      searchVolume: { 'iPhone': 1000, 'Apple': 800 }
    },
    marketTrends: [
      { period: '2024-01', averagePrice: 950, salesVolume: 100, trend: 'stable' }
    ]
  };

  const optimizedContent: OptimizedContent = {
    optimizedTitle: 'Apple iPhone 14 Pro Max 256GB Space Black Unlocked - Premium Smartphone',
    optimizedDescription: 'Experience cutting-edge technology with the Apple iPhone 14 Pro Max. Features 256GB storage, stunning Space Black design, and factory unlocked compatibility. Perfect for professionals and tech enthusiasts who demand the best.',
    suggestedPrice: 949,
    keywords: ['iPhone', 'Apple', 'smartphone', 'unlocked', '256GB'],
    sellingPoints: ['Latest iPhone model', 'Large storage capacity', 'Factory unlocked', 'Premium build quality']
  };

  it('should calculate comprehensive quality metrics', () => {
    const result = scorer.calculateListingQuality(
      originalDetails,
      researchData,
      optimizedContent
    );
    
    expect(result.completeness).toBeGreaterThan(80);
    expect(result.accuracy).toBeGreaterThan(80);
    expect(result.consistency).toBeGreaterThan(80);
    expect(result.optimization).toBeGreaterThan(60);
    expect(result.overall).toBeGreaterThan(75);
    
    expect(result.breakdown).toHaveProperty('productQuality');
    expect(result.breakdown).toHaveProperty('contentQuality');
    expect(result.breakdown).toHaveProperty('researchQuality');
    expect(result.breakdown).toHaveProperty('pipelineConsistency');
    
    expect(result.recommendations).toBeInstanceOf(Array);
  });

  it('should generate appropriate recommendations for low quality scores', () => {
    const poorOriginalDetails: ProductDetails = {
      title: 'Phone',
      description: 'Old phone',
      price: 0,
      condition: '',
      images: [],
      specifications: {},
      seller: '',
      location: ''
    };

    const poorOptimizedContent: OptimizedContent = {
      optimizedTitle: 'Phone',
      optimizedDescription: 'Phone for sale',
      suggestedPrice: 50,
      keywords: [],
    sellingPoints: []
    };

    const result = scorer.calculateListingQuality(
      poorOriginalDetails,
      researchData,
      poorOptimizedContent
    );
    
    expect(result.overall).toBeLessThan(70);
    expect(result.recommendations.length).toBeGreaterThan(3);
    expect(result.recommendations.some(r => r.includes('completeness'))).toBe(true);
  });
});

describe('DataValidationOrchestrator', () => {
  const orchestrator = new DataValidationOrchestrator();

  const originalDetails: ProductDetails = {
    title: 'iPhone 14 Pro Max 256GB Space Black',
    description: 'Apple iPhone 14 Pro Max with 256GB storage',
    price: 999.99,
    condition: 'New',
    images: [{ url: 'https://example.com/image.jpg', size: 'large', isValid: true }],
    specifications: { brand: 'Apple' },
    seller: 'TechStore',
    location: 'New York'
  };

  const researchData: ResearchData = {
    similarListings: [
      { title: 'iPhone 14 Pro Max', price: 950, condition: 'New', platform: 'eBay' }
    ],
    priceAnalysis: {
      averagePrice: 950,
      priceRange: { min: 900, max: 1000 },
      recommendedPrice: 949,
      confidence: 0.85
    },
    keywordAnalysis: {
      popularKeywords: ['iPhone', 'Apple'],
      keywordFrequency: { 'iPhone': 10 },
      searchVolume: { 'iPhone': 1000 }
    },
    marketTrends: []
  };

  const optimizedContent: OptimizedContent = {
    optimizedTitle: 'Apple iPhone 14 Pro Max 256GB Space Black - Premium',
    optimizedDescription: 'Premium Apple iPhone 14 Pro Max with advanced features and 256GB storage',
    suggestedPrice: 949,
    keywords: ['iPhone', 'Apple'],
    sellingPoints: ['Latest model']
  };

  it('should validate complete pipeline successfully', () => {
    const result = orchestrator.validatePipeline(
      originalDetails,
      researchData,
      optimizedContent
    );
    
    expect(result.overallValid).toBe(true);
    expect(result.overallScore).toBeGreaterThan(70);
    expect(result.productValidation.isValid).toBe(true);
    expect(result.contentValidation.isValid).toBe(true);
    expect(result.researchValidation.isValid).toBe(true);
    expect(result.consistencyValidation.isValid).toBe(true);
    expect(result.qualityMetrics).toHaveProperty('overall');
  });

  it('should validate individual components', () => {
    const productResult = orchestrator.validateProductDetails(originalDetails);
    const contentResult = orchestrator.validateOptimizedContent(optimizedContent, originalDetails);
    const researchResult = orchestrator.validateResearchData(researchData);
    
    expect(productResult.isValid).toBe(true);
    expect(contentResult.isValid).toBe(true);
    expect(researchResult.isValid).toBe(true);
  });

  it('should detect overall pipeline failure when components fail', () => {
    const invalidOriginalDetails: ProductDetails = {
      title: '',
      description: '',
      price: 0,
      condition: '',
      images: [],
      specifications: {},
      seller: '',
      location: ''
    };

    const result = orchestrator.validatePipeline(
      invalidOriginalDetails,
      researchData,
      optimizedContent
    );
    
    expect(result.overallValid).toBe(false);
    expect(result.productValidation.isValid).toBe(false);
  });
});
