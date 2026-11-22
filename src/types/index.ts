export type UserTier = 'free' | 'pro' | 'business' | 'unlimited';

export interface UserProfile {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  tier: UserTier;
  is_admin: boolean;
  is_blocked?: boolean;
  role?: 'owner' | 'admin' | 'user';
  exports_today: number;
  exports_today_date: string;
  created_at: string;
}

export interface SystemSettings {
  monetization_mode: 'free' | 'paid';
  watermark_on_free_tier: boolean;
  daily_export_limit_free: number;
  allow_registration: boolean;
  updated_at: string;
}

export interface WordTimestamp {
  text: string;
  start: number; // in seconds
  end: number;   // in seconds
  customColor?: string;
  customWeight?: number;
  isHighlighted?: boolean;
  customEffect?: 'none' | 'glow' | 'box' | 'underline' | 'badge';
}

export interface CaptionSegment {
  id: string;
  idx: number;
  start_time: number; // in seconds
  end_time: number;   // in seconds
  text: string;
  words?: WordTimestamp[];
  positionX?: number; // percentage (0 - 100), default 50 (center)
  positionY?: number; // percentage (0 - 100), default 80 (bottom)
}

export type VideoFrameRatio = '9:16' | '1:1' | '16:9';
export type CaptionPosition = 'top' | 'center' | 'bottom' | 'custom';
export type TextCase = 'none' | 'uppercase' | 'capitalize' | 'lowercase';

// 9 Subtitle Animations
export type SubtitleAnimation =
  | 'fade'
  | 'slide'
  | 'zoom'
  | 'pop'
  | 'bounce'
  | 'word_reveal'
  | 'typewriter'
  | 'blur'
  | 'wipe';

export type TextAnimationStyle =
  | SubtitleAnimation
  | 'pop_bounce'
  | 'kinetic_3d'
  | 'glitch_shake'
  | 'wavy_float'
  | 'neon_pulse'
  | 'fire_shimmer'
  | 'smooth_fade_rise'
  | 'soft_blur_focus'
  | 'subtle_float'
  | 'editorial_glow';

export type LetterSpacing = 'tight' | 'normal' | 'wide' | 'widest';
export type BackdropStyle = 'none' | 'frosted' | 'minimal_strip' | 'luxury_box' | 'subtle_blur' | 'custom_box';
export type ShadowStyle = 'soft_cinematic' | 'luxury_glow' | 'subtle_depth' | 'clean_cut' | 'neon_glow' | 'none';

// Visual decorative element layer (movable, editable & burnable anywhere on canvas)
export interface VisualElement {
  id: string;
  type: 'badge' | 'box' | 'bar' | 'sticker';
  text?: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width?: number; // px or %
  height?: number;
  fontSize?: number; // px scale (10 - 48)
  fontWeight?: number;
  rotation?: number; // degrees (-45 to 45)
  borderRadius?: number; // px
  opacity?: number; // 0.1 - 1
  textColor?: string;
  bgColor: string;
  borderColor?: string;
  zIndex: number;
}

export type StudioTabId = 'subtitles' | 'templates' | 'properties' | 'presets';

export interface UICustomizationConfig {
  // Brand & Editable Texts
  brandName: string;
  brandSubtext: string;
  heroBadgeText: string;
  heroTitlePrefix: string;
  heroTitleHighlight: string;
  heroTitleSuffix: string;
  heroSubtitle: string;
  footerAttribution: string;
  // Theme & Visual Tokens
  primaryAccent: string;
  secondaryAccent: string;
  surfaceBg: string;
  cardBg: string;
  uiFont: 'Plus Jakarta Sans' | 'Outfit' | 'DM Sans' | 'Space Grotesk' | 'Courier Prime';
  cornerRadius: 'sharp' | 'balanced' | 'smooth';
  density: 'compact' | 'comfortable';
  // Studio Layout & Movable Panels
  previewSide: 'left' | 'right' | 'top';
  splitPercent: number; // 32 to 68
  templateStripLocation: 'below_video' | 'above_video' | 'hidden';
  actionBarLocation: 'top' | 'bottom' | 'both';
  tabOrder: StudioTabId[];
  hiddenTabs: StudioTabId[];
  showFastAiBar: boolean;
  showSafeZoneBar: boolean;
  showAudioSyncBar: boolean;
  showCreatorBadge: boolean;
}

