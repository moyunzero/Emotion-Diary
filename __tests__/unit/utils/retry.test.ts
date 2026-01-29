/**
 * 重试机制测试
 */

import { isNetworkError, isTemporaryError, withExponentialBackoff } from '../../../utils/retry';

describe('retry utils', () => {
  describe('withExponentialBackoff', () => {
    it('should succeed on first try', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await withExponentialBackoff(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const result = await withExponentialBackoff(fn, { maxRetries: 2, initialDelay: 10 });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(
        withExponentialBackoff(fn, { maxRetries: 3, initialDelay: 10 })
      ).rejects.toThrow('Network error');
      
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry if shouldRetry returns false', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Auth error'));
      
      await expect(
        withExponentialBackoff(fn, {
          maxRetries: 3,
          initialDelay: 10,
          shouldRetry: () => false,
        })
      ).rejects.toThrow('Auth error');
      
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('isNetworkError', () => {
    it('should identify network errors', () => {
      expect(isNetworkError(new Error('Network request failed'))).toBe(true);
      expect(isNetworkError(new Error('fetch failed'))).toBe(true);
      expect(isNetworkError(new Error('Connection timeout'))).toBe(true);
      expect(isNetworkError(new Error('ENOTFOUND'))).toBe(true);
    });

    it('should not identify non-network errors', () => {
      expect(isNetworkError(new Error('Invalid input'))).toBe(false);
      expect(isNetworkError(new Error('Auth failed'))).toBe(false);
    });
  });

  describe('isTemporaryError', () => {
    it('should identify temporary errors', () => {
      expect(isTemporaryError(new Error('Network error'))).toBe(true);
      expect(isTemporaryError(new Error('429 Too Many Requests'))).toBe(true);
      expect(isTemporaryError(new Error('503 Service Unavailable'))).toBe(true);
    });

    it('should not identify permanent errors', () => {
      expect(isTemporaryError(new Error('401 Unauthorized'))).toBe(false);
      expect(isTemporaryError(new Error('Invalid input'))).toBe(false);
    });
  });
});
