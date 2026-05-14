/**
 * playback.test.ts
 * 覆盖 shared/audio/playback.ts 的核心决策（H6 回归点）：
 * - 跨设备同步场景：云端拉下来的 localUri 在本机不存在 → 降级 remoteUrl
 * - 模拟器重装：localUri 失效 → 降级 remoteUrl
 * - 本地新建条目：localUri 真实可读 → 用 localUri（不发起网络请求）
 * - 存在性检查抛错：视作不存在，不抛传到上层
 * - 两者皆空：返回 null
 */

import { resolveAudioSource } from '../../../../shared/audio/playback';

describe('resolveAudioSource (H6 回归)', () => {
  it('localUri 存在时优先返回 localUri，避免不必要的网络请求', async () => {
    const checkLocalExists = jest.fn(async () => true);
    const uri = await resolveAudioSource(
      { localUri: 'file:///local/abc.m4a', remoteUrl: 'https://cdn/abc.m4a' },
      checkLocalExists,
    );

    expect(uri).toBe('file:///local/abc.m4a');
    expect(checkLocalExists).toHaveBeenCalledWith('file:///local/abc.m4a');
  });

  it('localUri 不存在时降级到 remoteUrl（核心回归：跨设备同步场景）', async () => {
    const checkLocalExists = jest.fn(async () => false);
    const uri = await resolveAudioSource(
      { localUri: 'file:///stale/from-other-device.m4a', remoteUrl: 'https://cdn/abc.m4a' },
      checkLocalExists,
    );

    expect(uri).toBe('https://cdn/abc.m4a');
  });

  it('存在性检查抛错时视作不存在，不抛传到上层', async () => {
    const checkLocalExists = jest.fn(async () => {
      throw new Error('permission denied');
    });

    await expect(
      resolveAudioSource(
        { localUri: 'file:///inaccessible.m4a', remoteUrl: 'https://cdn/abc.m4a' },
        checkLocalExists,
      ),
    ).resolves.toBe('https://cdn/abc.m4a');
  });

  it('localUri 缺失且 remoteUrl 存在时直接返回 remoteUrl（不调用存在性检查）', async () => {
    const checkLocalExists = jest.fn(async () => true);
    const uri = await resolveAudioSource(
      { remoteUrl: 'https://cdn/abc.m4a' },
      checkLocalExists,
    );

    expect(uri).toBe('https://cdn/abc.m4a');
    expect(checkLocalExists).not.toHaveBeenCalled();
  });

  it('localUri 为空字符串时按缺失处理', async () => {
    const checkLocalExists = jest.fn(async () => true);
    const uri = await resolveAudioSource(
      { localUri: '', remoteUrl: 'https://cdn/abc.m4a' },
      checkLocalExists,
    );

    expect(uri).toBe('https://cdn/abc.m4a');
    expect(checkLocalExists).not.toHaveBeenCalled();
  });

  it('localUri 存在但 remoteUrl 缺失：返回 localUri', async () => {
    const checkLocalExists = jest.fn(async () => true);
    const uri = await resolveAudioSource(
      { localUri: 'file:///local/abc.m4a' },
      checkLocalExists,
    );

    expect(uri).toBe('file:///local/abc.m4a');
  });

  it('两者皆空时返回 null（UI 应弹"播放失败"）', async () => {
    const uri = await resolveAudioSource({}, async () => true);
    expect(uri).toBeNull();
  });

  it('remoteUrl 为 null 时按缺失处理', async () => {
    const uri = await resolveAudioSource(
      { localUri: '', remoteUrl: null },
      async () => true,
    );
    expect(uri).toBeNull();
  });

  it('localUri 不存在且 remoteUrl 缺失：返回 null', async () => {
    const checkLocalExists = jest.fn(async () => false);
    const uri = await resolveAudioSource(
      { localUri: 'file:///stale.m4a' },
      checkLocalExists,
    );
    expect(uri).toBeNull();
  });
});
