/**
 * 陪伴天数「首条记录日」
 * 直接从 AsyncStorage 读取 firstEntryDate，并与本地 entries 取最早值对齐
 * （合并/恢复云端旧日记后，不得被较晚的缓存钉死）。
 *
 * 存储策略：
 * - 游客：guest_first_entry_date
 * - 登录用户：@first_entry_date_{userId}
 */

import { useAppStore } from "@/store/useAppStore";
import { resolveCompanionFirstEntryDate } from "@/services/companionDaysService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

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
      let stored: number | null = null;

      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const timestamp = Number.parseInt(raw, 10);
          if (timestamp > 0) stored = timestamp;
        }
      } catch (error) {
        console.error("[firstEntryDate] 读取失败:", error);
      }

      const resolved = resolveCompanionFirstEntryDate(
        [stored, user?.firstEntryDate],
        entries,
      );

      if (resolved != null) {
        setFirstEntryDate(resolved);
        if (stored !== resolved) {
          try {
            await AsyncStorage.setItem(storageKey, resolved.toString());
          } catch (error) {
            console.error("[firstEntryDate] 保存失败:", error);
          }
        }
        // 回写 user / 云端：仅当更早时 updateFirstEntryDate 才会落盘
        if (user?.id) {
          void useAppStore.getState().updateFirstEntryDate(resolved);
        }
        return;
      }

      // 新用户：无缓存也无条目时才落到「今天」
      if (user?.id) {
        const now = Date.now();
        setFirstEntryDate(now);
        try {
          await AsyncStorage.setItem(storageKey, now.toString());
        } catch (error) {
          console.error("[firstEntryDate] 保存失败:", error);
        }
      } else {
        setFirstEntryDate(null);
      }
    };

    void loadFirstEntryDate();
  }, [user?.id, user?.firstEntryDate, entries]);

  return firstEntryDate;
}
