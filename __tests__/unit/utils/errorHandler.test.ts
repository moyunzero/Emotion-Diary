/**
 * 错误处理工具单元测试
 * 测试 ErrorType 枚举、AppError 类和 ErrorHandler 类的功能
 */

import { AppError, ErrorHandler, ErrorType } from '../../../utils/errorHandler';

describe('ErrorType 枚举', () => {
  it('应该定义所有必需的错误类型', () => {
    expect(ErrorType.NETWORK).toBe('NETWORK');
    expect(ErrorType.VALIDATION).toBe('VALIDATION');
    expect(ErrorType.AUTH).toBe('AUTH');
    expect(ErrorType.SYNC).toBe('SYNC');
    expect(ErrorType.AI).toBe('AI');
    expect(ErrorType.STORAGE).toBe('STORAGE');
    expect(ErrorType.UNKNOWN).toBe('UNKNOWN');
  });

  it('应该包含7种错误类型', () => {
    const errorTypes = Object.values(ErrorType);
    expect(errorTypes).toHaveLength(7);
  });
});

describe('AppError 类', () => {
  describe('构造函数', () => {
    it('应该正确创建基本的 AppError 实例', () => {
      const error = new AppError(
        ErrorType.NETWORK,
        '网络连接失败'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('AppError');
      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.message).toBe('网络连接失败');
      expect(error.recoverable).toBe(true); // 默认值
      expect(error.originalError).toBeUndefined();
    });

    it('应该支持设置 recoverable 为 false', () => {
      const error = new AppError(
        ErrorType.STORAGE,
        '存储空间不足',
        false
      );

      expect(error.recoverable).toBe(false);
    });

    it('应该保存原始错误对象', () => {
      const originalError = new Error('原始错误');
      const error = new AppError(
        ErrorType.SYNC,
        '同步失败',
        true,
        originalError
      );

      expect(error.originalError).toBe(originalError);
      expect(error.originalError?.message).toBe('原始错误');
    });

    it('应该为所有错误类型创建实例', () => {
      const errorTypes = Object.values(ErrorType);
      
      errorTypes.forEach(type => {
        const error = new AppError(type as ErrorType, `测试 ${type} 错误`);
        expect(error.type).toBe(type);
        expect(error.message).toBe(`测试 ${type} 错误`);
      });
    });
  });

  describe('getFullMessage 方法', () => {
    it('应该返回基本错误消息（无原始错误）', () => {
      const error = new AppError(
        ErrorType.VALIDATION,
        '数据验证失败'
      );

      expect(error.getFullMessage()).toBe('数据验证失败');
    });

    it('应该返回包含原始错误的完整消息', () => {
      const originalError = new Error('字段不能为空');
      const error = new AppError(
        ErrorType.VALIDATION,
        '数据验证失败',
        true,
        originalError
      );

      expect(error.getFullMessage()).toBe('数据验证失败 (原因: 字段不能为空)');
    });
  });

  describe('toJSON 方法', () => {
    it('应该正确序列化基本错误信息', () => {
      const error = new AppError(
        ErrorType.AUTH,
        '认证失败',
        false
      );

      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'AppError',
        type: ErrorType.AUTH,
        message: '认证失败',
        recoverable: false,
        originalError: undefined,
      });
      expect(json).toHaveProperty('stack');
    });

    it('应该正确序列化包含原始错误的信息', () => {
      const originalError = new Error('Token 过期');
      const error = new AppError(
        ErrorType.AUTH,
        '认证失败',
        true,
        originalError
      );

      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'AppError',
        type: ErrorType.AUTH,
        message: '认证失败',
        recoverable: true,
      });
      expect(json).toHaveProperty('originalError');
      
      const jsonObj = json as any;
      expect(jsonObj.originalError).toMatchObject({
        name: 'Error',
        message: 'Token 过期',
      });
      expect(jsonObj.originalError).toHaveProperty('stack');
    });
  });

  describe('错误类型特定场景', () => {
    it('应该创建网络错误（可恢复）', () => {
      const error = new AppError(
        ErrorType.NETWORK,
        '网络连接不可用，数据将在恢复后自动同步',
        true
      );

      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.recoverable).toBe(true);
    });

    it('应该创建验证错误（可恢复）', () => {
      const error = new AppError(
        ErrorType.VALIDATION,
        '请填写所有必填字段',
        true
      );

      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.recoverable).toBe(true);
    });

    it('应该创建认证错误（部分可恢复）', () => {
      const recoverableAuthError = new AppError(
        ErrorType.AUTH,
        '会话已过期，正在刷新...',
        true
      );

      const unrecoverableAuthError = new AppError(
        ErrorType.AUTH,
        '认证失败，请重新登录',
        false
      );

      expect(recoverableAuthError.recoverable).toBe(true);
      expect(unrecoverableAuthError.recoverable).toBe(false);
    });

    it('应该创建同步错误（可恢复）', () => {
      const error = new AppError(
        ErrorType.SYNC,
        '同步失败，将自动重试',
        true
      );

      expect(error.type).toBe(ErrorType.SYNC);
      expect(error.recoverable).toBe(true);
    });

    it('应该创建AI服务错误（可恢复）', () => {
      const error = new AppError(
        ErrorType.AI,
        'AI服务暂时不可用，显示历史分析',
        true
      );

      expect(error.type).toBe(ErrorType.AI);
      expect(error.recoverable).toBe(true);
    });

    it('应该创建存储错误（不可恢复）', () => {
      const error = new AppError(
        ErrorType.STORAGE,
        '存储空间不足，请清理设备空间',
        false
      );

      expect(error.type).toBe(ErrorType.STORAGE);
      expect(error.recoverable).toBe(false);
    });

    it('应该创建未知错误（不可恢复）', () => {
      const error = new AppError(
        ErrorType.UNKNOWN,
        '发生了意外错误，我们已记录此问题',
        false
      );

      expect(error.type).toBe(ErrorType.UNKNOWN);
      expect(error.recoverable).toBe(false);
    });
  });

  describe('错误继承和类型检查', () => {
    it('应该是 Error 的实例', () => {
      const error = new AppError(ErrorType.NETWORK, '测试错误');
      expect(error instanceof Error).toBe(true);
    });

    it('应该是 AppError 的实例', () => {
      const error = new AppError(ErrorType.NETWORK, '测试错误');
      expect(error instanceof AppError).toBe(true);
    });

    it('应该可以被 try-catch 捕获', () => {
      expect(() => {
        throw new AppError(ErrorType.NETWORK, '测试错误');
      }).toThrow(AppError);

      expect(() => {
        throw new AppError(ErrorType.NETWORK, '测试错误');
      }).toThrow('测试错误');
    });

    it('应该可以区分 AppError 和普通 Error', () => {
      const appError = new AppError(ErrorType.NETWORK, 'AppError');
      const normalError = new Error('Normal Error');

      expect(appError instanceof AppError).toBe(true);
      expect(normalError instanceof AppError).toBe(false);
      expect(appError instanceof Error).toBe(true);
      expect(normalError instanceof Error).toBe(true);
    });
  });

  describe('边界情况', () => {
    it('应该处理空消息', () => {
      const error = new AppError(ErrorType.UNKNOWN, '');
      expect(error.message).toBe('');
      expect(error.getFullMessage()).toBe('');
    });

    it('应该处理很长的错误消息', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new AppError(ErrorType.UNKNOWN, longMessage);
      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(1000);
    });

    it('应该处理包含特殊字符的消息', () => {
      const specialMessage = '错误：网络连接失败！@#$%^&*()';
      const error = new AppError(ErrorType.NETWORK, specialMessage);
      expect(error.message).toBe(specialMessage);
    });

    it('应该处理原始错误为 undefined', () => {
      const error = new AppError(
        ErrorType.NETWORK,
        '测试错误',
        true,
        undefined
      );
      expect(error.originalError).toBeUndefined();
      expect(error.getFullMessage()).toBe('测试错误');
    });
  });
});


