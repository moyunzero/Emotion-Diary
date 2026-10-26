#!/usr/bin/env bash
# 从 raw 四幕切片 → dissolve 淡入淡出拼接 → 叠配文（无粉闪）
# 用法：
#   SCENE_CUTS="11:6,45:6,71:6,78:6" bash scripts/assemble-aso-preview.sh [raw.mp4] [out.mp4]
# SCENE_CUTS = start:srcDur 逗号分隔，共 4 段；每段 pad/裁到 ~4.1s，幕间 xfade 0.25s
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="${1:-$ROOT/app-store-submission/previews/moodmo-preview-raw.mp4}"
OUT="${2:-$ROOT/app-store-submission/previews/moodmo-preview-zh-Hans.mp4}"
OVER_DIR="$ROOT/app-store-submission/previews/caption-overlays"
TMP="${TMPDIR:-/tmp}/aso-assemble-$$"
XFADE="${XFADE_DUR:-0.28}"
SCENE_CUTS="${SCENE_CUTS:-}"

die() { echo "FAIL: $*" >&2; exit 1; }
command -v ffmpeg >/dev/null || die "需要 ffmpeg"
[[ -f "$RAW" ]] || die "缺少 raw: $RAW"
mkdir -p "$TMP" "$OVER_DIR"

# 确保配文图存在
FX_PACK=dissolve bash "$ROOT/scripts/compose-aso-captions.sh" /dev/null /dev/null 2>/dev/null || true
# compose 需要真实 input；单独生成 overlays
VENV="$ROOT/.tmp-aso-venv"
[[ -x "$VENV/bin/python" ]] || { python3 -m venv "$VENV"; "$VENV/bin/pip" install -q pillow; }
"$VENV/bin/python" - "$OVER_DIR" <<'PY'
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
out_dir = Path(sys.argv[1])
W, H = 886, 1920
candidates = [
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/Supplemental/Songti.ttc",
    "/Library/Fonts/Arial Unicode.ttf",
]
font_path = next((p for p in candidates if Path(p).exists()), None)
if not font_path:
    raise SystemExit("no CJK font")
try:
    font = ImageFont.truetype(font_path, 54, index=0)
except TypeError:
    font = ImageFont.truetype(font_path, 54)
for name, text in [
    ("01-weather.png", "用天气，读懂心情"),
    ("02-record.png", "几秒，记下此刻心情"),
    ("03-garden.png", "把情绪，种成一座花园"),
    ("04-timeline.png", "点开花盆，回看与 TA"),
]:
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x, y = (W - tw) // 2, int(H * 0.10)
    draw.rounded_rectangle([x-28, y-18, x+tw+28, y+th+18], radius=18, fill=(26,26,46,210))
    draw.text((x, y), text, font=font, fill=(255,255,255,255))
    img.save(out_dir / name)
PY

# 自动找四幕起点（按画面体积启发式）；可被 SCENE_CUTS 覆盖
if [[ -z "$SCENE_CUTS" ]]; then
  SCENE_CUTS="$(
    python3 - "$RAW" <<'PY'
import os, subprocess, sys
path = sys.argv[1]
dur = float(subprocess.check_output(
    ["ffprobe","-v","error","-show_entries","format=duration","-of","default=nk=1:nw=1",path], text=True))
sizes = []
for t in range(0, min(int(dur), 95), 1):
    out = f"/tmp/aso-a-{t}.png"
    subprocess.run(["ffmpeg","-y","-ss",str(t),"-i",path,"-vframes","1",out], capture_output=True)
    sz = os.path.getsize(out) if os.path.exists(out) else 0
    sizes.append((t, sz))
# 启发式：第一段 rich 起点；中段 record 偏小体积；后段 garden/timeline 再变大
rich = [t for t,s in sizes if s > 350000]
weather = rich[0] if rich else 8
# record：在 weather 后找体积回落区
record = weather + 8
for t,s in sizes:
    if t > weather + 5 and s < 280000:
        record = t
        break
# garden：record 后体积再升高
garden = record + 10
for t,s in sizes:
    if t > record + 5 and s > 380000:
        garden = t
        break
timeline = min(garden + 8, int(dur) - 6)
for t,s in sizes:
    if t > garden + 4 and s > 350000:
        timeline = t
