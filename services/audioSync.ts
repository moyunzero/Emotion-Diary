/**
 * 音频云端同步模块
 * 处理音频文件上传与待同步批量上传
 */

import {
  AUDIO_UPLOAD_MAX_ATTEMPTS,
  computeUploadRetryDelayMs,
  sleepMs,
} from "../shared/audio/uploadRetry";
import { extractAudiosObjectPath } from "../shared/audio/storagePath";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { AudioData } from "../types";
import { logger } from "@/utils/logger";

const AUDIO_BUCKET = "audios";
/** D-07: signed URL TTL ≈ 24h */
const SIGNED_URL_TTL_SEC = 60 * 60 * 24;

export interface PendingAudioUploadResult {
  success: number;
  failed: number;
  results: Map<string, string>;
  failedAudioIds: string[];
}

/**
 * 上传单个音频文件到云端。
 * 成功时 remoteUrl 为 Storage object path（非公有/签名 URL）— D-08/D-10。
 */
export const uploadAudio = async (
  audioData: AudioData,
  userId: string,
): Promise<{ success: boolean; remoteUrl?: string; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 未配置" };
  }

  if (!audioData.localUri) {
    return { success: false, error: "没有本地文件" };
  }

  const filePath = `${userId}/${audioData.id}.m4a`;

  try {
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(filePath, audioData.localUri, {
        contentType: "audio/m4a",
        upsert: true,
      });

    if (error) {
      logger.error("audioSync", "上传音频失败", error);
      return { success: false, error: error.message };
    }

    return { success: true, remoteUrl: filePath };
  } catch (error) {
    logger.error("audioSync", "上传音频异常", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
};

/**
 * Play-time：从持久化的 path / legacy public URL 解析 object path 并 mint 签名 URL。
 * 不把 signed URL 写回 entry（D-06）。
 */
export async function resolvePlayableRemoteUrl(
  stored: string,
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const objectPath = extractAudiosObjectPath(stored);
  if (!objectPath) {
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(objectPath, SIGNED_URL_TTL_SEC);

    if (error || !data?.signedUrl) {
      logger.warn("audioSync", "createSignedUrl 失败", error ?? undefined);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    logger.warn("audioSync", "createSignedUrl 异常", error);
    return null;
  }
}

/**
 * 单条音频：最多尝试 AUDIO_UPLOAD_MAX_ATTEMPTS 次，失败间指数退避。
 */
export async function uploadAudioWithRetry(
  audio: AudioData,
  userId: string,
  deps: {
    upload?: typeof uploadAudio;
    sleep?: (ms: number) => Promise<void>;
  } = {},
): Promise<{ success: true; remoteUrl: string } | { success: false }> {
  const upload = deps.upload ?? uploadAudio;
  const sleep = deps.sleep ?? sleepMs;

  for (let attempt = 0; attempt < AUDIO_UPLOAD_MAX_ATTEMPTS; attempt++) {
    const result = await upload(audio, userId);
    if (result.success && result.remoteUrl) {
      return { success: true, remoteUrl: result.remoteUrl };
    }
    if (attempt < AUDIO_UPLOAD_MAX_ATTEMPTS - 1) {
      await sleep(computeUploadRetryDelayMs(attempt));
    }
  }

  return { success: false };
}

/**
 * 批量上传待同步的音频文件（pending + failed，failed 在备份时自动重试）
 */
export const uploadPendingAudios = async (
  audios: AudioData[],
  userId: string,
): Promise<PendingAudioUploadResult> => {
  const results = new Map<string, string>();
  const failedAudioIds: string[] = [];
  let success = 0;
  let failed = 0;

  const pendingAudios = audios.filter(
    (a) =>
      (a.syncStatus === "pending" || a.syncStatus === "failed") && a.localUri,
  );

  for (const audio of pendingAudios) {
    const outcome = await uploadAudioWithRetry(audio, userId);
    if (outcome.success) {
      results.set(audio.id, outcome.remoteUrl);
      success++;
    } else {
      failed++;
      failedAudioIds.push(audio.id);
      logger.error(
        "audioSync",
        `音频上传失败，已重试 ${AUDIO_UPLOAD_MAX_ATTEMPTS} 次`,
        { audioId: audio.id },
      );
    }
  }

  return { success, failed, results, failedAudioIds };
};
