#!/usr/bin/env bash
# 自动：启动模拟器 →（可选装包）→ 录屏 → Maestro ASO 预览 → 压成 15–30s
# 用法：
#   bash scripts/record-aso-preview.sh
#   ENSURE_APP=1 bash scripts/record-aso-preview.sh   # 先 ensure-sim-app
#   SKIP_MAESTRO=1 bash scripts/record-aso-preview.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APP_ID="${APP_ID:-com.moyunzero.emotiondiary}"
DEVICE_NAME="${DEVICE_NAME:-iPhone 17 Pro Max}"
OUT_DIR="${OUT_DIR:-$ROOT/app-store-submission/previews}"
RAW="$OUT_DIR/moodmo-preview-raw.mp4"
FINAL="$OUT_DIR/moodmo-preview-20s.mp4"
FLOW="$ROOT/.maestro/flows/aso-preview.yaml"

mkdir -p "$OUT_DIR"
export PATH="$PATH:$HOME/.maestro/bin"

die() { echo "FAIL: $*" >&2; exit 1; }

command -v maestro >/dev/null || die "maestro 不在 PATH（export PATH=\"\$PATH:\$HOME/.maestro/bin\"）"
command -v ffmpeg >/dev/null || die "需要 ffmpeg（brew install ffmpeg）"
xcodebuild -license check >/dev/null 2>&1 || die "请先: sudo xcodebuild -license accept"

pick_udid() {
  # Prefer already-booted iOS 26.x (iOS 27.0 currently SIGTRAPs this app at launch).
  local booted
  booted="$(
    python3 - <<'PY'
import json, subprocess, re
data = json.loads(subprocess.check_output(["xcrun", "simctl", "list", "-j", "devices"], text=True))
pref, any_booted = [], []
for rt, devs in data.get("devices", {}).items():
    if "iOS" not in rt:
        continue
    major = 99
    m = re.search(r"iOS[^\d]*(\d+)", rt)
    if m:
        major = int(m.group(1))
    for d in devs:
        if d.get("state") != "Booted":
            continue
        if "iPhone" not in d.get("name", "") and "ASO" not in d.get("name", ""):
            continue
        # Prefer 26.x over 27+
        score = 0 if major == 26 else (1 if major < 27 else 9)
        row = (score, rt, d["udid"])
        any_booted.append(row)
        if major == 26:
            pref.append(row)
pool = pref or any_booted
pool.sort()
print(pool[0][2] if pool else "")
PY
  )"
  [[ -n "$booted" ]] && { echo "$booted"; return; }
  export DEVICE_NAME
  python3 - <<'PY'
import json, os, subprocess, re
name = os.environ.get("DEVICE_NAME", "iPhone 17 Pro Max")
data = json.loads(subprocess.check_output(["xcrun", "simctl", "list", "-j", "devices"], text=True))
items = []
for rt, devs in data.get("devices", {}).items():
    if "iOS" not in rt:
        continue
    major = 99
    m = re.search(r"iOS[^\d]*(\d+)", rt)
    if m:
        major = int(m.group(1))
    for d in devs:
        if not d.get("isAvailable"):
            continue
        name_score = 2 if name in d.get("name", "") else (1 if "iPhone" in d.get("name", "") else 0)
        if not name_score:
            continue
        # Prefer iOS 26.x (avoid 27.0 SIGTRAP); then newer names
        runtime_penalty = 0 if major == 26 else (1 if major < 27 else 5)
        items.append((runtime_penalty, -name_score, rt, d["udid"]))
items.sort()
print(items[0][3] if items else "")
PY
}

echo "== 查找 / 启动模拟器: $DEVICE_NAME =="
UDID="${UDID:-$(pick_udid)}"
[[ -n "$UDID" ]] || die "没有可用的 iPhone 模拟器"
export UDID

STATE="$(xcrun simctl list devices 2>/dev/null | grep "$UDID" || true)"
if echo "$STATE" | grep -q Booted; then
  echo "OK: 已 Boot $UDID"
else
  echo "Booting $UDID …"
  xcrun simctl boot "$UDID"
fi

