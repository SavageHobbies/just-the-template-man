import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { FileBasedConfigurationService } from './ConfigurationService';
import { SystemConfiguration } from '../models/configuration';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn()
  }
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })),
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}));

// Create a mock logger instance
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

describe('ConfigurationService', () => {
  let configService: FileBasedConfigurationService;
  const mockFs = fs as any;

  beforeEach(() => {
    configService = new FileBasedConfigurationService();
    // Mock the logger property
    (configService as any).logger = mockLogger;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getDefaultConfiguration', () => {
    it('should return a valid default configuration', () => {
      const config = configService.getDefaultConfiguration();
      
      expect(config).toBeDefined();
      expect(config.version).toBe('1.0.0');
      expect(config.scraping).toBeDefined();
      expect(config.research).toBeDefined();
      expect(config.pricing).toBeDefined();
      expect(config.keywords).toBeDefined();
      expect(config.templates).toBeDefined();
      expect(config.optimization).toBeDefined();
      expect(config.userPreferences).toBeDefined();
      expect(config.lastUpdated).toBeInstanceOf(Date);
    });

    it('should have valid scraping configuration', () => {
      const config = configService.getDefaultConfiguration();
      
      expect(config.scraping.requestTimeout).toBe(30000);
      expect(config.scraping.requestDelay).toBe(1000);
      expect(config.scraping.maxRetries).toBe(3);
      expect(config.scraping.userAgent).toContain('Mozilla');
      expect(config.scraping.useProxyRotation).toBe(false);
      expect(config.scraping.proxyServers).toEqual([]);
      expect(config.scraping.maxConcurrentRequests).toBe(5);
    });

    it('should have valid research configuration', () => {
      const config = configService.getDefaultConfiguration();
      
      expect(config.research.maxSimilarListings).toBe(20);
      expect(config.research.historicalDataDays).toBe(30);
      expect(config.research.minConfidenceThreshold).toBe(0.7);
      expect(config.research.searchPlatforms).toEqual(['ebay', 'amazon']);
      expect(config.research.excludeKeywords).toContain('broken');
      expect(config.research.dataSourceWeights.ebay).toBe(0.6);
    });

    it('should have valid pricing configuration', () => {
      const config = configService.getDefaultConfiguration();
      
      expect(config.pricing.algorithm).toBe('competitive');
      expect(config.pricing.strategy).toBe('moderate');
      expect(config.pricing.marginPercentage).toBe(15);
      expect(config.pricing.minPrice).toBe(1);
      expect(config.pricing.maxPrice).toBe(10000);
      expect(config.pricing.weights.marketAverage).toBe(0.4);
    });
  });

  describe('validateConfiguration', () => {
    it('should return no errors for valid configuration', () => {
      const config = configService.getDefaultConfiguration();
      const errors = configService.validateConfiguration(config);
      
      expect(errors).toEqual([]);
    });

    it('should return errors for invalid scraping configuration', () => {
      const config = configService.getDefaultConfiguration();
      config.scraping.requestTimeout = 500; // Too low
      config.scraping.maxRetries = 15; // Too high
      
      const errors = configService.validateConfiguration(config);
      
      expect(errors).toContain('Scraping request timeout must be at least 1000ms');
      expect(errors).toContain('Scraping max retries must be between 0 and 10');
    });

    it('should return errors for invalid research configuration', () => {
      const config = configService.getDefaultConfiguration();
      config.research.maxSimilarListings = 0; // Too low
      config.research.minConfidenceThreshold = 1.5; // Too high
      
      const errors = configService.validateConfiguration(config);
      
      expect(errors).toContain('Max similar listings must be between 1 and 100');
      expect(errors).toContain('Min confidence threshold must be between 0 and 1');
    });

    it('should return errors for invalid pricing configuration', () => {
      const config = configService.getDefaultConfiguration();
      config.pricing.marginPercentage = 150; // Too high
      config.pricing.minPrice = -10; // Negative
      
      let errors = configService.validateConfiguration(config);
      
      expect(errors).toContain('Margin percentage must be between 0 and 100');
      expect(errors).toContain('Minimum price must be non-negative');
      
      // Test max price constraint separately
      const config2 = configService.getDefaultConfiguration();
      config2.pricing.minPrice = 100;
      config2.pricing.maxPrice = 50; // Less than min
      
      errors = configService.validateConfiguration(config2);
      expect(errors).toContain('Maximum price must be greater than minimum price');
    });

    it('should return errors for invalid keyword configuration', () => {
      const config = configService.getDefaultConfiguration();
      config.keywords.maxKeywords = 0; // Too low
      
      const errors = configService.validateConfiguration(config);
      
      expect(errors).toContain('Max keywords must be between 1 and 50');
    });

    it('should return errors for invalid template configuration', () => {
      const config = configService.getDefaultConfiguration();
      config.templates.imageGallery.maxImages = 0; // Too low
      
      const errors = configService.validateConfiguration(config);
      
      expect(errors).toContain('Max images must be between 1 and 20');
    });
  });

  describe('mergeConfiguration', () => {
    it('should merge user configuration with defaults', () => {
      const defaultConfig = configService.getDefaultConfiguration();
      const userConfig = {
        scraping: {
          requestTimeout: 45000,
          maxRetries: 5
        },
        pricing: {
          strategy: 'aggressive' as const,
          marginPercentage: 25
        }
      };
      
      const merged = configService.mergeConfiguration(userConfig, defaultConfig);
      
      expect(merged.scraping.requestTimeout).toBe(45000);
      expect(merged.scraping.maxRetries).toBe(5);
      expect(merged.scraping.requestDelay).toBe(1000); // From default
      expect(merged.pricing.strategy).toBe('aggressive');
      expect(merged.pricing.marginPercentage).toBe(25);
      expect(merged.pricing.algorithm).toBe('competitive'); // From default
    });

    it('should handle nested object merging', () => {
      const defaultConfig = configService.getDefaultConfiguration();
      const userConfig = {
        templates: {
          customStyles: {
            primaryColor: '#ff0000'
          },
          imageGallery: {
            maxImages: 8
          }
        }
      };
      
      const merged = configService.mergeConfiguration(userConfig, defaultConfig);
      
      expect(merged.templates.customStyles.primaryColor).toBe('#ff0000');
      expect(merged.templates.customStyles.secondaryColor).toBe('#f5f5f5'); // From default
      expect(merged.templates.imageGallery.maxImages).toBe(8);
      expect(merged.templates.imageGallery.showThumbnails).toBe(true); // From default
    });
  });

  describe('loadConfiguration', () => {
    it('should load and merge user configuration successfully', async () => {
      const userConfig = {
        scraping: {
          requestTimeout: 45000
        },
        version: '1.0.0'
      };
      
      mockFs.readFile.mockResolvedValue(JSON.stringify(userConfig));
      
      const config = await configService.loadConfiguration();
      
      expect(config.scraping.requestTimeout).toBe(45000);
      expect(config.scraping.requestDelay).toBe(1000); // From default
      expect(mockFs.readFile).toHaveBeenCalledWith(
        join(process.cwd(), 'config', 'user.json'),
        'utf-8'
      );
    });

    it('should return default configuration when user config file does not exist', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      
      const config = await configService.loadConfiguration();
      
      expect(config).toEqual(configService.getDefaultConfiguration());
    });

    it('should return default configuration when user config is invalid', async () => {
      const invalidConfig = {
        scraping: {
          requestTimeout: 500 // Invalid
        }
      };
      
      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidConfig));
      
      const config = await configService.loadConfiguration();
      const defaultConfig = configService.getDefaultConfiguration();
      
      // Compare all fields except lastUpdated which will be different
      expect(config.version).toBe(defaultConfig.version);
      expect(config.scraping).toEqual(defaultConfig.scraping);
      expect(config.research).toEqual(defaultConfig.research);
      expect(config.pricing).toEqual(defaultConfig.pricing);
      expect(config.keywords).toEqual(defaultConfig.keywords);
      expect(config.templates).toEqual(defaultConfig.templates);
      expect(config.optimization).toEqual(defaultConfig.optimization);
      expect(config.userPreferences).toEqual(defaultConfig.userPreferences);
    });

    it('should load configuration from custom path', async () => {
      const customPath = '/custom/config.json';
      const userConfig = { version: '1.0.0' };
      
      mockFs.readFile.mockResolvedValue(JSON.stringify(userConfig));
      
      await configService.loadConfiguration(customPath);
      
      expect(mockFs.readFile).toHaveBeenCalledWith(customPath, 'utf-8');
    });
  });

  describe('saveConfiguration', () => {
    it('should save valid configuration successfully', async () => {
      const config = configService.getDefaultConfiguration();
      
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      
      await configService.saveConfiguration(config);
      
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        join(process.cwd(), 'config'),
        { recursive: true }
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        join(process.cwd(), 'config', 'user.json'),
        expect.stringContaining('"version": "1.0.0"'),
        'utf-8'
      );
    });

    it('should throw error for invalid configuration', async () => {
      const config = configService.getDefaultConfiguration();
      config.scraping.requestTimeout = 500; // Invalid
      
      await expect(configService.saveConfiguration(config)).rejects.toThrow(
        'Configuration validation failed'
      );
    });

    it('should save to custom path', async () => {
      const config = configService.getDefaultConfiguration();
      const customPath = '/custom/config.json';
      
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      
      await configService.saveConfiguration(config, customPath);
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        customPath,
        expect.any(String),
        'utf-8'
      );
    });

    it('should update lastUpdated timestamp', async () => {
      const config = configService.getDefaultConfiguration();
      const originalTimestamp = config.lastUpdated;
      
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await configService.saveConfiguration(config);
      
      expect(config.lastUpdated.getTime()).toBeGreaterThan(originalTimestamp.getTime());
    });
  });

  describe('updateConfigurationSection', () => {
    it('should update specific configuration section', async () => {
      const defaultConfig = configService.getDefaultConfiguration();
      
      // Mock loadConfiguration to return default config
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      
      await configService.updateConfigurationSection('scraping', {
        requestTimeout: 60000,
        maxRetries: 5
      });
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"requestTimeout": 60000'),
        'utf-8'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"maxRetries": 5'),
        'utf-8'
      );
    });
  });
});