#!/usr/bin/env node

import { Command } from 'commander';
import { EbayOptimizerCLI } from './EbayOptimizerCLI';
import { ConfigurationCLI } from './ConfigurationCLI';

const program = new Command();

program
  .name('ebay-optimizer')
  .description('eBay Listing Optimizer - Transform existing eBay listings into optimized, high-converting listings')
  .version('1.0.0');

program
  .command('optimize')
  .description('Optimize an eBay listing from a URL')
  .argument('<url>', 'eBay listing URL to optimize')
  .option('-o, --output <path>', 'Output file path for the generated HTML template', 'optimized-listing.html')
  .option('-t, --template <path>', 'Path to the HTML template file', 'final-ebay-template.html')
  .option('--no-interactive', 'Run without interactive prompts')
  .action(async (url: string, options) => {
    const cli = new EbayOptimizerCLI();
    await cli.optimize(url, options);
  });

program
  .command('validate')
  .description('Validate an eBay URL without processing')
  .argument('<url>', 'eBay listing URL to validate')
  .action(async (url: string) => {
    const cli = new EbayOptimizerCLI();
    await cli.validateUrl(url);
  });

// Add configuration commands
const configCLI = new ConfigurationCLI();
program.addCommand(configCLI.createCommand());

program.parse();