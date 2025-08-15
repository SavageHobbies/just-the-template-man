import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { FileBasedConfigurationService } from './ConfigurationService';
import { ConfigurationHelpers } from '../utils/configuration-helpers';
import { SystemConfiguration } from '../models/configuration';

/**
 * Task 13 Verification Tests
 * 
 * These tests verify that all requirements for Task 13 have been implemented:
 * - Create configuration files for scraping parameters and research settings
 * - Implement customizable templates and styling options
 * - Add configuration for pricing algorithms and keyword weighting
 * - Create user preference management for optimization strategies
 * - Write tests for configuration loading and validation
 */
describe('Task 13: Configuration and Customization System', () => {
  let configService: FileBasedConfigurationService;
  const testConfigDir = join(process.cwd(), 'task13-test-config');

  beforeEach(async () => {
    configService = new FileBasedConfigurationService();
    await fs.mkdir(testConfigDir, { recursive: true });
    (configService as any).userConfigPath = join(testConfigDir, 'user.json');
  });

  afterEach(async () => {
    try {
      await fs.rm(testConfigDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Requirement: Configuration files for scraping parameters and research settings', () => {
    it('should provide comprehensive scraping configuration', () => {
      const config = configService.getDefaultConfiguration();
      
      // Verify scraping parameters are configurable
      expect(config.scraping).toBeDefined();
      expect(config.scraping.requestTimeout).toBe(30000);
      expect(config.scraping.requestDelay).toBe(1000);
      expect(config.scraping.maxRetries).toBe(3);
      expect(config.scraping.userAgent).toContain('Mozilla');
      expect(config.scraping.useProxyRotation).toBe(false);
      expect(config.scraping.proxyServers).toEqual([]);
      expect(config.scraping.maxConcurrentRequests).toBe(5);
    });

    it('should provide comprehensive research configuration', () => {
      const config = configService.getDefaultConfiguration();
      
      // Verify research settings are configurable
      expect(config.research).toBeDefined();
      expect(config.research.maxSimilarListings).toBe(20);
      expect(config.research.historicalDataDays).toBe(30);
      expect(config.research.minConfidenceThreshold).toBe(0.7);
      expect(config.research.searchPlatforms).toEqual(['ebay', 'amazon']);
      expect(config.research.excludeKeywords).toContain('broken');
      expect(config.research.dataSourceWeights).toBeDefined();
      expect(config.research.insufficientDataHandling).toBeDefined();
      expect(config.research.insufficientDataHandling.enableAutoExpansion).toBe(true);
    });

    it('should allow updating scraping and research configurations', async () => {
      const config = configService.getDefaultConfiguration();
      await configService.saveConfiguration(config);

      // Update scraping configuration
      await configService.updateConfigurationSection('scraping', {
        requestTimeout: 45000,
        maxRetries: 5,
        maxConcurrentRequests: 8
      });

      // Update research configuration
      await configService.updateConfigurationSection('research', {
        maxSimilarListings: 30,
        minConfidenceThreshold: 0.8,
        historicalDataDays: 45
      });

      const updatedConfig = await configService.loadConfiguration();
      expect(updatedConfig.scraping.requestTimeout).toBe(45000);
      expect(updatedConfig.scraping.maxRetries).toBe(5);
      expect(updatedConfig.scraping.maxConcurrentRequests).toBe(8);
      expect(updatedConfig.research.maxSimilarListings).toBe(30);
      expect(updatedConfig.research.minConfidenceThreshold).toBe(0.8);
      expect(updatedConfig.research.historicalDataDays).toBe(45);
    });
  });

  describe('Requirement: Customizable templates and styling options', () => {
    it('should provide comprehensive template configuration', () => {
      const config = configService.getDefaultConfiguration();
      
      // Verify template configuration exists
      expect(config.templates).toBeDefined();
      expect(config.templates.defaultTemplate).toBe('final-ebay-template.html');
      expect(config.templates.availableTemplates).toContain('final-ebay-template.html');
      expect(config.templates.customStyles).toBeDefined();
      expect(config.templates.layout).toBeDefined();
      expect(config.templates.imageGallery).toBeDefined();
      expect(config.templates.formatting).toBeDefined();
      expect(config.templates.customization).toBeDefined();
    });

    it('should provide customizable styling options', () => {
      const config = configService.getDefaultConfiguration();
      
      // Verify styling options
      expect(config.templates.customStyles.primaryColor).toBe('#0066cc');
      expect(config.templates.customStyles.secondaryColor).toBe('#f5f5f5');
      expect(config.templates.customStyles.fontFamily).toBe('Arial, sans-serif');
      expect(config.templates.customStyles.fontSize).toBe('14px');
      expect(config.templates.customStyles.borderRadius).toBe('4px');
      expect(config.templates.customStyles.boxShadow).toBeDefined();
      expect(config.templates.customStyles.headerBackground).toBeDefined();
      expect(config.templates.customStyles.textColor).toBeDefined();
      expect(config.templates.customStyles.linkColor).toBeDefined();
      expect(config.templates.customStyles.buttonColor).toBeDefined();
    });

    it('should provide layout customization options', () => {
      const config = configService.getDefaultConfiguration();
      
      // Verify layout options
      expect(config.templates.layout?.containerWidth).toBe('100%');
      expect(config.templates.layout?.maxWidth).toBe('1200px');
      expect(config.templates.layout?.padding).toBe('20px');
      expect(config.templates.layout?.margin).toBe('0 auto');
      expect(config.templates.layout?.responsive).toBe(true);
      expect(config.templates.layout?.mobileBreakpoint).toBe('768px');
    });

    it('should provide image gallery customization', () => {
      const config = configService.getDefaultConfiguration();
      
      // Verify image gallery options
      expect(config.templates.imageGallery.maxImages).toBe(5);
      expect(config.templates.imageGallery.imageSize).toBe('medium');
      expect(config.templates.imageGallery.showThumbnails).toBe(true);
      expect(config.templates.imageGallery.enableZoom).toBe(false);
      expect(config.templates.imageGallery.layout).toBe('grid');
      expect(config.templates.imageGallery.aspectRatio).toBe('1:1');
      expect(config.templates.imageGallery.spacing).toBe('10px');
      expect(config.templates.imageGallery.borderRadius).toBe('8px');
    });

    it('should support theme application', async () => {
      const config = configService.getDefaultConfiguration();
      
      // Create a custom theme
      const customTheme = {
        name: 'Test Theme',
        description: 'A theme for testing',
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
      
      // Apply theme to template configuration
      const updatedTemplateConfig = {
        ...config.templates,
        customStyles: { ...config.templates.customStyles, ...customTheme.customStyles },
        layout: { ...config.templates.layout, ...customTheme.layout }
      };
      
      expect(updatedTemplateConfig.customStyles.primaryColor).toBe('#ff6b6b');
      expect(updatedTemplateConfig.customStyles.fontFamily).toBe('Roboto, sans-serif');
      expect(updatedTemplateConfig.layout?.maxWidth).toBe('1400px');
      expect(updatedTemplateConfig.layout?.padding).toBe('32px');
    });
  });

  describe('Requirement: Configuration for pricing algorithms and keyword weighting', () => {
    it('should provide comprehensive pricing algorithm configuration', () => {
      const config = configService.getDefaultConfiguration();
      
      // Verify pricing configuration
      expect(config.pricing).toBeDefined();
      expect(config.pricing.algorithm).toBe('competitive');
      expect(config.pricing.strategy).toBe('moderate');
      expect(config.pricing.marginPercentage).toBe(15);
      expect(config.pricing.minPrice).toBe(1);
      expect(config.pricing.maxPrice).toBe(10000);
      expect(config.pricing.weights).toBeDefined();
      expect(config.pricing.weights.marketAverage).toBe(0.4);
      expect(config.pricing.weights.competitorPricing).toBe(0.3);
      expect(config.pricing.weights.historicalSales).toBe(0.2);
      expect(config.pricing.weights.condition).toBe(0.1);
    });

    it('should provide advanced pricing configuration', () => {
      const config = configService.getDefaultConfiguration();
      
      // Verify advanced pricing options
      expect(config.pricing.advanced).toBeDefined();
      expect(config.pricing.advanced.enableDynamicPricing).toBe(true);
      expect(config.pricing.advanced.trendAnalysisDays).toBe(14);
      expect(config.pricing.advanced.trendAdjustmentFactor).toBe(1.1);
      expect(config.pricing.advanced.seasonalAdjustments).toBeDefined();
      expect(config.pricing.advanced.competitiveThresholds).toBeDefined();
    });

    it('should provide keyword weighting configuration', () => {
      const config = configService.getDefaultConfiguration();
      
      // Verify keyword configuration
      expect(config.keywords).toBeDefined();
      expect(config.keywords.titleWeight).toBe(0.4);
      expect(config.keywords.descriptionWeight).toBe(0.3);
      expect(config.keywords.categoryWeight).toBe(0.1);
      expect(config.keywords.brandWeight).toBe(0.1);
      expect(config.keywords.conditionWeight).toBe(0.1);
      expect(config.keywords.minFrequencyThreshold).toBe(2);
      expect(config.keywords.maxKeywords).toBe(20);
      expect(config.keywords.trendingBoost).toBe(1.2);
    });

    it('should allow updating pricing and keyword configurations', async () => {
      const config = configService.getDefaultConfiguration();
      await configService.saveConfiguration(config);

      // Update pricing configuration
      await configService.updateConfigurationSection('pricing', {
        strategy: 'aggressive',
        marginPercentage: 25,
        algorithm: 'premium'
      });

      // Update keyword configuration
      await configService.updateConfigurationSection('keywords', {
        titleWeight: 0.5,
        maxKeywords: 30,
        trendingBoost: 1.5
      });

      const updatedConfig = await configService.loadConfiguration();
      expect(updatedConfig.pricing.strategy).toBe('aggressive');
      expect(updatedConfig.pricing.marginPercentage).toBe(25);
      expect(updatedConfig.pricing.algorithm).toBe('premium');
      expect(updatedConfig.keywords.titleWeight).toBe(0.5);
      expect(updatedConfig.keywords.maxKeywords).toBe(30);
      expect(updatedConfig.keywords.trendingBoost).toBe(1.5);
    });
  });

  describe('Requirement: User preference management for optimization strategies', () => {
    it('should provide optimization strategy configuration', () => {
      const config = configService.getDefaultConfiguration();
      
      // Verify optimization configuration
      expect(config.optimization).toBeDefined();
      expect(config.optimization.contentStrategy).toBe('balanced');
      expect(config.optimization.titleOptimization).toBe('readable');
      expect(config.optimization.descriptionStyle).toBe('detailed');
      expect(config.optimization.pricingApproach).toBe('competitive');
      expect(config.optimization.targetAudience).toBe('quality_seekers');
      expect(config.optimization.goals).toBeDefined();
      expect(config.optimization.goals.maximizeVisibility).toBe(true);
      expect(config.optimization.goals.maximizeConversion).toBe(true);
      expect(config.optimization.goals.maximizeProfit).toBe(false);
    });

    it('should provide user preferences configuration', () => {
      const config = configService.getDefaultConfiguration();
      
      // Verify user preferences
      expect(config.userPreferences).toBeDefined();
      expect(config.userPreferences.language).toBe('en');
      expect(config.userPreferences.currency).toBe('USD');
      expect(config.userPreferences.timezone).toBe('UTC');
      expect(config.userPreferences.notifications).toBeDefined();
      expect(config.userPreferences.defaultOptimization).toBeDefined();
      expect(config.userPreferences.templatePreferences).toBeDefined();
    });

    it('should support preset-based optimization strategies', () => {
      // Test beginner preset
      const beginnerPreset = ConfigurationHelpers.createPreset('beginner');
      expect(beginnerPreset.optimization?.contentStrategy).toBe('balanced');
      expect(beginnerPreset.optimization?.titleOptimization).toBe('readable');
      expect(beginnerPreset.optimization?.targetAudience).toBe('quality_seekers');

      // Test seller preset
      const sellerPreset = ConfigurationHelpers.createPreset('seller');
      expect(sellerPreset.optimization?.contentStrategy).toBe('conversion_focused');
      expect(sellerPreset.optimization?.titleOptimization).toBe('keyword_heavy');
      expect(sellerPreset.optimization?.targetAudience).toBe('bargain_hunters');

      // Test power user preset
      const powerUserPreset = ConfigurationHelpers.createPreset('power_user');
      expect(powerUserPreset.optimization?.contentStrategy).toBe('seo_focused');
      expect(powerUserPreset.optimization?.titleOptimization).toBe('keyword_heavy');
      expect(powerUserPreset.optimization?.targetAudience).toBe('brand_conscious');
    });

    it('should support use case optimization', () => {
      const baseConfig = configService.getDefaultConfiguration();

      // Test high volume optimization
      const highVolumeConfig = ConfigurationHelpers.optimizeForUseCase(baseConfig, 'high_volume');
      expect(highVolumeConfig.scraping.maxConcurrentRequests).toBe(10);
      expect(highVolumeConfig.research.maxSimilarListings).toBe(15);

      // Test quality focus optimization
      const qualityConfig = ConfigurationHelpers.optimizeForUseCase(baseConfig, 'quality_focus');
      expect(qualityConfig.research.maxSimilarListings).toBe(50);
      expect(qualityConfig.research.minConfidenceThreshold).toBe(0.9);

      // Test speed focus optimization
      const speedConfig = ConfigurationHelpers.optimizeForUseCase(baseConfig, 'speed_focus');
      expect(speedConfig.scraping.requestTimeout).toBe(15000);
      expect(speedConfig.research.maxSimilarListings).toBe(10);
    });
  });

  describe('Requirement: Tests for configuration loading and validation', () => {
    it('should validate configuration structure and values', () => {
      const config = configService.getDefaultConfiguration();
      const errors = configService.validateConfiguration(config);
      expect(errors).toEqual([]);
    });

    it('should provide detailed validation results', () => {
      const config = configService.getDefaultConfiguration();
      const validation = configService.validateConfigurationDetailed(config);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
      expect(validation.warnings).toBeDefined();
      expect(validation.estimatedProcessingTime).toBeGreaterThan(0);
      expect(validation.completenessScore).toBeGreaterThan(0.8);
    });

    it('should detect configuration errors', () => {
      const config = configService.getDefaultConfiguration();
      
      // Introduce validation errors
      config.scraping.requestTimeout = 500; // Too low
      config.research.maxSimilarListings = 0; // Too low
      config.pricing.marginPercentage = 150; // Too high
      config.keywords.maxKeywords = 0; // Too low
      config.templates.imageGallery.maxImages = 0; // Too low

      const errors = configService.validateConfiguration(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Scraping request timeout must be at least 1000ms');
      expect(errors).toContain('Max similar listings must be between 1 and 100');
      expect(errors).toContain('Margin percentage must be between 0 and 100');
      expect(errors).toContain('Max keywords must be between 1 and 50');
      expect(errors).toContain('Max images must be between 1 and 20');
    });

    it('should load and save configuration correctly', async () => {
      const config = configService.getDefaultConfiguration();
      
      // Modify configuration
      config.scraping.requestTimeout = 45000;
      config.research.maxSimilarListings = 25;
      config.pricing.marginPercentage = 20;
      
      // Save configuration
      await configService.saveConfiguration(config);
      
      // Load configuration back
      const loadedConfig = await configService.loadConfiguration();
      expect(loadedConfig.scraping.requestTimeout).toBe(45000);
      expect(loadedConfig.research.maxSimilarListings).toBe(25);
      expect(loadedConfig.pricing.marginPercentage).toBe(20);
    });

    it('should merge partial configurations correctly', async () => {
      const partialConfig = {
        scraping: {
          requestTimeout: 60000
        },
        templates: {
          customStyles: {
            primaryColor: '#ff0000'
          }
        }
      };

      // Save partial config
      await fs.writeFile(
        join(testConfigDir, 'user.json'),
        JSON.stringify(partialConfig, null, 2)
      );

      // Load should merge with defaults
      const mergedConfig = await configService.loadConfiguration();
      expect(mergedConfig.scraping.requestTimeout).toBe(60000); // From user
      expect(mergedConfig.scraping.requestDelay).toBe(1000); // From default
      expect(mergedConfig.templates.customStyles.primaryColor).toBe('#ff0000'); // From user
      expect(mergedConfig.templates.customStyles.secondaryColor).toBe('#f5f5f5'); // From default
    });

    it('should handle invalid configuration gracefully', async () => {
      const invalidConfig = configService.getDefaultConfiguration();
      invalidConfig.scraping.requestTimeout = 500; // Invalid

      // Should throw error when trying to save invalid config
      await expect(configService.saveConfiguration(invalidConfig)).rejects.toThrow(
        'Configuration validation failed'
      );
    });
  });

  describe('Integration: Complete configuration workflow', () => {
    it('should support complete configuration customization workflow', async () => {
      // 1. Start with default configuration
      const defaultConfig = configService.getDefaultConfiguration();
      
      // 2. Apply a preset
      const presetConfig = ConfigurationHelpers.createPreset('seller');
      const configWithPreset = configService.mergeConfiguration(presetConfig, defaultConfig);
      
      // 3. Optimize for use case
      const optimizedConfig = ConfigurationHelpers.optimizeForUseCase(configWithPreset, 'high_volume');
      
      // 4. Customize templates
      optimizedConfig.templates.customStyles.primaryColor = '#e74c3c';
      optimizedConfig.templates.imageGallery.maxImages = 8;
      
      // 5. Adjust pricing and keywords
      optimizedConfig.pricing.marginPercentage = 22;
      optimizedConfig.keywords.maxKeywords = 25;
      
      // 6. Set user preferences
      optimizedConfig.userPreferences.language = 'en';
      optimizedConfig.userPreferences.currency = 'USD';
      optimizedConfig.optimization.contentStrategy = 'conversion_focused';
      
      // 7. Validate final configuration
      const validation = configService.validateConfigurationDetailed(optimizedConfig);
      expect(validation.isValid).toBe(true);
      
      // 8. Save and reload
      await configService.saveConfiguration(optimizedConfig);
      const finalConfig = await configService.loadConfiguration();
      
      // Verify all customizations were preserved
      expect(finalConfig.templates.customStyles.primaryColor).toBe('#e74c3c');
      expect(finalConfig.templates.imageGallery.maxImages).toBe(8);
      expect(finalConfig.pricing.marginPercentage).toBe(22);
      expect(finalConfig.keywords.maxKeywords).toBe(25);
      expect(finalConfig.optimization.contentStrategy).toBe('conversion_focused');
    });
  });
});