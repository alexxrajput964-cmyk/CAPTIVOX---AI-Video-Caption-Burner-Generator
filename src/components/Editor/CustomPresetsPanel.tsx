import React, { useState, useEffect, useRef } from 'react';
import { CaptionProject, StylePreset } from '../../types';
import {
  Bookmark,
  BookmarkPlus,
  Trash2,
  Check,
  Download,
  Upload,
  Sparkles,
  Sliders,
  Type,
  Palette,
  Search,
  Copy,
  Layers,
} from 'lucide-react';

interface CustomPresetsPanelProps {
  project: CaptionProject;
  onApplyPreset: (settings: Partial<CaptionProject>, applyToAllWords?: boolean) => void;
  showToast: (msg: string) => void;
}

const STORAGE_KEY = 'captivox_custom_presets';

// Starter Curated Creator Presets
const STARTER_PRESETS: StylePreset[] = [
  {
    id: 'preset_neon_hook',
    name: '🔥 Viral Neon Hook',
    description: 'High-energy reels preset with punchy cyan highlight and neon glow',
    is_default: true,
    created_at: '2026-01-01',
    settings: {
      template_id: 'anim_neon_pulse',
      animation_style: 'neon_pulse',
      font_family: 'Montserrat',
      font_weight: 900,
      font_size: 7,
      text_color: '#FFFFFF',
      highlight_color: '#00F5D4',
      text_case: 'uppercase',
      letter_spacing: 'normal',
      backdrop_style: 'none',
      box_bg_color: 'transparent',
      outline_color: '#000000',
      outline_width: 3,
      shadow_color: '#00F5D4',
      shadow_blur: 16,
      position: 'bottom',
      position_x: 50,
      position_y: 82,
    },
  },
  {
    id: 'preset_hormozi_punch',
    name: '⚡ Hormozi Heavy Gold',
    description: 'Ultra-bold black strokes with saturated gold highlights for max retention',
    is_default: true,
    created_at: '2026-01-02',
    settings: {
      template_id: 'anim_pop_burst',
      animation_style: 'pop_bounce',
      font_family: 'Archivo Black',
      font_weight: 900,
      font_size: 7,
      text_color: '#FFFFFF',
      highlight_color: '#FFE600',
      text_case: 'uppercase',
      letter_spacing: 'tight',
      backdrop_style: 'none',
      box_bg_color: 'transparent',
      outline_color: '#000000',
      outline_width: 6,
      shadow_color: '#000000',
      shadow_blur: 0,
      position: 'bottom',
      position_x: 50,
      position_y: 80,
    },
  },
  {
    id: 'preset_tokyo_cyber',
    name: '🌐 Tokyo Cyber Glitch',
    description: 'Futuristic monospace captioning with cyber magenta and green highlights',
    is_default: true,
    created_at: '2026-01-03',
    settings: {
      template_id: 'anim_glitch_cyber',
      animation_style: 'glitch_shake',
      font_family: 'Fira Code',
      font_weight: 700,
      font_size: 6,
      text_color: '#FFFFFF',
      highlight_color: '#39FF14',
      text_case: 'none',
      letter_spacing: 'wide',
      backdrop_style: 'luxury_box',
      box_bg_color: '#0a0a0e',
      box_border_color: '#ff0055',
      box_radius: 12,
      box_padding: 8,
      position: 'bottom',
      position_x: 50,
      position_y: 82,
    },
  },
  {
    id: 'preset_cinematic_minimal',
    name: '🎬 Editorial Modern',
    description: 'Sophisticated aesthetic styling with soft blurred backdrop and warm tones',
    is_default: true,
    created_at: '2026-01-04',
    settings: {
      template_id: 'anim_soft_blur_reveal',
      animation_style: 'soft_blur_focus',
      font_family: 'Playfair Display',
      font_weight: 700,
      font_size: 6,
      text_color: '#FFFFFF',
      highlight_color: '#D4AF37',
      text_case: 'none',
      letter_spacing: 'normal',
      backdrop_style: 'frosted',
      box_bg_color: 'rgba(255,255,255,0.12)',
      box_border_color: 'rgba(255,255,255,0.25)',
      box_radius: 14,
      box_padding: 8,
      position: 'bottom',
      position_x: 50,
      position_y: 84,
    },
  },
];

