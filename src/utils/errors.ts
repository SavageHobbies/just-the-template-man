/**
 * Custom error types for the eBay Listing Optimizer
 */

export enum ErrorCode {
  // Web scraping errors
  INVALID_URL = 'INVALID_URL',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  SCRAPING_FAILED = 'SCRAPING_FAILED',
  
  // Product extraction errors
  EXTRACTION_FAILED = 'EXTRACTION_FAILED',
  MISSING_REQUIRED_DATA = 'MISSING_REQUIRED_DATA',
  INVALID_PRODUCT_DATA = 'INVALID_PRODUCT_DATA',
  IMAGE_EXTRACTION_FAILED = 'IMAGE_EXTRACTION_FAILED',
  
  // Market research errors
  RESEARCH_FAILED = 'RESEARCH_FAILED',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  
  // Content optimization errors
  OPTIMIZATION_FAILED = 'OPTIMIZATION_FAILED',
  INVALID_RESEARCH_DATA = 'INVALID_RESEARCH_DATA',
  
  // Template rendering errors
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  TEMPLATE_INVALID = 'TEMPLATE_INVALID',
  RENDERING_FAILED = 'RENDERING_FAILED',
  
  // Pipeline errors
  PIPELINE_FAILED = 'PIPELINE_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Base error class for all application errors
 */
export abstract class BaseError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly isRetryable: boolean;
  public readonly userMessage: string;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode,
    severity: ErrorSeverity,
    isRetryable: boolean = false,
    userMessage?: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    this.isRetryable = isRetryable;
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.context = context;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  protected abstract getDefaultUserMessage(): string;

  /**
   * Returns a JSON representation of the error
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      isRetryable: this.isRetryable,
      userMessage: this.userMessage,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }
}

/**
 * Web scraping related errors
 */
export class WebScrapingError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.SCRAPING_FAILED,
    isRetryable: boolean = false,
    userMessage?: string,
    context?: Record<string, any>
  ) {
    super(message, code, ErrorSeverity.HIGH, isRetryable, userMessage, context);
  }

  protected getDefaultUserMessage(): string {
    switch (this.code) {
      case ErrorCode.INVALID_URL:
        return 'The provided URL is not valid. Please check the URL and try again.';
      case ErrorCode.NETWORK_ERROR:
        return 'Unable to connect to the website. Please check your internet connection and try again.';
      case ErrorCode.RATE_LIMITED:
        return 'Too many requests have been made. Please wait a moment and try again.';
      default:
        return 'Failed to retrieve the webpage content. Please try again later.';
    }
  }
}

/**
 * Product extraction related errors
 */
export class ProductExtractionError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.EXTRACTION_FAILED,
    isRetryable: boolean = false,
    userMessage?: string,
    context?: Record<string, any>
  ) {
    super(message, code, ErrorSeverity.MEDIUM, isRetryable, userMessage, context);
  }

  protected getDefaultUserMessage(): string {
    switch (this.code) {
      case ErrorCode.MISSING_REQUIRED_DATA:
        return 'Could not find all required product information on the page. Please verify the listing URL is correct.';
      case ErrorCode.INVALID_PRODUCT_DATA:
        return 'The product information found appears to be incomplete or invalid.';
      case ErrorCode.IMAGE_EXTRACTION_FAILED:
        return 'Unable to extract product images. The listing may not have accessible images.';
      default:
        return 'Failed to extract product details from the listing. Please try with a different listing.';
    }
  }
}

/**
 * Market research related errors
 */
export class MarketResearchError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.RESEARCH_FAILED,
    isRetryable: boolean = true,
    userMessage?: string,
    context?: Record<string, any>
  ) {
    super(message, code, ErrorSeverity.MEDIUM, isRetryable, userMessage, context);
  }

  protected getDefaultUserMessage(): string {
    switch (this.code) {
      case ErrorCode.INSUFFICIENT_DATA:
        return 'Not enough market data available for this product. Optimization will proceed with limited insights.';
      case ErrorCode.API_UNAVAILABLE:
        return 'Market research services are temporarily unavailable. Please try again later.';
      default:
        return 'Market research could not be completed. Optimization will proceed with available data.';
    }
  }
}

/**
 * Content optimization related errors
 */
export class ContentOptimizationError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.OPTIMIZATION_FAILED,
    isRetryable: boolean = false,
    userMessage?: string,
    context?: Record<string, any>
  ) {
    super(message, code, ErrorSeverity.MEDIUM, isRetryable, userMessage, context);
  }

  protected getDefaultUserMessage(): string {
    switch (this.code) {
      case ErrorCode.INVALID_RESEARCH_DATA:
        return 'The market research data is incomplete. Content optimization may be limited.';
      default:
        return 'Failed to optimize the listing content. Please try again.';
    }
  }
}

/**
 * Template rendering related errors
 */
export class TemplateRenderingError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.RENDERING_FAILED,
    isRetryable: boolean = false,
    userMessage?: string,
    context?: Record<string, any>
  ) {
    super(message, code, ErrorSeverity.HIGH, isRetryable, userMessage, context);
  }

  protected getDefaultUserMessage(): string {
    switch (this.code) {
      case ErrorCode.TEMPLATE_NOT_FOUND:
        return 'The template file could not be found. Please check the template path.';
      case ErrorCode.TEMPLATE_INVALID:
        return 'The template file is invalid or corrupted. Please use a valid template.';
      default:
        return 'Failed to generate the final listing template. Please try again.';
    }
  }
}

/**
 * Pipeline orchestration related errors
 */
export class PipelineError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.PIPELINE_FAILED,
    isRetryable: boolean = false,
    userMessage?: string,
    context?: Record<string, any>
  ) {
    super(message, code, ErrorSeverity.CRITICAL, isRetryable, userMessage, context);
  }

  protected getDefaultUserMessage(): string {
    switch (this.code) {
      case ErrorCode.VALIDATION_FAILED:
        return 'The input data failed validation. Please check your inputs and try again.';
      case ErrorCode.CONFIGURATION_ERROR:
        return 'There is a configuration issue. Please contact support.';
      default:
        return 'The optimization process failed. Please try again or contact support if the issue persists.';
    }
  }
}

/**
 * Utility function to create appropriate error instances based on error type
 */
export function createError(
  error: unknown,
  defaultCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  context?: Record<string, any>
): BaseError {
  if (error instanceof BaseError) {
    return error;
  }

  if (error instanceof Error) {
    // Try to determine the appropriate error type based on the message or context
    if (error.message.includes('URL') || error.message.includes('network')) {
      return new WebScrapingError(error.message, defaultCode, false, undefined, context);
    }
    
    if (error.message.includes('extract') || error.message.includes('parse')) {
      return new ProductExtractionError(error.message, defaultCode, false, undefined, context);
    }
    
    if (error.message.includes('research') || error.message.includes('market')) {
      return new MarketResearchError(error.message, defaultCode, true, undefined, context);
    }
    
    if (error.message.includes('template') || error.message.includes('render')) {
      return new TemplateRenderingError(error.message, defaultCode, false, undefined, context);
    }
    
    // Default to pipeline error for unknown errors
    return new PipelineError(error.message, defaultCode, false, undefined, context);
  }

  // Handle non-Error objects
  const message = typeof error === 'string' ? error : 'An unknown error occurred';
  return new PipelineError(message, defaultCode, false, undefined, context);
}

/**
 * Type guard to check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return error instanceof BaseError && error.isRetryable;
}

/**
 * Type guard to check if an error is critical
 */
export function isCriticalError(error: unknown): boolean {
  return error instanceof BaseError && error.severity === ErrorSeverity.CRITICAL;
}