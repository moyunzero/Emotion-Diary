#!/usr/bin/env bash
# 自动：启动模拟器 →（可选装包）→ 录屏 → Maestro ASO 预览 → 压成 App Store 规格
# 用法：
#   bash scripts/record-aso-preview.sh
#   ENSURE_APP=1 bash scripts/record-aso-preview.sh   # 先 ensure-sim-app
#   SKIP_MAESTRO=1 bash scripts/record-aso-preview.sh
#   LOCALE=zh-Hans DEVICE_NAME="iPhone 16 Pro" bash scripts/record-aso-preview.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APP_ID="${APP_ID:-com.moyunzero.emotiondiary}"
# 默认：带灵动岛的 iPhone（中等显示屏）— 对应 ASC「Dynamic Island · medium」
DEVICE_NAME="${DEVICE_NAME:-iPhone 17 Pro}"
LOCALE="${LOCALE:-zh-Hans}"
OUT_DIR="${OUT_DIR:-$ROOT/app-store-submission/previews}"
# 片长：Apple 要求 15–30s；默认 16s（紧凑四幕）
DURATION_S="${DURATION_S:-16}"
FX_PACK="${FX_PACK:-dissolve}"
RAW="$OUT_DIR/moodmo-preview-raw.mp4"
# 中文正式交付文件名（带配文版为最终上传件）
if [[ "$LOCALE" == "zh-Hans" || "$LOCALE" == "zh" ]]; then
  FINAL="${FINAL:-$OUT_DIR/moodmo-preview-zh-Hans-16s.mp4}"
  CAPTIONED="${CAPTIONED:-$OUT_DIR/moodmo-preview-zh-Hans.mp4}"
else
  FINAL="${FINAL:-$OUT_DIR/moodmo-preview-${LOCALE}-16s.mp4}"
  CAPTIONED="${CAPTIONED:-$OUT_DIR/moodmo-preview-${LOCALE}.mp4}"
fi
SEED_FLOW="$ROOT/.maestro/flows/aso-preview-seed.yaml"
FLOW="$ROOT/.maestro/flows/aso-preview.yaml"

mkdir -p "$OUT_DIR"
export PATH="$PATH:$HOME/.maestro/bin"

die() { echo "FAIL: $*" >&2; exit 1; }

command -v maestro >/dev/null || die "maestro 不在 PATH（export PATH=\"\$PATH:\$HOME/.maestro/bin\"）"
command -v ffmpeg >/dev/null || die "需要 ffmpeg（brew install ffmpeg）"
command -v ffprobe >/dev/null || die "需要 ffprobe"
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
name = os.environ.get("DEVICE_NAME", "iPhone 16 Pro")
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
        dname = d.get("name", "")
        # Exact / contains preferred name first; avoid Pro Max when looking for medium
        if name == dname:
            name_score = 3
        elif name in dname and "Max" not in dname:
            name_score = 2
        elif "iPhone" in dname and "Pro" in dname and "Max" not in dname:
            name_score = 1
        elif "iPhone" in dname:
            name_score = 0
        else:
            continue
        runtime_penalty = 0 if major == 26 else (1 if major < 27 else 5)
        # Prefer non-Max when DEVICE is medium Pro
        max_penalty = 0 if "Max" not in dname else 2
        items.append((runtime_penalty, max_penalty, -name_score, rt, d["udid"], dname))
items.sort()
print(items[0][4] if items else "")
PY
}

echo "== 查找 / 启动模拟器: $DEVICE_NAME (locale=$LOCALE) =="
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

# 系统语言 → 中文简体（App 跟随系统 / 默认 zh-Hans）
if [[ "$LOCALE" == "zh-Hans" || "$LOCALE" == "zh" ]]; then
  echo "== 设置模拟器语言: zh-Hans =="
  xcrun simctl spawn "$UDID" defaults write -g AppleLanguages -array zh-Hans || true
  xcrun simctl spawn "$UDID" defaults write -g AppleLocale -string zh_CN || true
fi

if [[ "${ENSURE_APP:-0}" == "1" ]]; then
  bash "$ROOT/scripts/ensure-sim-app.sh" || {
    code=$?
    [[ "$code" -eq 2 ]] && die "App UI 不可达，无法录预览（先 yarn ios 进首页）"
    exit "$code"
  }
fi

# listapps 输出格式不稳定；用 get_app_container 判断是否已安装
xcrun simctl get_app_container "$UDID" "$APP_ID" >/dev/null 2>&1 \
  || die "未安装 $APP_ID — 先 yarn ios 或 ENSURE_APP=1"

