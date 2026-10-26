/**
 * __DEV__ only — App Store Preview 演示数据深链。
 * emotiondiary://dev-seed-aso?locale=zh-Hans
 */

import { runAsoPreviewSeed } from "@/services/asoPreviewSeed";
import { enableAsoPreviewQuiet } from "@/services/asoPreviewQuiet";
import { useAppStore } from "@/store/useAppStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";

export default function DevSeedAsoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ locale?: string }>();

  useEffect(() => {
    if (!__DEV__) {
      router.replace("/");
      return;
    }

    // App Preview 录屏：关掉 LogBox 黄条（本会话持续）
    enableAsoPreviewQuiet();

    void (async () => {
      const locale =
        params.locale === "en-US" || params.locale === "zh-Hans"
          ? params.locale
          : "zh-Hans";

      await runAsoPreviewSeed({
        locale,
        userId: useAppStore.getState().user?.id ?? null,
      });
      await useAppStore.getState()._loadEntries();
      await useAppStore.getState().setLocale(locale);
      router.replace("/");
    })();
  }, [router, params.locale]);

  return null;
}
