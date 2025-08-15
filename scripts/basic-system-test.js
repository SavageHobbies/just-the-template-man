#!/usr/bin/env node

/**
 * Basic system test to verify core functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function testBuild() {
  log('Testing build process...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    
    // Check if key files exist
    const requiredFiles = [
      'dist/index.js',
      'dist/pipeline.js',
      'dist/cli.js'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Missing build output: ${file}`);
      }
    }
    
    log('Build test passed', 'success');
    return true;
  } catch (error) {
    log(`Build test failed: ${error.message}`, 'error');
    return false;
  }
}

function testCLI() {
  log('Testing CLI interface...');
  try {
    // Test CLI help
    const helpOutput = execSync('node dist/cli.js --help', { encoding: 'utf8' });
    if (!helpOutput.includes('ebay-optimizer')) {
      throw new Error('CLI help output missing expected content');
    }
    
    log('CLI test passed', 'success');
    return true;
  } catch (error) {
    log(`CLI test failed: ${error.message}`, 'error');
    return false;
  }
}

function testConfiguration() {
  log('Testing configuration system...');
  try {
    // Check if configuration files exist
    const configFiles = [
      'config/default.json',
      'config/production.json',
      'final-ebay-template.html'
    ];
    
    for (const file of configFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Missing configuration file: ${file}`);
      }
    }
    
    // Test configuration loading
    const defaultConfig = JSON.parse(fs.readFileSync('config/default.json', 'utf8'));
    if (!defaultConfig.scraping || !defaultConfig.research || !defaultConfig.optimization) {
      throw new Error('Invalid default configuration structure');
    }
    
    log('Configuration test passed', 'success');
    return true;
  } catch (error) {
    log(`Configuration test failed: ${error.message}`, 'error');
    return false;
  }
}

function testTemplate() {
  log('Testing template system...');
  try {
    const templateContent = fs.readFileSync('final-ebay-template.html', 'utf8');
    
    // Check for required template placeholders
    const requiredPlaceholders = [
      '{{TITLE}}',
      '{{MAIN_IMAGE}}',
      '{{DESCRIPTION}}',
      '{{IMAGE_GALLERY}}'
    ];
    
    for (const placeholder of requiredPlaceholders) {
      if (!templateContent.includes(placeholder)) {
        throw new Error(`Missing template placeholder: ${placeholder}`);
      }
    }
    
    // Check for proper HTML structure
    if (!templateContent.includes('<!DOCTYPE html>') || 
        !templateContent.includes('<html') || 
        !templateContent.includes('</html>')) {
      throw new Error('Invalid HTML template structure');
    }
    
    log('Template test passed', 'success');
    return true;
  } catch (error) {
    log(`Template test failed: ${error.message}`, 'error');
    return false;
  }
}

function generateTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    system: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    },
    tests: results,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r).length,
      failed: Object.values(results).filter(r => !r).length
    }
  };
  
  const success = report.summary.failed === 0;
  report.status = success ? 'PASSED' : 'FAILED';
  
  fs.writeFileSync('BASIC_TEST_REPORT.json', JSON.stringify(report, null, 2));
  
  const markdownReport = `# Basic System Test Report

**Generated:** ${report.timestamp}
**Status:** ${report.status}

## System Information
- **Node.js:** ${report.system.node}
- **Platform:** ${report.system.platform}
- **Architecture:** ${report.system.arch}

## Test Results
- **Build Test:** ${results.build ? '✅ PASSED' : '❌ FAILED'}
- **CLI Test:** ${results.cli ? '✅ PASSED' : '❌ FAILED'}
- **Configuration Test:** ${results.configuration ? '✅ PASSED' : '❌ FAILED'}
- **Template Test:** ${results.template ? '✅ PASSED' : '❌ FAILED'}

## Summary
- **Total Tests:** ${report.summary.total}
- **Passed:** ${report.summary.passed}
- **Failed:** ${report.summary.failed}

${success ? '🎉 All basic tests passed! System is ready for deployment.' : '⚠️ Some tests failed. Please review the issues before deployment.'}
`;
  
  fs.writeFileSync('BASIC_TEST_REPORT.md', markdownReport);
  
  return success;
}

function main() {
  log('Starting basic system tests...');
  
  const results = {
    build: testBuild(),
    cli: testCLI(),
    configuration: testConfiguration(),
    template: testTemplate()
  };
  
  const success = generateTestReport(results);
  
  if (success) {
    log('🎉 All basic tests passed!', 'success');
    log('📋 See BASIC_TEST_REPORT.md for detailed results');
    process.exit(0);
  } else {
    log('⚠️ Some tests failed', 'error');
    log('📋 See BASIC_TEST_REPORT.md for detailed results');
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  main();
}

module.exports = { main, testBuild, testCLI, testConfiguration, testTemplate };