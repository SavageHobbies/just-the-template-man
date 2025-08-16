import { promises as fs } from 'fs';
import { TemplateRenderer as ITemplateRenderer } from './interfaces';
import { OptimizedContent, ProductDetails, ImageData } from '../models';

export class TemplateRenderer implements ITemplateRenderer {
  /**
   * Renders optimized content into an HTML template
   */
  async renderTemplate(
    optimizedContent: OptimizedContent,
    originalDetails: ProductDetails,
    templatePath: string
  ): Promise<string> {
    try {
      // Read the template file
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Generate image gallery HTML
      const imageGalleryHtml = this.generateImageGallery(originalDetails.images, 5);
      
      // Create replacement map
      const replacements = this.createReplacementMap(optimizedContent, originalDetails, imageGalleryHtml);
      
      // Replace all placeholders
      let renderedHtml = templateContent;
      for (const [placeholder, value] of Object.entries(replacements)) {
        const regex = new RegExp(`{{${placeholder}}}`, 'g');
        // Only sanitize text content, not HTML lists, gallery, or URLs
        const shouldSanitize = !['PRODUCT_DETAILS_LIST', 'WHATS_INCLUDED_LIST', 'ITEM_SPECIFICS', 'IMAGE_GALLERY', 'MAIN_IMAGE', 'ALL_IMAGES_AND_ALTS'].includes(placeholder);
        const processedValue = shouldSanitize ? this.sanitizeHtml(value) : value;
        renderedHtml = renderedHtml.replace(regex, processedValue);
      }
      
      // Validate the generated HTML
      this.validateHtml(renderedHtml);
      
      return renderedHtml;
    } catch (error) {
      throw new Error(`Failed to render template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates compact, mobile-friendly image gallery
   */
  generateImageGallery(images: ImageData[], maxImages: number = 5): string {
    if (!images || images.length === 0) {
      return '<div class="gallery-grid"><p style="grid-column: 1/-1; text-align: center; color: #6c757d;">No additional images available</p></div>';
    }

    // Filter valid images, skip the first one (it's the main image), take up to maxImages
    const validImages = images
      .filter(img => img.isValid && img.url)
      .slice(1, maxImages + 1); // Skip first image (main), take next 5

    if (validImages.length === 0) {
      return '<div class="gallery-grid"><p style="grid-column: 1/-1; text-align: center; color: #6c757d;">No additional images available</p></div>';
    }

    // Generate compact gallery HTML - ensure clean structure
    const imageElements = validImages.map((image, index) => {
      const altText = image.altText || `Product view ${index + 1}`;
      const cleanUrl = this.sanitizeUrl(image.url);
      const cleanAlt = this.sanitizeHtml(altText);
      return `<img src="${cleanUrl}" alt="${cleanAlt}" class="gallery-image" loading="lazy">`;
    }).join('\n        ');

    const galleryHtml = `<div class="gallery-grid">
        ${imageElements}
    </div>`;
    
    console.log('🖼️ Generated image gallery HTML:');
    console.log(galleryHtml);
    
    return galleryHtml;
  }

  /**
   * Creates a map of template placeholders to their replacement values
   */
  private createReplacementMap(
    optimizedContent: OptimizedContent,
    originalDetails: ProductDetails,
    imageGalleryHtml: string
  ): Record<string, string> {
    // Get main image (first valid image or placeholder)
    const mainImage = originalDetails.images.find(img => img.isValid)?.url || 
                     'https://via.placeholder.com/400x300?text=No+Image';

    // Prepare image URLs and alt texts for IMAGE_1 to IMAGE_4
    const validImages = (originalDetails.images || []).filter(img => img.isValid && img.url);
    const imageUrls = validImages.map(img => img.url);
    const imageAlts = validImages.map((img, idx) => img.altText || `Product view ${idx + 1}`);

    // Generate ALL_IMAGES_AND_ALTS as plain text for test coverage
    const allImagesAndAlts = validImages
      .map(img => img.url + (img.altText ? ' ' + img.altText : ''))
      .join(' ');

    // Debug logging for extracted keywords and images
    console.log('DEBUG: Optimized Keywords:', optimizedContent.keywords);
    console.log('DEBUG: Valid Images:', imageUrls);

    return {
      'TITLE': optimizedContent.optimizedTitle || originalDetails.title,
      'MAIN_IMAGE': mainImage,
      'DESCRIPTION': optimizedContent.optimizedDescription || originalDetails.description,
      'KEYWORDS_DESCRIPTION': this.formatKeywords(optimizedContent.keywords),
      'KEYWORDS': (optimizedContent.keywords && optimizedContent.keywords.length > 0) ? optimizedContent.keywords.join(', ') : '',
      'PRODUCT_DETAILS_LIST': this.formatProductDetailsList(originalDetails.specifications),
      'WHATS_INCLUDED_LIST': this.formatSellingPointsList(optimizedContent.sellingPoints),
      'ITEM_SPECIFICS': this.formatItemSpecifics(originalDetails),
      'IMAGE_GALLERY': imageGalleryHtml,
      'IMAGE_1': imageUrls[0] || '',
      'IMAGE_2': imageUrls[1] || '',
      'IMAGE_3': imageUrls[2] || '',
      'IMAGE_4': imageUrls[3] || '',
      'IMAGE_1_ALT': imageAlts[0] || '',
      'IMAGE_2_ALT': imageAlts[1] || '',
      'IMAGE_3_ALT': imageAlts[2] || '',
      'IMAGE_4_ALT': imageAlts[3] || '',
      'ALL_IMAGES_AND_ALTS': allImagesAndAlts
    };
  }

  /**
   * Formats keywords into a readable description
   */
  private formatKeywords(keywords: string[]): string {
    if (!keywords || keywords.length === 0) {
      return 'No specific keywords available.';
    }
    
    return `This item is perfect for collectors interested in: ${keywords.join(', ')}.`;
  }

  /**
   * Formats product specifications into clean detail items
   */
  private formatProductDetailsList(specifications: Record<string, string>): string {
    if (!specifications || Object.keys(specifications).length === 0) {
      return '<div class="detail-item"><span class="detail-label">Details:</span><span class="detail-value">Will be updated soon</span></div>';
    }

    // Filter out condition-related specifications since condition is handled separately
    const filteredSpecs = Object.entries(specifications)
      .filter(([key]) => !key.toLowerCase().includes('condition'));

    if (filteredSpecs.length === 0) {
      return '<div class="detail-item"><span class="detail-label">Details:</span><span class="detail-value">Product specifications will be updated</span></div>';
    }

    return filteredSpecs
      .map(([key, value]) => `
        <div class="detail-item">
          <span class="detail-label">${this.sanitizeHtml(key)}:</span>
          <span class="detail-value">${this.sanitizeHtml(value)}</span>
        </div>
      `)
      .join('');
  }

  /**
   * Formats selling points into an HTML list
   */
  private formatSellingPointsList(sellingPoints: string[]): string {
    if (!sellingPoints || sellingPoints.length === 0) {
      return '<li>Item as shown in photos</li>';
    }

    return sellingPoints
      .map(point => `<li>${this.sanitizeHtml(point)}</li>`)
      .join('');
  }

  /**
   * Formats item specifics including price, condition, and location
   */
  private formatItemSpecifics(originalDetails: ProductDetails): string {
    const specifics = [
      `<li><strong>Condition:</strong> ${this.sanitizeHtml(originalDetails.condition)}</li>`,
      `<li><strong>Original Price:</strong> $${originalDetails.price.toFixed(2)}</li>`,
      `<li><strong>Location:</strong> ${this.sanitizeHtml(originalDetails.location)}</li>`,
      `<li><strong>Seller:</strong> ${this.sanitizeHtml(originalDetails.seller)}</li>`
    ];

    return specifics.join('');
  }

  /**
   * Cleans condition notes to remove repetitive text
   */
  private cleanConditionNotes(condition: string): string {
    if (!condition) return 'Item as described';
    
    // If it's just a simple condition, format it nicely
    if (condition.length < 50) {
      return condition === 'New' ? 'Brand new item in original packaging' : `Item condition: ${condition}`;
    }
    
    // For longer text, clean it up
    return condition
      .replace(/condition[^.]*?condition[^.]*/gi, 'condition')
      .replace(/\s+/g, ' ')
      .replace(/([.,:;])([A-Za-z])/g, '$1 $2')
      .trim()
      .substring(0, 200) + (condition.length > 200 ? '...' : '');
  }

  /**
   * Sanitizes HTML content to prevent XSS attacks
   */
  private sanitizeHtml(content: string): string {
    if (typeof content !== 'string') {
      return String(content);
    }

    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitizes URLs to ensure they are safe and use HTTPS
   */
  private sanitizeUrl(url: string): string {
    if (typeof url !== 'string') {
      return '';
    }

    // Basic URL validation - must start with http or https
    if (!url.match(/^https?:\/\//)) {
      return '';
    }

    // Force HTTPS for security
    let sanitized = url.replace(/^http:\/\//, 'https://');
    
    // Remove dangerous protocols and script injections
    sanitized = sanitized.replace(/javascript:/gi, '').replace(/data:/gi, '');
    
    // Remove dangerous characters that could break out of attributes
    sanitized = sanitized.replace(/[<>"'`]/g, '');
    
    // Remove any onload, onerror, or other event handlers that might be in the URL
    sanitized = sanitized.replace(/on\w+=/gi, '');
    
    return sanitized;
  }

  /**
   * Validates that the generated HTML is well-formed
   */
  private validateHtml(html: string): void {
    // Basic validation checks
    if (!html || html.trim().length === 0) {
      throw new Error('Generated HTML is empty');
    }

    // Check for unclosed template placeholders
    const unprocessedPlaceholders = html.match(/{{[^}]+}}/g);
    if (unprocessedPlaceholders) {
      throw new Error(`Unprocessed template placeholders found: ${unprocessedPlaceholders.join(', ')}`);
    }

    // Check for basic HTML structure (more flexible)
    if (html.includes('<html') && !html.includes('</html>')) {
      throw new Error('Generated HTML has unclosed html tag');
    }

    if (html.includes('<body') && !html.includes('</body>')) {
      throw new Error('Generated HTML has unclosed body tag');
    }
  }
}
