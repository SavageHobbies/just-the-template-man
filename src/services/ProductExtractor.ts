import * as cheerio from 'cheerio';
import { ProductExtractor } from './interfaces';
import { WebpageContent, ProductDetails, ImageData } from '../models';
import { 
  validateProductDetails, 
  formatPrice,
  getLogger
} from '../utils';
import { imageValidationCache } from '../utils/cache';
import { imageValidationThrottler } from '../utils/rate-limiter';
import { ParallelProcessor } from '../utils/batch-processor';
import axios from 'axios';

/**
 * Concrete implementation of ProductExtractor for eBay listings
 * Uses cheerio for HTML parsing with multiple fallback strategies
 */
export class EbayProductExtractor implements ProductExtractor {
  private readonly logger = getLogger();
  
  /**
   * Extracts structured product details from eBay webpage content
   * @param content - The scraped webpage content
   * @returns Promise containing extracted product details
   */
  async extractProductDetails(content: WebpageContent): Promise<ProductDetails> {
    const $ = cheerio.load(content.html);
    
    // Extract all product details using multiple strategies
    const title = this.extractTitle($);
    const description = this.extractDescription($);
    const price = this.extractPrice($);
    const condition = this.extractCondition($);
    const images = await this.extractImages($);
    const specifications = this.extractSpecifications($);
    const seller = this.extractSeller($);
    const location = this.extractLocation($);

    const productDetails: ProductDetails = {
      title,
      description,
      price,
      condition,
      images,
      specifications,
      seller,
      location
    };

    // Validate completeness and attempt fallback extraction if needed
    if (!validateProductDetails(productDetails)) {
      return this.attemptFallbackExtraction($, productDetails);
    }

    return productDetails;
  }

