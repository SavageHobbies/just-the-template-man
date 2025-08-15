// Tests for caching utilities

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryCache } from './cache';
import { promises as fs } from 'fs';

// Mock fs for testing
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn(),
    readdir: vi.fn()
  }
}));

describe('MemoryCache', () => {
  let cache: MemoryCache<string>;

  beforeEach(() => {
    cache = new MemoryCache<string>({
      ttl: 1000, // 1 second for testing
      maxSize: 3,
      persistToDisk: false
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve values', async () => {
      await cache.set('key1', 'value1');
      const value = await cache.get('key1');
      expect(value).toBe('value1');
    });

    it('should return null for non-existent keys', async () => {
      const value = await cache.get('nonexistent');
      expect(value).toBeNull();
    });

    it('should check if key exists', async () => {
      await cache.set('key1', 'value1');
      expect(await cache.has('key1')).toBe(true);
      expect(await cache.has('nonexistent')).toBe(false);
    });

    it('should delete entries', async () => {
      await cache.set('key1', 'value1');
      expect(await cache.has('key1')).toBe(true);
      
      const deleted = await cache.delete('key1');
      expect(deleted).toBe(true);
      expect(await cache.has('key1')).toBe(false);
    });

    it('should clear all entries', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      
      await cache.clear();
      
      expect(await cache.has('key1')).toBe(false);
      expect(await cache.has('key2')).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      await cache.set('key1', 'value1', 100); // 100ms TTL
      
      expect(await cache.get('key1')).toBe('value1');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(await cache.get('key1')).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      await cache.set('key1', 'value1');
      
      // Should still be valid immediately
      expect(await cache.get('key1')).toBe('value1');
    });
  });

  describe('Size Limits', () => {
    it('should evict LRU entries when max size is reached', async () => {
      // Fill cache to max size
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');
      
      // All should be present
      expect(await cache.has('key1')).toBe(true);
      expect(await cache.has('key2')).toBe(true);
      expect(await cache.has('key3')).toBe(true);
      
      // Add one more to trigger eviction
      await cache.set('key4', 'value4');
      
      // key1 should be evicted (least recently used)
      expect(await cache.has('key1')).toBe(false);
      expect(await cache.has('key2')).toBe(true);
      expect(await cache.has('key3')).toBe(true);
      expect(await cache.has('key4')).toBe(true);
    });

    it('should update LRU order on access', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');
      
      // Access key1 to make it most recently used
      await cache.get('key1');
      
      // Add new entry to trigger eviction
      await cache.set('key4', 'value4');
      
      // key2 should be evicted (now least recently used)
      expect(await cache.has('key1')).toBe(true);
      expect(await cache.has('key2')).toBe(false);
      expect(await cache.has('key3')).toBe(true);
      expect(await cache.has('key4')).toBe(true);
    });
  });

  describe('Key Generation', () => {
    it('should generate consistent keys for same input', async () => {
      const obj1 = { name: 'test', value: 123 };
      const obj2 = { name: 'test', value: 123 };
      
      await cache.set(obj1, 'value1');
      const value = await cache.get(obj2);
      
      expect(value).toBe('value1');
    });

    it('should generate different keys for different input', async () => {
      const obj1 = { name: 'test', value: 123 };
      const obj2 = { name: 'test', value: 456 };
      
      await cache.set(obj1, 'value1');
      await cache.set(obj2, 'value2');
      
      expect(await cache.get(obj1)).toBe('value1');
      expect(await cache.get(obj2)).toBe('value2');
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      await cache.set('key1', 'cached_value');
      
      const factory = vi.fn().mockResolvedValue('new_value');
      const result = await cache.getOrSet('key1', factory);
      
      expect(result).toBe('cached_value');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not exists', async () => {
      const factory = vi.fn().mockResolvedValue('new_value');
      const result = await cache.getOrSet('key1', factory);
      
      expect(result).toBe('new_value');
      expect(factory).toHaveBeenCalledOnce();
      expect(await cache.get('key1')).toBe('new_value');
    });
  });

  describe('Statistics', () => {
    it('should return cache statistics', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
    });
  });

  describe('Disk Persistence', () => {
    let diskCache: MemoryCache<string>;

    beforeEach(() => {
      diskCache = new MemoryCache<string>({
        ttl: 1000,
        maxSize: 10,
        persistToDisk: true,
        cacheDir: '.test-cache'
      });
    });

    afterEach(async () => {
      await diskCache.clear();
    });

    it('should save to disk when persistToDisk is enabled', async () => {
      await diskCache.set('key1', 'value1');
      
      expect(fs.mkdir).toHaveBeenCalledWith('.test-cache', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should load from disk when not in memory', async () => {
      const mockEntry = {
        data: 'disk_value',
        timestamp: Date.now(),
        ttl: 10000,
        key: 'test_key'
      };

      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockEntry));
      
      const value = await diskCache.get('test_key');
      
      expect(fs.readFile).toHaveBeenCalled();
      expect(value).toBe('disk_value');
    });

    it('should handle disk read errors gracefully', async () => {
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));
      
      const value = await diskCache.get('nonexistent');
      
      expect(value).toBeNull();
    });
  });
});