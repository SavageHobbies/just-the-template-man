import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ImageService } from './ImageService';
import { promises as fs } from 'fs';
import path from 'path';

// Mock https module
vi.mock('https');
const https = await import('https');
const { get: httpsGet } = https;

describe('ImageService', () => {
  let imageService: ImageService;
  let mockFs: any;
  let mockHttps: any;
  let tempDir: string;

  beforeEach(() => {
    imageService = new ImageService();
    tempDir = path.join(__dirname, 'temp-test-images');
    
    // Mock fs operations
    mockFs = {
      mkdir: vi.fn(),
      access: vi.fn(),
      stat: vi.fn(),
      unlink: vi.fn(),
      createWriteStream: vi.fn().mockReturnThis(),
    };
    
    vi.spyOn(fs, 'mkdir').mockImplementation(mockFs.mkdir);
    vi.spyOn(fs, 'access').mockImplementation(mockFs.access);
    vi.spyOn(fs, 'stat').mockImplementation(mockFs.stat);
    vi.spyOn(fs, 'unlink').mockImplementation(mockFs.unlink);
    
    // Mock https
    mockHttps = {
      get: vi.fn(),
    };
    vi.mocked(httpsGet).mockImplementation(mockHttps.get);
    
    // Mock write stream
    const mockStream = {
      pipe: vi.fn(),
      on: vi.fn().mockReturnThis(),
      close: vi.fn(),
    };
    vi.mocked(fs.createWriteStream).mockReturnValue(mockStream);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor and Basic Functionality', () => {
    it('should create ImageService instance', () => {
      expect(imageService).toBeDefined();
      expect(imageService).toBeInstanceOf(ImageService);
    });

    it('should have downloadImage method', () => {
      expect(typeof imageService.downloadImage).toBe('function');
    });

    it('should have downloadImages method', () => {
      expect(typeof imageService.downloadImages).toBe('function');
    });

    it('should have isValidImageUrl method', () => {
      expect(typeof imageService.isValidImageUrl).toBe('function');
    });
  });

  describe('URL Validation', () => {
    it('should validate correct image URLs', () => {
      const validUrls = [
        'https://example.com/image.jpg',
        'https://example.com/image.jpeg',
        'https://example.com/image.png',
        'https://example.com/image.webp',
        'http://example.com/image.jpg',
        'https://example.com/path/to/image.jpg?query=param',
      ];

      validUrls.forEach(url => {
        expect(imageService.isValidImageUrl(url)).toBe(true);
      });
    });

    it('should reject invalid image URLs', () => {
      const invalidUrls = [
        'https://example.com/image.gif', // Unsupported format
        'https://example.com/image', // No extension
        'https://example.com/image.txt', // Wrong format
        'ftp://example.com/image.jpg', // Wrong protocol
        'not-a-url',
        '',
      ];

      invalidUrls.forEach(url => {
        expect(imageService.isValidImageUrl(url)).toBe(false);
      });
    });

    it('should handle malformed URLs gracefully', () => {
      expect(imageService.isValidImageUrl('not-a-valid-url')).toBe(false);
      expect(imageService.isValidImageUrl('')).toBe(false);
      expect(imageService.isValidImageUrl(null as any)).toBe(false);
      expect(imageService.isValidImageUrl(undefined as any)).toBe(false);
    });
  });

  describe('Image Download', () => {
    it('should download image successfully', async () => {
      const imageUrl = 'https://example.com/test.jpg';
      const destinationPath = path.join(tempDir, 'test.jpg');
      
      // Mock successful file operations
      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ size: 1024 });
      
      // Mock successful HTTP response
      const mockResponse = {
        statusCode: 200,
        pipe: vi.fn(),
      };
      mockHttps.get.mockImplementation((url: string, callback: (response: any) => void) => {
        callback(mockResponse);
        return {} as any;
      });

      await imageService.downloadImage(imageUrl, destinationPath);

      expect(mockFs.mkdir).toHaveBeenCalledWith(path.dirname(destinationPath), { recursive: true });
      expect(mockFs.access).toHaveBeenCalledWith(destinationPath);
      expect(mockFs.stat).toHaveBeenCalledWith(destinationPath);
      expect(mockHttps.get).toHaveBeenCalledWith(imageUrl, expect.any(Function));
    });

    it('should throw error for invalid image URL', async () => {
      const invalidUrl = 'https://example.com/image.gif';
      const destinationPath = path.join(tempDir, 'test.jpg');

      await expect(imageService.downloadImage(invalidUrl, destinationPath))
        .rejects.toThrow('Invalid image URL');
    });

    it('should handle HTTP errors', async () => {
      const imageUrl = 'https://example.com/test.jpg';
      const destinationPath = path.join(tempDir, 'test.jpg');
      
      // Mock successful file operations
      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ size: 1024 });
      
      // Mock HTTP error response
      const mockResponse = {
        statusCode: 404,
      };
      mockHttps.get.mockImplementation((url: string, callback: (response: any) => void) => {
        callback(mockResponse);
        return {} as any;
      });

      await expect(imageService.downloadImage(imageUrl, destinationPath))
        .rejects.toThrow('HTTP 404');
    });

    it('should handle file size validation', async () => {
      const imageUrl = 'https://example.com/test.jpg';
      const destinationPath = path.join(tempDir, 'test.jpg');
      
      // Mock file too large
      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ size: 11 * 1024 * 1024 }); // 11MB > 10MB limit
      
      // Mock successful HTTP response
      const mockResponse = {
        statusCode: 200,
        pipe: vi.fn(),
      };
      mockHttps.get.mockImplementation((url: string, callback: (response: any) => void) => {
        callback(mockResponse);
        return {} as any;
      });

      await expect(imageService.downloadImage(imageUrl, destinationPath))
        .rejects.toThrow('Image file too large');
    });

    it('should handle empty files', async () => {
      const imageUrl = 'https://example.com/test.jpg';
      const destinationPath = path.join(tempDir, 'test.jpg');
      
      // Mock empty file
      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ size: 0 });
      
      // Mock successful HTTP response
      const mockResponse = {
        statusCode: 200,
        pipe: vi.fn(),
      };
      mockHttps.get.mockImplementation((url: string, callback: (response: any) => void) => {
        callback(mockResponse);
        return {} as any;
      });

      await expect(imageService.downloadImage(imageUrl, destinationPath))
        .rejects.toThrow('Image file is empty');
    });
  });

  describe('Multiple Image Downloads', () => {
    it('should download multiple images successfully', async () => {
      const imageUrls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];
      
      // Mock successful operations
      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ size: 1024 });
      
      const mockResponse = {
        statusCode: 200,
        pipe: vi.fn(),
      };
      mockHttps.get.mockImplementation((url: string, callback: (response: any) => void) => {
        callback(mockResponse);
        return {} as any;
      });

      const result = await imageService.downloadImages(imageUrls, tempDir);

      expect(result).toHaveLength(3);
      expect(mockFs.mkdir).toHaveBeenCalledTimes(1);
      expect(mockHttps.get).toHaveBeenCalledTimes(3);
    });

    it('should skip invalid URLs when downloading multiple images', async () => {
      const imageUrls = [
        'https://example.com/image1.jpg', // Valid
        'https://example.com/image.gif', // Invalid
        'https://example.com/image2.jpg', // Valid
      ];
      
      // Mock successful operations for valid URLs
      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ size: 1024 });
      
      const mockResponse = {
        statusCode: 200,
        pipe: vi.fn(),
      };
      mockHttps.get.mockImplementation((url: string, callback: (response: any) => void) => {
        callback(mockResponse);
        return {} as any;
      });

      const result = await imageService.downloadImages(imageUrls, tempDir);

      expect(result).toHaveLength(2); // Only 2 valid images
      expect(mockFs.mkdir).toHaveBeenCalledTimes(1);
      expect(mockHttps.get).toHaveBeenCalledTimes(2); // Only called for valid URLs
    });

    it('should handle download failures gracefully', async () => {
      const imageUrls = [
        'https://example.com/image1.jpg',
        'https://example.com/invalid.jpg', // Will fail
        'https://example.com/image2.jpg',
      ];
      
      // Mock successful operations for first and third URLs
      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ size: 1024 });
      
      mockHttps.get.mockImplementation((url: string, callback: (response: any) => void) => {
        if (url.includes('invalid')) {
          // Simulate failure for invalid URL
          throw new Error('Download failed');
        }
        
        const mockResponse = {
          statusCode: 200,
          pipe: vi.fn(),
        };
        callback(mockResponse);
        return {} as any;
      });

      const result = await imageService.downloadImages(imageUrls, tempDir);

      expect(result).toHaveLength(2); // Should skip the failed download
    });
  });

  describe('Filename Generation', () => {
    it('should generate safe filenames from URLs', () => {
      const testCases = [
        {
          url: 'https://example.com/image.jpg',
          expected: 'image.jpg'
        },
        {
          url: 'https://example.com/path/to/image.jpg',
          expected: 'image.jpg'
        },
        {
          url: 'https://example.com/image.jpg?query=param',
          expected: 'image.jpg'
        },
        {
          url: 'https://example.com/image.jpg#fragment',
          expected: 'image.jpg'
        },
        {
          url: 'https://example.com/image',
          expected: 'image.jpg' // Default extension
        },
        {
          url: 'https://example.com/path with spaces/image.jpg',
          expected: 'path_with_spaces_image.jpg'
        }
      ];

      testCases.forEach(({ url, expected }) => {
        const filename = (imageService as any).generateFileName(url, 0);
        expect(filename).toBe(expected);
      });
    });

    it('should handle duplicate filenames', () => {
      const url = 'https://example.com/image.jpg';
      const filename1 = (imageService as any).generateFileName(url, 0);
      const filename2 = (imageService as any).generateFileName(url, 1);
      
      expect(filename1).toBe('image.jpg');
      expect(filename2).toBe('image_1.jpg');
    });

    it('should handle invalid URLs gracefully', () => {
      const filename = (imageService as any).generateFileName('not-a-url', 0);
      expect(filename).toBe('image_1.jpg');
    });
  });

  describe('Image URL Extraction', () => {
    it('should extract image URLs from HTML', () => {
      const html = `
        <html>
          <body>
            <img src="https://example.com/image1.jpg" alt="Image 1">
            <img src="https://example.com/image2.png" alt="Image 2">
            <img src="https://example.com/image3.webp" alt="Image 3">
            <img src="invalid-url" alt="Invalid">
            <img src="https://example.com/document.pdf" alt="Not an image">
          </body>
        </html>
      `;

      const imageUrls = imageService.extractImageUrlsFromHtml(html);
      
      expect(imageUrls).toHaveLength(3);
      expect(imageUrls).toContain('https://example.com/image1.jpg');
      expect(imageUrls).toContain('https://example.com/image2.png');
      expect(imageUrls).toContain('https://example.com/image3.webp');
    });

    it('should handle empty HTML', () => {
      const imageUrls = imageService.extractImageUrlsFromHtml('');
      expect(imageUrls).toHaveLength(0);
    });

    it('should handle HTML with no images', () => {
      const html = '<html><body><p>No images here</p></body></html>';
      const imageUrls = imageService.extractImageUrlsFromHtml(html);
      expect(imageUrls).toHaveLength(0);
    });
  });

  describe('Image Optimization', () => {
    it('should have optimizeImage method', () => {
      expect(typeof imageService.optimizeImage).toBe('function');
    });

    it('should accept optimization options', async () => {
      const filePath = '/path/to/image.jpg';
      const options = {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 85,
        format: 'jpg' as const
      };

      // Mock console.log to capture output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await imageService.optimizeImage(filePath, options);

      expect(consoleSpy).toHaveBeenCalledWith('📸 Optimizing image: /path/to/image.jpg');
      expect(consoleSpy).toHaveBeenCalledWith('   Max dimensions: 1920x1080');
      expect(consoleSpy).toHaveBeenCalledWith('   Quality: 85%');
      
      consoleSpy.mockRestore();
    });

    it('should use default options when none provided', async () => {
      const filePath = '/path/to/image.jpg';
      
      // Mock console.log to capture output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await imageService.optimizeImage(filePath);

      expect(consoleSpy).toHaveBeenCalledWith('📸 Optimizing image: /path/to/image.jpg');
      expect(consoleSpy).toHaveBeenCalledWith('   Max dimensions: 1920x1080');
      expect(consoleSpy).toHaveBeenCalledWith('   Quality: 85%');
      
      consoleSpy.mockRestore();
    });
  });
});
