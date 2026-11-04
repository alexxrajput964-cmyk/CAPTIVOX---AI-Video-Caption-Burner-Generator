import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Palette,
  Sparkles,
  Minus,
  Plus,
  Crown,
  Type,
  Layers,
  Copy,
  Check,
  RotateCcw,
  Bookmark,
  Trash2,
  Eye,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code2,
  Clock,
} from 'lucide-react';
import {
  CaptionProject,
  VideoFrameRatio,
  TextCase,
  LetterSpacing,
  BackdropStyle,
  ShadowStyle,
  TemplateDefinition,
  VisualElement,
  StylePreset,
  SubtitleAnimation,
  ColorCategory,
  CategorizedColorPalette,
} from '../../types';
import {
  ALL_TEMPLATES,
  PREMIUM_ANIMATED_TEMPLATES,
  SEVEN_VIRAL_TEMPLATES,
  NEW_VIRAL_TEMPLATES,
  DISTINCT_SUBTITLE_TEMPLATES,
  CLASSIC_CREATOR_TEMPLATES,
  CATEGORIZED_PALETTES,
  SUPPORTED_FONTS,
  SUBTITLE_ANIMATION_LIST,
} from '../../lib/templates';

interface PropertiesPanelProps {
  project: CaptionProject;
  onUpdateStyle: (updates: Partial<CaptionProject>) => void;
  onApplyTemplate?: (template: TemplateDefinition) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  project,
  onUpdateStyle,
  onApplyTemplate,
}) => {
  // Tab within properties panel
  const [activeTab, setActiveTab] = useState<'templates' | 'typography' | 'colors' | 'animations' | 'layers' | 'presets' | 'code'>('templates');
  const [templateFilter, setTemplateFilter] = useState<'all' | 'animated' | 'seven_viral' | 'distinct' | 'classic'>('animated');
  const [codeExportFormat, setCodeExportFormat] = useState<'css' | 'json' | 'ass'>('css');
  const [copiedCodeFeedback, setCopiedCodeFeedback] = useState(false);

  // Color target selector: which style attribute does the color palette apply to?
  const [colorTarget, setColorTarget] = useState<'text' | 'highlight' | 'box_bg' | 'outline' | 'shadow'>('highlight');
  const [selectedColorCategory, setSelectedColorCategory] = useState<ColorCategory>('bright');

  // Custom Color State
  const [customHex, setCustomHex] = useState(project.highlight_color || '#FAFF00');
  const [colorOpacity, setColorOpacity] = useState(100);

  // Saved presets in localStorage
  const [savedPresets, setSavedPresets] = useState<StylePreset[]>(() => {
    try {
      const stored = localStorage.getItem('captivox_custom_presets');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [newPresetName, setNewPresetName] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Supported weights for current font
  const currentFontMeta = SUPPORTED_FONTS.find((f) => f.name === project.font_family) || SUPPORTED_FONTS[0];

  // Adjust font size
  const handleAdjustSize = (delta: number) => {
    const newSize = Math.max(2, Math.min(16, (project.font_size || 6) + delta));
    onUpdateStyle({ font_size: newSize });
  };

  // Apply color from palette or custom picker to the designated colorTarget
  const handleApplyColor = (colorHex: string) => {
    if (colorTarget === 'text') {
      onUpdateStyle({ text_color: colorHex });
    } else if (colorTarget === 'highlight') {
      onUpdateStyle({ highlight_color: colorHex });
    } else if (colorTarget === 'box_bg') {
      const alpha = colorOpacity / 100;
      // Convert hex to rgba
      const r = parseInt(colorHex.slice(1, 3), 16) || 0;
      const g = parseInt(colorHex.slice(3, 5), 16) || 0;
      const b = parseInt(colorHex.slice(5, 7), 16) || 0;
      onUpdateStyle({ box_bg_color: `rgba(${r}, ${g}, ${b}, ${alpha})` });
    } else if (colorTarget === 'outline') {
      onUpdateStyle({ outline_color: colorHex });
    } else if (colorTarget === 'shadow') {
      onUpdateStyle({ shadow_color: colorHex });
    }
  };

  // Copy full style settings
  const handleCopyStyle = () => {
    const styleSnippet = {
      font_family: project.font_family,
      font_size: project.font_size,
      font_weight: project.font_weight,
      text_color: project.text_color,
      highlight_color: project.highlight_color,
      template_id: project.template_id,
      animation_style: project.animation_style,
      letter_spacing: project.letter_spacing,
      backdrop_style: project.backdrop_style,
      shadow_style: project.shadow_style,
      box_bg_color: project.box_bg_color,
      outline_color: project.outline_color,
      outline_width: project.outline_width,
    };
    try {
      localStorage.setItem('captivox_copied_style', JSON.stringify(styleSnippet));
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.warn('Copy style error', err);
    }
  };

  // Paste full style settings
  const handlePasteStyle = () => {
    try {
      const raw = localStorage.getItem('captivox_copied_style');
      if (raw) {
        const parsed = JSON.parse(raw);
        onUpdateStyle(parsed);
      }
    } catch (err) {
      console.warn('Paste style error', err);
    }
  };

  // Save new preset
  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: StylePreset = {
      id: 'preset-' + Date.now(),
      name: newPresetName.trim(),
      settings: {
        font_family: project.font_family,
        font_size: project.font_size,
        font_weight: project.font_weight,
        text_color: project.text_color,
        highlight_color: project.highlight_color,
        template_id: project.template_id,
        animation_style: project.animation_style,
        letter_spacing: project.letter_spacing,
        backdrop_style: project.backdrop_style,
        outline_color: project.outline_color,
        outline_width: project.outline_width,
        shadow_color: project.shadow_color,
      },
    };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    setNewPresetName('');
    localStorage.setItem('captivox_custom_presets', JSON.stringify(updated));
  };

  const handleDeletePreset = (id: string) => {
    const updated = savedPresets.filter((p) => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem('captivox_custom_presets', JSON.stringify(updated));
  };

  // Visual element layers helpers
  const handleAddVisualElement = (type: 'badge' | 'box' | 'bar') => {
    const newElem: VisualElement = {
      id: 'elem-' + Date.now(),
      type,
      text: type === 'badge' ? 'HOT TIP' : undefined,
      x: 50,
      y: 70,
      bgColor: type === 'badge' ? '#FF3D5A' : 'rgba(255, 255, 255, 0.2)',
      textColor: '#FFFFFF',
      zIndex: 5,
    };
    const current = project.visual_elements || [];
    onUpdateStyle({ visual_elements: [...current, newElem] });
  };

  const handleDeleteVisualElement = (id: string) => {
    const current = project.visual_elements || [];
    onUpdateStyle({ visual_elements: current.filter((e) => e.id !== id) });
  };

  return (
    <div className="flex flex-col h-full bg-[#111113] border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Tab Navigation */}
      <div className="p-2.5 bg-[#161619] border-b border-neutral-800 flex items-center justify-between gap-1 overflow-x-auto shrink-0">
        {[
          { id: 'templates', label: '8 Templates', icon: Crown },
          { id: 'typography', label: 'Typography', icon: Type },
          { id: 'colors', label: 'Palettes', icon: Palette },
          { id: 'animations', label: 'Animations', icon: Sparkles },
          { id: 'layers', label: 'Layers', icon: Layers },
          { id: 'presets', label: 'Presets', icon: Bookmark },
          { id: 'code', label: 'Export Code', icon: Code2 },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-neutral-700'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#ff8c1a]' : 'text-neutral-500'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* ============================================================== */}
        {/* TAB 1: ALL VIRAL & CREATOR SUBTITLE TEMPLATES                 */}
        {/* ============================================================== */}
        {activeTab === 'templates' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div>
                <h4 className="font-bold text-white text-xs">Templates Library ({ALL_TEMPLATES.length})</h4>
                <p className="text-[10px] text-neutral-400">
                  Every template is 100% free & unlocked. Click any template to apply immediately.
                </p>
              </div>

              {/* Template Category Pills */}
              <div className="flex items-center gap-1 flex-wrap">
                {[
                  { id: 'animated', label: '✨ Animated (12)' },
                  { id: 'all', label: 'All' },
                  { id: 'seven_viral', label: '⭐ 7 Viral Styles' },
                  { id: 'distinct', label: '⚡ Distinct 8' },
                  { id: 'classic', label: '👑 Classic' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setTemplateFilter(cat.id as any)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                      templateFilter === cat.id
                        ? 'bg-neutral-800 text-white ring-1 ring-neutral-700 shadow-sm'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(templateFilter === 'animated'
                ? PREMIUM_ANIMATED_TEMPLATES
                : templateFilter === 'seven_viral'
                ? SEVEN_VIRAL_TEMPLATES
                : templateFilter === 'distinct'
                ? DISTINCT_SUBTITLE_TEMPLATES
                : templateFilter === 'classic'
                ? CLASSIC_CREATOR_TEMPLATES
                : ALL_TEMPLATES
              ).map((tmpl) => {
                const isSelected = project.template_id === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      if (onApplyTemplate) {
                        onApplyTemplate(tmpl);
                      } else {
                        onUpdateStyle({
                          template_id: tmpl.id,
                          font_family: tmpl.font_family,
                          font_weight: tmpl.font_weight,
                          text_color: tmpl.text_color,
                          highlight_color: tmpl.highlight_color,
                          outline_color: tmpl.outline_color,
                          outline_width: tmpl.outline_width,
                          shadow_color: tmpl.shadow_color,
                          shadow_blur: tmpl.shadow_blur,
                          box_bg_color: tmpl.box_bg,
                          box_border_color: tmpl.box_border,
                          box_radius: tmpl.box_radius,
                          animation_style: tmpl.animation_type || project.animation_style,
                        });
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1e1c24] border-[#ff3d5a] ring-1 ring-[#ff3d5a] shadow-lg'
                        : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                    }`}
                  >
                    {/* Visual Preview Box */}
                    <div
                      className="w-full h-14 rounded-lg flex items-center justify-center p-2 text-center overflow-hidden border border-white/10"
                      style={{ background: tmpl.preview_bg }}
                    >
                      <span
                        className={`text-xs font-bold leading-tight ${tmpl.css_class}`}
                        style={{
                          fontFamily: `'${tmpl.font_family}', sans-serif`,
                          color: tmpl.text_color,
                        }}
                      >
                        Sample <span style={{ color: tmpl.highlight_color }}>Subtitle</span>
                      </span>
                    </div>

                    {/* Metadata */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{tmpl.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          FREE
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                        {tmpl.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ADVANCED TYPOGRAPHY & BACKDROP CONTROLS                */}
        {/* ============================================================== */}
        {activeTab === 'typography' && (
          <div className="space-y-4">
            {/* Blurry Sheet / Background Box Controls (Prominent 1-Click Feature) */}
            <div className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-xs block">Background & Blurry Sheet</span>
                  <span className="text-[10px] text-neutral-400">
                    Control or completely remove the blurred frosted sheet behind subtitles
                  </span>
                </div>
                <button
                  onClick={() =>
                    onUpdateStyle({
                      backdrop_style: 'none',
                      box_bg_color: 'transparent',
                      box_border_color: 'transparent',
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-[10px] font-bold transition-colors"
                  title="Remove blurry sheet and make subtitle background 100% transparent"
                >
                  ✕ Remove Blurry Sheet
                </button>
              </div>

              {/* Backdrop Style Options */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {[
                  { id: 'none', label: 'Transparent', icon: '✨' },
                  { id: 'frosted', label: 'Frosted Blur', icon: '🌫️' },
                  { id: 'minimal_strip', label: 'Solid Box', icon: '⬛' },
                  { id: 'luxury_box', label: 'Gold Card', icon: '👑' },
                  { id: 'custom_pill', label: 'Pill Shape', icon: '💊' },
                ].map((b) => {
                  const isCurrent =
                    b.id === 'none'
                      ? project.backdrop_style === 'none' || project.box_bg_color === 'transparent'
                      : project.backdrop_style === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        if (b.id === 'none') {
                          onUpdateStyle({
                            backdrop_style: 'none',
                            box_bg_color: 'transparent',
                            box_border_color: 'transparent',
                          });
                        } else if (b.id === 'frosted') {
                          onUpdateStyle({
                            backdrop_style: 'frosted',
                            box_bg_color: 'rgba(255, 255, 255, 0.14)',
                            box_border_color: 'rgba(255, 255, 255, 0.28)',
                            box_radius: 16,
                          });
                        } else if (b.id === 'minimal_strip') {
                          onUpdateStyle({
                            backdrop_style: 'minimal_strip',
                            box_bg_color: 'rgba(15, 15, 18, 0.88)',
                            box_border_color: 'rgba(255, 255, 255, 0.1)',
                            box_radius: 8,
                          });
                        } else if (b.id === 'luxury_box') {
                          onUpdateStyle({
                            backdrop_style: 'luxury_box',
                            box_bg_color: 'rgba(24, 21, 18, 0.9)',
                            box_border_color: 'rgba(212, 175, 55, 0.35)',
                            box_radius: 12,
                          });
                        } else if (b.id === 'custom_pill') {
                          onUpdateStyle({
                            backdrop_style: 'custom_box',
                            box_bg_color: 'rgba(18, 18, 22, 0.92)',
                            box_border_color: 'rgba(255, 255, 255, 0.16)',
                            box_radius: 20,
                            box_padding: 18,
                          });
                        }
                      }}
                      className={`py-1.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center gap-0.5 ${
                        isCurrent
                          ? 'bg-neutral-800 border-[#ff3d5a] text-white font-bold'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs">{b.icon}</span>
                      <span className="text-[9px] truncate w-full">{b.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Font Family & Supported Weights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-neutral-300 font-medium mb-1.5 block">Font Family</label>
                <select
                  value={project.font_family}
                  onChange={(e) => {
                    const newFont = e.target.value;
                    const meta = SUPPORTED_FONTS.find((f) => f.name === newFont);
                    const defaultWeight = meta ? meta.supportedWeights[meta.supportedWeights.length - 1] : 700;
                    onUpdateStyle({
                      font_family: newFont,
                      font_weight: defaultWeight,
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#ff3d5a]"
                >
                  {SUPPORTED_FONTS.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-neutral-300 font-medium mb-1.5 block">Supported Weights</label>
                <select
                  value={project.font_weight || 700}
                  onChange={(e) => onUpdateStyle({ font_weight: parseInt(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#ff3d5a]"
                >
                  {currentFontMeta.supportedWeights.map((w) => (
                    <option key={w} value={w}>
                      {w === 300
                        ? '300 - Light'
                        : w === 400
                        ? '400 - Regular'
                        : w === 500
                        ? '500 - Medium'
                        : w === 600
                        ? '600 - SemiBold'
                        : w === 700
                        ? '700 - Bold'
                        : w === 800
                        ? '800 - ExtraBold'
                        : '900 - Black / Heavy'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Font Size & Presets */}
            <div className="p-3 bg-neutral-900/70 border border-neutral-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Font Size (Level {project.font_size || 6})</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAdjustSize(-1)}
                    className="w-6 h-6 rounded bg-neutral-800 text-neutral-300 flex items-center justify-center hover:bg-neutral-700"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleAdjustSize(1)}
                    className="w-6 h-6 rounded bg-[#ff3d5a]/30 text-white flex items-center justify-center hover:bg-[#ff3d5a]/50"
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
                value={project.font_size || 6}
                onChange={(e) => onUpdateStyle({ font_size: parseInt(e.target.value) })}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ff3d5a]"
              />

              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { size: 4, label: 'Small' },
                  { size: 6, label: 'Regular' },
                  { size: 10, label: 'Bada 🔥' },
                  { size: 14, label: 'Ultra 🚀' },
                ].map((s) => (
                  <button
                    key={s.size}
                    onClick={() => onUpdateStyle({ font_size: s.size })}
                    className={`py-1 rounded text-center border text-[10px] ${
                      (project.font_size || 6) === s.size
                        ? 'bg-[#ff3d5a]/20 border-[#ff3d5a] text-white font-bold'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Formatting: Bold, Italic, Underline, Strikethrough & Alignment */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-neutral-400 font-medium mb-1.5 block">Text Style</label>
                <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                  <button
                    onClick={() => onUpdateStyle({ is_italic: !project.is_italic })}
                    className={`p-1.5 rounded-lg flex-1 flex justify-center ${
                      project.is_italic ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateStyle({ is_underline: !project.is_underline, is_strikethrough: false })}
                    className={`p-1.5 rounded-lg flex-1 flex justify-center ${
                      project.is_underline ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Underline"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateStyle({ is_strikethrough: !project.is_strikethrough, is_underline: false })}
                    className={`p-1.5 rounded-lg flex-1 flex justify-center ${
                      project.is_strikethrough ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 font-medium mb-1.5 block">Alignment</label>
                <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                  <button
                    onClick={() => onUpdateStyle({ text_align: 'left' })}
                    className={`p-1.5 rounded-lg flex-1 flex justify-center ${
                      project.text_align === 'left' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Left Align"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateStyle({ text_align: 'center' })}
                    className={`p-1.5 rounded-lg flex-1 flex justify-center ${
                      (!project.text_align || project.text_align === 'center') ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Center Align"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateStyle({ text_align: 'right' })}
                    className={`p-1.5 rounded-lg flex-1 flex justify-center ${
                      project.text_align === 'right' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Right Align"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Letter Spacing & Line Spacing */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-neutral-400 font-medium mb-1.5 block">Letter Spacing</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['tight', 'normal', 'wide', 'widest'] as LetterSpacing[]).map((ls) => (
                    <button
                      key={ls}
                      onClick={() => onUpdateStyle({ letter_spacing: ls })}
                      className={`py-1.5 rounded text-center border text-[10px] capitalize ${
                        (project.letter_spacing || 'normal') === ls
                          ? 'bg-neutral-800 border-[#ff3d5a] text-white font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {ls}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-neutral-400 font-medium mb-1.5 block">Line Spacing</label>
                <div className="grid grid-cols-4 gap-1">
                  {[1.1, 1.25, 1.4, 1.6].map((lh) => (
                    <button
                      key={lh}
                      onClick={() => onUpdateStyle({ line_spacing: lh })}
                      className={`py-1.5 rounded text-center border text-[10px] ${
                        (project.line_spacing || 1.3) === lh
                          ? 'bg-neutral-800 border-[#ff3d5a] text-white font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {lh}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Outline Stroke & Shadow Depth */}
            <div className="p-3 bg-neutral-900/70 border border-neutral-800/80 rounded-xl space-y-2.5">
              <span className="font-semibold text-white block">Outline & Shadow Controls</span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    Outline Stroke Width ({project.outline_width || 0}px)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    step={1}
                    value={project.outline_width || 0}
                    onChange={(e) => onUpdateStyle({ outline_width: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-[#ff3d5a]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    Shadow Blur ({project.shadow_blur || 0}px)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={35}
                    step={1}
                    value={project.shadow_blur || 0}
                    onChange={(e) => onUpdateStyle({ shadow_blur: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-[#ff3d5a]"
                  />
                </div>
              </div>
            </div>

            {/* Position X / Y Overlay Coordinates & 5 Presets */}
            <div className="p-3 bg-neutral-900/70 border border-neutral-800/80 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">X / Y Overlay Coordinates & Presets</span>
                <button
                  onClick={() => onUpdateStyle({ position_x: 50, position_y: 82, position: 'bottom' })}
                  className="text-[10px] text-[#ff8c1a] hover:underline"
                >
                  Reset to Bottom (82%)
                </button>
              </div>

              {/* 5 Vertical Presets: Top, Upper, Center, Lower, Bottom */}
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Vertical Presets</label>
                <div className="grid grid-cols-5 gap-1 text-[10px] font-semibold">
                  {[
                    { label: 'Top (15%)', y: 15, key: 'top' },
                    { label: 'Upper (32%)', y: 32, key: 'upper' },
                    { label: 'Center (50%)', y: 50, key: 'center' },
                    { label: 'Lower (68%)', y: 68, key: 'lower' },
                    { label: 'Bottom (82%)', y: 82, key: 'bottom' },
                  ].map((preset) => {
                    const isActive = (project.position_y ?? 82) === preset.y;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => onUpdateStyle({ position_y: preset.y, position: preset.key as any })}
                        className={`py-1 rounded border transition-all text-center ${
                          isActive
                            ? 'bg-[#ff3d5a]/20 border-[#ff3d5a] text-white font-bold shadow'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {preset.label.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horizontal Presets */}
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Horizontal Presets</label>
                <div className="grid grid-cols-3 gap-1 text-[10px] font-semibold">
                  {[
                    { label: 'Left (25%)', x: 25 },
                    { label: 'Center (50%)', x: 50 },
                    { label: 'Right (75%)', x: 75 },
                  ].map((preset) => {
                    const isActive = (project.position_x ?? 50) === preset.x;
                    return (
                      <button
                        key={preset.x}
                        type="button"
                        onClick={() => onUpdateStyle({ position_x: preset.x, position: 'custom' })}
                        className={`py-1 rounded border transition-all text-center ${
                          isActive
                            ? 'bg-neutral-800 border-[#00f0ff] text-[#00f0ff] font-bold'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fine Sliders */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                    <span>X: {project.position_x ?? 50}%</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onUpdateStyle({ position_x: Math.max(5, (project.position_x ?? 50) - 1), position: 'custom' })}
                        className="px-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
                        title="Nudge Left 1%"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => onUpdateStyle({ position_x: Math.min(95, (project.position_x ?? 50) + 1), position: 'custom' })}
                        className="px-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
                        title="Nudge Right 1%"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={95}
                    value={project.position_x ?? 50}
                    onChange={(e) => onUpdateStyle({ position_x: parseInt(e.target.value), position: 'custom' })}
                    className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-[#ff3d5a]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                    <span>Y: {project.position_y ?? 82}%</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onUpdateStyle({ position_y: Math.max(5, (project.position_y ?? 82) - 1), position: 'custom' })}
                        className="px-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
                        title="Nudge Up 1%"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => onUpdateStyle({ position_y: Math.min(95, (project.position_y ?? 82) + 1), position: 'custom' })}
                        className="px-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
                        title="Nudge Down 1%"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={95}
                    value={project.position_y ?? 82}
                    onChange={(e) => onUpdateStyle({ position_y: parseInt(e.target.value), position: 'custom' })}
                    className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-[#ff3d5a]"
                  />
                </div>
              </div>
            </div>

            {/* Global Audio Sync Delay/Lead Offset Control */}
            <div className="p-3 bg-neutral-900/70 border border-neutral-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#ff8c1a]" />
                  <span>Global Audio Sync Delay / Lead</span>
                </span>
                <span className={`text-[11px] font-mono font-bold ${
                  (project.audio_offset || 0) !== 0 ? 'text-[#ff8c1a]' : 'text-emerald-400'
                }`}>
                  {(project.audio_offset || 0) > 0
                    ? `+${(project.audio_offset || 0).toFixed(2)}s (Later)`
                    : (project.audio_offset || 0) < 0
                    ? `${(project.audio_offset || 0).toFixed(2)}s (Earlier)`
                    : '0.00s (Synced)'}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">
                Fixes video-audio lag by shifting all subtitles & word timings forward or backward.
              </p>

              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onUpdateStyle({ audio_offset: Number(((project.audio_offset || 0) - 0.1).toFixed(2)) })}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-mono cursor-pointer"
                >
                  -100ms
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStyle({ audio_offset: Number(((project.audio_offset || 0) - 0.05).toFixed(2)) })}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-mono cursor-pointer"
                >
                  -50ms
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStyle({ audio_offset: 0 })}
                  className="flex-1 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-[10px] font-mono text-center cursor-pointer"
                >
                  Reset (0.00s)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStyle({ audio_offset: Number(((project.audio_offset || 0) + 0.05).toFixed(2)) })}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-mono cursor-pointer"
                >
                  +50ms
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStyle({ audio_offset: Number(((project.audio_offset || 0) + 0.1).toFixed(2)) })}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-mono cursor-pointer"
                >
                  +100ms
                </button>
              </div>

              <input
                type="range"
                min={-1.0}
                max={1.0}
                step={0.02}
                value={project.audio_offset || 0}
                onChange={(e) => onUpdateStyle({ audio_offset: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-[#ff3d5a]"
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: DEDICATED COLOR PALETTE SYSTEM (5 Clear Categories)    */}
        {/* ============================================================== */}
        {activeTab === 'colors' && (
          <div className="space-y-4">
            {/* Target Selector */}
            <div>
              <label className="text-neutral-300 font-medium mb-1.5 block">
                Target Element to Color:
              </label>
              <div className="grid grid-cols-5 gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                {[
                  { id: 'highlight', label: 'Highlight' },
                  { id: 'text', label: 'Primary' },
                  { id: 'box_bg', label: 'Box BG' },
                  { id: 'outline', label: 'Outline' },
                  { id: 'shadow', label: 'Shadow' },
                ].map((tg) => (
                  <button
                    key={tg.id}
                    onClick={() => setColorTarget(tg.id as any)}
                    className={`py-1 rounded-lg text-[10px] font-semibold text-center transition-all ${
                      colorTarget === tg.id
                        ? 'bg-neutral-800 text-white shadow ring-1 ring-neutral-700'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {tg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom HEX / RGB Input & Opacity */}
            <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Custom Color Input</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-neutral-400 font-mono">Opacity: {colorOpacity}%</span>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={colorOpacity}
                    onChange={(e) => setColorOpacity(parseInt(e.target.value))}
                    className="w-16 h-1 bg-neutral-700 rounded accent-[#ff3d5a]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    handleApplyColor(e.target.value);
                  }}
                  className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                      handleApplyColor(e.target.value);
                    }
                  }}
                  className="flex-1 p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white font-mono text-xs focus:outline-none focus:border-[#ff3d5a]"
                  placeholder="#FAFF00"
                />
                <button
                  onClick={() => handleApplyColor(customHex)}
                  className="px-3 py-2 rounded-lg bg-[#ff3d5a] text-white font-semibold text-xs hover:opacity-90"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* 5 Categories Selector */}
            <div>
              <label className="text-neutral-300 font-medium mb-1.5 block">Color Palette Categories</label>
              <div className="grid grid-cols-5 gap-1">
                {(['light', 'dark', 'neutral', 'bright', 'pastel'] as ColorCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedColorCategory(cat)}
                    className={`py-1.5 rounded-lg border text-center capitalize text-[10px] font-medium transition-all ${
                      selectedColorCategory === cat
                        ? 'bg-neutral-800 border-[#ff3d5a] text-white font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtered Palettes */}
            <div className="space-y-2">
              {CATEGORIZED_PALETTES.filter((p) => p.category === selectedColorCategory).map((pal) => (
                <div
                  key={pal.id}
                  className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs">{pal.name}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleApplyColor(pal.primary_text)}
                        className="w-4 h-4 rounded-full border border-white/20 hover:scale-110 transition-transform"
                        style={{ backgroundColor: pal.primary_text }}
                        title={`Text: ${pal.primary_text}`}
                      />
                      <button
                        onClick={() => handleApplyColor(pal.highlight_text)}
                        className="w-4 h-4 rounded-full border border-white/20 hover:scale-110 transition-transform"
                        style={{ backgroundColor: pal.highlight_text }}
                        title={`Highlight: ${pal.highlight_text}`}
                      />
                      <button
                        onClick={() => handleApplyColor(pal.accent_glow)}
                        className="w-4 h-4 rounded-full border border-white/20 hover:scale-110 transition-transform"
                        style={{ backgroundColor: pal.accent_glow }}
                        title={`Accent: ${pal.accent_glow}`}
                      />
                      <button
                        onClick={() => {
                          onUpdateStyle({
                            text_color: pal.primary_text,
                            highlight_color: pal.highlight_text,
                            box_bg_color: pal.background_box,
                            outline_color: pal.outline_stroke,
                            shadow_color: pal.shadow_color,
                          });
                        }}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[9px] font-semibold ml-1"
                      >
                        Apply All
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400">{pal.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: SUBTITLE ANIMATIONS (Without a Timeline)               */}
        {/* ============================================================== */}
        {activeTab === 'animations' && (
          <div className="space-y-3">
            <div>
              <h4 className="font-bold text-white text-xs">9 Subtitle Animations</h4>
              <p className="text-[10px] text-neutral-400">
                Triggered automatically relative to subtitle start and end times without a timeline.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {SUBTITLE_ANIMATION_LIST.map((anim) => {
                const isSelected = project.animation_style === anim.id;
                return (
                  <button
                    key={anim.id}
                    onClick={() => onUpdateStyle({ animation_style: anim.id as any })}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#1e1c24] border-[#ff3d5a] ring-1 ring-[#ff3d5a] text-white shadow'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{anim.icon}</span>
                      <div>
                        <div className="font-bold text-white text-xs">{anim.name}</div>
                        <div className="text-[10px] text-neutral-400">{anim.desc}</div>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                      {anim.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: VISUAL ELEMENTS & LAYERS                               */}
        {/* ============================================================== */}
        {activeTab === 'layers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-xs">Visual Elements & Overlays</h4>
                <p className="text-[10px] text-neutral-400">
                  Add decorative highlight badges and background shapes around subtitles.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddVisualElement('badge')}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs font-semibold flex items-center gap-1"
              >
                + Text Badge
              </button>
              <button
                onClick={() => handleAddVisualElement('box')}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs font-semibold flex items-center gap-1"
              >
                + Card Shape
              </button>
            </div>

            {/* Elements List */}
            <div className="space-y-2 pt-1">
              {(!project.visual_elements || project.visual_elements.length === 0) ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  No visual elements added yet. Click "+ Text Badge" to add one.
                </div>
              ) : (
                project.visual_elements.map((elem, idx) => (
                  <div
                    key={elem.id}
                    className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-neutral-500 text-[10px]">#{idx + 1}</span>
                      <span className="capitalize font-semibold text-white">{elem.type}</span>
                      {elem.text && (
                        <input
                          type="text"
                          value={elem.text}
                          onChange={(e) => {
                            const updated = (project.visual_elements || []).map((el) =>
                              el.id === elem.id ? { ...el, text: e.target.value } : el
                            );
                            onUpdateStyle({ visual_elements: updated });
                          }}
                          className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700 text-white text-[11px] w-24"
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeleteVisualElement(elem.id)}
                        className="p-1 rounded text-neutral-500 hover:text-red-400"
                        title="Delete Element"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: PRESETS & COPY / PASTE                                 */}
        {/* ============================================================== */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            {/* Quick Copy / Paste Style */}
            <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-2">
              <span className="font-semibold text-white block">Copy / Paste Style</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyStyle}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium flex items-center justify-center gap-1 text-xs"
                >
                  {copyFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copyFeedback ? 'Copied!' : 'Copy Current Style'}</span>
                </button>
                <button
                  onClick={handlePasteStyle}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-[#ff3d5a]/20 hover:bg-[#ff3d5a]/30 text-white border border-[#ff3d5a]/40 font-medium flex items-center justify-center gap-1 text-xs"
                >
                  <span>Paste Style</span>
                </button>
              </div>
            </div>

            {/* Save Custom Preset */}
            <div className="space-y-2">
              <span className="font-semibold text-white block">Save Style Preset</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g. My Podcast Look"
                  className="flex-1 p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-xs focus:outline-none focus:border-[#ff3d5a]"
                />
                <button
                  onClick={handleSavePreset}
                  className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white font-semibold text-xs"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Presets List */}
            <div className="space-y-2 pt-1">
              {savedPresets.length === 0 ? (
                <div className="text-center py-6 text-neutral-500 text-xs">
                  No custom presets saved yet.
                </div>
              ) : (
                savedPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white block">{preset.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {preset.settings.font_family} · {preset.settings.highlight_color}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateStyle(preset.settings)}
                        className="px-2 py-1 rounded bg-[#ff8c1a]/20 text-[#ff8c1a] hover:bg-[#ff8c1a]/30 text-[10px] font-semibold"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => handleDeletePreset(preset.id)}
                        className="p-1 rounded text-neutral-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: CODE EXPORT (CSS / JSON / ASS Subtitle Format)         */}
        {/* ============================================================== */}
        {activeTab === 'code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-xs">Export Template Code</h4>
                <p className="text-[10px] text-neutral-400">
                  Export ready-to-use CSS, Subtitle Studio JSON, or ASS styles for your video pipeline.
                </p>
              </div>
            </div>

            {/* Format Selector */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium">Target Format</label>
              <div className="grid grid-cols-3 gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                {[
                  { id: 'css', label: 'CSS + HTML' },
                  { id: 'json', label: 'JSON Config' },
                  { id: 'ass', label: 'ASS Style' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setCodeExportFormat(fmt.id as any)}
                    className={`py-1.5 rounded-lg text-[10px] font-semibold text-center transition-all ${
                      codeExportFormat === fmt.id
                        ? 'bg-neutral-800 text-white shadow ring-1 ring-neutral-700'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Code Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-400">
                  {codeExportFormat === 'css'
                    ? 'styles.css'
                    : codeExportFormat === 'json'
                    ? 'subtitle_template.json'
                    : 'style.ass'}
                </span>

                <button
                  onClick={() => {
                    let code = '';
                    if (codeExportFormat === 'css') {
                      code = `/* Subtitle Studio v2.0 - Template: ${(project.template_id || 'custom').toUpperCase()} */
.subtitle-container {
  position: absolute;
  left: ${project.position_x ?? 50}%;
  top: ${project.position_y ?? 80}%;
  transform: translate(-50%, -50%);
  width: 90%;
  text-align: ${project.text_align || 'center'};
}

.word {
  font-family: '${project.font_family || 'Montserrat'}', sans-serif;
  font-weight: ${project.font_weight || 800};
  color: ${project.text_color || '#FFFFFF'};
  font-size: ${(project.font_size || 6) * 3 + 14}px;
  letter-spacing: ${project.letter_spacing === 'wide' ? '0.08em' : project.letter_spacing === 'widest' ? '0.18em' : 'normal'};
  transition: all 0.15s ease;
}

.word.active {
  color: ${project.highlight_color || '#FAFF00'};
  transform: scale(1.22) rotate(-2deg);
  text-shadow: 4px 4px 0px #000;
}`;
                    } else if (codeExportFormat === 'json') {
                      code = JSON.stringify(
                        {
                          generator: 'Subtitle Studio v2.0',
                          template_id: project.template_id || 'custom',
                          font: {
                            family: project.font_family || 'Montserrat',
                            size: (project.font_size || 6) * 3 + 14,
                            weight: project.font_weight || 800,
                            case: project.text_case || 'none',
                          },
                          colors: {
                            base_text: project.text_color || '#FFFFFF',
                            active_highlight: project.highlight_color || '#FAFF00',
                            outline: project.outline_color || '#000000',
                            shadow: project.shadow_color || 'rgba(0,0,0,0.8)',
                          },
                          layout: {
                            alignment: project.text_align || 'center',
                            position_x: `${project.position_x ?? 50}%`,
                            position_y: `${project.position_y ?? 80}%`,
                          },
                          animation: {
                            type: project.animation_style || 'pop',
                            duration: project.animation_duration || 0.25,
                          },
                        },
                        null,
                        2
                      );
                    } else if (codeExportFormat === 'ass') {
                      code = `[Script Info]
Title: Subtitle Studio Export
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour
Style: ${project.template_id || 'Default'},${project.font_family || 'Montserrat'},${(project.font_size || 6) * 3 + 14},&H00FFFFFF,&H0000FFCC,&H00000000,&H80000000`;
                    }

                    navigator.clipboard.writeText(code);
                    setCopiedCodeFeedback(true);
                    setTimeout(() => setCopiedCodeFeedback(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] text-white font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedCodeFeedback ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCodeFeedback ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-[11px] text-[#34d399] overflow-x-auto max-h-60 whitespace-pre-wrap break-all select-all">
                {codeExportFormat === 'css' &&
`/* Subtitle Studio v2.0 - Template: ${(project.template_id || 'custom').toUpperCase()} */
.subtitle-container {
  position: absolute;
  left: ${project.position_x ?? 50}%;
  top: ${project.position_y ?? 80}%;
  transform: translate(-50%, -50%);
  width: 90%;
  text-align: ${project.text_align || 'center'};
}

.word {
  font-family: '${project.font_family || 'Montserrat'}', sans-serif;
  font-weight: ${project.font_weight || 800};
  color: ${project.text_color || '#FFFFFF'};
  font-size: ${(project.font_size || 6) * 3 + 14}px;
  letter-spacing: ${project.letter_spacing === 'wide' ? '0.08em' : project.letter_spacing === 'widest' ? '0.18em' : 'normal'};
  transition: all 0.15s ease;
}

.word.active {
  color: ${project.highlight_color || '#FAFF00'};
  transform: scale(1.22) rotate(-2deg);
  text-shadow: 4px 4px 0px #000;
}`}
                {codeExportFormat === 'json' &&
JSON.stringify(
  {
    generator: 'Subtitle Studio v2.0',
    template_id: project.template_id || 'custom',
    font: {
      family: project.font_family || 'Montserrat',
      size: (project.font_size || 6) * 3 + 14,
      weight: project.font_weight || 800,
      case: project.text_case || 'none',
    },
    colors: {
      base_text: project.text_color || '#FFFFFF',
      active_highlight: project.highlight_color || '#FAFF00',
      outline: project.outline_color || '#000000',
      shadow: project.shadow_color || 'rgba(0,0,0,0.8)',
    },
    layout: {
      alignment: project.text_align || 'center',
      position_x: `${project.position_x ?? 50}%`,
      position_y: `${project.position_y ?? 80}%`,
    },
    animation: {
      type: project.animation_style || 'pop',
      duration: project.animation_duration || 0.25,
    },
  },
  null,
  2
)}
                {codeExportFormat === 'ass' &&
`[Script Info]
Title: Subtitle Studio Export
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour
Style: ${project.template_id || 'Default'},${project.font_family || 'Montserrat'},${(project.font_size || 6) * 3 + 14},&H00FFFFFF,&H0000FFCC,&H00000000,&H80000000`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
