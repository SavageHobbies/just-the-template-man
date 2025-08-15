#!/usr/bin/env node

/**
 * Startup script for eBay Listing Optimizer Web Interface
 * Handles building, dependency checking, and server startup
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function checkDependencies() {
  log('Checking dependencies...');
  
  try {
    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
      log('Installing dependencies...', 'warning');
      execSync('npm install', { stdio: 'inherit' });
    }
    
    // Check if dist directory exists
    if (!fs.existsSync('dist')) {
      log('Building CLI backend...', 'warning');
      execSync('npm run build', { stdio: 'inherit' });
    }
    
    log('Dependencies check passed', 'success');
    return true;
  } catch (error) {
    log(`Dependency check failed: ${error.message}`, 'error');
    return false;
  }
}

function startWebServer() {
  log('Starting eBay Listing Optimizer Web Interface...');
  
  try {
    // Start the web server
    const serverProcess = spawn('node', ['web/server.js'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    // Handle server process events
    serverProcess.on('error', (error) => {
      log(`Server error: ${error.message}`, 'error');
      process.exit(1);
    });
    
    serverProcess.on('close', (code) => {
      if (code !== 0) {
        log(`Server exited with code ${code}`, 'error');
        process.exit(code);
      }
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('Shutting down web server...', 'warning');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      log('Shutting down web server...', 'warning');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });
    
    // Success message
    setTimeout(() => {
      console.log('\n🎉 eBay Listing Optimizer Web Interface is running!');
      console.log('📱 Open your browser and navigate to: http://localhost:3000');
      console.log('🔧 CLI backend is ready at: dist/cli.js');
      console.log('⏹️  Press Ctrl+C to stop the server\n');
    }, 2000);
    
  } catch (error) {
    log(`Failed to start web server: ${error.message}`, 'error');
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🚀 eBay Listing Optimizer - Web Interface Launcher

Usage: node start-web.js [options]

Options:
  --help, -h     Show this help message
  --dev          Start in development mode with auto-reload
  --port PORT    Specify port (default: 3000)
  --build        Force rebuild before starting

Examples:
  node start-web.js              # Start production server
  node start-web.js --dev        # Start development server
  node start-web.js --port 8080  # Start on port 8080
  node start-web.js --build      # Force rebuild and start

Features:
  ✨ Beautiful, modern web interface
  🔄 Real-time optimization progress
  📱 Mobile-responsive design
  ⚡ Fast and intuitive user experience
  🎯 Professional eBay listing templates
`);
}

function main() {
  const args = process.argv.slice(2);
  
  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  // Handle build flag
  if (args.includes('--build')) {
    log('Force rebuilding...', 'warning');
    try {
      execSync('npm run clean', { stdio: 'inherit' });
      execSync('npm run build', { stdio: 'inherit' });
    } catch (error) {
      log(`Build failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
  
  // Handle port flag
  const portIndex = args.indexOf('--port');
  if (portIndex !== -1 && args[portIndex + 1]) {
    process.env.PORT = args[portIndex + 1];
  }
  
  // Handle dev flag
  if (args.includes('--dev')) {
    log('Starting in development mode...', 'warning');
    try {
      execSync('npm run web:dev', { stdio: 'inherit' });
    } catch (error) {
      log(`Development server failed: ${error.message}`, 'error');
      process.exit(1);
    }
    return;
  }
  
  // Standard startup process
  log('🚀 Starting eBay Listing Optimizer Web Interface...');
  
  if (!checkDependencies()) {
    process.exit(1);
  }
  
  startWebServer();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, checkDependencies, startWebServer };