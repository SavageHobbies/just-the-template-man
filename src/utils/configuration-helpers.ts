import { 
  SystemConfiguration, 
  ConfigurationPreset, 
  ThemeConfiguration,
  ConfigurationValidationResult
} from '../models/configuration';

/**
 * Configuration helper utilities for common configuration tasks
 */
export class ConfigurationHelpers {
  /**
   * Creates a configuration preset for different user types
   */
  static createPreset(presetType: 'beginner' | 'seller' | 'power_user'): Partial<SystemConfiguration> {
    switch (presetType) {
      case 'beginner':
        return this.createBeginnerPreset();
      case 'seller':
        return this.createSellerPreset();
      case 'power_user':
        return this.createPowerUserPreset();
      default:
        throw new Error(`Unknown preset type: ${presetType}`);
    }
  }

  /**
   * Validates configuration compatibility between versions
   */
  static validateVersionCompatibility(config: SystemConfiguration, targetVersion: string): string[] {
    const issues: string[] = [];
    
    if (config.version !== targetVersion) {
      issues.push(`Configuration version ${config.version} may not be compatible with target version ${targetVersion}`);
    }
    
    // Add specific version compatibility checks here
    if (config.version === '1.0.0' && targetVersion === '2.0.0') {
      // Example: Check for deprecated fields
      if ('deprecatedField' in config) {
        issues.push('Configuration contains deprecated fields that need migration');
      }
    }
    
    return issues;
  }

  /**
   * Migrates configuration from one version to another
   */
  static migrateConfiguration(config: SystemConfiguration, targetVersion: string): SystemConfiguration {
    const migratedConfig = { ...config };
    
    // Perform version-specific migrations
    if (config.version === '1.0.0' && targetVersion === '1.1.0') {
      // Example migration logic
      migratedConfig.version = targetVersion;
      migratedConfig.lastUpdated = new Date();
    } else if (config.version === '0.9.0' && targetVersion === '1.1.0') {
      // Migration from 0.9.0 to 1.1.0
      migratedConfig.version = targetVersion;
      migratedConfig.lastUpdated = new Date();
    } else {
      // Default migration - just update version and timestamp
      migratedConfig.version = targetVersion;
      migratedConfig.lastUpdated = new Date();
    }
    
    return migratedConfig;
  }

  /**
   * Optimizes configuration for specific use cases
   */
  static optimizeForUseCase(
    config: SystemConfiguration,
    useCase: 'high_volume' | 'quality_focus' | 'speed_focus'
  ): SystemConfiguration {
    const optimizedConfig = JSON.parse(JSON.stringify(config)); // Deep copy
    
    switch (useCase) {
      case 'high_volume':
        optimizedConfig.scraping.maxConcurrentRequests = 10;
        optimizedConfig.scraping.requestDelay = 500;
        optimizedConfig.research.maxSimilarListings = 15;
        optimizedConfig.templates.imageGallery.maxImages = 3;
        break;
        
      case 'quality_focus':
        optimizedConfig.scraping.requestDelay = 2000;
        optimizedConfig.research.maxSimilarListings = 50;
        optimizedConfig.research.minConfidenceThreshold = 0.9;
        optimizedConfig.templates.imageGallery.maxImages = 10;
        break;
        
      case 'speed_focus':
        optimizedConfig.scraping.requestTimeout = 15000;
        optimizedConfig.scraping.maxRetries = 1;
        optimizedConfig.research.maxSimilarListings = 10;
        optimizedConfig.research.historicalDataDays = 14;
        break;
    }
    
    return optimizedConfig;
  }

  /**
   * Validates configuration for specific business requirements
   */
  static validateBusinessRequirements(
    config: SystemConfiguration,
    requirements: {
      maxProcessingTime?: number;
      minDataQuality?: number;
      complianceLevel?: 'basic' | 'strict';
    }
  ): string[] {
    const issues: string[] = [];
    
    if (requirements.maxProcessingTime) {
      const estimatedTime = this.estimateProcessingTime(config);
      if (estimatedTime > requirements.maxProcessingTime) {
        issues.push(`Estimated processing time (${estimatedTime}ms) exceeds requirement (${requirements.maxProcessingTime}ms)`);
      }
    }
    
    if (requirements.minDataQuality) {
      if (config.research.minConfidenceThreshold < requirements.minDataQuality) {
        issues.push(`Minimum confidence threshold (${config.research.minConfidenceThreshold}) below required quality (${requirements.minDataQuality})`);
      }
    }
    
    if (requirements.complianceLevel === 'strict') {
      if (config.scraping.requestDelay < 2000) {
        issues.push('Request delay too low for strict compliance requirements');
      }
      if (config.scraping.maxConcurrentRequests > 3) {
        issues.push('Too many concurrent requests for strict compliance');
      }
    }
    
    return issues;
  }

