import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

// Mock the EbayOptimizerCLI
vi.mock('./EbayOptimizerCLI', () => ({
  EbayOptimizerCLI: vi.fn().mockImplementation(() => ({
    optimize: vi.fn().mockResolvedValue(undefined),
    validateUrl: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('CLI Command Interface', () => {
  let mockCLI: any;
  let originalArgv: string[];

  beforeEach(() => {
    // Store original argv
    originalArgv = process.argv;
    
    // Mock the CLI instance
    const { EbayOptimizerCLI } = await import('./EbayOptimizerCLI');
    mockCLI = new EbayOptimizerCLI();
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original argv
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  describe('optimize command', () => {
    it('should parse optimize command with URL argument', async () => {
      const testUrl = 'https://www.ebay.com/itm/123456789';
      
      // Mock process.argv for the optimize command
      process.argv = ['node', 'cli.js', 'optimize', testUrl];

      // Create a new program instance to test
      const program = new Command();
      program
        .name('ebay-optimizer')
        .description('eBay Listing Optimizer')
        .version('1.0.0');

      program
        .command('optimize')
        .description('Optimize an eBay listing from a URL')
        .argument('<url>', 'eBay listing URL to optimize')
        .option('-o, --output <path>', 'Output file path for the generated HTML template', 'optimized-listing.html')
        .option('-t, --template <path>', 'Path to the HTML template file', 'final-ebay-template.html')
        .option('--no-interactive', 'Run without interactive prompts')
        .action(async (url: string, options) => {
          await mockCLI.optimize(url, options);
        });

      // Parse the arguments
      await program.parseAsync();

      expect(mockCLI.optimize).toHaveBeenCalledWith(testUrl, {
        output: 'optimized-listing.html',
        template: 'final-ebay-template.html',
        interactive: true
      });
    });

    it('should parse optimize command with custom options', async () => {
      const testUrl = 'https://www.ebay.com/itm/123456789';
      
      // Mock process.argv with custom options
      process.argv = [
        'node', 'cli.js', 'optimize', testUrl,
        '--output', 'custom-output.html',
        '--template', 'custom-template.html',
        '--no-interactive'
      ];

      const program = new Command();
      program
        .name('ebay-optimizer')
        .description('eBay Listing Optimizer')
        .version('1.0.0');

      program
        .command('optimize')
        .description('Optimize an eBay listing from a URL')
        .argument('<url>', 'eBay listing URL to optimize')
        .option('-o, --output <path>', 'Output file path for the generated HTML template', 'optimized-listing.html')
        .option('-t, --template <path>', 'Path to the HTML template file', 'final-ebay-template.html')
        .option('--no-interactive', 'Run without interactive prompts')
        .action(async (url: string, options) => {
          await mockCLI.optimize(url, options);
        });

      await program.parseAsync();

      expect(mockCLI.optimize).toHaveBeenCalledWith(testUrl, {
        output: 'custom-output.html',
        template: 'custom-template.html',
        interactive: false
      });
    });

    it('should handle short option flags', async () => {
      const testUrl = 'https://www.ebay.com/itm/123456789';
      
      // Mock process.argv with short flags
      process.argv = [
        'node', 'cli.js', 'optimize', testUrl,
        '-o', 'short-output.html',
        '-t', 'short-template.html'
      ];

      const program = new Command();
      program
        .name('ebay-optimizer')
        .description('eBay Listing Optimizer')
        .version('1.0.0');

      program
        .command('optimize')
        .description('Optimize an eBay listing from a URL')
        .argument('<url>', 'eBay listing URL to optimize')
        .option('-o, --output <path>', 'Output file path for the generated HTML template', 'optimized-listing.html')
        .option('-t, --template <path>', 'Path to the HTML template file', 'final-ebay-template.html')
        .option('--no-interactive', 'Run without interactive prompts')
        .action(async (url: string, options) => {
          await mockCLI.optimize(url, options);
        });

      await program.parseAsync();

      expect(mockCLI.optimize).toHaveBeenCalledWith(testUrl, {
        output: 'short-output.html',
        template: 'short-template.html',
        interactive: true
      });
    });
  });

  describe('validate command', () => {
    it('should parse validate command with URL argument', async () => {
      const testUrl = 'https://www.ebay.com/itm/123456789';
      
      // Mock process.argv for the validate command
      process.argv = ['node', 'cli.js', 'validate', testUrl];

      const program = new Command();
      program
        .name('ebay-optimizer')
        .description('eBay Listing Optimizer')
        .version('1.0.0');

      program
        .command('validate')
        .description('Validate an eBay URL without processing')
        .argument('<url>', 'eBay listing URL to validate')
        .action(async (url: string) => {
          await mockCLI.validateUrl(url);
        });

      await program.parseAsync();

      expect(mockCLI.validateUrl).toHaveBeenCalledWith(testUrl);
    });
  });

  describe('command structure', () => {
    it('should have proper command descriptions and help text', () => {
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
        .option('--no-interactive', 'Run without interactive prompts');

      program
        .command('validate')
        .description('Validate an eBay URL without processing')
        .argument('<url>', 'eBay listing URL to validate');

      expect(program.name()).toBe('ebay-optimizer');
      expect(program.description()).toContain('eBay Listing Optimizer');
      expect(program.version()).toBe('1.0.0');

      const optimizeCommand = program.commands.find(cmd => cmd.name() === 'optimize');
      expect(optimizeCommand).toBeDefined();
      expect(optimizeCommand?.description()).toBe('Optimize an eBay listing from a URL');

      const validateCommand = program.commands.find(cmd => cmd.name() === 'validate');
      expect(validateCommand).toBeDefined();
      expect(validateCommand?.description()).toBe('Validate an eBay URL without processing');
    });

    it('should have proper option configurations', () => {
      const program = new Command();
      
      const optimizeCommand = program
        .command('optimize')
        .description('Optimize an eBay listing from a URL')
        .argument('<url>', 'eBay listing URL to optimize')
        .option('-o, --output <path>', 'Output file path for the generated HTML template', 'optimized-listing.html')
        .option('-t, --template <path>', 'Path to the HTML template file', 'final-ebay-template.html')
        .option('--no-interactive', 'Run without interactive prompts');

      const options = optimizeCommand.options;
      
      expect(options).toHaveLength(3);
      
      const outputOption = options.find(opt => opt.short === '-o');
      expect(outputOption).toBeDefined();
      expect(outputOption?.long).toBe('--output');
      expect(outputOption?.defaultValue).toBe('optimized-listing.html');

      const templateOption = options.find(opt => opt.short === '-t');
      expect(templateOption).toBeDefined();
      expect(templateOption?.long).toBe('--template');
      expect(templateOption?.defaultValue).toBe('final-ebay-template.html');

      const interactiveOption = options.find(opt => opt.long === '--no-interactive');
      expect(interactiveOption).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle missing URL argument gracefully', async () => {
      // Mock process.argv without URL
      process.argv = ['node', 'cli.js', 'optimize'];

      const program = new Command();
      program
        .name('ebay-optimizer')
        .description('eBay Listing Optimizer')
        .version('1.0.0');

      program
        .command('optimize')
        .description('Optimize an eBay listing from a URL')
        .argument('<url>', 'eBay listing URL to optimize')
        .option('-o, --output <path>', 'Output file path for the generated HTML template', 'optimized-listing.html')
        .option('-t, --template <path>', 'Path to the HTML template file', 'final-ebay-template.html')
        .option('--no-interactive', 'Run without interactive prompts')
        .action(async (url: string, options) => {
          await mockCLI.optimize(url, options);
        });

      // This should throw an error due to missing required argument
      await expect(program.parseAsync()).rejects.toThrow();
    });

    it('should handle unknown commands gracefully', async () => {
      // Mock process.argv with unknown command
      process.argv = ['node', 'cli.js', 'unknown-command'];

      const program = new Command();
      program
        .name('ebay-optimizer')
        .description('eBay Listing Optimizer')
        .version('1.0.0');

      program
        .command('optimize')
        .description('Optimize an eBay listing from a URL')
        .argument('<url>', 'eBay listing URL to optimize');

      program
        .command('validate')
        .description('Validate an eBay URL without processing')
        .argument('<url>', 'eBay listing URL to validate');

      // This should throw an error due to unknown command
      await expect(program.parseAsync()).rejects.toThrow();
    });
  });
});