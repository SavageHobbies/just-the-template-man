import { MarketResearchEngine } from './MarketResearchEngine';
import { ProductDetails } from '../models';

describe('MarketResearchEngine Integration Tests', () => {
  let marketResearchEngine: MarketResearchEngine;

  beforeEach(() => {
    marketResearchEngine = new MarketResearchEngine();
  });

  it('should perform comprehensive research for a real-world product', async () => {
    const realWorldProduct: ProductDetails = {
      title: 'Sony PlayStation 5 Console - White',
      description: 'Brand new Sony PlayStation 5 gaming console in white. Includes DualSense wireless controller, base, HDMI cable, AC power cord, USB cable, and quick start guide. Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, adaptive triggers, and 3D Audio.',
      price: 499.99,
      condition: 'New',
      images: [
        {
          url: 'https://example.com/ps5-1.jpg',
          altText: 'PlayStation 5 Console Front View',
          size: 'large',
          isValid: true
        },
        {
          url: 'https://example.com/ps5-2.jpg',
          altText: 'PlayStation 5 Console Side View',
          size: 'large',
          isValid: true
        }
      ],
      specifications: {
        'Brand': 'Sony',
        'Model': 'PlayStation 5',
        'Color': 'White',
        'Storage': '825GB SSD',
        'Connectivity': 'Wi-Fi, Bluetooth, Ethernet'
      },
      seller: 'GameStore Pro',
      location: 'New York, NY'
    };

    const result = await marketResearchEngine.conductResearch(realWorldProduct);

    // Verify comprehensive research data
    expect(result.similarListings.length).toBeGreaterThan(5);
    expect(result.priceAnalysis.averagePrice).toBeGreaterThan(0);
    expect(result.priceAnalysis.confidence).toBeGreaterThan(0.3);
    expect(result.keywordAnalysis.popularKeywords).toContain('playstation');
    expect(result.marketTrends.length).toBe(4);

    // Verify realistic pricing recommendations
    expect(result.priceAnalysis.recommendedPrice).toBeGreaterThan(300);
    expect(result.priceAnalysis.recommendedPrice).toBeLessThan(800);

    // Verify keyword extraction quality
    const keywords = result.keywordAnalysis.popularKeywords.join(' ').toLowerCase();
    expect(keywords).toMatch(/sony|playstation|console|gaming/);

    // Verify market trends show reasonable data
    result.marketTrends.forEach(trend => {
      expect(trend.averagePrice).toBeGreaterThan(200);
      expect(trend.salesVolume).toBeGreaterThan(0);
      expect(['increasing', 'decreasing', 'stable']).toContain(trend.trend);
    });

    console.log('Research Results Summary:');
    console.log(`- Found ${result.similarListings.length} similar listings`);
    console.log(`- Average price: $${result.priceAnalysis.averagePrice}`);
    console.log(`- Recommended price: $${result.priceAnalysis.recommendedPrice}`);
    console.log(`- Confidence: ${(result.priceAnalysis.confidence * 100).toFixed(1)}%`);
    console.log(`- Top keywords: ${result.keywordAnalysis.popularKeywords.slice(0, 5).join(', ')}`);
  }, 10000); // Increase timeout for integration test

  it('should handle different product categories effectively', async () => {
    const products = [
      {
        title: 'Apple MacBook Pro 16-inch M2 Max',
        description: 'Professional laptop with M2 Max chip',
        price: 2499.99,
        condition: 'New'
      },
      {
        title: 'Nike Air Jordan 1 Retro High OG Chicago',
        description: 'Classic basketball sneakers in Chicago colorway',
        price: 170.00,
        condition: 'New'
      },
      {
        title: 'Rolex Submariner Date 116610LN',
        description: 'Luxury Swiss watch with black dial and bezel',
        price: 8500.00,
        condition: 'Used - Excellent'
      }
    ];

    for (const productData of products) {
      const product: ProductDetails = {
        ...productData,
        images: [],
        specifications: {},
        seller: 'Test Seller',
        location: 'Test Location'
      };

      const result = await marketResearchEngine.conductResearch(product);

      // Each category should produce meaningful results
      expect(result.similarListings.length).toBeGreaterThan(0);
      expect(result.priceAnalysis.averagePrice).toBeGreaterThan(0);
      expect(result.keywordAnalysis.popularKeywords.length).toBeGreaterThan(0);
      expect(result.marketTrends.length).toBe(4);

      // Price recommendations should be reasonable for each category
      const priceRatio = result.priceAnalysis.recommendedPrice / product.price;
      expect(priceRatio).toBeGreaterThan(0.5);
      expect(priceRatio).toBeLessThan(1.5);
    }
  }, 15000);

  it('should provide actionable insights for listing optimization', async () => {
    const product: ProductDetails = {
      title: 'Vintage 1980s Casio Calculator Watch CA-53W',
      description: 'Retro digital watch with calculator function. Working condition with minor wear.',
      price: 25.99,
      condition: 'Used - Good',
      images: [],
      specifications: {
        'Brand': 'Casio',
        'Model': 'CA-53W',
        'Year': '1980s',
        'Functions': 'Time, Calculator'
      },
      seller: 'VintageCollector',
      location: 'California, USA'
    };

    const result = await marketResearchEngine.conductResearch(product);

    // Should identify key selling points
    expect(result.keywordAnalysis.popularKeywords).toContain('casio');
    expect(result.keywordAnalysis.popularKeywords.some(keyword => 
      keyword.includes('vintage') || keyword.includes('calculator') || keyword.includes('watch')
    )).toBe(true);

    // Should provide pricing insights
    expect(result.priceAnalysis.priceRange.min).toBeLessThan(result.priceAnalysis.priceRange.max);
    expect(result.priceAnalysis.confidence).toBeGreaterThan(0);

    // Should show market activity
    expect(result.marketTrends.every(trend => trend.salesVolume > 0)).toBe(true);

    // Log insights for manual verification
    console.log('\nVintage Watch Research Insights:');
    console.log(`Price range: $${result.priceAnalysis.priceRange.min} - $${result.priceAnalysis.priceRange.max}`);
    console.log(`Market confidence: ${(result.priceAnalysis.confidence * 100).toFixed(1)}%`);
    console.log(`Key terms: ${result.keywordAnalysis.popularKeywords.slice(0, 3).join(', ')}`);
  });
});