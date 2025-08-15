import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { FileBasedConfigurationService } from './ConfigurationService';
import { ConfigurationPreset, ThemeConfiguration } from '../models/configuration';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn()
  }
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}));

describe('ConfigurationService - Enhanced Features', () => {
  let configService: FileBasedConfigurationService;
  const mockFs = fs as any;
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };

  beforeEach(() => {
    configService = new FileBasedConfigurationService();
    // Mock the logger property
    (configService as any).logger = mockLogger;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Preset Management', () => {
    const mockPreset: ConfigurationPreset = {
      name: 'Test Preset',
      description: 'A test preset for unit testing',
      scraping: {
        requestTimeout: 45000,
        maxRetries: 5
      },
      research: {
        maxSimilarListings: 25,
        minConfidenceThreshold: 0.8
      }
    };

    it('should load preset successfully', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockPreset));
      
      const preset = await configService.loadPreset('test');
      
      expect(preset).toEqual(mockPreset);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        join(process.cwd(), 'config', 'presets', 'test.json'),
        'utf-8'
      );
    });

    it('should throw error for non-existent preset', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      
      await expect(configService.loadPreset('nonexistent')).rejects.toThrow(
        "Preset 'nonexistent' not found or invalid"
      );
    });

    it('should get available presets', async () => {
      mockFs.readdir.mockResolvedValue(['beginner.json', 'seller.json', 'power-user.json', 'readme.txt']);
      
      const presets = await configService.getAvailablePresets();
      
      expect(presets).toEqual(['beginner', 'seller', 'power-user']);
      expect(mockFs.readdir).toHaveBeenCalledWith(
        join(process.cwd(), 'config', 'presets')
      );
    });

    it('should return empty array when presets directory does not exist', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));
      
      const presets = await configService.getAvailablePresets();
      
      expect(presets).toEqual([]);
    });

    it('should apply preset to configuration', async () => {
      // Mock preset loading and user config loading
      mockFs.readFile.mockImplementation((path: string) => {
        if (path.includes('config\\presets\\test.json') || path.includes('config/presets/test.json')) {
          return Promise.resolve(JSON.stringify(mockPreset));
        }
        if (path.includes('user.json')) {
          // Return empty user config to use defaults
          throw new Error('File not found');
        }
        throw new Error('File not found');
      });
      
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      
      const result = await configService.applyPreset('test');
      
      expect(result.scraping.requestTimeout).toBe(45000);
      expect(result.scraping.maxRetries).toBe(5);
      expect(result.research.maxSimilarListings).toBe(25);
      expect(result.research.minConfidenceThreshold).toBe(0.8);
      
      // Should save the updated configuration
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('Theme Management', () => {
    const mockTheme: ThemeConfiguration = {
      name: 'Test Theme',
      description: 'A test theme for unit testing',
      customStyles: {
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        fontFamily: 'Test Font',
        fontSize: '16px'
      },
      layout: {
        containerWidth: '100%',
        maxWidth: '1000px',
        padding: '24px',
        margin: '0 auto',
        responsive: true,
        mobileBreakpoint: '768px'
      }
    };

    it('should load theme successfully', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTheme));
      
      const theme = await configService.loadTheme('test');
      
      expect(theme).toEqual(mockTheme);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        join(process.cwd(), 'config', 'themes', 'test.json'),
        'utf-8'
      );
    });

    it('should throw error for non-existent theme', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      
      await expect(configService.loadTheme('nonexistent')).rejects.toThrow(
        "Theme 'nonexistent' not found or invalid"
      );
    });

    it('should get available themes', async () => {
      mockFs.readdir.mockResolvedValue(['modern.json', 'classic.json', 'minimal.json', 'readme.txt']);
      
      const themes = await configService.getAvailableThemes();
      
      expect(themes).toEqual(['modern', 'classic', 'minimal']);
      expect(mockFs.readdir).toHaveBeenCalledWith(
        join(process.cwd(), 'config', 'themes')
      );
    });

    it('should apply theme to configuration', async () => {
      // Mock theme loading and user config loading
      mockFs.readFile.mockImplementation((path: string) => {
        if (path.includes('config\\themes\\test.json') || path.includes('config/themes/test.json')) {
          return Promise.resolve(JSON.stringify(mockTheme));
        }
        if (path.includes('user.json')) {
          // Return empty user config to use defaults
          throw new Error('File not found');
        }
        throw new Error('File not found');
      });
      
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      
      const result = await configService.applyTheme('test');
      
      expect(result.templates.customStyles.primaryColor).toBe('#ff0000');
      expect(result.templates.customStyles.secondaryColor).toBe('#00ff00');
      expect(result.templates.customStyles.fontFamily).toBe('Test Font');
      expect(result.templates.layout?.maxWidth).toBe('1000px');
      
      // Should save the updated configuration
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('Enhanced Validation', () => {
    it('should provide detailed validation results', () => {
      const config = configService.getDefaultConfiguration();
      
      const result = configService.validateConfigurationDetailed(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.estimatedProcessingTime).toBeGreaterThan(0);
      expect(result.completenessScore).toBeGreaterThan(0);
      expect(result.completenessScore).toBeLessThanOrEqual(1);
    });

    it('should generate warnings for performance issues', () => {
      const config = configService.getDefaultConfiguration();
      config.scraping.maxConcurrentRequests = 15; // High value
      config.research.maxSimilarListings = 75; // High value
      config.templates.imageGallery.maxImages = 15; // High value
      
      const result = configService.validateConfigurationDetailed(config);
      
      expect(result.warnings).toContain('High concurrent request count may cause rate limiting');
      expect(result.warnings).toContain('Large number of similar listings may slow processing');
      expect(result.warnings).toContain('Many images may increase template size and loading time');
    });

    it('should calculate processing time accurately', () => {
      const config = configService.getDefaultConfiguration();
      config.scraping.requestTimeout = 10000;
      config.scraping.requestDelay = 2000;
      config.research.maxSimilarListings = 10;
      config.templates.imageGallery.maxImages = 3;
      config.templates.imageGallery.extraction.validateUrls = true;
      config.templates.imageGallery.extraction.validationTimeout = 1000;
      
      const result = configService.validateConfigurationDetailed(config);
      
      // Base (5000) + scraping (10000 + 4000) + research (1500) + images (900) + validation (3000)
      const expectedTime = 5000 + 14000 + 1500 + 900 + 3000;
      expect(result.estimatedProcessingTime).toBe(expectedTime);
    });

    it('should calculate completeness score', () => {
      const config = configService.getDefaultConfiguration();
      
      const result = configService.validateConfigurationDetailed(config);
      
      expect(result.completenessScore).toBeGreaterThan(0.8); // Should be high for default config
      expect(result.completenessScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Template Configuration Enhancements', () => {
    it('should include enhanced template configuration in defaults', () => {
      const config = configService.getDefaultConfiguration();
      
      expect(config.templates.customStyles.borderRadius).toBeDefined();
      expect(config.templates.customStyles.boxShadow).toBeDefined();
      expect(config.templates.customStyles.headerBackground).toBeDefined();
      expect(config.templates.layout).toBeDefined();
      expect(config.templates.layout?.responsive).toBe(true);
      expect(config.templates.imageGallery.layout).toBe('grid');
      expect(config.templates.imageGallery.extraction.retryAttempts).toBe(3);
      expect(config.templates.formatting.sectionDividers).toBe(true);
      expect(config.templates.customization).toBeDefined();
      expect(config.templates.typography).toBeDefined();
      expect(config.templates.animations).toBeDefined();
    });

    it('should validate enhanced template configuration', () => {
      const config = configService.getDefaultConfiguration();
      config.templates.imageGallery.extraction.validationTimeout = 500; // Too low
      config.templates.imageGallery.extraction.minDimensions.width = 50; // Too low
      
      const errors = configService.validateConfiguration(config);
      
      expect(errors).toContain('Image validation timeout must be at least 1000ms');
      expect(errors).toContain('Minimum image dimensions must be at least 100x100 pixels');
    });
  });

  describe('Configuration Merging Enhancements', () => {
    it('should merge nested template configuration correctly', () => {
      const defaultConfig = configService.getDefaultConfiguration();
      const userConfig = {
        templates: {
          customStyles: {
            primaryColor: '#ff0000'
          },
          layout: {
            maxWidth: '800px'
          },
          imageGallery: {
            maxImages: 8,
            extraction: {
              retryAttempts: 5
            }
          }
        }
      };
      
      const merged = configService.mergeConfiguration(userConfig, defaultConfig);
      
      expect(merged.templates.customStyles.primaryColor).toBe('#ff0000');
      expect(merged.templates.customStyles.secondaryColor).toBe('#f5f5f5'); // From default
      expect(merged.templates.layout?.maxWidth).toBe('800px');
      expect(merged.templates.layout?.responsive).toBe(true); // From default
      expect(merged.templates.imageGallery.maxImages).toBe(8);
      expect(merged.templates.imageGallery.extraction.retryAttempts).toBe(5);
      expect(merged.templates.imageGallery.extraction.validateUrls).toBe(true); // From default
    });
  });
});