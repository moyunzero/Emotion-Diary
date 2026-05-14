/**
 * errorHandler.test.ts
 * 覆盖 utils/errorHandler.ts 的纯工具函数（B-1 第三档 / 重试分类基线）：
 * - isNetworkError / isAuthError / isValidationError / isTemporaryError
 * - 这些函数是 aiService、syncToCloud 等模块判断「能否重试 / 是否需要重新登录」的依据，
 *   分类失误会直接导致死循环重试或丢弃可恢复请求，所以单独锁定回归。
 *
 * 注意：此文件只测试已 export 的"纯字符串匹配"工具函数，
 * 不触碰 ErrorHandler 单例（涉及动态 import logger，更适合集成测试覆盖）。
 */

import {
  isAuthError,
  isNetworkError,
  isTemporaryError,
  isValidationError,
} from '../../../utils/errorHandler';

describe('isNetworkError', () => {
  it.each([
    'Network request failed',
    'fetch failed',
    'connection reset',
    'timeout exceeded',
    'device is offline',
    'ENOTFOUND example.com',
  ])('识别为网络错误：%s', (msg) => {
    expect(isNetworkError(new Error(msg))).toBe(true);
  });

  it.each([
    'invalid input',
    'unauthorized',
    'syntax error',
  ])('非网络错误不误判：%s', (msg) => {
    expect(isNetworkError(new Error(msg))).toBe(false);
  });

  it('忽略大小写（关键字小写化）', () => {
    expect(isNetworkError(new Error('NETWORK ERROR'))).toBe(true);
    expect(isNetworkError(new Error('Connection Refused'))).toBe(true);
  });

  it('非 Error 类型也能识别（如 string）', () => {
    expect(isNetworkError('network failed')).toBe(true);
    expect(isNetworkError('plain string')).toBe(false);
  });

  it('null / undefined 不报错也不误判', () => {
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});

describe('isAuthError', () => {
  it.each([
    'auth failed',
    'invalid token',
    'unauthorized access',
    'forbidden',
    'HTTP 401 Unauthorized',
    'HTTP 403 Forbidden',
  ])('识别为认证错误：%s', (msg) => {
    expect(isAuthError(new Error(msg))).toBe(true);
  });

  it.each(['network failed', 'validation error', 'random text'])(
    '非认证错误不误判：%s',
    (msg) => {
      expect(isAuthError(new Error(msg))).toBe(false);
    },
  );

  it('忽略大小写', () => {
    expect(isAuthError(new Error('TOKEN EXPIRED'))).toBe(true);
    expect(isAuthError(new Error('UNAUTHORIZED'))).toBe(true);
  });
});

describe('isValidationError', () => {
  it.each([
    'validation failed',
    'invalid email',
    'name is required',
    'unsupported format',
  ])('识别为验证错误：%s', (msg) => {
    expect(isValidationError(new Error(msg))).toBe(true);
  });

  it.each(['network down', 'auth failed', 'unrelated'])(
    '非验证错误不误判：%s',
    (msg) => {
      expect(isValidationError(new Error(msg))).toBe(false);
    },
  );
});

describe('isTemporaryError (重试分类的核心基线)', () => {
  it('网络错误属于临时错误（应被重试）', () => {
    expect(isTemporaryError(new Error('network failed'))).toBe(true);
    expect(isTemporaryError(new Error('timeout'))).toBe(true);
  });

  it('429 限流属于临时错误', () => {
    expect(isTemporaryError(new Error('HTTP 429 Too Many Requests'))).toBe(
      true,
    );
  });

  it('503 服务不可用属于临时错误', () => {
    expect(isTemporaryError(new Error('HTTP 503 Service Unavailable'))).toBe(
      true,
    );
  });

  it('504 网关超时属于临时错误', () => {
    expect(isTemporaryError(new Error('HTTP 504 Gateway Timeout'))).toBe(true);
  });

  it('认证错误不是临时错误（不应重试，防死循环）', () => {
    expect(isTemporaryError(new Error('401 Unauthorized'))).toBe(false);
  });

  it('验证错误不是临时错误（用户需要修正输入）', () => {
    expect(isTemporaryError(new Error('invalid email format'))).toBe(false);
  });

  it('500 / 400 不被识别为可重试（关键负面回归）', () => {
    expect(isTemporaryError(new Error('HTTP 500 Internal Server Error'))).toBe(
      false,
    );
    expect(isTemporaryError(new Error('HTTP 400 Bad Request'))).toBe(false);
  });
});
