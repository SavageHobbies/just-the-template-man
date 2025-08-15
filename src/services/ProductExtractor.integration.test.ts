import { describe, it, expect, beforeEach } from 'vitest';
import { EbayProductExtractor } from './ProductExtractor';
import { WebpageContent } from '../models';
import { 
  modernEbayListingSample, 
  classicEbayListingSample, 
  minimalEbayListingSample,
  complexEbayListingSample 
} from './__tests__/ebay-samples';

describe('EbayProductExtractor Integration Tests', () => {
  let extractor: EbayProductExtractor;

  beforeEach(() => {
    extractor = new EbayProductExtractor();
  });

  describe('Real-world eBay HTML samples', () => {
    it('should extract complete details from modern MacBook Pro listing', async () => {
      const content: WebpageContent = {
        html: modernEbayListingSample,
        title: 'Apple MacBook Pro 16-inch M2 Pro 512GB Space Gray | eBay',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractProductDetails(content);

      expect(result.title).toBe('Apple MacBook Pro 16-inch M2 Pro 512GB Space Gray - Excellent Condition');
      expect(result.price).toBe(2299.99);
      expect(result.condition).toBe('Used - Excellent');
      expect(result.description).toContain('MacBook Pro is in excellent condition');
      expect(result.description).toContain('M2 Pro chip with 12-core CPU');
      expect(result.images).toHaveLength(4);
      expect(result.images.every(img => img.url.includes('macbook'))).toBe(true);
      expect(result.seller).toBe('TechPro Electronics');
      expect(result.location).toBe('Ships from San Francisco, California, United States');
      
      // Check specifications
      expect(result.specifications.Brand).toBe('Apple');
      expect(result.specifications.Model).toBe('MacBook Pro');
      expect(result.specifications['Screen Size']).toBe('16.2 in');
      expect(result.specifications.Processor).toBe('Apple M2 Pro');
      expect(result.specifications.Memory).toBe('16 GB');
      expect(result.specifications.Storage).toBe('512 GB SSD');
    });

    it('should extract details from vintage Air Jordan listing', async () => {
      const content: WebpageContent = {
        html: classicEbayListingSample,
        title: 'Vintage 1985 Nike Air Jordan 1 Chicago Size 9 Original | eBay',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractProductDetails(content);

      expect(result.title).toBe('Vintage 1985 Nike Air Jordan 1 Chicago Size 9 Original - Rare Collector Item');
      expect(result.price).toBe(8500.00);
      expect(result.condition).toBe('Used - Good');
      expect(result.description).toContain('Authentic 1985 Nike Air Jordan 1');
      expect(result.description).toContain('Michael Jordan\'s rookie season');
      expect(result.images).toHaveLength(4);
      expect(result.seller).toBe('VintageKickzCollector');
      expect(result.location).toBe('Chicago, Illinois, United States');
      
      // Check specifications from table format
      expect(result.specifications.Brand).toBe('Nike');
      expect(result.specifications.Model).toBe('Air Jordan 1');
      expect(result.specifications.Year).toBe('1985');
      expect(result.specifications.Size).toBe('9');
      expect(result.specifications.Color).toBe('Chicago (White/Black/Red)');
    });

    it('should handle minimal eBay listing structure', async () => {
      const content: WebpageContent = {
        html: minimalEbayListingSample,
        title: 'iPhone 12 64GB Blue Unlocked | eBay',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractProductDetails(content);

      expect(result.title).toBe('iPhone 12 64GB Blue Unlocked');
      expect(result.price).toBe(399.99);
      expect(result.condition).toBe('Very Good');
      expect(result.description).toContain('iPhone 12 in very good condition');
      expect(result.images).toHaveLength(1);
      expect(result.seller).toBe('PhoneSeller123');
      expect(result.location).toBe('Miami, Florida');
    });

    it('should extract complex PlayStation 5 bundle details', async () => {
      const content: WebpageContent = {
        html: complexEbayListingSample,
        title: 'Sony PlayStation 5 Console Bundle with Extra Controller and Games | eBay',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractProductDetails(content);

      expect(result.title).toBe('Sony PlayStation 5 Console Bundle - Extra DualSense Controller + 3 Games');
      expect(result.price).toBe(649.99);
      expect(result.condition).toBe('Brand New');
      expect(result.description).toContain('Brand new PlayStation 5 console bundle');
      expect(result.description).toContain('Spider-Man: Miles Morales');
      expect(result.images).toHaveLength(5);
      expect(result.seller).toBe('Gaming Central Store');
      expect(result.location).toBe('Ships from Austin, Texas, United States');
      
      // Check complex specifications
      expect(result.specifications.Platform).toBe('Sony PlayStation 5');
      expect(result.specifications['Storage Capacity']).toBe('825 GB SSD');
      expect(result.specifications.Resolution).toBe('4K Ultra HD');
      expect(result.specifications['Included Items']).toBe('Console, 2 Controllers, 3 Games, Cables');
    });

    it('should validate extracted data completeness', async () => {
      const testCases = [
        { html: modernEbayListingSample, name: 'Modern MacBook' },
        { html: classicEbayListingSample, name: 'Classic Air Jordan' },
        { html: minimalEbayListingSample, name: 'Minimal iPhone' },
        { html: complexEbayListingSample, name: 'Complex PS5 Bundle' }
      ];

      for (const testCase of testCases) {
        const content: WebpageContent = {
          html: testCase.html,
          title: `${testCase.name} | eBay`,
          metadata: {},
          timestamp: new Date()
        };

        const result = await extractor.extractProductDetails(content);

        // Validate all required fields are present and valid
        expect(result.title, `${testCase.name} should have title`).toBeTruthy();
        expect(result.title.length, `${testCase.name} title should be reasonable length`).toBeGreaterThan(5);
        
        expect(result.price, `${testCase.name} should have price`).toBeGreaterThan(0);
        
        expect(result.condition, `${testCase.name} should have condition`).toBeTruthy();
        expect(result.condition, `${testCase.name} condition should not be Unknown`).not.toBe('Unknown');
        
        expect(result.description, `${testCase.name} should have description`).toBeTruthy();
        expect(result.description.length, `${testCase.name} description should be substantial`).toBeGreaterThan(20);
        
        expect(result.images, `${testCase.name} should have images`).toBeInstanceOf(Array);
        expect(result.images.length, `${testCase.name} should have at least one image`).toBeGreaterThan(0);
        
        expect(result.seller, `${testCase.name} should have seller`).toBeTruthy();
        expect(result.seller, `${testCase.name} seller should not be Unknown`).not.toBe('Unknown Seller');
        
        expect(result.location, `${testCase.name} should have location`).toBeTruthy();
        
        expect(result.specifications, `${testCase.name} should have specifications`).toBeInstanceOf(Object);
      }
    });

    it('should handle edge cases and malformed HTML gracefully', async () => {
      const malformedHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Broken Product | eBay</title></head>
        <body>
          <h1>Product with <broken> tags</h1>
          <div>Price: $invalid.price</div>
          <div>Condition: <span>New but <unclosed tag</div>
          <p>Description with <img src="broken"> embedded content</p>
          <img src="https://i.ebayimg.com/images/g/valid/s-l1600.jpg">
          <div>Seller: <a href="/usr/seller">ValidSeller</div>
        </body>
        </html>
      `;

      const content: WebpageContent = {
        html: malformedHtml,
        title: 'Broken Product | eBay',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractProductDetails(content);

      // Should still extract what it can
      expect(result.title).toContain('Product');
      expect(result.images).toHaveLength(1);
      expect(result.seller).toBe('ValidSeller');
      
      // Should handle invalid price gracefully
      expect(result.price).toBe(0);
      
      // Should provide fallback values for missing data
      expect(result.condition).toBe('New'); // Should extract from text
      expect(result.description).toBeTruthy();
    });
  });
});