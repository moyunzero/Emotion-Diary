/**
 * 错误处理工具模块
 * 提供统一的错误类型定义和错误处理机制
 *
 * 根据需求 1.3, 4.1 实现
 */

import { isDevelopment } from "./env";

/**
 * 错误类型枚举
 * 定义应用中可能出现的所有错误类型
 */
export enum ErrorType {
  /** 网络相关错误 */
  NETWORK = "NETWORK",
  /** 数据验证错误 */
  VALIDATION = "VALIDATION",
  /** 认证/授权错误 */
  AUTH = "AUTH",
  /** 数据同步错误 */
  SYNC = "SYNC",
  /** AI服务错误 */
  AI = "AI",
  /** 本地存储错误 */
  STORAGE = "STORAGE",
  /** 未知错误 */
  UNKNOWN = "UNKNOWN",
}

/**
 * 应用错误类
 * 扩展标准Error类，添加错误类型、可恢复性和原始错误信息
 *
 * @example
 * ```typescript
 * throw new AppError(
 *   ErrorType.NETWORK,
 *   '网络连接失败',
 *   true,
 *   originalError
 * );
 * ```
 */
export class AppError extends Error {
  /**
   * 错误类型
   */
  public readonly type: ErrorType;

  /**
   * 错误是否可恢复
   * - true: 可以尝试自动恢复（如重试、切换到离线模式等）
   * - false: 不可恢复，需要用户介入或显示错误信息
   */
  public readonly recoverable: boolean;

  /**
   * 原始错误对象（如果有）
   * 保留原始错误信息用于调试和日志记录
   */
  public readonly originalError?: Error;

  /**
   * 创建一个应用错误实例
   *
   * @param type - 错误类型
   * @param message - 用户友好的错误消息
   * @param recoverable - 错误是否可恢复，默认为 true
   * @param originalError - 原始错误对象（可选）
   */
  constructor(
    type: ErrorType,
    message: string,
    recoverable: boolean = true,
    originalError?: Error,
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.recoverable = recoverable;
    this.originalError = originalError;

    // 维护正确的原型链（TypeScript/Babel 编译时需要）
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * 获取完整的错误信息（包括原始错误）
   * 用于日志记录和调试
   */
  getFullMessage(): string {
    if (this.originalError) {
      return `${this.message} (原因: ${this.originalError.message})`;
    }
    return this.message;
  }

  /**
   * 转换为JSON格式
   * 用于序列化和日志记录
   */
  toJSON(): object {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      recoverable: this.recoverable,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
      stack: this.stack,
    };
  }
}

