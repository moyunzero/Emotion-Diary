/**
 * 颜色常量
 * 语义角色对齐 sketch default.css（粉纸玫瑰）；旧键为别名（D-03），非第二套调色板。
 */

export const COLORS_LIGHT = {
  // —— Semantic roles (default.css / D-01 · D-02) ——
  bg: '#FFF8F9',
  surface: '#FFFFFF',
  surface2: '#FCEEF1',
  hairline: '#F0E0E4',
  brand: '#C2416B',
  brandPressed: '#A8355B',
  brandSoft: '#FCE4EB',

  // Legacy aliases → same literals as brand / brandPressed / brandSoft (D-03)
  primary: '#C2416B',
  primaryDark: '#A8355B',
  /** Soft wash — historically candy primaryLight; alias brandSoft (Pitfall 2) */
  primaryLight: '#FCE4EB',
  
  // 情绪等级颜色（粉系递进，与疗愈基调一致）
  mood: {
    level1: '#FFF1F2',
    level2: '#FECDD3',
    level3: '#FDA4AF',
    level4: '#FB7185',
    level5: '#E11D48',
    /** 记一笔 / 卡片图标色：同一玫瑰色相由浅到深，勿混用紫/蓝 */
    icon: {
      level1: '#FDA4AF',
      level2: '#F9A8B4',
      level3: '#FB7185',
      level4: '#F43F5E',
      level5: '#E11D48',
    },
  },
  
  // Semantic status (sketch --resolve / --burn / --danger)
  danger: '#C93A3A',
  success: '#2F8F6A',
  warning: '#C2541D',
  error: '#C93A3A',
  info: '#5B7FA6',

  // submit → danger; accent → resolve (was candy/Tailwind leftovers)
  submit: '#C93A3A',
  accent: '#2F8F6A',

  // 录音 UI — brand chrome, not purple wash
  audio: {
    primary: '#A8355B',
    surface: '#FCE4EB',
  },
  
  // 中性色（保留灰度阶；语义文字见 text.*）
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // 背景色 — page aliases semantic bg (D-03); surface washes → surface / surface2
  background: {
    primary: '#FFFFFF',
    secondary: '#FCEEF1',
    tertiary: '#FCE4EB',
    page: '#FFF8F9',
    gradientStart: '#FFF8F9',
    gradientEnd: '#FCEEF1',
  },

  // Tab 导航 — active aliases brandPressed
  tab: {
    active: '#A8355B',
    inactive: '#8C8084',
    barBg: '#FFFFFF',
  },

  scrim: 'rgba(0, 0, 0, 0.45)',
  alertBg: 'rgba(255, 255, 255, 0.94)',
  tabBarBg: '#FFFFFF',

  // 页面氛围叠层 — sketch weather fills (no purple wash)
  atmosphere: {
    sunny: '#FBF3E4',
    cloudy: '#F0F2F4',
    rainy: '#ECF2F8',
    stormy: '#F2EDF6',
  },

  // 关系天气卡片 — four-hue sketch (amber/grey/blue/mauve)
  weatherCard: {
    sunny: {
      bg: '#FBF3E4',
      text: '#2B2326',
      icon: '#B57A12',
    },
    cloudy: {
      bg: '#F0F2F4',
      text: '#2B2326',
      icon: '#7A8794',
    },
    rainy: {
      bg: '#ECF2F8',
      text: '#2B2326',
      icon: '#5B7FA6',
    },
    stormy: {
      bg: '#F2EDF6',
      text: '#2B2326',
      icon: '#7A5C8E',
    },
  },

  ritual: {
    resolve: '#2F8F6A',
    burn: '#C2541D',
  },
  
  text: {
    primary: '#2B2326',
    secondary: '#6B5F63',
    tertiary: '#8C8084',
    inverse: '#FFFFFF', // --on-brand
  },
  
  // border.light aliases hairline
  border: {
    light: '#F0E0E4',
    medium: '#E5E7EB',
    dark: '#8C8084',
  },
  
  shadow: {
    primary: '#000000',
    submit: '#C2416B',
  },
  
  // Weather icon + fill (sketch --w-*; not candy purple)
  weather: {
    sunny: { icon: '#B57A12', bg: '#FBF3E4' },
    cloudy: { icon: '#7A8794', bg: '#F0F2F4' },
    rainy: { icon: '#5B7FA6', bg: '#ECF2F8' },
    stormy: { icon: '#7A5C8E', bg: '#F2EDF6' },
  },
  
  deadline: {
    today: {
      bg: '#FCE4EB',
      text: '#C93A3A',
    },
    week: {
      bg: '#FBF3E4',
      text: '#C2541D',
    },
    month: {
      bg: '#FCEEF1',
      text: '#C2416B',
    },
    later: {
      bg: '#F0F2F4',
      text: '#6B5F63',
    },
    self: {
      bg: '#F3F4F6',
      text: '#2B2326',
    },
  },
} as const;

