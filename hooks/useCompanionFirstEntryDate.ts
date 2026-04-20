/**
 * 陪伴天数「首条记录日」
 * 直接从 AsyncStorage 读取 firstEntryDate，不依赖 user.firstEntryDate
 * 
 * 存储策略：
 * - 游客：@guest_first_entry_date（单个游客用）
 * - 登录用户：@first_entry_date_{userId}（每个用户独立存储）
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

const FIRST_ENTRY_DATE_KEY_PREFIX = "@first_entry_date_";

function getFirstEntryDateKey(userId: string | undefined): string {
  if (userId) {
    return `${FIRST_ENTRY_DATE_KEY_PREFIX}${userId}`;
  }
  return "guest_first_entry_date";
}

export function useCompanionFirstEntryDate(): number | null {
  const user = useAppStore((s) => s.user);
  const entries = useAppStore((s) => s.entries);
  const [firstEntryDate, setFirstEntryDate] = useState<number | null>(null);

  useEffect(() => {
    const loadFirstEntryDate = async () => {
      const storageKey = getFirstEntryDateKey(user?.id);

      // 1. 先尝试从 AsyncStorage 读取
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const timestamp = parseInt(stored, 10);
          if (timestamp > 0) {
            setFirstEntryDate(timestamp);
            return;
          }
        }
      } catch (error) {
        console.error("[firstEntryDate] 读取失败:", error);
      }

      // 2. 如果没有存储的值，但有 entries，使用最早的 entry 时间戳
      if (entries.length > 0) {
        const validTimestamps = entries.map((e) => e.timestamp).filter((t) => t > 0);
        if (validTimestamps.length > 0) {
          const oldest = Math.min(...validTimestamps);
          setFirstEntryDate(oldest);
          // 保存到 AsyncStorage
          try {
            await AsyncStorage.setItem(storageKey, oldest.toString());
          } catch (error) {
            console.error("[firstEntryDate] 保存失败:", error);
          }
          return;
        }
      }

      // 3. 如果是新用户（没有存储值也没有 entries），设置为当前时间
      if (user?.id) {
        const now = Date.now();
        setFirstEntryDate(now);
        try {
          await AsyncStorage.setItem(storageKey, now.toString());
        } catch (error) {
          console.error("[firstEntryDate] 保存失败:", error);
        }
      }
    };

    void loadFirstEntryDate();
  }, [user?.id, entries]);

  return firstEntryDate;
}
