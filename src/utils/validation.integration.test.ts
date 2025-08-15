// Integration tests for validation system with pipeline

import { describe, it, expect, beforeEach } from 'vitest';
import { DataValidationOrchestrator } from './validation';
import { Pipeline } from '../pipeline';
import { ProductDetails, ResearchData, OptimizedContent } from '../models';

describe('Validation Integration Tests', () => {
  let orchestrator: DataValidationOrchestrator;

  beforeEach(() => {
    orchestrator = new DataValidationOrchestrator();
  });

  describe('Real-world validation scenarios', () => {
    it('should validate a complete high-quality listing', () => {
      const originalDetails: ProductDetails = {
        title: 'Apple MacBook Pro 16-inch M2 Pro Chip 512GB SSD Space Gray',
        description: 'Brand new Apple MacBook Pro featuring the powerful M2 Pro chip, 16-inch Liquid Retina XDR display, 512GB SSD storage, and 16GB unified memory. Perfect for professionals, creators, and power users. Includes original packaging, charger, and documentation.',
        price: 2399.99,
        condition: 'New',
        images: [
          { url: 'https://example.com/macbook1.jpg', size: 'large', isValid: true },
          { url: 'https://example.com/macbook2.jpg', size: 'large', isValid: true },
          { url: 'https://example.com/macbook3.jpg', size: 'medium', isValid: true }
        ],
        specifications: {
          brand: 'Apple',
          model: 'MacBook Pro',
          processor: 'M2 Pro',
          storage: '512GB SSD',
          memory: '16GB',
          display: '16-inch'
        },
        seller: 'AppleAuthorizedDealer',
        location: 'Cupertino, CA'
      };

      const researchData: ResearchData = {
        similarListings: [
          { title: 'MacBook Pro 16" M2 Pro 512GB', price: 2350, condition: 'New', platform: 'eBay' },
          { title: 'Apple MacBook Pro M2 Pro 16-inch', price: 2400, condition: 'New', platform: 'Amazon' },
          { title: 'MacBook Pro 16 M2 Pro Space Gray', price: 2299, condition: 'Used', platform: 'eBay' },
          { title: 'Apple MacBook Pro 16" 512GB', price: 2450, condition: 'New', platform: 'Best Buy' }
        ],
        priceAnalysis: {
          averagePrice: 2375,
          priceRange: { min: 2200, max: 2500 },
          recommendedPrice: 2349,
          confidence: 0.92
        },
        keywordAnalysis: {
          popularKeywords: ['MacBook', 'Apple', 'M2 Pro', 'laptop', 'professional', '16-inch', '512GB'],
          keywordFrequency: {
            'MacBook': 25,
            'Apple': 22,
            'M2 Pro': 18,
            'laptop': 15,
            'professional': 12,
            '16-inch': 20,
            '512GB': 16
          },
          searchVolume: {
            'MacBook': 5000,
            'Apple': 8000,
            'M2 Pro': 2500,
            'laptop': 10000
          }
        },
        marketTrends: [
          { period: '2024-01', averagePrice: 2400, salesVolume: 150, trend: 'stable' },
          { period: '2024-02', averagePrice: 2375, salesVolume: 180, trend: 'decreasing' },
          { period: '2024-03', averagePrice: 2350, salesVolume: 200, trend: 'decreasing' }
        ]
      };

      const optimizedContent: OptimizedContent = {
        optimizedTitle: 'Apple MacBook Pro 16" M2 Pro 512GB SSD Space Gray - Professional Laptop',
        optimizedDescription: 'Unleash your creativity with the Apple MacBook Pro 16-inch featuring the revolutionary M2 Pro chip. This professional-grade laptop delivers exceptional performance with 512GB SSD storage, 16GB unified memory, and stunning Liquid Retina XDR display. Perfect for video editing, software development, and creative work. Includes original Apple packaging, MagSafe charger, and full warranty coverage.',
        suggestedPrice: 2349,
        keywords: ['MacBook', 'Apple', 'M2 Pro', 'laptop', 'professional', '16-inch', '512GB', 'creative'],
        sellingPoints: [
          'Latest M2 Pro chip for ultimate performance',
          'Large 512GB SSD storage',
          'Stunning 16-inch Liquid Retina XDR display',
          'Perfect for professionals and creators',
          'Includes original packaging and warranty'
        ],
        conditionNotes: 'Brand new in sealed original packaging with full manufacturer warranty'
      };

      const result = orchestrator.validatePipeline(
        originalDetails,
        researchData,
        optimizedContent
      );

      expect(result.overallValid).toBe(true);
      expect(result.overallScore).toBeGreaterThan(85);
      expect(result.qualityMetrics.completeness).toBeGreaterThan(90);
      expect(result.qualityMetrics.accuracy).toBeGreaterThan(90);
      expect(result.qualityMetrics.consistency).toBeGreaterThan(85);
      expect(result.qualityMetrics.optimization).toBeGreaterThan(80);
    });

    it('should identify issues in a poor-quality listing', () => {
      const poorOriginalDetails: ProductDetails = {
        title: '', // Empty title should cause validation failure
        description: 'used laptop for sale',
        price: 0, // Zero price should cause validation failure
        condition: '',
        images: [
          { url: 'https://broken.com/image.jpg', size: 'thumbnail', isValid: false }
        ],
        specifications: {},
        seller: '',
        location: ''
      };

      const poorResearchData: ResearchData = {
        similarListings: [
          { title: 'laptop', price: 100, condition: 'used', platform: 'unknown' }
        ],
        priceAnalysis: {
          averagePrice: 100,
          priceRange: { min: 50, max: 150 },
          recommendedPrice: 75,
          confidence: 0.3
        },
        keywordAnalysis: {
          popularKeywords: ['laptop'],
          keywordFrequency: { 'laptop': 1 },
          searchVolume: { 'laptop': 100 }
        },
        marketTrends: []
      };

      const poorOptimizedContent: OptimizedContent = {
        optimizedTitle: '', // Empty title should cause error
        optimizedDescription: 'short', // Very short description
        suggestedPrice: 0, // Zero price should cause error
        keywords: [],
        sellingPoints: [],
        conditionNotes: ''
      };

      const result = orchestrator.validatePipeline(
        poorOriginalDetails,
        poorResearchData,
        poorOptimizedContent
      );

      expect(result.overallValid).toBe(false);
      expect(result.overallScore).toBeLessThan(85);
      expect(result.qualityMetrics.recommendations.length).toBeGreaterThan(3);
      
      // Check for specific quality issues
      expect(result.productValidation.errors).toContain('Product title is required');
      expect(result.productValidation.errors).toContain('Product price must be greater than 0');
      expect(result.contentValidation.errors).toContain('Optimized title is required');
      expect(result.contentValidation.errors).toContain('Suggested price must be greater than 0');
    });

    it('should detect price inconsistencies across pipeline stages', () => {
      const originalDetails: ProductDetails = {
        title: 'Nintendo Switch OLED Console',
        description: 'Nintendo Switch OLED model gaming console',
        price: 349.99,
        condition: 'New',
        images: [{ url: 'https://example.com/switch.jpg', size: 'large', isValid: true }],
        specifications: { brand: 'Nintendo', model: 'Switch OLED' },
        seller: 'GameStore',
        location: 'Seattle, WA'
      };

      const researchData: ResearchData = {
        similarListings: [
          { title: 'Nintendo Switch OLED', price: 320, condition: 'New', platform: 'eBay' },
          { title: 'Switch OLED Console', price: 340, condition: 'New', platform: 'Amazon' }
        ],
        priceAnalysis: {
          averagePrice: 330,
          priceRange: { min: 300, max: 360 },
          recommendedPrice: 335,
          confidence: 0.8
        },
        keywordAnalysis: {
          popularKeywords: ['Nintendo', 'Switch', 'OLED', 'gaming'],
          keywordFrequency: { 'Nintendo': 10, 'Switch': 12 },
          searchVolume: { 'Nintendo': 2000, 'Switch': 1500 }
        },
        marketTrends: []
      };

      const inconsistentOptimizedContent: OptimizedContent = {
        optimizedTitle: 'Nintendo Switch OLED Gaming Console - Premium Experience',
        optimizedDescription: 'Experience gaming like never before with the Nintendo Switch OLED',
        suggestedPrice: 500, // Way too high compared to research
        keywords: ['Nintendo', 'Switch', 'OLED', 'gaming'],
        sellingPoints: ['OLED display', 'Portable gaming'],
        conditionNotes: 'Brand new'
      };

      const result = orchestrator.validatePipeline(
        originalDetails,
        researchData,
        inconsistentOptimizedContent
      );

      expect(result.consistencyValidation.warnings).toContain('Suggested price is outside reasonable market range');
      expect(result.consistencyValidation.score).toBeLessThan(80);
    });

    it('should validate keyword optimization effectiveness', () => {
      const originalDetails: ProductDetails = {
        title: 'Sony WH-1000XM4 Headphones',
        description: 'Sony noise canceling headphones',
        price: 299.99,
        condition: 'New',
        images: [{ url: 'https://example.com/headphones.jpg', size: 'large', isValid: true }],
        specifications: { brand: 'Sony', model: 'WH-1000XM4' },
        seller: 'AudioStore',
        location: 'Los Angeles, CA'
      };

      const researchData: ResearchData = {
        similarListings: [
          { title: 'Sony WH-1000XM4 Wireless', price: 280, condition: 'New', platform: 'eBay' }
        ],
        priceAnalysis: {
          averagePrice: 285,
          priceRange: { min: 250, max: 320 },
          recommendedPrice: 289,
          confidence: 0.85
        },
        keywordAnalysis: {
          popularKeywords: ['Sony', 'WH-1000XM4', 'wireless', 'noise canceling', 'bluetooth', 'premium'],
          keywordFrequency: {
            'Sony': 20,
            'WH-1000XM4': 15,
            'wireless': 18,
            'noise canceling': 22,
            'bluetooth': 16,
            'premium': 12
          },
          searchVolume: {
            'Sony': 3000,
            'wireless': 5000,
            'noise canceling': 4000
          }
        },
        marketTrends: []
      };

      // Test good keyword optimization
      const wellOptimizedContent: OptimizedContent = {
        optimizedTitle: 'Sony WH-1000XM4 Wireless Noise Canceling Bluetooth Headphones - Premium',
        optimizedDescription: 'Experience premium audio with Sony WH-1000XM4 wireless noise canceling headphones featuring advanced bluetooth technology',
        suggestedPrice: 289,
        keywords: ['Sony', 'WH-1000XM4', 'wireless', 'noise canceling', 'bluetooth', 'premium'],
        sellingPoints: ['Industry-leading noise cancellation', 'Premium wireless audio', 'Long battery life'],
        conditionNotes: 'Brand new with warranty'
      };

      const goodResult = orchestrator.validatePipeline(
        originalDetails,
        researchData,
        wellOptimizedContent
      );

      expect(goodResult.qualityMetrics.optimization).toBeGreaterThan(75);

      // Test poor keyword optimization
      const poorlyOptimizedContent: OptimizedContent = {
        optimizedTitle: 'Headphones', // Very short, no brand
        optimizedDescription: 'For sale', // Very short description
        suggestedPrice: 289,
        keywords: [], // No keywords at all
        sellingPoints: [], // No selling points
        conditionNotes: ''
      };

      const poorResult = orchestrator.validatePipeline(
        originalDetails,
        researchData,
        poorlyOptimizedContent
      );

      expect(poorResult.qualityMetrics.optimization).toBeLessThanOrEqual(50);
      expect(poorResult.consistencyValidation.warnings).toContain('Optimized content uses few popular keywords from research');
    });
  });

  describe('Quality metrics benchmarking', () => {
    it('should provide consistent quality scoring across similar listings', () => {
      const baseDetails: ProductDetails = {
        title: 'Apple iPad Pro 12.9-inch 256GB Wi-Fi Space Gray',
        description: 'Apple iPad Pro with M2 chip, 12.9-inch Liquid Retina XDR display, 256GB storage',
        price: 1099.99,
        condition: 'New',
        images: [
          { url: 'https://example.com/ipad1.jpg', size: 'large', isValid: true },
          { url: 'https://example.com/ipad2.jpg', size: 'large', isValid: true }
        ],
        specifications: { brand: 'Apple', model: 'iPad Pro', storage: '256GB' },
        seller: 'TechRetailer',
        location: 'New York, NY'
      };

      const baseResearch: ResearchData = {
        similarListings: [
          { title: 'iPad Pro 12.9 256GB', price: 1050, condition: 'New', platform: 'eBay' },
          { title: 'Apple iPad Pro 12.9"', price: 1100, condition: 'New', platform: 'Amazon' }
        ],
        priceAnalysis: {
          averagePrice: 1075,
          priceRange: { min: 1000, max: 1150 },
          recommendedPrice: 1079,
          confidence: 0.88
        },
        keywordAnalysis: {
          popularKeywords: ['iPad', 'Apple', 'Pro', 'tablet', '12.9-inch', '256GB'],
          keywordFrequency: { 'iPad': 15, 'Apple': 12, 'Pro': 18 },
          searchVolume: { 'iPad': 4000, 'Apple': 6000 }
        },
        marketTrends: []
      };

      const baseOptimized: OptimizedContent = {
        optimizedTitle: 'Apple iPad Pro 12.9" M2 Chip 256GB Wi-Fi Space Gray - Professional Tablet',
        optimizedDescription: 'Powerful Apple iPad Pro featuring M2 chip, stunning 12.9-inch Liquid Retina XDR display, and 256GB storage. Perfect for creative professionals and productivity.',
        suggestedPrice: 1079,
        keywords: ['iPad', 'Apple', 'Pro', 'tablet', '12.9-inch', '256GB', 'M2'],
        sellingPoints: ['M2 chip performance', 'Large display', 'Professional features'],
        conditionNotes: 'Brand new with warranty'
      };

      // Test multiple variations
      const results = [];
      
      // Variation 1: Slightly different title
      const variation1 = {
        ...baseOptimized,
        optimizedTitle: 'Apple iPad Pro 12.9-inch 256GB Space Gray M2 - Premium Tablet'
      };
      results.push(orchestrator.validatePipeline(baseDetails, baseResearch, variation1));

      // Variation 2: Different keywords
      const variation2 = {
        ...baseOptimized,
        keywords: ['iPad', 'Apple', 'Pro', 'creative', 'professional', 'M2']
      };
      results.push(orchestrator.validatePipeline(baseDetails, baseResearch, variation2));

      // All results should have similar overall scores (within 10 points)
      const scores = results.map(r => r.overallScore);
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      
      expect(maxScore - minScore).toBeLessThan(10);
      expect(scores.every(s => s > 75)).toBe(true);
    });
  });
});