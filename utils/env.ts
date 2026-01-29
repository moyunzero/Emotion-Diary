/**
 * 环境工具模块
 * 提供统一的环境检测功能
 */

/**
 * 检查是否在开发环境
 */
export const isDevelopment = (): boolean => {
  try {
    return typeof __DEV__ !== 'undefined' && __DEV__;
  } catch {
    return process.env.NODE_ENV === 'development';
  }
};

/**
 * 检查是否在生产环境
 */
export const isProduction = (): boolean => !isDevelopment();

/**
 * 检查是否在测试环境
 */
export const isTest = (): boolean => {
  try {
    return process.env.NODE_ENV === 'test';
  } catch {
    return false;
  }
};
