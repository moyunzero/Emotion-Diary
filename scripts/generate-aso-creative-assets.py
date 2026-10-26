#!/usr/bin/env python3
"""Compose App Store creative assets (product page header + search results)
from real iPhone screenshots. Specs:
  Header 21:9 → 3840×1646
  Search  3:2 → 3840×2560
No alpha channel in outputs (Apple requirement).
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ASSETS = Path(
    "/Users/moyun/.cursor/projects/Users-moyun-code-Emotion-Diary/assets"
)
OUT = Path(__file__).resolve().parents[1] / "app-store-submission" / "creative-assets"
ICON = Path(__file__).resolve().parents[1] / "assets" / "images" / "app-icon.png"

# Real screenshots (zh ~14:31, en ~14:33)
ZH = {
    "weather": ASSETS
    / "Screenshot_iPhone_17_2026-10-26_at_14.31.22-7da731e9-3a92-45c8-99aa-241f74761b11.png",
    "record": ASSETS
    / "Screenshot_iPhone_17_2026-10-26_at_14.31.33-261193ac-ba42-4829-98af-59da43155db4.png",
    "garden": ASSETS
    / "Screenshot_iPhone_17_2026-10-26_at_14.31.39-f9ec53fd-0871-406e-b748-384c1ea568fd.png",
    "relation": ASSETS
    / "Screenshot_iPhone_17_2026-10-26_at_14.31.55-d25224ac-05e2-42a0-8871-94b907c87675.png",
    "review": ASSETS
    / "Screenshot_iPhone_17_2026-10-26_at_14.31.43-2ef93e65-2679-4b21-9c6e-5a514190cd93.png",
}
EN = {
    "weather": ASSETS
    / "Screenshot_iPhone_17_2026-10-26_at_14.33.17-8f0dfcea-558e-4620-be6e-2a27fae9d1d2.png",
    "record": ASSETS
    / "Screenshot_iPhone_17_2026-10-26_at_14.33.22-cd94d13b-e08f-4dbb-8eb5-1f4d51f591bd.png",
    "garden": ASSETS
    / "Screenshot_iPhone_17_2026-10-26_at_14.33.26-854554e2-b54c-4d57-826b-68f1de20e638.png",
    "relation": ASSETS
    / "Screenshot_iPhone_17_2026-10-26_at_14.33.36-a4d3c1e0-5a1d-4452-b3fe-560ca8c9899a.png",
}

PINGFANG = (
    "/System/Library/AssetsV2/com_apple_MobileAsset_Font8/"
    "86ba2c91f017a3749571a82f2c6d890ac7ffb2fb.asset/AssetData/PingFang.ttc"
)
HEITI = "/System/Library/Fonts/STHeiti Medium.ttc"
SFNS = "/System/Library/Fonts/SFNS.ttf"
HELV = "/System/Library/Fonts/HelveticaNeue.ttc"
ARIALU = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"

BG_TOP = (255, 246, 248)  # soft blush
BG_BOT = (255, 228, 234)
ACCENT = (251, 113, 133)  # rose
TEXT = (55, 48, 56)
TEXT_MUTED = (120, 100, 110)
WHITE = (255, 255, 255)


def font(path: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size=size, index=index)
    except OSError:
        return ImageFont.truetype(ARIALU, size=size)


def zh_fonts(title: int, body: int, brand: int):
    # PingFang SC Semibold≈6, Medium≈5, Regular≈0 (varies by TTC)
    return (
        font(PINGFANG, brand, 6),
        font(PINGFANG, title, 6),
        font(PINGFANG, body, 0),
    )


def en_fonts(title: int, body: int, brand: int):
    return (
        font(SFNS, brand),
        font(SFNS, title),
        font(HELV, body, 0),
    )


def vertical_gradient(size: tuple[int, int], top: tuple, bot: tuple) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size, top)
    px = img.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        for x in range(w):
            px[x, y] = (r, g, b)
    return img


def soft_blobs(base: Image.Image) -> Image.Image:
    """Add soft decorative orbs (no hard AI-template look)."""
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    w, h = base.size
    blobs = [
        (int(w * 0.78), int(h * -0.05), int(w * 0.45), (255, 182, 193, 70)),
        (int(w * -0.1), int(h * 0.55), int(w * 0.4), (255, 210, 220, 80)),
        (int(w * 0.55), int(h * 0.7), int(w * 0.35), (255, 200, 180, 50)),
    ]
    for cx, cy, r, color in blobs:
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color)
    overlay = overlay.filter(ImageFilter.GaussianBlur(80))
    return Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")


def round_rect_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius, fill=255)
    return mask


def phone_frame(shot: Image.Image, height: int, radius: int = 48) -> Image.Image:
    """Wrap screenshot in a white bezel + soft shadow."""
    ratio = shot.width / shot.height
    h = height
    w = int(h * ratio)
    shot = shot.resize((w, h), Image.Resampling.LANCZOS)

    bezel = 14
    outer_w, outer_h = w + bezel * 2, h + bezel * 2
    frame = Image.new("RGBA", (outer_w, outer_h), (0, 0, 0, 0))
    # device body
    body = Image.new("RGBA", (outer_w, outer_h), WHITE + (255,))
    body.putalpha(round_rect_mask((outer_w, outer_h), radius))
    frame = Image.alpha_composite(frame, body)

    # screen
    screen = shot.convert("RGBA")
    screen.putalpha(round_rect_mask((w, h), radius - 8))
    frame.paste(screen, (bezel, bezel), screen)

    # thin rose rim
    rim = Image.new("RGBA", (outer_w, outer_h), (0, 0, 0, 0))
    ImageDraw.Draw(rim).rounded_rectangle(
        (1, 1, outer_w - 2, outer_h - 2),
        radius,
        outline=ACCENT + (90,),
        width=3,
    )
    frame = Image.alpha_composite(frame, rim)
    return frame


def drop_shadow(img: Image.Image, blur: int = 28, offset: tuple[int, int] = (0, 18)) -> Image.Image:
    ox, oy = offset
    canvas = Image.new(
        "RGBA",
        (img.width + abs(ox) + blur * 2, img.height + abs(oy) + blur * 2),
        (0, 0, 0, 0),
    )
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    alpha = img.split()[-1]
    shadow_layer = Image.new("RGBA", img.size, (80, 40, 55, 90))
    shadow_layer.putalpha(alpha.point(lambda a: int(a * 0.55)))
    shadow = Image.alpha_composite(shadow, shadow_layer)
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    sx = blur + max(ox, 0)
    sy = blur + max(oy, 0)
    canvas.paste(shadow, (sx + ox, sy + oy), shadow)
    canvas.paste(img, (sx, sy), img)
    return canvas


def paste_rgba(base: Image.Image, overlay: Image.Image, xy: tuple[int, int]) -> None:
    base.paste(overlay, xy, overlay)


def fit_icon(size: int) -> Image.Image:
    icon = Image.open(ICON).convert("RGBA")
    # crop near-white background loosely by keeping non-white-ish pixels bounding box
    icon = icon.resize((size, size), Image.Resampling.LANCZOS)
    return icon


def draw_text_block(
    canvas: Image.Image,
    *,
    brand: str,
    headline: str,
    sub: str,
    origin: tuple[int, int],
    fonts: tuple,
    max_width: int,
    lang: str,
) -> None:
    brand_f, title_f, body_f = fonts
    draw = ImageDraw.Draw(canvas)
    x, y = origin

    icon = fit_icon(96 if lang == "zh" else 88)
    paste_rgba(canvas, icon, (x, y))
    draw.text((x + 112, y + 18), brand, font=brand_f, fill=TEXT)
    y += 130

    # headline — wrap if needed
    lines = wrap_text(headline, title_f, max_width)
    for line in lines:
        draw.text((x, y), line, font=title_f, fill=TEXT)
        y += int(title_f.size * 1.2)
    y += 18
    for line in wrap_text(sub, body_f, max_width):
        draw.text((x, y), line, font=body_f, fill=TEXT_MUTED)
        y += int(body_f.size * 1.35)


def wrap_text(text: str, fnt: ImageFont.ImageFont, max_width: int) -> list[str]:
    # Prefer explicit newlines; otherwise wrap by chars for CJK / words for EN
    if "\n" in text:
        return text.split("\n")
    if any("\u4e00" <= c <= "\u9fff" for c in text):
        lines, cur = [], ""
        for ch in text:
            trial = cur + ch
            if fnt.getlength(trial) <= max_width:
                cur = trial
            else:
                if cur:
                    lines.append(cur)
                cur = ch
        if cur:
            lines.append(cur)
        return lines or [text]
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if fnt.getlength(trial) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [text]


def rotate_keep(img: Image.Image, angle: float) -> Image.Image:
    return img.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)


def compose_header(lang: str, shots: dict[str, Path], copy: dict) -> Image.Image:
    W, H = 3840, 1646
    base = soft_blobs(vertical_gradient((W, H), BG_TOP, BG_BOT))
    canvas = base.convert("RGBA")

    fonts = zh_fonts(110, 48, 64) if lang == "zh" else en_fonts(104, 46, 60)
    draw_text_block(
        canvas,
        brand=copy["brand"],
        headline=copy["headline"],
        sub=copy["sub"],
        origin=(180, 420),
        fonts=fonts,
        max_width=1180,
        lang=lang,
    )

    # three phones fanned on the right
    keys = ["weather", "record", "garden"]
    heights = [1280, 1360, 1280]
    angles = [-9, 0, 9]
    # positions tuned for 21:9
    centers = [(2100, 860), (2680, 820), (3280, 860)]

    layers = []
    for key, ht, ang, (cx, cy) in zip(keys, heights, angles, centers):
        phone = phone_frame(Image.open(shots[key]), ht, radius=56)
        phone = drop_shadow(phone, blur=36, offset=(0, 24))
        phone = rotate_keep(phone, ang)
        layers.append((phone, cx - phone.width // 2, cy - phone.height // 2))

    # draw back → front (left, right, center)
    order = [0, 2, 1]
    for i in order:
        phone, x, y = layers[i]
        paste_rgba(canvas, phone, (x, y))

    return canvas.convert("RGB")


def compose_search(lang: str, shots: dict[str, Path], copy: dict) -> Image.Image:
    W, H = 3840, 2560  # 3:2 max
    base = soft_blobs(vertical_gradient((W, H), BG_TOP, BG_BOT))
    canvas = base.convert("RGBA")

    fonts = zh_fonts(120, 52, 68) if lang == "zh" else en_fonts(112, 50, 64)
    # centered brand block near top
    brand_f, title_f, body_f = fonts
    draw = ImageDraw.Draw(canvas)

    icon = fit_icon(120)
    brand = copy["brand"]
    headline = copy["search_headline"]
    sub = copy["search_sub"]

    # measure for centering
    bw = brand_f.getlength(brand) + 140
    hx = (W - max(title_f.getlength(line) for line in wrap_text(headline, title_f, 3000))) / 2
    # icon + brand centered
    total_brand_w = 120 + 24 + brand_f.getlength(brand)
    bx = int((W - total_brand_w) / 2)
    by = 220
    paste_rgba(canvas, icon, (bx, by))
    draw.text((bx + 144, by + 28), brand, font=brand_f, fill=TEXT)

    y = by + 160
    for line in wrap_text(headline, title_f, 3200):
        tw = title_f.getlength(line)
        draw.text((int((W - tw) / 2), y), line, font=title_f, fill=TEXT)
        y += int(title_f.size * 1.2)
    y += 12
    for line in wrap_text(sub, body_f, 2800):
        tw = body_f.getlength(line)
        draw.text((int((W - tw) / 2), y), line, font=body_f, fill=TEXT_MUTED)
        y += int(body_f.size * 1.35)

    # two phones side by side (relation garden + weather) — strongest search thumbnails
    left = phone_frame(Image.open(shots["relation"]), 1480, radius=60)
    right = phone_frame(Image.open(shots["weather"]), 1480, radius=60)
    left = drop_shadow(left, blur=40, offset=(0, 28))
    right = drop_shadow(right, blur=40, offset=(0, 28))

    gap = 80
    total = left.width + right.width + gap
    start_x = (W - total) // 2
    phone_y = H - left.height - 160
    paste_rgba(canvas, left, (start_x, phone_y))
    paste_rgba(canvas, right, (start_x + left.width + gap, phone_y))

    return canvas.convert("RGB")


COPY = {
    "zh": {
        "brand": "心晴MO",
        "headline": "把情绪，种成一座花园",
        "sub": "天气读懂心情 · 花园看见关系 · 本地优先更安心",
        "search_headline": "情绪日记与心灵花园",
        "search_sub": "记一笔 · 关系花园 · 往年今日",
    },
    "en": {
        "brand": "MoodMO",
        "headline": "Grow a garden\nfrom your feelings",
        "sub": "Weather for moods · Garden for relationships · Private by default",
        "search_headline": "Mood journal & Mind Garden",
        "search_sub": "Capture · Relationship garden · On This Day",
    },
}


def save_rgb(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    # flatten any residual alpha → solid white bg, then RGB
    if img.mode != "RGB":
        bg = Image.new("RGB", img.size, WHITE)
        if img.mode == "RGBA":
            bg.paste(img, mask=img.split()[-1])
            img = bg
        else:
            img = img.convert("RGB")
    img.save(path, format="PNG", optimize=True)
    print(f"wrote {path}  {img.size[0]}x{img.size[1]}  mode={img.mode}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for lang, shots in (("zh", ZH), ("en", EN)):
        header = compose_header(lang, shots, COPY[lang])
        search = compose_search(lang, shots, COPY[lang])
        save_rgb(header, OUT / f"header-{lang}-21x9-3840x1646.png")
        save_rgb(search, OUT / f"search-{lang}-3x2-3840x2560.png")
    # small preview thumbs for quick glance in Finder
    for p in OUT.glob("*.png"):
        if p.name.startswith("preview-"):
            continue
        im = Image.open(p)
        thumb = im.copy()
        thumb.thumbnail((960, 960), Image.Resampling.LANCZOS)
        save_rgb(thumb, OUT / f"preview-{p.stem}.png")


if __name__ == "__main__":
    main()
