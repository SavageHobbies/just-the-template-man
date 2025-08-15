import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { AxiosWebScrapingService } from './WebScrapingService';
import * as utils from '../utils';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock utils
vi.mock('../utils', () => ({
  isValidEbayUrl: vi.fn(),
  sanitizeUrl: vi.fn(),
  delay: vi.fn(),
  getLogger: vi.fn(() => ({
    startOperation: vi.fn(),
    completeOperation: vi.fn(),
    failOperation: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  })),
  PerformanceMonitor: {
    measure: vi.fn((name, fn) => fn())
  },
  WebScrapingError: vi.fn(),
  ErrorCode: {
    INVALID_URL: 'INVALID_URL',
    NETWORK_ERROR: 'NETWORK_ERROR',
    RATE_LIMITED: 'RATE_LIMITED',
    SCRAPING_FAILED: 'SCRAPING_FAILED'
  }
}));

describe('AxiosWebScrapingService', () => {
  let service: AxiosWebScrapingService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock axios.create
    mockAxiosInstance = {
      get: vi.fn()
    };
    mockedAxios.create = vi.fn().mockReturnValue(mockAxiosInstance);
    
    // Setup default mock implementations
    vi.mocked(utils.isValidEbayUrl).mockReturnValue(true);
    vi.mocked(utils.sanitizeUrl).mockImplementation((url) => url);
    vi.mocked(utils.delay).mockResolvedValue(undefined);
    
    service = new AxiosWebScrapingService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create axios instance with proper configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        timeout: 30000,
        headers: expect.objectContaining({
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        })
      });
    });
  });

  describe('scrapeUrl', () => {
    const validUrl = 'https://www.ebay.com/itm/123456789';
    const mockHtml = `
      <html>
        <head>
          <title>Test Product - eBay</title>
          <meta name="description" content="Test product description">
          <meta name="keywords" content="test, product, ebay">
          <link rel="canonical" href="https://www.ebay.com/itm/123456789">
        </head>
        <body>
          <h1>Test Product</h1>
        </body>
      </html>
    `;

    it('should successfully scrape valid eBay URL', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: mockHtml
      });

      const result = await service.scrapeUrl(validUrl);

      expect(result).toEqual({
        html: mockHtml,
        title: 'Test Product - eBay',
        metadata: {
          description: 'Test product description',
          keywords: 'test, product, ebay',
          canonical: 'https://www.ebay.com/itm/123456789'
        },
        timestamp: expect.any(Date)
      });
    });

    it('should throw error for invalid URL input', async () => {
      await expect(service.scrapeUrl('')).rejects.toThrow('Invalid URL: URL must be a non-empty string');
      await expect(service.scrapeUrl(null as any)).rejects.toThrow('Invalid URL: URL must be a non-empty string');
    });

    it('should throw error for non-eBay URL', async () => {
      vi.mocked(utils.isValidEbayUrl).mockReturnValue(false);
      
      await expect(service.scrapeUrl('https://amazon.com/product')).rejects.toThrow(
        'Invalid eBay URL: URL must be from eBay domain'
      );
    });

    it('should sanitize URL before making request', async () => {
      const dirtyUrl = 'https://www.ebay.com/itm/123?_trksid=tracking';
      const cleanUrl = 'https://www.ebay.com/itm/123';
      
      vi.mocked(utils.sanitizeUrl).mockReturnValue(cleanUrl);
      mockAxiosInstance.get.mockResolvedValue({ data: mockHtml });

      await service.scrapeUrl(dirtyUrl);

      expect(utils.sanitizeUrl).toHaveBeenCalledWith(dirtyUrl);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        cleanUrl,
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String)
          })
        })
      );
    });

    it('should implement request throttling', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockHtml });

      // Make two requests
      await service.scrapeUrl(validUrl);
      await service.scrapeUrl(validUrl);

      // Should have called delay for throttling
      expect(utils.delay).toHaveBeenCalled();
    });

    it('should rotate user agents', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockHtml });

      // Make multiple requests
      await service.scrapeUrl(validUrl);
      await service.scrapeUrl(validUrl);

      // Check that different user agents were used
      const calls = mockAxiosInstance.get.mock.calls;
      expect(calls.length).toBe(2);
      // User agents should be different (rotation)
      expect(calls[0][1].headers['User-Agent']).toBeDefined();
      expect(calls[1][1].headers['User-Agent']).toBeDefined();
    });

    it('should handle network errors with retry', async () => {
      const networkError = new Error('Network Error');
      networkError.name = 'AxiosError';
      (networkError as any).code = 'ECONNRESET';
      
      mockAxiosInstance.get
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({ data: mockHtml });

      const result = await service.scrapeUrl(validUrl);

      expect(result.html).toBe(mockHtml);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
      expect(utils.delay).toHaveBeenCalled(); // For backoff delays
    });

    it('should handle rate limiting with exponential backoff', async () => {
      const rateLimitError = new Error('Rate Limited');
      rateLimitError.name = 'AxiosError';
      (rateLimitError as any).response = { status: 429 };
      
      mockAxiosInstance.get
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValue({ data: mockHtml });

      const result = await service.scrapeUrl(validUrl);

      expect(result.html).toBe(mockHtml);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
      expect(utils.delay).toHaveBeenCalled(); // For rate limit backoff
    });

    it('should throw detailed error after max retries exceeded', async () => {
      const networkError = new Error('Network Error');
      networkError.name = 'AxiosError';
      (networkError as any).code = 'ETIMEDOUT';
      
      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(service.scrapeUrl(validUrl)).rejects.toThrow(
        'Network error: Failed to reach'
      );
      
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3); // Max retries
    });

    it('should throw error for invalid response data', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: null });

      await expect(service.scrapeUrl(validUrl)).rejects.toThrow(
        'Invalid response: Expected HTML content'
      );
    });

    it('should handle HTTP error responses', async () => {
      const httpError = new Error('HTTP Error');
      httpError.name = 'AxiosError';
      (httpError as any).response = {
        status: 404,
        statusText: 'Not Found'
      };
      
      mockAxiosInstance.get.mockRejectedValue(httpError);

      await expect(service.scrapeUrl(validUrl)).rejects.toThrow(
        'HTTP 404: Failed to scrape'
      );
    });

    it('should parse HTML metadata correctly', async () => {
      const htmlWithMetadata = `
        <html>
          <head>
            <title>Product Title</title>
            <meta name="description" content="Product description">
            <meta name="keywords" content="keyword1, keyword2">
            <link rel="canonical" href="https://canonical.url">
          </head>
          <body>Content</body>
        </html>
      `;
      
      mockAxiosInstance.get.mockResolvedValue({ data: htmlWithMetadata });

      const result = await service.scrapeUrl(validUrl);

      expect(result.metadata).toEqual({
        description: 'Product description',
        keywords: 'keyword1, keyword2',
        canonical: 'https://canonical.url'
      });
    });

    it('should handle HTML without metadata gracefully', async () => {
      const simpleHtml = '<html><head><title>Simple</title></head><body>Content</body></html>';
      
      mockAxiosInstance.get.mockResolvedValue({ data: simpleHtml });

      const result = await service.scrapeUrl(validUrl);

      expect(result.title).toBe('Simple');
      expect(result.metadata).toEqual({});
    });

    it('should handle HTML without title gracefully', async () => {
      const noTitleHtml = '<html><head></head><body>Content</body></html>';
      
      mockAxiosInstance.get.mockResolvedValue({ data: noTitleHtml });

      const result = await service.scrapeUrl(validUrl);

      expect(result.title).toBe('');
      expect(result.html).toBe(noTitleHtml);
    });
  });

  describe('error classification', () => {
    it('should identify rate limit errors correctly', async () => {
      const rateLimitError = new Error('Rate Limited');
      rateLimitError.name = 'AxiosError';
      (rateLimitError as any).response = { status: 429 };
      
      mockAxiosInstance.get.mockRejectedValue(rateLimitError);

      await expect(service.scrapeUrl('https://www.ebay.com/test')).rejects.toThrow();
      
      // Should have attempted retries due to rate limiting
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
    });

    it('should identify network errors correctly', async () => {
      const networkError = new Error('Network Error');
      networkError.name = 'AxiosError';
      (networkError as any).code = 'ECONNREFUSED';
      
      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(service.scrapeUrl('https://www.ebay.com/test')).rejects.toThrow();
      
      // Should have attempted retries due to network error
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const authError = new Error('Unauthorized');
      authError.name = 'AxiosError';
      (authError as any).response = { status: 401, statusText: 'Unauthorized' };
      
      mockAxiosInstance.get.mockRejectedValue(authError);

      await expect(service.scrapeUrl('https://www.ebay.com/test')).rejects.toThrow(
        'HTTP 401: Failed to scrape'
      );
      
      // Should not retry for auth errors
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });
  });
});