/**
 * 默认头像：治愈系 pastel 纯图形 SVG（无文字），与心晴 MO「情绪花园」温柔可爱定位一致。
 * 输出为 SVG data URI；圆形容器内应使用 contentFit="contain" + contentPosition="center"。
 */

const toDataUri = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

/** 粉系渐变 + 柔光爱心 */
const preset0 = toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
<defs>
  <linearGradient id="p0a" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#FFE4EC"/>
    <stop offset="100%" stop-color="#FDA4AF"/>
  </linearGradient>
</defs>
<circle cx="100" cy="100" r="100" fill="url(#p0a)"/>
<circle cx="100" cy="95" r="42" fill="#FFFFFF" opacity="0.35"/>
<path d="M100 152 C 62 128 42 98 42 72 C 42 52 56 38 76 38 C 88 38 98 46 100 50 C 102 46 112 38 124 38 C 144 38 158 52 158 72 C 158 98 138 128 100 152 Z" fill="#FFF5F7" stroke="#FB7185" stroke-width="3"/>
</svg>`);

/** 暖黄 + 小太阳 */
const preset1 = toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
<defs>
  <radialGradient id="p1a" cx="50%" cy="45%" r="70%">
    <stop offset="0%" stop-color="#FEF9C3"/>
    <stop offset="100%" stop-color="#FDE047"/>
  </radialGradient>
</defs>
<circle cx="100" cy="100" r="100" fill="url(#p1a)"/>
<circle cx="100" cy="100" r="38" fill="#FBBF24" stroke="#F59E0B" stroke-width="3"/>
<g stroke="#F59E0B" stroke-width="5" stroke-linecap="round">
  <line x1="100" y1="28" x2="100" y2="48"/>
  <line x1="100" y1="152" x2="100" y2="172"/>
  <line x1="28" y1="100" x2="48" y2="100"/>
  <line x1="152" y1="100" x2="172" y2="100"/>
  <line x1="48" y1="48" x2="62" y2="62"/>
  <line x1="138" y1="138" x2="152" y2="152"/>
  <line x1="152" y1="48" x2="138" y2="62"/>
  <line x1="48" y1="152" x2="62" y2="138"/>
</g>
</svg>`);

/** 薄荷绿 + 小芽叶片 */
const preset2 = toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
<defs>
  <linearGradient id="p2a" x1="0%" y1="100%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#D1FAE5"/>
    <stop offset="100%" stop-color="#6EE7B7"/>
  </linearGradient>
</defs>
<circle cx="100" cy="100" r="100" fill="url(#p2a)"/>
<path d="M100 155 L100 95" stroke="#059669" stroke-width="6" stroke-linecap="round"/>
<ellipse cx="78" cy="88" rx="28" ry="18" fill="#34D399" transform="rotate(-35 78 88)"/>
<ellipse cx="122" cy="88" rx="28" ry="18" fill="#10B981" transform="rotate(35 122 88)"/>
<ellipse cx="100" cy="72" rx="22" ry="14" fill="#6EE7B7" transform="rotate(0 100 72)"/>
</svg>`);

/** 天蓝 + 云朵与小雨点 */
const preset3 = toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
<defs>
  <linearGradient id="p3a" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#E0F2FE"/>
    <stop offset="100%" stop-color="#BAE6FD"/>
  </linearGradient>
</defs>
<circle cx="100" cy="100" r="100" fill="url(#p3a)"/>
<path d="M55 118 C 45 118 38 110 40 100 C 38 88 48 78 60 78 C 62 62 78 50 96 52 C 108 38 132 42 142 58 C 158 56 172 72 170 88 C 172 104 158 118 140 118 Z" fill="#FFFFFF" stroke="#38BDF8" stroke-width="3"/>
<circle cx="72" cy="138" r="6" fill="#38BDF8" opacity="0.85"/>
<circle cx="100" cy="148" r="6" fill="#38BDF8" opacity="0.85"/>
<circle cx="128" cy="138" r="6" fill="#38BDF8" opacity="0.85"/>
</svg>`);

/** 樱花粉 + 五瓣花 */
const preset4 = toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
<defs>
  <radialGradient id="p4a" cx="50%" cy="50%" r="65%">
    <stop offset="0%" stop-color="#FCE7F3"/>
    <stop offset="100%" stop-color="#F9A8D4"/>
  </radialGradient>
</defs>
<circle cx="100" cy="100" r="100" fill="url(#p4a)"/>
<g transform="translate(100 100)">
  <circle cx="0" cy="-32" r="22" fill="#FBCFE8" stroke="#EC4899" stroke-width="2"/>
  <circle cx="30" cy="-10" r="22" fill="#FBCFE8" stroke="#EC4899" stroke-width="2"/>
  <circle cx="18" cy="26" r="22" fill="#FBCFE8" stroke="#EC4899" stroke-width="2"/>
  <circle cx="-18" cy="26" r="22" fill="#FBCFE8" stroke="#EC4899" stroke-width="2"/>
  <circle cx="-30" cy="-10" r="22" fill="#FBCFE8" stroke="#EC4899" stroke-width="2"/>
  <circle cx="0" cy="0" r="18" fill="#FDF2F8" stroke="#DB2777" stroke-width="2"/>
</g>
</svg>`);

/** 薰衣草紫 + 星星与光点 */
const preset5 = toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
<defs>
  <linearGradient id="p5a" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#EDE9FE"/>
    <stop offset="100%" stop-color="#C4B5FD"/>
  </linearGradient>
</defs>
<circle cx="100" cy="100" r="100" fill="url(#p5a)"/>
<path d="M100 52 L108 78 L136 78 L114 94 L122 120 L100 104 L78 120 L86 94 L64 78 L92 78 Z" fill="#FEF3C7" stroke="#A78BFA" stroke-width="2"/>
<circle cx="52" cy="72" r="8" fill="#FFFFFF" opacity="0.9"/>
<circle cx="148" cy="88" r="6" fill="#FFFFFF" opacity="0.85"/>
<circle cx="130" cy="140" r="7" fill="#FFFFFF" opacity="0.8"/>
</svg>`);

export const AVATAR_PRESETS = [preset0, preset1, preset2, preset3, preset4, preset5];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** 无头像 URL 时使用；按昵称稳定映射到某一预设，无昵称用第一套 */
export const getDefaultAvatar = (name?: string) => {
  const key = name?.trim() ?? "";
  if (!key) return AVATAR_PRESETS[0];
  return AVATAR_PRESETS[hashString(key) % AVATAR_PRESETS.length];
};

export function isSvgAvatarDataUri(uri: string | undefined | null): boolean {
  return typeof uri === "string" && uri.startsWith("data:image/svg+xml");
}
