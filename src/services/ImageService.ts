import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import https from 'https';

/**
 * Service for handling image operations including downloading and validation
 */
export class ImageService {
  private readonly SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly DOWNLOAD_TIMEOUT = 30000; // 30 seconds

  /**
   * Downloads an image from a URL and saves it as a file
   * @param imageUrl URL of the image to download
   * @param destinationPath Local path to save the image
   * @returns Promise that resolves when download is complete
   */
  async downloadImage(imageUrl: string, destinationPath: string): Promise<void> {
    try {
      // Validate URL
      if (!this.isValidImageUrl(imageUrl)) {
        throw new Error(`Invalid image URL: ${imageUrl}`);
      }

      // Ensure destination directory exists
      const dir = path.dirname(destinationPath);
      await fs.mkdir(dir, { recursive: true });

      // Download the image
      await this.downloadImageFromUrl(imageUrl, destinationPath);

      // Validate the downloaded file
      await this.validateImageFile(destinationPath);

      console.log(`✅ Image downloaded successfully: ${destinationPath}`);
    } catch (error) {
      console.error(`❌ Failed to download image from ${imageUrl}:`, error);
      throw error;
    }
  }

  /**
   * Downloads multiple images from URLs
   * @param imageUrls Array of image URLs to download
   * @param destinationDir Directory to save the images
   * @returns Promise that resolves with an array of downloaded file paths
   */
  async downloadImages(imageUrls: string[], destinationDir: string): Promise<string[]> {
    const downloadedPaths: string[] = [];

    for (const [index, imageUrl] of imageUrls.entries()) {
      try {
        const fileName = this.generateFileName(imageUrl, index);
        const destinationPath = path.join(destinationDir, fileName);
        
        await this.downloadImage(imageUrl, destinationPath);
        downloadedPaths.push(destinationPath);
      } catch (error) {
        console.warn(`⚠️ Skipping image ${imageUrl}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return downloadedPaths;
  }

  /**
   * Validates if a URL is a valid image URL
   * @param url URL to validate
   * @returns True if valid image URL
   */
  isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Check protocol
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return false;
      }

      // Check file extension
      const pathname = urlObj.pathname.toLowerCase();
      const hasValidExtension = this.SUPPORTED_FORMATS.some(format => 
        pathname.endsWith(`.${format}`)
      );

      return hasValidExtension;
    } catch {
      return false;
    }
  }

  /**
   * Validates an image file after download
   * @param filePath Path to the image file
   */
  private async validateImageFile(filePath: string): Promise<void> {
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`Image file not found: ${filePath}`);
    }

    // Check file size
    const stats = await fs.stat(filePath);
    if (stats.size > this.MAX_FILE_SIZE) {
      throw new Error(`Image file too large: ${stats.size} bytes (max: ${this.MAX_FILE_SIZE} bytes)`);
    }

    if (stats.size === 0) {
      throw new Error(`Image file is empty: ${filePath}`);
    }

    // Additional validation could be added here (e.g., check if it's actually an image)
  }

  /**
   * Downloads an image from URL with timeout handling
   * @param url URL to download from
   * @param destinationPath Local path to save
   */
  private downloadImageFromUrl(url: string, destinationPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fileStream = createWriteStream(destinationPath);
      
      const request = https.get(url, (response) => {
        if (response.statusCode !== 200) {
          fileStream.close();
          fs.unlink(destinationPath).catch(() => {}); // Clean up partial file
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }

        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      });

      request.on('error', (error) => {
        fileStream.close();
        fs.unlink(destinationPath).catch(() => {}); // Clean up partial file
        reject(error);
      });

      // Set timeout
      request.setTimeout(this.DOWNLOAD_TIMEOUT, () => {
        request.destroy();
        fileStream.close();
        fs.unlink(destinationPath).catch(() => {}); // Clean up partial file
        reject(new Error(`Download timeout for ${url}`));
      });
    });
  }

  /**
   * Generates a safe filename from URL
   * @param url Original URL
   * @param index Index for duplicate URLs
   * @returns Safe filename
   */
  private generateFileName(url: string, index: number): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Extract filename from path
      let filename = path.basename(pathname);
      
      // Remove query parameters
      filename = filename.split('?')[0];
      
      // Remove fragment
      filename = filename.split('#')[0];
      
      // If no extension or invalid, add default
      const ext = path.extname(filename).toLowerCase();
      if (!this.SUPPORTED_FORMATS.includes(ext.replace('.', ''))) {
        filename += '.jpg';
      }
      
      // Handle duplicate filenames
      if (index > 0) {
        const name = path.parse(filename).name;
        const extension = path.parse(filename).ext;
        filename = `${name}_${index}${extension}`;
      }
      
      // Sanitize filename
      filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      
      return filename;
    } catch {
      // Fallback for invalid URLs
      return `image_${index + 1}.jpg`;
    }
  }

  /**
   * Extracts image URLs from HTML content
   * @param html HTML content to parse
   * @returns Array of image URLs
   */
  extractImageUrlsFromHtml(html: string): string[] {
    const imageUrls: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      const imageUrl = match[1];
      if (this.isValidImageUrl(imageUrl)) {
        imageUrls.push(imageUrl);
      }
    }

    return imageUrls;
  }

  /**
   * Gets image dimensions without loading the full file
   * @param filePath Path to image file
   * @returns Promise that resolves with image dimensions { width, height }
   */
  async getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
    // This is a simplified implementation
    // In a real application, you might use a library like sharp or jimp
    try {
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        throw new Error('Image file is empty');
      }

      // For now, return default dimensions
      // In production, implement actual image dimension detection
      return { width: 800, height: 600 };
    } catch (error) {
      throw new Error(`Failed to get image dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Optimizes image file (resize, compress, etc.)
   * @param filePath Path to image file
   * @param options Optimization options
   * @returns Promise that resolves when optimization is complete
   */
  async optimizeImage(filePath: string, options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpg' | 'png' | 'webp';
  } = {}): Promise<void> {
    // This is a placeholder for image optimization
    // In a real application, you would use a library like sharp
    
    const { maxWidth = 1920, maxHeight = 1080, quality = 85 } = options;
    
    console.log(`📸 Optimizing image: ${filePath}`);
    console.log(`   Max dimensions: ${maxWidth}x${maxHeight}`);
    console.log(`   Quality: ${quality}%`);
    
    // Implementation would go here using an image processing library
    // For now, just log the operation
  }
}
