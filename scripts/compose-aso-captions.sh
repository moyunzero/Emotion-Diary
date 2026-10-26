#!/usr/bin/env bash
# 给 App Preview 叠加中文大字（静音可读）
# 幕间转场请用 assemble-aso-preview.sh 的 dissolve（淡入淡出）；此处不再叠粉闪
# 用法：bash scripts/compose-aso-captions.sh [input.mp4] [output.mp4]
# 环境：FX_PACK=dissolve|jump|fade-pink（默认 dissolve；fade-pink 仅兼容旧流程）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IN="${1:-$ROOT/app-store-submission/previews/moodmo-preview-zh-Hans-16s.mp4}"
OUT="${2:-$ROOT/app-store-submission/previews/moodmo-preview-zh-Hans.mp4}"
OVER_DIR="$ROOT/app-store-submission/previews/caption-overlays"
VENV="$ROOT/.tmp-aso-venv"
FX_PACK="${FX_PACK:-dissolve}"

die() { echo "FAIL: $*" >&2; exit 1; }
command -v ffmpeg >/dev/null || die "需要 ffmpeg"
[[ -f "$IN" ]] || die "缺少输入: $IN"

if [[ ! -x "$VENV/bin/python" ]]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q pillow
fi

mkdir -p "$OVER_DIR"

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

def load_font(size: int):
    try:
        return ImageFont.truetype(font_path, size, index=0)
    except TypeError:
        return ImageFont.truetype(font_path, size)

captions = [
    ("01-weather.png", "用天气，读懂心情"),
    ("02-record.png", "几秒，记下此刻心情"),
    ("03-garden.png", "把情绪，种成一座花园"),
    ("04-timeline.png", "点开花盆，回看与 TA"),
]

font = load_font(54)
for name, text in captions:
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (W - tw) // 2
    y = int(H * 0.10)
    pad_x, pad_y = 28, 18
    draw.rounded_rectangle(
        [x - pad_x, y - pad_y, x + tw + pad_x, y + th + pad_y],
        radius=18,
        fill=(26, 26, 46, 210),
    )
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    img.save(out_dir / name)
    print("wrote", name)

# 品牌粉闪底（fade-pink）
pink = Image.new("RGBA", (W, H), (255, 107, 138, 220))
pink.save(out_dir / "fx-pink.png")
print("wrote fx-pink.png")
PY

DUR="$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$IN")"
TARGET="$(python3 -c "d=float('$DUR'); print(min(30.0, max(15.0, round(d,3))))")"

# 16s 四幕配文窗；fade-pink 在 4 / 8 / 12s 附近闪 ~0.22s
case "$FX_PACK" in
  fade-pink)
    FILTER="\
[0:v]fps=30,scale=886:1920:force_original_aspect_ratio=decrease,pad=886:1920:(ow-iw)/2:(oh-ih)/2:black[base];\
[base][1:v]overlay=0:0:enable='between(t,0.15,3.85)'[v1];\
[v1][2:v]overlay=0:0:enable='between(t,4.2,7.85)'[v2];\
[v2][3:v]overlay=0:0:enable='between(t,8.2,11.85)'[v3];\
[v3][4:v]overlay=0:0:enable='between(t,12.2,15.85)'[v4];\
[v4][5:v]overlay=0:0:enable='between(t,3.88,4.12)+between(t,7.88,8.12)+between(t,11.88,12.12)'[vout]"
    EXTRA_IN=(-i "$OVER_DIR/fx-pink.png")
    ;;
  dissolve|jump|*)
    FILTER="\
[0:v]fps=30,scale=886:1920:force_original_aspect_ratio=decrease,pad=886:1920:(ow-iw)/2:(oh-ih)/2:black[base];\
[base][1:v]overlay=0:0:enable='between(t,0.15,3.9)'[v1];\
[v1][2:v]overlay=0:0:enable='between(t,4.1,7.9)'[v2];\
[v2][3:v]overlay=0:0:enable='between(t,8.1,11.9)'[v3];\
[v3][4:v]overlay=0:0:enable='between(t,12.1,15.9)'[vout]"
    EXTRA_IN=()
    ;;
esac

ffmpeg -y \
  -i "$IN" \
  -i "$OVER_DIR/01-weather.png" \
  -i "$OVER_DIR/02-record.png" \
  -i "$OVER_DIR/03-garden.png" \
  -i "$OVER_DIR/04-timeline.png" \
  "${EXTRA_IN[@]}" \
  -filter_complex "$FILTER" \
  -map "[vout]" -t "$TARGET" \
  -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 \
  -b:v 11M -minrate 11M -maxrate 11M -bufsize 11M \
  -x264-params "nal-hrd=cbr:filler=1" \
  -movflags +faststart -an "$OUT"

echo "OK: $OUT (FX_PACK=$FX_PACK)"
ffprobe -v error -show_entries format=duration,bit_rate -show_entries stream=width,height,level -of default "$OUT"
