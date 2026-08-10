/**
 * __DEV__ only — Maestro 019 On This Day seed deep link.
 * Production / non-dev builds replace to / without writing (T-15-03).
 */

import {
  parseMaestroOnThisDaySeedParams,
  runMaestroOnThisDaySeed,
} from "@/services/maestroOnThisDaySeed";
import { useAppStore } from "@/store/useAppStore";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";

export default function DevSeedOnThisDayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    scenario?: string;
    locale?: string;
  }>();

  useEffect(() => {
    if (!__DEV__) {
      router.replace("/");
      return;
    }

    void (async () => {
      const seedOptions = parseMaestroOnThisDaySeedParams(params);
      if (!seedOptions) {
        router.replace("/");
        return;
      }

      await runMaestroOnThisDaySeed(seedOptions);
      await useAppStore.getState()._loadEntries();

      if (seedOptions.locale) {
        await useAppStore.getState().setLocale(seedOptions.locale);
      }

      router.replace("/on-this-day" as unknown as Href);
    })();
  }, [router, params.scenario, params.locale]);

  return null;
}
