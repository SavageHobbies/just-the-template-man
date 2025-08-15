import { promises as fs } from 'fs';
import { join } from 'path';
import {
  SystemConfiguration,
  ScrapingConfig,
  ResearchConfig,
  PricingAlgorithmConfig,
  KeywordWeightingConfig,
  TemplateConfig,
  OptimizationStrategyConfig,
  UserPreferences,
  ConfigurationPreset,
  ThemeConfiguration,
  ConfigurationValidationResult
} from '../models/configuration';
import { getLogger } from '../utils/logger';

export interface ConfigurationService {
  /**
   * Loads the system configuration from file
   * @param configPath - Optional path to configuration file
   * @returns Promise containing the loaded configuration
   */
  loadConfiguration(configPath?: string): Promise<SystemConfiguration>;

  /**
   * Saves the system configuration to file
   * @param config - The configuration to save
   * @param configPath - Optional path to save configuration file
   */
  saveConfiguration(config: SystemConfiguration, configPath?: string): Promise<void>;

  /**
   * Gets the default configuration
   * @returns Default system configuration
   */
  getDefaultConfiguration(): SystemConfiguration;

  /**
   * Validates configuration structure and values
   * @param config - Configuration to validate
   * @returns Array of validation errors (empty if valid)
   */
  validateConfiguration(config: SystemConfiguration): string[];

  /**
   * Merges user configuration with defaults
   * @param userConfig - Partial user configuration
   * @param defaultConfig - Default configuration
   * @returns Merged configuration
   */
  mergeConfiguration(
    userConfig: Partial<SystemConfiguration>,
    defaultConfig: SystemConfiguration
  ): SystemConfiguration;

  /**
   * Updates specific configuration section
   * @param section - Configuration section to update
   * @param updates - Updates to apply
   */
  updateConfigurationSection<T extends keyof SystemConfiguration>(
    section: T,
    updates: Partial<SystemConfiguration[T]>
  ): Promise<void>;

  /**
   * Loads a configuration preset
   * @param presetName - Name of the preset to load
   * @returns Promise containing the preset configuration
   */
  loadPreset(presetName: string): Promise<ConfigurationPreset>;

  /**
   * Gets list of available presets
   * @returns Promise containing array of preset names
   */
  getAvailablePresets(): Promise<string[]>;

  /**
   * Applies a preset to the current configuration
   * @param presetName - Name of the preset to apply
   * @returns Promise containing the updated configuration
   */
  applyPreset(presetName: string): Promise<SystemConfiguration>;

  /**
   * Loads a theme configuration
   * @param themeName - Name of the theme to load
   * @returns Promise containing the theme configuration
   */
  loadTheme(themeName: string): Promise<ThemeConfiguration>;

  /**
   * Gets list of available themes
   * @returns Promise containing array of theme names
   */
  getAvailableThemes(): Promise<string[]>;

  /**
   * Applies a theme to the current configuration
   * @param themeName - Name of the theme to apply
   * @returns Promise containing the updated configuration
   */
  applyTheme(themeName: string): Promise<SystemConfiguration>;

  /**
   * Validates configuration with detailed results
   * @param config - Configuration to validate
   * @returns Detailed validation results
   */
  validateConfigurationDetailed(config: SystemConfiguration): ConfigurationValidationResult;
}

export class FileBasedConfigurationService implements ConfigurationService {
  private readonly logger = getLogger();
  private readonly defaultConfigPath = join(process.cwd(), 'config', 'default.json');
  private readonly userConfigPath = join(process.cwd(), 'config', 'user.json');
  private cachedConfig: SystemConfiguration | null = null;

