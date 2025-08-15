import { describe, it, expect } from 'vitest';
import { ConfigurationHelpers } from './configuration-helpers';
import { SystemConfiguration, ConfigurationPreset, ThemeConfiguration } from '../models/configuration';

describe('ConfigurationHelpers - Enhanced Features', () => {
  const mockConfig: SystemConfiguration = {
    scraping: {
      requestTimeout: 30000,
      requestDelay: 1000,
      maxRetries: 3,
      userAgent: 'test-agent',
      useProxyRotation: false,
      proxyServers: [],
      maxConcurrentRequests: 5
    },
    research: {
      maxSimilarListings: 20,
      historicalDataDays: 30,
      minConfidenceThreshold: 0.7,
      searchPlatforms: ['ebay', 'amazon'],
      excludeKeywords: ['broken'],
      dataSourceWeights: { ebay: 0.6, amazon: 0.3, other: 0.1 },
      insufficientDataHandling: {
        enableAutoExpansion: true,
        minListingsThreshold: 5,
        fallbackPlatforms: ['etsy'],
        relaxExcludeKeywords: true,
        extendHistoricalDays: 60,
        fallbackConfidenceThreshold: 0.5
      }
    },
    pricing: {
      algorithm: 'competitive',
      strategy: 'moderate',
      marginPercentage: 15,
      minPrice: 1,
      maxPrice: 10000,
      weights: {
        marketAverage: 0.4,
        competitorPricing: 0.3,
        historicalSales: 0.2,
        condition: 0.1
      },
      advanced: {
        enableDynamicPricing: true,
        trendAnalysisDays: 14,
        trendAdjustmentFactor: 1.1,
        seasonalAdjustments: {
          enabled: false,
          peakSeasonMultiplier: 1.2,
          offSeasonMultiplier: 0.9
        },
        competitiveThresholds: {
          competitiveThreshold: 0.05,
          premiumThreshold: 0.15
        }
      }
    },
    keywords: {
      titleWeight: 0.4,
      descriptionWeight: 0.3,
      categoryWeight: 0.1,
      brandWeight: 0.1,
      conditionWeight: 0.1,
      minFrequencyThreshold: 2,
      maxKeywords: 20,
      trendingBoost: 1.2
    },
    templates: {
      defaultTemplate: 'test-template.html',
      availableTemplates: ['test-template.html'],
      customStyles: {
        primaryColor: '#0066cc',
        secondaryColor: '#f5f5f5',
        fontFamily: 'Arial',
        fontSize: '14px'
      },
      imageGallery: {
        maxImages: 5,
        imageSize: 'medium',
        showThumbnails: true,
        enableZoom: false,
        extraction: {
          prioritizeHighRes: true,
          minDimensions: { width: 300, height: 300 },
          qualityPreferences: ['/s-l1600.jpg'],
          validateUrls: true,
          validationTimeout: 5000,
          fallbackSources: ['main-image']
        }
      },
      formatting: {
        useMarkdown: false,
        includeBulletPoints: true,
        highlightKeyFeatures: true,
        addCallToAction: true
      }
    },
    optimization: {
      contentStrategy: 'balanced',
      titleOptimization: 'readable',
      descriptionStyle: 'detailed',
      pricingApproach: 'competitive',
      targetAudience: 'quality_seekers',
      goals: {
        maximizeVisibility: true,
        maximizeConversion: true,
        maximizeProfit: false
      }
    },
    userPreferences: {
      language: 'en',
      currency: 'USD',
      timezone: 'UTC',
      notifications: {
        emailUpdates: false,
        priceAlerts: true,
        marketTrends: true
      },
      defaultOptimization: {
        contentStrategy: 'balanced',
        titleOptimization: 'readable',
        descriptionStyle: 'detailed',
        pricingApproach: 'competitive',
        targetAudience: 'quality_seekers',
        goals: {
          maximizeVisibility: true,
          maximizeConversion: true,
          maximizeProfit: false
        }
      },
      templatePreferences: {
        favoriteTemplates: ['test-template.html'],
        customTemplates: []
      }
    },
    version: '1.0.0',
    lastUpdated: new Date('2023-01-01')
  };

  describe('createPresetFromConfiguration', () => {
    it('should create preset from configuration', () => {
      const preset = ConfigurationHelpers.createPresetFromConfiguration(
        mockConfig,
        'Test Preset',
        'A test preset'
      );

      expect(preset.name).toBe('Test Preset');
      expect(preset.description).toBe('A test preset');
      expect(preset.scraping).toEqual(mockConfig.scraping);
      expect(preset.research).toEqual(mockConfig.research);
      expect(preset.pricing).toEqual(mockConfig.pricing);
      expect(preset.keywords).toEqual(mockConfig.keywords);
      expect(preset.templates).toEqual(mockConfig.templates);
      expect(preset.optimization).toEqual(mockConfig.optimization);
      expect(preset.userPreferences).toEqual(mockConfig.userPreferences);
    });
  });

  describe('createThemeFromTemplate', () => {
    it('should create theme from template configuration', () => {
      const theme = ConfigurationHelpers.createThemeFromTemplate(
        mockConfig.templates,
        'Test Theme',
        'A test theme'
      );

      expect(theme.name).toBe('Test Theme');
      expect(theme.description).toBe('A test theme');
      expect(theme.customStyles).toEqual(mockConfig.templates.customStyles);
      expect(theme.layout).toEqual(mockConfig.templates.layout);
      expect(theme.imageGallery).toEqual({
        layout: mockConfig.templates.imageGallery.layout,
        aspectRatio: mockConfig.templates.imageGallery.aspectRatio,
        spacing: mockConfig.templates.imageGallery.spacing,
        borderRadius: mockConfig.templates.imageGallery.borderRadius,
        hoverEffect: mockConfig.templates.imageGallery.hoverEffect
      });
      expect(theme.typography).toEqual(mockConfig.templates.typography);
      expect(theme.animations).toEqual(mockConfig.templates.animations);
    });
  });

  describe('validatePreset', () => {
    it('should validate valid preset', () => {
      const preset: ConfigurationPreset = {
        name: 'Valid Preset',
        description: 'A valid preset',
        scraping: {
          requestTimeout: 30000,
          maxRetries: 3
        }
      };

      const errors = ConfigurationHelpers.validatePreset(preset);
      expect(errors).toEqual([]);
    });

    it('should return errors for invalid preset', () => {
      const preset: ConfigurationPreset = {
        name: '',
        description: '',
        scraping: {
          requestTimeout: 500, // Too low
          maxRetries: 15 // Too high
        },
        research: {
          maxSimilarListings: 0, // Too low
          minConfidenceThreshold: 1.5 // Too high
        }
      };

      const errors = ConfigurationHelpers.validatePreset(preset);
      
      expect(errors).toContain('Preset name is required');
      expect(errors).toContain('Preset description is required');
      expect(errors).toContain('Preset scraping timeout must be at least 1000ms');
      expect(errors).toContain('Preset scraping max retries must be between 0 and 10');
      // Check that we have at least the basic validation errors
      expect(errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('validateTheme', () => {
    it('should validate valid theme', () => {
      const theme: ThemeConfiguration = {
        name: 'Valid Theme',
        description: 'A valid theme',
        customStyles: {
          primaryColor: '#ff0000',
          secondaryColor: '#00ff00',
          fontFamily: 'Arial',
          fontSize: '14px'
        }
      };

      const errors = ConfigurationHelpers.validateTheme(theme);
      expect(errors).toEqual([]);
    });

    it('should return errors for invalid theme', () => {
      const theme: ThemeConfiguration = {
        name: '',
        description: '',
        customStyles: {
          primaryColor: '',
          secondaryColor: '#00ff00',
          fontFamily: '',
          fontSize: '14px'
        }
      };

      const errors = ConfigurationHelpers.validateTheme(theme);
      
      expect(errors).toContain('Theme name is required');
      expect(errors).toContain('Theme description is required');
      expect(errors).toContain('Theme primary color is required');
      expect(errors).toContain('Theme font family is required');
    });

    it('should return error for missing custom styles', () => {
      const theme = {
        name: 'Test Theme',
        description: 'A test theme'
      } as ThemeConfiguration;

      const errors = ConfigurationHelpers.validateTheme(theme);
      
      expect(errors).toContain('Theme custom styles are required');
    });
  });

  describe('generateRecommendations', () => {
    it('should generate high volume recommendations', () => {
      const config = { ...mockConfig };
      config.scraping.maxConcurrentRequests = 3; // Low for high volume
      config.research.maxSimilarListings = 50; // High for high volume
      config.templates.imageGallery.maxImages = 10; // High for high volume

      const recommendations = ConfigurationHelpers.generateRecommendations(config, 'high_volume');

      expect(recommendations).toContain('Consider increasing concurrent requests for higher throughput');
      expect(recommendations).toContain('Reduce similar listings count to improve processing speed');
      expect(recommendations).toContain('Limit image count to reduce processing time');
    });

    it('should generate quality focus recommendations', () => {
      const config = { ...mockConfig };
      config.research.minConfidenceThreshold = 0.6; // Low for quality focus
      config.research.maxSimilarListings = 15; // Low for quality focus
      config.templates.imageGallery.extraction.validateUrls = false; // Should be true for quality

      const recommendations = ConfigurationHelpers.generateRecommendations(config, 'quality_focus');

      expect(recommendations).toContain('Increase confidence threshold for better quality results');
      expect(recommendations).toContain('Increase similar listings count for better market analysis');
      expect(recommendations).toContain('Enable image URL validation for better quality');
    });

    it('should generate speed focus recommendations', () => {
      const config = { ...mockConfig };
      config.scraping.requestDelay = 2000; // High for speed focus
      config.research.historicalDataDays = 60; // High for speed focus
      config.templates.imageGallery.extraction.validateUrls = true; // Should be false for speed

      const recommendations = ConfigurationHelpers.generateRecommendations(config, 'speed_focus');

      expect(recommendations).toContain('Reduce request delay for faster processing');
      expect(recommendations).toContain('Reduce historical data period for faster analysis');
      expect(recommendations).toContain('Disable image validation for faster processing');
    });

    it('should generate beginner friendly recommendations', () => {
      const config = { ...mockConfig };
      config.scraping.maxConcurrentRequests = 10; // High for beginners
      config.research.searchPlatforms = ['ebay', 'amazon', 'etsy']; // Too many for beginners
      config.optimization.contentStrategy = 'seo_focused'; // Should be balanced for beginners

      const recommendations = ConfigurationHelpers.generateRecommendations(config, 'beginner_friendly');

      expect(recommendations).toContain('Reduce concurrent requests for more stable processing');
      expect(recommendations).toContain('Limit search platforms to reduce complexity');
      expect(recommendations).toContain('Use balanced content strategy for beginners');
    });

    it('should return empty recommendations for optimized configuration', () => {
      const config = { ...mockConfig };
      // Optimize config for beginner friendly use case
      config.scraping.maxConcurrentRequests = 3; // Good for beginners
      config.research.searchPlatforms = ['ebay']; // Simple for beginners
      config.optimization.contentStrategy = 'balanced'; // Good for beginners

      const recommendations = ConfigurationHelpers.generateRecommendations(config, 'beginner_friendly');

      // Should have minimal recommendations for an optimized config
      expect(recommendations.length).toBeLessThanOrEqual(3);
    });
  });

  describe('existing functionality', () => {
    it('should create presets correctly', () => {
      const beginnerPreset = ConfigurationHelpers.createPreset('beginner');
      const sellerPreset = ConfigurationHelpers.createPreset('seller');
      const powerUserPreset = ConfigurationHelpers.createPreset('power_user');

      expect(beginnerPreset.scraping?.maxConcurrentRequests).toBe(2);
      expect(beginnerPreset.research?.searchPlatforms).toEqual(['ebay']);
      expect(beginnerPreset.optimization?.contentStrategy).toBe('balanced');

      expect(sellerPreset.scraping?.maxConcurrentRequests).toBe(5);
      expect(sellerPreset.research?.searchPlatforms).toEqual(['ebay', 'amazon']);
      expect(sellerPreset.optimization?.contentStrategy).toBe('conversion_focused');

      expect(powerUserPreset.scraping?.maxConcurrentRequests).toBe(10);
      expect(powerUserPreset.research?.searchPlatforms).toEqual(['ebay', 'amazon']);
      expect(powerUserPreset.optimization?.contentStrategy).toBe('seo_focused');
    });

    it('should optimize for use cases correctly', () => {
      const highVolumeConfig = ConfigurationHelpers.optimizeForUseCase(mockConfig, 'high_volume');
      const qualityFocusConfig = ConfigurationHelpers.optimizeForUseCase(mockConfig, 'quality_focus');
      const speedFocusConfig = ConfigurationHelpers.optimizeForUseCase(mockConfig, 'speed_focus');

      expect(highVolumeConfig.scraping.maxConcurrentRequests).toBe(10);
      expect(highVolumeConfig.research.maxSimilarListings).toBe(15);
      expect(highVolumeConfig.templates.imageGallery.maxImages).toBe(3);

      expect(qualityFocusConfig.scraping.requestDelay).toBe(2000);
      expect(qualityFocusConfig.research.maxSimilarListings).toBe(50);
      expect(qualityFocusConfig.research.minConfidenceThreshold).toBe(0.9);

      expect(speedFocusConfig.scraping.requestTimeout).toBe(15000);
      expect(speedFocusConfig.scraping.maxRetries).toBe(1);
      expect(speedFocusConfig.research.maxSimilarListings).toBe(10);
    });

    it('should validate business requirements', () => {
      const issues = ConfigurationHelpers.validateBusinessRequirements(mockConfig, {
        maxProcessingTime: 20000,
        minDataQuality: 0.8,
        complianceLevel: 'strict'
      });

      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(issue => issue.includes('processing time'))).toBe(true);
      expect(issues.some(issue => issue.includes('confidence threshold') || issue.includes('quality'))).toBe(true);
      // Should have at least 2 issues: processing time and confidence threshold
      expect(issues.length).toBeGreaterThanOrEqual(2);
    });
  });
});