  /**
   * Estimates processing time based on configuration
   */
  static estimateProcessingTime(config: SystemConfiguration): number {
    const baseTime = 5000; // Base processing time in ms
    const scrapingTime = config.scraping.requestTimeout + config.scraping.requestDelay;
    const researchTime = config.research.maxSimilarListings * 100; // Estimate 100ms per listing
    const imageTime = config.templates.imageGallery.maxImages * 200; // Estimate 200ms per image
    
    return baseTime + scrapingTime + researchTime + imageTime;
  }

  /**
   * Creates configuration diff between two configurations
   */
  static createConfigurationDiff(
    oldConfig: SystemConfiguration,
    newConfig: SystemConfiguration
  ): Record<string, { old: any; new: any }> {
    const diff: Record<string, { old: any; new: any }> = {};
    
    // Compare top-level sections
    const sections = ['scraping', 'research', 'pricing', 'keywords', 'templates', 'optimization', 'userPreferences'] as const;
    
    for (const section of sections) {
      const oldSection = oldConfig[section];
      const newSection = newConfig[section];
      
      if (JSON.stringify(oldSection) !== JSON.stringify(newSection)) {
        diff[section] = { old: oldSection, new: newSection };
      }
    }
    
    return diff;
  }

  /**
   * Creates a configuration preset from current configuration
   */
  static createPresetFromConfiguration(
    config: SystemConfiguration,
    name: string,
    description: string
  ): ConfigurationPreset {
    return {
      name,
      description,
      scraping: config.scraping,
      research: config.research,
      pricing: config.pricing,
      keywords: config.keywords,
      templates: config.templates,
      optimization: config.optimization,
      userPreferences: config.userPreferences
    };
  }

  /**
   * Creates a theme from template configuration
   */
  static createThemeFromTemplate(
    templateConfig: SystemConfiguration['templates'],
    name: string,
    description: string
  ): ThemeConfiguration {
    return {
      name,
      description,
      customStyles: templateConfig.customStyles,
      layout: templateConfig.layout,
      imageGallery: {
        layout: templateConfig.imageGallery.layout,
        aspectRatio: templateConfig.imageGallery.aspectRatio,
        spacing: templateConfig.imageGallery.spacing,
        borderRadius: templateConfig.imageGallery.borderRadius,
        hoverEffect: templateConfig.imageGallery.hoverEffect
      },
      typography: templateConfig.typography,
      animations: templateConfig.animations
    };
  }

  /**
   * Validates preset configuration
   */
  static validatePreset(preset: ConfigurationPreset): string[] {
    const errors: string[] = [];
    
    if (!preset.name || preset.name.trim().length === 0) {
      errors.push('Preset name is required');
    }
    
    if (!preset.description || preset.description.trim().length === 0) {
      errors.push('Preset description is required');
    }
    
    // Validate individual sections if present
    if (preset.scraping) {
      if (preset.scraping.requestTimeout && preset.scraping.requestTimeout < 1000) {
        errors.push('Preset scraping timeout must be at least 1000ms');
      }
      if (preset.scraping.maxRetries && (preset.scraping.maxRetries < 0 || preset.scraping.maxRetries > 10)) {
        errors.push('Preset scraping max retries must be between 0 and 10');
      }
    }
    
    if (preset.research) {
      if (preset.research.maxSimilarListings && (preset.research.maxSimilarListings < 1 || preset.research.maxSimilarListings > 100)) {
        errors.push('Preset research max similar listings must be between 1 and 100');
      }
      if (preset.research.minConfidenceThreshold && (preset.research.minConfidenceThreshold < 0 || preset.research.minConfidenceThreshold > 1)) {
        errors.push('Preset research confidence threshold must be between 0 and 1');
      }
    }
    
    return errors;
  }

