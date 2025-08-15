import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { WebScrapingService } from './interfaces';
import { WebpageContent } from '../models';
import { 
  isValidEbayUrl, 
  sanitizeUrl, 
  delay,
  WebScrapingError,
  ErrorCode,
  getLogger,
  PerformanceMonitor
} from '../utils';
import { webContentCache } from '../utils/cache';
import { ebayRateLimiter } from '../utils/rate-limiter';
import { performanceMonitor, monitor } from '../utils/performance-monitor';

/**
 * Concrete implementation of WebScrapingService using axios
 * Includes request throttling, user-agent rotation, and comprehensive error handling
 */
export class AxiosWebScrapingService implements WebScrapingService {
  private axiosInstance: AxiosInstance;
  private userAgents: string[];
  private currentUserAgentIndex: number = 0;
  private lastRequestTime: number = 0;
  private readonly throttleDelay: number = 1000; // 1 second between requests
  private readonly maxRetries: number = 3;
  private readonly timeout: number = 30000; // 30 seconds
  private readonly logger = getLogger();

  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      }
    });
  }

  /**
   * Scrapes content from a given URL with caching, throttling and error handling
   * @param url - The URL to scrape
   * @returns Promise containing the scraped webpage content
   * @throws Error if URL is invalid, network fails, or content cannot be retrieved
   */
  async scrapeUrl(url: string): Promise<WebpageContent> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL: URL must be a non-empty string');
    }

    if (!isValidEbayUrl(url)) {
      throw new Error('Invalid eBay URL: URL must be from eBay domain');
    }

    const sanitizedUrl = sanitizeUrl(url);
    
    // Check cache first
    const cached = await webContentCache.get(sanitizedUrl);
    if (cached) {
      this.logger.info(`Cache hit for URL: ${sanitizedUrl}`);
      return cached;
    }
    
    // Use rate limiter instead of manual throttling
    await ebayRateLimiter.waitForSlot();

    let lastError: Error | null = null;
    
    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(sanitizedUrl);
        
        if (!response.data || typeof response.data !== 'string') {
          throw new Error('Invalid response: Expected HTML content');
        }

        const webpageContent = this.parseWebpageContent(response.data, sanitizedUrl);
        
        // Cache the result
        await webContentCache.set(sanitizedUrl, webpageContent);
        this.logger.info(`Cached content for URL: ${sanitizedUrl}`);
        
        return webpageContent;
        
      } catch (error) {
        lastError = error as Error;
        
        if (this.isRateLimitError(error)) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.warn(`Rate limited on attempt ${attempt}, waiting ${backoffDelay}ms`);
          await delay(backoffDelay);
          continue;
        }
        
        if (this.isNetworkError(error) && attempt < this.maxRetries) {
          const backoffDelay = 1000 * attempt;
          console.warn(`Network error on attempt ${attempt}, retrying in ${backoffDelay}ms`);
          await delay(backoffDelay);
          continue;
        }
        
        // If it's not a retryable error, throw immediately
        if (!this.isRetryableError(error)) {
          throw this.createDetailedError(error as Error, sanitizedUrl);
        }
      }
    }

    // All retries exhausted
    throw this.createDetailedError(lastError!, sanitizedUrl);
  }

  /**
   * Makes the actual HTTP request with rotating user agents
   */
  private async makeRequest(url: string) {
    const config: AxiosRequestConfig = {
      headers: {
        'User-Agent': this.getNextUserAgent()
      }
    };

    return await this.axiosInstance.get(url, config);
  }

  /**
   * Implements request throttling to be respectful to servers
   */
  private async throttleRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.throttleDelay) {
      const waitTime = this.throttleDelay - timeSinceLastRequest;
      await delay(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Rotates through available user agents
   */
  private getNextUserAgent(): string {
    const userAgent = this.userAgents[this.currentUserAgentIndex];
    this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.userAgents.length;
    return userAgent;
  }

  /**
   * Parses raw HTML response into structured WebpageContent
   */
  private parseWebpageContent(html: string, url: string): WebpageContent {
    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract basic metadata
    const metadata: Record<string, string> = {};
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (descMatch) {
      metadata.description = descMatch[1];
    }

    // Extract meta keywords
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (keywordsMatch) {
      metadata.keywords = keywordsMatch[1];
    }

    // Extract canonical URL
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
    if (canonicalMatch) {
      metadata.canonical = canonicalMatch[1];
    }

    return {
      html,
      title,
      metadata,
      timestamp: new Date()
    };
  }

  /**
   * Determines if an error is due to rate limiting
   */
  private isRateLimitError(error: any): boolean {
    if (axios.isAxiosError(error) || error.name === 'AxiosError') {
      return error.response?.status === 429 || 
             error.response?.status === 503 ||
             error.message.toLowerCase().includes('rate limit');
    }
    return false;
  }

  /**
   * Determines if an error is a network-related error that might be temporary
   */
  private isNetworkError(error: any): boolean {
    if (axios.isAxiosError(error) || error.name === 'AxiosError') {
      return error.code === 'ECONNRESET' ||
             error.code === 'ECONNREFUSED' ||
             error.code === 'ETIMEDOUT' ||
             error.code === 'ENOTFOUND' ||
             error.message.toLowerCase().includes('network') ||
             error.message.toLowerCase().includes('timeout');
    }
    return false;
  }

  /**
   * Determines if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    return this.isRateLimitError(error) || this.isNetworkError(error);
  }

  /**
   * Creates a detailed error message with context
   */
  private createDetailedError(error: Error, url: string): WebScrapingError {
    if (axios.isAxiosError(error) || error.name === 'AxiosError') {
      if ((error as any).response) {
        const status = (error as any).response.status;
        const statusText = (error as any).response.statusText;
        
        if (status === 429 || status === 503) {
          return new WebScrapingError(
            `Rate limited: ${status} ${statusText}`,
            ErrorCode.RATE_LIMITED,
            true,
            undefined,
            { url, status, statusText, isRetryable: true }
          );
        }
        
        return new WebScrapingError(
          `HTTP ${status}: Failed to scrape ${url}. Server responded with: ${statusText}`,
          ErrorCode.SCRAPING_FAILED,
          false,
          undefined,
          { url, status, statusText }
        );
      } else if ((error as any).request || (error as any).code) {
        return new WebScrapingError(
          `Network error: Failed to reach ${url}. Please check your internet connection and try again.`,
          ErrorCode.NETWORK_ERROR,
          true,
          undefined,
          { url, code: (error as any).code, isNetworkError: true }
        );
      }
    }
    
    return new WebScrapingError(
      `Scraping failed for ${url}: ${error.message}`,
      ErrorCode.SCRAPING_FAILED,
      false,
      undefined,
      { url, originalError: error.message }
    );
  }
}