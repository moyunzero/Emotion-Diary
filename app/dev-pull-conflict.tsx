/**
 * __DEV__ only — Maestro 020 Phase 19 pull-conflict probe.
 * Production builds leave this route without running the count.
 */

import { runPullConflictProbe } from "@/store/sync/pullConflictProbe";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function DevPullConflictScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ case?: string }>();
  const [line, setLine] = useState("");

  useEffect(() => {
    if (!__DEV__) {
      router.replace("/" as Href);
      return;
    }

    const caseName = Array.isArray(params.case) ? params.case[0] : params.case;
    let cancelled = false;
    void runPullConflictProbe(caseName ?? "").then((next) => {
      if (!cancelled) {
        setLine(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [params.case, router]);

  if (!__DEV__) {
    return null;
  }

  return (
    <View testID="pull-conflict-probe">
      <Text testID="pull-conflict-result">{line}</Text>
    </View>
  );
}
