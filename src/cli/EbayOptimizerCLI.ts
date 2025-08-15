import inquirer from 'inquirer';
import chalk from 'chalk';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Pipeline, PipelineConfig, PipelineResult } from '../pipeline';
import { AxiosWebScrapingService } from '../services/WebScrapingService';
import { EbayProductExtractor } from '../services/ProductExtractor';
import { MarketResearchEngine } from '../services/MarketResearchEngine';
import { ContentOptimizer } from '../services/ContentOptimizer';
import { TemplateRenderer } from '../services/TemplateRenderer';
import { 
  isValidEbayUrl,
  BaseError,
  getLogger,
  LogLevel,
  isCriticalError
} from '../utils';
import { ResearchDataAnalyzer } from '../services/ResearchDataAnalyzer';
import { ProductDetails, OptimizedContent, ResearchData } from '../models';

export interface CLIOptions {
  output?: string;
  template?: string;
  interactive?: boolean;
}

/**
 * Command Line Interface for the eBay Listing Optimizer
 */
export class EbayOptimizerCLI {
  private pipeline: Pipeline;
  private readonly logger = getLogger();

  constructor() {
    // Initialize all services
    const webScraper = new AxiosWebScrapingService();
    const productExtractor = new EbayProductExtractor();
    const marketResearcher = new MarketResearchEngine();
    const researchAnalyzer = new ResearchDataAnalyzer();
    const contentOptimizer = new ContentOptimizer();
    const templateRenderer = new TemplateRenderer();

    const config: PipelineConfig = {
      webScraper,
      productExtractor,
      marketResearcher,
      contentOptimizer,
      templateRenderer
    };

    this.pipeline = new Pipeline(config);
  }

  /**
   * Main optimization command
   */
  async optimize(url: string, options: CLIOptions): Promise<void> {
    try {
      console.log(chalk.blue.bold('\n🚀 eBay Listing Optimizer\n'));
      
      // Validate URL
      if (!this.validateUrlInternal(url)) {
        return;
      }

      // Show processing steps
      console.log(chalk.yellow('Processing your eBay listing...'));
      console.log(chalk.gray(`URL: ${url}`));
      console.log(chalk.gray(`Template: ${options.template || 'final-ebay-template.html'}`));
      console.log(chalk.gray(`Output: ${options.output || 'optimized-listing.html'}\n`));

      // Process the listing
      const result = await this.processWithProgress(url, options.template || 'final-ebay-template.html');

      // Display results
      await this.displayResults(result, options.interactive !== false);

      // Save output
      await this.saveOutput(result, options.output || 'optimized-listing.html', options.interactive !== false);

      console.log(chalk.green.bold('\n✅ Optimization complete!'));

    } catch (error) {
      this.logger.critical('CLI optimization failed', error instanceof Error ? error : undefined, {
        url,
        options
      }, 'EbayOptimizerCLI', 'optimize');

      console.error(chalk.red.bold('\n❌ Error during optimization:'));
      
      if (error instanceof BaseError) {
        console.error(chalk.red(error.userMessage));
        if (isCriticalError(error)) {
          console.error(chalk.yellow('\nThis appears to be a system issue. Please try again later or contact support.'));
        }
        if (error.isRetryable) {
          console.error(chalk.yellow('\nThis error might be temporary. Please try again in a few moments.'));
        }
      } else {
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      }
      
      process.exit(1);
    }
  }

  /**
   * Validate URL command
   */
  async validateUrl(url: string): Promise<void> {
    console.log(chalk.blue.bold('\n🔍 URL Validation\n'));
    
    if (this.validateUrlInternal(url)) {
      console.log(chalk.green('✅ Valid eBay URL'));
    }
  }

  /**
   * Internal URL validation
   */
  private validateUrlInternal(url: string): boolean {
    if (!isValidEbayUrl(url)) {
      console.error(chalk.red('❌ Invalid eBay URL'));
      console.error(chalk.yellow('Please provide a valid eBay listing URL (e.g., https://www.ebay.com/itm/...)'));
      return false;
    }
    return true;
  }

