/**
 * Tests for logging utilities
 */

import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import {
  Logger,
  LogLevel,
  LogEntry,
  getLogger,
  PerformanceMonitor
} from './logger';
import { WebScrapingError, ErrorCode } from './errors';

// Mock console methods
const originalConsole = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error
};

beforeEach(() => {
  console.debug = vi.fn();
  console.info = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterEach(() => {
  console.debug = originalConsole.debug;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    // Create a fresh logger instance for each test
    (Logger as any).instance = undefined;
    logger = Logger.getInstance({
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: false
    });
    logger.clearLogs();
  });

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();

      expect(logger1).toBe(logger2);
    });

    it('should use provided config on first call', () => {
      (Logger as any).instance = undefined;
      const customLogger = Logger.getInstance({
        level: LogLevel.ERROR,
        enableConsole: false,
        enableFile: true
      });

      // Test that the config was applied by checking behavior
      customLogger.debug('Debug message');
      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe('Log levels', () => {
    it('should log debug messages when level is DEBUG', () => {
      logger.configure({ level: LogLevel.DEBUG });
      logger.debug('Debug message');

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG')
      );
    });

    it('should not log debug messages when level is INFO', () => {
      logger.configure({ level: LogLevel.INFO });
      logger.debug('Debug message');

      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should log info messages when level is INFO', () => {
      logger.configure({ level: LogLevel.INFO });
      logger.info('Info message');

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO')
      );
    });

    it('should log warnings when level allows', () => {
      logger.configure({ level: LogLevel.WARN });
      logger.warn('Warning message');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN')
      );
    });

    it('should log errors when level allows', () => {
      logger.configure({ level: LogLevel.ERROR });
      logger.error('Error message');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR')
      );
    });

    it('should log critical messages', () => {
      logger.configure({ level: LogLevel.CRITICAL });
      logger.critical('Critical message');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL')
      );
    });
  });

  describe('Context and component logging', () => {
    it('should include context in log messages', () => {
      const context = { userId: '123', action: 'test' };
      logger.info('Test message', context);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Context: {"userId":"123","action":"test"}')
      );
    });

    it('should include component in log messages', () => {
      logger.info('Test message', undefined, 'TestComponent');

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[TestComponent]')
      );
    });

    it('should include operation in log messages', () => {
      logger.info('Test message', undefined, 'TestComponent', 'testOperation');

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('{testOperation}')
      );
    });
  });

  describe('Error logging', () => {
    it('should log BaseError details', () => {
      const error = new WebScrapingError('Test error', ErrorCode.SCRAPING_FAILED);
      logger.error('Error occurred', error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR')
      );
      expect(console.error).toHaveBeenCalledWith(
        'Error details:',
        expect.objectContaining({
          code: ErrorCode.SCRAPING_FAILED,
          message: 'Test error'
        })
      );
    });

    it('should handle regular Error objects', () => {
      const error = new Error('Regular error');
      logger.error('Error occurred', error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR')
      );
    });
  });

  describe('Operation logging', () => {
    it('should log operation start', () => {
      logger.startOperation('testOp', 'TestComponent', { param: 'value' });

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Starting operation: testOp')
      );
    });

    it('should log operation completion', () => {
      logger.completeOperation('testOp', 'TestComponent', { result: 'success' }, 1000);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Completed operation: testOp (1000ms)')
      );
    });

    it('should log operation failure', () => {
      const error = new Error('Operation failed');
      logger.failOperation('testOp', error, 'TestComponent');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed operation: testOp - Operation failed')
      );
    });
  });

  describe('Memory log management', () => {
    it('should store logs in memory', () => {
      logger.info('Test message 1');
      logger.info('Test message 2');

      const logs = logger.getRecentLogs(10);
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('Test message 1');
      expect(logs[1].message).toBe('Test message 2');
    });

    it('should rotate logs when exceeding max memory logs', () => {
      // Set a small max for testing
      const maxLogs = 3;
      for (let i = 0; i < maxLogs + 2; i++) {
        logger.info(`Message ${i}`);
      }

      const logs = logger.getRecentLogs(10);
      expect(logs.length).toBeLessThanOrEqual(maxLogs);
      expect(logs[logs.length - 1].message).toBe(`Message ${maxLogs + 1}`);
    });

    it('should filter logs by level', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      const errorLogs = logger.getRecentLogs(10, LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe('Error message');
    });

    it('should get logs by operation', () => {
      logger.info('Message 1', undefined, 'Component1', 'operation1');
      logger.info('Message 2', undefined, 'Component2', 'operation2');
      logger.info('Message 3', undefined, 'Component1', 'operation1');

      const operationLogs = logger.getOperationLogs('operation1');
      expect(operationLogs).toHaveLength(2);
      expect(operationLogs[0].message).toBe('Message 1');
      expect(operationLogs[1].message).toBe('Message 3');
    });

    it('should get logs by component', () => {
      logger.info('Message 1', undefined, 'Component1');
      logger.info('Message 2', undefined, 'Component2');
      logger.info('Message 3', undefined, 'Component1');

      const componentLogs = logger.getComponentLogs('Component1');
      expect(componentLogs).toHaveLength(2);
      expect(componentLogs[0].message).toBe('Message 1');
      expect(componentLogs[1].message).toBe('Message 3');
    });

    it('should clear all logs', () => {
      logger.info('Message 1');
      logger.info('Message 2');
      
      logger.clearLogs();
      
      const logs = logger.getRecentLogs(10);
      expect(logs).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    it('should provide logging statistics', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message', new Error('Test error'));

      const stats = logger.getStats();

      expect(stats.totalLogs).toBe(4);
      expect(stats.byLevel.DEBUG).toBe(1);
      expect(stats.byLevel.INFO).toBe(1);
      expect(stats.byLevel.WARN).toBe(1);
      expect(stats.byLevel.ERROR).toBe(1);
      expect(stats.recentErrors).toHaveLength(1);
      expect(stats.recentErrors[0].message).toBe('Error message');
    });

    it('should count logs by component', () => {
      logger.info('Message 1', undefined, 'Component1');
      logger.info('Message 2', undefined, 'Component2');
      logger.info('Message 3', undefined, 'Component1');

      const stats = logger.getStats();

      expect(stats.byComponent.Component1).toBe(2);
      expect(stats.byComponent.Component2).toBe(1);
    });
  });

  describe('Console output control', () => {
    it('should not log to console when disabled', () => {
      logger.configure({ enableConsole: false });
      logger.info('Test message');

      expect(console.info).not.toHaveBeenCalled();
    });
  });
});