  /**
   * Validates theme configuration
   */
  static validateTheme(theme: ThemeConfiguration): string[] {
    const errors: string[] = [];
    
    if (!theme.name || theme.name.trim().length === 0) {
      errors.push('Theme name is required');
    }
    
    if (!theme.description || theme.description.trim().length === 0) {
      errors.push('Theme description is required');
    }
    
    if (!theme.customStyles) {
      errors.push('Theme custom styles are required');
    } else {
      if (!theme.customStyles.primaryColor) {
        errors.push('Theme primary color is required');
      }
      if (!theme.customStyles.fontFamily) {
        errors.push('Theme font family is required');
      }
    }
    
    return errors;
  }

  /**
   * Generates configuration recommendations based on use case
   */
  static generateRecommendations(
    config: SystemConfiguration,
    useCase: 'high_volume' | 'quality_focus' | 'speed_focus' | 'beginner_friendly'
  ): string[] {
    const recommendations: string[] = [];
    
    switch (useCase) {
      case 'high_volume':
        if (config.scraping.maxConcurrentRequests < 10) {
          recommendations.push('Consider increasing concurrent requests for higher throughput');
        }
        if (config.research.maxSimilarListings > 20) {
          recommendations.push('Reduce similar listings count to improve processing speed');
        }
        if (config.templates.imageGallery.maxImages > 5) {
          recommendations.push('Limit image count to reduce processing time');
        }
        break;
        
      case 'quality_focus':
        if (config.research.minConfidenceThreshold < 0.8) {
          recommendations.push('Increase confidence threshold for better quality results');
        }
        if (config.research.maxSimilarListings < 30) {
          recommendations.push('Increase similar listings count for better market analysis');
        }
        if (!config.templates.imageGallery.extraction.validateUrls) {
          recommendations.push('Enable image URL validation for better quality');
        }
        break;
        
      case 'speed_focus':
        if (config.scraping.requestDelay > 1000) {
          recommendations.push('Reduce request delay for faster processing');
        }
        if (config.research.historicalDataDays > 30) {
          recommendations.push('Reduce historical data period for faster analysis');
        }
        if (config.templates.imageGallery.extraction.validateUrls) {
          recommendations.push('Disable image validation for faster processing');
        }
        break;
        
      case 'beginner_friendly':
        if (config.scraping.maxConcurrentRequests > 3) {
          recommendations.push('Reduce concurrent requests for more stable processing');
        }
        if (config.research.searchPlatforms.length > 2) {
          recommendations.push('Limit search platforms to reduce complexity');
        }
        if (config.optimization.contentStrategy !== 'balanced') {
          recommendations.push('Use balanced content strategy for beginners');
        }
        break;
    }
    
    return recommendations;
  }