# 前置：App 必须有真实 UI（避免录到桌面；SpringBoard hierarchy 也会很大）
assert_ui() {
  local hier
  hier="$(mktemp)"
  xcrun simctl launch "$UDID" "$APP_ID" >/dev/null 2>&1 || true
  sleep 12
  if ! perl -e 'alarm shift; exec @ARGV' 45 maestro --device "$UDID" hierarchy >"$hier" 2>/dev/null; then
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

# 先 seed（不进成片）：关黄条 + 写入丰富中文数据，避免录到引导/空列表
if [[ "${SKIP_MAESTRO:-0}" != "1" && "${SKIP_SEED:-0}" != "1" ]]; then
  echo "== Maestro seed（不录）: $SEED_FLOW =="
  maestro --device "$UDID" test "$SEED_FLOW"
fi

echo "== 开始录屏 → $RAW =="
# 清掉上次未收尾的 recordVideo（否则会 Resource busy / 写出 .sb-* 残片）
pkill -f "simctl io .* recordVideo" 2>/dev/null || true
sleep 1
rm -f "$RAW" "$FINAL" "$RAW".sb-* 2>/dev/null || true
# 前置 Simulator，提高 io 录屏采帧率
open -a Simulator --args -CurrentDeviceUDID "$UDID" 2>/dev/null || true
sleep 1
xcrun simctl io "$UDID" recordVideo --codec=h264 --force "$RAW" &
REC_PID=$!
sleep 2
kill -0 "$REC_PID" 2>/dev/null || die "recordVideo 未能启动（可能仍有残留录屏进程）"
# 给编码器一点预热，避免片头长时间 0 帧
sleep 1

cleanup() {
  if kill -0 "$REC_PID" 2>/dev/null; then
    kill -INT "$REC_PID" 2>/dev/null || true
    wait "$REC_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if [[ "${SKIP_MAESTRO:-0}" == "1" ]]; then
  echo "SKIP_MAESTRO=1 → 空录 $((DURATION_S + 2))s"
  sleep $((DURATION_S + 2))
else
  echo "== Maestro 实录: $FLOW =="
  maestro --device "$UDID" test "$FLOW"
fi

echo "== 停止录屏 =="
kill -INT "$REC_PID" 2>/dev/null || true
# simctl recordVideo 收尾偶发卡住 wait；轮询退出，超时再强杀
for _ in $(seq 1 40); do
  kill -0 "$REC_PID" 2>/dev/null || break
  sleep 0.5
done
if kill -0 "$REC_PID" 2>/dev/null; then
  echo "WARN: recordVideo 未在 20s 内退出，SIGKILL"
  kill -9 "$REC_PID" 2>/dev/null || true
fi
wait "$REC_PID" 2>/dev/null || true
trap - EXIT
# 等原子写入落盘（偶见 .sb-* 临时名）
for _ in $(seq 1 30); do
  if [[ -f "$RAW" ]] && ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$RAW" >/dev/null 2>&1; then
    break
  fi
  # 把残留临时片挪正（仅当正式文件尚不存在）
  if [[ ! -f "$RAW" ]]; then
    tmp="$(ls -1 "$RAW".sb-* 2>/dev/null | head -1 || true)"
    [[ -n "${tmp:-}" ]] && mv -f "$tmp" "$RAW" 2>/dev/null || true
  fi
  sleep 0.4
done

[[ -f "$RAW" ]] || die "未生成 $RAW"

DUR="$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$RAW" 2>/dev/null || echo 0)"
echo "原始时长约 ${DUR}s"
awk -v d="$DUR" 'BEGIN { if (d+0 < 12) exit 1; exit 0 }' || echo "WARN: 原始过短，请检查 Maestro"

# 转码：Apple App Preview 规格
# - 竖屏验收分辨率 886×1920
# - H.264 Progressive High Profile Level 4.0
# - 目标码率 10–12 Mbps · CFR 30fps
# - 时长严格 DURATION_S（默认 16）
echo "== 压成 App Store 预览 → $FINAL =="
# 已先 seed 再录：默认从 0 起；仍可用 START_OFFSET / AUTO_TRIM 微调
START_OFFSET="${START_OFFSET:-0}"
if [[ "${AUTO_TRIM:-0}" == "1" ]]; then
  START_OFFSET="$(
    python3 - "$RAW" <<'PY'
import os, subprocess, sys
path = sys.argv[1]
best_t, best_sz = 0, 0
for t in range(0, min(20, int(float(os.environ.get("DUR", "40")))), 1):
    out = f"/tmp/aso-trim-{t}.png"
    subprocess.run(
        ["ffmpeg", "-y", "-ss", str(t), "-i", path, "-vframes", "1", out],
        capture_output=True,
    )
    sz = os.path.getsize(out) if os.path.exists(out) else 0
    if sz > best_sz:
        best_sz, best_t = sz, t
print(max(0, best_t - 1))
PY
  )"
  echo "AUTO_TRIM start=${START_OFFSET}s"
