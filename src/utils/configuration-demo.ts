#!/usr/bin/env node

/**
 * Configuration System Demonstration
 * 
 * This script demonstrates the comprehensive configuration and customization system
 * for the eBay Listing Optimizer, showcasing all the features implemented in task 13.
 */

import { FileBasedConfigurationService } from '../services/ConfigurationService';
import { ConfigurationHelpers } from './configuration-helpers';
import { getLogger } from './logger';

const logger = getLogger();

async function demonstrateConfigurationSystem() {
  console.log('🔧 eBay Listing Optimizer - Configuration System Demo\n');
  
  try {
    const configService = new FileBasedConfigurationService();
    
    // 1. Load default configuration
    console.log('📋 1. Loading Default Configuration...');
    const defaultConfig = configService.getDefaultConfiguration();
    console.log(`   ✅ Version: ${defaultConfig.version}`);
    console.log(`   ✅ Scraping timeout: ${defaultConfig.scraping.requestTimeout}ms`);
    console.log(`   ✅ Research platforms: ${defaultConfig.research.searchPlatforms.join(', ')}`);
    console.log(`   ✅ Pricing strategy: ${defaultConfig.pricing.strategy}`);
    console.log(`   ✅ Max images: ${defaultConfig.templates.imageGallery.maxImages}`);
    
    // 2. Validate configuration
    console.log('\n🔍 2. Validating Configuration...');
    const validation = configService.validateConfigurationDetailed(defaultConfig);
    console.log(`   ✅ Valid: ${validation.isValid}`);
    console.log(`   ✅ Completeness: ${(validation.completenessScore! * 100).toFixed(1)}%`);
    console.log(`   ✅ Estimated processing time: ${validation.estimatedProcessingTime}ms`);
    if (validation.warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${validation.warnings.length}`);
    }
    
    // 3. Create and apply preset
    console.log('\n🎯 3. Creating and Applying Preset...');
    const sellerPreset = ConfigurationHelpers.createPreset('seller');
    const configWithPreset = configService.mergeConfiguration(sellerPreset, defaultConfig);
    console.log(`   ✅ Seller preset applied`);
    console.log(`   ✅ New timeout: ${configWithPreset.scraping.requestTimeout}ms`);
    console.log(`   ✅ New strategy: ${configWithPreset.pricing.strategy}`);
    console.log(`   ✅ New margin: ${configWithPreset.pricing.marginPercentage}%`);
    
    // 4. Optimize for use case
    console.log('\n⚡ 4. Optimizing for High Volume Use Case...');
    const optimizedConfig = ConfigurationHelpers.optimizeForUseCase(configWithPreset, 'high_volume');
    console.log(`   ✅ Concurrent requests: ${optimizedConfig.scraping.maxConcurrentRequests}`);
    console.log(`   ✅ Request delay: ${optimizedConfig.scraping.requestDelay}ms`);
    console.log(`   ✅ Max similar listings: ${optimizedConfig.research.maxSimilarListings}`);
    console.log(`   ✅ Max images: ${optimizedConfig.templates.imageGallery.maxImages}`);
    
    // 5. Generate recommendations
    console.log('\n💡 5. Generating Recommendations...');
    const recommendations = ConfigurationHelpers.generateRecommendations(defaultConfig, 'quality_focus');
    if (recommendations.length > 0) {
      console.log(`   ✅ Found ${recommendations.length} recommendations:`);
      recommendations.forEach((rec, index) => {
        console.log(`      ${index + 1}. ${rec}`);
      });
    } else {
      console.log('   ✅ Configuration already optimized for quality focus');
    }
    
    // 6. Validate business requirements
    console.log('\n🏢 6. Validating Business Requirements...');
    const businessIssues = ConfigurationHelpers.validateBusinessRequirements(optimizedConfig, {
      maxProcessingTime: 60000,
      minDataQuality: 0.7,
      complianceLevel: 'basic'
    });
    
    if (businessIssues.length === 0) {
      console.log('   ✅ All business requirements met');
    } else {
      console.log(`   ⚠️  ${businessIssues.length} business requirement issues:`);
      businessIssues.forEach((issue, index) => {
        console.log(`      ${index + 1}. ${issue}`);
      });
    }
    
    // 7. Create custom preset and theme
    console.log('\n🎨 7. Creating Custom Preset and Theme...');
    const customPreset = ConfigurationHelpers.createPresetFromConfiguration(
      optimizedConfig,
      'High Volume Seller',
      'Optimized configuration for high-volume eBay sellers'
    );
    console.log(`   ✅ Custom preset created: ${customPreset.name}`);
    
    const customTheme = ConfigurationHelpers.createThemeFromTemplate(
      optimizedConfig.templates,
      'High Volume Theme',
      'Clean theme optimized for fast processing'
    );
    console.log(`   ✅ Custom theme created: ${customTheme.name}`);
    
    // 8. Configuration diff
    console.log('\n📊 8. Configuration Comparison...');
    const diff = ConfigurationHelpers.createConfigurationDiff(defaultConfig, optimizedConfig);
    const changedSections = Object.keys(diff);
    console.log(`   ✅ ${changedSections.length} sections changed: ${changedSections.join(', ')}`);
    
    // 9. Processing time estimation
    console.log('\n⏱️  9. Processing Time Analysis...');
    const defaultTime = ConfigurationHelpers.estimateProcessingTime(defaultConfig);
    const optimizedTime = ConfigurationHelpers.estimateProcessingTime(optimizedConfig);
    const improvement = ((defaultTime - optimizedTime) / defaultTime * 100).toFixed(1);
    console.log(`   ✅ Default config: ${defaultTime}ms`);
    console.log(`   ✅ Optimized config: ${optimizedTime}ms`);
    console.log(`   ✅ Performance improvement: ${improvement}%`);
    
    console.log('\n🎉 Configuration System Demo Complete!');
    console.log('\nKey Features Demonstrated:');
    console.log('✅ Configuration loading and validation');
    console.log('✅ Preset creation and application');
    console.log('✅ Use case optimization');
    console.log('✅ Recommendation generation');
    console.log('✅ Business requirement validation');
    console.log('✅ Custom preset and theme creation');
    console.log('✅ Configuration comparison and analysis');
    console.log('✅ Performance estimation and optimization');
    
  } catch (error) {
    logger.error('Demo failed', error as Error);
    console.error('❌ Demo failed:', error);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateConfigurationSystem().catch(console.error);
}

export { demonstrateConfigurationSystem };