import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { FileBasedConfigurationService } from './ConfigurationService';
import { ConfigurationHelpers } from '../utils/configuration-helpers';

describe('ConfigurationService - Integration Tests', () => {
  let configService: FileBasedConfigurationService;
  const testConfigDir = join(process.cwd(), 'test-config');
  const testPresetsDir = join(testConfigDir, 'presets');
  const testThemesDir = join(testConfigDir, 'themes');

  beforeEach(async () => {
    configService = new FileBasedConfigurationService();
    
    // Create test directories
    await fs.mkdir(testConfigDir, { recursive: true });
    await fs.mkdir(testPresetsDir, { recursive: true });
    await fs.mkdir(testThemesDir, { recursive: true });
    
    // Override paths for testing
    (configService as any).userConfigPath = join(testConfigDir, 'user.json');
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(testConfigDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('End-to-End Configuration Workflow', () => {
    it('should complete full configuration lifecycle', async () => {
      // 1. Start with default configuration
      const defaultConfig = configService.getDefaultConfiguration();
      expect(defaultConfig.version).toBe('1.0.0');
      
      // 2. Save initial configuration
      await configService.saveConfiguration(defaultConfig);
      
      // 3. Load configuration back
      const loadedConfig = await configService.loadConfiguration();
      expect(loadedConfig.scraping.requestTimeout).toBe(defaultConfig.scraping.requestTimeout);
      
      // 4. Update a section
      await configService.updateConfigurationSection('scraping', {
        requestTimeout: 45000,
        maxRetries: 5
      });
      
      // 5. Verify update
      const updatedConfig = await configService.loadConfiguration();
      expect(updatedConfig.scraping.requestTimeout).toBe(45000);
      expect(updatedConfig.scraping.maxRetries).toBe(5);
      expect(updatedConfig.scraping.requestDelay).toBe(1000); // Should remain unchanged
      
      // 6. Validate configuration
      const validation = configService.validateConfigurationDetailed(updatedConfig);
      expect(validation.isValid).toBe(true);
      expect(validation.estimatedProcessingTime).toBeGreaterThan(0);
      expect(validation.completenessScore).toBeGreaterThan(0.8);
    });

    it('should handle preset workflow', async () => {
      // Create a test preset file
      const testPreset = {
        name: 'Integration Test Preset',
        description: 'A preset for integration testing',
        scraping: {
          requestTimeout: 60000,
          maxRetries: 7
        },
        research: {
          maxSimilarListings: 40,
          minConfidenceThreshold: 0.85
        }
      };
      
      await fs.writeFile(
        join(testPresetsDir, 'integration-test.json'),
        JSON.stringify(testPreset, null, 2)
      );
      
      // Override preset directory for testing
      const originalGetAvailablePresets = configService.getAvailablePresets;
      configService.getAvailablePresets = async () => {
        const files = await fs.readdir(testPresetsDir);
        return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
      };
      
      const originalLoadPreset = configService.loadPreset;
      configService.loadPreset = async (presetName: string) => {
        const presetPath = join(testPresetsDir, `${presetName}.json`);
        const presetData = await fs.readFile(presetPath, 'utf-8');
        return JSON.parse(presetData);
      };
      
      // Test preset operations
      const presets = await configService.getAvailablePresets();
      expect(presets).toContain('integration-test');
      
      const preset = await configService.loadPreset('integration-test');
      expect(preset.name).toBe('Integration Test Preset');
      
      // Apply preset
      const configWithPreset = await configService.applyPreset('integration-test');
      expect(configWithPreset.scraping.requestTimeout).toBe(60000);
      expect(configWithPreset.scraping.maxRetries).toBe(7);
      expect(configWithPreset.research.maxSimilarListings).toBe(40);
      expect(configWithPreset.research.minConfidenceThreshold).toBe(0.85);
      
      // Restore original methods
      configService.getAvailablePresets = originalGetAvailablePresets;
      configService.loadPreset = originalLoadPreset;
    });

    it('should handle theme workflow', async () => {
      // Create a test theme file
      const testTheme = {
        name: 'Integration Test Theme',
        description: 'A theme for integration testing',
        customStyles: {
          primaryColor: '#ff6b6b',
          secondaryColor: '#4ecdc4',
          fontFamily: 'Roboto, sans-serif',
          fontSize: '16px',
          borderRadius: '8px'
        },
        layout: {
          containerWidth: '100%',
          maxWidth: '1400px',
          padding: '32px',
          margin: '0 auto',
          responsive: true,
          mobileBreakpoint: '768px'
        }
      };
      
      await fs.writeFile(
        join(testThemesDir, 'integration-test.json'),
        JSON.stringify(testTheme, null, 2)
      );
      
      // Override theme directory for testing
      const originalGetAvailableThemes = configService.getAvailableThemes;
      configService.getAvailableThemes = async () => {
        const files = await fs.readdir(testThemesDir);
        return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
      };
      
      const originalLoadTheme = configService.loadTheme;
      configService.loadTheme = async (themeName: string) => {
        const themePath = join(testThemesDir, `${themeName}.json`);
        const themeData = await fs.readFile(themePath, 'utf-8');
        return JSON.parse(themeData);
      };
      
      // Test theme operations
      const themes = await configService.getAvailableThemes();
      expect(themes).toContain('integration-test');
      
      const theme = await configService.loadTheme('integration-test');
      expect(theme.name).toBe('Integration Test Theme');
      
      // Apply theme
      const configWithTheme = await configService.applyTheme('integration-test');
      expect(configWithTheme.templates.customStyles.primaryColor).toBe('#ff6b6b');
      expect(configWithTheme.templates.customStyles.secondaryColor).toBe('#4ecdc4');
      expect(configWithTheme.templates.customStyles.fontFamily).toBe('Roboto, sans-serif');
      expect(configWithTheme.templates.layout?.maxWidth).toBe('1400px');
      expect(configWithTheme.templates.layout?.padding).toBe('32px');
      
      // Restore original methods
      configService.getAvailableThemes = originalGetAvailableThemes;
      configService.loadTheme = originalLoadTheme;
    });
  });

  describe('Configuration Optimization Workflow', () => {
    it('should optimize configuration for different use cases', async () => {
      const baseConfig = configService.getDefaultConfiguration();
      await configService.saveConfiguration(baseConfig);
      
      // Test high volume optimization
      const highVolumeConfig = ConfigurationHelpers.optimizeForUseCase(baseConfig, 'high_volume');
      await configService.saveConfiguration(highVolumeConfig);
      
      const loadedHighVolume = await configService.loadConfiguration();
      expect(loadedHighVolume.scraping.maxConcurrentRequests).toBe(10);
      expect(loadedHighVolume.research.maxSimilarListings).toBe(15);
      
      // Test quality focus optimization
      const qualityConfig = ConfigurationHelpers.optimizeForUseCase(baseConfig, 'quality_focus');
      await configService.saveConfiguration(qualityConfig);
      
      const loadedQuality = await configService.loadConfiguration();
      expect(loadedQuality.research.maxSimilarListings).toBe(50);
      expect(loadedQuality.research.minConfidenceThreshold).toBe(0.9);
      
      // Test speed focus optimization
      const speedConfig = ConfigurationHelpers.optimizeForUseCase(baseConfig, 'speed_focus');
      await configService.saveConfiguration(speedConfig);
      
      const loadedSpeed = await configService.loadConfiguration();
      expect(loadedSpeed.scraping.requestTimeout).toBe(15000);
      expect(loadedSpeed.research.maxSimilarListings).toBe(10);
    });

    it('should generate and apply recommendations', async () => {
      const config = configService.getDefaultConfiguration();
      
      // Modify config to trigger recommendations
      config.scraping.maxConcurrentRequests = 2; // Low for high volume
      config.research.maxSimilarListings = 50; // High for high volume
      
      await configService.saveConfiguration(config);
      
      // Generate recommendations
      const recommendations = ConfigurationHelpers.generateRecommendations(config, 'high_volume');
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('concurrent requests'))).toBe(true);
      expect(recommendations.some(r => r.includes('similar listings'))).toBe(true);
      
      // Apply optimizations
      const optimizedConfig = ConfigurationHelpers.optimizeForUseCase(config, 'high_volume');
      await configService.saveConfiguration(optimizedConfig);
      
      const finalConfig = await configService.loadConfiguration();
      expect(finalConfig.scraping.maxConcurrentRequests).toBe(10);
      expect(finalConfig.research.maxSimilarListings).toBe(15);
    });
  });

  describe('Configuration Validation and Error Handling', () => {
    it('should handle invalid configuration gracefully', async () => {
      const invalidConfig = configService.getDefaultConfiguration();
      invalidConfig.scraping.requestTimeout = 500; // Invalid
      invalidConfig.research.maxSimilarListings = 0; // Invalid
      
      // Should throw error when trying to save invalid config
      await expect(configService.saveConfiguration(invalidConfig)).rejects.toThrow(
        'Configuration validation failed'
      );
      
      // Should return detailed validation results
      const validation = configService.validateConfigurationDetailed(invalidConfig);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Scraping request timeout must be at least 1000ms');
      expect(validation.errors).toContain('Max similar listings must be between 1 and 100');
    });

    it('should handle missing files gracefully', async () => {
      // Try to load non-existent preset
      await expect(configService.loadPreset('nonexistent')).rejects.toThrow(
        "Preset 'nonexistent' not found or invalid"
      );
      
      // Try to load non-existent theme
      await expect(configService.loadTheme('nonexistent')).rejects.toThrow(
        "Theme 'nonexistent' not found or invalid"
      );
      
      // Should return empty arrays for missing directories
      const presets = await configService.getAvailablePresets();
      const themes = await configService.getAvailableThemes();
      
      expect(Array.isArray(presets)).toBe(true);
      expect(Array.isArray(themes)).toBe(true);
    });
  });

  describe('Configuration Merging and Compatibility', () => {
    it('should merge partial configurations correctly', async () => {
      const defaultConfig = configService.getDefaultConfiguration();
      
      // Create partial user configuration
      const partialConfig = {
        scraping: {
          requestTimeout: 45000
        },
        templates: {
          customStyles: {
            primaryColor: '#ff0000'
          },
          imageGallery: {
            maxImages: 8
          }
        }
      };
      
      // Save partial config as user config
      await fs.writeFile(
        join(testConfigDir, 'user.json'),
        JSON.stringify(partialConfig, null, 2)
      );
      
      // Load should merge with defaults
      const mergedConfig = await configService.loadConfiguration();
      
      expect(mergedConfig.scraping.requestTimeout).toBe(45000); // From user
      expect(mergedConfig.scraping.requestDelay).toBe(1000); // From default
      expect(mergedConfig.templates.customStyles.primaryColor).toBe('#ff0000'); // From user
      expect(mergedConfig.templates.customStyles.secondaryColor).toBe('#f5f5f5'); // From default
      expect(mergedConfig.templates.imageGallery.maxImages).toBe(8); // From user
      expect(mergedConfig.templates.imageGallery.showThumbnails).toBe(true); // From default
    });

    it('should handle version compatibility', async () => {
      const config = configService.getDefaultConfiguration();
      config.version = '0.9.0'; // Older version
      
      const issues = ConfigurationHelpers.validateVersionCompatibility(config, '1.0.0');
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]).toContain('version 0.9.0 may not be compatible');
      
      const migratedConfig = ConfigurationHelpers.migrateConfiguration(config, '1.1.0');
      expect(migratedConfig.version).toBe('1.1.0');
      expect(migratedConfig.lastUpdated).toBeInstanceOf(Date);
    });
  });
});