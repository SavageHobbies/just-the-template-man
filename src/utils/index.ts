// Utility functions for the eBay Listing Optimizer

import { ProductDetails } from '../models';

/**
 * Validates if a given string is a valid eBay URL
 * @param url - The URL to validate
 * @returns boolean indicating if the URL is a valid eBay URL
 */
export function isValidEbayUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('ebay.com') || urlObj.hostname.includes('ebay.');
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL by removing tracking parameters and normalizing format
 * @param url - The URL to sanitize
 * @returns The sanitized URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove common tracking parameters
    const paramsToRemove = ['_trksid', '_trkparms', 'hash', 'var', 'rt'];
    paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Delays execution for a specified number of milliseconds
 * @param ms - Number of milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validates that required product details are present
 * @param details - The product details to validate
 * @returns boolean indicating if all required fields are present
 */
export function validateProductDetails(details: Partial<ProductDetails>): boolean {
  const requiredFields = ['title', 'description', 'price', 'condition'];
  return requiredFields.every(field => 
    details[field as keyof ProductDetails] !== undefined && 
    details[field as keyof ProductDetails] !== null &&
    details[field as keyof ProductDetails] !== ''
  );
}

/**
 * Formats a price value to a standardized format
 * @param price - The price value to format
 * @returns Formatted price as a number
 */
export function formatPrice(price: string | number): number {
  if (typeof price === 'number') return price;
  
  // Remove currency symbols, spaces, and parse
  const cleanPrice = price.replace(/[$,£€¥\s]/g, '').trim();
  const parsed = parseFloat(cleanPrice);
  return isNaN(parsed) ? 0 : parsed;
}

// Export error handling and logging utilities
export * from './errors';
export * from './logger';
export * from './retry';
export * from './validation';

// Export performance optimization utilities
export * from './cache';
export * from './rate-limiter';
export { PerformanceMonitor as PerfMonitor, monitor } from './performance-monitor';
export * from './batch-processor';
export * from './benchmark';