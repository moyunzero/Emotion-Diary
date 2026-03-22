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

  useEffect(() => {
    const loadFirstEntryDate = async () => {
      if (user?.firstEntryDate) {
        setFirstEntryDate(user.firstEntryDate);
        return;
      }
      try {
        const guestDate = await AsyncStorage.getItem("guest_first_entry_date");
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

  return firstEntryDate;
}
