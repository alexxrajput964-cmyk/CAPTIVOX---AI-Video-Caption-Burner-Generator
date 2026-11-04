import React from 'react';
import {
  Sliders,
  Palette,
  Sparkles,
  Minus,
  Plus,
  Crown,
  Feather,
  Layers,
  SunMedium,
  AlignCenter,
} from 'lucide-react';
import {
  CaptionProject,
  CaptionPosition,
  VideoFrameRatio,
  TextCase,
  TextAnimationStyle,
  LetterSpacing,
  BackdropStyle,
  ShadowStyle,
  ColorPalette,
} from '../../types';
import { CUSTOM_COLOR_PALETTES } from '../../lib/templates';

interface StylePanelProps {
  project: CaptionProject;
  onUpdateStyle: (updates: Partial<CaptionProject>) => void;
}

const AVAILABLE_FONTS = [
  { name: 'Outfit', label: 'Outfit (Modern Clean)' },
  { name: 'Playfair Display', label: 'Playfair Display (Classy Luxury Serif)' },
  { name: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Apple/SaaS Refined)' },
  { name: 'Inter', label: 'Inter (Editorial Minimalist)' },
  { name: 'Montserrat', label: 'Montserrat (Kinetic & Airy)' },
  { name: 'Poppins', label: 'Poppins (Aesthetic Rounded)' },
  { name: 'Archivo Black', label: 'Archivo Black (Heavy Viral Punch)' },
  { name: 'Noto Sans Devanagari', label: 'Noto Sans Devanagari (Hindi)' },
  { name: 'Space Grotesk', label: 'Space Grotesk (Tech Monospace)' },
  { name: 'Courier Prime', label: 'Courier Prime (Typewriter Pro)' },
  { name: 'Impact', label: 'Impact (Heavy Impact Shark)' },
];

const ANIMATION_OPTIONS: {
  id: TextAnimationStyle;
  name: string;
  hindiLabel: string;
  desc: string;
  tag: string;
  category: 'classy' | 'viral';
}[] = [
  // Classy, Smooth & Light ("Smoad & Light") Animations
  {
    id: 'smooth_fade_rise',
    name: '🕊️ Smooth Ease Rise',
    hindiLabel: 'Smoad & Classy',
    desc: 'Silky smooth 0.28s subtle upward glide with light weight',
    tag: 'Classy Minimal',
    category: 'classy',
  },
  {
    id: 'soft_blur_focus',
    name: '🎬 Cinematic Blur Focus',
    hindiLabel: 'Soft Lens Reveal',
    desc: 'Smooth blur-to-sharp cinema focus transition',
    tag: 'Editorial FX',
    category: 'classy',
  },
  {
    id: 'subtle_float',
    name: '☁️ Subtle Airy Float',
    hindiLabel: 'Halka & Smooth',
    desc: 'Gentle, buttery-smooth floating oscillation',
    tag: 'Light & Airy',
    category: 'classy',
  },
  {
    id: 'editorial_glow',
    name: '💎 Champagne Gold Glow',
    hindiLabel: 'Quiet Luxury',
    desc: 'Soft breathing warm luxury gold ambient illumination',
    tag: 'Luxury Glow',
    category: 'classy',
  },

  // High Retention Punchy Animations
  {
    id: 'pop_bounce',
    name: '💥 Pop & Punch',
    hindiLabel: 'Viral Zoom Bounce',
    desc: 'Aggressive squash & stretch pop-in',
    tag: 'Classic Viral',
    category: 'viral',
  },
  {
    id: 'kinetic_3d',
    name: '⚡ 3D Kinetic Tilt',
    hindiLabel: '3D Slam & Depth',
    desc: 'Dynamic 3D perspective slam & tilt',
    tag: 'Hatke 3D',
    category: 'viral',
  },
  {
    id: 'glitch_shake',
    name: '👾 Cyber RGB Glitch',
    hindiLabel: 'Chromatic Jitter',
    desc: 'Electric RGB chromatic shake & jitter',
    tag: 'Standout FX',
    category: 'viral',
  },
  {
    id: 'wavy_float',
    name: '🌊 Liquid Wave Float',
    hindiLabel: 'Floating Sine Wave',
    desc: 'Smooth bobbing floating wave motion',
    tag: 'Liquid Flow',
    category: 'viral',
  },
  {
    id: 'neon_pulse',
    name: '✨ Neon Aura Pulse',
    hindiLabel: 'Glowing Aura Burst',
    desc: 'Breathing luminous halo glow & throb',
    tag: 'Aesthetic Glow',
    category: 'viral',
  },
  {
    id: 'fire_shimmer',
    name: '🔥 Fire Gold Shimmer',
    hindiLabel: 'Metallic Flame Shine',
    desc: 'Dynamic animated moving gradient sheen',
    tag: 'Luxury Heat',
    category: 'viral',
  },
  {
    id: 'typewriter',
    name: '⌨️ Typewriter Pro',
    hindiLabel: 'Terminal Flow',
    desc: 'Monospaced text with blinking cursor',
    tag: 'Retro Cursor',
    category: 'viral',
  },
];

