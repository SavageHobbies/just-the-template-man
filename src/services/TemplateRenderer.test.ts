import { describe, it, expect, beforeEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { TemplateRenderer } from './TemplateRenderer';
import { OptimizedContent, ProductDetails, ImageData } from '../models';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn()
  }
}));

describe('TemplateRenderer', () => {
  let templateRenderer: TemplateRenderer;
  let mockOptimizedContent: OptimizedContent;
  let mockProductDetails: ProductDetails;
  let mockTemplateContent: string;

  beforeEach(() => {
    templateRenderer = new TemplateRenderer();
    
  mockOptimizedContent = {
      optimizedTitle: 'Amazing Product - Limited Edition',
      optimizedDescription: 'This is an amazing product with great features.',
      suggestedPrice: 99.99,
      keywords: ['collectible', 'limited', 'rare'],
      sellingPoints: ['Mint condition', 'Original packaging', 'Fast shipping']
    };

    mockProductDetails = {
      title: 'Original Product Title',
      description: 'Original description',
      price: 89.99,
      condition: 'Used',
      images: [
        { url: 'https://example.com/image1.jpg', altText: 'Main image', size: 'large', isValid: true },
        { url: 'https://example.com/image2.jpg', altText: 'Side view', size: 'medium', isValid: true },
        { url: 'https://broken.com/image.jpg', altText: 'Broken image', size: 'large', isValid: false }
      ],
      specifications: {
        'Brand': 'Test Brand',
        'Model': 'Test Model',
        'Year': '2023'
      },
      seller: 'TestSeller',
      location: 'New York, NY'
    };

    mockTemplateContent = `
      <!DOCTYPE html>
      <html>
        <head><title>{{TITLE}}</title></head>
        <body>
          <h1>{{TITLE}}</h1>
          <img src="{{MAIN_IMAGE}}" alt="{{TITLE}}">
          <p>{{DESCRIPTION}}</p>
          <p>{{KEYWORDS_DESCRIPTION}}</p>
          <ul>{{PRODUCT_DETAILS_LIST}}</ul>
          <ul>{{WHATS_INCLUDED_LIST}}</ul>
          <ul>{{ITEM_SPECIFICS}}</ul>
          <div>{{IMAGE_GALLERY}}</div>
        </body>
      </html>
    `;

    vi.clearAllMocks();
  });

  describe('renderTemplate', () => {
    it('should successfully render template with all placeholders replaced', async () => {
      (fs.readFile as any).mockResolvedValue(mockTemplateContent);

      const result = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        mockProductDetails,
        'test-template.html'
      );

      expect(result).toContain('Amazing Product - Limited Edition');
      expect(result).toContain('https://example.com/image1.jpg');
      expect(result).toContain('This is an amazing product with great features.');
      expect(result).toContain('collectible, limited, rare');
      expect(result).not.toContain('{{TITLE}}');
      expect(result).not.toContain('{{MAIN_IMAGE}}');
    });

    it('should handle missing template file', async () => {
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));

      await expect(
        templateRenderer.renderTemplate(mockOptimizedContent, mockProductDetails, 'missing.html')
      ).rejects.toThrow('Failed to render template: File not found');
    });

    it('should use fallback values when optimized content is missing', async () => {
      (fs.readFile as any).mockResolvedValue(mockTemplateContent);
      
      const incompleteOptimizedContent: OptimizedContent = {
        optimizedTitle: '',
        optimizedDescription: '',
        suggestedPrice: 0,
        keywords: [],
        sellingPoints: []
      };

      const result = await templateRenderer.renderTemplate(
        incompleteOptimizedContent,
        mockProductDetails,
        'test-template.html'
      );

      expect(result).toContain('Original Product Title');
      expect(result).toContain('Original description');
    });

    it('should validate HTML and throw error for unprocessed placeholders', async () => {
      const templateWithUnprocessedPlaceholder = mockTemplateContent + '{{UNKNOWN_PLACEHOLDER}}';
      (fs.readFile as any).mockResolvedValue(templateWithUnprocessedPlaceholder);

      await expect(
        templateRenderer.renderTemplate(mockOptimizedContent, mockProductDetails, 'test.html')
      ).rejects.toThrow('Unprocessed template placeholders found: {{UNKNOWN_PLACEHOLDER}}');
    });

    it('should validate HTML structure', async () => {
      const invalidTemplate = '<html><body>{{TITLE}}</body>'; // Missing closing html tag
      (fs.readFile as any).mockResolvedValue(invalidTemplate);

      await expect(
        templateRenderer.renderTemplate(mockOptimizedContent, mockProductDetails, 'test.html')
      ).rejects.toThrow('Generated HTML has unclosed html tag');
    });
  });

  describe('generateImageGallery', () => {
    it('should generate HTML gallery for valid images', () => {
      const images: ImageData[] = [
        { url: 'https://example.com/image1.jpg', altText: 'Image 1', size: 'large', isValid: true },
        { url: 'https://example.com/image2.jpg', altText: 'Image 2', size: 'medium', isValid: true },
        { url: 'https://example.com/image3.jpg', size: 'large', isValid: true }
      ];

      const result = templateRenderer.generateImageGallery(images, 5);

      expect(result).toContain('<div class="image-gallery">');
      expect(result).toContain('<div class="gallery-image">');
      expect(result).toContain('src="https://example.com/image1.jpg"');
      expect(result).toContain('alt="Image 1"');
      expect(result).toContain('src="https://example.com/image2.jpg"');
      expect(result).toContain('alt="Image 2"');
      expect(result).toContain('alt="Product image 3"'); // Default alt text
      expect(result).toContain('loading="lazy"');
    });

    it('should limit images to maxImages parameter', () => {
      const images: ImageData[] = [
        { url: 'https://example.com/image1.jpg', size: 'large', isValid: true },
        { url: 'https://example.com/image2.jpg', size: 'large', isValid: true },
        { url: 'https://example.com/image3.jpg', size: 'large', isValid: true },
        { url: 'https://example.com/image4.jpg', size: 'large', isValid: true }
      ];

      const result = templateRenderer.generateImageGallery(images, 2);

      expect(result).toContain('image1.jpg');
      expect(result).toContain('image2.jpg');
      expect(result).not.toContain('image3.jpg');
      expect(result).not.toContain('image4.jpg');
    });

    it('should filter out invalid images', () => {
      const images: ImageData[] = [
        { url: 'https://example.com/valid.jpg', size: 'large', isValid: true },
        { url: 'https://example.com/invalid.jpg', size: 'large', isValid: false },
        { url: '', size: 'large', isValid: true } // Empty URL
      ];

      const result = templateRenderer.generateImageGallery(images, 5);

      expect(result).toContain('valid.jpg');
      expect(result).not.toContain('invalid.jpg');
      expect(result.match(/gallery-image/g)?.length).toBe(1);
    });

    it('should handle empty image array', () => {
      const result = templateRenderer.generateImageGallery([], 5);
      expect(result).toBe('<p>No images available</p>');
    });

    it('should handle no valid images', () => {
      const images: ImageData[] = [
        { url: 'https://example.com/invalid.jpg', size: 'large', isValid: false }
      ];

      const result = templateRenderer.generateImageGallery(images, 5);
      expect(result).toBe('<p>No valid images available</p>');
    });

    it('should default to 5 images when maxImages not specified', () => {
      const images: ImageData[] = Array.from({ length: 10 }, (_, i) => ({
        url: `https://example.com/image${i + 1}.jpg`,
        size: 'large' as const,
        isValid: true
      }));

      const result = templateRenderer.generateImageGallery(images);

      // Should only contain first 5 images
      expect(result).toContain('image1.jpg');
      expect(result).toContain('image5.jpg');
      expect(result).not.toContain('image6.jpg');
    });
  });

  describe('HTML sanitization', () => {
    it('should sanitize HTML content to prevent XSS', async () => {
      (fs.readFile as any).mockResolvedValue(mockTemplateContent);
      
      const maliciousContent: OptimizedContent = {
        optimizedTitle: '<script>alert("xss")</script>Malicious Title',
        optimizedDescription: 'Description with <img src="x" onerror="alert(1)">',
        suggestedPrice: 99.99,
        keywords: ['<script>alert("xss")</script>'],
        sellingPoints: ['<iframe src="javascript:alert(1)"></iframe>']
      };

      const result = await templateRenderer.renderTemplate(
        maliciousContent,
        mockProductDetails,
        'test-template.html'
      );

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('onerror="alert(1)"');
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&quot;quotes&quot;');
      expect(result).toContain('&#x27;apostrophes&#x27;');
    });

    it('should sanitize URLs to prevent script injection', () => {
      const maliciousImages: ImageData[] = [
        { url: 'javascript:alert("xss")', size: 'large', isValid: true },
        { url: 'https://example.com/image.jpg"onload="alert(1)', size: 'large', isValid: true },
        { url: 'https://valid.com/image.jpg', size: 'large', isValid: true }
      ];

      const result = templateRenderer.generateImageGallery(maliciousImages, 5);

      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('onload=alert(1)');
      expect(result).toContain('https://valid.com/image.jpg');
    });
  });

  describe('helper methods', () => {
    it('should format keywords correctly', async () => {
      (fs.readFile as any).mockResolvedValue('{{KEYWORDS_DESCRIPTION}}');
      
      const result = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        mockProductDetails,
        'test.html'
      );

      expect(result).toContain('This item is perfect for collectors interested in: collectible, limited, rare.');
    });

    it('should handle empty keywords', async () => {
      (fs.readFile as any).mockResolvedValue('{{KEYWORDS_DESCRIPTION}}');
      
      const contentWithoutKeywords = { ...mockOptimizedContent, keywords: [] };
      const result = await templateRenderer.renderTemplate(
        contentWithoutKeywords,
        mockProductDetails,
        'test.html'
      );

      expect(result).toContain('No specific keywords available.');
    });

    it('should format product details list', async () => {
      (fs.readFile as any).mockResolvedValue('{{PRODUCT_DETAILS_LIST}}');
      
      const result = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        mockProductDetails,
        'test.html'
      );

      expect(result).toContain('<li><strong>Brand:</strong> Test Brand</li>');
      expect(result).toContain('<li><strong>Model:</strong> Test Model</li>');
      expect(result).toContain('<li><strong>Year:</strong> 2023</li>');
    });

    it('should format selling points list', async () => {
      (fs.readFile as any).mockResolvedValue('{{WHATS_INCLUDED_LIST}}');
      
      const result = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        mockProductDetails,
        'test.html'
      );

      expect(result).toContain('<li>Mint condition</li>');
      expect(result).toContain('<li>Original packaging</li>');
      expect(result).toContain('<li>Fast shipping</li>');
    });

    it('should format item specifics', async () => {
      (fs.readFile as any).mockResolvedValue('{{ITEM_SPECIFICS}}');
      
      const result = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        mockProductDetails,
        'test.html'
      );

      expect(result).toContain('<li><strong>Condition:</strong> Used</li>');
      expect(result).toContain('<li><strong>Original Price:</strong> $89.99</li>');
      expect(result).toContain('<li><strong>Location:</strong> New York, NY</li>');
      expect(result).toContain('<li><strong>Seller:</strong> TestSeller</li>');
    });

    it('should handle missing specifications', async () => {
      (fs.readFile as any).mockResolvedValue('{{PRODUCT_DETAILS_LIST}}');
      
      const productWithoutSpecs = { ...mockProductDetails, specifications: {} };
      const result = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        productWithoutSpecs,
        'test.html'
      );

      expect(result).toContain('<li>Product details will be updated soon</li>');
    });

    it('should handle missing selling points', async () => {
      (fs.readFile as any).mockResolvedValue('{{WHATS_INCLUDED_LIST}}');
      
      const contentWithoutPoints = { ...mockOptimizedContent, sellingPoints: [] };
      const result = await templateRenderer.renderTemplate(
        contentWithoutPoints,
        mockProductDetails,
        'test.html'
      );

      expect(result).toContain('<li>Item as shown in photos</li>');
    });
  });

  describe('main image handling', () => {
    it('should use first valid image as main image', async () => {
      (fs.readFile as any).mockResolvedValue('{{MAIN_IMAGE}}');
      
      const result = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        mockProductDetails,
        'test.html'
      );

      expect(result).toContain('https://example.com/image1.jpg');
    });

    it('should use placeholder when no valid images available', async () => {
      (fs.readFile as any).mockResolvedValue('{{MAIN_IMAGE}}');
      
      const productWithoutValidImages = {
        ...mockProductDetails,
        images: [{ url: 'invalid', size: 'large' as const, isValid: false }]
      };
      
      const result = await templateRenderer.renderTemplate(
        mockOptimizedContent,
        productWithoutValidImages,
        'test.html'
      );

      expect(result).toContain('https://via.placeholder.com/400x300?text=No+Image');
    });
  });
});
