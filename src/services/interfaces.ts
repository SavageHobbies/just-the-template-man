// Service interfaces for the eBay Listing Optimizer

import {
  WebpageContent,
  ProductDetails,
  ResearchData,
  OptimizedContent,
  ImageData,
  ResearchInsights
} from '../models';

export interface WebScrapingService {
  /**
   * Scrapes content from a given URL
   * @param url - The URL to scrape
   * @returns Promise containing the scraped webpage content
   */
  scrapeUrl(url: string): Promise<WebpageContent>;
}

export interface ProductExtractor {
  /**
   * Extracts structured product details from webpage content
   * @param content - The scraped webpage content
   * @returns Promise containing extracted product details
   */
  extractProductDetails(content: WebpageContent): Promise<ProductDetails>;

  /**
   * Extracts image gallery from webpage content
   * @param content - The scraped webpage content
   * @returns Promise containing array of image data
   */
  extractImageGallery(content: WebpageContent): Promise<ImageData[]>;

  /**
   * Validates image URLs by making HEAD requests
   * @param images - Array of image data to validate
   * @returns Promise containing validated image data
   */
  validateImageUrls(images: ImageData[]): Promise<ImageData[]>;
}

export interface MarketResearchEngine {
  /**
   * Conducts market research for a given product
   * @param productDetails - The product details to research
   * @returns Promise containing comprehensive research data
   */
  conductResearch(productDetails: ProductDetails): Promise<ResearchData>;
}

export interface ContentOptimizer {
  /**
   * Optimizes product content based on original details and research data
   * @param originalDetails - The original product details
   * @param research - The market research data
   * @returns Promise containing optimized content
   */
  optimizeContent(
    originalDetails: ProductDetails,
    research: ResearchData
  ): Promise<OptimizedContent>;
}

export interface TemplateRenderer {
  /**
   * Renders optimized content into an HTML template
   * @param optimizedContent - The optimized content to render
   * @param originalDetails - The original product details
   * @param templatePath - Path to the HTML template file
   * @returns Promise containing the rendered HTML string
   */
  renderTemplate(
    optimizedContent: OptimizedContent,
    originalDetails: ProductDetails,
    templatePath: string
  ): Promise<string>;

  /**
   * Generates HTML for product image gallery
   * @param images - Array of image data to include in gallery
   * @param maxImages - Maximum number of images to include (default: 5)
   * @returns HTML string for the image gallery
   */
  generateImageGallery(images: ImageData[], maxImages?: number): string;
}

export interface ResearchDataAnalyzer {
  /**
   * Analyzes research data and generates actionable insights
   * @param researchData - The market research data to analyze
   * @returns Promise containing analyzed insights and recommendations
   */
  analyzeResearchData(researchData: ResearchData): Promise<ResearchInsights>;
}

// Re-export configuration service interface
export { ConfigurationService } from './ConfigurationService';