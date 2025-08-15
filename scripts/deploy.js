#!/usr/bin/env node

/**
 * Deployment script for eBay Listing Optimizer
 * Handles building, testing, and preparing for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'package.json',
  'tsconfig.json',
  'final-ebay-template.html',
  'src/index.ts',
  'src/pipeline.ts'
];

const REQUIRED_DIRECTORIES = [
  'src/services',
  'src/models',
  'src/utils',
  'src/cli',
  'config'
];

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function executeCommand(command, description) {
  log(`Executing: ${description}`);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`Completed: ${description}`, 'success');
  } catch (error) {
    log(`Failed: ${description} - ${error.message}`, 'error');
    process.exit(1);
  }
}

function validateEnvironment() {
  log('Validating deployment environment...');
  
  // Check required files
  for (const file of REQUIRED_FILES) {
    if (!fs.existsSync(file)) {
      log(`Missing required file: ${file}`, 'error');
      process.exit(1);
    }
  }
  
  // Check required directories
  for (const dir of REQUIRED_DIRECTORIES) {
    if (!fs.existsSync(dir)) {
      log(`Missing required directory: ${dir}`, 'error');
      process.exit(1);
    }
  }
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 16) {
    log(`Node.js version ${nodeVersion} is not supported. Minimum version: 16.x`, 'error');
    process.exit(1);
  }
  
  log('Environment validation passed', 'success');
}

function cleanBuild() {
  log('Cleaning previous build...');
  if (fs.existsSync('dist')) {
    executeCommand('npm run clean', 'Remove dist directory');
  }
}

function installDependencies() {
  log('Installing dependencies...');
  executeCommand('npm ci', 'Install production dependencies');
}

function runTests() {
  log('Running test suite...');
  executeCommand('npm run test:run', 'Execute all tests');
}

function buildProject() {
  log('Building project...');
  executeCommand('npm run build', 'Compile TypeScript to JavaScript');
}

function validateBuild() {
  log('Validating build output...');
  
  const requiredBuildFiles = [
    'dist/index.js',
    'dist/pipeline.js',
    'dist/cli.js'
  ];
  
  for (const file of requiredBuildFiles) {
    if (!fs.existsSync(file)) {
      log(`Missing build output: ${file}`, 'error');
      process.exit(1);
    }
  }
  
  log('Build validation passed', 'success');
}

function createProductionConfig() {
  log('Creating production configuration...');
  
  const productionConfig = {
    name: 'ebay-listing-optimizer',
    version: require('../package.json').version,
    environment: 'production',
    deployment: {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    },
    features: {
      webScraping: true,
      marketResearch: true,
      contentOptimization: true,
      templateGeneration: true,
      cliInterface: true
    },
    limits: {
      maxConcurrentRequests: 5,
      requestTimeoutMs: 30000,
      maxImageGallerySize: 5,
      maxRetryAttempts: 3
    }
  };
  
  fs.writeFileSync('dist/production-config.json', JSON.stringify(productionConfig, null, 2));
  log('Production configuration created', 'success');
}

function generateDeploymentSummary() {
  log('Generating deployment summary...');
  
  const packageJson = require('../package.json');
  const stats = fs.statSync('dist');
  
  const summary = {
    project: packageJson.name,
    version: packageJson.version,
    buildDate: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    buildSize: getBuildSize(),
    features: [
      'Web scraping with rate limiting',
      'Product detail extraction',
      'Market research and analysis',
      'Content optimization',
      'HTML template generation',
      'Command-line interface',
      'Configuration management',
      'Error handling and logging',
      'Performance monitoring',
      'Caching system'
    ],
    deployment: {
      requirements: {
        node: '>=16.0.0',
        npm: '>=7.0.0'
      },
      commands: {
        install: 'npm install --production',
        start: 'node dist/cli.js',
        optimize: 'node dist/cli.js optimize <url>'
      }
    }
  };
  
  fs.writeFileSync('DEPLOYMENT_SUMMARY.md', generateMarkdownSummary(summary));
  log('Deployment summary generated', 'success');
}

function getBuildSize() {
  const distPath = path.join(__dirname, '../dist');
  let totalSize = 0;
  
  function calculateSize(dirPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        calculateSize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  }
  
  if (fs.existsSync(distPath)) {
    calculateSize(distPath);
  }
  
  return `${(totalSize / 1024 / 1024).toFixed(2)} MB`;
}

function generateMarkdownSummary(summary) {
  return `# Deployment Summary

## Project Information
- **Name:** ${summary.project}
- **Version:** ${summary.version}
- **Build Date:** ${summary.buildDate}
- **Node Version:** ${summary.nodeVersion}
- **Platform:** ${summary.platform}
- **Build Size:** ${summary.buildSize}

## Features
${summary.features.map(feature => `- ${feature}`).join('\n')}

## Deployment Requirements
- **Node.js:** ${summary.deployment.requirements.node}
- **NPM:** ${summary.deployment.requirements.npm}

## Installation Commands
\`\`\`bash
# Install dependencies
${summary.deployment.commands.install}

# Start CLI
${summary.deployment.commands.start}

# Optimize a listing
${summary.deployment.commands.optimize}
\`\`\`

## Configuration
The system uses configuration files in the \`config/\` directory:
- \`default.json\` - Default configuration
- \`presets/\` - User experience presets
- \`use-cases/\` - Specific use case configurations

## Template
The system uses \`final-ebay-template.html\` for generating optimized listings.

## Logging
Logs are written to the console with structured formatting for production monitoring.
`;
}

function main() {
  log('Starting deployment process...');
  
  try {
    validateEnvironment();
    cleanBuild();
    installDependencies();
    runTests();
    buildProject();
    validateBuild();
    createProductionConfig();
    generateDeploymentSummary();
    
    log('🎉 Deployment completed successfully!', 'success');
    log('📁 Build output available in ./dist directory');
    log('📋 See DEPLOYMENT_SUMMARY.md for deployment instructions');
    
  } catch (error) {
    log(`Deployment failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run deployment if called directly
if (require.main === module) {
  main();
}

module.exports = { main, validateEnvironment, buildProject };