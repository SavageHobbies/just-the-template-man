// Tests for utility functions

import { describe, it, expect } from 'vitest';
import { 
  isValidEbayUrl, 
  sanitizeUrl, 
  validateProductDetails, 
  formatPrice 
} from './index';
import { ProductDetails } from '../models';

describe('Utility Functions', () => {
  describe('isValidEbayUrl', () => {
    it('should return true for valid eBay URLs', () => {
      expect(isValidEbayUrl('https://www.ebay.com/itm/123456789')).toBe(true);
      expect(isValidEbayUrl('https://ebay.co.uk/itm/123456789')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidEbayUrl('https://amazon.com/item/123')).toBe(false);
      expect(isValidEbayUrl('not-a-url')).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('should remove tracking parameters', () => {
      const url = 'https://www.ebay.com/itm/123?_trksid=abc&_trkparms=def&hash=ghi';
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toBe('https://www.ebay.com/itm/123');
    });

    it('should return original URL if invalid', () => {
      const invalidUrl = 'not-a-url';
      expect(sanitizeUrl(invalidUrl)).toBe(invalidUrl);
    });
  });

  describe('validateProductDetails', () => {
    it('should return true for valid product details', () => {
      const details: ProductDetails = {
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        condition: 'New',
        images: [],
        specifications: {},
        seller: 'test-seller',
        location: 'Test Location'
      };
      expect(validateProductDetails(details)).toBe(true);
    });

    it('should return false for missing required fields', () => {
      const details = {
        title: 'Test Product',
        // missing description, price, condition
      };
      expect(validateProductDetails(details)).toBe(false);
    });
  });

  describe('formatPrice', () => {
    it('should format string prices correctly', () => {
      expect(formatPrice('$100.50')).toBe(100.50);
      expect(formatPrice('£25.99')).toBe(25.99);
      expect(formatPrice('1,234.56')).toBe(1234.56);
    });

    it('should return number prices as-is', () => {
      expect(formatPrice(100)).toBe(100);
    });

    it('should return 0 for invalid prices', () => {
      expect(formatPrice('invalid')).toBe(0);
    });
  });
});