/**
 * Centralized logging system for the eBay Listing Optimizer
 */

import { BaseError, ErrorSeverity } from './errors';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: BaseError;
  component?: string;
  operation?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
}

/**
 * Centralized logger class
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private readonly maxMemoryLogs = 1000;

  private constructor(config: LoggerConfig) {
    this.config = config;
  }

  /**
   * Get or create the singleton logger instance
   */
  public static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      const defaultConfig: LoggerConfig = {
        level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
        enableConsole: true,
        enableFile: false,
        filePath: 'logs/ebay-optimizer.log',
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      };
      Logger.instance = new Logger(config || defaultConfig);
    }
    return Logger.instance;
  }

  /**
   * Set the logging configuration
   */
  public configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Log a debug message
   */
  public debug(message: string, context?: Record<string, any>, component?: string, operation?: string): void {
    this.log(LogLevel.DEBUG, message, context, undefined, component, operation);
  }

  /**
   * Log an info message
   */
  public info(message: string, context?: Record<string, any>, component?: string, operation?: string): void {
    this.log(LogLevel.INFO, message, context, undefined, component, operation);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context?: Record<string, any>, component?: string, operation?: string): void {
    this.log(LogLevel.WARN, message, context, undefined, component, operation);
  }

  /**
   * Log an error message
   */
  public error(message: string, error?: BaseError | Error, context?: Record<string, any>, component?: string, operation?: string): void {
    const baseError = error instanceof BaseError ? error : undefined;
    this.log(LogLevel.ERROR, message, context, baseError, component, operation);
  }

  /**
   * Log a critical error message
   */
  public critical(message: string, error?: BaseError | Error, context?: Record<string, any>, component?: string, operation?: string): void {
    const baseError = error instanceof BaseError ? error : undefined;
    this.log(LogLevel.CRITICAL, message, context, baseError, component, operation);
  }

  /**
   * Log an operation start
   */
  public startOperation(operation: string, component?: string, context?: Record<string, any>): void {
    this.info(`Starting operation: ${operation}`, context, component, operation);
  }

  /**
   * Log an operation completion
   */
  public completeOperation(operation: string, component?: string, context?: Record<string, any>, duration?: number): void {
    const durationText = duration ? ` (${duration}ms)` : '';
    this.info(`Completed operation: ${operation}${durationText}`, context, component, operation);
  }

  /**
   * Log an operation failure
   */
  public failOperation(operation: string, error: BaseError | Error, component?: string, context?: Record<string, any>): void {
    const baseError = error instanceof BaseError ? error : undefined;
    this.error(`Failed operation: ${operation} - ${error.message}`, baseError, context, component, operation);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: BaseError,
    component?: string,
    operation?: string
  ): void {
    if (level < this.config.level) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error,
      component,
      operation
    };

    // Store in memory (with rotation)
    this.addToMemoryLogs(logEntry);

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Output to file if enabled (in a real implementation, you'd use fs.appendFile)
    if (this.config.enableFile) {
      this.logToFile(logEntry);
    }
  }

  /**
   * Add log entry to memory with rotation
   */
  private addToMemoryLogs(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxMemoryLogs) {
      this.logs.shift();
    }
  }

  /**
   * Output log entry to console with appropriate formatting
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const component = entry.component ? `[${entry.component}]` : '';
    const operation = entry.operation ? `{${entry.operation}}` : '';
    
    let logMessage = `${timestamp} ${levelName} ${component}${operation} ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      logMessage += ` | Context: ${JSON.stringify(entry.context)}`;
    }

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(logMessage);
        if (entry.error) {
          console.error('Error details:', entry.error.toJSON());
        }
        break;
    }
  }

  /**
   * Output log entry to file (placeholder implementation)
   */
  private logToFile(entry: LogEntry): void {
    // In a real implementation, this would write to a file
    // For now, we'll just store the formatted log entry
    const logLine = this.formatLogEntry(entry);
    // fs.appendFileSync(this.config.filePath!, logLine + '\n');
  }

  /**
   * Format log entry for file output
   */
  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const component = entry.component || 'UNKNOWN';
    const operation = entry.operation || 'UNKNOWN';
    
    const baseLog = `${timestamp} [${levelName}] [${component}] {${operation}} ${entry.message}`;
    
    if (entry.context) {
      return `${baseLog} | Context: ${JSON.stringify(entry.context)}`;
    }
    
    if (entry.error) {
      return `${baseLog} | Error: ${JSON.stringify(entry.error.toJSON())}`;
    }
    
    return baseLog;
  }

  /**
   * Get recent log entries
   */
  public getRecentLogs(count: number = 100, level?: LogLevel): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level !== undefined) {
      filteredLogs = this.logs.filter(log => log.level >= level);
    }
    
    return filteredLogs.slice(-count);
  }

  /**
   * Get logs for a specific operation
   */
  public getOperationLogs(operation: string): LogEntry[] {
    return this.logs.filter(log => log.operation === operation);
  }

  /**
   * Get logs for a specific component
   */
  public getComponentLogs(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component);
  }

  /**
   * Clear all logs from memory
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get logging statistics
   */
  public getStats(): Record<string, any> {
    const stats = {
      totalLogs: this.logs.length,
      byLevel: {} as Record<string, number>,
      byComponent: {} as Record<string, number>,
      recentErrors: this.logs
        .filter(log => log.level >= LogLevel.ERROR)
        .slice(-10)
        .map(log => ({
          timestamp: log.timestamp,
          level: LogLevel[log.level],
          message: log.message,
          component: log.component,
          operation: log.operation
        }))
    };

    // Count by level
    for (const log of this.logs) {
      const levelName = LogLevel[log.level];
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;
    }

    // Count by component
    for (const log of this.logs) {
      const component = log.component || 'UNKNOWN';
      stats.byComponent[component] = (stats.byComponent[component] || 0) + 1;
    }

    return stats;
  }
}

/**
 * Convenience function to get the default logger instance
 */
export function getLogger(): Logger {
  return Logger.getInstance();
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();
  private static logger = getLogger();

  /**
   * Start timing an operation
   */
  public static start(operation: string, component?: string): void {
    const key = `${component || 'UNKNOWN'}:${operation}`;
    PerformanceMonitor.timers.set(key, Date.now());
    PerformanceMonitor.logger.debug(`Performance timer started for ${operation}`, undefined, component, operation);
  }

  /**
   * End timing an operation and log the duration
   */
  public static end(operation: string, component?: string): number {
    const key = `${component || 'UNKNOWN'}:${operation}`;
    const startTime = PerformanceMonitor.timers.get(key);
    
    if (!startTime) {
      PerformanceMonitor.logger.warn(`No timer found for operation: ${operation}`, undefined, component, operation);
      return 0;
    }

    const duration = Date.now() - startTime;
    PerformanceMonitor.timers.delete(key);
    
    PerformanceMonitor.logger.info(
      `Performance: ${operation} completed in ${duration}ms`,
      { duration },
      component,
      operation
    );
    
    return duration;
  }

  /**
   * Measure the execution time of an async function
   */
  public static async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    component?: string
  ): Promise<T> {
    PerformanceMonitor.start(operation, component);
    try {
      const result = await fn();
      PerformanceMonitor.end(operation, component);
      return result;
    } catch (error) {
      PerformanceMonitor.end(operation, component);
      throw error;
    }
  }
}