  async loadConfiguration(configPath?: string): Promise<SystemConfiguration> {
    const path = configPath || this.userConfigPath;
    
    try {
      // Try to load user configuration
      const configData = await fs.readFile(path, 'utf-8');
      const userConfig = JSON.parse(configData) as Partial<SystemConfiguration>;
      
      // Merge with defaults
      const defaultConfig = this.getDefaultConfiguration();
      const mergedConfig = this.mergeConfiguration(userConfig, defaultConfig);
      
      // Validate configuration
      const errors = this.validateConfiguration(mergedConfig);
      if (errors.length > 0) {
        this.logger.warn('Configuration validation errors:', errors);
        // Use defaults for invalid sections
        return defaultConfig;
      }
      
      this.cachedConfig = mergedConfig;
      this.logger.info('Configuration loaded successfully');
      return mergedConfig;
      
    } catch (error) {
      this.logger.warn('Failed to load user configuration, using defaults:', { error });
      const defaultConfig = this.getDefaultConfiguration();
      this.cachedConfig = defaultConfig;
      return defaultConfig;
    }
  }

  async saveConfiguration(config: SystemConfiguration, configPath?: string): Promise<void> {
    const path = configPath || this.userConfigPath;
    
    // Validate before saving
    const errors = this.validateConfiguration(config);
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
    
    try {
      // Ensure config directory exists
      const configDir = join(process.cwd(), 'config');
      await fs.mkdir(configDir, { recursive: true });
      
      // Update timestamp
      config.lastUpdated = new Date();
      
      // Save configuration
      await fs.writeFile(path, JSON.stringify(config, null, 2), 'utf-8');
      this.cachedConfig = config;
      this.logger.info('Configuration saved successfully');
      
    } catch (error) {
      this.logger.error('Failed to save configuration', error as Error);
      throw error;
    }
  }

  getDefaultConfiguration(): SystemConfiguration {
    return {
      scraping: this.getDefaultScrapingConfig(),
      research: this.getDefaultResearchConfig(),
      pricing: this.getDefaultPricingConfig(),
      keywords: this.getDefaultKeywordConfig(),
      templates: this.getDefaultTemplateConfig(),
      optimization: this.getDefaultOptimizationConfig(),
      userPreferences: this.getDefaultUserPreferences(),
      version: '1.0.0',
      lastUpdated: new Date()
    };
  }

  validateConfiguration(config: SystemConfiguration): string[] {
    const errors: string[] = [];
    
    // Validate scraping config
    if (config.scraping.requestTimeout < 1000) {
      errors.push('Scraping request timeout must be at least 1000ms');
    }
    if (config.scraping.maxRetries < 0 || config.scraping.maxRetries > 10) {
      errors.push('Scraping max retries must be between 0 and 10');
    }
    
    // Validate research config
    if (config.research.maxSimilarListings < 1 || config.research.maxSimilarListings > 100) {
      errors.push('Max similar listings must be between 1 and 100');
    }
    if (config.research.minConfidenceThreshold < 0 || config.research.minConfidenceThreshold > 1) {
      errors.push('Min confidence threshold must be between 0 and 1');
    }
    if (config.research.insufficientDataHandling.minListingsThreshold < 1) {
      errors.push('Minimum listings threshold must be at least 1');
    }
    if (config.research.insufficientDataHandling.fallbackConfidenceThreshold < 0 || 
        config.research.insufficientDataHandling.fallbackConfidenceThreshold > 1) {
      errors.push('Fallback confidence threshold must be between 0 and 1');
    }
    
    // Validate pricing config
    if (config.pricing.marginPercentage < 0 || config.pricing.marginPercentage > 100) {
      errors.push('Margin percentage must be between 0 and 100');
    }
    if (config.pricing.minPrice < 0) {
      errors.push('Minimum price must be non-negative');
    }
    if (config.pricing.maxPrice < config.pricing.minPrice) {
      errors.push('Maximum price must be greater than minimum price');
    }
    
    // Validate keyword config
    if (config.keywords.maxKeywords < 1 || config.keywords.maxKeywords > 50) {
      errors.push('Max keywords must be between 1 and 50');
    }
    
    // Validate template config
    if (config.templates.imageGallery.maxImages < 1 || config.templates.imageGallery.maxImages > 20) {
      errors.push('Max images must be between 1 and 20');
    }
    if (config.templates.imageGallery.extraction.validationTimeout < 1000) {
      errors.push('Image validation timeout must be at least 1000ms');
    }
    if (config.templates.imageGallery.extraction.minDimensions.width < 100 || 
        config.templates.imageGallery.extraction.minDimensions.height < 100) {
      errors.push('Minimum image dimensions must be at least 100x100 pixels');
    }
    
    // Validate pricing config advanced settings
    if (config.pricing.advanced.trendAnalysisDays < 1 || config.pricing.advanced.trendAnalysisDays > 365) {
      errors.push('Trend analysis days must be between 1 and 365');
    }
    if (config.pricing.advanced.trendAdjustmentFactor < 0.5 || config.pricing.advanced.trendAdjustmentFactor > 3.0) {
      errors.push('Trend adjustment factor must be between 0.5 and 3.0');
    }
    
    return errors;
  }

