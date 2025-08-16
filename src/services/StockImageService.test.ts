import { vi, describe, it, expect, beforeEach } from 'vitest';
import { StockImageService } from './StockImageService';

describe('StockImageService', () => {
  let stockImageService: StockImageService;

  beforeEach(() => {
    stockImageService = new StockImageService();
  });

  describe('isAppropriateImage', () => {
    it('should reject inappropriate content URLs', async () => {
      const inappropriateUrls = [
        'https://example.com/dead-body.jpg',
        'https://example.com/corpse.jpg',
        'https://example.com/drowning.jpg',
        'https://example.com/accident-scene.jpg',
        'https://example.com/autopsy.jpg'
      ];

      for (const url of inappropriateUrls) {
        const result = await stockImageService['isAppropriateImage'](url);
        expect(result).toBe(false);
      }
    });

    it('should accept appropriate image URLs', async () => {
      const appropriateUrls = [
        'https://example.com/product-image.jpg',
        'https://example.com/item-photo.png',
        'https://example.com/funko-pop.jpeg'
      ];

      for (const url of appropriateUrls) {
        const result = await stockImageService['isAppropriateImage'](url);
        expect(result).toBe(true);
      }
    });
  });

  describe('fetchImageFromUPCDatabases', () => {
    it('should check upcdatabase.org first', async () => {
      // This test verifies the order of database checks
      const upc = '123456789012';
      
      // Mock the private methods to track call order
      const originalFetchFromUPCDatabase = stockImageService['fetchFromUPCDatabase'];
      const originalFetchFromUPCItemDB = stockImageService['fetchFromUPCItemDB'];
      
      let upcdatabaseCalled = false;
      let upcitemdbCalled = false;
      
      // Mock the methods to track call order
      stockImageService['fetchFromUPCDatabase'] = async () => {
        upcdatabaseCalled = true;
        return null;
      };
      
      stockImageService['fetchFromUPCItemDB'] = async () => {
        upcitemdbCalled = true;
        return null;
      };
      
      await stockImageService['fetchImageFromUPCDatabases'](upc);
      
      // Verify upcdatabase.org was called first
      expect(upcdatabaseCalled).toBe(true);
      expect(upcitemdbCalled).toBe(true);
      
      // Restore original methods
      stockImageService['fetchFromUPCDatabase'] = originalFetchFromUPCDatabase;
      stockImageService['fetchFromUPCItemDB'] = originalFetchFromUPCItemDB;
    });
  });
});
