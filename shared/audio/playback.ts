/**
 * 决定播放某条音频时实际使用哪个 URI。
 *
 * 背景（H6 回归点）：跨设备同步场景下，audio.localUri 仍是源设备的沙盒路径，
 * 在本机文件系统中不存在；模拟器重新安装也会让旧的 localUri 失效。
 * 必须先确认 localUri 真实可读，否则会被错误命中，导致 createAudioPlayer
 * 静默失败（既不抛错也不出声）。
 *
 * 纯逻辑函数：不直接依赖 expo-file-system，文件存在性检查通过回调注入，
 * 便于在 Node 测试环境单测。
 *
 * @param audio          只读取 localUri / remoteUrl，不假设其他字段
 * @param checkLocalExists 检查本地文件是否存在的异步回调；抛错视作"不存在"
 * @returns 实际可播放的 URI；都不可用时返回 null
 */
export async function resolveAudioSource(
  audio: { localUri?: string; remoteUrl?: string | null },
  checkLocalExists: (uri: string) => Promise<boolean>,
): Promise<string | null> {
  if (audio.localUri) {
    try {
      if (await checkLocalExists(audio.localUri)) {
        return audio.localUri;
      }
    } catch {
      // 任何检查失败一律降级到 remoteUrl，避免把内部错误暴露给播放器
    }
  }
  return audio.remoteUrl || null;
}
