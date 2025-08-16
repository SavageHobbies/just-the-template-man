import { describe, it, expect, beforeEach } from 'vitest';
import { EbayProductExtractor } from './ProductExtractor';
import { WebpageContent, ImageData } from '../models';

describe('EbayProductExtractor', () => {
  let extractor: EbayProductExtractor;

  beforeEach(() => {
    extractor = new EbayProductExtractor();
  });

  describe('extractProductDetails', () => {
    it('should extract complete product details from modern eBay HTML', async () => {
      const modernEbayHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Apple iPhone 14 Pro 128GB Space Black | eBay</title>
          <meta name="description" content="Find great deals on Apple iPhone 14 Pro">
        </head>
        <body>
          <h1 data-testid="x-item-title-label">Apple iPhone 14 Pro 128GB Space Black Unlocked</h1>
          <div data-testid="notranslate">$899.99</div>
          <div class="u-flL condText">Brand New</div>
          <div data-testid="ux-layout-section-evo">
            This is a brand new Apple iPhone 14 Pro with 128GB storage in Space Black color. 
            The device is factory unlocked and comes with original packaging and accessories.
          </div>
          <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/abc123/s-l1600.jpg" alt="iPhone 14 Pro">
          <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/def456/s-l1600.jpg" alt="iPhone 14 Pro Back">
          <div data-testid="ux-labels-values">
            <dt>Brand</dt><dd>Apple</dd>
            <dt>Model</dt><dd>iPhone 14 Pro</dd>
            <dt>Storage</dt><dd>128GB</dd>
            <dt>Color</dt><dd>Space Black</dd>
          </div>
          <div data-testid="x-sellercard-atf">
            <a href="/usr/techstore123">TechStore123</a>
          </div>
          <div data-testid="ux-textspans">Ships from California, United States</div>
        </body>
        </html>
      `;

      const content: WebpageContent = {
        html: modernEbayHtml,
        title: 'Apple iPhone 14 Pro 128GB Space Black | eBay',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractProductDetails(content);

      expect(result.title).toBe('Apple iPhone 14 Pro 128GB Space Black Unlocked');
      expect(result.price).toBe(899.99);
      expect(result.condition).toBe('Brand New');
      expect(result.description).toContain('brand new Apple iPhone 14 Pro');
      expect(result.images).toHaveLength(1);
      expect(result.images[0].url).toContain('ebayimg.com');
      expect(result.images[0].size).toBe('large');
      expect(result.seller).toBe('TechStore123');
      expect(result.location).toBe('Ships from California, United States');
      expect(result.specifications.Brand).toBe('Apple');
      expect(result.specifications.Model).toBe('iPhone 14 Pro');
    });

    it('should extract details from classic eBay HTML layout', async () => {
      const classicEbayHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Vintage Nike Air Jordan 1 Size 10 | eBay</title>
        </head>
        <body>
          <h1 class="it-ttl">Vintage Nike Air Jordan 1 Retro High OG Size 10</h1>
          <div class="u-flL notranslate">$450.00</div>
          <div class="u-flL condText">Used - Very Good</div>
          <div id="desc_div">
            Authentic vintage Nike Air Jordan 1 in excellent condition. 
            Minor wear on soles but overall great shape. No box included.
          </div>
          <img id="icImg" src="https://i.ebayimg.com/images/g/xyz789/s-l1600.jpg" alt="Air Jordan 1">
          <div class="mbg-nw">SneakerCollector99</div>
          <div class="vi-acc-del-range">New York, United States</div>
          <table class="itemAttr">
            <tr><td>Brand:</td><td>Nike</td></tr>
            <tr><td>Model:</td><td>Air Jordan 1</td></tr>
            <tr><td>Size:</td><td>10</td></tr>
            <tr><td>Color:</td><td>Black/Red</td></tr>
          </table>
        </body>
        </html>
      `;

      const content: WebpageContent = {
        html: classicEbayHtml,
        title: 'Vintage Nike Air Jordan 1 Size 10 | eBay',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractProductDetails(content);

      expect(result.title).toBe('Vintage Nike Air Jordan 1 Retro High OG Size 10');
      expect(result.price).toBe(450.00);
      expect(result.condition).toBe('Used - Very Good');
      expect(result.description).toContain('Authentic vintage Nike Air Jordan 1');
      expect(result.images).toHaveLength(1);
      expect(result.images[0].url).toContain('ebayimg.com');
      expect(result.seller).toBe('SneakerCollector99');
      expect(result.location).toBe('New York, United States');
      expect(result.specifications.Brand).toBe('Nike');
      expect(result.specifications.Size).toBe('10');
    });

    it('should handle missing data with fallback strategies', async () => {
      const incompleteHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Mystery Product | eBay</title>
          <meta name="description" content="Great product for sale">
        </head>
        <body>
          <h2>Some Product Name</h2>
          <p>This is a decent product in good condition. Price negotiable.</p>
          <div>Contact seller for more details</div>
          <span>$25</span>
          <img src="https://i.ebayimg.com/images/g/test123/s-l500.jpg" alt="product">
        </body>
        </html>
      `;

      const content: WebpageContent = {
        html: incompleteHtml,
        title: 'Mystery Product | eBay',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractProductDetails(content);

      expect(result.title).toBe('Some Product Name');
      expect(result.price).toBe(25);
      expect(result.condition).toBe('Very Good'); // Should extract from description
      expect(result.description).toContain('decent product');
      expect(result.images).toHaveLength(1);
      expect(result.images[0].url).toContain('ebayimg.com');
      expect(result.seller).toBe('Unknown Seller');
      expect(result.location).toBe('Unknown Location');
    });

    it('should extract multiple images and validate URLs', async () => {
      const htmlWithImages = `
        <!DOCTYPE html>
        <html>
        <body>
          <h1>Product with Multiple Images</h1>
          <div>$100.00</div>
          <div>New</div>
          <p>Product description here</p>
          <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/img1/s-l1600.jpg">
          <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/img2/s-l1600.jpg">
          <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/img3/s-l1600.jpg">
          <img src="invalid-url">
          <img src="https://example.com/not-an-image">
          <img src="https://i.ebayimg.com/images/g/img4/s-l1600.jpg">
        </body>
        </html>
      `;

      const content: WebpageContent = {
        html: htmlWithImages,
        title: 'Product with Multiple Images',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractProductDetails(content);

      expect(result.images).toHaveLength(1);
      expect(result.images[0].url.includes('ebayimg.com')).toBe(true);
      expect(result.images[0].size).toBe('large');
    });

    it('should extract specifications from different table formats', async () => {
      const htmlWithSpecs = `
        <!DOCTYPE html>
        <html>
        <body>
          <h1>Product with Specifications</h1>
          <div>$200.00</div>
          <div>Used</div>
          <p>Product with detailed specifications</p>
          
          <!-- Modern format -->
          <div data-testid="ux-labels-values">
            <dt>Brand:</dt><dd>Samsung</dd>
            <dt>Model:</dt><dd>Galaxy S21</dd>
            <dt>Storage:</dt><dd>256GB</dd>
          </div>
          
          <!-- Classic table format -->
          <table class="itemAttr">
            <tr><td>Color:</td><td>Phantom Black</td></tr>
            <tr><td>Condition:</td><td>Excellent</td></tr>
          </table>
          
          <!-- Generic dt/dd format -->
          <dl>
            <dt>Network</dt><dd>Unlocked</dd>
            <dt>Screen Size</dt><dd>6.2 inches</dd>
          </dl>
        </body>
        </html>
      `;

      const content: WebpageContent = {
        html: htmlWithSpecs,
        title: 'Product with Specifications',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractProductDetails(content);

      expect(result.specifications.Brand).toBe('Samsung');
      expect(result.specifications.Model).toBe('Galaxy S21');
      expect(result.specifications.Storage).toBe('256GB');
      expect(result.specifications.Color).toBe('Phantom Black');
      expect(result.specifications.Network).toBe('Unlocked');
      expect(result.specifications['Screen Size']).toBe('6.2 inches');
    });

    it('should handle various price formats', async () => {
      const testCases = [
        { html: '<div data-testid="notranslate">$1,299.99</div>', expected: 1299.99 },
        { html: '<div class="x-price-primary">£899.00</div>', expected: 899.00 },
        { html: '<div class="price-current">€750.50</div>', expected: 750.50 },
        { html: '<span>Price: $45</span>', expected: 45.00 },
        { html: '<div>Buy it now for $2,500.00</div>', expected: 2500.00 }
      ];

      for (const testCase of testCases) {
        const html = `
          <!DOCTYPE html>
          <html>
          <body>
            <h1>Test Product</h1>
            ${testCase.html}
            <div>New</div>
            <p>Test description</p>
          </body>
          </html>
        `;

        const content: WebpageContent = {
          html,
          title: 'Test Product',
          metadata: {},
          timestamp: new Date()
        };

        const result = await extractor.extractProductDetails(content);
        expect(result.price).toBe(testCase.expected);
      }
    });

    it('should handle various condition formats', async () => {
      const testCases = [
        { html: '<div class="u-flL condText">Brand New</div>', expected: 'Brand New' },
        { html: '<div class="condition-text">Used - Like New</div>', expected: 'Used - Like New' },
        { html: '<p>This item is in excellent condition</p>', expected: 'Like New' },
        { html: '<div>Refurbished by manufacturer</div>', expected: 'Refurbished' },
        { html: '<span>Open box item</span>', expected: 'Open Box' }
      ];

      for (const testCase of testCases) {
        const html = `
          <!DOCTYPE html>
          <html>
          <body>
            <h1>Test Product</h1>
            <div>$100.00</div>
            ${testCase.html}
            <p>Test description</p>
          </body>
          </html>
        `;

        const content: WebpageContent = {
          html,
          title: 'Test Product',
          metadata: {},
          timestamp: new Date()
        };

        const result = await extractor.extractProductDetails(content);
        expect(result.condition.toLowerCase()).toContain(testCase.expected.toLowerCase().split(' ')[0]);
      }
    });

    it('should clean and format extracted data properly', async () => {
      const messyHtml = `
        <!DOCTYPE html>
        <html>
        <body>
          <h1>   Details about    Apple    iPhone    15    Pro   Max   </h1>
          <div>$   1,199.99   </div>
          <div>   Brand    New   </div>
          <p>   This    is    a    great    product    with    multiple    spaces   </p>
          <img src="https://i.ebayimg.com/images/g/test/s-l1600.jpg">
        </body>
        </html>
      `;

      const content: WebpageContent = {
        html: messyHtml,
        title: 'Messy Product Listing',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractProductDetails(content);

      expect(result.title).toBe('Apple iPhone 15 Pro Max');
      expect(result.price).toBe(1199.99);
      expect(result.condition).toBe('New');
      expect(result.description).toBe('This is a great product with multiple spaces');
    });

    it('should use page title as fallback when no h1 is found', async () => {
      const htmlWithoutH1 = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Samsung Galaxy Watch 5 Pro 45mm | eBay</title>
        </head>
        <body>
          <div>$299.99</div>
          <div>New</div>
          <p>Great smartwatch for fitness enthusiasts</p>
        </body>
        </html>
      `;

      const content: WebpageContent = {
        html: htmlWithoutH1,
        title: 'Samsung Galaxy Watch 5 Pro 45mm | eBay',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractProductDetails(content);

      expect(result.title).toBe('Samsung Galaxy Watch 5 Pro 45mm');
    });

    it('should extract seller information from various formats', async () => {
      const testCases = [
        { 
          html: '<div data-testid="x-sellercard-atf"><a href="/usr/seller123">seller123</a></div>', 
          expected: 'seller123' 
        },
        { 
          html: '<div class="seller-persona"><a>ElectronicsStore</a></div>', 
          expected: 'ElectronicsStore' 
        },
        { 
          html: '<div class="mbg-nw">vintage_collector</div>', 
          expected: 'vintage_collector' 
        },
        { 
          html: '<a href="/usr/techdeals2024">techdeals2024</a>', 
          expected: 'techdeals2024' 
        }
      ];

      for (const testCase of testCases) {
        const html = `
          <!DOCTYPE html>
          <html>
          <body>
            <h1>Test Product</h1>
            <div>$100.00</div>
            <div>New</div>
            <p>Test description</p>
            ${testCase.html}
          </body>
          </html>
        `;

        const content: WebpageContent = {
          html,
          title: 'Test Product',
          metadata: {},
          timestamp: new Date()
        };

        const result = await extractor.extractProductDetails(content);
        expect(result.seller).toBe(testCase.expected);
      }
    });
  });

  describe('extractImageGallery', () => {
    it('should extract images from modern eBay gallery', async () => {
      const htmlWithModernGallery = `
        <!DOCTYPE html>
        <html>
        <body>
          <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/abc123/s-l500.jpg" alt="Product Image 1">
          <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/def456/s-l500.jpg" alt="Product Image 2">
          <img data-zoom-src="https://i.ebayimg.com/images/g/ghi789/s-l1600.jpg" alt="Zoom Image">
        </body>
        </html>
      `;

      const content: WebpageContent = {
        html: htmlWithModernGallery,
        title: 'Test Product',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractImageGallery(content);

      expect(result).toHaveLength(3);
      expect(result[0].url).toContain('s-l1600.jpg'); // Should convert to high-res
      expect(result[0].size).toBe('large');
      expect(result[0].altText).toBe('Product Image 1');
      expect(result[2].url).toContain('s-l1600.jpg'); // Zoom image should be high-res
    });

    it('should convert thumbnail URLs to high-resolution', async () => {
      const htmlWithThumbnails = `
        <!DOCTYPE html>
        <html>
        <body>
          <img src="https://i.ebayimg.com/images/g/test123/s-l64.jpg" alt="Thumbnail">
          <img src="https://i.ebayimg.com/images/g/test456/s-l140.jpg" alt="Small Image">
          <img src="https://i.ebayimg.com/thumbs/images/g/test789/s-l225.jpg" alt="Medium Thumb">
        </body>
        </html>
      `;

      const content: WebpageContent = {
        html: htmlWithThumbnails,
        title: 'Test Product',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractImageGallery(content);

      expect(result).toHaveLength(3);
      // All should be converted to high-res
      expect(result.every(img => img.url.includes('s-l1600.jpg'))).toBe(true);
      expect(result.every(img => img.size === 'large')).toBe(true);
    });

    it('should deduplicate similar images', async () => {
      const htmlWithDuplicates = `
        <!DOCTYPE html>
        <html>
        <body>
          <img src="https://i.ebayimg.com/images/g/same123/s-l64.jpg" alt="Thumbnail">
          <img src="https://i.ebayimg.com/images/g/same123/s-l500.jpg" alt="Medium">
          <img src="https://i.ebayimg.com/images/g/same123/s-l1600.jpg" alt="Large">
          <img src="https://i.ebayimg.com/images/g/different456/s-l500.jpg" alt="Different">
        </body>
        </html>
      `;

      const content: WebpageContent = {
        html: htmlWithDuplicates,
        title: 'Test Product',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractImageGallery(content);

      expect(result).toHaveLength(2); // Should deduplicate to 2 unique images
      
      // Check that we have both unique images (order may vary)
      const urls = result.map(img => img.url);
      expect(urls.some(url => url.includes('same123/s-l1600.jpg'))).toBe(true);
      expect(urls.some(url => url.includes('different456/s-l1600.jpg'))).toBe(true);
    });

    it('should prioritize large images over thumbnails', async () => {
      const htmlWithMixedSizes = `
        <!DOCTYPE html>
        <html>
        <body>
          <img src="https://i.ebayimg.com/images/g/thumb1/s-l64.jpg" alt="Thumbnail 1">
          <img src="https://i.ebayimg.com/images/g/large1/s-l1600.jpg" alt="Large 1">
          <img src="https://i.ebayimg.com/images/g/medium1/s-l400.jpg" alt="Medium 1">
          <img src="https://i.ebayimg.com/images/g/thumb2/s-l96.jpg" alt="Thumbnail 2">
          <img src="https://i.ebayimg.com/images/g/large2/s-l1200.jpg" alt="Large 2">
        </body>
        </html>
      `;

      const content: WebpageContent = {
        html: htmlWithMixedSizes,
        title: 'Test Product',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractImageGallery(content);

      expect(result).toHaveLength(5);
      // First images should be large ones (after conversion to high-res)
      expect(result[0].size).toBe('large');
      expect(result[1].size).toBe('large');
    });

    it('should limit results to 5 images', async () => {
      const htmlWithManyImages = `
        <!DOCTYPE html>
        <html>
        <body>
          ${Array.from({ length: 10 }, (_, i) => 
            `<img src="https://i.ebayimg.com/images/g/img${i}/s-l1600.jpg" alt="Image ${i}">`
          ).join('')}
        </body>
        </html>
      `;

      const content: WebpageContent = {
        html: htmlWithManyImages,
        title: 'Test Product',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractImageGallery(content);

      expect(result).toHaveLength(5); // Should limit to 5 images
    });

    it('should handle different eBay image selectors', async () => {
      const htmlWithVariousSelectors = `
        <!DOCTYPE html>
        <html>
        <body>
          <img id="icImg" src="https://i.ebayimg.com/images/g/main/s-l1600.jpg" alt="Main Image">
          <div class="img"><img src="https://i.ebayimg.com/images/g/gallery1/s-l500.jpg" alt="Gallery 1"></div>
          <div class="gallery"><img src="https://i.ebayimg.com/images/g/gallery2/s-l500.jpg" alt="Gallery 2"></div>
          <img class="thumb" src="https://i.ebayimg.com/images/g/thumb1/s-l64.jpg" alt="Thumbnail">
        </body>
        </html>
      `;

      const content: WebpageContent = {
        html: htmlWithVariousSelectors,
        title: 'Test Product',
        metadata: {},
        timestamp: new Date()
      };

      const result = await extractor.extractImageGallery(content);

      expect(result).toHaveLength(4);
      expect(result.every(img => img.url.includes('ebayimg.com'))).toBe(true);
    });
  });

  describe('validateImageUrls', () => {
    it('should validate image URLs and mark accessibility', async () => {
      const testImages: ImageData[] = [
        {
          url: 'https://i.ebayimg.com/images/g/valid/s-l1600.jpg',
          altText: 'Valid Image',
          size: 'large',
          isValid: true
        },
        {
          url: 'https://invalid-domain.com/image.jpg',
          altText: 'Invalid Image',
          size: 'medium',
          isValid: true
        }
      ];

      const result = await extractor.validateImageUrls(testImages);

      expect(result).toHaveLength(1); // Should filter out invalid URLs
      expect(result[0].url).toContain('ebayimg.com');
      expect(result[0].isValid).toBe(true);
    });

    it('should keep at least one image even if all are invalid', async () => {
      const testImages: ImageData[] = [
        {
          url: 'https://invalid-domain.com/image1.jpg',
          altText: 'Invalid Image 1',
          size: 'large',
          isValid: true
        }
      ];

      const result = await extractor.validateImageUrls(testImages);

      expect(result).toHaveLength(1); // Should keep at least one
      expect(result[0].isValid).toBe(false); // But mark as invalid
    });
  });
});
