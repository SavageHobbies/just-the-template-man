/**
 * Tests for error handling utilities
 */

import {
  BaseError,
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
  isCriticalError
} from './errors';

describe('Error Handling System', () => {
  describe('BaseError', () => {
    class TestError extends BaseError {
      protected getDefaultUserMessage(): string {
        return 'Test error occurred';
      }
    }

    it('should create error with all properties', () => {
      const context = { testKey: 'testValue' };
      const error = new TestError(
        'Test message',
        ErrorCode.UNKNOWN_ERROR,
        ErrorSeverity.HIGH,
        true,
        'User friendly message',
        context
      );

      expect(error.message).toBe('Test message');
      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.isRetryable).toBe(true);
      expect(error.userMessage).toBe('User friendly message');
      expect(error.context).toBe(context);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should use default user message when not provided', () => {
      const error = new TestError(
        'Test message',
        ErrorCode.UNKNOWN_ERROR,
        ErrorSeverity.HIGH
      );

      expect(error.userMessage).toBe('Test error occurred');
    });

    it('should serialize to JSON correctly', () => {
      const context = { testKey: 'testValue' };
      const error = new TestError(
        'Test message',
        ErrorCode.UNKNOWN_ERROR,
        ErrorSeverity.HIGH,
        true,
        'User message',
        context
      );

      const json = error.toJSON();

      expect(json.name).toBe('TestError');
      expect(json.message).toBe('Test message');
      expect(json.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(json.severity).toBe(ErrorSeverity.HIGH);
      expect(json.isRetryable).toBe(true);
      expect(json.userMessage).toBe('User message');
      expect(json.context).toBe(context);
      expect(json.timestamp).toBeDefined();
      expect(json.stack).toBeDefined();
    });
  });

  describe('WebScrapingError', () => {
    it('should create with default values', () => {
      const error = new WebScrapingError('Scraping failed');

      expect(error.code).toBe(ErrorCode.SCRAPING_FAILED);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.isRetryable).toBe(false);
    });

    it('should provide appropriate user messages for different codes', () => {
      const invalidUrlError = new WebScrapingError('Invalid URL', ErrorCode.INVALID_URL);
      const networkError = new WebScrapingError('Network failed', ErrorCode.NETWORK_ERROR);
      const rateLimitError = new WebScrapingError('Rate limited', ErrorCode.RATE_LIMITED);

      expect(invalidUrlError.userMessage).toContain('URL is not valid');
      expect(networkError.userMessage).toContain('internet connection');
      expect(rateLimitError.userMessage).toContain('Too many requests');
    });
  });

  describe('ProductExtractionError', () => {
    it('should create with appropriate defaults', () => {
      const error = new ProductExtractionError('Extraction failed');

      expect(error.code).toBe(ErrorCode.EXTRACTION_FAILED);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.isRetryable).toBe(false);
    });

    it('should provide specific user messages', () => {
      const missingDataError = new ProductExtractionError(
        'Missing data',
        ErrorCode.MISSING_REQUIRED_DATA
      );
      const imageError = new ProductExtractionError(
        'Image failed',
        ErrorCode.IMAGE_EXTRACTION_FAILED
      );

      expect(missingDataError.userMessage).toContain('required product information');
      expect(imageError.userMessage).toContain('extract product images');
    });
  });

  describe('MarketResearchError', () => {
    it('should be retryable by default', () => {
      const error = new MarketResearchError('Research failed');

      expect(error.isRetryable).toBe(true);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should provide helpful user messages', () => {
      const insufficientDataError = new MarketResearchError(
        'Not enough data',
        ErrorCode.INSUFFICIENT_DATA
      );
      const apiError = new MarketResearchError(
        'API unavailable',
        ErrorCode.API_UNAVAILABLE
      );

      expect(insufficientDataError.userMessage).toContain('Not enough market data');
      expect(apiError.userMessage).toContain('temporarily unavailable');
    });
  });

  describe('ContentOptimizationError', () => {
    it('should create with appropriate defaults', () => {
      const error = new ContentOptimizationError('Optimization failed');

      expect(error.code).toBe(ErrorCode.OPTIMIZATION_FAILED);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.isRetryable).toBe(false);
    });
  });

  describe('TemplateRenderingError', () => {
    it('should be high severity', () => {
      const error = new TemplateRenderingError('Rendering failed');

      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.isRetryable).toBe(false);
    });

    it('should provide specific messages for template issues', () => {
      const notFoundError = new TemplateRenderingError(
        'Template not found',
        ErrorCode.TEMPLATE_NOT_FOUND
      );
      const invalidError = new TemplateRenderingError(
        'Template invalid',
        ErrorCode.TEMPLATE_INVALID
      );

      expect(notFoundError.userMessage).toContain('template file could not be found');
      expect(invalidError.userMessage).toContain('template file is invalid');
    });
  });

  describe('PipelineError', () => {
    it('should be critical severity', () => {
      const error = new PipelineError('Pipeline failed');

      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.isRetryable).toBe(false);
    });

    it('should provide actionable user messages', () => {
      const validationError = new PipelineError(
        'Validation failed',
        ErrorCode.VALIDATION_FAILED
      );
      const configError = new PipelineError(
        'Config error',
        ErrorCode.CONFIGURATION_ERROR
      );

      expect(validationError.userMessage).toContain('input data failed validation');
      expect(configError.userMessage).toContain('configuration issue');
    });
  });

  describe('createError utility', () => {
    it('should return BaseError as-is', () => {
      const originalError = new WebScrapingError('Test error');
      const result = createError(originalError);

      expect(result).toBe(originalError);
    });

    it('should create appropriate error types based on message content', () => {
      const urlError = createError(new Error('Invalid URL provided'));
      const extractError = createError(new Error('Failed to extract data'));
      const researchError = createError(new Error('Market research failed'));
      const templateError = createError(new Error('Template rendering failed'));

      expect(urlError).toBeInstanceOf(WebScrapingError);
      expect(extractError).toBeInstanceOf(ProductExtractionError);
      expect(researchError).toBeInstanceOf(MarketResearchError);
      expect(templateError).toBeInstanceOf(TemplateRenderingError);
    });

    it('should handle non-Error objects', () => {
      const stringError = createError('String error');
      const objectError = createError({ message: 'Object error' });
      const nullError = createError(null);

      expect(stringError).toBeInstanceOf(PipelineError);
      expect(stringError.message).toBe('String error');
      expect(objectError).toBeInstanceOf(PipelineError);
      expect(nullError).toBeInstanceOf(PipelineError);
    });

    it('should include context in created errors', () => {
      const context = { testKey: 'testValue' };
      const error = createError(new Error('Test error'), ErrorCode.UNKNOWN_ERROR, context);

      expect(error.context).toBe(context);
    });
  });

  describe('isRetryableError utility', () => {
    it('should identify retryable errors correctly', () => {
      const retryableError = new MarketResearchError('Research failed'); // retryable by default
      const nonRetryableError = new WebScrapingError('Scraping failed'); // not retryable by default
      const regularError = new Error('Regular error');

      expect(isRetryableError(retryableError)).toBe(true);
      expect(isRetryableError(nonRetryableError)).toBe(false);
      expect(isRetryableError(regularError)).toBe(false);
    });
  });

  describe('isCriticalError utility', () => {
    it('should identify critical errors correctly', () => {
      const criticalError = new PipelineError('Pipeline failed'); // critical by default
      const nonCriticalError = new WebScrapingError('Scraping failed'); // high severity
      const regularError = new Error('Regular error');

      expect(isCriticalError(criticalError)).toBe(true);
      expect(isCriticalError(nonCriticalError)).toBe(false);
      expect(isCriticalError(regularError)).toBe(false);
    });
  });

  describe('Error inheritance and instanceof checks', () => {
    it('should maintain proper inheritance chain', () => {
      const webError = new WebScrapingError('Web error');
      const extractError = new ProductExtractionError('Extract error');
      const pipelineError = new PipelineError('Pipeline error');

      expect(webError).toBeInstanceOf(BaseError);
      expect(webError).toBeInstanceOf(Error);
      expect(extractError).toBeInstanceOf(BaseError);
      expect(extractError).toBeInstanceOf(Error);
      expect(pipelineError).toBeInstanceOf(BaseError);
      expect(pipelineError).toBeInstanceOf(Error);
    });
  });
});