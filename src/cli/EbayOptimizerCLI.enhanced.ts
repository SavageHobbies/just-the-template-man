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

    // Display keywords with enhanced formatting
    console.log(chalk.yellow.bold('🏷️  SEO KEYWORDS:'));
    console.log(chalk.cyan('Keywords ready to copy:'));
    console.log(chalk.white(content.keywords.join(', ')));
    
    // Display keyword copy blocks
    console.log(chalk.gray('\n--- COPY BLOCKS ---'));
    console.log(chalk.cyan('For eBay Title:'));
    console.log(chalk.white(content.keywords.slice(0, 3).join(' ')));
    
    console.log(chalk.cyan('\nFor eBay Description:'));
    console.log(chalk.white(content.keywords.join(', ')));
    console.log(chalk.gray(`(${content.keywords.length} keywords total)\n`));

    // Display selling points with enhanced formatting
    console.log(chalk.yellow.bold('💡 SELLING POINTS:'));
    console.log(chalk.cyan('Selling points ready to copy:'));
    content.sellingPoints.forEach((point, index) => {
      console.log(chalk.white(`${index + 1}. ${point}`));
    });
    
    // Display selling points copy block
    console.log(chalk.gray('\n--- COPY BLOCK ---'));
    console.log(chalk.cyan('Copy these points directly into your description:'));
    const sellingPointsBlock = content.sellingPoints.map((point, index) => 
      chalk.white(`${index + 1}. ${point}`)
    ).join('\n');
    console.log(sellingPointsBlock);
    console.log();

    // Display optimized description with enhanced formatting
    console.log(chalk.yellow.bold('📄 OPTIMIZED DESCRIPTION:'));
    console.log(chalk.cyan('Description ready to copy:'));
    console.log(chalk.white(content.optimizedDescription));
    
    // Display description copy block
    console.log(chalk.gray('\n--- COPY BLOCK ---'));
    console.log(chalk.cyan('Copy this entire description:'));
    console.log(chalk.white('='.repeat(60)));
    console.log(chalk.white(content.optimizedDescription));
    console.log(chalk.white('='.repeat(60)));
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
   * Download images to local directory with enhanced JPG support
   */
  private async downloadImages(images: any[], outputDir: string): Promise<void> {
    console.log(chalk.blue.bold('\n📸 DOWNLOADING IMAGES - Enhanced JPG Support\n'));
    
    try {
      // Create images directory
      const imagesDir = join(outputDir, 'images');
      if (!existsSync(imagesDir)) {
        mkdirSync(imagesDir, { recursive: true });
        console.log(chalk.green(`✅ Created directory: ${imagesDir}`));
      }

      let successCount = 0;
      let failedCount = 0;
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const filename = `product-image-${i + 1}.jpg`;
        
        console.log(chalk.cyan(`\n📥 Downloading Image ${i + 1}/${images.length}:`));
        console.log(chalk.white(`   URL: ${image.url}`));
        console.log(chalk.white(`   Filename: ${filename}`));
        
        try {
          // Check if URL contains image extension
          const urlLower = image.url.toLowerCase();
          const isJpg = urlLower.includes('.jpg') || urlLower.includes('.jpeg');
          const isPng = urlLower.includes('.png');
          const isWebp = urlLower.includes('.webp');
          
          // Use appropriate extension based on URL or default to .jpg
          let finalFilename = filename;
          if (isJpg) {
            finalFilename = filename.replace('.jpg', '.jpg');
          } else if (isPng) {
            finalFilename = filename.replace('.jpg', '.png');
          } else if (isWebp) {
            finalFilename = filename.replace('.jpg', '.webp');
          }
          
          const finalFilepath = join(imagesDir, finalFilename);
          
          console.log(chalk.white(`   Saving as: ${finalFilepath}`));
          
          const response = await axios({
            method: 'GET',
            url: image.url,
            responseType: 'stream',
            timeout: 30000, // 30 second timeout
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const writer = createWriteStream(finalFilepath);
          await pipeline(response.data, writer);
          
          // Verify file was created and has content
          const stats = require('fs').statSync(finalFilepath);
          if (stats.size > 0) {
            successCount++;
            console.log(chalk.green(`   ✅ Successfully downloaded (${(stats.size / 1024).toFixed(2)} KB)`));
          } else {
            failedCount++;
            console.log(chalk.red(`   ❌ Downloaded file is empty`));
            require('fs').unlinkSync(finalFilepath); // Remove empty file
          }
          
        } catch (downloadError) {
          failedCount++;
          console.error(chalk.red(`   ❌ Failed to download: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`));
        }
      }
      
      // Summary report
      console.log(chalk.blue.bold('\n📊 DOWNLOAD SUMMARY:'));
      console.log(chalk.green(`✅ Successfully downloaded: ${successCount} image(s)`));
      if (failedCount > 0) {
        console.log(chalk.yellow(`⚠️  Failed to download: ${failedCount} image(s)`));
      }
      console.log(chalk.white(`📁 All images saved to: ${imagesDir}`));
      
      // Provide next steps
      console.log(chalk.cyan('\n📋 NEXT STEPS:'));
      console.log(chalk.white('1. Check the images folder for your downloaded files'));
      console.log(chalk.white('2. Review image quality before uploading to eBay'));
      console.log(chalk.white('3. Rename files if needed for better organization'));
      
    } catch (error) {
      console.error(chalk.red(`\n❌ CRITICAL ERROR: Failed to download images: ${error instanceof Error ? error.message : 'Unknown error'}`));
      console.error(chalk.yellow('💡 TROUBLESHOOTING:'));
      console.error(chalk.white('• Check your internet connection'));
      console.error(chalk.white('• Verify image URLs are accessible'));
      console.error(chalk.white('• Try running the command again'));
    }
  }

  /**
   * Generate an enhanced text summary with copy-paste friendly content
   */
  private generateEnhancedSummary(result: PipelineResult): string {
    const { originalDetails, optimizedContent } = result;
    
    return `eBay Listing Optimization Summary - Enhanced Edition
Generated: ${new Date().toLocaleString()}

📝 OPTIMIZED TITLE (Ready to Copy & Paste)
"${optimizedContent.optimizedTitle}"
(${optimizedContent.optimizedTitle.length}/80 characters)

🏷️  SEO KEYWORDS (Ready to Copy & Paste)

KEYWORDS FOR EBAY TITLE (Top 3):
${optimizedContent.keywords.slice(0, 3).join(' ')}

ALL KEYWORDS FOR DESCRIPTION:
${optimizedContent.keywords.join(', ')}

KEYWORDS COUNT: ${optimizedContent.keywords.length}

💡 SELLING POINTS (Ready to Copy & Paste)

COPY THESE POINTS DIRECTLY INTO YOUR DESCRIPTION:
${optimizedContent.sellingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

SELLING POINTS COUNT: ${optimizedContent.sellingPoints.length}

📄 OPTIMIZED DESCRIPTION (Ready to Copy & Paste)

COPY THIS ENTIRE DESCRIPTION:
${'='.repeat(60)}
${optimizedContent.optimizedDescription}
${'='.repeat(60)}

DESCRIPTION LENGTH: ${optimizedContent.optimizedDescription.length} characters

💰 PRICING ANALYSIS

ORIGINAL PRICE: $${originalDetails.price}
SUGGESTED PRICE: $${optimizedContent.suggestedPrice}
MARKET CONFIDENCE: ${Math.round((result.researchData?.priceAnalysis?.confidence || 0) * 100)}%

${result.researchData && result.researchData.priceAnalysis ? `
MARKET AVERAGE: $${result.researchData.priceAnalysis.averagePrice}
PRICE RANGE: $${result.researchData.priceAnalysis.priceRange.min} - $${result.researchData.priceAnalysis.priceRange.max}
SIMILAR LISTINGS ANALYZED: ${result.researchData.similarListings?.length || 0}
` : ''}

📦 ORIGINAL LISTING DETAILS

ORIGINAL TITLE: ${originalDetails.title}
ORIGINAL PRICE: $${originalDetails.price}
CONDITION: ${originalDetails.condition}
IMAGES FOUND: ${originalDetails.images.length}
SELLER: ${originalDetails.seller}
LOCATION: ${originalDetails.location}

📸 IMAGE INFORMATION

${originalDetails.images.map((img, index) => 
  `IMAGE ${index + 1}:
   URL: ${img.url}
   SIZE: ${img.size}
   ALT TEXT: ${img.altText || 'No alt text provided'}
   `.trim()
).join('\n\n')}

🔧 QUICK ACTION CHECKLIST

✅ BEFORE LISTING:
[ ] Copy optimized title to eBay listing
[ ] Add top 3 keywords to eBay title
[ ] Copy all keywords to eBay description
[ ] Copy selling points to eBay description
[ ] Copy optimized description to eBay description
[ ] Download and upload images
[ ] Set suggested price or adjust as needed

✅ AFTER LISTING:
[ ] Monitor views and clicks
[ ] Track engagement metrics
[ ] Adjust keywords based on performance
[ ] Update pricing if market changes

📊 MARKET INSIGHTS

${result.researchData && result.researchData.similarListings && result.researchData.similarListings.length > 0 ? `
COMPETITIVE ANALYSIS:
- Found ${result.researchData.similarListings.length} similar listings
- Price positioning: ${this.getPricePositioning(originalDetails.price, optimizedContent.suggestedPrice, result.researchData.priceAnalysis)}
- Market opportunity: ${this.getMarketOpportunity(originalDetails.price, optimizedContent.suggestedPrice)}

TOP COMPETITIVE KEYWORDS FROM MARKET RESEARCH:
${this.extractTopMarketKeywords(result.researchData).join(', ')}
` : 'Market research data not available for this listing.'}

💡 PRO TIPS FOR SUCCESS

TITLE OPTIMIZATION:
• Keep under 80 characters for maximum visibility
• Include high-value keywords at the beginning
• Use clear, descriptive language
• Avoid excessive punctuation or symbols

KEYWORD STRATEGY:
• Use keywords naturally in title and description
• Include misspellings and variations
• Add seasonal or trend-related keywords
• Don't keyword stuff - keep it readable

DESCRIPTION BEST PRACTICES:
• Write in short, scannable paragraphs
• Use bullet points for key features
• Include specifications and dimensions
• Add call-to-action phrases
• Highlight unique selling propositions

IMAGE OPTIMIZATION:
• Use high-quality, well-lit photos
• Include multiple angles
• Show scale with common objects
• Clean and edit images before uploading
• Use descriptive filenames

PRICING STRATEGY:
• Consider shipping costs in your pricing
• Research competitor pricing regularly
• Be flexible for offers and negotiations
• Monitor market trends and adjust accordingly

`;
  }

  /**
   * Helper method to determine price positioning
   */
  private getPricePositioning(originalPrice: number, suggestedPrice: number, priceAnalysis: any): string {
    if (!priceAnalysis) return 'Unknown';
    
    const avgPrice = priceAnalysis.averagePrice;
    const priceDiff = suggestedPrice - avgPrice;
    const percentDiff = (priceDiff / avgPrice) * 100;
    
    if (Math.abs(percentDiff) < 5) return 'Competitive';
    if (percentDiff > 10) return 'Premium';
    if (percentDiff < -10) return 'Budget';
    return 'Standard';
  }

  /**
   * Helper method to determine market opportunity
   */
  private getMarketOpportunity(originalPrice: number, suggestedPrice: number): string {
    const priceDiff = suggestedPrice - originalPrice;
    const percentChange = (priceDiff / originalPrice) * 100;
    
    if (percentChange > 20) return 'High potential for increased profit';
    if (percentChange > 0) return 'Moderate profit opportunity';
    if (percentChange > -10) return 'Competitive pricing adjustment';
    return 'Significant price reduction needed';
  }

  /**
   * Helper method to extract top market keywords
   */
  private extractTopMarketKeywords(researchData: any): string[] {
    if (!researchData || !researchData.keywordAnalysis) return [];
    
    const { popularKeywords } = researchData.keywordAnalysis;
    return popularKeywords.slice(0, 5); // Return top 5 keywords
  }
}
