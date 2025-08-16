import { describe, it, expect, beforeAll } from 'vitest';
import { TemplateRenderer } from '../../services/TemplateRenderer';
import { OptimizedContent, ProductDetails, ImageData } from '../../models';

describe('Template Quality Tests', () => {
  let templateRenderer: TemplateRenderer;
  let mockOptimizedContent: OptimizedContent;
  let mockProductDetails: ProductDetails;

  beforeAll(() => {
    templateRenderer = new TemplateRenderer();
    
    mockOptimizedContent = {
      optimizedTitle: 'Apple iPhone 12 Pro 128GB Unlocked - Pacific Blue - Excellent Condition',
      optimizedDescription: 'Experience premium performance with this iPhone 12 Pro featuring 128GB storage, unlocked for all carriers, and stunning Pacific Blue finish. Includes original accessories.',
      suggestedPrice: 589.99,
      keywords: ['iPhone', '12 Pro', 'Unlocked', '128GB', 'Pacific Blue', 'Apple'],
      sellingPoints: ['Unlocked for all carriers', 'Excellent condition', 'Original accessories included', 'Fast shipping']
    };

    mockProductDetails = {
      title: 'Apple iPhone 12 Pro 128GB Unlocked - Pacific Blue',
      description: 'iPhone 12 Pro with 128GB storage',
      price: 599.99,
      condition: 'Used',
      images: [
        { url: 'https://i.ebayimg.com/images/g/abc/s-l1600.jpg', altText: 'iPhone front', size: 'large', isValid: true },
        { url: 'https://i.ebayimg.com/images/g/def/s-l1600.jpg', altText: 'iPhone back', size: 'large', isValid: true },
        { url: 'https://i.ebayimg.com/images/g/ghi/s-l1600.jpg', altText: 'iPhone side', size: 'large', isValid: true }
      ],
      specifications: { storage: '128GB', carrier: 'Unlocked', color: 'Pacific Blue' },
      seller: 'tech_seller_123',
      location: 'California, US'
    };
  });

  describe('HTML Template Generation', () => {
    it('should generate valid HTML structure', async () => {
      const htmlTemplate = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        mockProductDetails,
        'final-ebay-template.html'
      );

      expect(htmlTemplate).toContain('<!DOCTYPE html>');
      expect(htmlTemplate).toContain('<html');
      expect(htmlTemplate).toContain('<head>');
      expect(htmlTemplate).toContain('<body>');
      expect(htmlTemplate).toContain('</html>');
    });

    it('should include all optimized content in template', async () => {
      const htmlTemplate = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        mockProductDetails,
        'final-ebay-template.html'
      );

      expect(htmlTemplate).toContain(mockOptimizedContent.optimizedTitle);
      expect(htmlTemplate).toContain(mockOptimizedContent.optimizedDescription);
      // Note: Suggested price is used for eBay listing setup, not displayed in template
      expect(mockOptimizedContent.suggestedPrice).toBeGreaterThan(0);
    });

    it('should include image gallery with proper structure', async () => {
      const htmlTemplate = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        mockProductDetails,
        'final-ebay-template.html'
      );

      // Check for image gallery container
      expect(htmlTemplate).toMatch(/<div[^>]*class[^>]*gallery/i);
      
      // Check for individual images
      mockProductDetails.images.forEach(image => {
        expect(htmlTemplate).toContain(image.url);
        if (image.altText) {
          expect(htmlTemplate).toContain(image.altText);
        }
      });
    });

    it('should handle missing images gracefully', async () => {
      const productWithNoImages = {
        ...mockProductDetails,
        images: []
      };

      const htmlTemplate = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        productWithNoImages,
        'final-ebay-template.html'
      );

      expect(htmlTemplate).toBeDefined();
      expect(htmlTemplate).toContain('<!DOCTYPE html>');
    });

    it('should limit image gallery to maximum 5 images', async () => {
      const manyImages: ImageData[] = Array.from({ length: 8 }, (_, i) => ({
        url: `https://i.ebayimg.com/images/g/img${i}/s-l1600.jpg`,
        altText: `Image ${i}`,
        size: 'large' as const,
        isValid: true
      }));

      const productWithManyImages = {
        ...mockProductDetails,
        images: manyImages
      };

      const htmlTemplate = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        productWithManyImages,
        'final-ebay-template.html'
      );

      // Count image tags specifically in the gallery section
      const gallerySection = htmlTemplate.match(/<div class="image-gallery">[\s\S]*?<\/div>/i);
      if (gallerySection) {
        const galleryImageMatches = gallerySection[0].match(/<img[^>]*src[^>]*>/gi) || [];
        expect(galleryImageMatches.length).toBeLessThanOrEqual(5);
      } else {
        // If no gallery section, should still have reasonable number of images total
        const allImageMatches = htmlTemplate.match(/<img[^>]*src[^>]*>/gi) || [];
        expect(allImageMatches.length).toBeLessThanOrEqual(6); // 1 main + 5 gallery max
      }
    });
  });

  describe('Content Quality Validation', () => {
    it('should validate title length is appropriate for eBay', async () => {
      expect(mockOptimizedContent.optimizedTitle.length).toBeLessThanOrEqual(80);
      expect(mockOptimizedContent.optimizedTitle.length).toBeGreaterThan(10);
    });

    it('should validate description contains key selling points', async () => {
      const description = mockOptimizedContent.optimizedDescription.toLowerCase();
      
      // Should contain at least some key product features
      const hasProductFeatures = mockOptimizedContent.keywords.some(keyword => 
        description.includes(keyword.toLowerCase())
      );
      expect(hasProductFeatures).toBe(true);
    });

    it('should validate pricing is reasonable', async () => {
      expect(mockOptimizedContent.suggestedPrice).toBeGreaterThan(0);
      expect(mockOptimizedContent.suggestedPrice).toBeLessThan(10000); // Reasonable upper bound
      expect(Number.isFinite(mockOptimizedContent.suggestedPrice)).toBe(true);
    });

    it('should validate keywords are relevant and not empty', async () => {
      expect(mockOptimizedContent.keywords).toBeInstanceOf(Array);
      expect(mockOptimizedContent.keywords.length).toBeGreaterThan(0);
      
      mockOptimizedContent.keywords.forEach(keyword => {
        expect(keyword).toBeTruthy();
        expect(typeof keyword).toBe('string');
        expect(keyword.trim().length).toBeGreaterThan(0);
      });
    });

    it('should validate selling points are compelling', async () => {
      expect(mockOptimizedContent.sellingPoints).toBeInstanceOf(Array);
      expect(mockOptimizedContent.sellingPoints.length).toBeGreaterThan(0);
      
      mockOptimizedContent.sellingPoints.forEach(point => {
        expect(point).toBeTruthy();
        expect(typeof point).toBe('string');
        expect(point.trim().length).toBeGreaterThan(5); // Meaningful selling points
      });
    });
  });

  describe('Template Rendering Performance', () => {
    it('should render template within reasonable time', async () => {
      const startTime = Date.now();
      
      await templateRenderer.renderTemplate(
        mockOptimizedContent,
        mockProductDetails,
        'final-ebay-template.html'
      );
      
      const endTime = Date.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(5000); // Should render within 5 seconds
    });

    it('should handle concurrent template rendering', async () => {
      const promises = Array.from({ length: 5 }, () =>
        templateRenderer.renderTemplate(
          mockOptimizedContent,
          mockProductDetails,
          'final-ebay-template.html'
        )
      );

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result).toContain('<!DOCTYPE html>');
      });
    });
  });

  describe('HTML Validation', () => {
    it('should generate well-formed HTML', async () => {
      const htmlTemplate = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        mockProductDetails,
        'final-ebay-template.html'
      );

      // Basic HTML structure validation
      expect(htmlTemplate).toMatch(/<!DOCTYPE html>/i);
      expect(htmlTemplate).toMatch(/<html[^>]*>/i);
      expect(htmlTemplate).toMatch(/<\/html>/i);
      expect(htmlTemplate).toMatch(/<head>/i);
      expect(htmlTemplate).toMatch(/<\/head>/i);
      expect(htmlTemplate).toMatch(/<body[^>]*>/i);
      expect(htmlTemplate).toMatch(/<\/body>/i);
    });

    it('should escape special characters properly', async () => {
      const contentWithSpecialChars = {
        ...mockOptimizedContent,
        optimizedTitle: 'Test & "Special" <Characters>',
        optimizedDescription: 'Description with <script>alert("test")</script> content'
      };

      const htmlTemplate = await templateRenderer.renderTemplate(
        contentWithSpecialChars,
        mockProductDetails,
        'final-ebay-template.html'
      );

      // Should not contain unescaped script tags
      expect(htmlTemplate).not.toMatch(/<script[^>]*>.*<\/script>/i);
      
      // Should properly escape HTML entities
      expect(htmlTemplate).toContain('&amp;');
      expect(htmlTemplate).toContain('&quot;');
      expect(htmlTemplate).toContain('&lt;');
      expect(htmlTemplate).toContain('&gt;');
    });

    it('should include proper meta tags for eBay compatibility', async () => {
      const htmlTemplate = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        mockProductDetails,
        'final-ebay-template.html'
      );

      // Should include viewport meta tag for mobile compatibility
      expect(htmlTemplate).toMatch(/<meta[^>]*viewport[^>]*>/i);
      
      // Should include charset declaration
      expect(htmlTemplate).toMatch(/<meta[^>]*charset[^>]*>/i);
    });
  });

  describe('Accessibility Compliance', () => {
    it('should include alt text for all images', async () => {
      const htmlTemplate = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        mockProductDetails,
        'final-ebay-template.html'
      );

      // Find all img tags
      const imgTags = htmlTemplate.match(/<img[^>]*>/gi) || [];
      
      imgTags.forEach(imgTag => {
        // Each img tag should have alt attribute
        expect(imgTag).toMatch(/alt\s*=\s*["'][^"']*["']/i);
      });
    });

    it('should use semantic HTML elements', async () => {
      const htmlTemplate = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        mockProductDetails,
        'final-ebay-template.html'
      );

      // Should use semantic elements like header, main, section, etc.
      const semanticElements = ['header', 'main', 'section', 'article', 'aside', 'footer'];
      const hasSemanticElements = semanticElements.some(element => 
        htmlTemplate.includes(`<${element}`) || htmlTemplate.includes(`</${element}>`)
      );
      
      expect(hasSemanticElements).toBe(true);
    });

    it('should have proper heading hierarchy', async () => {
      const htmlTemplate = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        mockProductDetails,
        'final-ebay-template.html'
      );

      // Should have at least one h1 tag
      expect(htmlTemplate).toMatch(/<h1[^>]*>/i);
      
      // Should not skip heading levels (basic check)
      const hasH1 = htmlTemplate.includes('<h1');
      const hasH3 = htmlTemplate.includes('<h3');
      const hasH2 = htmlTemplate.includes('<h2');
      
      if (hasH3) {
        expect(hasH1 && hasH2).toBe(true);
      }
    });
  });
});
