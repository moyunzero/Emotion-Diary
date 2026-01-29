/**
 * 日志系统模块
 * 提供统一的日志记录功能
 * 
 * 根据需求 4.4, 4.5 实现
 */

import { isDevelopment } from './env';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  /** 调试信息 */
  DEBUG = 'DEBUG',
  /** 一般信息 */
  INFO = 'INFO',
  /** 警告信息 */
  WARN = 'WARN',
  /** 错误信息 */
  ERROR = 'ERROR',
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  /** 日志级别 */
  level: LogLevel;
  /** 时间戳 */
  timestamp: Date;
  /** 上下文/模块名称 */
  context: string;
  /** 日志消息 */
  message: string;
  /** 附加数据（可选） */
  data?: any;
}

/**
 * 日志记录器类
 * 提供统一的日志记录接口，支持不同级别的日志
 * 
 * @example
 * ```typescript
 * const logger = Logger.getInstance();
 * logger.info('UserService', '用户登录成功', { userId: '123' });
 * logger.error('SyncService', '同步失败', error);
 * ```
 */
export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {}

  /**
   * 获取 Logger 单例实例
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 记录日志
   * 
   * @param level - 日志级别
   * @param context - 上下文/模块名称
   * @param message - 日志消息
   * @param data - 附加数据（可选）
   */
  log(level: LogLevel, context: string, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      timestamp: new Date(),
      context,
      message,
      data,
    };

    this.logs.push(entry);

    // 限制日志数量，防止内存溢出
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 在开发环境输出到控制台
    if (isDevelopment()) {
      this.consoleLog(entry);
    }

    // 持久化错误日志
    if (level === LogLevel.ERROR) {
      this.persistLog(entry);
    }
  }

  /**
   * 记录调试信息
   */
  debug(context: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, context, message, data);
  }

  /**
   * 记录一般信息
   */
  info(context: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, context, message, data);
  }

  /**
   * 记录警告信息
   */
  warn(context: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, context, message, data);
  }

  /**
   * 记录错误信息
   */
  error(context: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, context, message, data);
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 获取指定级别的日志
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * 清除所有日志
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 输出日志到控制台
   */
  private consoleLog(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level}] [${entry.context}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data);
        break;
    }
  }

  /**
   * 持久化日志到本地存储
   * 注意：这是一个简化实现，实际项目中可能需要使用 AsyncStorage 或其他持久化方案
   */
  private persistLog(entry: LogEntry): void {
    // TODO: 实现日志持久化逻辑
    // 可以使用 AsyncStorage 或文件系统
    // 这里暂时只在控制台输出
    if (isDevelopment()) {
      console.log('[Logger] 持久化日志:', entry);
    }
  }
}

/**
 * 导出默认的 Logger 实例
 */
export const logger = Logger.getInstance();
