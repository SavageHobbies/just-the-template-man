import inquirer from 'inquirer';
import chalk from 'chalk';
import { writeFileSync, existsSync, mkdirSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { Pipeline, PipelineConfig, PipelineResult } from '../pipeline';
import { pipeline } from 'stream/promises';
import { AxiosWebScrapingService } from '../services/WebScrapingService';
import { EbayProductExtractor } from '../services/ProductExtractor';
import { MarketResearchEngine } from '../services/MarketResearchEngine';
import { ContentOptimizer } from '../services/ContentOptimizer';
import { TemplateRenderer } from '../services/TemplateRenderer';
import { 
  isValidEbayUrl,
  BaseError,
  getLogger,
  isCriticalError
} from '../utils';
import { ProductDetails, OptimizedContent } from '../models';
import axios from 'axios';

export interface CLIOptions {
  output?: string;
  template?: string;
  interactive?: boolean;
  downloadImages?: boolean;
  outputDir?: string;
}

/**
 * Enhanced Command Line Interface for the eBay Listing Optimizer
 */
export class EbayOptimizerCLI {
  private pipeline: Pipeline;
  private readonly logger = getLogger();

  constructor() {
    // Initialize all services
    const webScraper = new AxiosWebScrapingService();
    const productExtractor = new EbayProductExtractor();
    const marketResearcher = new MarketResearchEngine();
    // researchAnalyzer is available for future enhancements
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
      console.log(chalk.blue.bold('\n🚀 eBay Listing Optimizer - Enhanced Edition\n'));
      
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

      // Display enhanced results
      await this.displayEnhancedResults(result, options);

      // Save output
      await this.saveEnhancedOutput(result, options);

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
   * Display enhanced processing results to the user
   */
  private async displayEnhancedResults(result: PipelineResult, options: CLIOptions): Promise<void> {
    console.log(chalk.green.bold('\n📊 Processing Results\n'));

    // Display original product details
    this.displayProductDetails(result.originalDetails);

    // Display optimized content with enhanced formatting
    this.displayEnhancedOptimizedContent(result.optimizedContent);

    // Display detailed pricing analysis
    this.displayPricingAnalysis(
      result.originalDetails.price, 
      result.optimizedContent.suggestedPrice, 
      result.researchData
    );

    // Display image information
    if (options.downloadImages) {
      this.displayImageInfo(result.originalDetails.images, options.outputDir);
    }

    if (options.interactive !== false) {
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
   * Display enhanced optimized content with copy-paste friendly format
   */
  private displayEnhancedOptimizedContent(content: OptimizedContent): void {
    console.log(chalk.green.bold('✨ OPTIMIZED CONTENT - Ready to Copy & Paste\n'));

    // Display optimized title (under 80 characters)
    console.log(chalk.yellow.bold('📝 OPTIMIZED TITLE:'));
    console.log(chalk.cyan(`"${content.optimizedTitle}"`));
    console.log(chalk.gray(`(${content.optimizedTitle.length}/80 characters)\n`));

    // Display keywords
    console.log(chalk.yellow.bold('🏷️  SEO KEYWORDS:'));
    const keywordsString = content.keywords.join(', ');
    console.log(chalk.cyan(keywordsString));
    console.log(chalk.gray(`(${content.keywords.length} keywords)\n`));

    // Display selling points
    console.log(chalk.yellow.bold('💡 SELLING POINTS:'));
    content.sellingPoints.forEach((point, index) => {
      console.log(chalk.cyan(`${index + 1}. ${point}`));
    });
    console.log();

    // Display optimized description
    console.log(chalk.yellow.bold('📄 OPTIMIZED DESCRIPTION:'));
    console.log(chalk.white(content.optimizedDescription));
    console.log();
  }

  /**
   * Display detailed pricing analysis
   */
  private displayPricingAnalysis(originalPrice: number, suggestedPrice: number, researchData: any): void {
    console.log(chalk.blue.bold('💰 DETAILED PRICING ANALYSIS:\n'));
    
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
   * Display image information and download options
   */
  private displayImageInfo(images: any[], outputDir?: string): void {
    console.log(chalk.blue.bold('📸 IMAGE INFORMATION:\n'));
    
    console.log(chalk.white(`Found ${images.length} image(s):`));
    
    images.forEach((image, index) => {
      console.log(chalk.cyan(`\nImage ${index + 1}:`));
      console.log(chalk.white(`  URL: ${image.url}`));
      console.log(chalk.white(`  Size: ${image.size}`));
      console.log(chalk.white(`  Alt: ${image.altText || 'No alt text'}`));
      
      if (outputDir) {
        const filename = `product-image-${index + 1}.jpg`;
        const filepath = join(outputDir, filename);
        console.log(chalk.yellow(`  Download to: ${filepath}`));
      }
    });
    
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
   * Save enhanced output to file with user confirmation
   */
  private async saveEnhancedOutput(result: PipelineResult, options: CLIOptions): Promise<void> {
    let shouldSave = true;
    let finalPath = options.output || 'optimized-listing.html';

    if (options.interactive !== false) {
      // Check if file exists
      if (existsSync(finalPath)) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `File ${finalPath} already exists. Overwrite?`,
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
        // Create output directory if it doesn't exist
        const outputDir = dirname(finalPath);
        if (!existsSync(outputDir)) {
          mkdirSync(outputDir, { recursive: true });
        }

        // Save HTML template
        writeFileSync(finalPath, result.renderedHtml, 'utf8');
        console.log(chalk.green(`\n💾 HTML template saved to: ${finalPath}`));
        
        // Save enhanced summary with copy-paste content
        const summaryPath = finalPath.replace('.html', '-enhanced-summary.txt');
        const summary = this.generateEnhancedSummary(result);
        writeFileSync(summaryPath, summary, 'utf8');
        console.log(chalk.green(`📋 Enhanced summary saved to: ${summaryPath}`));
        
        // Download images if requested
        if (options.downloadImages && result.originalDetails.images.length > 0) {
          await this.downloadImages(result.originalDetails.images, options.outputDir || dirname(finalPath));
        }
        
      } catch (error) {
        console.error(chalk.red(`❌ Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    }
  }

  /**
   * Download images to local directory
   */
  private async downloadImages(images: any[], outputDir: string): Promise<void> {
    console.log(chalk.blue.bold('\n📸 Downloading images...\n'));
    
    try {
      // Create images directory
      const imagesDir = join(outputDir, 'images');
      if (!existsSync(imagesDir)) {
        mkdirSync(imagesDir, { recursive: true });
      }

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const filename = `product-image-${i + 1}.jpg`;
        const filepath = join(imagesDir, filename);
        
        console.log(chalk.cyan(`Downloading ${image.url}...`));
        
        const response = await axios({
          method: 'GET',
          url: image.url,
          responseType: 'stream'
        });

        const writer = createWriteStream(filepath);
        await pipeline(response.data, writer);
        
        console.log(chalk.green(`✅ Saved to: ${filepath}\n`));
      }
      
      console.log(chalk.green(`📁 All images downloaded to: ${imagesDir}`));
      
    } catch (error) {
      console.error(chalk.red(`❌ Failed to download images: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Generate an enhanced text summary with copy-paste friendly content
   */
  private generateEnhancedSummary(result: PipelineResult): string {
    const { originalDetails, optimizedContent } = result;
    
    return `eBay Listing Optimization Summary - Enhanced Edition
Generated: ${new Date().toLocaleString()}

===============================================================================
📝 OPTIMIZED TITLE (Ready to Copy & Paste)
===============================================================================
"${optimizedContent.optimizedTitle}"
(${optimizedContent.optimizedTitle.length}/80 characters)

===============================================================================
🏷️  SEO KEYWORDS (Ready to Copy & Paste)
===============================================================================
${optimizedContent.keywords.join(', ')}

===============================================================================
💡 SELLING POINTS (Ready to Copy & Paste)
===============================================================================
${optimizedContent.sellingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

===============================================================================
📄 OPTIMIZED DESCRIPTION (Ready to Copy & Paste)
===============================================================================
${optimizedContent.optimizedDescription}

===============================================================================
💰 PRICING ANALYSIS
===============================================================================
Original Price: $${originalDetails.price}
Suggested Price: $${optimizedContent.suggestedPrice}
Market Confidence: ${Math.round((result.researchData?.priceAnalysis?.confidence || 0) * 100)}%

===============================================================================
📦 ORIGINAL LISTING DETAILS
===============================================================================
Title: ${originalDetails.title}
Price: $${originalDetails.price}
Condition: ${originalDetails.condition}
Images: ${originalDetails.images.length} found

===============================================================================
📸 IMAGE INFORMATION
===============================================================================
${originalDetails.images.map((img, index) => 
  `Image ${index + 1}: ${img.url} (${img.size})`
).join('\n')}

===============================================================================
NEXT STEPS
===============================================================================
1. Copy the OPTIMIZED TITLE above and paste it into your eBay listing
2. Copy the SEO KEYWORDS and include them in your eBay title and description
3. Copy the SELLING POINTS and incorporate them into your description
4. Copy the OPTIMIZED DESCRIPTION for your eBay listing
5. Download the images from the 'images' folder if you saved them locally
6. Adjust pricing based on your profit margins
7. Monitor listing performance and engagement

===============================================================================
TIPS FOR SUCCESS
===============================================================================
• The optimized title is under 80 characters and includes high-value keywords
• Keywords are based on market research and search volume analysis
• Selling points highlight the most attractive features of your product
• Pricing is optimized based on current market conditions
• All content is ready to copy and paste directly into eBay

===============================================================================
`;
  }
}