  mergeConfiguration(
    userConfig: Partial<SystemConfiguration>,
    defaultConfig: SystemConfiguration
  ): SystemConfiguration {
    return {
      scraping: { ...defaultConfig.scraping, ...userConfig.scraping },
      research: {
        ...defaultConfig.research,
        ...userConfig.research,
        insufficientDataHandling: {
          ...defaultConfig.research.insufficientDataHandling,
          ...userConfig.research?.insufficientDataHandling
        }
      },
      pricing: {
        ...defaultConfig.pricing,
        ...userConfig.pricing,
        advanced: {
          ...defaultConfig.pricing.advanced,
          ...userConfig.pricing?.advanced,
          seasonalAdjustments: {
            ...defaultConfig.pricing.advanced.seasonalAdjustments,
            ...userConfig.pricing?.advanced?.seasonalAdjustments
          },
          competitiveThresholds: {
            ...defaultConfig.pricing.advanced.competitiveThresholds,
            ...userConfig.pricing?.advanced?.competitiveThresholds
          }
        }
      },
      keywords: { ...defaultConfig.keywords, ...userConfig.keywords },
      templates: {
        ...defaultConfig.templates,
        ...userConfig.templates,
        customStyles: { ...defaultConfig.templates.customStyles, ...userConfig.templates?.customStyles },
        layout: { 
          ...defaultConfig.templates.layout, 
          ...(userConfig.templates?.layout || {})
        },
        imageGallery: {
          ...defaultConfig.templates.imageGallery,
          ...userConfig.templates?.imageGallery,
          extraction: {
            ...defaultConfig.templates.imageGallery.extraction,
            ...userConfig.templates?.imageGallery?.extraction,
            minDimensions: {
              ...defaultConfig.templates.imageGallery.extraction.minDimensions,
              ...userConfig.templates?.imageGallery?.extraction?.minDimensions
            }
          }
        },
        formatting: { ...defaultConfig.templates.formatting, ...userConfig.templates?.formatting },
        customization: { 
          ...defaultConfig.templates.customization, 
          ...(userConfig.templates?.customization || {})
        },
        typography: { ...defaultConfig.templates.typography, ...userConfig.templates?.typography },
        animations: { 
          ...defaultConfig.templates.animations, 
          ...(userConfig.templates?.animations || {})
        }
      },
      optimization: {
        ...defaultConfig.optimization,
        ...userConfig.optimization,
        goals: { ...defaultConfig.optimization.goals, ...userConfig.optimization?.goals }
      },
      userPreferences: {
        ...defaultConfig.userPreferences,
        ...userConfig.userPreferences,
        notifications: { ...defaultConfig.userPreferences.notifications, ...userConfig.userPreferences?.notifications },
        templatePreferences: { ...defaultConfig.userPreferences.templatePreferences, ...userConfig.userPreferences?.templatePreferences }
      },
      version: userConfig.version || defaultConfig.version,
      lastUpdated: new Date()
    };
  }

