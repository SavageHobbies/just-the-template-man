#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all test suites and generates reports
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const testSuites = [
  {
    name: 'Unit Tests',
    command: 'vitest',
    args: ['run', '--reporter=verbose', '--coverage'],
    timeout: 60000
  },
  {
    name: 'Integration Tests',
    command: 'vitest',
    args: ['run', 'src/tests/integration', '--reporter=verbose'],
    timeout: 120000
  },
  {
    name: 'Quality Tests',
    command: 'vitest',
    args: ['run', 'src/tests/quality', '--reporter=verbose'],
    timeout: 60000
  },
  {
    name: 'Performance Benchmarks',
    command: 'vitest',
    args: ['run', 'src/tests/performance', '--reporter=verbose'],
    timeout: 180000
  },
  {
    name: 'Regression Tests',
    command: 'vitest',
    args: ['run', 'src/tests/regression', '--reporter=verbose'],
    timeout: 120000
  }
];

class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async runTest(suite) {
    console.log(`\n🧪 Running ${suite.name}...`);
    console.log(`Command: ${suite.command} ${suite.args.join(' ')}`);
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const child = spawn(suite.command, suite.args, {
        stdio: 'inherit',
        shell: true
      });

      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        console.log(`❌ ${suite.name} timed out after ${suite.timeout}ms`);
        resolve({
          name: suite.name,
          success: false,
          duration: Date.now() - startTime,
          error: 'Timeout'
        });
      }, suite.timeout);

      child.on('close', (code) => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;
        const success = code === 0;
        
        console.log(`${success ? '✅' : '❌'} ${suite.name} ${success ? 'passed' : 'failed'} (${duration}ms)`);
        
        resolve({
          name: suite.name,
          success,
          duration,
          exitCode: code
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        console.log(`❌ ${suite.name} failed with error: ${error.message}`);
        resolve({
          name: suite.name,
          success: false,
          duration: Date.now() - startTime,
          error: error.message
        });
      });
    });
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Test Suite');
    console.log('=====================================');

    for (const suite of testSuites) {
      const result = await this.runTest(suite);
      this.results.push(result);
    }

    this.generateReport();
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;

    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`Total Test Suites: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    console.log('\n📋 Detailed Results:');
    this.results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const duration = `${(result.duration / 1000).toFixed(2)}s`;
      console.log(`  ${status} ${result.name.padEnd(25)} ${duration}`);
      if (!result.success && result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });

    // Generate JSON report
    const reportPath = path.join(process.cwd(), 'test-results.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed,
        failed,
        successRate: (passed / total) * 100,
        totalDuration
      },
      results: this.results
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Comprehensive Test Runner

Usage: node scripts/run-comprehensive-tests.js [options]

Options:
  --help, -h     Show this help message
  --suite <name> Run only specific test suite
  --timeout <ms> Override default timeout

Available test suites:
${testSuites.map(s => `  - ${s.name}`).join('\n')}

Examples:
  node scripts/run-comprehensive-tests.js
  node scripts/run-comprehensive-tests.js --suite "Unit Tests"
  node scripts/run-comprehensive-tests.js --timeout 300000
`);
  process.exit(0);
}

// Filter test suites if specific suite requested
let suitesToRun = testSuites;
const suiteIndex = args.indexOf('--suite');
if (suiteIndex !== -1 && args[suiteIndex + 1]) {
  const suiteName = args[suiteIndex + 1];
  suitesToRun = testSuites.filter(s => s.name === suiteName);
  if (suitesToRun.length === 0) {
    console.error(`❌ Test suite "${suiteName}" not found`);
    process.exit(1);
  }
}

// Override timeout if specified
const timeoutIndex = args.indexOf('--timeout');
if (timeoutIndex !== -1 && args[timeoutIndex + 1]) {
  const timeout = parseInt(args[timeoutIndex + 1]);
  if (!isNaN(timeout)) {
    suitesToRun.forEach(suite => {
      suite.timeout = timeout;
    });
  }
}

// Run the tests
const runner = new TestRunner();
runner.testSuites = suitesToRun;
runner.runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});