/** Pink-ink night palette — literals from night.css / night-role-map.md */
export const COLORS_NIGHT = {
  bg: '#1C1418',
  surface: '#271C22',
  surface2: '#32242B',
  hairline: '#3F3138',
  brand: '#F08AA8',
  brandPressed: '#E4769A',
  brandSoft: '#3A2229',

  primary: '#F08AA8',
  primaryDark: '#E4769A',
  primaryLight: '#3A2229',

  // RESEARCH A3: mood ladder — rose tints on plum (not light literals)
  mood: {
    level1: '#32242B',
    level2: '#3A2229',
    level3: '#5C3A45',
    level4: '#C2416B',
    level5: '#E4769A',
    icon: {
      level1: '#917F87',
      level2: '#C4B4BB',
      level3: '#F08AA8',
      level4: '#E4769A',
      level5: '#F08AA8',
    },
  },

  danger: '#F07A7A',
  success: '#6FCFA5',
  warning: '#F08A55',
  error: '#F07A7A',
  info: '#8FB0D3',

  submit: '#F07A7A',
  accent: '#6FCFA5',

  audio: {
    primary: '#E4769A',
    surface: '#3A2229',
  },

  gray: {
    50: '#271C22',
    100: '#32242B',
    200: '#3F3138',
    300: '#5C4A52',
    400: '#917F87',
    500: '#C4B4BB',
    600: '#C4B4BB',
    700: '#F6EEF1',
    800: '#F6EEF1',
    900: '#F6EEF1',
  },

  background: {
    primary: '#271C22',
    secondary: '#32242B',
    tertiary: '#3A2229',
    page: '#1C1418',
    gradientStart: '#1C1418',
    gradientEnd: '#271C22',
  },

  tab: {
    active: '#F08AA8',
    inactive: '#917F87',
    barBg: 'rgba(39, 28, 34, 0.82)',
  },

  scrim: 'rgba(0, 0, 0, 0.52)',
  alertBg: 'rgba(50, 36, 43, 0.94)',
  tabBarBg: 'rgba(39, 28, 34, 0.82)',

  atmosphere: {
    sunny: '#2B2419',
    cloudy: '#22262A',
    rainy: '#1E2530',
    stormy: '#261F2C',
  },

  weatherCard: {
    sunny: {
      bg: '#2B2419',
      text: '#F6EEF1',
      icon: '#E3B45C',
    },
    cloudy: {
      bg: '#22262A',
      text: '#F6EEF1',
      icon: '#A3AEB8',
    },
    rainy: {
      bg: '#1E2530',
      text: '#F6EEF1',
      icon: '#8FB0D3',
    },
    stormy: {
      bg: '#261F2C',
      text: '#F6EEF1',
      icon: '#B39AC8',
    },
  },

  ritual: {
    resolve: '#6FCFA5',
    burn: '#F08A55',
  },

  text: {
    primary: '#F6EEF1',
    secondary: '#C4B4BB',
    tertiary: '#917F87',
    inverse: '#2A1018',
  },

  border: {
    light: '#3F3138',
    medium: '#5C4A52',
    dark: '#917F87',
  },

  shadow: {
    primary: '#000000',
    submit: '#F08AA8',
  },

  weather: {
    sunny: { icon: '#E3B45C', bg: '#2B2419' },
    cloudy: { icon: '#A3AEB8', bg: '#22262A' },
    rainy: { icon: '#8FB0D3', bg: '#1E2530' },
    stormy: { icon: '#B39AC8', bg: '#261F2C' },
  },

  // RESEARCH A3: deadline chips — plum/rose family
  deadline: {
    today: {
      bg: '#3A2229',
      text: '#F07A7A',
    },
    week: {
      bg: '#2B2419',
      text: '#F08A55',
    },
    month: {
      bg: '#32242B',
      text: '#F08AA8',
    },
    later: {
      bg: '#22262A',
      text: '#C4B4BB',
    },
    self: {
      bg: '#271C22',
      text: '#F6EEF1',
    },
  },
} as const;