/**
 * 错误处理器类
 * 提供统一的错误处理机制，包括错误规范化、日志记录、恢复尝试和用户通知
 *
 * 根据需求 4.2, 4.3 实现
 *
 * @example
 * ```typescript
 * const errorHandler = ErrorHandler.getInstance();
 * try {
 *   // 某些操作
 * } catch (error) {
 *   errorHandler.handle(error, 'UserService.login');
 * }
 * ```
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private offlineModeCallback?: () => void;
  private queueOperationCallback?: (context: string) => void;
  private notifyUserCallback?: (message: string, type: ErrorType) => void;

  private constructor() {}

  /**
   * 获取 ErrorHandler 单例实例
   */
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 设置离线模式回调
   * 当需要切换到离线模式时调用
   */
  setOfflineModeCallback(callback: () => void): void {
    this.offlineModeCallback = callback;
  }

  /**
   * 设置队列操作回调
   * 当需要将操作加入队列时调用
   */
  setQueueOperationCallback(callback: (context: string) => void): void {
    this.queueOperationCallback = callback;
  }

  /**
   * 设置用户通知回调
   * 当需要通知用户时调用
   */
  setNotifyUserCallback(
    callback: (message: string, type: ErrorType) => void,
  ): void {
    this.notifyUserCallback = callback;
  }

  /**
   * 处理错误
   * 这是错误处理的主入口，会执行以下步骤：
   * 1. 规范化错误（转换为 AppError）
   * 2. 记录错误日志
   * 3. 尝试恢复（如果错误可恢复）
   * 4. 通知用户
   *
   * @param error - 要处理的错误
   * @param context - 错误发生的上下文（如 'UserService.login'）
   */
  handle(error: Error | AppError | unknown, context: string): void {
    // 1. 规范化错误
    const appError = this.normalizeError(error);

    // 2. 记录错误日志
    this.logError(appError, context);

    // 3. 尝试恢复
    if (appError.recoverable) {
      this.attemptRecovery(appError, context);
    }

    // 4. 通知用户
    this.notifyUser(appError);
  }

  /**
   * 规范化错误
   * 将任何类型的错误转换为 AppError
   * 根据错误特征判断错误类型
   *
   * @param error - 原始错误
   * @returns 规范化后的 AppError
   */
  private normalizeError(error: Error | AppError | unknown): AppError {
    // 如果已经是 AppError，直接返回
    if (error instanceof AppError) {
      return error;
    }

    // 如果是 Error 对象，根据特征判断类型
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // 网络错误
      if (
        message.includes("network") ||
        message.includes("fetch") ||
        message.includes("connection") ||
        message.includes("timeout") ||
        message.includes("offline")
      ) {
        return new AppError(
          ErrorType.NETWORK,
          "网络连接不可用，数据将在恢复后自动同步",
          true,
          error,
        );
      }

      // 认证错误
      if (
        message.includes("auth") ||
        message.includes("token") ||
        message.includes("unauthorized") ||
        message.includes("forbidden") ||
        message.includes("401") ||
        message.includes("403")
      ) {
        return new AppError(
          ErrorType.AUTH,
          "认证失败，请重新登录",
          false,
          error,
        );
      }

      // 验证错误
      if (
        message.includes("validation") ||
        message.includes("invalid") ||
        message.includes("required") ||
        message.includes("format")
      ) {
        return new AppError(ErrorType.VALIDATION, error.message, true, error);
      }

      // 同步错误
      if (message.includes("sync") || message.includes("conflict")) {
        return new AppError(
          ErrorType.SYNC,
          "同步失败，将自动重试",
          true,
          error,
        );
      }

      // AI错误
      if (
        message.includes("ai") ||
        message.includes("gpt") ||
        message.includes("openai") ||
        message.includes("model") ||
        message.includes("generate")
      ) {
        return new AppError(
          ErrorType.AI,
          "AI服务暂时不可用，请稍后重试",
          true,
          error,
        );
      }

      // 存储错误
      if (
        message.includes("storage") ||
        message.includes("database") ||
        message.includes("db") ||
        message.includes("sqlite") ||
        message.includes("quota") ||
        message.includes("disk")
      ) {
        return new AppError(ErrorType.STORAGE, "本地存储发生错误", true, error);
      }

      // 未知错误
      return new AppError(ErrorType.UNKNOWN, "发生了意外错误", true, error);
    }

    // 如果不是 Error 对象，创建一个未知错误
    return new AppError(
      ErrorType.UNKNOWN,
      "发生了意外错误，我们已记录此问题",
      false,
    );
  }

  /**
   * 记录错误日志
   * 使用 Logger 记录详细的错误信息
   *
   * @param error - AppError 实例
   * @param context - 错误上下文
   */
  private logError(error: AppError, context: string): void {
    // 动态导入 logger 以避免循环依赖
    import("./logger")
      .then(({ logger }) => {
        logger.error(context, error.getFullMessage(), {
          type: error.type,
          recoverable: error.recoverable,
          stack: error.stack,
          originalError: error.originalError
            ? {
                message: error.originalError.message,
                stack: error.originalError.stack,
              }
            : undefined,
        });
      })
      .catch(() => {
        // 如果 logger 不可用，至少输出到控制台
        // console.error(`[${context}]`, error.getFullMessage());
      });
  }

  /**
   * 尝试恢复错误
   * 根据错误类型执行相应的恢复策略
   *
   * @param error - AppError 实例
   * @param context - 错误上下文
   */
  private attemptRecovery(error: AppError, context: string): void {
    switch (error.type) {
      case ErrorType.NETWORK:
        // 切换到离线模式
        this.switchToOfflineMode();
        break;

      case ErrorType.SYNC:
        // 将操作加入队列
        this.queueOperation(context);
        break;

      case ErrorType.AI:
        // AI 错误通常不需要特殊恢复，会使用缓存或降级方案
        break;

      case ErrorType.VALIDATION:
        // 验证错误由用户修正，不需要自动恢复
        break;

      case ErrorType.AUTH:
        // 认证错误可能需要刷新 token，但这里标记为不可恢复
        // 实际实现中可以根据具体情况判断
        break;

      default:
        // 其他错误类型不尝试恢复
        break;
    }
  }

  /**
   * 切换到离线模式
   */
  private switchToOfflineMode(): void {
    if (this.offlineModeCallback) {
      this.offlineModeCallback();
    } else if (isDevelopment()) {
      console.log("[ErrorHandler] 切换到离线模式（未设置回调）");
    }
  }

  /**
   * 将操作加入队列
   */
  private queueOperation(context: string): void {
    if (this.queueOperationCallback) {
      this.queueOperationCallback(context);
    } else if (isDevelopment()) {
      console.log("[ErrorHandler] 将操作加入队列（未设置回调）:", context);
    }
  }

  /**
   * 通知用户
   * 显示用户友好的错误消息
   *
   * @param error - AppError 实例
   */
  private notifyUser(error: AppError): void {
    const userMessage = this.getUserFriendlyMessage(error);

    if (this.notifyUserCallback) {
      this.notifyUserCallback(userMessage, error.type);
    } else if (isDevelopment()) {
      console.log("[ErrorHandler] 通知用户（未设置回调）:", userMessage);
    }
  }

  /**
   * 获取用户友好的错误消息
   *
   * @param error - AppError 实例
   * @returns 用户友好的错误消息
   */
  private getUserFriendlyMessage(error: AppError): string {
    // 如果错误消息已经是用户友好的，直接返回
    if (error.message && !error.message.includes("Error:")) {
      return error.message;
    }

    // 根据错误类型返回默认的用户友好消息
    switch (error.type) {
      case ErrorType.NETWORK:
        return "网络连接不可用，数据将在恢复后自动同步";
      case ErrorType.VALIDATION:
        return "请检查输入的数据是否正确";
      case ErrorType.AUTH:
        return "会话已过期，请重新登录";
      case ErrorType.SYNC:
        return "同步失败，将自动重试";
      case ErrorType.AI:
        return "AI服务暂时不可用，显示历史分析";
      case ErrorType.STORAGE:
        return "存储空间不足，请清理设备空间";
      case ErrorType.UNKNOWN:
        return "发生了意外错误，我们已记录此问题";
      default:
        return "发生了意外错误，我们已记录此问题";
    }
  }
}