  /**
   * Process the listing with progress indicators
   */
  private async processWithProgress(url: string, templatePath: string): Promise<PipelineResult> {
    const steps = [
      'Scraping eBay listing...',
      'Extracting product details...',
      'Conducting market research...',
      'Optimizing content...',
      'Generating HTML template...'
    ];

    let currentStep = 0;
    const showProgress = () => {
      if (currentStep < steps.length) {
        console.log(chalk.cyan(`[${currentStep + 1}/${steps.length}] ${steps[currentStep]}`));
        currentStep++;
      }
    };

    // Show initial step
    showProgress();

    try {
      const result = await this.pipeline.process(url, templatePath);
      
      // Show completion for remaining steps
      while (currentStep < steps.length) {
        showProgress();
      }

      return result;
    } catch (error) {
      console.error(chalk.red(`\n❌ Failed at step: ${steps[currentStep - 1] || 'Unknown step'}`));
      throw error;
    }
  }

  /**
   * Display processing results to the user
   */
  private async displayResults(result: PipelineResult, interactive: boolean): Promise<void> {
    console.log(chalk.green.bold('\n📊 Processing Results\n'));

    // Display original product details
    this.displayProductDetails(result.originalDetails);

    // Display optimized content
    this.displayOptimizedContent(result.optimizedContent);

    // Display detailed pricing analysis
    this.displayPricingAnalysis(
      result.originalDetails.price, 
      result.optimizedContent.suggestedPrice, 
      result.researchData
    );

    if (interactive) {
      const { viewHtml } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'viewHtml',
          message: 'Would you like to preview the generated HTML template?',
          default: false
        }
      ]);

      if (viewHtml) {
        this.displayHtmlPreview(result.renderedHtml);
      }
    }
  }

  /**
   * Display extracted product details
   */
  private displayProductDetails(details: ProductDetails): void {
    console.log(chalk.blue.bold('📦 Original Product Details:'));
    console.log(chalk.white(`Title: ${details.title}`));
    console.log(chalk.white(`Price: $${details.price}`));
    console.log(chalk.white(`Condition: ${details.condition}`));
    console.log(chalk.white(`Images: ${details.images.length} found`));
    
    if (details.description) {
      const shortDesc = details.description.length > 100 
        ? details.description.substring(0, 100) + '...' 
        : details.description;
      console.log(chalk.white(`Description: ${shortDesc}`));
    }
    
    if (Object.keys(details.specifications).length > 0) {
      console.log(chalk.white(`Specifications: ${Object.keys(details.specifications).length} items`));
    }
    console.log();
  }

  /**
   * Display optimized content
   */
  private displayOptimizedContent(content: OptimizedContent): void {
    console.log(chalk.green.bold('✨ Optimized Content:'));
    console.log(chalk.white(`Optimized Title: ${content.optimizedTitle}`));
    console.log(chalk.white(`Suggested Price: $${content.suggestedPrice}`));
    console.log(chalk.white(`Keywords: ${content.keywords.join(', ')}`));
    console.log(chalk.white(`Selling Points: ${content.sellingPoints.length} identified`));
    
    if (content.optimizedDescription) {
      const shortDesc = content.optimizedDescription.length > 150 
        ? content.optimizedDescription.substring(0, 150) + '...' 
        : content.optimizedDescription;
      console.log(chalk.white(`Optimized Description: ${shortDesc}`));
    }
    console.log();
  }

  /**
   * Display detailed pricing analysis
   */
  private displayPricingAnalysis(originalPrice: number, suggestedPrice: number, researchData: any): void {
    console.log(chalk.blue.bold('💰 Detailed Pricing Analysis:'));
    
    if (researchData && researchData.priceAnalysis) {
      const analysis = researchData.priceAnalysis;
      
      console.log(chalk.white(`Original Price: $${originalPrice}`));
      console.log(chalk.white(`Market Average: $${analysis.averagePrice}`));
      console.log(chalk.white(`Price Range: $${analysis.priceRange.min} - $${analysis.priceRange.max}`));
      console.log(chalk.white(`Recommended Price: $${suggestedPrice}`));
      console.log(chalk.white(`Market Confidence: ${Math.round(analysis.confidence * 100)}%`));
      
      // Price positioning analysis
      const priceDiff = suggestedPrice - originalPrice;
      const percentChange = ((priceDiff / originalPrice) * 100).toFixed(1);
      
      if (priceDiff > 0) {
        console.log(chalk.green(`💡 Pricing Opportunity: +$${priceDiff.toFixed(2)} (+${percentChange}%)`));
      } else if (priceDiff < 0) {
        console.log(chalk.yellow(`⚠️  Price Adjustment: $${priceDiff.toFixed(2)} (${percentChange}%)`));
      } else {
        console.log(chalk.white(`✅ Current pricing is optimal`));
      }
      
      // Competitive positioning
      if (suggestedPrice < analysis.priceRange.min) {
        console.log(chalk.red(`🔻 Below market range - consider increasing price`));
      } else if (suggestedPrice > analysis.priceRange.max) {
        console.log(chalk.yellow(`🔺 Above market range - premium positioning`));
      } else {
        console.log(chalk.green(`🎯 Within competitive market range`));
      }
      
      // Similar listings count
      if (researchData.similarListings) {
        console.log(chalk.white(`📊 Based on ${researchData.similarListings.length} similar listings`));
      }
    }
    
    console.log();
  }

  /**
   * Display HTML preview
   */
  private displayHtmlPreview(html: string): void {
    console.log(chalk.magenta.bold('\n📄 HTML Template Preview:'));
    console.log(chalk.gray('─'.repeat(60)));
    
    // Show first 500 characters of HTML
    const preview = html.length > 500 ? html.substring(0, 500) + '...' : html;
    console.log(chalk.white(preview));
    
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.gray(`Total HTML length: ${html.length} characters\n`));
  }

  /**
   * Save output to file with user confirmation
   */
  private async saveOutput(result: PipelineResult, outputPath: string, interactive: boolean): Promise<void> {
    let shouldSave = true;
    let finalPath = outputPath;

    if (interactive) {
      // Check if file exists
      if (existsSync(outputPath)) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `File ${outputPath} already exists. Overwrite?`,
            default: false
          }
        ]);

        if (!overwrite) {
          const { newPath } = await inquirer.prompt([
            {
              type: 'input',
              name: 'newPath',
              message: 'Enter a new file path:',
              default: `optimized-listing-${Date.now()}.html`
            }
          ]);
          finalPath = newPath;
        }
      }

      // Confirm save
      const { confirmSave } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmSave',
          message: `Save optimized HTML template to ${finalPath}?`,
          default: true
        }
      ]);

      shouldSave = confirmSave;
    }

    if (shouldSave) {
      try {
        writeFileSync(finalPath, result.renderedHtml, 'utf8');
        console.log(chalk.green(`\n💾 HTML template saved to: ${finalPath}`));
        
        // Also save a summary file
        const summaryPath = finalPath.replace('.html', '-summary.txt');
        const summary = this.generateSummary(result);
        writeFileSync(summaryPath, summary, 'utf8');
        console.log(chalk.green(`📋 Summary saved to: ${summaryPath}`));
        
      } catch (error) {
        console.error(chalk.red(`❌ Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    }
  }

  /**
   * Generate a text summary of the optimization results
   */
  private generateSummary(result: PipelineResult): string {
    const { originalDetails, optimizedContent } = result;
    
    return `eBay Listing Optimization Summary
Generated: ${new Date().toLocaleString()}

ORIGINAL LISTING:
Title: ${originalDetails.title}
Price: $${originalDetails.price}
Condition: ${originalDetails.condition}
Images: ${originalDetails.images.length}

OPTIMIZED CONTENT:
Title: ${optimizedContent.optimizedTitle}
Suggested Price: $${optimizedContent.suggestedPrice}
Keywords: ${optimizedContent.keywords.join(', ')}
Selling Points: ${optimizedContent.sellingPoints.join(', ')}

OPTIMIZATION IMPROVEMENTS:
- Title optimization with SEO keywords
- Market-based pricing recommendation
- Enhanced product description
- Professional image gallery (${originalDetails.images.length} images)
- Competitive analysis insights

NEXT STEPS:
1. Review the generated HTML template
2. Copy the HTML content to your eBay listing
3. Adjust pricing based on your profit margins
4. Monitor listing performance and engagement
`;
  }
}