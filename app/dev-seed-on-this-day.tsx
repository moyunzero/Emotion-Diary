/**
 * __DEV__ only — Maestro 019 On This Day seed deep link.
 * Production / non-dev builds replace to / without writing (T-15-03).
 */

import { executeDevSeedOnThisDayRoute } from "@/services/devSeedOnThisDayRoute";
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

    void executeDevSeedOnThisDayRoute({
      scenario: params.scenario,
      locale: params.locale,
      getUserId: () => useAppStore.getState().user?.id ?? null,
      setEntries: (entries) => useAppStore.setState({ entries }),
      loadEntries: () => useAppStore.getState()._loadEntries(),
      setLocale: (locale) => useAppStore.getState().setLocale(locale),
      replace: (href) => router.replace(href as unknown as Href),
    });
  }, [router, params.scenario, params.locale]);

  return null;
}
