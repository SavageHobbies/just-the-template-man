# eBay Listing Optimizer

A TypeScript-based tool that automatically optimizes eBay listings through web scraping, market research, and content generation.

## Project Structure

```
src/
├── models/           # Data models and interfaces
│   └── index.ts     # Core data structures
├── services/        # Service interfaces
│   └── interfaces.ts # Service contracts
├── utils/           # Utility functions
│   ├── index.ts     # Common utilities
│   └── index.test.ts # Utility tests
├── pipeline.ts      # Main orchestration pipeline
├── pipeline.test.ts # Pipeline tests
└── index.ts         # Main entry point
```

## Core Interfaces

- **WebScrapingService**: Handles URL scraping and content extraction
- **ProductExtractor**: Extracts structured data from HTML content
- **MarketResearchEngine**: Conducts competitive analysis and pricing research
- **ContentOptimizer**: Generates improved titles, descriptions, and pricing
- **TemplateRenderer**: Populates HTML templates with optimized content

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Development

- `npm run dev` - Run in development mode
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run lint` - Run ESLint
- `npm run clean` - Clean build directory

## Architecture

The system follows a pipeline architecture with five distinct stages:
1. Web scraping
2. Product extraction
3. Market research
4. Content optimization
5. Template rendering

Each stage is implemented as a separate service with well-defined interfaces, allowing for easy testing and modularity.