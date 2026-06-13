import type { AudioData, MoodEntry } from '../../types';

/**
 * 同步过程中需要回写到云端 entries 表的 payload。
 * audios 数组是新版本（已写入 remoteUrl 并标记 syncStatus = 'synced'）。
 */
export interface AudioRemoteUrlWriteback {
  id: string;
  audios: AudioData[];
}

export interface ApplyRemoteUrlsResult {
  /** 完整的新 entries 列表；未改动的 entry 保持原引用以利于 React/zustand 浅比较 */
  updatedEntries: MoodEntry[];
  /** 需要把新 audios 数组回写云端 entries 表的 payload；空数组表示无需回写 */
  writeback: AudioRemoteUrlWriteback[];
}

/**
 * 把"audioId → remoteUrl"映射应用到 entries 列表上（H7 回归点）。
 *
 * 背景：syncToCloud 上传音频文件后必须把得到的 remoteUrl 回写到云端 entries 表，
 * 否则其他设备 recoverFromCloud 拿到的 audios.remoteUrl 始终是 null，
 * 即使本地降级播放（resolveAudioSource）逻辑正确也无源可降。
 *
 * 行为：
 * - 对每条 audio，如果 map 中存在对应 remoteUrl，则把它写入并标记 syncStatus = 'synced'
 * - 任一 audio 被改动的 entry 会进入 writeback 列表
 * - 未改动的 entry 保持原引用，便于上层进行浅相等优化
 *
 * 纯函数：不依赖 React Native / Supabase / 网络，完全可单测。
 */
export function applyRemoteUrlsToEntries(
  entries: MoodEntry[],
  remoteUrlMap: Map<string, string>,
): ApplyRemoteUrlsResult {
  return applyAudioUploadResults(entries, remoteUrlMap, new Set());
}

/**
 * 应用批量上传结果：成功写入 remoteUrl + synced；失败标记 failed。
 */
export function applyAudioUploadResults(
  entries: MoodEntry[],
  remoteUrlMap: Map<string, string>,
  failedAudioIds: ReadonlySet<string>,
): ApplyRemoteUrlsResult {
  if (remoteUrlMap.size === 0 && failedAudioIds.size === 0) {
    return { updatedEntries: entries, writeback: [] };
  }

  const writeback: AudioRemoteUrlWriteback[] = [];
  const updatedEntries = entries.map((entry) => {
    if (!entry.audios?.length) return entry;

    let changed = false;
    const updatedAudios = entry.audios.map((audio) => {
      const remoteUrl = remoteUrlMap.get(audio.id);
      if (remoteUrl) {
        changed = true;
        return { ...audio, remoteUrl, syncStatus: 'synced' as const };
      }
      if (failedAudioIds.has(audio.id)) {
        changed = true;
        return { ...audio, syncStatus: 'failed' as const };
      }
      return audio;
    });

    if (!changed) return entry;

    writeback.push({ id: entry.id, audios: updatedAudios });
    return { ...entry, audios: updatedAudios };
  });

  return { updatedEntries, writeback };
}
