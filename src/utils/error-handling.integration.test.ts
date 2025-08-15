/**
 * Integration tests for error handling and logging system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  WebScrapingError,
  ProductExtractionError,
  MarketResearchError,
  PipelineError,
  ErrorCode,
  ErrorSeverity,
  createError,
  isRetryableError,
  isCriticalError,
  getLogger,
  LogLevel,
  RetryManager
} from './index';

describe('Error Handling and Logging Integration', () => {
  let logger: ReturnType<typeof getLogger>;
  let retryManager: RetryManager;

  beforeEach(() => {
    logger = getLogger();
    logger.clearLogs();
    logger.configure({ level: LogLevel.DEBUG, enableConsole: false });
    retryManager = new RetryManager();
  });

  describe('Error Creation and Classification', () => {
    it('should create appropriate error types', () => {
      const webError = new WebScrapingError('Scraping failed', ErrorCode.NETWORK_ERROR, true);
      const extractError = new ProductExtractionError('Extraction failed');
      const researchError = new MarketResearchError('Research failed');
      const pipelineError = new PipelineError('Pipeline failed');

      expect(webError.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(webError.isRetryable).toBe(true);
      expect(webError.severity).toBe(ErrorSeverity.HIGH);

      expect(extractError.severity).toBe(ErrorSeverity.MEDIUM);
      expect(researchError.isRetryable).toBe(true);
      expect(pipelineError.severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('should classify errors correctly', () => {
      const retryableError = new MarketResearchError('API unavailable', ErrorCode.API_UNAVAILABLE, true);
      const nonRetryableError = new WebScrapingError('Invalid URL', ErrorCode.INVALID_URL, false);
      const criticalError = new PipelineError('System failure', ErrorCode.PIPELINE_FAILED);

      expect(isRetryableError(retryableError)).toBe(true);
      expect(isRetryableError(nonRetryableError)).toBe(false);
      expect(isCriticalError(criticalError)).toBe(true);
      expect(isCriticalError(retryableError)).toBe(false);
    });

    it('should create errors from unknown types', () => {
      const stringError = createError('String error message');
      const regularError = createError(new Error('Regular error'));
      const urlError = createError(new Error('Invalid URL provided'));

      expect(stringError).toBeInstanceOf(PipelineError);
      expect(regularError).toBeInstanceOf(PipelineError);
      expect(urlError).toBeInstanceOf(WebScrapingError);
    });
  });

  describe('Logging Integration', () => {
    it('should log operations with context', () => {
      const operation = 'testOperation';
      const component = 'TestComponent';
      const context = { userId: '123', action: 'test' };

      logger.startOperation(operation, component, context);
      logger.completeOperation(operation, component, { result: 'success' }, 1000);

      const logs = logger.getRecentLogs(10);
      expect(logs).toHaveLength(2);
      expect(logs[0].operation).toBe(operation);
      expect(logs[0].component).toBe(component);
      expect(logs[0].context).toEqual(context);
    });

    it('should log errors with full context', () => {
      const error = new WebScrapingError(
        'Network timeout',
        ErrorCode.NETWORK_ERROR,
        true,
        undefined,
        { url: 'https://example.com', timeout: 30000 }
      );

      logger.error('Operation failed', error, { attempt: 1 }, 'WebScraper', 'scrapeUrl');

      const logs = logger.getRecentLogs(10);
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].error).toBe(error);
      expect(logs[0].context).toEqual({ attempt: 1 });
    });

    it('should provide logging statistics', () => {
      logger.debug('Debug message', undefined, 'Component1');
      logger.info('Info message', undefined, 'Component1');
      logger.warn('Warning message', undefined, 'Component2');
      logger.error('Error message', new Error('Test error'), undefined, 'Component2');

      const stats = logger.getStats();
      expect(stats.totalLogs).toBe(4);
      expect(stats.byLevel.DEBUG).toBe(1);
      expect(stats.byLevel.INFO).toBe(1);
      expect(stats.byLevel.WARN).toBe(1);
      expect(stats.byLevel.ERROR).toBe(1);
      expect(stats.byComponent.Component1).toBe(2);
      expect(stats.byComponent.Component2).toBe(2);
      expect(stats.recentErrors).toHaveLength(1);
    });
  });

  describe('Retry Integration', () => {
    it('should retry operations with logging', async () => {
      let attempts = 0;
      const testFunction = async () => {
        attempts++;
        if (attempts < 3) {
          throw new MarketResearchError('Temporary failure', ErrorCode.API_UNAVAILABLE, true);
        }
        return 'success';
      };

      const result = await retryManager.executeWithRetry(
        'testOperation',
        testFunction,
        { maxAttempts: 3, baseDelay: 10 },
        'TestComponent'
      );

      expect(result.result).toBe('success');
      expect(result.attempts).toBe(3);
      expect(result.errors).toHaveLength(2);

      // Check that operations were logged
      const logs = logger.getRecentLogs(20);
      const operationLogs = logs.filter(log => log.operation?.includes('testOperation'));
      expect(operationLogs.length).toBeGreaterThan(0);
    });

    it('should not retry non-retryable errors', async () => {
      let attempts = 0;
      const testFunction = async () => {
        attempts++;
        throw new WebScrapingError('Invalid URL', ErrorCode.INVALID_URL, false);
      };

      await expect(
        retryManager.executeWithRetry(
          'testOperation',
          testFunction,
          { maxAttempts: 3, baseDelay: 10 },
          'TestComponent'
        )
      ).rejects.toThrow('Invalid URL');

      expect(attempts).toBe(1);
    });
  });

  describe('Error Serialization', () => {
    it('should serialize errors to JSON correctly', () => {
      const error = new WebScrapingError(
        'Network error',
        ErrorCode.NETWORK_ERROR,
        true,
        'Please check your connection',
        { url: 'https://example.com', timeout: 30000 }
      );

      const json = error.toJSON();

      expect(json.name).toBe('WebScrapingError');
      expect(json.message).toBe('Network error');
      expect(json.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(json.severity).toBe(ErrorSeverity.HIGH);
      expect(json.isRetryable).toBe(true);
      expect(json.userMessage).toBe('Please check your connection');
      expect(json.context).toEqual({ url: 'https://example.com', timeout: 30000 });
      expect(json.timestamp).toBeDefined();
      expect(json.stack).toBeDefined();
    });
  });

  describe('User-Friendly Messages', () => {
    it('should provide appropriate user messages for different error types', () => {
      const errors = [
        new WebScrapingError('Network failed', ErrorCode.NETWORK_ERROR),
        new WebScrapingError('Rate limited', ErrorCode.RATE_LIMITED),
        new ProductExtractionError('Missing data', ErrorCode.MISSING_REQUIRED_DATA),
        new MarketResearchError('API down', ErrorCode.API_UNAVAILABLE),
        new PipelineError('Validation failed', ErrorCode.VALIDATION_FAILED)
      ];

      errors.forEach(error => {
        expect(error.userMessage).toBeDefined();
        expect(error.userMessage.length).toBeGreaterThan(0);
        expect(error.userMessage).not.toBe(error.message); // Should be different from technical message
      });
    });
  });
});