  private static createBeginnerPreset(): Partial<SystemConfiguration> {
    return {
      scraping: {
        requestTimeout: 30000,
        requestDelay: 2000,
        maxRetries: 3,
        maxConcurrentRequests: 2,
        useProxyRotation: false,
        proxyServers: [],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      research: {
        maxSimilarListings: 15,
        historicalDataDays: 30,
        minConfidenceThreshold: 0.6,
        searchPlatforms: ['ebay'],
        excludeKeywords: ['broken', 'damaged', 'parts', 'repair'],
        dataSourceWeights: { ebay: 1.0, amazon: 0.0, other: 0.0 },
        insufficientDataHandling: {
          enableAutoExpansion: false, // Conservative for beginners
          minListingsThreshold: 3,
          fallbackPlatforms: ['amazon'],
          relaxExcludeKeywords: false,
          extendHistoricalDays: 45,
          fallbackConfidenceThreshold: 0.5
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
      }
    };
  }

  private static createSellerPreset(): Partial<SystemConfiguration> {
    return {
      scraping: {
        requestTimeout: 45000,
        requestDelay: 1500,
        maxRetries: 5,
        maxConcurrentRequests: 5,
        useProxyRotation: false,
        proxyServers: [],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      research: {
        maxSimilarListings: 30,
        historicalDataDays: 45,
        minConfidenceThreshold: 0.75,
        searchPlatforms: ['ebay', 'amazon'],
        excludeKeywords: ['broken', 'damaged', 'parts', 'repair', 'untested'],
        dataSourceWeights: { ebay: 0.7, amazon: 0.3, other: 0.0 },
        insufficientDataHandling: {
          enableAutoExpansion: true,
          minListingsThreshold: 8,
          fallbackPlatforms: ['etsy', 'mercari'],
          relaxExcludeKeywords: true,
          extendHistoricalDays: 75,
          fallbackConfidenceThreshold: 0.6
        }
      },
      pricing: {
        algorithm: 'competitive',
        strategy: 'moderate',
        marginPercentage: 18,
        minPrice: 5,
        maxPrice: 2000,
        weights: {
          marketAverage: 0.4,
          competitorPricing: 0.35,
          historicalSales: 0.2,
          condition: 0.05
        },
        advanced: {
          enableDynamicPricing: true,
          trendAnalysisDays: 14,
          trendAdjustmentFactor: 1.2,
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
      optimization: {
        contentStrategy: 'conversion_focused',
        titleOptimization: 'keyword_heavy',
        descriptionStyle: 'bullet_points',
        pricingApproach: 'competitive',
        targetAudience: 'bargain_hunters',
        goals: {
          maximizeVisibility: true,
          maximizeConversion: true,
          maximizeProfit: true
        }
      }
    };
  }

  private static createPowerUserPreset(): Partial<SystemConfiguration> {
    return {
      scraping: {
        requestTimeout: 60000,
        requestDelay: 800,
        maxRetries: 7,
        maxConcurrentRequests: 10,
        useProxyRotation: true,
        proxyServers: [],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      research: {
        maxSimilarListings: 50,
        historicalDataDays: 90,
        minConfidenceThreshold: 0.85,
        searchPlatforms: ['ebay', 'amazon'],
        excludeKeywords: ['broken', 'damaged', 'parts', 'repair', 'untested', 'as-is'],
        dataSourceWeights: { ebay: 0.6, amazon: 0.35, other: 0.05 },
        insufficientDataHandling: {
          enableAutoExpansion: true,
          minListingsThreshold: 15,
          fallbackPlatforms: ['etsy', 'mercari', 'facebook', 'poshmark'],
          relaxExcludeKeywords: true,
          extendHistoricalDays: 120,
          fallbackConfidenceThreshold: 0.7
        }
      },
      pricing: {
        algorithm: 'premium',
        strategy: 'aggressive',
        marginPercentage: 25,
        minPrice: 1,
        maxPrice: 10000,
        weights: {
          marketAverage: 0.3,
          competitorPricing: 0.4,
          historicalSales: 0.25,
          condition: 0.05
        },
        advanced: {
          enableDynamicPricing: true,
          trendAnalysisDays: 21,
          trendAdjustmentFactor: 1.3,
          seasonalAdjustments: {
            enabled: true,
            peakSeasonMultiplier: 1.4,
            offSeasonMultiplier: 0.8
          },
          competitiveThresholds: {
            competitiveThreshold: 0.03,
            premiumThreshold: 0.2
          }
        }
      },
      keywords: {
        titleWeight: 0.5,
        descriptionWeight: 0.25,
        categoryWeight: 0.1,
        brandWeight: 0.1,
        conditionWeight: 0.05,
        minFrequencyThreshold: 1,
        maxKeywords: 35,
        trendingBoost: 1.8
      },
      templates: {
        imageGallery: {
          maxImages: 12,
          imageSize: 'large',
          showThumbnails: true,
          enableZoom: true,
          extraction: {
            prioritizeHighRes: true,
            minDimensions: {
              width: 500,
              height: 500
            },
            qualityPreferences: ['/s-l1600.jpg', '/s-l1200.jpg', '/s-l800.jpg'],
            validateUrls: true,
            validationTimeout: 3000,
            fallbackSources: ['main-image', 'gallery-images', 'thumbnail-images', 'description-images']
          }
        }
      } as any,
      optimization: {
        contentStrategy: 'seo_focused',
        titleOptimization: 'keyword_heavy',
        descriptionStyle: 'detailed',
        pricingApproach: 'premium',
        targetAudience: 'brand_conscious',
        goals: {
          maximizeVisibility: true,
          maximizeConversion: false,
          maximizeProfit: true
        }
      }
    };
  }
}