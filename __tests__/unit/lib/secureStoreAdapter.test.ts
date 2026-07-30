/**
 * SecureStore adapter setItem retry + persist-failure handler (SEC-03 / D-15..D-18)
 */

const mockSleep = jest.fn(async (_ms: number) => {});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  registerSecureStorePersistFailureHandler,
  runSecureStoreSetItemWithRetry,
  SECURE_STORE_SET_MAX_ATTEMPTS,
} from '@/lib/supabase';

describe('runSecureStoreSetItemWithRetry (SEC-03)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    registerSecureStorePersistFailureHandler(null);
  });

  it('succeeds first try → no handler', async () => {
    const handler = jest.fn();
    registerSecureStorePersistFailureHandler(handler);
    const write = jest.fn().mockResolvedValue(undefined);

    const result = await runSecureStoreSetItemWithRetry(write, {
      sleep: mockSleep,
    });

    expect(result).toBe('ok');
    expect(write).toHaveBeenCalledTimes(1);
    expect(handler).not.toHaveBeenCalled();
    expect(mockSleep).not.toHaveBeenCalled();
  });

  it('fails then succeeds on retry → no handler', async () => {
    const handler = jest.fn();
    registerSecureStorePersistFailureHandler(handler);
    const write = jest
      .fn()
      .mockRejectedValueOnce(new Error('full'))
      .mockResolvedValueOnce(undefined);

    const result = await runSecureStoreSetItemWithRetry(write, {
      sleep: mockSleep,
    });

    expect(result).toBe('ok');
    expect(write).toHaveBeenCalledTimes(2);
    expect(mockSleep).toHaveBeenCalledTimes(1);
    expect(handler).not.toHaveBeenCalled();
  });

  it('fails all attempts → invokes registered handler exactly once', async () => {
    const handler = jest.fn();
    registerSecureStorePersistFailureHandler(handler);
    const write = jest.fn().mockRejectedValue(new Error('full'));

    const result = await runSecureStoreSetItemWithRetry(write, {
      sleep: mockSleep,
    });

    expect(result).toBe('failed');
    expect(write).toHaveBeenCalledTimes(SECURE_STORE_SET_MAX_ATTEMPTS);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
