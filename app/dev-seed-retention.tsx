/**
 * __DEV__ only — Maestro 015 retention touchpoint seed deep link.
 */

import {
  parseMaestroRetentionSeedParams,
  runMaestroRetentionSeed,
} from "@/services/maestroRetentionSeed";
import { useAppStore } from "@/store/useAppStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";

export default function DevSeedRetentionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    scenario?: string;
    locale?: string;
    reminders?: string;
  }>();

  useEffect(() => {
    if (!__DEV__) {
      router.replace("/");
      return;
    }

    void (async () => {
      const seedOptions = parseMaestroRetentionSeedParams(params);
      if (!seedOptions) {
        router.replace("/");
        return;
      }

      await runMaestroRetentionSeed(seedOptions);
      await useAppStore.getState()._loadEntries();

      if (seedOptions.locale) {
        await useAppStore.getState().setLocale(seedOptions.locale);
      }

      if (seedOptions.scenario === "weekly") {
        router.replace("/insights");
      } else {
        router.replace("/");
      }
    })();
  }, [router, params.scenario, params.locale, params.reminders]);

  return null;
}
