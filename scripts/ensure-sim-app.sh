#!/usr/bin/env bash
# 确保模拟器上有可启动的 Debug MO.app（嵌入 React/hermes/RND 并 ad-hoc 签名）
# 用法：bash scripts/ensure-sim-app.sh
# 环境变量：UDID（可选）、APP（可选）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_ID="${APP_ID:-com.moyunzero.emotiondiary}"

resolve_app() {
  if [[ -n "${APP:-}" && -d "$APP" ]]; then
    echo "$APP"
    return
  fi
  local candidate
  candidate="$(find "$HOME/Library/Developer/Xcode/DerivedData" -path '*/Build/Products/Debug-iphonesimulator/MO.app' -type d 2>/dev/null | head -1 || true)"
  if [[ -n "$candidate" && -d "$candidate" ]]; then
    echo "$candidate"
    return
  fi
  candidate="$ROOT/ios/build/DerivedData/Build/Products/Debug-iphonesimulator/MO.app"
  if [[ -d "$candidate" ]]; then
    echo "$candidate"
    return
  fi
  echo ""
}

APP="$(resolve_app)"
PROD="$(dirname "$APP")"
REACT_SRC="$ROOT/ios/Pods/React-Core-prebuilt/React.xcframework/ios-arm64_x86_64-simulator/React.framework"
HERMES_SRC="$PROD/XCFrameworkIntermediates/hermes-engine/Pre-built/hermes.framework"
RND_SRC="$PROD/XCFrameworkIntermediates/ReactNativeDependencies/ReactNativeDependencies.framework"
TARBALL="$ROOT/ios/Pods/ReactNativeCore-artifacts/reactnative-core-0.81.5-debug.tar.gz"

pick_udid() {
  local booted
  booted="$(xcrun simctl list devices booted 2>/dev/null | grep -E 'iPhone|ASO' | grep -v unavailable | head -1 | grep -oE '[0-9A-F-]{36}' || true)"
  if [[ -n "$booted" ]]; then
    echo "$booted"
    return
  fi
  python3 - <<'PY'
import json, subprocess
data = json.loads(subprocess.check_output(["xcrun", "simctl", "list", "-j", "devices"], text=True))
items = []
for rt, devs in data.get("devices", {}).items():
    if "iOS" not in rt:
        continue
    for d in devs:
        if d.get("isAvailable") and "iPhone" in d.get("name", ""):
            items.append((rt, d["udid"], d["name"]))
items.sort(reverse=True)
print(items[0][1] if items else "")
PY
}

UDID="${UDID:-$(pick_udid)}"
if [[ -z "$UDID" ]]; then
  echo "FAIL: 无可用 iPhone 模拟器"
  exit 1
fi

if ! echo "$(xcrun simctl list devices 2>/dev/null | grep "$UDID" || true)" | grep -q Booted; then
  echo "Booting $UDID …"
  xcrun simctl boot "$UDID"
fi

if [[ -z "$APP" || ! -d "$APP" ]]; then
  echo "FAIL: 找不到 MO.app"
  echo "请先 yarn ios / xcodebuild"
  exit 1
fi
echo "APP=$APP"

# 补全损坏的 React.xcframework（仅 Headers、无二进制时）
if [[ ! -f "$REACT_SRC/React" ]]; then
  if [[ ! -f "$TARBALL" ]]; then
    echo "FAIL: React 二进制缺失且无 tarball: $TARBALL"
    exit 1
  fi
  echo "Restoring React.xcframework from debug tarball…"
  PRE="$ROOT/ios/Pods/React-Core-prebuilt"
  rm -rf "$PRE"
  mkdir -p "$PRE"
  tar -xzf "$TARBALL" -C "$PRE"
fi

echo "Embedding frameworks into MO.app…"
mkdir -p "$APP/Frameworks"
rm -rf "$APP/Frameworks"/{React,hermes,ReactNativeDependencies}.framework
cp -R "$REACT_SRC" "$APP/Frameworks/"
if [[ -d "$HERMES_SRC" ]]; then
  cp -R "$HERMES_SRC" "$APP/Frameworks/"
else
  echo "WARN: 缺少 hermes.framework intermediate"
fi
if [[ -d "$RND_SRC" ]]; then
  cp -R "$RND_SRC" "$APP/Frameworks/"
else
  echo "WARN: 缺少 ReactNativeDependencies.framework intermediate"
fi

# 手拷 Framework 会破坏 codesign → 模拟器 SIGTRAP；ad-hoc 重签
echo "Ad-hoc signing embedded frameworks…"
for fw in React hermes ReactNativeDependencies; do
  if [[ -d "$APP/Frameworks/$fw.framework" ]]; then
    codesign --force --sign - --timestamp=none "$APP/Frameworks/$fw.framework" >/dev/null
  fi
done
codesign --force --sign - --timestamp=none "$APP" >/dev/null || true

echo "Installing → $UDID"
xcrun simctl uninstall "$UDID" "$APP_ID" 2>/dev/null || true
xcrun simctl install "$UDID" "$APP"
xcrun simctl launch "$UDID" "$APP_ID" >/dev/null 2>&1 || true
sleep 5

xcrun simctl io "$UDID" screenshot "$ROOT/app-store-submission/previews/ensure-ui-check.png" >/dev/null 2>&1 || true

# 必须看到 App 专属节点，不能只靠 hierarchy 字节数（SpringBoard 也很大）
export PATH="$PATH:$HOME/.maestro/bin"
if command -v maestro >/dev/null 2>&1; then
  HIER="$(mktemp)"
  if perl -e 'alarm shift; exec @ARGV' 25 maestro --device "$UDID" hierarchy >"$HIER" 2>/dev/null; then
    # Match resource-id / id — do NOT match icon label「心晴」(SpringBoard 误报)
    if rg -q 'dashboard-header|onboarding-skip-button|mood-content-input|insights-screen|tab-dashboard|tab-record' "$HIER"; then
      echo "OK: App UI 可达（命中 App testID）"
    elif rg -q 'SpringBoard|Fitness|提醒事项' "$HIER"; then
      echo "WARN: 仍在 SpringBoard — App 启动后立刻退出"
      echo "      iOS 27.0 上本包会 SIGTRAP；请改用 iOS 26.x 模拟器，并确认 React.framework 已嵌入"
      echo "      截图: app-store-submission/previews/ensure-ui-check.png"
      rm -f "$HIER"
      exit 2
    else
      BYTES="$(wc -c <"$HIER" | tr -d ' ')"
      echo "WARN: 未识别到已知 App testID（hierarchy ${BYTES}B）— 请看截图"
      rm -f "$HIER"
      exit 2
    fi
  else
    echo "WARN: maestro hierarchy 超时/失败（可稍后重试）"
  fi
  rm -f "$HIER"
fi

echo "OK: ensure-sim-app 完成 · UDID=$UDID"