/**
 * 导出默认的 ErrorHandler 实例
 */
export const errorHandler = ErrorHandler.getInstance();

/**
 * 统一的错误判断工具函数
 */

/**
 * 判断是否为网络错误
 */
export const isNetworkError = (error: Error | unknown): boolean => {
  const message = (
    error instanceof Error ? error.message : String(error)
  ).toLowerCase();
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection") ||
    message.includes("timeout") ||
    message.includes("offline") ||
    message.includes("enotfound")
  );
};

/**
 * 判断是否为认证错误
 */
export const isAuthError = (error: Error | unknown): boolean => {
  const message = (
    error instanceof Error ? error.message : String(error)
  ).toLowerCase();
  return (
    message.includes("auth") ||
    message.includes("token") ||
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("401") ||
    message.includes("403")
  );
};

/**
 * 判断是否为验证错误
 */
export const isValidationError = (error: Error | unknown): boolean => {
  const message = (
    error instanceof Error ? error.message : String(error)
  ).toLowerCase();
  return (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("required") ||
    message.includes("format")
  );
};

/**
 * 判断是否为临时错误（可重试）
 */
export const isTemporaryError = (error: Error | unknown): boolean => {
  const message = (
    error instanceof Error ? error.message : String(error)
  ).toLowerCase();
  return (
    isNetworkError(error) ||
    message.includes("429") || // Rate limit
    message.includes("503") || // Service unavailable
    message.includes("504") // Gateway timeout
  );
};
