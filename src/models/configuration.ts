// Configuration models for the eBay Listing Optimizer

export interface ScrapingConfig {
  /** Request timeout in milliseconds */
  requestTimeout: number;
  /** Delay between requests in milliseconds */
  requestDelay: number;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** User agent string for requests */
  userAgent: string;
  /** Whether to use proxy rotation */
  useProxyRotation: boolean;
  /** List of proxy servers */
  proxyServers: string[];
  /** Maximum concurrent requests */
  maxConcurrentRequests: number;
}

export interface ResearchConfig {
  /** Maximum number of similar listings to analyze */
  maxSimilarListings: number;
  /** Number of days to look back for historical data */
  historicalDataDays: number;
  /** Minimum confidence threshold for recommendations */
  minConfidenceThreshold: number;
  /** Platforms to search for similar listings */
  searchPlatforms: string[];
  /** Keywords to exclude from analysis */
  excludeKeywords: string[];
  /** Weight factors for different data sources */
  dataSourceWeights: {
    ebay: number;
    amazon: number;
    other: number;
  };
  /** Configuration for handling insufficient data scenarios */
  insufficientDataHandling: {
    /** Enable automatic search parameter expansion when data is insufficient */
    enableAutoExpansion: boolean;
    /** Minimum number of listings required before considering data sufficient */
    minListingsThreshold: number;
    /** Additional platforms to search when expanding parameters */
    fallbackPlatforms: string[];
    /** Reduce exclude keywords when expanding search */
    relaxExcludeKeywords: boolean;
    /** Extend historical data period when expanding search */
    extendHistoricalDays: number;
    /** Lower confidence threshold for expanded searches */
    fallbackConfidenceThreshold: number;
  };
}

export interface PricingAlgorithmConfig {
  /** Algorithm type to use for pricing */
  algorithm: 'average' | 'median' | 'competitive' | 'premium';
  /** Pricing strategy */
  strategy: 'aggressive' | 'moderate' | 'conservative';
  /** Margin percentage to apply */
  marginPercentage: number;
  /** Minimum price threshold */
  minPrice: number;
  /** Maximum price threshold */
  maxPrice: number;
  /** Weight factors for pricing components */
  weights: {
    marketAverage: number;
    competitorPricing: number;
    historicalSales: number;
    condition: number;
  };
  /** Advanced pricing configuration */
  advanced: {
    /** Enable dynamic pricing based on market trends */
    enableDynamicPricing: boolean;
    /** Trend analysis period in days */
    trendAnalysisDays: number;
    /** Price adjustment factor for trending items */
    trendAdjustmentFactor: number;
    /** Seasonal pricing adjustments */
    seasonalAdjustments: {
      enabled: boolean;
      peakSeasonMultiplier: number;
      offSeasonMultiplier: number;
    };
    /** Competitive pricing thresholds */
    competitiveThresholds: {
      /** Percentage below average to be considered competitive */
      competitiveThreshold: number;
      /** Percentage above average to be considered premium */
      premiumThreshold: number;
    };
  };
}

export interface KeywordWeightingConfig {
  /** Weight for title keywords */
  titleWeight: number;
  /** Weight for description keywords */
  descriptionWeight: number;
  /** Weight for category keywords */
  categoryWeight: number;
  /** Weight for brand keywords */
  brandWeight: number;
  /** Weight for condition keywords */
  conditionWeight: number;
  /** Minimum keyword frequency threshold */
  minFrequencyThreshold: number;
  /** Maximum number of keywords to include */
  maxKeywords: number;
  /** Boost factor for trending keywords */
  trendingBoost: number;
}

