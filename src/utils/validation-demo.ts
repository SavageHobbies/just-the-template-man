// Demonstration of the data validation and quality assurance system

import { DataValidationOrchestrator } from './validation';
import { ProductDetails, ResearchData, OptimizedContent } from '../models';

/**
 * Demonstrates the validation system with sample data
 */
export function demonstrateValidation() {
  const orchestrator = new DataValidationOrchestrator();

  console.log('=== eBay Listing Optimizer - Data Validation Demo ===\n');

  // Sample high-quality data
  const goodProductDetails: ProductDetails = {
    title: 'Apple MacBook Pro 16-inch M2 Pro Chip 512GB SSD Space Gray',
    description: 'Brand new Apple MacBook Pro featuring the powerful M2 Pro chip, 16-inch Liquid Retina XDR display, 512GB SSD storage, and 16GB unified memory. Perfect for professionals, creators, and power users.',
    price: 2399.99,
    condition: 'New',
    images: [
      { url: 'https://example.com/macbook1.jpg', size: 'large', isValid: true },
      { url: 'https://example.com/macbook2.jpg', size: 'large', isValid: true }
    ],
    specifications: {
      brand: 'Apple',
      model: 'MacBook Pro',
      processor: 'M2 Pro',
      storage: '512GB SSD'
    },
    seller: 'AppleAuthorizedDealer',
    location: 'Cupertino, CA'
  };

  const goodResearchData: ResearchData = {
    similarListings: [
      { title: 'MacBook Pro 16" M2 Pro 512GB', price: 2350, condition: 'New', platform: 'eBay' },
      { title: 'Apple MacBook Pro M2 Pro 16-inch', price: 2400, condition: 'New', platform: 'Amazon' }
    ],
    priceAnalysis: {
      averagePrice: 2375,
      priceRange: { min: 2200, max: 2500 },
      recommendedPrice: 2349,
      confidence: 0.92
    },
    keywordAnalysis: {
      popularKeywords: ['MacBook', 'Apple', 'M2 Pro', 'laptop', 'professional'],
      keywordFrequency: { 'MacBook': 25, 'Apple': 22, 'M2 Pro': 18 },
      searchVolume: { 'MacBook': 5000, 'Apple': 8000 }
    },
    marketTrends: [
      { period: '2024-01', averagePrice: 2400, salesVolume: 150, trend: 'stable' }
    ]
  };

  const goodOptimizedContent: OptimizedContent = {
    optimizedTitle: 'Apple MacBook Pro 16" M2 Pro 512GB SSD Space Gray - Professional Laptop',
    optimizedDescription: 'Unleash your creativity with the Apple MacBook Pro 16-inch featuring the revolutionary M2 Pro chip. This professional-grade laptop delivers exceptional performance with 512GB SSD storage and stunning display.',
    suggestedPrice: 2349,
    keywords: ['MacBook', 'Apple', 'M2 Pro', 'laptop', 'professional'],
    sellingPoints: [
      'Latest M2 Pro chip for ultimate performance',
      'Large 512GB SSD storage',
      'Perfect for professionals and creators'
    ]
  };

  // Validate high-quality listing
  console.log('1. HIGH-QUALITY LISTING VALIDATION:');
  const goodResult = orchestrator.validatePipeline(
    goodProductDetails,
    goodResearchData,
    goodOptimizedContent
  );

  console.log(`Overall Valid: ${goodResult.overallValid}`);
  console.log(`Overall Score: ${goodResult.overallScore.toFixed(1)}/100`);
  console.log(`Quality Breakdown:`);
  console.log(`  - Completeness: ${goodResult.qualityMetrics.completeness.toFixed(1)}/100`);
  console.log(`  - Accuracy: ${goodResult.qualityMetrics.accuracy.toFixed(1)}/100`);
  console.log(`  - Consistency: ${goodResult.qualityMetrics.consistency.toFixed(1)}/100`);
  console.log(`  - Optimization: ${goodResult.qualityMetrics.optimization.toFixed(1)}/100`);
  
  if (goodResult.qualityMetrics.recommendations.length > 0) {
    console.log(`Recommendations:`);
    goodResult.qualityMetrics.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Sample poor-quality data
  const poorProductDetails: ProductDetails = {
    title: 'laptop',
    description: 'used laptop for sale',
    price: 50,
    condition: 'ok',
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
    optimizedTitle: 'laptop for sale',
    optimizedDescription: 'laptop available',
    suggestedPrice: 60,
    keywords: ['laptop'],
    sellingPoints: ['works']
  };

  // Validate poor-quality listing
  console.log('2. POOR-QUALITY LISTING VALIDATION:');
  const poorResult = orchestrator.validatePipeline(
    poorProductDetails,
    poorResearchData,
    poorOptimizedContent
  );

  console.log(`Overall Valid: ${poorResult.overallValid}`);
  console.log(`Overall Score: ${poorResult.overallScore.toFixed(1)}/100`);
  console.log(`Quality Breakdown:`);
  console.log(`  - Completeness: ${poorResult.qualityMetrics.completeness.toFixed(1)}/100`);
  console.log(`  - Accuracy: ${poorResult.qualityMetrics.accuracy.toFixed(1)}/100`);
  console.log(`  - Consistency: ${poorResult.qualityMetrics.consistency.toFixed(1)}/100`);
  console.log(`  - Optimization: ${poorResult.qualityMetrics.optimization.toFixed(1)}/100`);

  console.log(`\nValidation Issues Found:`);
  
  if (poorResult.productValidation.errors.length > 0) {
    console.log(`Product Errors:`);
    poorResult.productValidation.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  }

  if (poorResult.productValidation.warnings.length > 0) {
    console.log(`Product Warnings:`);
    poorResult.productValidation.warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
  }

  if (poorResult.contentValidation.warnings.length > 0) {
    console.log(`Content Warnings:`);
    poorResult.contentValidation.warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
  }

  console.log(`\nRecommendations for Improvement:`);
  poorResult.qualityMetrics.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('Demo completed! The validation system successfully identified quality differences.');
}

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateValidation();
}