export const CustomPresetsPanel: React.FC<CustomPresetsPanelProps> = ({
  project,
  onApplyPreset,
  showToast,
}) => {
  const [presets, setPresets] = useState<StylePreset[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read custom presets from storage', e);
    }
    return STARTER_PRESETS;
  });

  const [presetNameInput, setPresetNameInput] = useState('');
  const [presetDescInput, setPresetDescInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);
  const [applyToAllCaptions, setApplyToAllCaptions] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save presets to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
      console.warn('Failed to save presets to localStorage', e);
    }
  }, [presets]);

  // Extract current style configuration from project
  const getCurrentStyleConfiguration = (): Partial<CaptionProject> => {
    return {
      template_id: project.template_id,
      animation_style: project.animation_style,
      animation_duration: project.animation_duration,
      font_family: project.font_family,
      font_size: project.font_size,
      font_weight: project.font_weight,
      is_bold: project.is_bold,
      is_italic: project.is_italic,
      is_underline: project.is_underline,
      is_strikethrough: project.is_strikethrough,
      text_color: project.text_color,
      highlight_color: project.highlight_color,
      outline_color: project.outline_color,
      outline_width: project.outline_width,
      shadow_color: project.shadow_color,
      shadow_blur: project.shadow_blur,
      shadow_style: project.shadow_style,
      backdrop_style: project.backdrop_style,
      box_bg_color: project.box_bg_color,
      box_border_color: project.box_border_color,
      box_padding: project.box_padding,
      box_radius: project.box_radius,
      text_case: project.text_case,
      letter_spacing: project.letter_spacing,
      text_align: project.text_align,
      position: project.position,
      position_x: project.position_x,
      position_y: project.position_y,
    };
  };

  // Handle saving current style as a new custom preset
  const handleSaveCurrentAsPreset = (e: React.FormEvent) => {
    e.preventDefault();
    const name = presetNameInput.trim();
    if (!name) {
      showToast('Please enter a name for your preset');
      return;
    }

    const newPreset: StylePreset = {
      id: `preset_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      description: presetDescInput.trim() || `Saved on ${new Date().toLocaleDateString()}`,
      created_at: new Date().toISOString(),
      is_default: false,
      settings: getCurrentStyleConfiguration(),
    };

    setPresets((prev) => [newPreset, ...prev]);
    setPresetNameInput('');
    setPresetDescInput('');
    showToast(`Saved preset "${name}" to your library!`);
  };

  // Handle applying a preset
  const handleApply = (preset: StylePreset) => {
    onApplyPreset(preset.settings, applyToAllCaptions);
    setAppliedPresetId(preset.id);
    setTimeout(() => setAppliedPresetId(null), 2000);
    showToast(`Applied preset "${preset.name}" to project!`);
  };

  // Handle deleting a preset
  const handleDeletePreset = (id: string, name: string) => {
    if (confirm(`Delete preset "${name}"?`)) {
      setPresets((prev) => prev.filter((p) => p.id !== id));
      showToast(`Deleted preset "${name}"`);
    }
  };

  // Export all custom presets as JSON
  const handleExportPresetsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(presets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `captivox-custom-presets-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported custom presets JSON backup');
  };

  // Import presets from JSON
  const handleImportPresetsJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = JSON.parse(text);
        if (Array.isArray(imported)) {
          const validated: StylePreset[] = imported.map((p, idx) => ({
            id: p.id || `imported_${Date.now()}_${idx}`,
            name: p.name || `Imported Preset ${idx + 1}`,
            description: p.description || 'Imported from JSON',
            is_default: false,
            created_at: p.created_at || new Date().toISOString(),
            settings: p.settings || {},
          }));

          setPresets((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newOnes = validated.filter((p) => !existingIds.has(p.id));
            return [...newOnes, ...prev];
          });

          showToast(`Successfully imported ${validated.length} presets!`);
        } else {
          showToast('Invalid presets JSON format');
        }
      } catch (err: any) {
        showToast('Failed to import presets: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filter presets by search
  const filteredPresets = presets.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.settings.font_family && p.settings.font_family.toLowerCase().includes(q)) ||
      (p.settings.animation_style && p.settings.animation_style.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-2.5 pb-3 border-b border-neutral-800">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span>Custom Caption Style Presets</span>
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Save your current font, colors & animation setup to reuse across any future video.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportPresetsJson}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Import Presets from JSON"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleExportPresetsJson}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Export All Presets as JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Save Current Style as New Preset Box */}
      <form
        onSubmit={handleSaveCurrentAsPreset}
        className="p-3.5 rounded-2xl bg-[#141418] border border-neutral-800 shadow-md space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <BookmarkPlus className="w-4 h-4 text-emerald-400" />
            <span>Save Current Configuration</span>
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            Active: {project.font_family} · {project.animation_style || 'pop'}
          </span>
        </div>

        {/* Live Active Preview Pill */}
        <div className="p-2.5 rounded-xl bg-[#09090b] border border-neutral-800 flex items-center justify-between overflow-hidden">
          <span className="text-[10px] text-neutral-500 uppercase font-mono">Preview:</span>
          <div
            className="text-xs font-bold px-2 py-1 rounded"
            style={{
              fontFamily: project.font_family,
              color: project.text_color || '#FFFFFF',
              textTransform: project.text_case === 'uppercase' ? 'uppercase' : 'none',
              textShadow: project.outline_width
                ? `${project.outline_width}px ${project.outline_width}px 0px ${project.outline_color || '#000'}`
                : undefined,
            }}
          >
            SAMPLE <span style={{ color: project.highlight_color || '#FFE600' }}>HOOK</span> 🔥
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={presetNameInput}
            onChange={(e) => setPresetNameInput(e.target.value)}
            placeholder="Preset Name (e.g., My Viral Reels)"
            className="w-full px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            maxLength={40}
          />
          <input
            type="text"
            value={presetDescInput}
            onChange={(e) => setPresetDescInput(e.target.value)}
            placeholder="Tag / Notes (e.g. Gaming, Finance)"
            className="w-full px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            maxLength={50}
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition-all"
        >
          <BookmarkPlus className="w-3.5 h-3.5 fill-white" />
          <span>Save Active Style as Custom Preset</span>
        </button>
      </form>

      {/* Preset Application Option */}
      <div className="flex items-center justify-between px-1 text-xs text-neutral-400">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={applyToAllCaptions}
            onChange={(e) => setApplyToAllCaptions(e.target.checked)}
            className="w-3.5 h-3.5 rounded bg-neutral-900 border-neutral-700 text-amber-500 focus:ring-0"
          />
          <span>Apply preset to all caption segments in current project</span>
        </label>
        <span className="text-[10px] font-mono text-neutral-500">
          {presets.length} Presets Available
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search saved presets by font, name, animation..."
          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#141418] border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
        />
      </div>

      {/* Presets List */}
      <div className="grid grid-cols-1 gap-2.5 max-h-[460px] overflow-y-auto pr-0.5">
        {filteredPresets.map((preset) => {
          const s = preset.settings;
          const isJustApplied = appliedPresetId === preset.id;

          return (
            <div
              key={preset.id}
              className="p-3 rounded-2xl bg-[#141418] hover:bg-[#18181e] border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col gap-2.5 group"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">{preset.name}</span>
                    {preset.is_default ? (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono font-semibold">
                        STARTER
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-semibold">
                        SAVED
                      </span>
                    )}
                  </div>
                  {preset.description && (
                    <p className="text-[10px] text-neutral-400 truncate mt-0.5">{preset.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {!preset.is_default && (
                    <button
                      onClick={() => handleDeletePreset(preset.id, preset.name)}
                      className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Delete Preset"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Styled Preview Bar */}
              <div
                className="p-2.5 rounded-xl border flex items-center justify-center text-center overflow-hidden"
                style={{
                  backgroundColor: s.box_bg_color || '#0a0a0c',
                  borderColor: s.box_border_color || '#262626',
                }}
              >
                <span
                  style={{
                    fontFamily: s.font_family || 'Montserrat',
                    color: s.text_color || '#FFFFFF',
                    textTransform: s.text_case === 'uppercase' ? 'uppercase' : 'none',
                    letterSpacing: s.letter_spacing === 'tight' ? '-0.03em' : s.letter_spacing === 'wide' ? '0.08em' : 'normal',
                    textShadow: s.outline_width
                      ? `${s.outline_width}px ${s.outline_width}px 0px ${s.outline_color || '#000'}`
                      : undefined,
                  }}
                  className="text-xs font-extrabold"
                >
                  HIGH RETENTION <span style={{ color: s.highlight_color || '#FFE600' }}>VIRAL</span> CAPTION
                </span>
              </div>

              {/* Specs Pills */}
              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-neutral-400 font-mono">
                <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                  {s.font_family || 'Montserrat'}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-orange-400">
                  {s.animation_style || 'pop'}
                </span>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                  <span
                    className="w-2 h-2 rounded-full border border-white/20"
                    style={{ backgroundColor: s.highlight_color || '#FFE600' }}
                  />
                  <span>{s.highlight_color || '#FFE600'}</span>
                </div>
              </div>

              {/* 1-Click Apply Button */}
              <button
                onClick={() => handleApply(preset)}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isJustApplied
                    ? 'bg-emerald-500 text-white shadow'
                    : 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white'
                }`}
              >
                {isJustApplied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Applied to Project!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Apply Preset</span>
                  </>
                )}
              </button>
            </div>
          );
        })}

        {filteredPresets.length === 0 && (
          <div className="p-6 text-center text-xs text-neutral-500">
            No presets found matching "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
};
