# eBay Listing Optimizer CLI

A command-line interface for optimizing eBay listings through automated web scraping, market research, and content generation.

## Installation

```bash
npm install
npm run build
```

## Usage

### Basic Commands

#### Validate an eBay URL
```bash
node dist/cli.js validate "https://www.ebay.com/itm/123456789"
```

#### Optimize an eBay Listing
```bash
node dist/cli.js optimize "https://www.ebay.com/itm/123456789"
```

#### Optimize with Custom Options
```bash
node dist/cli.js optimize "https://www.ebay.com/itm/123456789" \
  --output "my-optimized-listing.html" \
  --template "my-custom-template.html" \
  --no-interactive
```

### Command Options

#### `optimize` command options:
- `-o, --output <path>`: Output file path for the generated HTML template (default: "optimized-listing.html")
- `-t, --template <path>`: Path to the HTML template file (default: "final-ebay-template.html")
- `--no-interactive`: Run without interactive prompts

#### `validate` command:
- Simply validates if the provided URL is a valid eBay listing URL

### Interactive Mode

By default, the CLI runs in interactive mode, which will:
1. Ask if you want to preview the generated HTML template
2. Confirm before saving files
3. Handle file overwrite scenarios
4. Provide options for custom file paths

### Non-Interactive Mode

Use `--no-interactive` flag to run without prompts:
```bash
node dist/cli.js optimize "https://www.ebay.com/itm/123456789" --no-interactive
```

### Output Files

The CLI generates two files:
1. **HTML Template**: The optimized eBay listing template
2. **Summary File**: A text summary of the optimization results

Example output files:
- `optimized-listing.html` - The main HTML template
- `optimized-listing-summary.txt` - Summary of changes and recommendations

### Example Workflow

1. **Validate URL first**:
   ```bash
   node dist/cli.js validate "https://www.ebay.com/itm/123456789"
   ```

2. **Optimize the listing**:
   ```bash
   node dist/cli.js optimize "https://www.ebay.com/itm/123456789"
   ```

3. **Review the generated files**:
   - Open `optimized-listing.html` in a browser to preview
   - Read `optimized-listing-summary.txt` for optimization insights

4. **Copy the HTML to eBay**:
   - Copy the content from the HTML file
   - Paste into your eBay listing description

### Error Handling

The CLI provides clear error messages for common issues:
- Invalid eBay URLs
- Network connectivity problems
- Missing template files
- File permission errors
- Pipeline processing failures

### Help

Get help for any command:
```bash
node dist/cli.js --help
node dist/cli.js optimize --help
node dist/cli.js validate --help
```

## Features

- **URL Validation**: Ensures you're working with valid eBay listing URLs
- **Web Scraping**: Extracts product details, images, and specifications
- **Market Research**: Analyzes similar products and pricing
- **Content Optimization**: Generates SEO-optimized titles and descriptions
- **Template Rendering**: Populates professional HTML templates
- **Interactive Prompts**: User-friendly confirmation and customization options
- **File Management**: Handles output files with overwrite protection
- **Progress Tracking**: Shows processing steps with clear feedback
- **Error Recovery**: Graceful error handling with actionable guidance

## Requirements

- Node.js 16+ 
- Valid eBay listing URLs
- Internet connection for web scraping and market research
- Template file (default: `final-ebay-template.html`)

## Troubleshooting

### Common Issues

1. **"Invalid eBay URL" error**:
   - Ensure the URL is from eBay.com or eBay.co.uk
   - URL should contain `/itm/` path
   - Example: `https://www.ebay.com/itm/123456789`

2. **"Template file not found" error**:
   - Ensure `final-ebay-template.html` exists in the current directory
   - Or specify a custom template with `--template` option

3. **Network errors**:
   - Check internet connection
   - Some eBay listings may be protected or unavailable
   - Try a different listing URL

4. **Permission errors**:
   - Ensure write permissions in the output directory
   - Try a different output path with `--output` option

### Getting Support

If you encounter issues:
1. Check the error message for specific guidance
2. Verify your eBay URL is accessible in a browser
3. Ensure all dependencies are installed (`npm install`)
4. Try running with `--no-interactive` flag to bypass prompts