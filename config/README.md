# Configuration System

The eBay Listing Optimizer uses a comprehensive configuration system that allows you to customize all aspects of the optimization process.

## Configuration Files

- `default.json` - Default configuration values (do not modify)
- `user.json` - Your custom configuration (created automatically)
- `user.example.json` - Example user configuration file

## Configuration Sections

### Scraping Configuration
Controls web scraping behavior:
- `requestTimeout` - Request timeout in milliseconds (min: 1000)
- `requestDelay` - Delay between requests in milliseconds
- `maxRetries` - Maximum retry attempts (0-10)
- `userAgent` - User agent string for requests
- `useProxyRotation` - Enable proxy rotation
- `proxyServers` - List of proxy servers
- `maxConcurrentRequests` - Maximum concurrent requests

### Research Configuration
Controls market research behavior:
- `maxSimilarListings` - Maximum similar listings to analyze (1-100)
- `historicalDataDays` - Days of historical data to consider
- `minConfidenceThreshold` - Minimum confidence for recommendations (0-1)
- `searchPlatforms` - Platforms to search (ebay, amazon, etc.)
- `excludeKeywords` - Keywords to exclude from analysis
- `dataSourceWeights` - Weight factors for different data sources

### Pricing Configuration
Controls pricing algorithm behavior:
- `algorithm` - Pricing algorithm (average, median, competitive, premium)
- `strategy` - Pricing strategy (aggressive, moderate, conservative)
- `marginPercentage` - Margin percentage to apply (0-100)
- `minPrice` - Minimum price threshold
- `maxPrice` - Maximum price threshold
- `weights` - Weight factors for pricing components

### Keyword Configuration
Controls keyword analysis and weighting:
- `titleWeight` - Weight for title keywords
- `descriptionWeight` - Weight for description keywords
- `categoryWeight` - Weight for category keywords
- `brandWeight` - Weight for brand keywords
- `conditionWeight` - Weight for condition keywords
- `minFrequencyThreshold` - Minimum keyword frequency
- `maxKeywords` - Maximum keywords to include (1-50)
- `trendingBoost` - Boost factor for trending keywords

### Template Configuration
Controls HTML template generation:
- `defaultTemplate` - Default template file to use
- `availableTemplates` - List of available templates
- `customStyles` - Custom CSS styling options
- `imageGallery` - Image gallery settings
- `formatting` - Content formatting options

### Optimization Configuration
Controls content optimization strategy:
- `contentStrategy` - Overall strategy (seo_focused, conversion_focused, balanced)
- `titleOptimization` - Title approach (keyword_heavy, readable, branded)
- `descriptionStyle` - Description style (detailed, concise, bullet_points)
- `pricingApproach` - Pricing approach (competitive, value_based, premium)
- `targetAudience` - Target audience (bargain_hunters, quality_seekers, brand_conscious)
- `goals` - Optimization goals

## Configuration Presets

The system includes three built-in presets:

### Beginner Preset
- Conservative scraping settings
- Single platform research (eBay only)
- Balanced optimization strategy
- Readable title optimization

### Seller Preset
- Moderate performance settings
- Multi-platform research
- Conversion-focused optimization
- Keyword-heavy titles for visibility

### Power User Preset
- Aggressive performance settings
- Extensive research parameters
- SEO-focused optimization
- Advanced customization options

## CLI Commands

Use the configuration CLI to manage your settings:

```bash
# Show current configuration
ebay-optimizer config show

# Show specific section
ebay-optimizer config show --section scraping

# Initialize with preset
ebay-optimizer config init --preset seller

# Interactive configuration update
ebay-optimizer config set

# Validate configuration
ebay-optimizer config validate

# Reset to defaults
ebay-optimizer config reset

# Export configuration
ebay-optimizer config export --output my-config.json

# Import configuration
ebay-optimizer config import --input my-config.json
```

## Programmatic Usage

```typescript
import { FileBasedConfigurationService } from './services/ConfigurationService';
import { ConfigurationHelpers } from './utils/configuration-helpers';

// Load configuration
const configService = new FileBasedConfigurationService();
const config = await configService.loadConfiguration();

// Create preset
const sellerPreset = ConfigurationHelpers.createPreset('seller');

// Optimize for use case
const optimizedConfig = ConfigurationHelpers.optimizeForUseCase(config, 'high_volume');

// Validate business requirements
const issues = ConfigurationHelpers.validateBusinessRequirements(config, {
  maxProcessingTime: 30000,
  minDataQuality: 0.8,
  complianceLevel: 'strict'
});
```

## Best Practices

1. **Start with a preset** - Use the appropriate preset for your use case
2. **Validate regularly** - Run validation after making changes
3. **Backup configurations** - Export your configuration before major changes
4. **Monitor performance** - Use the processing time estimates to optimize
5. **Respect rate limits** - Configure appropriate delays for web scraping
6. **Test thoroughly** - Validate changes with real listings before production use

## Troubleshooting

### Configuration Validation Errors
- Check that numeric values are within valid ranges
- Ensure required fields are not empty
- Verify that file paths exist and are accessible

### Performance Issues
- Reduce `maxSimilarListings` for faster processing
- Increase `requestDelay` if getting rate limited
- Lower `maxConcurrentRequests` for stability

### Quality Issues
- Increase `minConfidenceThreshold` for better recommendations
- Extend `historicalDataDays` for more data
- Adjust keyword weights based on your product category

## Migration

When upgrading to newer versions, the configuration system will automatically migrate your settings. Check the validation output for any compatibility issues.