# 每段取 7s 源，后期压/裁到够 xfade
print(f"{weather}:7,{record}:7,{garden}:7,{timeline}:7")
print(f"auto cuts weather={weather} record={record} garden={garden} timeline={timeline}", file=sys.stderr)
PY
  )"
fi

IFS=',' read -r C1 C2 C3 C4 <<<"$SCENE_CUTS"
SEG_DUR=4.15  # 略长，供 xfade 吃掉 ~0.28*3

mkseg() {
  local spec=$1 name=$2
  local start="${spec%%:*}"
  local src="${spec##*:}"
  # -ss 放在 -i 后：保留模拟器低帧率录屏里的中间翻阅帧（前置 seek 会跳到关键帧变静帧）
  ffmpeg -y -i "$RAW" -ss "$start" -t "$src" \
    -vf "setpts=PTS-STARTPTS,fps=30,scale=886:1920:force_original_aspect_ratio=decrease,pad=886:1920:(ow-iw)/2:(oh-ih)/2:black,tpad=stop_mode=clone:stop_duration=${SEG_DUR}" \
    -t "$SEG_DUR" \
    -c:v libx264 -pix_fmt yuv420p -an "$TMP/$name.mp4"
}

mkseg "$C1" s1
mkseg "$C2" s2
mkseg "$C3" s3
mkseg "$C4" s4

# dissolve：三处 xfade；总长 ≈ 4*4.15 - 3*0.28 ≈ 15.76 → pad 到 16
OFF1="$(python3 -c "print(round($SEG_DUR - $XFADE, 3))")"
OFF2="$(python3 -c "print(round(2*$SEG_DUR - 2*$XFADE, 3))")"
OFF3="$(python3 -c "print(round(3*$SEG_DUR - 3*$XFADE, 3))")"

ffmpeg -y -i "$TMP/s1.mp4" -i "$TMP/s2.mp4" -i "$TMP/s3.mp4" -i "$TMP/s4.mp4" \
  -filter_complex "\
[0:v][1:v]xfade=transition=fade:duration=${XFADE}:offset=${OFF1}[v01];\
[v01][2:v]xfade=transition=fade:duration=${XFADE}:offset=${OFF2}[v02];\
[v02][3:v]xfade=transition=fade:duration=${XFADE}:offset=${OFF3}[vx];\
[vx]tpad=stop_mode=clone:stop_duration=16,fps=30,trim=duration=16,setpts=PTS-STARTPTS[vout]" \
  -map "[vout]" -t 16 \
  -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 \
  -b:v 11M -minrate 11M -maxrate 11M -bufsize 11M \
  -x264-params "nal-hrd=cbr:filler=1" -an "$TMP/joined.mp4"

# 配文时间窗对齐四幕（含 dissolve 重叠）
ffmpeg -y -i "$TMP/joined.mp4" \
  -i "$OVER_DIR/01-weather.png" \
  -i "$OVER_DIR/02-record.png" \
  -i "$OVER_DIR/03-garden.png" \
  -i "$OVER_DIR/04-timeline.png" \
  -filter_complex "\
[0:v]fps=30[base];\
[base][1:v]overlay=0:0:enable='between(t,0.12,3.75)'[v1];\
[v1][2:v]overlay=0:0:enable='between(t,4.15,7.75)'[v2];\
[v2][3:v]overlay=0:0:enable='between(t,8.15,11.75)'[v3];\
[v3][4:v]overlay=0:0:enable='between(t,12.15,15.85)'[vout]" \
  -map "[vout]" -t 16 \
  -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 \
  -b:v 11M -minrate 11M -maxrate 11M -bufsize 11M \
  -x264-params "nal-hrd=cbr:filler=1" \
  -movflags +faststart -an "$OUT"

cp "$TMP/joined.mp4" "$(dirname "$OUT")/moodmo-preview-zh-Hans-16s.mp4"
rm -rf "$TMP"
echo "OK: $OUT (dissolve xfade=${XFADE}s cuts=$SCENE_CUTS)"
ffprobe -v error -show_entries format=duration -show_entries stream=width,height,level,bit_rate -of default "$OUT"
