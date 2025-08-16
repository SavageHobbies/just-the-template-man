import axios from 'axios';
import { ImageData } from '../models';
import { getLogger } from '../utils/logger';

/**
 * Service for fetching stock product images from various sources
 */
export class StockImageService {
  private readonly logger = getLogger();
  private readonly cache = new Map<string, ImageData>();
  private readonly amazonSearchUrl = 'https://www.amazon.com/s';
  private readonly amazonImageUrlPattern = /https:\/\/[^\/]+\/images\/I\/[A-Za-z0-9]+\.(?:jpg|jpeg|png|gif)/;

  /**
   * Fetches a stock product image based on UPC or product title
   * @param upc - The UPC code of the product
   * @param title - The product title (fallback if UPC not available)
   * @returns Promise containing image data or null if not found
   */
  async fetchStockImage(upc?: string, title?: string): Promise<ImageData | null> {
    try {
      // Try to use UPC first if available
      if (upc) {
        const cached = this.cache.get(upc);
        if (cached) {
          return cached;
        }

        const imageData = await this.fetchImageByUPC(upc);
        if (imageData) {
          this.cache.set(upc, imageData);
          return imageData;
        }
      }

      // Fallback to title-based search
      if (title) {
        const imageData = await this.fetchImageByTitle(title);
        if (imageData) {
          return imageData;
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Error fetching stock image:', error as Error);
      return null;
    }
  }

  /**
   * Fetches image using UPC code by searching dedicated UPC databases first
   * @param upc - The UPC code
   * @returns Promise containing image data or null
   */
  private async fetchImageByUPC(upc: string): Promise<ImageData | null> {
    try {
      this.logger.info(`Searching for UPC: ${upc}`);
      
      // First try UPC databases (more reliable than Amazon)
      const upcImage = await this.fetchImageFromUPCDatabases(upc);
      if (upcImage) {
        this.logger.info(`Found image from UPC database for ${upc}: ${upcImage.imageUrl}`);
        return {
          url: upcImage.imageUrl,
          altText: `Product image for UPC ${upc}`,
          size: 'large',
          isValid: true
        };
      }

      // Fallback to Amazon if UPC databases don't have the image
      this.logger.warn(`No image found in UPC databases, trying Amazon for UPC: ${upc}`);
      return await this.fetchImageFromAmazonByUPC(upc);
      
    } catch (error) {
      this.logger.warn(`Failed to fetch image for UPC ${upc}:`, error as any);
      return null;
    }
  }

  /**
   * Fetches image from dedicated UPC databases
   * @param upc - The UPC code
   * @returns Promise containing image data or null
   */
  private async fetchImageFromUPCDatabases(upc: string): Promise<{imageUrl: string} | null> {
    try {
      // Try upcdatabase.org first (more reliable than UPCitemdb.com)
      const upcDbResult = await this.fetchFromUPCDatabaseOrg(upc);
      if (upcDbResult) {
        return upcDbResult;
      }

      // Try UPCitemdb.com as fallback
      const upcItemDbResult = await this.fetchFromUPCItemDb(upc);
      if (upcItemDbResult) {
        return upcItemDbResult;
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to fetch from UPC databases for ${upc}:`, error as any);
      return null;
    }
  }

  /**
   * Fetches image from UPCitemdb.com
   * @param upc - The UPC code
   * @returns Promise containing image data or null
   */
  private async fetchFromUPCItemDb(upc: string): Promise<{imageUrl: string} | null> {
    try {
      this.logger.info(`Checking UPCitemdb.com for UPC: ${upc}`);
      
      const searchUrl = `https://upcitemdb.com/search/?q=${encodeURIComponent(upc)}`;
      
      const response = await axios.get(searchUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const $ = require('cheerio').load(response.data);
      
      // Look for product links in search results
      const productLink = $('a[href*="/upc/"]').first().attr('href');
      if (productLink) {
        const productUrl = `https://upcitemdb.com${productLink}`;
        return await this.extractImageFromUPCItemDbProductPage(productUrl);
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to fetch from UPCitemdb.com for ${upc}:`, error as any);
      return null;
    }
  }

  /**
   * Extracts image from UPCitemdb.com product page
   * @param url - UPCitemdb.com product page URL
   * @returns Promise containing image data or null
   */
  private async extractImageFromUPCItemDbProductPage(url: string): Promise<{imageUrl: string} | null> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const $ = require('cheerio').load(response.data);
      
      // Look for product image
      const imageSelectors = [
        'img[src*="upcitemdb.com"]',
        '.product-image img',
        '.item-image img',
        'img[alt*="product"]',
        'img[src*="images/"]'
      ];

      for (const selector of imageSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const imageUrl = element.attr('src') || element.attr('data-src');
          if (imageUrl && this.isValidImageUrl(imageUrl)) {
            const finalUrl = this.ensureHttps(imageUrl);
            
            // Validate the image
            if (await this.isAppropriateImage(finalUrl)) {
              this.logger.info(`Found valid image from UPCitemdb: ${finalUrl}`);
              return { imageUrl: finalUrl };
            }
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to extract image from UPCitemdb product page: ${url}`, error as any);
      return null;
    }
  }

  /**
   * Fetches image from upcdatabase.org
   * @param upc - The UPC code
   * @returns Promise containing image data or null
   */
  private async fetchFromUPCDatabaseOrg(upc: string): Promise<{imageUrl: string} | null> {
    try {
      this.logger.info(`Checking upcdatabase.org for UPC: ${upc}`);
      
      const searchUrl = `https://www.upcdatabase.com/item/${upc}`;
      
      const response = await axios.get(searchUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const $ = require('cheerio').load(response.data);
      
      // Look for product image
      const imageSelectors = [
        'img[src*="upcdatabase.com"]',
        '.product-image img',
        '.item-image img',
        'img[src*="thumbnail"]',
        'img[alt*="product"]'
      ];

      for (const selector of imageSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const imageUrl = element.attr('src') || element.attr('data-src');
          if (imageUrl && this.isValidImageUrl(imageUrl)) {
            const finalUrl = this.ensureHttps(imageUrl);
            
            // Validate the image
            if (await this.isAppropriateImage(finalUrl)) {
              this.logger.info(`Found valid image from upcdatabase.org: ${finalUrl}`);
              return { imageUrl: finalUrl };
            }
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to fetch from upcdatabase.org for ${upc}:`, error as any);
      return null;
    }
  }

  /**
   * Fallback to Amazon scraping if UPC databases fail
   * @param upc - The UPC code
   * @returns Promise containing image data or null
   */
  private async fetchImageFromAmazonByUPC(upc: string): Promise<ImageData | null> {
    try {
      this.logger.info(`Trying Amazon as fallback for UPC: ${upc}`);
      
      // Search Amazon for the UPC
      const searchUrl = `${this.amazonSearchUrl}?k=${upc}&i=aps`;
      
      // Check if Amazon is blocking scraping
      const isSearchBlocked = await this.checkAmazonBlocking(searchUrl);
      if (isSearchBlocked) {
        this.logger.warn(`Amazon is blocking search requests for UPC: ${upc}`);
        const placeholderUrl = this.generateProfessionalPlaceholder(`UPC ${upc}`, []);
        return {
          url: placeholderUrl,
          altText: `Product image for UPC ${upc}`,
          size: 'large',
          isValid: true
        };
      }

      const response = await axios.get(searchUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0'
        }
      });

      // Check if search results indicate blocking
      if (this.isAmazonBlockingResponse(response.data)) {
        this.logger.warn(`Amazon returned blocking page for UPC search: ${upc}`);
        const placeholderUrl = this.generateProfessionalPlaceholder(`UPC ${upc}`, []);
        return {
          url: placeholderUrl,
          altText: `Product image for UPC ${upc}`,
          size: 'large',
          isValid: true
        };
      }

      // Extract Amazon product page URLs from search results
      const $ = require('cheerio').load(response.data);
      const productLinks: string[] = [];
      
      $('a.s-result-item').each((_: number, element: any) => {
        const href = $(element).attr('href');
        if (href && href.includes('/dp/')) {
          const cleanUrl = href.split('?')[0];
          if (!productLinks.includes(cleanUrl)) {
            productLinks.push(cleanUrl);
          }
        }
      });

      // Try to get images from the first few product pages with validation
      for (const productUrl of productLinks.slice(0, 3)) {
        const result = await this.extractImageFromAmazonPage(productUrl, upc);
        if (result) {
          this.logger.info(`Found verified Amazon image for UPC ${upc}: ${result.imageUrl}`);
          return {
            url: result.imageUrl,
            altText: `Product image for UPC ${upc}`,
            size: 'large',
            isValid: true
          };
        }
      }

      // If no appropriate Amazon image found, generate a professional placeholder
      this.logger.warn(`No appropriate Amazon image found for UPC ${upc}, using placeholder`);
      const placeholderUrl = this.generateProfessionalPlaceholder(`UPC ${upc}`, []);
      
      return {
        url: placeholderUrl,
        altText: `Product image for UPC ${upc}`,
        size: 'large',
        isValid: true
      };
    } catch (error) {
      this.logger.warn(`Failed to fetch image from Amazon for UPC ${upc}:`, error as any);
      return null;
    }
  }

  /**
   * Extracts image URL from Amazon product page with validation
   * @param url - Amazon product page URL
   * @param upc - Optional UPC code for validation
   * @returns Promise containing image URL or null
   */
  private async extractImageFromAmazonPage(url: string, upc?: string): Promise<{imageUrl: string} | null> {
    try {
      // Check if Amazon is blocking scraping by looking for anti-bot measures
      const isBlocked = await this.checkAmazonBlocking(url);
      if (isBlocked) {
        this.logger.warn(`Amazon is blocking scraping attempts for URL: ${url}`);
        return null;
      }

      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0'
        }
      });

      // Check if response indicates blocking
      if (this.isAmazonBlockingResponse(response.data)) {
        this.logger.warn(`Amazon returned blocking page for URL: ${url}`);
        return null;
      }

      const $ = require('cheerio').load(response.data);
      
      // Extract product details for validation
      const productTitle = this.extractProductTitle($);
      const productUPC = this.extractProductUPC($, productTitle || undefined);
      
      // Validate that this is the correct product (if UPC is provided)
      if (upc && productUPC && productUPC !== upc) {
        this.logger.warn(`Product UPC mismatch: expected ${upc}, found ${productUPC}`);
        return null;
      }
      
      // Try multiple selectors for product images
      const imageSelectors = [
        '#landingImage',
        '#imgBlkFront',
        'img[src*="images/I/"]',
        'img[alt*="Product"]',
        '.a-dynamic-image',
        'img[role="img"]'
      ];

      for (const selector of imageSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const imageUrl = element.attr('src') || element.attr('data-old-hires') || element.attr('data-src');
          if (imageUrl && this.amazonImageUrlPattern.test(imageUrl)) {
            // Convert to high resolution
            const highResUrl = imageUrl
              .replace(/_SL[0-9]+_/g, '_SL1500_')
              .replace(/\.jpg(_[0-9]+)?(\?.*)?$/, '.jpg');
            
            const finalUrl = this.ensureHttps(highResUrl);
            
            // Additional check for anti-bot images
            if (this.isAntiBotImage(finalUrl)) {
              this.logger.warn(`Detected anti-bot image: ${finalUrl}`);
              return null;
            }
            
            // Validate the image URL to ensure it's appropriate
            if (await this.isAppropriateImage(finalUrl)) {
              this.logger.info(`Validated image from product: ${productTitle || 'Unknown'}`);
              return { imageUrl: finalUrl };
            } else {
              this.logger.warn(`Inappropriate image detected and filtered out: ${finalUrl}`);
              return null;
            }
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to extract image from ${url}:`, error as any);
      return null;
    }
  }

  /**
   * Fetches image using product title by searching Amazon
   * @param title - The product title
   * @returns Promise containing image data or null
   */
  private async fetchImageByTitle(title: string): Promise<ImageData | null> {
    try {
      // Extract keywords from title for better search
      const keywords = this.extractKeywords(title);
      
      // Try to find a UPC from the title (common patterns)
      const upcMatch = title.match(/\b\d{12,13}\b/);
      if (upcMatch) {
        return await this.fetchImageByUPC(upcMatch[0]);
      }

      // Search Amazon using product keywords
      this.logger.info(`Searching Amazon for title: ${title}`);
      const searchQuery = keywords.join(' ');
      const searchUrl = `${this.amazonSearchUrl}?k=${encodeURIComponent(searchQuery)}&i=aps`;
      
      // Check if Amazon is blocking scraping
      const isSearchBlocked = await this.checkAmazonBlocking(searchUrl);
      if (isSearchBlocked) {
        this.logger.warn(`Amazon is blocking search requests for title: ${title}`);
        return {
          url: this.generateProfessionalPlaceholder(title, keywords),
          altText: title,
          size: 'large',
          isValid: true
        };
      }
      
      const response = await axios.get(searchUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0'
        }
      });

      // Check if search results indicate blocking
      if (this.isAmazonBlockingResponse(response.data)) {
        this.logger.warn(`Amazon returned blocking page for title search: ${title}`);
        return {
          url: this.generateProfessionalPlaceholder(title, keywords),
          altText: title,
          size: 'large',
          isValid: true
        };
      }

      const $ = require('cheerio').load(response.data);
      
      // Get the first product link
      const firstProductLink = $('a.s-result-item').first().attr('href');
      if (firstProductLink && firstProductLink.includes('/dp/')) {
        const cleanUrl = firstProductLink.split('?')[0];
        const result = await this.extractImageFromAmazonPage(cleanUrl);
        
        if (result) {
          this.logger.info(`Found Amazon image for title "${title}": ${result.imageUrl}`);
          return {
            url: result.imageUrl,
            altText: title,
            size: 'large',
            isValid: true
          };
        }
      }

      // If no Amazon image found, create a professional placeholder
      const placeholderUrl = this.generateProfessionalPlaceholder(title, keywords);
      
      return {
        url: placeholderUrl,
        altText: title,
        size: 'large',
        isValid: true
      };
    } catch (error) {
      this.logger.warn(`Failed to fetch image for title "${title}":`, error as Error);
      return null;
    }
  }

  /**
   * Checks if Amazon is blocking scraping requests
   * @param url - URL to check
   * @returns Promise resolving to true if blocking is detected
   */
  private async checkAmazonBlocking(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      // Check for common blocking indicators
      const blockingStatusCodes = [403, 429, 503];
      if (blockingStatusCodes.includes(response.status)) {
        return true;
      }

      return false;
    } catch (error) {
      // If we can't check, assume it might be blocked
      return true;
    }
  }

  /**
   * Checks if Amazon response indicates blocking
   * @param html - HTML response to check
   * @returns True if blocking is detected
   */
  private isAmazonBlockingResponse(html: string): boolean {
    const blockingIndicators = [
      'captcha',
      'robot',
      'automation',
      'bot detection',
      'access denied',
      'unusual activity',
      'security verification',
      'human verification',
      'i am not a robot',
      'eiffel tower', // Common anti-bot image
      'cloudflare',
      'ddos protection'
    ];

    const lowerHtml = html.toLowerCase();
    return blockingIndicators.some(indicator => lowerHtml.includes(indicator));
  }

  /**
   * Checks if an image is likely an anti-bot placeholder
   * @param url - Image URL to check
   * @returns True if likely an anti-bot image
   */
  private isAntiBotImage(url: string): boolean {
    const antiBotPatterns = [
      /eiffel.*tower/i,
      /captcha/i,
      /robot/i,
      /cloudflare/i,
      /security/i,
      /verification/i,
      /amazon.*bot/i,
      /access.*denied/i
    ];

    return antiBotPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Extracts product title from Amazon page for validation
   * @param $ - Cheerio instance loaded with Amazon page
   * @returns Product title or null
   */
  private extractProductTitle($: any): string | null {
    const titleSelectors = [
      '#productTitle',
      '#title',
      'h1#title',
      'span#productTitle',
      '.a-size-large.a-spacing-none'
    ];

    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const title = element.text().trim();
        if (title && title.length > 5) {
          return title;
        }
      }
    }

    return null;
  }

  /**
   * Extracts UPC from Amazon page for validation
   * @param $ - Cheerio instance loaded with Amazon page
   * @param title - Product title to search for UPC
   * @returns UPC code or null
   */
  private extractProductUPC($: any, title?: string | null): string | null {
    // Try to find UPC in product details
    const upcSelectors = [
      'th:contains("UPC") + td',
      'th:contains("UPC Code") + td',
      'th:contains("Barcode") + td',
      '.a-unordered-list.a-nostyle.a-vertical.a-spacing-none li:contains("UPC")',
      '.a-unordered-list.a-nostyle.a-vertical.a-spacing-none li:contains("Barcode")'
    ];

    for (const selector of upcSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        const upcMatch = text.match(/\b\d{12,13}\b/);
        if (upcMatch) {
          return upcMatch[0];
        }
      }
    }

    // Try to find UPC in title
    if (title) {
      const upcMatch = title.match(/\b\d{12,13}\b/);
      if (upcMatch) {
        return upcMatch[0];
      }
    }

    return null;
  }

  /**
   * Extracts relevant keywords from product title
   * @param title - The product title
   * @returns Array of keywords
   */
  private extractKeywords(title: string): string[] {
    // Remove common words and extract meaningful keywords
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an'];
    
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !commonWords.includes(word) &&
        !/^\d+$/.test(word)
      )
      .slice(0, 5); // Limit to top 5 keywords
  }

