import {
  loadOnboardingMetaphorSeen,
  migrateOnboardingMetaphorIfNeeded,
  registerOnboardingReplayListener,
  setOnboardingMetaphorSeen,
} from "@/services/onboardingMetaphor";
import { usePathname, useRouter, useSegments } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { MetaphorOnboardingModal } from "./MetaphorOnboardingModal";

export function MetaphorOnboardingHost(): React.ReactElement | null {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"auto" | "replay">("auto");
  const [seen, setSeen] = useState<boolean | null>(null);
  const [modalRemountKey, setModalRemountKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await migrateOnboardingMetaphorIfNeeded();
      const loaded = await loadOnboardingMetaphorSeen();
      if (!cancelled) {
        setSeen(loaded);
      }
    })();

    registerOnboardingReplayListener(() => {
      setMode("replay");
      setModalRemountKey((key) => key + 1);
      setVisible(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (seen === null) {
      return;
    }

    const inTabs = segments[0] === "(tabs)";
    if (inTabs && !seen && mode === "auto") {
      setVisible(true);
    }
  }, [seen, segments, mode]);

  const handleIntroFinish = useCallback(async () => {
    await setOnboardingMetaphorSeen(true);
    setSeen(true);
    setVisible(false);

    if (!pathname.endsWith("/record")) {
      router.replace("/record");
    }
  }, [pathname, router]);

  if (!visible) {
    return null;
  }

  return (
    <MetaphorOnboardingModal
      key={modalRemountKey}
      visible={visible}
      onSkip={() => {
        void handleIntroFinish();
      }}
      onStart={() => {
        void handleIntroFinish();
      }}
    />
  );
}
