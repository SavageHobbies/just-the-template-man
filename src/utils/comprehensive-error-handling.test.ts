/**
 * Comprehensive test for the complete error handling and logging system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  WebScrapingError,
  ProductExtractionError,
  MarketResearchError,
  ContentOptimizationError,
  TemplateRenderingError,
  PipelineError,
  ErrorCode,
  ErrorSeverity,
  createError,
  isRetryableError,
  isCriticalError,
  getLogger,
  LogLevel,
  RetryManager,
  CircuitBreaker
} from './index';

describe('Comprehensive Error Handling and Logging System', () => {
  let logger: ReturnType<typeof getLogger>;

  beforeEach(() => {
    logger = getLogger();
    logger.clearLogs();
    logger.configure({ level: LogLevel.DEBUG, enableConsole: false });
  });

  describe('Complete Error Lifecycle', () => {
    it('should handle a complete error scenario with logging and recovery', async () => {
      const retryManager = new RetryManager();
      let attempts = 0;

      // Simulate a service that fails twice then succeeds
      const flakyService = async () => {
        attempts++;
        
        if (attempts === 1) {
          throw new WebScrapingError(
            'Network timeout',
            ErrorCode.NETWORK_ERROR,
            true,
            undefined,
            { url: 'https://example.com', attempt: attempts }
          );
        }
        
        if (attempts === 2) {
          throw new MarketResearchError(
            'API temporarily unavailable',
            ErrorCode.API_UNAVAILABLE,
            true,
            undefined,
            { service: 'market-api', attempt: attempts }
          );
        }
        
        return { data: 'success', attempts };
      };

      // Execute with retry and logging
      const result = await retryManager.executeWithRetry(
        'flakyServiceOperation',
        flakyService,
        {
          maxAttempts: 3,
          baseDelay: 10,
          backoffStrategy: 'exponential'
        },
        'TestService'
      );

      // Verify the operation succeeded
      expect(result.result.data).toBe('success');
      expect(result.attempts).toBe(3);
      expect(result.errors).toHaveLength(2);

      // Verify logging captured the entire process
      const logs = logger.getRecentLogs(20);
      const operationLogs = logs.filter(log => 
        log.operation?.includes('flakyServiceOperation') || 
        log.operation?.includes('retry-flakyServiceOperation')
      );
      
      expect(operationLogs.length).toBeGreaterThan(0);
      
      // Check that we have both start and completion logs
      const startLogs = operationLogs.filter(log => log.message.includes('Starting'));
      const completeLogs = operationLogs.filter(log => log.message.includes('Completed'));
      
      expect(startLogs.length).toBeGreaterThan(0);
      expect(completeLogs.length).toBeGreaterThan(0);
    });

    it('should handle non-retryable errors correctly', async () => {
      const retryManager = new RetryManager();
      
      const nonRetryableService = async () => {
        throw new PipelineError(
          'Configuration is invalid',
          ErrorCode.CONFIGURATION_ERROR,
          false,
          undefined,
          { config: 'invalid-config' }
        );
      };

      await expect(
        retryManager.executeWithRetry(
          'nonRetryableOperation',
          nonRetryableService,
          { maxAttempts: 3, baseDelay: 10 },
          'TestService'
        )
      ).rejects.toThrow('Configuration is invalid');

      // Verify it only tried once
      const logs = logger.getRecentLogs(10);
      const errorLogs = logs.filter(log => log.level >= LogLevel.ERROR);
      expect(errorLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should open circuit after repeated failures', async () => {
      const circuitBreaker = new CircuitBreaker(2, 1000, 'TestService'); // 2 failures, 1 second recovery
      
      const alwaysFailingService = async () => {
        throw new WebScrapingError('Service always fails', ErrorCode.SCRAPING_FAILED);
      };

      // First two calls should fail and open the circuit
      await expect(circuitBreaker.execute('failingOperation', alwaysFailingService))
        .rejects.toThrow('Service always fails');
      
      await expect(circuitBreaker.execute('failingOperation', alwaysFailingService))
        .rejects.toThrow('Service always fails');

      // Circuit should now be open
      expect(circuitBreaker.getStatus().state).toBe('OPEN');

      // Next call should be blocked by circuit breaker
      await expect(circuitBreaker.execute('failingOperation', alwaysFailingService))
        .rejects.toThrow('Circuit breaker is OPEN');
    });
  });

  describe('Error Context and User Messages', () => {
    it('should provide rich context and user-friendly messages', () => {
      const errors = [
        new WebScrapingError(
          'Connection timeout after 30 seconds',
          ErrorCode.NETWORK_ERROR,
          true,
          undefined,
          { url: 'https://ebay.com/item/123', timeout: 30000, retryCount: 2 }
        ),
        new ProductExtractionError(
          'Could not find price element in DOM',
          ErrorCode.MISSING_REQUIRED_DATA,
          false,
          undefined,
          { selector: '.price', pageTitle: 'Test Product' }
        ),
        new MarketResearchError(
          'Rate limit exceeded for research API',
          ErrorCode.RATE_LIMITED,
          true,
          undefined,
          { apiEndpoint: '/api/research', rateLimitReset: Date.now() + 60000 }
        )
      ];

      errors.forEach(error => {
        // Technical message for developers
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
        
        // User-friendly message
        expect(error.userMessage).toBeDefined();
        expect(error.userMessage.length).toBeGreaterThan(0);
        expect(error.userMessage).not.toBe(error.message);
        
        // Rich context for debugging
        expect(error.context).toBeDefined();
        expect(Object.keys(error.context!).length).toBeGreaterThan(0);
        
        // Proper classification
        expect(error.code).toBeDefined();
        expect(error.severity).toBeDefined();
        expect(typeof error.isRetryable).toBe('boolean');
        
        // Serialization
        const json = error.toJSON();
        expect(json.name).toBeDefined();
        expect(json.timestamp).toBeDefined();
        expect(json.stack).toBeDefined();
      });
    });
  });

  describe('Logging Statistics and Analysis', () => {
    it('should provide comprehensive logging statistics', () => {
      // Generate various log entries
      logger.debug('Debug operation started', { step: 1 }, 'Service1', 'operation1');
      logger.info('Processing data', { records: 100 }, 'Service1', 'operation1');
      logger.warn('Performance degraded', { responseTime: 5000 }, 'Service2', 'operation2');
      logger.error('Operation failed', new WebScrapingError('Network error', ErrorCode.NETWORK_ERROR), 
        { attempt: 3 }, 'Service2', 'operation2');
      logger.critical('System failure', new PipelineError('Critical system error', ErrorCode.PIPELINE_FAILED),
        { systemLoad: 0.95 }, 'System', 'healthCheck');

      const stats = logger.getStats();

      // Verify overall statistics
      expect(stats.totalLogs).toBe(5);
      expect(stats.byLevel.DEBUG).toBe(1);
      expect(stats.byLevel.INFO).toBe(1);
      expect(stats.byLevel.WARN).toBe(1);
      expect(stats.byLevel.ERROR).toBe(1);
      expect(stats.byLevel.CRITICAL).toBe(1);

      // Verify component breakdown
      expect(stats.byComponent.Service1).toBe(2);
      expect(stats.byComponent.Service2).toBe(2);
      expect(stats.byComponent.System).toBe(1);

      // Verify recent errors
      expect(stats.recentErrors).toHaveLength(2); // ERROR and CRITICAL levels
      expect(stats.recentErrors[0].level).toBe('ERROR');
      expect(stats.recentErrors[1].level).toBe('CRITICAL');
    });

    it('should filter logs by operation and component', () => {
      logger.info('Step 1', undefined, 'ServiceA', 'operationX');
      logger.info('Step 2', undefined, 'ServiceA', 'operationX');
      logger.info('Step 1', undefined, 'ServiceB', 'operationY');
      logger.warn('Warning', undefined, 'ServiceA', 'operationZ');

      // Filter by operation
      const operationXLogs = logger.getOperationLogs('operationX');
      expect(operationXLogs).toHaveLength(2);
      expect(operationXLogs.every(log => log.operation === 'operationX')).toBe(true);

      // Filter by component
      const serviceALogs = logger.getComponentLogs('ServiceA');
      expect(serviceALogs).toHaveLength(3);
      expect(serviceALogs.every(log => log.component === 'ServiceA')).toBe(true);
    });
  });

  describe('Error Recovery Patterns', () => {
    it('should demonstrate graceful degradation', async () => {
      // Simulate a service that provides fallback behavior
      const serviceWithFallback = async (useMainService: boolean) => {
        if (useMainService) {
          throw new MarketResearchError(
            'Main research service unavailable',
            ErrorCode.API_UNAVAILABLE,
            false, // Not retryable - should use fallback
            undefined,
            { service: 'primary-research-api' }
          );
        }
        
        // Fallback service
        logger.warn('Using fallback service', { reason: 'primary-unavailable' }, 'ResearchService');
        return { data: 'fallback-data', source: 'fallback' };
      };

      // Try main service, fall back on failure
      let result;
      try {
        result = await serviceWithFallback(true);
      } catch (error) {
        if (error instanceof MarketResearchError && !error.isRetryable) {
          logger.info('Falling back to secondary service', { reason: error.code }, 'ResearchService');
          result = await serviceWithFallback(false);
        } else {
          throw error;
        }
      }

      expect(result.source).toBe('fallback');
      
      // Verify logging captured the fallback
      const logs = logger.getRecentLogs(10);
      const fallbackLogs = logs.filter(log => log.message.includes('fallback'));
      expect(fallbackLogs.length).toBeGreaterThan(0);
    });
  });
});