export type ColorPalette = typeof COLORS_LIGHT | typeof COLORS_NIGHT;

/** @deprecated Prefer getColors(effectiveScheme) or COLORS_LIGHT — legacy static import alias */
export const COLORS = COLORS_LIGHT;

export type ResolvedColorScheme = 'light' | 'night';

export function getColors(scheme: ResolvedColorScheme): ColorPalette {
  return (scheme === 'night' ? COLORS_NIGHT : COLORS_LIGHT) as ColorPalette;
}

/**
 * Design tokens — VISUAL-SYSTEM §四–五 / D-07·D-08·D-09.
 * Spacing legal set: 4/8/12/16/24/32/48 + pageX 20.
 * Pitfall 1: DESIGN_TOKENS.spacing.md (12) ≠ SPACING.md (16) in spacing.ts.
 */
const SHADOW_NONE = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
} as const;

/** Sheet / Toast / drag float only — not card default (D-09). */
const SHADOW_FLOAT = {
  shadowColor: 'rgb(67, 28, 42)',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 28,
  elevation: 8,
} as const;

export const DESIGN_TOKENS = {
  borderRadius: {
    /** Legacy micro → nearest chrome r-sm */
    xs: 8,
    small: 8,
    medium: 14,
    large: 14,
    xl: 22,
    xxl: 22,
    full: 9999,
    sm: 8,
    md: 14,
    lg: 22,
  },
  spacing: {
    xs: 4,
    sm: 8,
    /** Card / block gap — NOT SPACING.md (16). See spacing.ts + Pitfall 1. */
    md: 12,
    lg: 16,
    /** Legacy page gutter; prefer pageX for new code. */
    xl: 20,
    pageX: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
  },
  fontSize: {
    /** Footnote min 12 (VISUAL-SYSTEM); was product 10. */
    xs: 12,
    sm: 12,
    base: 14,
    md: 16,
    lg: 17,
    xl: 20,
    xxl: 22,
    xxxl: 32,
    footnote: 12,
    caption: 14,
    body: 16,
    subtitle: 17,
    title: 20,
    display: 32,
  },
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  shadow: {
    none: SHADOW_NONE,
    /** Card default: hairline / no elevation (D-09). */
    sm: SHADOW_NONE,
    md: SHADOW_NONE,
    /** Float reserved for sheet / Toast / drag. */
    lg: SHADOW_FLOAT,
    xl: SHADOW_FLOAT,
    float: SHADOW_FLOAT,
  },
} as const;

/**
 * D-11 brand-sentence serif — system Songti only (zero webfont assets).
 * Use only at: weather narrative · review closing · share card title.
 * Pure string (no react-native import) so Jest can load this module without RN transform.
 * At runtime use Platform.select PostScript `SongtiSC-Regular` on iOS (WeatherStation BRAND_SERIF pattern);
 * family name `Songti SC` often no-ops → ugly UI font. Missing faces fall back to platform UI font.
 */
export const SERIF_STACK = 'Songti SC';

/**
 * 透明度辅助函数
 * 将十六进制颜色转换为带透明度的颜色
 */
export const withOpacity = (color: string, opacity: number): string => {
  const hex = color.replace('#', '');
  const r = Number.parseInt(hex.substring(0, 2), 16);
  const g = Number.parseInt(hex.substring(2, 4), 16);
  const b = Number.parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
