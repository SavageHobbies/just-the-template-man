import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { FileBasedConfigurationService } from '../services/ConfigurationService';
import { ConfigurationHelpers } from '../utils/configuration-helpers';
import { SystemConfiguration } from '../models/configuration';

export class ConfigurationCLI {
  private configService: FileBasedConfigurationService;

  constructor() {
    this.configService = new FileBasedConfigurationService();
  }

  /**
   * Creates the configuration CLI command structure
   */
  createCommand(): Command {
    const configCmd = new Command('config');
    configCmd.description('Manage eBay Listing Optimizer configuration');

    // Show current configuration
    configCmd
      .command('show')
      .description('Display current configuration')
      .option('-s, --section <section>', 'Show specific section only')
      .action(async (options) => {
        await this.showConfiguration(options.section);
      });

    // Initialize configuration with preset
    configCmd
      .command('init')
      .description('Initialize configuration with a preset')
      .option('-p, --preset <preset>', 'Preset type (beginner, seller, power_user)')
      .action(async (options) => {
        await this.initializeConfiguration(options.preset);
      });

    // Update configuration section
    configCmd
      .command('set')
      .description('Update configuration values')
      .action(async () => {
        await this.updateConfiguration();
      });

    // Validate configuration
    configCmd
      .command('validate')
      .description('Validate current configuration')
      .action(async () => {
        await this.validateConfiguration();
      });

    // Reset to defaults
    configCmd
      .command('reset')
      .description('Reset configuration to defaults')
      .option('-s, --section <section>', 'Reset specific section only')
      .action(async (options) => {
        await this.resetConfiguration(options.section);
      });

    // Export configuration
    configCmd
      .command('export')
      .description('Export configuration to file')
      .option('-o, --output <file>', 'Output file path')
      .action(async (options) => {
        await this.exportConfiguration(options.output);
      });

    // Import configuration
    configCmd
      .command('import')
      .description('Import configuration from file')
      .option('-i, --input <file>', 'Input file path')
      .action(async (options) => {
        await this.importConfiguration(options.input);
      });

    // List presets
    configCmd
      .command('presets')
      .description('List available configuration presets')
      .action(async () => {
        await this.listPresets();
      });

    // Apply preset
    configCmd
      .command('apply-preset')
      .description('Apply a configuration preset')
      .option('-p, --preset <preset>', 'Preset name to apply')
      .action(async (options) => {
        await this.applyPreset(options.preset);
      });

    // List themes
    configCmd
      .command('themes')
      .description('List available themes')
      .action(async () => {
        await this.listThemes();
      });

    // Apply theme
    configCmd
      .command('apply-theme')
      .description('Apply a theme to templates')
      .option('-t, --theme <theme>', 'Theme name to apply')
      .action(async (options) => {
        await this.applyTheme(options.theme);
      });

    // Generate recommendations
    configCmd
      .command('recommend')
      .description('Get configuration recommendations')
      .option('-u, --use-case <useCase>', 'Use case (high_volume, quality_focus, speed_focus, beginner_friendly)')
      .action(async (options) => {
        await this.generateRecommendations(options.useCase);
      });

    return configCmd;
  }

