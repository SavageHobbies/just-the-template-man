// Caching utilities for performance optimization

import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
  persistToDisk?: boolean; // Whether to persist cache to disk
  cacheDir?: string; // Directory for disk cache
}

export class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTtl: number;
  private readonly maxSize: number;
  private readonly persistToDisk: boolean;
  private readonly cacheDir: string;

  constructor(options: CacheOptions = {}) {
    this.defaultTtl = options.ttl || 60 * 60 * 1000; // 1 hour default
    this.maxSize = options.maxSize || 1000;
    this.persistToDisk = options.persistToDisk || false;
    this.cacheDir = options.cacheDir || '.cache';
  }

  /**
   * Generate a cache key from input data
   */
  private generateKey(input: any): string {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(input));
    return hash.digest('hex');
  }

  /**
   * Check if a cache entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Evict expired entries
   */
  private evictExpired(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict least recently used entries if cache is full
   */
  private evictLRU(): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Get cache file path for a key
   */
  private getCacheFilePath(key: string): string {
    return join(this.cacheDir, `${key}.json`);
  }

  /**
   * Load cache entry from disk
   */
  private async loadFromDisk(key: string): Promise<CacheEntry<T> | null> {
    if (!this.persistToDisk) return null;

    try {
      const filePath = this.getCacheFilePath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(data);
      
      if (this.isExpired(entry)) {
        await fs.unlink(filePath).catch(() => {}); // Clean up expired file
        return null;
      }
      
      return entry;
    } catch {
      return null;
    }
  }

  /**
   * Save cache entry to disk
   */
  private async saveToDisk(entry: CacheEntry<T>): Promise<void> {
    if (!this.persistToDisk) return;

    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      const filePath = this.getCacheFilePath(entry.key);
      await fs.writeFile(filePath, JSON.stringify(entry), 'utf-8');
    } catch (error) {
      console.warn('Failed to save cache to disk:', error);
    }
  }

  /**
   * Get value from cache
   */
  async get(key: string | any): Promise<T | null> {
    const cacheKey = typeof key === 'string' ? key : this.generateKey(key);
    
    // Check memory cache first
    let entry = this.cache.get(cacheKey);
    
    // If not in memory, try disk cache
    if (!entry) {
      entry = (await this.loadFromDisk(cacheKey)) || undefined;
      if (entry) {
        this.cache.set(cacheKey, entry); // Load back into memory
      }
    }

    if (!entry || this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(cacheKey);
    this.cache.set(cacheKey, entry);

    return entry.data;
  }

  /**
   * Set value in cache
   */
  async set(key: string | any, data: T, ttl?: number): Promise<void> {
    const cacheKey = typeof key === 'string' ? key : this.generateKey(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
      key: cacheKey
    };

    this.evictExpired();
    this.evictLRU();

    this.cache.set(cacheKey, entry);
    await this.saveToDisk(entry);
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string | any): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Delete entry from cache
   */
  async delete(key: string | any): Promise<boolean> {
    const cacheKey = typeof key === 'string' ? key : this.generateKey(key);
    const deleted = this.cache.delete(cacheKey);
    
    if (this.persistToDisk) {
      try {
        await fs.unlink(this.getCacheFilePath(cacheKey));
      } catch {
        // File might not exist, ignore error
      }
    }
    
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    
    if (this.persistToDisk) {
      try {
        const files = await fs.readdir(this.cacheDir);
        await Promise.all(
          files
            .filter(file => file.endsWith('.json'))
            .map(file => fs.unlink(join(this.cacheDir, file)).catch(() => {}))
        );
      } catch {
        // Directory might not exist, ignore error
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Get or set with a factory function
   */
  async getOrSet<K>(
    key: K,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }
}

// Specialized cache instances for different data types
export const webContentCache = new MemoryCache<any>({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 500,
  persistToDisk: true,
  cacheDir: '.cache/web-content'
});

export const researchDataCache = new MemoryCache<any>({
  ttl: 2 * 60 * 60 * 1000, // 2 hours
  maxSize: 200,
  persistToDisk: true,
  cacheDir: '.cache/research-data'
});

export const imageValidationCache = new MemoryCache<boolean>({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 1000,
  persistToDisk: true,
  cacheDir: '.cache/image-validation'
});