  /**
   * Extracts product title using multiple selector strategies
   */
  private extractTitle($: cheerio.CheerioAPI): string {
    const titleSelectors = [
      'h1[data-testid="x-item-title-label"]', // Modern eBay
      'h1#x-item-title-label',               // Alternative modern
      'h1.it-ttl',                           // Classic eBay
      'h1.notranslate',                      // International
      '.x-item-title-label',                 // Fallback
      'h1[id*="title"]',                     // Generic title
      'h1:first',                            // First h1
      'h2:first',                            // First h2 as fallback
      'h3:first'                             // First h3 as fallback
    ];

    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        let title = element.text().trim();
        
        // Clean up title text
        title = title.replace(/^Details about\s*/i, '');
        title = title.replace(/\s+/g, ' ');
        
        if (title && title.length > 5) {
          return title;
        }
      }
    }

    // Extract from page title as last resort
    const pageTitle = $('title').text().trim();
    if (pageTitle) {
      return pageTitle.replace(/\s*\|\s*eBay.*$/i, '').trim();
    }

    return '';
  }

  /**
   * Extracts product description using multiple strategies
   */
  private extractDescription($: cheerio.CheerioAPI): string {
    const descriptionSelectors = [
      '[data-testid="ux-layout-section-evo"]',  // Modern description section
      '#desc_div',                              // Classic description
      '.u-flL.condText',                        // Condition description
      '[data-testid="item-description"]',       // Alternative modern
      '.item-description',                      // Generic description
      '#viTabs_0_is',                          // Item specifics
      '.section-title + div'                   // Section content
    ];

    let description = '';
    
    for (const selector of descriptionSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text && text.length > description.length) {
          description = text;
        }
      }
    }

    // Clean up description - normalize whitespace
    description = description.replace(/\s+/g, ' ').trim();
    
    // If description is too short, try to extract from multiple elements
    if (description.length < 50) {
      const additionalText = this.extractAdditionalDescription($);
      if (additionalText.length > description.length) {
        description = additionalText;
      }
    }

    return description;
  }

  /**
   * Extracts additional description content from various page elements
   */
  private extractAdditionalDescription($: cheerio.CheerioAPI): string {
    const textElements: string[] = [];
    
    // Collect text from various description-related elements
    $('p, div[class*="description"], div[class*="detail"], .item-condition-text').each((_, element) => {
      let text = $(element).text().trim();
      // Clean up whitespace
      text = text.replace(/\s+/g, ' ');
      if (text && text.length > 20 && !textElements.includes(text)) {
        textElements.push(text);
      }
    });

    return textElements.join(' ').substring(0, 1000);
  }

  /**
   * Extracts product price using multiple strategies
   */
  private extractPrice($: cheerio.CheerioAPI): number {
    const priceSelectors = [
      '[data-testid="notranslate"]',           // Modern price
      '.x-price-primary',                      // Primary price
      '.u-flL.notranslate',                   // Price with currency
      '[data-testid="x-price-primary"]',      // Alternative modern
      '.price-current',                        // Current price
      '.vi-price .notranslate',               // View item price
      '.u-flL:contains("$")',                 // Any element with $
      '[class*="price"]'                      // Generic price class
    ];

    for (const selector of priceSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const priceText = element.text().trim();
        const price = formatPrice(priceText);
        if (price > 0) {
          return price;
        }
      }
    }

    // Try to find price in any element containing currency symbols
    $('*').each((_, element) => {
      const text = $(element).text().trim();
      if (text.match(/[\$£€¥][\d,]+\.?\d*/)) {
        const price = formatPrice(text);
        if (price > 0) {
          return false; // Break the loop
        }
      }
    });

    // Try to find price in any text content
    const priceRegex = /[\$£€¥][\s]*[\d,]+\.?\d*/g;
    const bodyText = $('body').text();
    const priceMatches = bodyText.match(priceRegex);
    
    if (priceMatches && priceMatches.length > 0) {
      // Return the first valid price found
      for (const match of priceMatches) {
        const price = formatPrice(match);
        if (price > 0) {
          return price;
        }
      }
    }

    return 0;
  }

  /**
   * Extracts product condition using multiple strategies
   */
  private extractCondition($: cheerio.CheerioAPI): string {
    const conditionSelectors = [
      '[data-testid="u-flL condText"]',        // Modern condition
      '.u-flL.condText',                       // Classic condition
      '.condition-text',                       // Generic condition
      '[class*="condition"]',                  // Any condition class
      '.item-condition'                        // Item condition
    ];

    for (const selector of conditionSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const condition = element.text().trim();
        if (condition && this.isValidCondition(condition)) {
          return condition;
        }
      }
    }

    // Look for condition in any text content
    const bodyText = $('body').text().toLowerCase();
    const conditionPatterns = [
      { pattern: /brand new|new with tags|new in box/i, condition: 'Brand New' },
      { pattern: /like new|excellent condition/i, condition: 'Like New' },
      { pattern: /very good|good condition/i, condition: 'Very Good' },
      { pattern: /used|pre-owned|previously owned/i, condition: 'Used' },
      { pattern: /refurbished|renewed/i, condition: 'Refurbished' },
      { pattern: /open box|opened/i, condition: 'Open Box' },
      { pattern: /for parts|not working|broken/i, condition: 'For Parts' },
      { pattern: /excellent/i, condition: 'Excellent' },
      { pattern: /good/i, condition: 'Good' },
      { pattern: /\bnew\b/i, condition: 'New' }
    ];

    for (const { pattern, condition } of conditionPatterns) {
      if (pattern.test(bodyText)) {
        return condition;
      }
    }

    return 'Unknown';
  }

  /**
   * Validates if a string represents a valid condition
   */
  private isValidCondition(condition: string): boolean {
    const validConditions = [
      'new', 'used', 'refurbished', 'open box', 'for parts',
      'brand new', 'like new', 'very good', 'good', 'acceptable'
    ];
    
    return validConditions.some(valid => 
      condition.toLowerCase().includes(valid.toLowerCase())
    );
  }

  /**
   * Extracts the main product image from the listing
   * Simply returns the first/main image found without complex gallery logic
   */
  private async extractImages($: cheerio.CheerioAPI): Promise<ImageData[]> {
    // Extract title for potential UPC lookup (keeping for data purposes)
    const title = this.extractTitle($);
    
    // Try to find UPC in the page content for data purposes
    const upcMatch = this.extractUPCFromContent($, title);
    const upc = upcMatch ? upcMatch[0] : undefined;
    
    this.logger.info(`Extracted UPC: ${upc || 'No UPC found'}`);
    
    // Simply extract the main image without complex stock image lookup
    const mainImage = this.extractMainImage($);
    
    if (mainImage) {
      this.logger.info(`✅ Found main image: ${mainImage.url}`);
      return [mainImage];
    }
    
    this.logger.warn('No main image found, using placeholder');
    
    // Final fallback: return a placeholder image
    return [{
      url: 'https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=Product+Image',
      altText: title || 'Product Image',
      size: 'large',
      isValid: true
    }];
  }

  /**
   * Extracts the main product image from the page
   * Simply returns the first/main image found without complex gallery logic
   */
  private extractMainImage($: cheerio.CheerioAPI): ImageData | null {
    // Main image selectors in order of priority
    const mainImageSelectors = [
      'img[data-testid="ux-image-carousel-item"]',  // Modern main image
      'img[data-zoom-src]',                        // Zoom image (usually main)
      '#icImg',                                    // Classic main image
      '#image',                                    // Generic image id
      '.img img',                                  // Image in img container
      '.image img',                                // Image in image container
      'img[src*="ebayimg.com"]:first',             // First eBay image
      'img[src*="i.ebayimg.com"]:first'            // First i.ebayimg.com image
    ];

    for (const selector of mainImageSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const $img = $(element);
        
        // Try multiple attributes for image URL
        const possibleUrls = [
          $img.attr('data-zoom-src'),
          $img.attr('data-src'),
          $img.attr('src')
        ].filter(Boolean);

        for (const url of possibleUrls) {
          if (url && this.isValidImageUrl(url)) {
            // Convert to high-resolution URL if possible
            const highResUrl = this.convertToHighResolution(url);
            
            return {
              url: highResUrl,
              altText: $img.attr('alt') || undefined,
              size: this.determineImageSize(highResUrl),
              isValid: true // Will be validated later
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Extracts UPC code from eBay page content using multiple strategies
   */
  private extractUPCFromContent($: cheerio.CheerioAPI, title: string): RegExpMatchArray | null {
    // Strategy 1: Look for UPC in the title
    let upcMatch = title.match(/\b\d{12,13}\b/);
    if (upcMatch) {
      return upcMatch;
    }
    
    // Strategy 2: Look for UPC in item specifics
    const itemSpecifics = this.extractSpecifications($);
    const specificValues = Object.values(itemSpecifics).join(' ');
    upcMatch = specificValues.match(/\b\d{12,13}\b/);
    if (upcMatch) {
      return upcMatch;
    }
    
    // Strategy 3: Look for UPC in description
    const description = this.extractDescription($);
    upcMatch = description.match(/\b\d{12,13}\b/);
    if (upcMatch) {
      return upcMatch;
    }
    
    // Strategy 4: Look for UPC in any text content
    const bodyText = $('body').text();
    upcMatch = bodyText.match(/\b\d{12,13}\b/);
    if (upcMatch) {
      return upcMatch;
    }
    
    // Strategy 5: Look for UPC in meta tags or structured data
    const structuredData = $('script[type="application/ld+json"]').text();
    if (structuredData) {
      try {
        const json = JSON.parse(structuredData);
        // Look for UPC in various structured data properties
        const upcFields = ['upc', 'gtin13', 'gtin', 'productID', 'productId'];
        for (const field of upcFields) {
          if (json[field] && json[field].toString().match(/^\d{12,13}$/)) {
            return json[field].toString().match(/\b\d{12,13}\b/);
          }
          // Check nested properties
          if (json.offers && json.offers[field] && json.offers[field].toString().match(/^\d{12,13}$/)) {
            return json.offers[field].toString().match(/\b\d{12,13}\b/);
          }
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }
    
    return null;
  }

  /**
   * Validates if a URL is a valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    if (!url || url.length < 10) return false;
    
    // Check for common image extensions and eBay image patterns
    const imagePatterns = [
      /\.(jpg|jpeg|png|gif|webp)(\?|$)/i,
      /ebayimg\.com/,
      /i\.ebayimg\.com/,
      /thumbs\d*\.ebaystatic\.com/
    ];

    return imagePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Extracts product specifications from item specifics
   */
  private extractSpecifications($: cheerio.CheerioAPI): Record<string, string> {
    const specifications: Record<string, string> = {};
    
    // Modern item specifics
    $('[data-testid="ux-labels-values"] dt, [data-testid="ux-labels-values"] dd').each((index, element) => {
      const text = $(element).text().trim();
      if (index % 2 === 0) {
        // This is a label (dt)
        const nextElement = $(element).next();
        if (nextElement.length > 0) {
          const value = nextElement.text().trim();
          if (text && value) {
            specifications[text.replace(':', '')] = value;
          }
        }
      }
    });

    // Classic item specifics table
    $('.itemAttr tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const key = $(cells[0]).text().trim().replace(':', '');
        const value = $(cells[1]).text().trim();
        if (key && value) {
          specifications[key] = value;
        }
      }
    });

    // Generic key-value pairs
    $('dt, th').each((_, element) => {
      const key = $(element).text().trim().replace(':', '');
      const valueElement = $(element).next('dd, td');
      if (valueElement.length > 0) {
        const value = valueElement.text().trim();
        if (key && value && key.length < 50 && value.length < 200) {
          specifications[key] = value;
        }
      }
    });

    return specifications;
  }

  /**
   * Extracts seller information
   */
  private extractSeller($: cheerio.CheerioAPI): string {
    const sellerSelectors = [
      '[data-testid="x-sellercard-atf"] a',    // Modern seller card
      '.seller-persona a',                     // Seller persona
      '.mbg-nw',                              // Seller name
      '[data-testid="seller-link"]',          // Seller link
      'a[href*="/usr/"]'                      // User profile link
    ];

    for (const selector of sellerSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const seller = element.text().trim();
        if (seller && seller.length > 0 && seller.length < 50) {
          return seller;
        }
      }
    }

    return 'Unknown Seller';
  }

  /**
   * Extracts item location
   */
  private extractLocation($: cheerio.CheerioAPI): string {
    const locationSelectors = [
      '[data-testid="ux-textspans"]',          // Modern location
      '.vi-acc-del-range',                     // Delivery range
      '.location-text',                        // Location text
      '[class*="location"]',                   // Generic location
      '.ship-from'                            // Ship from location
    ];

    for (const selector of locationSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const location = element.text().trim();
        if (location && this.isValidLocation(location)) {
          return location;
        }
      }
    }

    // Fallback: look for location patterns in any div or span
    const locationPatterns = [
      /\b[A-Z][a-z]+,\s*[A-Z][a-z]+\b/,      // City, State
      /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/,         // City, ST
      /Ships from\s+([^,]+,\s*[^,]+)/i,      // Ships from pattern
      /Located in\s+([^,]+,\s*[^,]+)/i       // Located in pattern
    ];

    const bodyText = $('body').text();
    for (const pattern of locationPatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        const location = match[1] || match[0];
        if (this.isValidLocation(location)) {
          return location.trim();
        }
      }
    }

    // Look for any div containing location-like text
    let foundLocation = '';
    $('div, span').each((_, element) => {
      const text = $(element).text().trim();
      if (text.match(/^[A-Z][a-z]+,\s*[A-Z][a-z]+$/) || text.match(/^[A-Z][a-z]+,\s*[A-Z]{2}$/)) {
        if (this.isValidLocation(text)) {
          foundLocation = text;
          return false; // Break the loop
        }
      }
    });

    if (foundLocation) {
      return foundLocation;
    }

    return 'Unknown Location';
  }

  /**
   * Validates if a string represents a valid location
   */
  private isValidLocation(location: string): boolean {
    // Basic validation for location format
    return location.length > 2 && 
           location.length < 100 && 
           !/^\d+$/.test(location) && // Not just numbers
           !location.toLowerCase().includes('shipping');
  }

  /**
   * Attempts fallback extraction strategies when initial extraction fails
   */
  private async attemptFallbackExtraction(
    $: cheerio.CheerioAPI, 
    partialDetails: ProductDetails
  ): Promise<ProductDetails> {
    const result = { ...partialDetails };

    // Fallback title extraction
    if (!result.title) {
      result.title = this.extractFallbackTitle($);
    }

    // Fallback description extraction
    if (!result.description) {
      result.description = this.extractFallbackDescription($);
    }

    // Fallback price extraction
    if (result.price === 0) {
      result.price = this.extractFallbackPrice($);
    }

    // Fallback condition extraction
    if (!result.condition || result.condition === 'Unknown') {
      result.condition = this.extractFallbackCondition($);
    }

    // Fallback image extraction if no images found
    if (!result.images || result.images.length === 0) {
      const mainImage = this.extractMainImage($);
      if (mainImage) {
        result.images = [mainImage];
      } else {
        result.images = [{
          url: 'https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=Product+Image',
          altText: result.title || 'Product Image',
          size: 'large',
          isValid: true
        }];
      }
    }

    return result;
  }

  /**
   * Fallback title extraction from meta tags and page structure
   */
  private extractFallbackTitle($: cheerio.CheerioAPI): string {
    // Try meta tags
    const metaTitle = $('meta[property="og:title"]').attr('content') ||
                     $('meta[name="title"]').attr('content');
    
    if (metaTitle && metaTitle.trim().length > 5) {
      return metaTitle.trim();
    }

    // Try any heading element
    const headings = $('h1, h2, h3').first().text().trim();
    if (headings && headings.length > 5) {
      return headings;
    }

    return 'Unknown Product';
  }

  /**
   * Fallback description extraction from meta tags and content
   */
  private extractFallbackDescription($: cheerio.CheerioAPI): string {
    // Try meta description
    const metaDesc = $('meta[name="description"]').attr('content') ||
                    $('meta[property="og:description"]').attr('content');
    
    if (metaDesc && metaDesc.trim().length > 20) {
      return metaDesc.trim();
    }

    // Try to extract from any paragraph or div with substantial text
    let longestText = '';
    $('p, div').each((_, element) => {
      const text = $(element).text().trim();
      if (text.length > longestText.length && text.length > 50) {
        longestText = text;
      }
    });

    return longestText || 'No description available';
  }

  /**
   * Fallback price extraction using broader patterns
   */
  private extractFallbackPrice($: cheerio.CheerioAPI): number {
    // Look for any element containing currency symbols
    const currencyElements = $('*:contains("$"), *:contains("£"), *:contains("€")');
    
    for (let i = 0; i < currencyElements.length; i++) {
      const element = currencyElements.eq(i);
      const text = element.text().trim();
      const price = formatPrice(text);
      if (price > 0) {
        return price;
      }
    }

    return 0;
  }

  /**
   * Fallback condition extraction using text analysis
   */
  private extractFallbackCondition($: cheerio.CheerioAPI): string {
    const bodyText = $('body').text().toLowerCase();
    const conditionPatterns = [
      { pattern: /brand new|new with tags|new in box/i, condition: 'Brand New' },
      { pattern: /like new|excellent condition/i, condition: 'Like New' },
      { pattern: /very good|good condition/i, condition: 'Very Good' },
      { pattern: /used|pre-owned|previously owned/i, condition: 'Used' },
      { pattern: /refurbished|renewed/i, condition: 'Refurbished' },
      { pattern: /open box|opened/i, condition: 'Open Box' },
      { pattern: /for parts|not working|broken/i, condition: 'For Parts' }
    ];

    for (const { pattern, condition } of conditionPatterns) {
      if (pattern.test(bodyText)) {
        return condition;
      }
    }

    return 'Used'; // Default fallback
  }

  /**
   * Extracts image gallery from eBay webpage content
   * @param content - The scraped webpage content
   * @returns Promise containing array of image data
   */
  async extractImageGallery(content: WebpageContent): Promise<ImageData[]> {
    const $ = cheerio.load(content.html);
    const imageDataArray: ImageData[] = [];
    const seenUrls = new Set<string>();

    this.logger.info('Starting image extraction from eBay page...');

    // eBay image gallery selectors in order of priority
    const imageSelectors = [
      // Modern eBay gallery selectors
      'img[data-testid="ux-image-carousel-item"]',
      'img[data-zoom-src]',
      'img[data-src*="ebayimg"]',
      
      // Classic eBay selectors
      '#icImg',
      '#image',
      '.img img',
      '.image img',
      
      // Gallery and thumbnail selectors
      '.gallery img',
      '.thumbnails img',
      '.thumb img',
      
      // Generic eBay image patterns
      'img[src*="ebayimg.com"]',
      'img[src*="i.ebayimg.com"]',
      'img[src*="thumbs.ebaystatic.com"]',
      
      // Alternative patterns
      'img[alt*="picture"]',
      'img[alt*="image"]',
      'img[id*="image"]',
      'img[class*="image"]'
    ];

    let totalImagesFound = 0;

    // Extract images from each selector
    for (const selector of imageSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        this.logger.debug(`Found ${elements.length} images with selector: ${selector}`);
      }
      
      elements.each((_, element) => {
        const $img = $(element);
        
        // Try multiple attributes for image URL
        const possibleUrls = [
          $img.attr('data-zoom-src'),
          $img.attr('data-src'),
          $img.attr('src'),
          $img.attr('data-original'),
          $img.attr('data-lazy-src')
        ].filter(Boolean);

        for (const url of possibleUrls) {
          if (url && this.isValidImageUrl(url) && !seenUrls.has(url)) {
            seenUrls.add(url);
            totalImagesFound++;
            
            // Convert to high-resolution URL if possible
            const highResUrl = this.convertToHighResolution(url);
            
            const imageData: ImageData = {
              url: highResUrl,
              altText: $img.attr('alt') || undefined,
              size: this.determineImageSize(highResUrl),
              isValid: true // Will be validated later
            };
            
            imageDataArray.push(imageData);
            
            this.logger.debug(`Found image: ${highResUrl.substring(0, 80)}...`);
          }
        }
      });
    }

    this.logger.info(`Found ${totalImagesFound} total images before processing`);

    // Remove duplicates and prioritize high-resolution images
    const uniqueImages = this.deduplicateImages(imageDataArray);
    
    // Sort by priority (large images first, then medium, then thumbnails)
    const sortedImages = this.sortImagesByPriority(uniqueImages);
    
    // Return top 5 images
    const topImages = sortedImages.slice(0, 5);
    
    this.logger.info(`Selected ${topImages.length} images for validation`);
    
    // Validate URLs
    const validatedImages = await this.validateImageUrls(topImages);
    
    this.logger.info(`Validation complete: ${validatedImages.filter(img => img.isValid).length} of ${validatedImages.length} images are valid`);
    
    return validatedImages;
  }

  /**
   * Converts image URL to high-resolution version
   * @param url - Original image URL
   * @returns High-resolution image URL
   */
  private convertToHighResolution(url: string): string {
    // eBay image URL patterns for high resolution
    if (url.includes('ebayimg.com')) {
      // Convert to largest size available
      // s-l1600.jpg is typically the highest resolution
      return url
        .replace(/\/s-l\d+\./, '/s-l1600.')
        .replace(/\/s-l\d+$/, '/s-l1600.jpg')
        .replace(/\$_\d+\./, '$_57.')  // Remove size constraints
        .replace(/\$_\w+\./, '$_57.'); // Use high quality setting
    }
    
    // For other image hosts, return as-is
    return url;
  }

  /**
   * Determines image size category based on URL patterns
   * @param url - Image URL
   * @returns Size category
   */
  private determineImageSize(url: string): 'thumbnail' | 'medium' | 'large' {
    // eBay size patterns
    if (url.includes('s-l1600') || url.includes('s-l1200') || url.includes('s-l800')) {
      return 'large';
    }
    if (url.includes('s-l400') || url.includes('s-l300') || url.includes('s-l225')) {
      return 'medium';
    }
    if (url.includes('s-l64') || url.includes('s-l96') || url.includes('s-l140')) {
      return 'thumbnail';
    }
    
    // Generic size detection based on URL patterns
    if (url.includes('thumb') || url.includes('small')) {
      return 'thumbnail';
    }
    if (url.includes('large') || url.includes('big') || url.includes('full')) {
      return 'large';
    }
    
    // Default to medium if can't determine
    return 'medium';
  }

  /**
   * Removes duplicate images based on URL similarity
   * @param images - Array of image data
   * @returns Deduplicated array
   */
  private deduplicateImages(images: ImageData[]): ImageData[] {
    const uniqueImages: ImageData[] = [];
    const seenBaseUrls = new Map<string, number>();

    for (const image of images) {
      // Extract base URL without size parameters - more specific pattern matching
      const baseUrl = image.url
        .replace(/\/s-l\d+\.jpg$/, '/base.jpg')
        .replace(/\/s-l\d+$/, '/base')
        .replace(/\$_\d+\.jpg$/, '$_base.jpg')
        .replace(/\?.*$/, ''); // Remove query parameters

      if (!seenBaseUrls.has(baseUrl)) {
        seenBaseUrls.set(baseUrl, uniqueImages.length);
        uniqueImages.push(image);
      } else {
        // If we've seen this base URL, keep the higher resolution version
        const existingIndex = seenBaseUrls.get(baseUrl)!;
        const existing = uniqueImages[existingIndex];
        
        // Replace with higher resolution image
        if (this.isHigherResolution(image, existing)) {
          uniqueImages[existingIndex] = image;
        }
      }
    }

    return uniqueImages;
  }

  /**
   * Determines if first image is higher resolution than second
   * @param image1 - First image
   * @param image2 - Second image
   * @returns True if image1 is higher resolution
   */
  private isHigherResolution(image1: ImageData, image2: ImageData): boolean {
    const sizeOrder = { 'large': 3, 'medium': 2, 'thumbnail': 1 };
    return sizeOrder[image1.size] > sizeOrder[image2.size];
  }

  /**
   * Sorts images by priority (large first, then medium, then thumbnails)
   * @param images - Array of image data
   * @returns Sorted array
   */
  private sortImagesByPriority(images: ImageData[]): ImageData[] {
    const sizeOrder = { 'large': 3, 'medium': 2, 'thumbnail': 1 };
    
    return images.sort((a, b) => {
      // First sort by size (larger first)
      const sizeDiff = sizeOrder[b.size] - sizeOrder[a.size];
      if (sizeDiff !== 0) return sizeDiff;
      
      // Then sort by URL length (longer URLs often indicate higher quality)
      return b.url.length - a.url.length;
    });
  }

  /**
   * Validates image URLs by making HEAD requests with caching and throttling
   * @param images - Array of image data to validate
   * @returns Promise containing validated image data
   */
  async validateImageUrls(images: ImageData[]): Promise<ImageData[]> {
    // Use parallel processing with caching for better performance
    const validatedImages = await ParallelProcessor.parallelSettled(
      images,
      async (image) => {
        // Check cache first
        const cached = await imageValidationCache.get(image.url);
        if (cached !== null) {
          return { ...image, isValid: cached };
        }

        // Throttle requests to be respectful
        return imageValidationThrottler.throttle(async () => {
          try {
            const response = await axios.head(image.url, {
              timeout: 5000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            });
            
            const isValidImage = response.status === 200 && 
                                response.headers['content-type']?.startsWith('image/');
            
            // Cache the result
            await imageValidationCache.set(image.url, isValidImage);
            
            return { ...image, isValid: isValidImage };
          } catch (error) {
            // Cache negative results too (but with shorter TTL)
            await imageValidationCache.set(image.url, false, 60 * 60 * 1000); // 1 hour
            return { ...image, isValid: false };
          }
        });
      },
      5 // Max 5 concurrent validations
    );

    // Extract successful results and handle failures
    const results: ImageData[] = [];
    for (let i = 0; i < validatedImages.length; i++) {
      const result = validatedImages[i];
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      } else {
        // If validation failed, mark as invalid but keep the image
        results.push({ ...images[i], isValid: false });
      }
    }
    
    // Filter out invalid images, but keep at least one image even if invalid
    const validImages = results.filter(img => img.isValid);
    
    if (validImages.length === 0 && results.length > 0) {
      // If no images are valid, return the first one anyway
      return [results[0]];
    }
    
    return validImages;
  }
}
