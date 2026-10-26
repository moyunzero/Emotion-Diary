/**
 * __DEV__ only — 触发气象站列表程序化下滑（App Preview）。
 * emotiondiary://dev-aso-scroll
 */

import { requestAsoDashboardScroll } from "@/services/asoPreviewScroll";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function DevAsoScrollScreen() {
  const router = useRouter();

  useEffect(() => {
    if (!__DEV__) {
      router.replace("/");
      return;
    }
    requestAsoDashboardScroll();
    router.replace("/");
  }, [router]);

  return null;
}