# Xcode 27+: Simulator.app 已换成 DeviceHub.app
if [[ -d "/Applications/Xcode.app/Contents/Applications/DeviceHub.app" ]]; then
  open -b com.apple.dt.Devices 2>/dev/null \
    || open "/Applications/Xcode.app/Contents/Applications/DeviceHub.app" \
    || true
elif [[ -d "/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app" ]]; then
  open -a "/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app" --args -CurrentDeviceUDID "$UDID" || true
else
  echo "WARN: 未找到 DeviceHub/Simulator，继续 headless"
fi
sleep 2

if [[ "${ENSURE_APP:-0}" == "1" ]]; then
  bash "$ROOT/scripts/ensure-sim-app.sh" || {
    code=$?
    [[ "$code" -eq 2 ]] && die "App UI 不可达，无法录预览（先 yarn ios 进首页）"
    exit "$code"
  }
fi

xcrun simctl listapps "$UDID" 2>/dev/null | grep -q "$APP_ID" || die "未安装 $APP_ID — 先 yarn ios 或 ENSURE_APP=1"

# 前置：App 必须有真实 UI（避免录到桌面；SpringBoard hierarchy 也会很大）
assert_ui() {
  local hier
  hier="$(mktemp)"
  xcrun simctl launch "$UDID" "$APP_ID" >/dev/null 2>&1 || true
  sleep 5
  if ! perl -e 'alarm shift; exec @ARGV' 25 maestro --device "$UDID" hierarchy >"$hier" 2>/dev/null; then
    rm -f "$hier"
    die "maestro hierarchy 超时/失败 — App 可能未在前台"
  fi
  if ! rg -q 'dashboard-header|onboarding-skip-button|mood-content-input|insights-screen' "$hier"; then
    rm -f "$hier"
    die "App UI 不可达（未命中 App testID，多半 SpringBoard）。录屏会拍到桌面，已中止。
修复后再跑：
  1) yarn aso:preview:ensure   # 嵌入 React.framework 并签名
  2) yarn start && yarn ios
  3) ENSURE_APP=1 yarn aso:preview"
  fi
  rm -f "$hier"
  echo "OK: App UI 可达（命中 App testID）"
}

if [[ "${SKIP_UI_CHECK:-0}" != "1" ]]; then
  assert_ui
fi

echo "== 开始录屏 → $RAW =="
rm -f "$RAW" "$FINAL"
xcrun simctl io "$UDID" recordVideo --codec=h264 --force "$RAW" &
REC_PID=$!
sleep 2

cleanup() {
  if kill -0 "$REC_PID" 2>/dev/null; then
    kill -INT "$REC_PID" 2>/dev/null || true
    wait "$REC_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if [[ "${SKIP_MAESTRO:-0}" == "1" ]]; then
  echo "SKIP_MAESTRO=1 → 空录 22s"
  sleep 22
else
  echo "== Maestro: $FLOW =="
  maestro --device "$UDID" test "$FLOW"
fi

echo "== 停止录屏 =="
kill -INT "$REC_PID" 2>/dev/null || true
wait "$REC_PID" 2>/dev/null || true
trap - EXIT

[[ -f "$RAW" ]] || die "未生成 $RAW"

DUR="$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$RAW" 2>/dev/null || echo 0)"
echo "原始时长约 ${DUR}s"
# 不足 15s 时 Apple 会拒；给出警告但仍产出
awk -v d="$DUR" 'BEGIN { if (d+0 < 15) exit 1; exit 0 }' || echo "WARN: 时长 < 15s，App Store 可能拒收，请加长 Maestro wait"

echo "== 压成 App Store 预览 → $FINAL =="
# simctl 录屏帧率很低；强制 CFR 30fps，否则压成 20s 时会短于 15s（Apple 下限）
START_OFFSET="${START_OFFSET:-28}"
ffmpeg -y -i "$RAW" -ss "$START_OFFSET" -t 22 -vsync cfr -r 30 \
  -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.2 -an "$FINAL.tmp.mp4"
ffmpeg -y -i "$FINAL.tmp.mp4" -t 20 -c copy "$FINAL"
rm -f "$FINAL.tmp.mp4"

echo ""
echo "完成:"
echo "  $RAW"
echo "  $FINAL"
echo "Safari → App Store Connect → 1.6.1 → 媒体管理 → iPhone 6.7\" 第一格"
