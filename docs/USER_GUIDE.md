# eBay Listing Optimizer - User Guide

## Overview

The eBay Listing Optimizer is a comprehensive tool that transforms existing eBay product listings into optimized, high-converting listings through automated web scraping, market research, and content generation.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Usage](#basic-usage)
3. [Advanced Features](#advanced-features)
4. [Configuration](#configuration)
5. [Understanding Results](#understanding-results)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Internet connection for web scraping and market research

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ebay-listing-optimizer

# Install dependencies
npm install

# Build the project
npm run build
```

### Quick Start

```bash
# Run the optimizer with an eBay URL
npm start -- --url "https://www.ebay.com/itm/your-listing-id"

# Or use the interactive CLI
npm start
```

## Basic Usage

### Command Line Interface

The simplest way to use the optimizer is through the command line:

```bash
# Basic usage
npm start -- --url "https://www.ebay.com/itm/123456789"

# With output file
npm start -- --url "https://www.ebay.com/itm/123456789" --output "optimized-listing.html"

# Verbose mode for detailed logging
npm start -- --url "https://www.ebay.com/itm/123456789" --verbose
```

### Interactive Mode

Run without arguments to enter interactive mode:

```bash
npm start
```

You'll be prompted to:
1. Enter the eBay listing URL
2. Choose optimization preferences
3. Review extracted details
4. Confirm research findings
5. Review optimized content

### Programmatic Usage

```typescript
import { Pipeline } from './src/pipeline';
import { 
  WebScrapingService,
  ProductExtractor,
  MarketResearchEngine,
  ResearchDataAnalyzer,
  ContentOptimizer,
  TemplateRenderer
} from './src/services';

// Initialize services
const webScraper = new WebScrapingService();
const productExtractor = new ProductExtractor();
const marketResearcher = new MarketResearchEngine();
const dataAnalyzer = new ResearchDataAnalyzer();
const contentOptimizer = new ContentOptimizer();
const templateRenderer = new TemplateRenderer();

// Create pipeline
const pipeline = new Pipeline(
  webScraper,
  productExtractor,
  marketResearcher,
  dataAnalyzer,
  contentOptimizer,
  templateRenderer
);

// Process listing
const result = await pipeline.processListing('https://www.ebay.com/itm/123456789');
console.log(result.htmlTemplate);
```

## Advanced Features

### Batch Processing

Process multiple listings at once:

```bash
# Process multiple URLs from a file
npm start -- --batch urls.txt --output-dir ./optimized-listings/

# Process with custom configuration
npm start -- --batch urls.txt --config custom-config.json
```

### Custom Templates

Use your own HTML templates:

```bash
npm start -- --url "..." --template custom-template.html
```

### Configuration Presets

Use predefined optimization strategies:

```bash
# Speed-focused optimization
npm start -- --preset speed-focus --url "..."

# Quality-focused optimization  
npm start -- --preset quality-focus --url "..."

# High-volume seller preset
npm start -- --preset high-volume --url "..."
```

## Configuration

### Configuration Files

The optimizer uses JSON configuration files located in the `config/` directory:

- `config/default.json` - Default settings
- `config/user.json` - User-specific overrides
- `config/presets/` - Predefined optimization strategies

### Key Configuration Options

```json
{
  "scraping": {
    "timeout": 30000,
    "retries": 3,
    "userAgent": "Mozilla/5.0...",
    "rateLimit": {
      "requests": 10,
      "window": 60000
    }
  },
  "research": {
    "maxSimilarListings": 20,
    "priceAnalysisWindow": 30,
    "keywordThreshold": 5
  },
  "optimization": {
    "titleMaxLength": 80,
    "descriptionMaxLength": 1000,
    "maxKeywords": 10,
    "maxSellingPoints": 5
  },
  "template": {
    "maxImages": 5,
    "imageSize": "large",
    "includeGallery": true
  }
}
```

### Environment Variables

```bash
# API keys (if using external services)
EBAY_API_KEY=your_api_key
MARKET_RESEARCH_API_KEY=your_api_key

# Logging level
LOG_LEVEL=info

# Cache settings
CACHE_ENABLED=true
CACHE_TTL=3600
```

## Understanding Results

### Output Structure

The optimizer produces several outputs:

1. **Extracted Details** - Original product information
2. **Research Data** - Market analysis and competitive intelligence
3. **Optimized Content** - Enhanced title, description, and pricing
4. **HTML Template** - Ready-to-use eBay listing

### Result Object

```typescript
interface OptimizationResult {
  originalDetails: ProductDetails;
  researchData: ResearchData;
  optimizedContent: OptimizedContent;
  htmlTemplate: string;
  metadata: {
    processingTime: number;
    confidence: number;
    warnings: string[];
  };
}
```

### Quality Metrics

The optimizer provides quality scores for:

- **Title Optimization** - SEO and keyword effectiveness
- **Description Quality** - Compelling copy and feature highlights
- **Pricing Accuracy** - Market-based pricing recommendations
- **Image Quality** - Gallery completeness and image resolution
- **Overall Confidence** - Combined optimization confidence score

## Troubleshooting

### Common Issues

#### "Failed to scrape URL"
- **Cause**: Network issues, rate limiting, or invalid URL
- **Solution**: Check internet connection, verify URL, wait and retry

#### "Insufficient research data"
- **Cause**: Limited similar listings found
- **Solution**: Try broader search terms or different product categories

#### "Template rendering failed"
- **Cause**: Missing template file or invalid content
- **Solution**: Check template file exists and contains valid placeholders

#### "Image extraction failed"
- **Cause**: Images not accessible or invalid URLs
- **Solution**: Check image URLs manually, may need to update extraction logic

### Debug Mode

Enable detailed logging:

```bash
npm start -- --debug --url "..."
```

This provides:
- Step-by-step processing logs
- Network request details
- Extraction debugging information
- Performance metrics

### Log Files

Logs are written to:
- `logs/optimizer.log` - General application logs
- `logs/errors.log` - Error-specific logs
- `logs/performance.log` - Performance metrics

## Best Practices

### URL Selection

- Use active eBay listings for best results
- Avoid expired or removed listings
- Choose listings with good image quality
- Select listings with detailed descriptions

### Optimization Strategy

1. **Start with Quality Focus** - Use quality-focused preset for initial optimization
2. **Review Research Data** - Verify market research makes sense for your product
3. **Customize Content** - Adjust optimized content to match your selling style
4. **Test Templates** - Preview generated HTML before using on eBay

### Performance Tips

- **Use Caching** - Enable caching for repeated optimizations
- **Batch Processing** - Process multiple listings together for efficiency
- **Rate Limiting** - Respect eBay's rate limits to avoid blocking
- **Monitor Resources** - Watch memory usage for large batch operations

### Content Guidelines

#### Title Optimization
- Keep under 80 characters
- Include primary keywords early
- Use specific product details
- Avoid excessive punctuation

#### Description Best Practices
- Lead with key benefits
- Use bullet points for features
- Include condition details
- Add shipping and return information

#### Pricing Strategy
- Consider market positioning
- Factor in your costs and margins
- Account for seasonal variations
- Monitor competitor pricing

### Template Customization

#### HTML Structure
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
</head>
<body>
    <div class="listing-container">
        <h1>{{OPTIMIZED_TITLE}}</h1>
        <div class="image-gallery">{{IMAGE_GALLERY}}</div>
        <div class="description">{{OPTIMIZED_DESCRIPTION}}</div>
        <div class="price">{{SUGGESTED_PRICE}}</div>
        <div class="condition">{{CONDITION_NOTES}}</div>
        <div class="keywords">{{KEYWORDS}}</div>
    </div>
</body>
</html>
```

#### Available Placeholders
- `{{TITLE}}` - Original title
- `{{OPTIMIZED_TITLE}}` - SEO-optimized title
- `{{OPTIMIZED_DESCRIPTION}}` - Enhanced description
- `{{SUGGESTED_PRICE}}` - Recommended price
- `{{CONDITION_NOTES}}` - Condition assessment
- `{{KEYWORDS}}` - Comma-separated keywords
- `{{SELLING_POINTS}}` - Bullet-pointed selling points
- `{{IMAGE_GALLERY}}` - HTML image gallery
- `{{SPECIFICATIONS}}` - Product specifications table

## API Reference

### Core Classes

#### Pipeline
Main orchestration class that coordinates all optimization steps.

```typescript
class Pipeline {
  async processListing(url: string): Promise<OptimizationResult>
}
```

#### WebScrapingService
Handles URL fetching and content extraction.

```typescript
class WebScrapingService {
  async scrapeUrl(url: string): Promise<WebpageContent>
}
```

#### ProductExtractor
Extracts structured product data from HTML content.

```typescript
class ProductExtractor {
  async extractProductDetails(content: WebpageContent): Promise<ProductDetails>
  async extractImageGallery(content: WebpageContent): Promise<ImageData[]>
  async validateImageUrls(images: ImageData[]): Promise<ImageData[]>
}
```

#### MarketResearchEngine
Conducts competitive analysis and market research.

```typescript
class MarketResearchEngine {
  async conductResearch(productDetails: ProductDetails): Promise<ResearchData>
}
```

#### ContentOptimizer
Generates optimized titles, descriptions, and pricing.

```typescript
class ContentOptimizer {
  async optimizeContent(
    originalDetails: ProductDetails, 
    research: ResearchData
  ): Promise<OptimizedContent>
}
```

#### TemplateRenderer
Populates HTML templates with optimized content.

```typescript
class TemplateRenderer {
  async renderTemplate(
    optimizedContent: OptimizedContent,
    originalDetails: ProductDetails,
    templatePath: string
  ): Promise<string>
  
  generateImageGallery(images: ImageData[], maxImages?: number): string
}
```

### Data Models

See the [API documentation](API.md) for complete interface definitions.

## Support

For issues, questions, or contributions:

1. Check the [troubleshooting section](#troubleshooting)
2. Review existing [GitHub issues](link-to-issues)
3. Create a new issue with detailed information
4. Include logs and configuration when reporting bugs

## License

This project is licensed under the MIT License. See LICENSE file for details.