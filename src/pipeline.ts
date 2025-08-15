// Main pipeline orchestrator for the eBay Listing Optimizer

import {
  WebScrapingService,
  ProductExtractor,
  MarketResearchEngine,
  ContentOptimizer,
  TemplateRenderer
} from './services/interfaces';
import { ProductDetails, OptimizedContent } from './models';
import { 
  isValidEbayUrl, 
  sanitizeUrl, 
  validateProductDetails,
  PipelineError,
  ErrorCode,
  getLogger,
  PerformanceMonitor,
  createError
} from './utils';

export interface PipelineConfig {
  webScraper: WebScrapingService;
  productExtractor: ProductExtractor;
  marketResearcher: MarketResearchEngine;
  contentOptimizer: ContentOptimizer;
  templateRenderer: TemplateRenderer;
}

export interface PipelineResult {
  originalDetails: ProductDetails;
  optimizedContent: OptimizedContent;
  renderedHtml: string;
  researchData?: any; // Market research data for detailed analysis
}

/**
 * Main pipeline class that orchestrates the entire optimization process
 */
export class Pipeline {
  private readonly logger = getLogger();

  constructor(private config: PipelineConfig) {}

  /**
   * Processes an eBay URL through the complete optimization pipeline
   * @param url - The eBay URL to process
   * @param templatePath - Path to the HTML template file
   * @returns Promise containing the complete pipeline result
   */
  async process(url: string, templatePath: string): Promise<PipelineResult> {
    const operation = 'process';
    this.logger.startOperation(operation, 'Pipeline', { url, templatePath });

    // Validate and sanitize URL
    if (!isValidEbayUrl(url)) {
      const error = new PipelineError(
        'Invalid eBay URL provided',
        ErrorCode.VALIDATION_FAILED,
        false,
        undefined,
        { providedUrl: url }
      );
      this.logger.failOperation(operation, error, 'Pipeline');
      throw error;
    }
    
    const sanitizedUrl = sanitizeUrl(url);
    this.logger.debug('URL validated and sanitized', { originalUrl: url, sanitizedUrl }, 'Pipeline', operation);
    
    return PerformanceMonitor.measure(operation, async () => {
      try {
        // Step 1: Scrape webpage content
        this.logger.info('Starting web scraping', { url: sanitizedUrl }, 'Pipeline', operation);
        const webpageContent = await PerformanceMonitor.measure(
          'scrape-webpage',
          () => this.config.webScraper.scrapeUrl(sanitizedUrl),
          'Pipeline'
        );
        this.logger.info('Web scraping completed', { contentLength: webpageContent.html.length }, 'Pipeline', operation);
        
        // Step 2: Extract product details
        this.logger.info('Starting product extraction', undefined, 'Pipeline', operation);
        const productDetails = await PerformanceMonitor.measure(
          'extract-product',
          () => this.config.productExtractor.extractProductDetails(webpageContent),
          'Pipeline'
        );
        this.logger.info('Product extraction completed', { 
          title: productDetails.title,
          price: productDetails.price,
          imageCount: productDetails.images.length
        }, 'Pipeline', operation);
        
        // Validate extracted details
        if (!validateProductDetails(productDetails)) {
          const error = new PipelineError(
            'Failed to extract required product details',
            ErrorCode.VALIDATION_FAILED,
            false,
            undefined,
            { extractedFields: Object.keys(productDetails) }
          );
          this.logger.failOperation(operation, error, 'Pipeline');
          throw error;
        }
        
        // Step 3: Conduct market research
        this.logger.info('Starting market research', undefined, 'Pipeline', operation);
        const researchData = await PerformanceMonitor.measure(
          'market-research',
          () => this.config.marketResearcher.conductResearch(productDetails),
          'Pipeline'
        );
        this.logger.info('Market research completed', {
          similarListingsCount: researchData.similarListings.length,
          averagePrice: researchData.priceAnalysis.averagePrice,
          confidence: researchData.priceAnalysis.confidence
        }, 'Pipeline', operation);
        
        // Step 4: Optimize content
        this.logger.info('Starting content optimization', undefined, 'Pipeline', operation);
        const optimizedContent = await PerformanceMonitor.measure(
          'optimize-content',
          () => this.config.contentOptimizer.optimizeContent(productDetails, researchData),
          'Pipeline'
        );
        this.logger.info('Content optimization completed', {
          optimizedTitleLength: optimizedContent.optimizedTitle.length,
          keywordCount: optimizedContent.keywords.length,
          suggestedPrice: optimizedContent.suggestedPrice
        }, 'Pipeline', operation);
        
        // Step 5: Render template
        this.logger.info('Starting template rendering', { templatePath }, 'Pipeline', operation);
        const renderedHtml = await PerformanceMonitor.measure(
          'render-template',
          () => this.config.templateRenderer.renderTemplate(optimizedContent, productDetails, templatePath),
          'Pipeline'
        );
        this.logger.info('Template rendering completed', { 
          htmlLength: renderedHtml.length 
        }, 'Pipeline', operation);
        
        const result = {
          originalDetails: productDetails,
          optimizedContent,
          renderedHtml,
          researchData
        };

        this.logger.completeOperation(operation, 'Pipeline', {
          success: true,
          stepsCompleted: 5,
          finalHtmlLength: renderedHtml.length
        });
        
        return result;
        
      } catch (error) {
        const pipelineError = createError(error, ErrorCode.PIPELINE_FAILED, {
          url: sanitizedUrl,
          templatePath,
          step: 'unknown'
        });
        
        this.logger.failOperation(operation, pipelineError, 'Pipeline');
        throw pipelineError;
      }
    }, 'Pipeline');
  }
}