describe('ErrorHandler 类', () => {
  let errorHandler: ErrorHandler;
  let offlineModeCallback: jest.Mock;
  let queueOperationCallback: jest.Mock;
  let notifyUserCallback: jest.Mock;

  beforeEach(() => {
    // 获取 ErrorHandler 实例
    errorHandler = ErrorHandler.getInstance();

    // 创建 mock 回调函数
    offlineModeCallback = jest.fn();
    queueOperationCallback = jest.fn();
    notifyUserCallback = jest.fn();

    // 设置回调
    errorHandler.setOfflineModeCallback(offlineModeCallback);
    errorHandler.setQueueOperationCallback(queueOperationCallback);
    errorHandler.setNotifyUserCallback(notifyUserCallback);

    // 清除所有 mock 调用记录
    jest.clearAllMocks();
  });

  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = ErrorHandler.getInstance();
      const instance2 = ErrorHandler.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('回调设置', () => {
    it('应该正确设置离线模式回调', () => {
      const callback = jest.fn();
      errorHandler.setOfflineModeCallback(callback);
      // 回调设置成功，无需额外验证
      expect(callback).not.toHaveBeenCalled();
    });

    it('应该正确设置队列操作回调', () => {
      const callback = jest.fn();
      errorHandler.setQueueOperationCallback(callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it('应该正确设置用户通知回调', () => {
      const callback = jest.fn();
      errorHandler.setNotifyUserCallback(callback);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('handle 方法 - 错误规范化', () => {
    it('应该处理 AppError 实例', () => {
      const appError = new AppError(ErrorType.NETWORK, '网络错误');
      errorHandler.handle(appError, 'TestContext');

      expect(notifyUserCallback).toHaveBeenCalledWith(
        '网络错误',
        ErrorType.NETWORK
      );
    });

    it('应该将网络相关错误规范化为 NETWORK 类型', () => {
      const errors = [
        new Error('network connection failed'),
        new Error('fetch error occurred'),
        new Error('connection timeout'),
        new Error('offline mode'),
      ];

      errors.forEach(error => {
        jest.clearAllMocks();
        errorHandler.handle(error, 'TestContext');
        expect(notifyUserCallback).toHaveBeenCalledWith(
          expect.stringContaining('网络'),
          ErrorType.NETWORK
        );
      });
    });

    it('应该将认证相关错误规范化为 AUTH 类型', () => {
      const errors = [
        new Error('authentication failed'),
        new Error('token expired'),
        new Error('unauthorized access'),
        new Error('403 forbidden'),
        new Error('401 error'),
      ];

      errors.forEach(error => {
        jest.clearAllMocks();
        errorHandler.handle(error, 'TestContext');
        expect(notifyUserCallback).toHaveBeenCalledWith(
          expect.stringContaining('认证'),
          ErrorType.AUTH
        );
      });
    });

    it('应该将验证相关错误规范化为 VALIDATION 类型', () => {
      const errors = [
        new Error('validation failed'),
        new Error('invalid input'),
        new Error('required field missing'),
        new Error('format error'),
      ];

      errors.forEach(error => {
        jest.clearAllMocks();
        errorHandler.handle(error, 'TestContext');
        expect(notifyUserCallback).toHaveBeenCalledWith(
          error.message,
          ErrorType.VALIDATION
        );
      });
    });

    it('应该将同步相关错误规范化为 SYNC 类型', () => {
      const errors = [
        new Error('sync failed'),
        new Error('conflict detected'),
      ];

      errors.forEach(error => {
        jest.clearAllMocks();
        errorHandler.handle(error, 'TestContext');
        expect(notifyUserCallback).toHaveBeenCalledWith(
          expect.stringContaining('同步'),
          ErrorType.SYNC
        );
      });
    });

    it('应该将AI相关错误规范化为 AI 类型', () => {
      const errors = [
        new Error('AI service error'),
        new Error('groq api failed'),
        new Error('model prediction error'),
      ];

      errors.forEach(error => {
        jest.clearAllMocks();
        errorHandler.handle(error, 'TestContext');
        expect(notifyUserCallback).toHaveBeenCalledWith(
          expect.stringContaining('AI'),
          ErrorType.AI
        );
      });
    });

    it('应该将存储相关错误规范化为 STORAGE 类型', () => {
      const errors = [
        new Error('storage quota exceeded'),
        new Error('disk space full'),
        new Error('storage error'),
      ];

      errors.forEach(error => {
        jest.clearAllMocks();
        errorHandler.handle(error, 'TestContext');
        expect(notifyUserCallback).toHaveBeenCalledWith(
          expect.stringContaining('存储'),
          ErrorType.STORAGE
        );
      });
    });

    it('应该将未知错误规范化为 UNKNOWN 类型', () => {
      const errors = [
        new Error('some random error'),
        new Error(''),
        'string error',
        { message: 'object error' },
        null,
        undefined,
      ];

      errors.forEach(error => {
        jest.clearAllMocks();
        errorHandler.handle(error as any, 'TestContext');
        expect(notifyUserCallback).toHaveBeenCalledWith(
          expect.stringContaining('意外错误'),
          ErrorType.UNKNOWN
        );
      });
    });
  });

  describe('handle 方法 - 错误恢复', () => {
    it('应该为网络错误切换到离线模式', () => {
      const error = new Error('network connection failed');
      errorHandler.handle(error, 'TestContext');

      expect(offlineModeCallback).toHaveBeenCalled();
      expect(queueOperationCallback).not.toHaveBeenCalled();
    });

    it('应该为同步错误将操作加入队列', () => {
      const error = new Error('sync failed');
      errorHandler.handle(error, 'TestContext');

      expect(queueOperationCallback).toHaveBeenCalledWith('TestContext');
      expect(offlineModeCallback).not.toHaveBeenCalled();
    });

    it('应该为AI错误不执行特殊恢复', () => {
      const error = new Error('AI service error');
      errorHandler.handle(error, 'TestContext');

      expect(offlineModeCallback).not.toHaveBeenCalled();
      expect(queueOperationCallback).not.toHaveBeenCalled();
    });

    it('应该为验证错误不执行自动恢复', () => {
      const error = new Error('validation failed');
      errorHandler.handle(error, 'TestContext');

      expect(offlineModeCallback).not.toHaveBeenCalled();
      expect(queueOperationCallback).not.toHaveBeenCalled();
    });

    it('应该为不可恢复的错误不尝试恢复', () => {
      const error = new AppError(ErrorType.STORAGE, '存储错误', false);
      errorHandler.handle(error, 'TestContext');

      expect(offlineModeCallback).not.toHaveBeenCalled();
      expect(queueOperationCallback).not.toHaveBeenCalled();
    });
  });

  describe('handle 方法 - 用户通知', () => {
    it('应该为所有错误调用用户通知回调', () => {
      const errors = [
        new Error('network error'),
        new Error('validation error'),
        new Error('auth error'),
        new Error('sync error'),
        new Error('AI error'),
        new Error('storage error'),
        new Error('unknown error'),
      ];

      errors.forEach(error => {
        jest.clearAllMocks();
        errorHandler.handle(error, 'TestContext');
        expect(notifyUserCallback).toHaveBeenCalled();
      });
    });

    it('应该传递正确的错误类型给通知回调', () => {
      const testCases = [
        { error: new Error('network error'), expectedType: ErrorType.NETWORK },
        { error: new Error('validation error'), expectedType: ErrorType.VALIDATION },
        { error: new Error('auth error'), expectedType: ErrorType.AUTH },
        { error: new Error('sync error'), expectedType: ErrorType.SYNC },
        { error: new Error('AI error'), expectedType: ErrorType.AI },
        { error: new Error('storage error'), expectedType: ErrorType.STORAGE },
      ];

      testCases.forEach(({ error, expectedType }) => {
        jest.clearAllMocks();
        errorHandler.handle(error, 'TestContext');
        expect(notifyUserCallback).toHaveBeenCalledWith(
          expect.any(String),
          expectedType
        );
      });
    });

    it('应该使用 AppError 的消息作为用户消息', () => {
      const customMessage = '自定义用户友好消息';
      const error = new AppError(ErrorType.NETWORK, customMessage);
      errorHandler.handle(error, 'TestContext');

      expect(notifyUserCallback).toHaveBeenCalledWith(
        customMessage,
        ErrorType.NETWORK
      );
    });
  });

  describe('handle 方法 - 完整流程', () => {
    it('应该执行完整的错误处理流程', () => {
      const error = new Error('network connection failed');
      errorHandler.handle(error, 'UserService.login');

      // 1. 错误被规范化（通过通知回调验证）
      expect(notifyUserCallback).toHaveBeenCalled();

      // 2. 错误被记录（无法直接验证，但不应抛出错误）

      // 3. 尝试恢复（网络错误应切换到离线模式）
      expect(offlineModeCallback).toHaveBeenCalled();

      // 4. 通知用户
      expect(notifyUserCallback).toHaveBeenCalledWith(
        expect.stringContaining('网络'),
        ErrorType.NETWORK
      );
    });

    it('应该处理多个连续的错误', () => {
      const errors = [
        new Error('network error'),
        new Error('sync error'),
        new Error('validation error'),
      ];

      errors.forEach((error, index) => {
        jest.clearAllMocks();
        errorHandler.handle(error, `Context${index}`);
        expect(notifyUserCallback).toHaveBeenCalled();
      });
    });
  });

  describe('边界情况', () => {
    it('应该处理没有设置回调的情况', () => {
      const newHandler = ErrorHandler.getInstance();
      // 不设置任何回调

      expect(() => {
        newHandler.handle(new Error('test error'), 'TestContext');
      }).not.toThrow();
    });

    it('应该处理空错误消息', () => {
      const error = new Error('');
      errorHandler.handle(error, 'TestContext');

      expect(notifyUserCallback).toHaveBeenCalled();
    });

    it('应该处理非常长的错误消息', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new Error(longMessage);
      errorHandler.handle(error, 'TestContext');

      expect(notifyUserCallback).toHaveBeenCalled();
    });

    it('应该处理包含特殊字符的错误消息', () => {
      const specialMessage = 'Error: 网络连接失败！@#$%^&*()';
      const error = new Error(specialMessage);
      errorHandler.handle(error, 'TestContext');

      expect(notifyUserCallback).toHaveBeenCalled();
    });

    it('应该处理嵌套的错误对象', () => {
      const originalError = new Error('原始错误');
      const wrappedError = new AppError(
        ErrorType.NETWORK,
        '包装错误',
        true,
        originalError
      );
      errorHandler.handle(wrappedError, 'TestContext');

      expect(notifyUserCallback).toHaveBeenCalledWith(
        '包装错误',
        ErrorType.NETWORK
      );
    });
  });

  describe('用户友好消息生成', () => {
    it('应该为每种错误类型生成正确的默认消息', () => {
      const testCases = [
        { type: ErrorType.NETWORK, expectedMessage: '网络连接不可用' },
        { type: ErrorType.VALIDATION, expectedMessage: '请检查输入的数据' },
        { type: ErrorType.AUTH, expectedMessage: '会话已过期' },
        { type: ErrorType.SYNC, expectedMessage: '同步失败' },
        { type: ErrorType.AI, expectedMessage: 'AI服务暂时不可用' },
        { type: ErrorType.STORAGE, expectedMessage: '存储空间不足' },
        { type: ErrorType.UNKNOWN, expectedMessage: '发生了意外错误' },
      ];

      testCases.forEach(({ type, expectedMessage }) => {
        jest.clearAllMocks();
        const error = new AppError(type, `Error: ${type}`);
        errorHandler.handle(error, 'TestContext');

        expect(notifyUserCallback).toHaveBeenCalledWith(
          expect.stringContaining(expectedMessage),
          type
        );
      });
    });
  });
});