  async updateConfigurationSection<T extends keyof SystemConfiguration>(
    section: T,
    updates: Partial<SystemConfiguration[T]>
  ): Promise<void> {
    const currentConfig = this.cachedConfig || await this.loadConfiguration();
    const updatedConfig = {
      ...currentConfig,
      [section]: { ...(currentConfig[section] as any), ...updates }
    };
    
    await this.saveConfiguration(updatedConfig);
  }

  async loadPreset(presetName: string): Promise<ConfigurationPreset> {
    const presetPath = join(process.cwd(), 'config', 'presets', `${presetName}.json`);
    
    try {
      const presetData = await fs.readFile(presetPath, 'utf-8');
      const preset = JSON.parse(presetData) as ConfigurationPreset;
      this.logger.info(`Preset '${presetName}' loaded successfully`);
      return preset;
    } catch (error) {
      this.logger.error(`Failed to load preset '${presetName}'`, error as Error);
      throw new Error(`Preset '${presetName}' not found or invalid`);
    }
  }

  async getAvailablePresets(): Promise<string[]> {
    const presetsDir = join(process.cwd(), 'config', 'presets');
    
    try {
      const files = await fs.readdir(presetsDir);
      const presets = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
      
      this.logger.info(`Found ${presets.length} available presets`);
      return presets;
    } catch (error) {
      this.logger.warn('Failed to read presets directory', { error });
      return [];
    }
  }

  async applyPreset(presetName: string): Promise<SystemConfiguration> {
    const preset = await this.loadPreset(presetName);
    const currentConfig = this.cachedConfig || await this.loadConfiguration();
    
    // Merge preset with current configuration
    const updatedConfig = this.mergeConfiguration(preset as any, currentConfig);
    
    await this.saveConfiguration(updatedConfig);
    this.logger.info(`Preset '${presetName}' applied successfully`);
    
    return updatedConfig;
  }

  async loadTheme(themeName: string): Promise<ThemeConfiguration> {
    const themePath = join(process.cwd(), 'config', 'themes', `${themeName}.json`);
    
    try {
      const themeData = await fs.readFile(themePath, 'utf-8');
      const theme = JSON.parse(themeData) as ThemeConfiguration;
      this.logger.info(`Theme '${themeName}' loaded successfully`);
      return theme;
    } catch (error) {
      this.logger.error(`Failed to load theme '${themeName}'`, error as Error);
      throw new Error(`Theme '${themeName}' not found or invalid`);
    }
  }

  async getAvailableThemes(): Promise<string[]> {
    const themesDir = join(process.cwd(), 'config', 'themes');
    
    try {
      const files = await fs.readdir(themesDir);
      const themes = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
      
      this.logger.info(`Found ${themes.length} available themes`);
      return themes;
    } catch (error) {
      this.logger.warn('Failed to read themes directory', { error });
      return [];
    }
  }

  async applyTheme(themeName: string): Promise<SystemConfiguration> {
    const theme = await this.loadTheme(themeName);
    const currentConfig = this.cachedConfig || await this.loadConfiguration();
    
    // Apply theme to template configuration
    const updatedTemplateConfig = {
      ...currentConfig.templates,
      customStyles: { ...currentConfig.templates.customStyles, ...theme.customStyles },
      layout: { ...currentConfig.templates.layout, ...theme.layout },
      typography: { ...currentConfig.templates.typography, ...theme.typography },
      animations: { ...currentConfig.templates.animations, ...theme.animations }
    };
    
    if (theme.imageGallery) {
      updatedTemplateConfig.imageGallery = {
        ...currentConfig.templates.imageGallery,
        ...theme.imageGallery
      };
    }
    
    const updatedConfig = {
      ...currentConfig,
      templates: updatedTemplateConfig
    };
    
    await this.saveConfiguration(updatedConfig);
    this.logger.info(`Theme '${themeName}' applied successfully`);
    
    return updatedConfig;
  }