fi

verify_preview() {
  local f="$1"
  local dur w h level br
  dur="$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$f")"
  w="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=nk=1:nw=1 "$f")"
  h="$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=nk=1:nw=1 "$f")"
  level="$(ffprobe -v error -select_streams v:0 -show_entries stream=level -of default=nk=1:nw=1 "$f")"
  br="$(ffprobe -v error -select_streams v:0 -show_entries stream=bit_rate -of default=nk=1:nw=1 "$f")"
  echo "VERIFY: duration=${dur}s size=${w}x${h} level=${level} bitrate=${br}"
  python3 - "$dur" "$w" "$h" <<'PY'
import sys
dur, w, h = float(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
ok = True
if not (15.0 <= dur <= 30.0):
    print(f"FAIL: duration {dur} not in 15–30"); ok = False
if (w, h) != (886, 1920):
    print(f"FAIL: resolution {w}x{h} != 886x1920"); ok = False
if ok:
    print("PASS: duration + resolution OK (Apple App Preview)")
else:
    sys.exit(1)
PY
}

# 默认：四幕切片 + dissolve 淡入淡出（勿整片超加速）
if [[ "${USE_ASSEMBLE:-1}" == "1" ]]; then
  echo "== assemble dissolve → $CAPTIONED =="
  SCENE_CUTS="${SCENE_CUTS:-}" \
    bash "$ROOT/scripts/assemble-aso-preview.sh" "$RAW" "$CAPTIONED"
  cp -f "$(dirname "$CAPTIONED")/moodmo-preview-zh-Hans-16s.mp4" "$FINAL" 2>/dev/null || true
  verify_preview "$CAPTIONED"
  ln -sf "$(basename "$CAPTIONED")" "$OUT_DIR/moodmo-preview-20s.mp4" 2>/dev/null || true
  ln -sf "$(basename "$CAPTIONED")" "$OUT_DIR/moodmo-preview-zh-Hans-20s.mp4" 2>/dev/null || true
else
  RAW_DUR="$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$RAW")"
  SPEED_FILTER="$(
    python3 - "$RAW_DUR" "$DURATION_S" "$START_OFFSET" <<'PY'
import sys
raw, want, start = float(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3])
usable = max(0.5, raw - start)
factor = min(1.0, want / usable)
print(f"setpts={factor:.6f}*PTS")
print(f"SPEED factor={factor:.4f} usable={usable:.2f}s → {want}s", file=sys.stderr)
PY
  )"
  ffmpeg -y -ss "$START_OFFSET" -i "$RAW" \
    -vf "${SPEED_FILTER},scale=886:1920:force_original_aspect_ratio=decrease,pad=886:1920:(ow-iw)/2:(oh-ih)/2:black,fps=30" \
    -t "$DURATION_S" \
    -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 \
    -b:v 11M -minrate 11M -maxrate 11M -bufsize 11M \
    -x264-params "nal-hrd=cbr:filler=1" \
    -movflags +faststart -an "$FINAL"
  ACT="$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$FINAL")"
  python3 - "$ACT" "$DURATION_S" "$FINAL" <<'PY' || true
import os, subprocess, sys
act, want, path = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
need = want - act
if need <= 0.05:
    raise SystemExit(0)
tmp = path + ".pad.mp4"
subprocess.check_call([
    "ffmpeg", "-y", "-i", path,
    "-vf", f"tpad=stop_mode=clone:stop_duration={need:.3f},fps=30,scale=886:1920",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.0",
    "-b:v", "11M", "-minrate", "11M", "-maxrate", "11M", "-bufsize", "11M",
    "-x264-params", "nal-hrd=cbr:filler=1",
    "-movflags", "+faststart", "-an", "-t", str(want), tmp,
])
os.replace(tmp, path)
print(f"PADDED +{need:.3f}s → {want}s")
PY
  verify_preview "$FINAL"
  if [[ "${SKIP_CAPTIONS:-0}" != "1" ]]; then
    FX_PACK="$FX_PACK" bash "$ROOT/scripts/compose-aso-captions.sh" "$FINAL" "$CAPTIONED"
  fi
fi

echo ""
echo "Done: App Preview ${DURATION_S}s FX=dissolve"
echo "  $RAW"
echo "  $FINAL"
echo "  $CAPTIONED  (upload this)"
echo "ASC: iPhone Dynamic Island medium -> Preview slot 1"
echo "Poster: ~2s weather + caption"
