/**
 * 音频云端同步模块
 * 处理音频文件的上传、下载和同步状态管理
 */

import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { AudioData } from "../types";

const AUDIO_BUCKET = "audios";
const MAX_RETRY_COUNT = 3;

/**
 * 上传单个音频文件到云端
 */
export const uploadAudio = async (
  audioData: AudioData,
  userId: string
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
      console.error("上传音频失败:", error);
      return { success: false, error: error.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(filePath);

    return { success: true, remoteUrl: publicUrl };
  } catch (error) {
    console.error("上传音频异常:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
};

/**
 * 批量上传待同步的音频文件
 */
export const uploadPendingAudios = async (
  audios: AudioData[],
  userId: string
): Promise<{ success: number; failed: number; results: Map<string, string> }> => {
  const results = new Map<string, string>();
  let success = 0;
  let failed = 0;

  const pendingAudios = audios.filter(
    (a) => a.syncStatus === "pending" && a.localUri
  );

  for (const audio of pendingAudios) {
    let retries = 0;
    let uploaded = false;

    while (retries < MAX_RETRY_COUNT && !uploaded) {
      const result = await uploadAudio(audio, userId);

      if (result.success && result.remoteUrl) {
        results.set(audio.id, result.remoteUrl);
        success++;
        uploaded = true;
      } else {
        retries++;
        if (retries >= MAX_RETRY_COUNT) {
          failed++;
          console.error(`音频 ${audio.id} 上传失败，已重试 ${MAX_RETRY_COUNT} 次`);
        }
      }
    }
  }

  return { success, failed, results };
};

/**
 * 下载云端音频文件到本地
 */
export const downloadAudio = async (
  audioData: AudioData,
  userId: string
): Promise<{ success: boolean; localPath?: string; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 未配置" };
  }

  if (!audioData.remoteUrl) {
    return { success: false, error: "没有远程URL" };
  }

  const filePath = `${userId}/${audioData.id}.m4a`;

  try {
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .download(filePath);

    if (error) {
      console.error("下载音频失败:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("下载音频异常:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
};

/**
 * 删除云端音频文件
 */
export const deleteCloudAudio = async (
  audioId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase 未配置" };
  }

  const filePath = `${userId}/${audioId}.m4a`;

  try {
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("删除云端音频失败:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("删除云端音频异常:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
};

/**
 * 批量删除云端音频文件
 */
export const deleteMultipleCloudAudios = async (
  audioIds: string[],
  userId: string
): Promise<{ success: number; failed: number }> => {
  const filePaths = audioIds.map((id) => `${userId}/${id}.m4a`);

  try {
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .remove(filePaths);

    if (error) {
      console.error("批量删除云端音频失败:", error);
      return { success: 0, failed: audioIds.length };
    }

    return { success: audioIds.length, failed: 0 };
  } catch (error) {
    console.error("批量删除云端音频异常:", error);
    return { success: 0, failed: audioIds.length };
  }
};

/**
 * 获取云端音频的公开 URL
 */
export const getCloudAudioUrl = (
  audioId: string,
  userId: string
): string | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const filePath = `${userId}/${audioId}.m4a`;
  const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * 检查云端音频是否存在
 */
export const checkCloudAudioExists = async (
  audioId: string,
  userId: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const filePath = `${userId}/${audioId}.m4a`;

  try {
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .download(filePath);

    return !error && !!data;
  } catch {
    return false;
  }
};
