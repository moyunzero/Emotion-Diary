#!/usr/bin/env bash
# Maestro 原生 E2E 前置检查（不跑 flow，只诊断环境）
set -euo pipefail

APP_ID="com.moyunzero.emotiondiary"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail=0

echo "== Maestro preflight =="

if ! command -v maestro >/dev/null 2>&1; then
  echo "FAIL: maestro 不在 PATH（安装后执行: export PATH=\"\$PATH:\$HOME/.maestro/bin\"）"
  fail=1
else
  echo "OK: maestro $(maestro --version 2>/dev/null | head -1 || true)"
fi

BOOTED="$(xcrun simctl list devices booted 2>/dev/null | rg -o '[0-9A-F-]{36}' | head -1 || true)"
if [[ -z "$BOOTED" ]]; then
  echo "FAIL: 无已启动的 iOS 模拟器（Simulator 中 Boot 一台设备）"
  fail=1
else
  echo "OK: booted simulator $BOOTED"
  if xcrun simctl listapps "$BOOTED" 2>/dev/null | rg -q "$APP_ID"; then
    echo "OK: $APP_ID 已安装"
  else
    echo "FAIL: 模拟器未安装 $APP_ID — 需先 yarn ios（且 Xcode 能成功 xcodebuild）"
    fail=1
  fi
fi

if [[ -d ios/MO.xcworkspace ]]; then
  DEST_COUNT="$(xcodebuild -workspace ios/MO.xcworkspace -scheme MO -sdk iphonesimulator -showdestinations 2>&1 | rg -c "platform:iOS Simulator" || true)"
  if [[ "${DEST_COUNT:-0}" -eq 0 ]]; then
    echo "WARN: xcodebuild 无可用 Simulator destination（常见：未安装 iOS 26.5 Platform）"
    echo "      修复: Xcode → Settings → Components 安装 iOS 26.5，或: xcodebuild -downloadPlatform iOS"
    fail=1
  else
    echo "OK: xcodebuild 可见 $DEST_COUNT 个 Simulator destination"
  fi
else
  echo "WARN: 无 ios/MO.xcworkspace — 首次需 npx expo prebuild 或 yarn ios"
fi

if command -v maestro >/dev/null 2>&1 && [[ -n "${BOOTED:-}" ]]; then
  if maestro hierarchy 2>/dev/null | rg -q "情绪气象站|记一笔"; then
    echo "OK: hierarchy 可见首页 Tab（可跑 yarn test:maestro）"
  elif maestro hierarchy 2>/dev/null | rg -qi "ExpoPushTokenManager|ExpoAudio|native module"; then
    echo "FAIL: App 红屏（原生模块与 JS 不匹配）— 必须重新 yarn ios 安装 dev build"
    fail=1
  else
    echo "WARN: hierarchy 未见「情绪气象站」— 确认 Metro 已 yarn start 且 App 在前台"
  fi
fi

if [[ "$fail" -ne 0 ]]; then
  echo ""
  echo "Preflight 未通过。通过后再跑: yarn test:maestro"
  exit 1
fi

echo ""
echo "Preflight 通过，可运行: yarn test:maestro"
