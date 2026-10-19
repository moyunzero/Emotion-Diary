/**
 * __DEV__ only — Maestro acceptance for the Phase 20 merge confirm.
 * Uses the same presentMergeConfirm as Profile. Does not upload or merge.
 */

import { i18n } from "@/i18n";
import {
  presentMergeConfirm,
  type MergeConfirm,
} from "@/features/profile/hooks/mergeConfirm";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";

function confirmForCase(caseName: string): MergeConfirm | null {
  if (caseName === "zero") return { kind: "short" };
  if (caseName === "counted") return { kind: "counted", total: 2 };
  if (caseName === "unknown") return { kind: "unknown" };
  return null;
}

export default function DevMergeConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ case?: string; n?: string }>();
  const [line, setLine] = useState("");

  useEffect(() => {
    if (!__DEV__) {
      router.replace("/" as Href);
      return;
    }

    const caseName = Array.isArray(params.case) ? params.case[0] : params.case;
    const confirm = confirmForCase(caseName ?? "");
    setLine("");
    if (!confirm) {
      setLine("action:error");
      return;
    }

    presentMergeConfirm(
      confirm,
      (action) => setLine(`action:${action}`),
      {
        alert: Alert.alert,
        t: (key, options) =>
          String(i18n.t(key as never, options as never)),
      },
    );
  }, [params.case, params.n, router]);

  if (!__DEV__) {
    return null;
  }

  return (
    <View testID="merge-confirm-probe">
      <Text testID="merge-confirm-result">{line}</Text>
    </View>
  );
}
