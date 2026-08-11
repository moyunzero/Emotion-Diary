#!/usr/bin/env bash
# Simulator smoke helper for Phase 17 Soft Stack widget.
# Automates: boot sim → Metro → build/install/launch → open Dashboard deep link.
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
METRO_PID=""

cleanup() {
  if [[ -n "${METRO_PID:-}" ]] && kill -0 "$METRO_PID" 2>/dev/null; then
    kill "$METRO_PID" 2>/dev/null || true
    wait "$METRO_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

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

echo "==> Start Metro (dev-client) in background"
if curl -sf "http://127.0.0.1:8081/status" >/dev/null 2>&1; then
  echo "    Metro already ready on :8081 - reuse"
  METRO_PID=""
else
  # CI=1 avoids interactive "use another port?" prompts when 8081 is briefly raced.
  CI=1 npx expo start --dev-client --port 8081 > /tmp/emotion-diary-metro-smoke.log 2>&1 &
  METRO_PID=$!
  echo "    Metro pid=$METRO_PID (log: /tmp/emotion-diary-metro-smoke.log)"

  echo "==> Wait until Metro is ready"
  METRO_READY=0
  for _ in $(seq 1 90); do
    if ! kill -0 "$METRO_PID" 2>/dev/null; then
      echo "ERROR: Metro exited early - see /tmp/emotion-diary-metro-smoke.log" >&2
      tail -n 40 /tmp/emotion-diary-metro-smoke.log >&2 || true
      exit 1
    fi
    if curl -sf "http://127.0.0.1:8081/status" >/dev/null 2>&1; then
      METRO_READY=1
      break
    fi
    sleep 1
  done
  if [[ "$METRO_READY" -ne 1 ]]; then
    echo "ERROR: Metro not ready within timeout" >&2
    tail -n 40 /tmp/emotion-diary-metro-smoke.log >&2 || true
    exit 1
  fi
  echo "    Metro ready"
fi

echo "==> Build & install (expo run:ios --no-bundler)"
CI=1 npx expo run:ios --device "$UDID" --no-bundler

echo "==> Launch app"
xcrun simctl launch "$UDID" "$BUNDLE_ID" || true
sleep 2

echo "==> Open deep link $DEEP_LINK"
xcrun simctl openurl "$UDID" "$DEEP_LINK" || true

APP_GROUP_ID="${APP_GROUP_ID:-group.com.moyunzero.emotiondiary}"
SNAPSHOT_KEY="${SNAPSHOT_KEY:-widget_snapshot_v1}"

echo "==> Verify PlugIns/EmotionDiaryWidget.appex is embedded"
APP_BUNDLE="$(xcrun simctl get_app_container "$UDID" "$BUNDLE_ID" app 2>/dev/null || true)"
APPEX_PATH="${APP_BUNDLE}/PlugIns/EmotionDiaryWidget.appex"
if [[ -z "${APP_BUNDLE:-}" || ! -d "$APPEX_PATH" ]]; then
  echo "ERROR: missing PlugIns/EmotionDiaryWidget.appex in installed app" >&2
  ls -la "${APP_BUNDLE}/PlugIns" 2>/dev/null || true
  exit 1
fi
echo "OK: embedded $APPEX_PATH"

GROUP_PATH="$(xcrun simctl get_app_container "$UDID" "$BUNDLE_ID" group "$APP_GROUP_ID" 2>/dev/null || true)"
if [[ -z "${GROUP_PATH:-}" ]]; then
  # Fallback: parse from `groups` listing
  GROUP_PATH="$(xcrun simctl get_app_container "$UDID" "$BUNDLE_ID" groups 2>/dev/null | awk -v g="$APP_GROUP_ID" '$1==g {print $2; exit}')"
fi
PREFS_PLIST="${GROUP_PATH}/Library/Preferences/${APP_GROUP_ID}.plist"
echo "    App Group path: ${GROUP_PATH:-<missing>}"

assert_snapshot() {
  local found=0
  local raw=""
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if [[ -f "$PREFS_PLIST" ]] && plutil -extract "$SNAPSHOT_KEY" raw "$PREFS_PLIST" >/dev/null 2>&1; then
      raw="$(plutil -extract "$SNAPSHOT_KEY" raw "$PREFS_PLIST" 2>/dev/null || true)"
      if echo "$raw" | grep -q '"schemaVersion"'; then
        found=1
        echo "OK: App Group contains $SNAPSHOT_KEY (schema present)"
        echo "$raw" | head -c 240
        echo ""
        break
      fi
    fi
    sleep 1
  done
  return $((1 - found))
}

background_and_publish() {
  xcrun simctl terminate "$UDID" "$BUNDLE_ID" 2>/dev/null || true
  xcrun simctl launch "$UDID" "$BUNDLE_ID" || true
  sleep 3
  xcrun simctl openurl "$UDID" "$DEEP_LINK" || true
  osascript -e 'tell application "Simulator" to activate' >/dev/null 2>&1 || true
  osascript -e 'tell application "System Events" to keystroke "h" using {command down, shift down}' >/dev/null 2>&1 || true
  sleep 2
}

echo "==> Background app (publish hook) + verify App Group snapshot"
background_and_publish

if ! assert_snapshot; then
  if [[ -f "$ROOT/.maestro.env" ]]; then
    echo "==> Snapshot missing (likely logged out). Maestro login then retry publish..."
    set -a
    # shellcheck disable=SC1091
    . "$ROOT/.maestro.env"
    set +a
    if [[ -n "${MAESTRO_EMAIL:-}" && -n "${MAESTRO_PASSWORD:-}" ]]; then
      export PATH="$PATH:$HOME/.maestro/bin"
      printf %s "$MAESTRO_PASSWORD" | pbcopy
      # Ensure clipboard is for pasteText (RN secure fields often ignore inputText)
      maestro test "$ROOT/.maestro/flows/_smoke-widget-publish.yaml" || true
      background_and_publish
    fi
  fi
fi

if ! assert_snapshot; then
  echo "ERROR: App Group snapshot missing after launch — Soft Stack will stay cleared." >&2
  echo "  Check: yarn verify:widget-native && rebuild; ensure native WidgetSnapshot is linked." >&2
  echo "  Also requires signed-in session for publish (D-10)." >&2
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
