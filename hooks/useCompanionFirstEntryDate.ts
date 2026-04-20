/**
 * 陪伴天数「首条记录日」：与 CompanionDaysCard 一致
 * — 登录用户用 user.firstEntryDate；游客用 AsyncStorage guest_first_entry_date
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

export function useCompanionFirstEntryDate(): number | null {
  const user = useAppStore((s) => s.user);
  const entriesLength = useAppStore((s) => s.entries.length);
  const [firstEntryDate, setFirstEntryDate] = useState<number | null>(null);

  console.log("[DEBUG useCompanionFirstEntryDate] 渲染, user:", user?.id, "firstEntryDate:", user?.firstEntryDate, "entriesLength:", entriesLength);

  useEffect(() => {
    const loadFirstEntryDate = async () => {
      console.log("[DEBUG useCompanionFirstEntryDate] loadFirstEntryDate 执行, user?.firstEntryDate:", user?.firstEntryDate);
      if (user?.firstEntryDate) {
        console.log("[DEBUG useCompanionFirstEntryDate] 使用 user.firstEntryDate:", user.firstEntryDate);
        setFirstEntryDate(user.firstEntryDate);
        return;
      }
      try {
        const guestDate = await AsyncStorage.getItem("guest_first_entry_date");
        console.log("[DEBUG useCompanionFirstEntryDate] guestDate 从 AsyncStorage 读取:", guestDate);
        if (guestDate) {
          setFirstEntryDate(parseInt(guestDate, 10));
        } else {
          setFirstEntryDate(null);
        }
      } catch (error) {
        console.error("读取游客 firstEntryDate 失败:", error);
        setFirstEntryDate(null);
      }
    };

    void loadFirstEntryDate();
  }, [user?.firstEntryDate, entriesLength]);

  console.log("[DEBUG useCompanionFirstEntryDate] 返回 firstEntryDate:", firstEntryDate);
  return firstEntryDate;
}
