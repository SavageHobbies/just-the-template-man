# eBay Listing Optimizer - API Reference

## Overview

This document provides comprehensive API documentation for the eBay Listing Optimizer, including all interfaces, classes, and data models.

## Table of Contents

1. [Core Interfaces](#core-interfaces)
2. [Service Classes](#service-classes)
3. [Data Models](#data-models)
4. [Configuration Types](#configuration-types)
5. [Error Types](#error-types)
6. [Utility Functions](#utility-functions)

## Core Interfaces

### WebScrapingService

Interface for web scraping functionality.

```typescript
interface WebScrapingService {
  /**
   * Scrapes content from the specified URL
   * @param url - The URL to scrape
   * @returns Promise resolving to webpage content
   * @throws {InvalidUrlError} When URL is invalid or inaccessible
   * @throws {NetworkError} When network request fails
   */
  scrapeUrl(url: string): Promise<WebpageContent>;
}
```

### ProductExtractor

Interface for extracting product information from webpage content.

```typescript
interface ProductExtractor {
  /**
   * Extracts product details from webpage content
   * @param content - The webpage content to parse
   * @returns Promise resolving to structured product details
   * @throws {ExtractionError} When required data cannot be extracted
   */
  extractProductDetails(content: WebpageContent): Promise<ProductDetails>;

  /**
   * Extracts image gallery from webpage content
   * @param content - The webpage content to parse
   * @returns Promise resolving to array of image data
   */
  extractImageGallery(content: WebpageContent): Promise<ImageData[]>;

  /**
   * Validates image URLs for accessibility
   * @param images - Array of image data to validate
   * @returns Promise resolving to validated image data
   */
  validateImageUrls(images: ImageData[]): Promise<ImageData[]>;
}
```

### MarketResearchEngine

Interface for conducting market research and competitive analysis.

```typescript
interface MarketResearchEngine {
  /**
   * Conducts comprehensive market research for a product
   * @param productDetails - Product details to research
   * @returns Promise resolving to research data
   * @throws {ResearchError} When research cannot be completed
   */
  conductResearch(productDetails: ProductDetails): Promise<ResearchData>;
}
```

### ResearchDataAnalyzer

Interface for analyzing market research data.

```typescript
interface ResearchDataAnalyzer {
  /**
   * Analyzes research data to generate actionable insights
   * @param researchData - Raw research data to analyze
   * @returns Promise resolving to research insights
   */
  analyzeResearchData(researchData: ResearchData): Promise<ResearchInsights>;
}
```

### ContentOptimizer

Interface for optimizing product content.

```typescript
interface ContentOptimizer {
  /**
   * Optimizes product content based on original details and research
   * @param originalDetails - Original product details
   * @param research - Market research data
   * @returns Promise resolving to optimized content
   * @throws {OptimizationError} When content optimization fails
   */
  optimizeContent(
    originalDetails: ProductDetails, 
    research: ResearchData
  ): Promise<OptimizedContent>;
}
```

### TemplateRenderer

Interface for rendering HTML templates.

```typescript
interface TemplateRenderer {
  /**
   * Renders HTML template with optimized content
   * @param optimizedContent - Optimized content to insert
   * @param originalDetails - Original product details
   * @param templatePath - Path to HTML template file
   * @returns Promise resolving to rendered HTML string
   * @throws {TemplateError} When template rendering fails
   */
  renderTemplate(
    optimizedContent: OptimizedContent,
    originalDetails: ProductDetails,
    templatePath: string
  ): Promise<string>;

  /**
   * Generates HTML image gallery from image data
   * @param images - Array of image data
   * @param maxImages - Maximum number of images to include (default: 5)
   * @returns HTML string for image gallery
   */
  generateImageGallery(images: ImageData[], maxImages?: number): string;
}
```

## Service Classes

### Pipeline

Main orchestration class that coordinates all optimization steps.

```typescript
class Pipeline {
  constructor(
    private webScraper: WebScrapingService,
    private productExtractor: ProductExtractor,
    private marketResearcher: MarketResearchEngine,
    private dataAnalyzer: ResearchDataAnalyzer,
    private contentOptimizer: ContentOptimizer,
    private templateRenderer: TemplateRenderer
  );

  /**
   * Processes a complete listing optimization pipeline
   * @param url - eBay listing URL to process
   * @returns Promise resolving to optimization result
   * @throws {PipelineError} When any step in the pipeline fails
   */
  async processListing(url: string): Promise<OptimizationResult>;

  /**
   * Processes multiple listings in batch
   * @param urls - Array of eBay listing URLs
   * @param options - Batch processing options
   * @returns Promise resolving to array of optimization results
   */
  async processBatch(urls: string[], options?: BatchOptions): Promise<OptimizationResult[]>;
}
```

### ConfigurationService

Service for managing application configuration.

```typescript
class ConfigurationService {
  /**
   * Loads configuration from files and environment
   * @param configPath - Path to configuration file
   * @returns Configuration object
   */
  static loadConfiguration(configPath?: string): Configuration;

  /**
   * Validates configuration object
   * @param config - Configuration to validate
   * @throws {ConfigurationError} When configuration is invalid
   */
  static validateConfiguration(config: Configuration): void;

  /**
   * Merges multiple configuration objects
   * @param configs - Array of configuration objects to merge
   * @returns Merged configuration object
   */
  static mergeConfigurations(...configs: Partial<Configuration>[]): Configuration;
}
```

## Data Models

### WebpageContent

Represents scraped webpage content.

```typescript
interface WebpageContent {
  /** Raw HTML content */
  html: string;
  /** Page title */
  title: string;
  /** Additional metadata extracted from the page */
  metadata: Record<string, string>;
  /** Timestamp when content was scraped */
  timestamp: Date;
}
```

### ImageData

Represents image information.

```typescript
interface ImageData {
  /** Direct URL to the image */
  url: string;
  /** Alternative text for accessibility */
  altText?: string;
  /** Image size category */
  size: 'thumbnail' | 'medium' | 'large';
  /** Whether the image URL is valid and accessible */
  isValid: boolean;
}
```

### ProductDetails

Represents extracted product information.

```typescript
interface ProductDetails {
  /** Product title */
  title: string;
  /** Product description */
  description: string;
  /** Current price */
  price: number;
  /** Item condition */
  condition: string;
  /** Array of product images */
  images: ImageData[];
  /** Product specifications as key-value pairs */
  specifications: Record<string, string>;
  /** Seller information */
  seller: string;
  /** Item location */
  location: string;
}
```

### SimilarListing

Represents a similar product listing found during research.

```typescript
interface SimilarListing {
  /** Listing title */
  title: string;
  /** Listing price */
  price: number;
  /** Item condition */
  condition: string;
  /** Date when item was sold (if applicable) */
  soldDate?: Date;
  /** Platform where listing was found */
  platform: string;
}
```

### PriceAnalysis

Represents pricing analysis results.

```typescript
interface PriceAnalysis {
  /** Average price of similar items */
  averagePrice: number;
  /** Price range observed in market */
  priceRange: { min: number; max: number };
  /** Recommended selling price */
  recommendedPrice: number;
  /** Confidence level in price recommendation (0-1) */
  confidence: number;
}
```

### KeywordAnalysis

Represents keyword analysis results.

```typescript
interface KeywordAnalysis {
  /** Most popular keywords found in similar listings */
  popularKeywords: string[];
  /** Frequency count for each keyword */
  keywordFrequency: Record<string, number>;
  /** Search volume data for keywords */
  searchVolume: Record<string, number>;
}
```

### MarketTrend

Represents market trend data.

```typescript
interface MarketTrend {
  /** Time period for the trend data */
  period: string;
  /** Average price during the period */
  averagePrice: number;
  /** Sales volume during the period */
  salesVolume: number;
  /** Trend direction */
  trend: 'increasing' | 'decreasing' | 'stable';
}
```

### ResearchData

Represents comprehensive market research results.

```typescript
interface ResearchData {
  /** Array of similar listings found */
  similarListings: SimilarListing[];
  /** Price analysis results */
  priceAnalysis: PriceAnalysis;
  /** Keyword analysis results */
  keywordAnalysis: KeywordAnalysis;
  /** Market trend data */
  marketTrends: MarketTrend[];
}
```

### OptimizedContent

Represents optimized listing content.

```typescript
interface OptimizedContent {
  /** SEO-optimized title */
  optimizedTitle: string;
  /** Enhanced product description */
  optimizedDescription: string;
  /** Recommended selling price */
  suggestedPrice: number;
  /** Relevant keywords for the listing */
  keywords: string[];
  /** Key selling points to highlight */
  sellingPoints: string[];
  /** Detailed condition notes */
  conditionNotes: string;
}
```

### ResearchInsights

Represents analyzed research insights.

```typescript
interface PricingInsight {
  /** Pricing recommendation */
  recommendation: 'increase' | 'decrease' | 'maintain';
  /** Suggested price */
  suggestedPrice: number;
  /** Confidence in recommendation */
  confidence: number;
  /** Reasoning for the recommendation */
  reasoning: string;
  /** Market position assessment */
  marketPosition: 'below_market' | 'at_market' | 'above_market';
}

interface KeywordInsight {
  /** Top performing keywords */
  topKeywords: string[];
  /** Keywords missing from current listing */
  missingKeywords: string[];
  /** Keyword opportunities */
  keywordOpportunities: string[];
  /** Search volume analysis */
  searchVolumeAnalysis: Record<string, { 
    volume: number; 
    competition: 'low' | 'medium' | 'high' 
  }>;
}

interface MarketInsight {
  /** Overall market trend */
  marketTrend: 'growing' | 'declining' | 'stable';
  /** Competitive position */
  competitivePosition: 'strong' | 'moderate' | 'weak';
  /** Demand level assessment */
  demandLevel: 'high' | 'medium' | 'low';
  /** Seasonality information */
  seasonality: string;
  /** Actionable recommendations */
  recommendations: string[];
}

interface ResearchInsights {
  /** Summary of key findings */
  summary: string;
  /** Pricing insights */
  pricingInsight: PricingInsight;
  /** Keyword insights */
  keywordInsight: KeywordInsight;
  /** Market insights */
  marketInsight: MarketInsight;
  /** Overall confidence score */
  overallConfidence: number;
  /** List of actionable recommendations */
  actionableRecommendations: string[];
}
```

### OptimizationResult

Represents the complete result of the optimization process.

```typescript
interface OptimizationResult {
  /** Original extracted product details */
  originalDetails: ProductDetails;
  /** Market research data */
  researchData: ResearchData;
  /** Research insights and analysis */
  insights: ResearchInsights;
  /** Optimized content */
  optimizedContent: OptimizedContent;
  /** Rendered HTML template */
  htmlTemplate: string;
  /** Processing metadata */
  metadata: {
    /** Total processing time in milliseconds */
    processingTime: number;
    /** Overall confidence score */
    confidence: number;
    /** Any warnings generated during processing */
    warnings: string[];
    /** Version of the optimizer used */
    version: string;
  };
}
```

## Configuration Types

### Configuration

Main configuration interface.

```typescript
interface Configuration {
  /** Web scraping configuration */
  scraping: ScrapingConfig;
  /** Market research configuration */
  research: ResearchConfig;
  /** Content optimization configuration */
  optimization: OptimizationConfig;
  /** Template rendering configuration */
  template: TemplateConfig;
  /** Caching configuration */
  cache: CacheConfig;
  /** Logging configuration */
  logging: LoggingConfig;
}
```

### ScrapingConfig

Configuration for web scraping behavior.

```typescript
interface ScrapingConfig {
  /** Request timeout in milliseconds */
  timeout: number;
  /** Number of retry attempts */
  retries: number;
  /** User agent string */
  userAgent: string;
  /** Rate limiting configuration */
  rateLimit: {
    /** Maximum requests per window */
    requests: number;
    /** Time window in milliseconds */
    window: number;
  };
  /** Proxy configuration */
  proxy?: {
    /** Proxy server URL */
    url: string;
    /** Authentication credentials */
    auth?: {
      username: string;
      password: string;
    };
  };
}
```

### ResearchConfig

Configuration for market research.

```typescript
interface ResearchConfig {
  /** Maximum number of similar listings to analyze */
  maxSimilarListings: number;
  /** Price analysis time window in days */
  priceAnalysisWindow: number;
  /** Minimum keyword frequency threshold */
  keywordThreshold: number;
  /** External API configurations */
  apis: {
    /** eBay API configuration */
    ebay?: {
      apiKey: string;
      environment: 'sandbox' | 'production';
    };
    /** Other market research APIs */
    [key: string]: any;
  };
}
```

### OptimizationConfig

Configuration for content optimization.

```typescript
interface OptimizationConfig {
  /** Maximum title length */
  titleMaxLength: number;
  /** Maximum description length */
  descriptionMaxLength: number;
  /** Maximum number of keywords */
  maxKeywords: number;
  /** Maximum number of selling points */
  maxSellingPoints: number;
  /** Optimization strategy */
  strategy: 'speed' | 'quality' | 'balanced';
  /** Language settings */
  language: string;
  /** Currency settings */
  currency: string;
}
```

### TemplateConfig

Configuration for template rendering.

```typescript
interface TemplateConfig {
  /** Maximum number of images in gallery */
  maxImages: number;
  /** Preferred image size */
  imageSize: 'thumbnail' | 'medium' | 'large';
  /** Whether to include image gallery */
  includeGallery: boolean;
  /** Custom template directory */
  templateDir: string;
  /** Default template file */
  defaultTemplate: string;
}
```

## Error Types

### Base Error Classes

```typescript
class OptimizerError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'OptimizerError';
  }
}

class InvalidUrlError extends OptimizerError {
  constructor(url: string) {
    super(`Invalid URL: ${url}`, 'INVALID_URL');
  }
}

class NetworkError extends OptimizerError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
  }
}

class ExtractionError extends OptimizerError {
  constructor(message: string) {
    super(message, 'EXTRACTION_ERROR');
  }
}

class ResearchError extends OptimizerError {
  constructor(message: string) {
    super(message, 'RESEARCH_ERROR');
  }
}

class OptimizationError extends OptimizerError {
  constructor(message: string) {
    super(message, 'OPTIMIZATION_ERROR');
  }
}

class TemplateError extends OptimizerError {
  constructor(message: string) {
    super(message, 'TEMPLATE_ERROR');
  }
}

class ConfigurationError extends OptimizerError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
  }
}

class PipelineError extends OptimizerError {
  constructor(message: string, public step: string) {
    super(message, 'PIPELINE_ERROR');
  }
}
```

## Utility Functions

### URL Validation

```typescript
/**
 * Validates if a URL is a valid eBay listing URL
 * @param url - URL to validate
 * @returns True if valid eBay URL
 */
function isValidEbayUrl(url: string): boolean;

/**
 * Extracts eBay item ID from URL
 * @param url - eBay listing URL
 * @returns Item ID or null if not found
 */
function extractEbayItemId(url: string): string | null;

/**
 * Normalizes eBay URL to standard format
 * @param url - eBay URL to normalize
 * @returns Normalized URL
 */
function normalizeEbayUrl(url: string): string;
```

### Data Validation

```typescript
/**
 * Validates product details object
 * @param details - Product details to validate
 * @throws {ValidationError} When validation fails
 */
function validateProductDetails(details: ProductDetails): void;

/**
 * Validates research data object
 * @param data - Research data to validate
 * @throws {ValidationError} When validation fails
 */
function validateResearchData(data: ResearchData): void;

/**
 * Validates optimized content object
 * @param content - Optimized content to validate
 * @throws {ValidationError} When validation fails
 */
function validateOptimizedContent(content: OptimizedContent): void;
```

### Text Processing

```typescript
/**
 * Extracts keywords from text using NLP techniques
 * @param text - Text to analyze
 * @param maxKeywords - Maximum number of keywords to return
 * @returns Array of extracted keywords
 */
function extractKeywords(text: string, maxKeywords?: number): string[];

/**
 * Calculates text similarity score between two strings
 * @param text1 - First text string
 * @param text2 - Second text string
 * @returns Similarity score between 0 and 1
 */
function calculateTextSimilarity(text1: string, text2: string): number;

/**
 * Sanitizes HTML content for safe rendering
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML string
 */
function sanitizeHtml(html: string): string;
```

### Performance Utilities

```typescript
/**
 * Measures execution time of an async function
 * @param fn - Function to measure
 * @returns Object with result and execution time
 */
async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; executionTime: number }>;

/**
 * Creates a rate limiter for API calls
 * @param maxRequests - Maximum requests per window
 * @param windowMs - Time window in milliseconds
 * @returns Rate limiter function
 */
function createRateLimiter(
  maxRequests: number, 
  windowMs: number
): () => Promise<void>;

/**
 * Creates a simple cache with TTL support
 * @param ttlMs - Time to live in milliseconds
 * @returns Cache object with get/set methods
 */
function createCache<T>(ttlMs: number): {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  clear(): void;
};
```

## Type Guards

```typescript
/**
 * Type guard for WebpageContent
 */
function isWebpageContent(obj: any): obj is WebpageContent;

/**
 * Type guard for ProductDetails
 */
function isProductDetails(obj: any): obj is ProductDetails;

/**
 * Type guard for ResearchData
 */
function isResearchData(obj: any): obj is ResearchData;

/**
 * Type guard for OptimizedContent
 */
function isOptimizedContent(obj: any): obj is OptimizedContent;
```

## Constants

```typescript
/** Default configuration values */
export const DEFAULT_CONFIG: Configuration;

/** Supported eBay domains */
export const SUPPORTED_EBAY_DOMAINS: string[];

/** Maximum allowed values */
export const LIMITS = {
  MAX_TITLE_LENGTH: 80,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_KEYWORDS: 10,
  MAX_SELLING_POINTS: 5,
  MAX_IMAGES: 5,
  MAX_SIMILAR_LISTINGS: 50
} as const;

/** Error codes */
export const ERROR_CODES = {
  INVALID_URL: 'INVALID_URL',
  NETWORK_ERROR: 'NETWORK_ERROR',
  EXTRACTION_ERROR: 'EXTRACTION_ERROR',
  RESEARCH_ERROR: 'RESEARCH_ERROR',
  OPTIMIZATION_ERROR: 'OPTIMIZATION_ERROR',
  TEMPLATE_ERROR: 'TEMPLATE_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  PIPELINE_ERROR: 'PIPELINE_ERROR'
} as const;
```

This API reference provides comprehensive documentation for all public interfaces, classes, and utilities in the eBay Listing Optimizer. For usage examples, see the [User Guide](USER_GUIDE.md).