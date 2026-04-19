/**
 * 音频存储工具
 * 处理音频文件的本地存储、哈希计算和删除
 */

import { AudioData } from "../types";

/**
 * 计算文件的简单哈希值
 * 用于去重和完整性校验
 * 
 * @param input 任意字符串输入
 * @returns 简化的哈希字符串
 */
export const computeFileHash = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
};

/**
 * 根据音频数据生成唯一的哈希标识
 * 用于检测重复音频
 */
export const generateAudioHash = (audioData: AudioData): string => {
  const input = `${audioData.id}-${audioData.duration}-${audioData.createdAt}`;
  return computeFileHash(input);
};

/**
 * 获取音频文件的基础信息（从 AudioData 推断）
 */
export const getAudioInfo = (
  audioData: AudioData
): { estimatedSizeMB: number; hash: string } => {
  const durationMinutes = audioData.duration / 60;
  const estimatedSizeMB = durationMinutes * 0.5;
  
  return {
    estimatedSizeMB,
    hash: audioData.fileHash || generateAudioHash(audioData),
  };
};

/**
 * 验证音频数据完整性
 */
export const validateAudioData = (audioData: AudioData): boolean => {
  if (!audioData.id) return false;
  if (!audioData.localUri && !audioData.remoteUrl) return false;
  if (audioData.duration <= 0) return false;
  return true;
};

/**
 * 获取播放优先级
 * 本地文件优先于远程URL
 */
export const getPlaybackUri = (audioData: AudioData): string | null => {
  return audioData.localUri || audioData.remoteUrl || null;
};

/**
 * 检查音频是否可播放
 */
export const isAudioPlayable = (audioData: AudioData): boolean => {
  return !!(audioData.localUri || audioData.remoteUrl);
};