export interface TemplateConfig {
  /** Default template to use */
  defaultTemplate: string;
  /** Available template variants */
  availableTemplates: string[];
  /** Custom CSS styles */
  customStyles: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    fontSize: string;
    borderRadius?: string;
    boxShadow?: string;
    headerBackground?: string;
    textColor?: string;
    linkColor?: string;
    buttonColor?: string;
    warningColor?: string;
    errorColor?: string;
    successColor?: string;
  };
  /** Layout configuration */
  layout?: {
    containerWidth?: string;
    maxWidth?: string;
    padding?: string;
    margin?: string;
    responsive?: boolean;
    mobileBreakpoint?: string;
    gridGap?: string;
  };
  /** Image gallery settings */
  imageGallery: {
    maxImages: number;
    imageSize: 'small' | 'medium' | 'large';
    showThumbnails: boolean;
    enableZoom: boolean;
    layout?: 'grid' | 'carousel' | 'stack' | 'masonry';
    aspectRatio?: string;
    spacing?: string;
    borderRadius?: string;
    hoverEffect?: 'none' | 'scale' | 'fade';
    /** Advanced image extraction settings */
    extraction: {
      /** Prioritize high-resolution images */
      prioritizeHighRes: boolean;
      /** Minimum image dimensions */
      minDimensions: {
        width: number;
        height: number;
      };
      /** Image quality preferences */
      qualityPreferences: string[];
      /** Enable image validation via HEAD requests */
      validateUrls: boolean;
      /** Timeout for image validation requests */
      validationTimeout: number;
      /** Fallback image sources when primary extraction fails */
      fallbackSources: string[];
      /** Number of retry attempts for failed image requests */
      retryAttempts?: number;
      /** Enable image caching */
      cacheImages?: boolean;
    };
  };
  /** Content formatting options */
  formatting: {
    useMarkdown: boolean;
    includeBulletPoints: boolean;
    highlightKeyFeatures: boolean;
    addCallToAction: boolean;
    sectionDividers?: boolean;
    emphasizePrice?: boolean;
    showConditionBadge?: boolean;
    includeShippingInfo?: boolean;
    addReturnPolicy?: boolean;
  };
  /** Template customization options */
  customization?: {
    allowCustomCSS?: boolean;
    allowCustomHTML?: boolean;
    enableThemes?: boolean;
    availableThemes?: string[];
    customFields?: string[];
    hiddenSections?: string[];
    sectionOrder?: string[];
  };
  /** Typography settings */
  typography?: {
    headingFont?: string;
    bodyFont?: string;
    headingWeight?: string;
    bodyWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
  };
  /** Animation settings */
  animations?: {
    enabled?: boolean;
    duration?: string;
    easing?: string;
  };
}

export interface OptimizationStrategyConfig {
  /** Content optimization strategy */
  contentStrategy: 'seo_focused' | 'conversion_focused' | 'balanced';
  /** Title optimization approach */
  titleOptimization: 'keyword_heavy' | 'readable' | 'branded';
  /** Description style */
  descriptionStyle: 'detailed' | 'concise' | 'bullet_points';
  /** Pricing approach */
  pricingApproach: 'competitive' | 'value_based' | 'premium';
  /** Target audience */
  targetAudience: 'bargain_hunters' | 'quality_seekers' | 'brand_conscious';
  /** Optimization goals */
  goals: {
    maximizeVisibility: boolean;
    maximizeConversion: boolean;
    maximizeProfit: boolean;
  };
}

export interface UserPreferences {
  /** User's preferred language */
  language: string;
  /** User's default currency */
  currency: string;
  /** User's timezone */
  timezone: string;
  /** Notification preferences */
  notifications: {
    emailUpdates: boolean;
    priceAlerts: boolean;
    marketTrends: boolean;
  };
  /** Default optimization settings */
  defaultOptimization: OptimizationStrategyConfig;
  /** Saved template preferences */
  templatePreferences: {
    favoriteTemplates: string[];
    customTemplates: string[];
  };
}

export interface ConfigurationPreset {
  /** Preset name */
  name: string;
  /** Preset description */
  description: string;
  /** Partial configuration overrides */
  scraping?: Partial<ScrapingConfig>;
  research?: Partial<ResearchConfig>;
  pricing?: Partial<PricingAlgorithmConfig>;
  keywords?: Partial<KeywordWeightingConfig>;
  templates?: Partial<TemplateConfig>;
  optimization?: Partial<OptimizationStrategyConfig>;
  userPreferences?: Partial<UserPreferences>;
}

export interface ThemeConfiguration {
  /** Theme name */
  name: string;
  /** Theme description */
  description: string;
  /** Custom styles for the theme */
  customStyles: TemplateConfig['customStyles'];
  /** Layout configuration */
  layout?: TemplateConfig['layout'];
  /** Image gallery styling */
  imageGallery?: Partial<TemplateConfig['imageGallery']>;
  /** Typography settings */
  typography?: TemplateConfig['typography'];
  /** Animation settings */
  animations?: TemplateConfig['animations'];
}

export interface ConfigurationValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;
  /** List of validation errors */
  errors: string[];
  /** List of validation warnings */
  warnings: string[];
  /** Estimated processing time in milliseconds */
  estimatedProcessingTime?: number;
  /** Configuration completeness score (0-1) */
  completenessScore?: number;
}

export interface SystemConfiguration {
  /** Scraping configuration */
  scraping: ScrapingConfig;
  /** Research configuration */
  research: ResearchConfig;
  /** Pricing algorithm configuration */
  pricing: PricingAlgorithmConfig;
  /** Keyword weighting configuration */
  keywords: KeywordWeightingConfig;
  /** Template configuration */
  templates: TemplateConfig;
  /** Optimization strategy configuration */
  optimization: OptimizationStrategyConfig;
  /** User preferences */
  userPreferences: UserPreferences;
  /** Configuration version for migration purposes */
  version: string;
  /** Last updated timestamp */
  lastUpdated: Date;
}