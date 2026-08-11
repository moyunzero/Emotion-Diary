#!/usr/bin/env bash
# Simulator smoke helper for Phase 17 Soft Stack widget.
# Automates: boot sim → build/install/launch → open Dashboard deep link.
# Cannot fully automate SpringBoard "add widget" (no public simctl API).
# Optional: --open-widget-gallery brings Simulator to home + tries Accessibility steps
# (requires macOS Accessibility permission for Terminal/Cursor).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BUNDLE_ID="${BUNDLE_ID:-com.moyunzero.emotiondiary}"
DEEP_LINK="${DEEP_LINK:-emotiondiary:///}"
DEVICE_NAME="${DEVICE_NAME:-iPhone 17}"
OPEN_GALLERY=0

for arg in "$@"; do
  case "$arg" in
    --open-widget-gallery) OPEN_GALLERY=1 ;;
    --device=*) DEVICE_NAME="${arg#*=}" ;;
    -h|--help)
      echo "Usage: $0 [--device=iPhone 17] [--open-widget-gallery]"
      exit 0
      ;;
  esac
done

echo "==> Ensure Simulator booted ($DEVICE_NAME)"
# Prefer exact "Name (UUID)" line so "iPhone 17" does not match "iPhone 17 Pro".
# If UDID env is set, use it (stable sim for smoke).
if [[ -n "${UDID:-}" ]]; then
  :
else
  # Prefer an already-Booted exact match, else first exact match.
  UDID="$(
    xcrun simctl list devices available \
      | grep -E "^[[:space:]]*${DEVICE_NAME} \\([A-F0-9-]{36}\\).*\\(Booted\\)" \
      | grep -oE '[A-F0-9-]{36}' \
      | head -1 \
      || true
  )"
  if [[ -z "${UDID:-}" ]]; then
    UDID="$(
      xcrun simctl list devices available \
        | grep -E "^[[:space:]]*${DEVICE_NAME} \\([A-F0-9-]{36}\\)" \
        | grep -oE '[A-F0-9-]{36}' \
        | head -1 \
        || true
    )"
  fi
fi
if [[ -z "${UDID:-}" ]]; then
  echo "ERROR: device not found: $DEVICE_NAME" >&2
  exit 1
fi

STATE="$(xcrun simctl list devices | grep "$UDID" | grep -oE 'Booted|Shutdown' | head -1 || true)"
if [[ "${STATE:-}" != "Booted" ]]; then
  open -a Simulator
  xcrun simctl boot "$UDID" 2>/dev/null || true
  xcrun simctl bootstatus "$UDID" -b
fi
echo "    UDID=$UDID (was ${STATE:-unknown}, now Booted)"

echo "==> Build & install (expo run:ios)"
npx expo run:ios --device "$UDID" --no-bundler

echo "==> Launch app"
xcrun simctl launch "$UDID" "$BUNDLE_ID" || true
sleep 2

echo "==> Open deep link $DEEP_LINK"
xcrun simctl openurl "$UDID" "$DEEP_LINK" || true

# Bring app to background so _layout publish hook also fires; then poll App Group.
echo "==> Background app (publish hook) + verify App Group snapshot"
xcrun simctl terminate "$UDID" "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl launch "$UDID" "$BUNDLE_ID" || true
sleep 3
xcrun simctl openurl "$UDID" "$DEEP_LINK" || true
# Simulate home → background (publish on AppState)
osascript -e 'tell application "Simulator" to activate' >/dev/null 2>&1 || true
osascript -e 'tell application "System Events" to keystroke "h" using {command down, shift down}' >/dev/null 2>&1 || true
sleep 2

APP_GROUP_ID="${APP_GROUP_ID:-group.com.moyunzero.emotiondiary}"
SNAPSHOT_KEY="${SNAPSHOT_KEY:-widget_snapshot_v1}"
GROUP_PATH="$(xcrun simctl get_app_container "$UDID" "$BUNDLE_ID" group "$APP_GROUP_ID" 2>/dev/null || true)"
if [[ -z "${GROUP_PATH:-}" ]]; then
  # Fallback: parse from `groups` listing
  GROUP_PATH="$(xcrun simctl get_app_container "$UDID" "$BUNDLE_ID" groups 2>/dev/null | awk -v g="$APP_GROUP_ID" '$1==g {print $2; exit}')"
fi
PREFS_PLIST="${GROUP_PATH}/Library/Preferences/${APP_GROUP_ID}.plist"
echo "    App Group path: ${GROUP_PATH:-<missing>}"
FOUND=0
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if [[ -f "$PREFS_PLIST" ]] && plutil -extract "$SNAPSHOT_KEY" raw "$PREFS_PLIST" >/dev/null 2>&1; then
    RAW="$(plutil -extract "$SNAPSHOT_KEY" raw "$PREFS_PLIST" 2>/dev/null || true)"
    if echo "$RAW" | grep -q '"schemaVersion"'; then
      FOUND=1
      echo "OK: App Group contains $SNAPSHOT_KEY (schema present)"
      echo "$RAW" | head -c 240
      echo ""
      break
    fi
  fi
  sleep 1
done
if [[ "$FOUND" -ne 1 ]]; then
  echo "ERROR: App Group snapshot missing after launch — Soft Stack will stay cleared." >&2
  echo "  Check: yarn verify:widget-native && rebuild; ensure native WidgetSnapshot is linked." >&2
  ls -la "${GROUP_PATH}/Library/Preferences" 2>/dev/null || true
  exit 1
fi

if [[ "$OPEN_GALLERY" -eq 1 ]]; then
  echo "==> Attempt home screen + widget gallery (best-effort AppleScript)"
  open -a Simulator
  sleep 1
  osascript <<'APPLESCRIPT' || echo "WARN: AppleScript failed — grant Accessibility to Terminal/Cursor, then add widget manually."
tell application "Simulator" to activate
delay 0.5
tell application "System Events"
  tell process "Simulator"
    keystroke "h" using {command down, shift down} -- Home
    delay 0.8
    keystroke "h" using {command down, shift down}
    delay 0.8
  end tell
end tell
APPLESCRIPT
  echo "    Manual finish: long-press home → + → search 心晴 / EmotionDiary → add small widget"
fi

echo ""
echo "Done (automated portion)."
echo "Remaining manual (OS limitation): add Soft Stack widget on home screen, then:"
echo "  1) Use app until weather publishes (or background app)"
echo "  2) Confirm Soft Stack chrome / tap / logout clear per 17-UAT.md"