export interface StylePreset {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  is_default?: boolean;
  settings: Partial<CaptionProject>;
}

export interface CaptionProject {
  id: string;
  user_id: string;
  title: string;
  video_url: string;
  video_name: string;
  duration: number;
  status: 'draft' | 'transcribing' | 'ready' | 'exporting';
  template_id: string;
  animation_style?: TextAnimationStyle;
  animation_duration?: number; // in seconds (0.15 - 0.8)
  letter_spacing?: LetterSpacing;
  line_spacing?: number; // 1.1 - 2.0
  text_align?: 'left' | 'center' | 'right';
  backdrop_style?: BackdropStyle;
  shadow_style?: ShadowStyle;
  frame: VideoFrameRatio;
  position: CaptionPosition;
  position_x?: number; // percentage 0 - 100
  position_y?: number; // percentage 0 - 100
  rotation?: number; // degrees (-45 to 45)
  max_width_percent?: number; // 40 to 96
  text_case: TextCase;
  font_family: string;
  font_size: number; // 2 - 16 scale
  font_weight: number; // 300 - 900
  is_bold?: boolean;
  is_italic?: boolean;
  is_underline?: boolean;
  is_strikethrough?: boolean;
  text_color: string;
  highlight_color: string;
  outline_color?: string;
  outline_width?: number; // px 0 - 12
  shadow_color?: string;
  shadow_blur?: number; // px 0 - 40
  box_bg_color?: string;
  box_border_color?: string;
  box_padding?: number; // px
  box_radius?: number; // px
  audio_offset?: number; // global audio delay/lead in seconds (-2.0 to +2.0)
  visual_elements?: VisualElement[];
  captions: CaptionSegment[];
  created_at: string;
  updated_at: string;
}

export type ColorCategory = 'light' | 'dark' | 'neutral' | 'bright' | 'pastel';

export interface CategorizedColorPalette {
  id: string;
  name: string;
  category: ColorCategory;
  primary_text: string;
  highlight_text: string;
  background_box: string;
  outline_stroke: string;
  shadow_color: string;
  accent_glow: string;
  description: string;
}

export interface ColorPalette {
  palette_id: string;
  name: string;
  description: string;
  colors: {
    primary_text: string;
    accent_glow: string;
    highlight_text: string;
    gradient_start: string;
    gradient_mid: string;
    gradient_end: string;
    background_box: string;
  };
}

export interface ColorPalettePack {
  pack_name: string;
  palettes: ColorPalette[];
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  is_pro: boolean;
  font_family: string;
  font_weight: number;
  text_color: string;
  highlight_color: string;
  outline_color?: string;
  outline_width?: number;
  shadow_color?: string;
  shadow_blur?: number;
  box_bg?: string;
  box_border?: string;
  box_radius?: number;
  style_tag: string;
  preview_bg: string;
  css_class: string;
  pack?: string;
  style_category?: string;
  animation_type?: TextAnimationStyle;
  layout?: {
    alignment?: 'center' | 'left' | 'right';
    position_y?: string;
  };
}

export interface ExportRecord {
  id: string;
  user_id: string;
  project_id: string;
  project_title: string;
  format: 'mp4' | 'srt' | 'vtt';
  duration: number;
  has_watermark: boolean;
  created_at: string;
}

export interface TierLimit {
  tier: UserTier;
  name: string;
  basePrice: number;
  gst: number;
  totalPrice: number;
  maxVideoDurationMin: number;
  dailyExports: number;
  allowedTemplatesCount: number;
  watermark: boolean;
  features: string[];
}
