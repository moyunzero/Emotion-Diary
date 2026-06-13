/**
 * Web 端 Alert.alert 在 RN 默认实现中无 UI；用 confirm/alert 兜底，便于 Web 预览与 E2E。
 */
import { Alert, Platform } from "react-native";

let installed = false;

export function installWebAlertPolyfill(): void {
  if (installed || Platform.OS !== "web") return;
  installed = true;

  Alert.alert = (
    title?: string | null,
    message?: string | null,
    buttons?: Array<{
      text?: string;
      onPress?: () => void;
      style?: "default" | "cancel" | "destructive";
    }>,
  ) => {
    const body = [title, message].filter(Boolean).join("\n\n");
    const actions = buttons?.length ? buttons : [{ text: "OK" }];

    if (actions.length === 1) {
      window.alert(body || actions[0].text || "OK");
      actions[0].onPress?.();
      return;
    }

    const cancelBtn = actions.find((b) => b.style === "cancel") ?? actions[0];
    const confirmBtn =
      actions.find((b) => b.style === "destructive") ??
      [...actions].reverse().find((b) => b !== cancelBtn) ??
      actions[actions.length - 1];

    const confirmed = window.confirm(body || confirmBtn.text || "确认");
    if (confirmed) {
      confirmBtn.onPress?.();
    } else {
      cancelBtn.onPress?.();
    }
  };
}