const PRESET_HIGHLIGHT_COLORS = [
  { hex: '#D4AF37', label: 'Gold Leaf (Luxury)' },
  { hex: '#F5E6D3', label: 'Champagne Warm' },
  { hex: '#FF8C1A', label: 'SaaS Orange' },
  { hex: '#FAFF00', label: 'Hormozi Neon' },
  { hex: '#5B9EFF', label: 'Cyber Blue' },
  { hex: '#FF3D5A', label: 'Crimson Red' },
  { hex: '#4ADE80', label: 'Emerald Green' },
  { hex: '#FFCB45', label: 'Luxury Amber' },
  { hex: '#FF007A', label: 'Hot Pink' },
  { hex: '#00F5D4', label: 'Neon Cyan' },
  { hex: '#778DA9', label: 'Winter Slate' },
  { hex: '#FFFFFF', label: 'Crisp White' },
];

export const StylePanel: React.FC<StylePanelProps> = ({ project, onUpdateStyle }) => {
  const currentSize = project.font_size || 6;
  const currentAnimation = project.animation_style || 'smooth_fade_rise';

  const handleApplyPalette = (palette: ColorPalette) => {
    onUpdateStyle({
      text_color: palette.colors.primary_text,
      highlight_color: palette.colors.highlight_text,
    });
  };

  const handleAdjustSize = (delta: number) => {
    const newSize = Math.max(2, Math.min(16, currentSize + delta));
    onUpdateStyle({ font_size: newSize });
  };

  // 1-Click Curated Premium & Classy Presets
  const applyClassyPreset = (presetKey: 'a24' | 'champagne' | 'keynote' | 'vogue') => {
    if (presetKey === 'a24') {
      onUpdateStyle({
        font_family: 'Inter',
        font_weight: 400,
        font_size: 5,
        letter_spacing: 'wide',
        backdrop_style: 'subtle_blur',
        shadow_style: 'soft_cinematic',
        animation_style: 'subtle_float',
        text_color: '#F8FAFC',
        highlight_color: '#94A3B8',
        text_case: 'none',
      });
    } else if (presetKey === 'champagne') {
      onUpdateStyle({
        font_family: 'Playfair Display',
        font_weight: 400,
        font_size: 6,
        letter_spacing: 'normal',
        backdrop_style: 'luxury_box',
        shadow_style: 'luxury_glow',
        animation_style: 'editorial_glow',
        text_color: '#FDFBF7',
        highlight_color: '#D4AF37',
        text_case: 'capitalize',
      });
    } else if (presetKey === 'keynote') {
      onUpdateStyle({
        font_family: 'Plus Jakarta Sans',
        font_weight: 500,
        font_size: 6,
        letter_spacing: 'normal',
        backdrop_style: 'frosted',
        shadow_style: 'subtle_depth',
        animation_style: 'smooth_fade_rise',
        text_color: '#FFFFFF',
        highlight_color: '#38BDF8',
        text_case: 'none',
      });
    } else if (presetKey === 'vogue') {
      onUpdateStyle({
        font_family: 'Playfair Display',
        font_weight: 400,
        font_size: 5,
        letter_spacing: 'widest',
        backdrop_style: 'minimal_strip',
        shadow_style: 'soft_cinematic',
        animation_style: 'soft_blur_focus',
        text_color: '#FFFFFF',
        highlight_color: '#E11D48',
        text_case: 'uppercase',
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] border border-neutral-800 rounded-2xl overflow-hidden p-4 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#ff8c1a]" />
          <h3 className="font-bold font-outfit text-white text-sm">Premium Typography & Style</h3>
        </div>
        <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
          <Crown className="w-3.5 h-3.5" />
          <span>Classy Editorial</span>
        </span>
      </div>

      <div className="space-y-4 text-xs">
        {/* 1-Click Curated Premium & Classy Presets */}
        <div className="bg-gradient-to-r from-neutral-900 via-[#181820] to-neutral-900 p-3 rounded-xl border border-neutral-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Classy Presets (Smoad & Light)</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => applyClassyPreset('a24')}
              className="p-2 rounded-lg bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 text-left transition-all group"
            >
              <div className="font-semibold text-white text-[11px] group-hover:text-amber-300">🏛️ A24 Cinema</div>
              <div className="text-[9px] text-neutral-400">Light 400 · Soft Ambient</div>
            </button>

            <button
              type="button"
              onClick={() => applyClassyPreset('champagne')}
              className="p-2 rounded-lg bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 text-left transition-all group"
            >
              <div className="font-semibold text-white text-[11px] group-hover:text-amber-300">💎 Quiet Luxury</div>
              <div className="text-[9px] text-neutral-400">Serif 400 · Gold Leaf</div>
            </button>

            <button
              type="button"
              onClick={() => applyClassyPreset('keynote')}
              className="p-2 rounded-lg bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 text-left transition-all group"
            >
              <div className="font-semibold text-white text-[11px] group-hover:text-amber-300">🍏 Apple Keynote</div>
              <div className="text-[9px] text-neutral-400">Frosted Glass · Clean</div>
            </button>

            <button
              type="button"
              onClick={() => applyClassyPreset('vogue')}
              className="p-2 rounded-lg bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 text-left transition-all group"
            >
              <div className="font-semibold text-white text-[11px] group-hover:text-amber-300">🕊️ Vogue Serif</div>
              <div className="text-[9px] text-neutral-400">Widest Tracking · Elite</div>
            </button>
          </div>
        </div>

        {/* Font Family & Weight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-neutral-300 font-medium mb-1.5 block">Font Family</label>
            <select
              value={project.font_family}
              onChange={(e) => onUpdateStyle({ font_family: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#ff3d5a]"
            >
              {AVAILABLE_FONTS.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-neutral-300 font-medium mb-1.5 block flex items-center justify-between">
              <span>Font Weight (Light to Heavy)</span>
              <span className="text-[10px] text-neutral-400">
                {project.font_weight <= 400 ? 'Airy / Light' : project.font_weight <= 600 ? 'Refined' : 'Punchy'}
              </span>
            </label>
            <select
              value={project.font_weight || 800}
              onChange={(e) => onUpdateStyle({ font_weight: parseInt(e.target.value) })}
              className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#ff3d5a]"
            >
              <option value={300}>300 - Light (Smoad & Airy)</option>
              <option value={400}>400 - Regular (Clean Editorial)</option>
              <option value={500}>500 - Medium (Balanced Classy)</option>
              <option value={600}>600 - SemiBold (Modern SaaS)</option>
              <option value={700}>700 - Bold (Strong Standard)</option>
              <option value={800}>800 - Extra Bold (Viral Punch)</option>
              <option value={900}>900 - Black / Heavy (MrBeast/Shark)</option>
            </select>
          </div>
        </div>

        {/* Letter Spacing (Tracking) & Backdrop Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-neutral-300 font-medium mb-1.5 block">Letter Spacing (Tracking)</label>
            <div className="grid grid-cols-4 gap-1">
              {(
                [
                  { id: 'tight', label: 'Tight' },
                  { id: 'normal', label: 'Normal' },
                  { id: 'wide', label: 'Wide' },
                  { id: 'widest', label: 'Widest' },
                ] as { id: LetterSpacing; label: string }[]
              ).map((ls) => (
                <button
                  key={ls.id}
                  type="button"
                  onClick={() => onUpdateStyle({ letter_spacing: ls.id })}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all text-[11px] ${
                    (project.letter_spacing || 'normal') === ls.id
                      ? 'bg-[#1e1c24] border-[#ff3d5a] text-white font-bold ring-1 ring-[#ff3d5a]'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {ls.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-neutral-300 font-medium mb-1.5 block">Classy Backdrop</label>
            <select
              value={project.backdrop_style || 'none'}
              onChange={(e) => onUpdateStyle({ backdrop_style: e.target.value as BackdropStyle })}
              className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#ff3d5a]"
            >
              <option value="none">None (Direct on Video)</option>
              <option value="frosted">Frosted Glass (Apple Keynote Blur)</option>
              <option value="minimal_strip">Minimal Strip (Ali Abdaal Aesthetic)</option>
              <option value="luxury_box">Luxury Box (Dark Gold Border)</option>
              <option value="subtle_blur">Subtle Ambient Blur</option>
            </select>
          </div>
        </div>

        {/* Font Size & Weight Grid - EXPANDED FOR BADA TEXT */}
        <div className="space-y-2.5 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold flex items-center gap-1.5">
              <span>Text Size (Bada / Chhota Scale)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ff3d5a]/20 text-[#ff3d5a] font-mono font-bold">
                Level {currentSize}
              </span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleAdjustSize(-1)}
                className="w-6 h-6 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition-all"
                title="Size Chhota Karo (-)"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleAdjustSize(1)}
                className="w-6 h-6 rounded-md bg-[#ff3d5a]/30 hover:bg-[#ff3d5a]/50 text-white flex items-center justify-center transition-all"
                title="Size Bada Karo (+)"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <input
            type="range"
            min={2}
            max={16}
            step={1}
            value={currentSize}
            onChange={(e) => onUpdateStyle({ font_size: parseInt(e.target.value) })}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ff3d5a]"
          />

          {/* Quick 1-Click Bada Size Presets */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[
              { size: 4, label: 'Chhota', sub: 'Compact' },
              { size: 6, label: 'Normal', sub: 'Classy' },
              { size: 10, label: 'Bada 🔥', sub: 'Viral Big' },
              { size: 14, label: 'Ultra 🚀', sub: 'Max Impact' },
            ].map((p) => (
              <button
                key={p.size}
                type="button"
                onClick={() => onUpdateStyle({ font_size: p.size })}
                className={`py-1.5 px-1 rounded-lg border text-center transition-all ${
                  currentSize === p.size
                    ? 'bg-[#ff3d5a]/20 border-[#ff3d5a] text-white font-bold ring-1 ring-[#ff3d5a]'
                    : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:text-white hover:bg-neutral-700'
                }`}
              >
                <div className="text-[11px] font-bold">{p.label}</div>
                <div className="text-[9px] text-neutral-400">{p.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* TEXT ANIMATIONS SECTION (SMOOTH & CLASSY + VIRAL) */}
        <div className="pt-2 border-t border-neutral-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-neutral-200 font-semibold block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff8c1a]" />
              <span>Animations (Smoad & Light vs Viral)</span>
            </label>
            <span className="text-[10px] text-amber-400 font-medium px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
              Active Karaoke Word
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {ANIMATION_OPTIONS.map((anim) => {
              const isSelected = currentAnimation === anim.id;
              return (
                <button
                  key={anim.id}
                  type="button"
                  onClick={() => onUpdateStyle({ animation_style: anim.id })}
                  className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#1e1c24] border-[#ff3d5a] ring-1 ring-[#ff3d5a] text-white shadow-lg'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{anim.name}</span>
                      <span className="text-[10px] text-neutral-400 font-medium">({anim.hindiLabel})</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 line-clamp-1">{anim.desc}</span>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full border font-mono font-medium ${
                      anim.category === 'classy'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    {anim.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shadow & Ambient Depth */}
        <div>
          <label className="text-neutral-400 font-medium mb-1.5 block">Shadow & Depth Styling</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'soft_cinematic', label: 'Soft Cinema' },
                { id: 'luxury_glow', label: 'Gold Halo' },
                { id: 'subtle_depth', label: 'Subtle Depth' },
              ] as { id: ShadowStyle; label: string }[]
            ).map((sh) => (
              <button
                key={sh.id}
                type="button"
                onClick={() => onUpdateStyle({ shadow_style: sh.id })}
                className={`py-1.5 px-2 rounded-lg border text-center text-[11px] truncate transition-all ${
                  (project.shadow_style || 'soft_cinematic') === sh.id
                    ? 'bg-[#1e1c24] border-[#ff3d5a] text-white font-bold'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {sh.label}
              </button>
            ))}
          </div>
        </div>

        {/* Position on Screen & Target Ratio */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-neutral-400 font-medium mb-1.5 block">Position</label>
            <div className="grid grid-cols-3 gap-1">
              {(['top', 'center', 'bottom'] as CaptionPosition[]).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => onUpdateStyle({ position: pos })}
                  className={`py-1.5 rounded-lg border text-center capitalize text-[11px] transition-all ${
                    project.position === pos
                      ? 'bg-[#1e1c24] border-[#ff3d5a] text-white font-bold'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-neutral-400 font-medium mb-1.5 block">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-1">
              {(['9:16', '1:1', '16:9'] as VideoFrameRatio[]).map((fr) => (
                <button
                  key={fr}
                  type="button"
                  onClick={() => onUpdateStyle({ frame: fr })}
                  className={`py-1.5 rounded-lg border text-center text-[11px] font-medium transition-all ${
                    project.frame === fr
                      ? 'bg-[#1e1c24] border-[#ff3d5a] text-white font-bold'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {fr}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Text Case Transformation */}
        <div>
          <label className="text-neutral-400 font-medium mb-1.5 block">Case Transformation</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['none', 'uppercase', 'capitalize', 'lowercase'] as TextCase[]).map((tc) => (
              <button
                key={tc}
                type="button"
                onClick={() => onUpdateStyle({ text_case: tc })}
                className={`py-1.5 px-2 rounded-lg border text-center text-[11px] truncate transition-all ${
                  project.text_case === tc
                    ? 'bg-[#1e1c24] border-[#ff3d5a] text-white font-bold'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {tc === 'none'
                  ? 'Normal'
                  : tc === 'uppercase'
                  ? 'UPPER'
                  : tc === 'capitalize'
                  ? 'Title'
                  : 'lower'}
              </button>
            ))}
          </div>
        </div>

        {/* Active Karaoke Highlight Color */}
        <div>
          <label className="text-neutral-400 font-medium mb-1.5 block">
            Active Karaoke Highlight Color
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_HIGHLIGHT_COLORS.map((clr) => (
              <button
                key={clr.hex}
                type="button"
                onClick={() => onUpdateStyle({ highlight_color: clr.hex })}
                className={`w-7 h-7 rounded-lg border transition-all ${
                  project.highlight_color === clr.hex
                    ? 'ring-2 ring-white scale-110 border-white'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: clr.hex }}
                title={clr.label}
              />
            ))}
          </div>
        </div>

        {/* Color Themes Palettes */}
        <div className="pt-2 border-t border-neutral-800/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-neutral-300 font-semibold block flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#ff8c1a]" />
              <span>Unique Subtitle Themes 2026</span>
            </label>
            <span className="text-[10px] text-neutral-500 font-mono">1-Click Apply</span>
          </div>

          <div className="space-y-2">
            {CUSTOM_COLOR_PALETTES.map((pal) => {
              const isSelected =
                project.text_color === pal.colors.primary_text &&
                project.highlight_color === pal.colors.highlight_text;

              return (
                <button
                  key={pal.palette_id}
                  type="button"
                  onClick={() => handleApplyPalette(pal)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-[#181820] border-[#ff3d5a] ring-1 ring-[#ff3d5a]/40'
                      : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs">{pal.name}</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-14 h-3 rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${pal.colors.gradient_start}, ${pal.colors.gradient_mid}, ${pal.colors.gradient_end})`,
                        }}
                        title="Gradient Flow"
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: pal.colors.primary_text }}
                        title={`Text: ${pal.colors.primary_text}`}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: pal.colors.highlight_text }}
                        title={`Highlight: ${pal.colors.highlight_text}`}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400 line-clamp-1">
                    {pal.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