describe('getLogger convenience function', () => {
  it('should return the singleton logger instance', () => {
    const logger1 = getLogger();
    const logger2 = getLogger();

    expect(logger1).toBe(logger2);
    expect(logger1).toBeInstanceOf(Logger);
  });
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Clear any existing timers
    (PerformanceMonitor as any).timers.clear();
  });

  describe('Manual timing', () => {
    it('should start and end timing correctly', () => {
      PerformanceMonitor.start('testOperation', 'TestComponent');
      
      // Simulate some work
      const startTime = Date.now();
      while (Date.now() - startTime < 10) {
        // Wait a bit
      }
      
      const duration = PerformanceMonitor.end('testOperation', 'TestComponent');
      
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should be reasonable
    });

    it('should warn when ending non-existent timer', () => {
      const duration = PerformanceMonitor.end('nonExistentOperation', 'TestComponent');
      
      expect(duration).toBe(0);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No timer found for operation: nonExistentOperation')
      );
    });
  });

  describe('Automatic timing with measure', () => {
    it('should measure async function execution time', async () => {
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      };

      const result = await PerformanceMonitor.measure(
        'asyncOperation',
        testFunction,
        'TestComponent'
      );

      expect(result).toBe('result');
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Performance: asyncOperation completed in')
      );
    });

    it('should handle errors in measured functions', async () => {
      const testFunction = async () => {
        throw new Error('Test error');
      };

      await expect(
        PerformanceMonitor.measure('failingOperation', testFunction, 'TestComponent')
      ).rejects.toThrow('Test error');

      // Should still log the timing even on error
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Performance: failingOperation completed in')
      );
    });
  });
});