  private async showConfiguration(section?: string): Promise<void> {
    try {
      const config = await this.configService.loadConfiguration();
      
      console.log(chalk.blue('\n📋 Current Configuration\n'));
      
      if (section) {
        if (section in config) {
          console.log(chalk.yellow(`[${section}]`));
          console.log(JSON.stringify(config[section as keyof SystemConfiguration], null, 2));
        } else {
          console.log(chalk.red(`❌ Section '${section}' not found`));
          return;
        }
      } else {
        // Show summary of all sections
        console.log(chalk.green('📊 Configuration Summary:'));
        console.log(`Version: ${config.version}`);
        console.log(`Last Updated: ${config.lastUpdated.toISOString()}`);
        console.log(`\n🔧 Sections:`);
        console.log(`  • Scraping: ${config.scraping.requestTimeout}ms timeout, ${config.scraping.maxRetries} retries`);
        console.log(`  • Research: ${config.research.maxSimilarListings} listings, ${config.research.historicalDataDays} days`);
        console.log(`  • Pricing: ${config.pricing.strategy} strategy, ${config.pricing.marginPercentage}% margin`);
        console.log(`  • Keywords: ${config.keywords.maxKeywords} max keywords`);
        console.log(`  • Templates: ${config.templates.defaultTemplate}, ${config.templates.imageGallery.maxImages} max images`);
        console.log(`  • Optimization: ${config.optimization.contentStrategy} strategy`);
        
        console.log(chalk.gray('\nUse --section <name> to view detailed configuration for a specific section'));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Error loading configuration: ${error}`));
    }
  }

  private async initializeConfiguration(preset?: string): Promise<void> {
    try {
      let presetType = preset;
      
      if (!presetType) {
        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'preset',
            message: 'Choose a configuration preset:',
            choices: [
              { name: '🔰 Beginner - Conservative settings for new users', value: 'beginner' },
              { name: '💼 Seller - Balanced settings for regular sellers', value: 'seller' },
              { name: '⚡ Power User - Advanced settings for experienced users', value: 'power_user' }
            ]
          }
        ]);
        presetType = answer.preset;
      }

      if (!presetType || !['beginner', 'seller', 'power_user'].includes(presetType)) {
        console.log(chalk.red('❌ Invalid preset type. Use: beginner, seller, or power_user'));
        return;
      }

      const presetConfig = ConfigurationHelpers.createPreset(presetType as any);
      const defaultConfig = this.configService.getDefaultConfiguration();
      const finalConfig = this.configService.mergeConfiguration(presetConfig, defaultConfig);

      await this.configService.saveConfiguration(finalConfig);
      
      console.log(chalk.green(`✅ Configuration initialized with ${presetType} preset`));
      console.log(chalk.gray('Use "config show" to view the current configuration'));
      
    } catch (error) {
      console.log(chalk.red(`❌ Error initializing configuration: ${error}`));
    }
  }

  private async updateConfiguration(): Promise<void> {
    try {
      const config = await this.configService.loadConfiguration();
      
      const sectionAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'section',
          message: 'Which section would you like to update?',
          choices: [
            { name: '🌐 Scraping - Web scraping settings', value: 'scraping' },
            { name: '🔍 Research - Market research settings', value: 'research' },
            { name: '💰 Pricing - Pricing algorithm settings', value: 'pricing' },
            { name: '🏷️ Keywords - Keyword weighting settings', value: 'keywords' },
            { name: '🎨 Templates - Template and styling settings', value: 'templates' },
            { name: '⚙️ Optimization - Content optimization settings', value: 'optimization' }
          ]
        }
      ]);

      await this.updateConfigurationSection(config, sectionAnswer.section);
      
    } catch (error) {
      console.log(chalk.red(`❌ Error updating configuration: ${error}`));
    }
  }

  private async updateConfigurationSection(config: SystemConfiguration, section: string): Promise<void> {
    const updates: any = {};
    
    switch (section) {
      case 'scraping':
        const scrapingAnswers = await inquirer.prompt([
          {
            type: 'number',
            name: 'requestTimeout',
            message: 'Request timeout (ms):',
            default: config.scraping.requestTimeout,
            validate: (value: number) => value >= 1000 || 'Must be at least 1000ms'
          },
          {
            type: 'number',
            name: 'requestDelay',
            message: 'Delay between requests (ms):',
            default: config.scraping.requestDelay
          },
          {
            type: 'number',
            name: 'maxRetries',
            message: 'Maximum retry attempts:',
            default: config.scraping.maxRetries,
            validate: (value: number) => (value >= 0 && value <= 10) || 'Must be between 0 and 10'
          },
          {
            type: 'number',
            name: 'maxConcurrentRequests',
            message: 'Maximum concurrent requests:',
            default: config.scraping.maxConcurrentRequests,
            validate: (value: number) => value >= 1 || 'Must be at least 1'
          }
        ] as any);
        Object.assign(updates, scrapingAnswers);
        break;

      case 'research':
        const researchAnswers = await inquirer.prompt([
          {
            type: 'number',
            name: 'maxSimilarListings',
            message: 'Maximum similar listings to analyze:',
            default: config.research.maxSimilarListings,
            validate: (value: number) => (value >= 1 && value <= 100) || 'Must be between 1 and 100'
          },
          {
            type: 'number',
            name: 'historicalDataDays',
            message: 'Historical data period (days):',
            default: config.research.historicalDataDays
          },
          {
            type: 'number',
            name: 'minConfidenceThreshold',
            message: 'Minimum confidence threshold (0-1):',
            default: config.research.minConfidenceThreshold,
            validate: (value: number) => (value >= 0 && value <= 1) || 'Must be between 0 and 1'
          }
        ] as any);
        Object.assign(updates, researchAnswers);
        break;

      case 'pricing':
        const pricingAnswers = await inquirer.prompt([
          {
            type: 'list',
            name: 'strategy',
            message: 'Pricing strategy:',
            choices: ['aggressive', 'moderate', 'conservative'],
            default: config.pricing.strategy
          },
          {
            type: 'number',
            name: 'marginPercentage',
            message: 'Margin percentage:',
            default: config.pricing.marginPercentage,
            validate: (value: number) => (value >= 0 && value <= 100) || 'Must be between 0 and 100'
          },
          {
            type: 'number',
            name: 'minPrice',
            message: 'Minimum price:',
            default: config.pricing.minPrice,
            validate: (value: number) => value >= 0 || 'Must be non-negative'
          },
          {
            type: 'number',
            name: 'maxPrice',
            message: 'Maximum price:',
            default: config.pricing.maxPrice,
            validate: (value: number) => value > 0 || 'Must be positive'
          }
        ] as any);
        Object.assign(updates, pricingAnswers);
        break;

      default:
        console.log(chalk.yellow('⚠️ Section update not implemented yet'));
        return;
    }

    await this.configService.updateConfigurationSection(section as any, updates);
    console.log(chalk.green(`✅ ${section} configuration updated successfully`));
  }

  private async validateConfiguration(): Promise<void> {
    try {
      const config = await this.configService.loadConfiguration();
      const errors = this.configService.validateConfiguration(config);
      
      if (errors.length === 0) {
        console.log(chalk.green('✅ Configuration is valid'));
        
        // Show additional validation info
        const estimatedTime = ConfigurationHelpers.estimateProcessingTime(config);
        console.log(chalk.blue(`📊 Estimated processing time: ${estimatedTime}ms`));
        
      } else {
        console.log(chalk.red('❌ Configuration validation failed:'));
        errors.forEach(error => {
          console.log(chalk.red(`  • ${error}`));
        });
        
        const fixAnswer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'fix',
            message: 'Would you like to reset to default configuration?',
            default: false
          }
        ]);
        
        if (fixAnswer.fix) {
          await this.resetConfiguration();
        }
      }
    } catch (error) {
      console.log(chalk.red(`❌ Error validating configuration: ${error}`));
    }
  }

  private async resetConfiguration(section?: string): Promise<void> {
    try {
      const confirmAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: section 
            ? `Are you sure you want to reset the ${section} section to defaults?`
            : 'Are you sure you want to reset the entire configuration to defaults?',
          default: false
        }
      ]);

      if (!confirmAnswer.confirm) {
        console.log(chalk.yellow('⚠️ Reset cancelled'));
        return;
      }

      if (section) {
        const defaultConfig = this.configService.getDefaultConfiguration();
        if (section in defaultConfig) {
          await this.configService.updateConfigurationSection(
            section as keyof SystemConfiguration, 
            defaultConfig[section as keyof SystemConfiguration] as any
          );
        }
        console.log(chalk.green(`✅ ${section} section reset to defaults`));
      } else {
        const defaultConfig = this.configService.getDefaultConfiguration();
        await this.configService.saveConfiguration(defaultConfig);
        console.log(chalk.green('✅ Configuration reset to defaults'));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Error resetting configuration: ${error}`));
    }
  }

  private async exportConfiguration(outputFile?: string): Promise<void> {
    try {
      const config = await this.configService.loadConfiguration();
      
      let filePath = outputFile;
      if (!filePath) {
        const answer = await inquirer.prompt([
          {
            type: 'input',
            name: 'filePath',
            message: 'Export file path:',
            default: 'config-export.json'
          }
        ]);
        filePath = answer.filePath;
      }

      await this.configService.saveConfiguration(config, filePath);
      console.log(chalk.green(`✅ Configuration exported to ${filePath}`));
      
    } catch (error) {
      console.log(chalk.red(`❌ Error exporting configuration: ${error}`));
    }
  }

  private async importConfiguration(inputFile?: string): Promise<void> {
    try {
      let filePath = inputFile;
      if (!filePath) {
        const answer = await inquirer.prompt([
          {
            type: 'input',
            name: 'filePath',
            message: 'Import file path:',
            validate: (value) => value.trim() !== '' || 'File path is required'
          }
        ]);
        filePath = answer.filePath;
      }

      const importedConfig = await this.configService.loadConfiguration(filePath);
      const errors = this.configService.validateConfiguration(importedConfig);
      
      if (errors.length > 0) {
        console.log(chalk.red('❌ Imported configuration is invalid:'));
        errors.forEach(error => {
          console.log(chalk.red(`  • ${error}`));
        });
        return;
      }

      const confirmAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'This will replace your current configuration. Continue?',
          default: false
        }
      ]);

      if (confirmAnswer.confirm) {
        await this.configService.saveConfiguration(importedConfig);
        console.log(chalk.green(`✅ Configuration imported from ${filePath}`));
      } else {
        console.log(chalk.yellow('⚠️ Import cancelled'));
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Error importing configuration: ${error}`));
    }
  }

  private async listPresets(): Promise<void> {
    try {
      const presets = await this.configService.getAvailablePresets();
      
      if (presets.length === 0) {
        console.log(chalk.yellow('⚠️ No presets found'));
        return;
      }
      
      console.log(chalk.blue('\n📋 Available Configuration Presets\n'));
      
      for (const presetName of presets) {
        try {
          const preset = await this.configService.loadPreset(presetName);
          console.log(chalk.green(`• ${preset.name}`));
          console.log(chalk.gray(`  ${preset.description}`));
        } catch (error) {
          console.log(chalk.red(`• ${presetName} (invalid)`));
        }
      }
      
      console.log(chalk.gray('\nUse "config apply-preset --preset <name>" to apply a preset'));
      
    } catch (error) {
      console.log(chalk.red(`❌ Error listing presets: ${error}`));
    }
  }

  private async applyPreset(presetName?: string): Promise<void> {
    try {
      let selectedPreset = presetName;
      
      if (!selectedPreset) {
        const presets = await this.configService.getAvailablePresets();
        
        if (presets.length === 0) {
          console.log(chalk.yellow('⚠️ No presets available'));
          return;
        }
        
        const choices = [];
        for (const name of presets) {
          try {
            const preset = await this.configService.loadPreset(name);
            choices.push({ name: `${preset.name} - ${preset.description}`, value: name });
          } catch (error) {
            // Skip invalid presets
          }
        }
        
        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'preset',
            message: 'Choose a preset to apply:',
            choices
          }
        ]);
        selectedPreset = answer.preset;
      }
      
      if (!selectedPreset) {
        console.log(chalk.red('❌ No preset specified'));
        return;
      }
      
      const confirmAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Apply preset '${selectedPreset}'? This will modify your current configuration.`,
          default: false
        }
      ]);
      
      if (!confirmAnswer.confirm) {
        console.log(chalk.yellow('⚠️ Preset application cancelled'));
        return;
      }
      
      await this.configService.applyPreset(selectedPreset);
      console.log(chalk.green(`✅ Preset '${selectedPreset}' applied successfully`));
      
    } catch (error) {
      console.log(chalk.red(`❌ Error applying preset: ${error}`));
    }
  }

  private async listThemes(): Promise<void> {
    try {
      const themes = await this.configService.getAvailableThemes();
      
      if (themes.length === 0) {
        console.log(chalk.yellow('⚠️ No themes found'));
        return;
      }
      
      console.log(chalk.blue('\n🎨 Available Themes\n'));
      
      for (const themeName of themes) {
        try {
          const theme = await this.configService.loadTheme(themeName);
          console.log(chalk.green(`• ${theme.name}`));
          console.log(chalk.gray(`  ${theme.description}`));
          console.log(chalk.gray(`  Primary: ${theme.customStyles.primaryColor}, Font: ${theme.customStyles.fontFamily}`));
        } catch (error) {
          console.log(chalk.red(`• ${themeName} (invalid)`));
        }
      }
      
      console.log(chalk.gray('\nUse "config apply-theme --theme <name>" to apply a theme'));
      
    } catch (error) {
      console.log(chalk.red(`❌ Error listing themes: ${error}`));
    }
  }

  private async applyTheme(themeName?: string): Promise<void> {
    try {
      let selectedTheme = themeName;
      
      if (!selectedTheme) {
        const themes = await this.configService.getAvailableThemes();
        
        if (themes.length === 0) {
          console.log(chalk.yellow('⚠️ No themes available'));
          return;
        }
        
        const choices = [];
        for (const name of themes) {
          try {
            const theme = await this.configService.loadTheme(name);
            choices.push({ name: `${theme.name} - ${theme.description}`, value: name });
          } catch (error) {
            // Skip invalid themes
          }
        }
        
        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'theme',
            message: 'Choose a theme to apply:',
            choices
          }
        ]);
        selectedTheme = answer.theme;
      }
      
      if (!selectedTheme) {
        console.log(chalk.red('❌ No theme specified'));
        return;
      }
      
      await this.configService.applyTheme(selectedTheme);
      console.log(chalk.green(`✅ Theme '${selectedTheme}' applied successfully`));
      
    } catch (error) {
      console.log(chalk.red(`❌ Error applying theme: ${error}`));
    }
  }

  private async generateRecommendations(useCase?: string): Promise<void> {
    try {
      let selectedUseCase = useCase;
      
      if (!selectedUseCase) {
        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'useCase',
            message: 'What is your primary use case?',
            choices: [
              { name: '🚀 High Volume - Process many listings quickly', value: 'high_volume' },
              { name: '💎 Quality Focus - Prioritize data quality and analysis', value: 'quality_focus' },
              { name: '⚡ Speed Focus - Fastest possible processing', value: 'speed_focus' },
              { name: '🔰 Beginner Friendly - Stable and simple settings', value: 'beginner_friendly' }
            ]
          }
        ]);
        selectedUseCase = answer.useCase;
      }
      
      const validUseCases = ['high_volume', 'quality_focus', 'speed_focus', 'beginner_friendly'];
      if (!selectedUseCase || !validUseCases.includes(selectedUseCase)) {
        console.log(chalk.red('❌ Invalid use case. Valid options: high_volume, quality_focus, speed_focus, beginner_friendly'));
        return;
      }
      
      const config = await this.configService.loadConfiguration();
      const recommendations = ConfigurationHelpers.generateRecommendations(config, selectedUseCase as any);
      
      if (recommendations.length === 0) {
        console.log(chalk.green('✅ Your configuration is already optimized for this use case'));
        return;
      }
      
      console.log(chalk.blue(`\n💡 Recommendations for ${selectedUseCase?.replace('_', ' ') || 'selected'} use case:\n`));
      
      recommendations.forEach((recommendation, index) => {
        console.log(chalk.yellow(`${index + 1}. ${recommendation}`));
      });
      
      const applyAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'apply',
          message: 'Would you like to apply optimizations for this use case?',
          default: false
        }
      ]);
      
      if (applyAnswer.apply) {
        const optimizedConfig = ConfigurationHelpers.optimizeForUseCase(config, selectedUseCase as any);
        await this.configService.saveConfiguration(optimizedConfig);
        console.log(chalk.green('✅ Configuration optimized successfully'));
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Error generating recommendations: ${error}`));
    }
  }
}