  /**
   * Generates a professional placeholder URL with product information
   * @param title - The product title
   * @param keywords - Relevant keywords
   * @returns Professional placeholder URL
   */
  private generateProfessionalPlaceholder(title: string, keywords: string[]): string {
    // Create a more professional placeholder with better styling
    const text = keywords.length > 0 ? keywords.join(' ') : title.substring(0, 25);
    const encodedText = encodeURIComponent(text);
    
    return `https://picsum.photos/400/300?text=${encodedText}&blur=1&grayscale=0.2`;
  }

  /**
   * Generates a placeholder URL with product information
   * @param title - The product title
   * @param keywords - Relevant keywords
   * @returns Placeholder URL
   */
  private generatePlaceholderUrl(title: string, keywords: string[]): string {
    // Create a simple text-based placeholder image
    const text = keywords.length > 0 ? keywords.join(' ') : title.substring(0, 30);
    const encodedText = encodeURIComponent(text);
    
    return `https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=${encodedText}`;
  }

  /**
   * Ensures URL uses HTTPS protocol
   * @param url - The URL to secure
   * @returns HTTPS URL
   */
  private ensureHttps(url: string): string {
    if (!url) return '';
    
    // Remove any existing protocol
    const cleanUrl = url.replace(/^https?:\/\//, '');
    
    // Force HTTPS
    return `https://${cleanUrl}`;
  }

  /**
   * Validates if a URL is a valid image URL
   * @param url - The URL to validate
   * @returns True if valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    if (!url || url.length < 10) return false;
    
    // Check for common image extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i;
    
    // Check for common image hosts
    const imageHosts = [
      /images\.amazon\.com/,
      /ecx\.amazon\.com/,
      /images-na\.ssl-images-amazon\.com/,
      /i\.ebayimg\.com/,
      /ebayimg\.com/,
      /upcitemdb\.com/,
      /upcdatabase\.org/
    ];

    return imageExtensions.test(url) || imageHosts.some(host => host.test(url));
  }

  /**
   * Checks if an image URL is appropriate (not inappropriate/dead body/etc.)
   * @param url - The image URL to validate
   * @returns Promise resolving to true if image is appropriate
   */
  private async isAppropriateImage(url: string): Promise<boolean> {
    try {
      // First check URL for obvious red flags
      const inappropriatePatterns = [
        /dead.*body|corpse|cadaver|remains/,
        /drowning|drowned|underwater.*body/,
        /accident.*scene|crime.*scene/,
        /autopsy|mortuary|funeral/,
        /blood|gore|violence/,
        /trauma|injury|wound/,
        /emergency|paramedic|ambulance/,
        /hospital.*bed|patient|surgery/,
        /death|died|deceased/,
        /murder|homicide|suicide/,
        /tragedy|disaster|accident/,
        /war.*zone|battlefield/,
        /refugee|crisis|emergency/
      ];

      for (const pattern of inappropriatePatterns) {
        if (pattern.test(url.toLowerCase())) {
          this.logger.warn(`Image URL contains inappropriate content: ${url}`);
          return false;
        }
      }

      // Make a HEAD request to check the image
      const response = await axios.head(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Check if response is valid
      if (response.status !== 200 || !response.headers['content-type']?.startsWith('image/')) {
        return false;
      }

      // Additional validation: check image dimensions if possible
      try {
        const imageResponse = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        // Basic validation - if we can get the image data, it's likely appropriate
        // This is a simple check - more sophisticated content analysis could be added
        if (imageResponse.data && imageResponse.data.length > 0) {
          return true;
        }
      } catch (error) {
        // If we can't validate the image content, be conservative and reject
        this.logger.warn(`Could not validate image content: ${url}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.warn(`Error validating image appropriateness: ${url}`, error as Error);
      return false;
    }
  }

  /**
   * Clears the internal cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const stockImageService = new StockImageService();
