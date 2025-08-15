import { describe, it, expect } from 'vitest';
import { TemplateRenderer } from './TemplateRenderer';
import { OptimizedContent, ProductDetails, ImageData } from '../models';
import path from 'path';

describe('TemplateRenderer Integration Tests', () => {
  const templateRenderer = new TemplateRenderer();
  
  const mockOptimizedContent: OptimizedContent = {
    optimizedTitle: 'Vintage Collectible Action Figure - Limited Edition Mint Condition',
    optimizedDescription: 'This rare vintage action figure is in exceptional mint condition and comes from a smoke-free home. Perfect for collectors and enthusiasts alike. Features original packaging and all accessories.',
    suggestedPrice: 149.99,
    keywords: ['vintage', 'collectible', 'action figure', 'mint condition', 'limited edition'],
    sellingPoints: [
      'Mint condition with original packaging',
      'All original accessories included',
      'From smoke-free environment',
      'Rare limited edition release',
      'Perfect for display or collection'
    ],
    conditionNotes: 'Item is in mint condition with only minor shelf wear on the packaging. The figure itself has never been removed from the package and shows no signs of wear or damage.'
  };

  const mockProductDetails: ProductDetails = {
    title: 'Original Action Figure Title',
    description: 'Original description of the action figure',
    price: 99.99,
    condition: 'New',
    images: [
      { 
        url: 'https://i.ebayimg.com/images/g/abc123/s-l1600.jpg', 
        altText: 'Main product image', 
        size: 'large', 
        isValid: true 
      },
      { 
        url: 'https://i.ebayimg.com/images/g/def456/s-l1600.jpg', 
        altText: 'Side view', 
        size: 'large', 
        isValid: true 
      },
      { 
        url: 'https://i.ebayimg.com/images/g/ghi789/s-l1600.jpg', 
        altText: 'Back view', 
        size: 'large', 
        isValid: true 
      },
      { 
        url: 'https://i.ebayimg.com/images/g/jkl012/s-l1600.jpg', 
        altText: 'Packaging detail', 
        size: 'medium', 
        isValid: true 
      },
      { 
        url: 'https://i.ebayimg.com/images/g/mno345/s-l1600.jpg', 
        altText: 'Accessories', 
        size: 'medium', 
        isValid: true 
      }
    ],
    specifications: {
      'Brand': 'Hasbro',
      'Series': 'G.I. Joe',
      'Character': 'Snake Eyes',
      'Year': '1985',
      'Scale': '3.75 inch',
      'Material': 'Plastic',
      'Condition': 'Mint in Package'
    },
    seller: 'TrendSetterz',
    location: 'Los Angeles, CA'
  };

  it('should render the actual final-ebay-template.html with real data', async () => {
    const templatePath = path.join(process.cwd(), 'final-ebay-template.html');
    
    const result = await templateRenderer.renderTemplate(
      mockOptimizedContent,
      mockProductDetails,
      templatePath
    );

    // Verify basic HTML structure
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html lang="en">');
    expect(result).toContain('</html>');
    expect(result).toContain('<body>');
    expect(result).toContain('</body>');

    // Verify title replacement
    expect(result).toContain('Vintage Collectible Action Figure - Limited Edition Mint Condition');
    expect(result).toContain('<title>Vintage Collectible Action Figure - Limited Edition Mint Condition - Top Rated eBay Seller</title>');

    // Verify main image
    expect(result).toContain('https://i.ebayimg.com/images/g/abc123/s-l1600.jpg');

    // Verify description
    expect(result).toContain('This rare vintage action figure is in exceptional mint condition');

    // Verify condition notes
    expect(result).toContain('Item is in mint condition with only minor shelf wear');

    // Verify keywords
    expect(result).toContain('vintage, collectible, action figure, mint condition, limited edition');

    // Verify product details list
    expect(result).toContain('<li><strong>Brand:</strong> Hasbro</li>');
    expect(result).toContain('<li><strong>Series:</strong> G.I. Joe</li>');
    expect(result).toContain('<li><strong>Character:</strong> Snake Eyes</li>');

    // Verify selling points
    expect(result).toContain('<li>Mint condition with original packaging</li>');
    expect(result).toContain('<li>All original accessories included</li>');

    // Verify item specifics
    expect(result).toContain('<li><strong>Condition:</strong> New</li>');
    expect(result).toContain('<li><strong>Original Price:</strong> $99.99</li>');
    expect(result).toContain('<li><strong>Location:</strong> Los Angeles, CA</li>');
    expect(result).toContain('<li><strong>Seller:</strong> TrendSetterz</li>');

    // Verify image gallery
    expect(result).toContain('<div class="image-gallery">');
    expect(result).toContain('https://i.ebayimg.com/images/g/def456/s-l1600.jpg');
    expect(result).toContain('alt="Side view"');
    expect(result).toContain('loading="lazy"');

    // Verify no unprocessed placeholders remain
    expect(result).not.toContain('{{');
    expect(result).not.toContain('}}');

    // Verify CSS and styling are preserved
    expect(result).toContain(':root {');
    expect(result).toContain('--primary-color: #3F51B5;');
    expect(result).toContain('background: linear-gradient');

    // Verify tabs structure is preserved
    expect(result).toContain('<div class="tabs">');
    expect(result).toContain('input type="radio" name="tabs"');
    expect(result).toContain('Grading Scale');
    expect(result).toContain('Authenticity Guarantee');
  });

  it('should handle missing images gracefully', async () => {
    const templatePath = path.join(process.cwd(), 'final-ebay-template.html');
    
    const productWithoutImages = {
      ...mockProductDetails,
      images: []
    };

    const result = await templateRenderer.renderTemplate(
      mockOptimizedContent,
      productWithoutImages,
      templatePath
    );

    // Should use placeholder for main image
    expect(result).toContain('https://via.placeholder.com/400x300?text=No+Image');
    
    // Should show no images message in gallery
    expect(result).toContain('<p>No images available</p>');
  });

  it('should handle empty specifications and selling points', async () => {
    const templatePath = path.join(process.cwd(), 'final-ebay-template.html');
    
    const minimalProductDetails = {
      ...mockProductDetails,
      specifications: {}
    };

    const minimalOptimizedContent = {
      ...mockOptimizedContent,
      sellingPoints: []
    };

    const result = await templateRenderer.renderTemplate(
      minimalOptimizedContent,
      minimalProductDetails,
      templatePath
    );

    // Should show fallback messages
    expect(result).toContain('<li>Product details will be updated soon</li>');
    expect(result).toContain('<li>Item as shown in photos</li>');
  });

  it('should limit image gallery to 5 images', async () => {
    const templatePath = path.join(process.cwd(), 'final-ebay-template.html');
    
    // Create product with more than 5 images
    const manyImages: ImageData[] = Array.from({ length: 8 }, (_, i) => ({
      url: `https://example.com/image${i + 1}.jpg`,
      altText: `Image ${i + 1}`,
      size: 'large' as const,
      isValid: true
    }));

    const productWithManyImages = {
      ...mockProductDetails,
      images: manyImages
    };

    const result = await templateRenderer.renderTemplate(
      mockOptimizedContent,
      productWithManyImages,
      templatePath
    );

    // Should contain first 5 images
    expect(result).toContain('image1.jpg');
    expect(result).toContain('image5.jpg');
    
    // Should not contain images beyond 5
    expect(result).not.toContain('image6.jpg');
    expect(result).not.toContain('image8.jpg');

    // Count gallery image divs (should be exactly 5)
    const galleryImageMatches = result.match(/<div class="gallery-image">/g);
    expect(galleryImageMatches).toHaveLength(5);
  });

  it('should preserve HTML structure and styling', async () => {
    const templatePath = path.join(process.cwd(), 'final-ebay-template.html');
    
    const result = await templateRenderer.renderTemplate(
      mockOptimizedContent,
      mockProductDetails,
      templatePath
    );

    // Verify key structural elements are preserved
    expect(result).toContain('<div class="container">');
    expect(result).toContain('<div class="product-container">');
    expect(result).toContain('<div class="description-section">');
    expect(result).toContain('<div class="seller-info">');
    
    // Verify CSS animations and gradients are preserved
    expect(result).toContain('animation: gradientFlow');
    expect(result).toContain('@keyframes gradientFlow');
    
    // Verify responsive design elements
    expect(result).toContain('@media (max-width: 768px)');
    
    // Verify seller badges
    expect(result).toContain('⭐ TOP RATED SELLER ⭐');
    expect(result).toContain('🏆 Top Rated eBay Seller - 100% Positive Feedback 🏆');
  });
});