  validateConfigurationDetailed(config: SystemConfiguration): ConfigurationValidationResult {
    const errors = this.validateConfiguration(config);
    const warnings: string[] = [];
    
    // Add performance warnings
    if (config.scraping.maxConcurrentRequests > 10) {
      warnings.push('High concurrent request count may cause rate limiting');
    }
    
    if (config.research.maxSimilarListings > 50) {
      warnings.push('Large number of similar listings may slow processing');
    }
    
    if (config.templates.imageGallery.maxImages > 10) {
      warnings.push('Many images may increase template size and loading time');
    }
    
    // Calculate estimated processing time
    const estimatedProcessingTime = this.calculateProcessingTime(config);
    
    // Calculate completeness score
    const completenessScore = this.calculateCompletenessScore(config);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      estimatedProcessingTime,
      completenessScore
    };
  }

  private calculateProcessingTime(config: SystemConfiguration): number {
    const baseTime = 5000; // Base processing time in ms
    const scrapingTime = config.scraping.requestTimeout + (config.scraping.requestDelay * 2);
    const researchTime = config.research.maxSimilarListings * 150; // Estimate 150ms per listing
    const imageTime = config.templates.imageGallery.maxImages * 300; // Estimate 300ms per image
    const validationTime = config.templates.imageGallery.extraction.validateUrls ? 
      config.templates.imageGallery.maxImages * config.templates.imageGallery.extraction.validationTimeout : 0;
    
    return baseTime + scrapingTime + researchTime + imageTime + validationTime;
  }

  private calculateCompletenessScore(config: SystemConfiguration): number {
    let score = 0;
    let maxScore = 0;
    
    // Check scraping configuration completeness
    maxScore += 6;
    if (config.scraping.requestTimeout > 0) score += 1;
    if (config.scraping.requestDelay > 0) score += 1;
    if (config.scraping.maxRetries >= 0) score += 1;
    if (config.scraping.userAgent.length > 0) score += 1;
    if (config.scraping.maxConcurrentRequests > 0) score += 1;
    if (config.scraping.proxyServers !== undefined) score += 1;
    
    // Check research configuration completeness
    maxScore += 5;
    if (config.research.maxSimilarListings > 0) score += 1;
    if (config.research.historicalDataDays > 0) score += 1;
    if (config.research.minConfidenceThreshold >= 0 && config.research.minConfidenceThreshold <= 1) score += 1;
    if (config.research.searchPlatforms.length > 0) score += 1;
    if (config.research.excludeKeywords.length >= 0) score += 1;
    
    // Check pricing configuration completeness
    maxScore += 4;
    if (config.pricing.algorithm) score += 1;
    if (config.pricing.strategy) score += 1;
    if (config.pricing.marginPercentage >= 0) score += 1;
    if (config.pricing.minPrice >= 0 && config.pricing.maxPrice > config.pricing.minPrice) score += 1;
    
    // Check template configuration completeness
    maxScore += 3;
    if (config.templates.defaultTemplate.length > 0) score += 1;
    if (config.templates.availableTemplates.length > 0) score += 1;
    if (config.templates.imageGallery.maxImages > 0) score += 1;
    
    return score / maxScore;
  }

  private getDefaultScrapingConfig(): ScrapingConfig {
    return {
      requestTimeout: 30000,
      requestDelay: 1000,
      maxRetries: 3,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      useProxyRotation: false,
      proxyServers: [],
      maxConcurrentRequests: 5
    };
  }

  private getDefaultResearchConfig(): ResearchConfig {
    return {
      maxSimilarListings: 20,
      historicalDataDays: 30,
      minConfidenceThreshold: 0.7,
      searchPlatforms: ['ebay', 'amazon'],
      excludeKeywords: ['broken', 'damaged', 'parts', 'repair'],
      dataSourceWeights: {
        ebay: 0.6,
        amazon: 0.3,
        other: 0.1
      },
      insufficientDataHandling: {
        enableAutoExpansion: true,
        minListingsThreshold: 5,
        fallbackPlatforms: ['etsy', 'mercari', 'facebook'],
        relaxExcludeKeywords: true,
        extendHistoricalDays: 60,
        fallbackConfidenceThreshold: 0.5
      }
    };
  }

  private getDefaultPricingConfig(): PricingAlgorithmConfig {
    return {
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
    };
  }

  private getDefaultKeywordConfig(): KeywordWeightingConfig {
    return {
      titleWeight: 0.4,
      descriptionWeight: 0.3,
      categoryWeight: 0.1,
      brandWeight: 0.1,
      conditionWeight: 0.1,
      minFrequencyThreshold: 2,
      maxKeywords: 20,
      trendingBoost: 1.2
    };
  }

  private getDefaultTemplateConfig(): TemplateConfig {
    return {
      defaultTemplate: 'final-ebay-template.html',
      availableTemplates: ['final-ebay-template.html', 'product-listing-template.html'],
      customStyles: {
        primaryColor: '#0066cc',
        secondaryColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        headerBackground: '#f8f9fa',
        textColor: '#333333',
        linkColor: '#0066cc',
        buttonColor: '#28a745',
        warningColor: '#ffc107',
        errorColor: '#dc3545'
      },
      layout: {
        containerWidth: '100%',
        maxWidth: '1200px',
        padding: '20px',
        margin: '0 auto',
        responsive: true,
        mobileBreakpoint: '768px'
      },
      imageGallery: {
        maxImages: 5,
        imageSize: 'medium',
        showThumbnails: true,
        enableZoom: false,
        layout: 'grid',
        aspectRatio: '1:1',
        spacing: '10px',
        borderRadius: '8px',
        extraction: {
          prioritizeHighRes: true,
          minDimensions: {
            width: 300,
            height: 300
          },
          qualityPreferences: ['/s-l1600.jpg', '/s-l800.jpg', '/s-l500.jpg'],
          validateUrls: true,
          validationTimeout: 5000,
          fallbackSources: ['main-image', 'gallery-images', 'thumbnail-images'],
          retryAttempts: 3,
          cacheImages: true
        }
      },
      formatting: {
        useMarkdown: false,
        includeBulletPoints: true,
        highlightKeyFeatures: true,
        addCallToAction: true,
        sectionDividers: true,
        emphasizePrice: true,
        showConditionBadge: true,
        includeShippingInfo: true,
        addReturnPolicy: true
      },
      customization: {
        allowCustomCSS: true,
        allowCustomHTML: false,
        enableThemes: true,
        availableThemes: ['default', 'modern', 'classic', 'minimal'],
        customFields: [],
        hiddenSections: [],
        sectionOrder: ['title', 'images', 'description', 'specifications', 'shipping', 'returns']
      },
      typography: {
        headingFont: 'Arial, sans-serif',
        bodyFont: 'Arial, sans-serif',
        headingWeight: 'bold',
        bodyWeight: 'normal',
        lineHeight: '1.5',
        letterSpacing: 'normal'
      },
      animations: {
        enabled: false,
        duration: '0.3s',
        easing: 'ease-in-out'
      }
    };
  }

  private getDefaultOptimizationConfig(): OptimizationStrategyConfig {
    return {
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
    };
  }

  private getDefaultUserPreferences(): UserPreferences {
    return {
      language: 'en',
      currency: 'USD',
      timezone: 'UTC',
      notifications: {
        emailUpdates: false,
        priceAlerts: true,
        marketTrends: true
      },
      defaultOptimization: this.getDefaultOptimizationConfig(),
      templatePreferences: {
        favoriteTemplates: ['final-ebay-template.html'],
        customTemplates: []
      }
    };
  }
}