import React, { useState, useRef } from 'react';
import { useUICustomizer, DEFAULT_UI_CONFIG } from '../context/UICustomizerContext';
import { StudioTabId } from '../types';
import {
  X,
  Paintbrush,
  Layout,
  Type,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Columns,
  PanelLeft,
  PanelRight,
  PanelTop,
  Download,
  Upload,
  Check,
  Edit3,
  Sparkles,
  Sliders,
} from 'lucide-react';

const TAB_LABELS: Record<StudioTabId, string> = {
  subtitles: 'Captions List & Timing',
  templates: 'Viral Templates (41)',
  properties: 'Style & Typography',
  presets: 'Custom Saved Presets',
};

const THEME_PRESETS = [
  {
    name: 'Flame Studio',
    primaryAccent: '#ff3d5a',
    secondaryAccent: '#ff8c1a',
    surfaceBg: '#0a0a0a',
    cardBg: '#141416',
  },
  {
    name: 'Cyber Neon',
    primaryAccent: '#00f5d4',
    secondaryAccent: '#6366f1',
    surfaceBg: '#06080f',
    cardBg: '#0f1320',
  },
  {
    name: 'Emerald Creator',
    primaryAccent: '#10b981',
    secondaryAccent: '#14b8a6',
    surfaceBg: '#070c0a',
    cardBg: '#111916',
  },
  {
    name: 'Royal Gold',
    primaryAccent: '#f59e0b',
    secondaryAccent: '#ffd700',
    surfaceBg: '#0c0a07',
    cardBg: '#17140f',
  },
  {
    name: 'Midnight Violet',
    primaryAccent: '#a855f7',
    secondaryAccent: '#ec4899',
    surfaceBg: '#09070e',
    cardBg: '#15111e',
  },
  {
    name: 'Pure OLED',
    primaryAccent: '#ffffff',
    secondaryAccent: '#38bdf8',
    surfaceBg: '#000000',
    cardBg: '#0d0d10',
  },
];

export const UICustomizerDrawer: React.FC<{ onShowToast?: (msg: string) => void }> = ({
  onShowToast,
}) => {
  const {
    uiConfig,
    updateUiConfig,
    resetUiConfig,
    moveTab,
    toggleTabVisibility,
    isCustomizerOpen,
    setIsCustomizerOpen,
    isLiveEditMode,
    setIsLiveEditMode,
  } = useUICustomizer();

  const [section, setSection] = useState<'layout' | 'theme' | 'texts'>('layout');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isCustomizerOpen) return null;

  const handleExportUiJson = () => {
    const blob = new Blob([JSON.stringify(uiConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captivox_ui_layout.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    onShowToast?.('Exported UI customization file!');
  };

  const handleImportUiJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        updateUiConfig({ ...DEFAULT_UI_CONFIG, ...parsed });
        onShowToast?.('Imported custom UI layout & theme!');
      } catch {
        onShowToast?.('Invalid UI config JSON file');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click backdrop to close */}
      <div className="flex-1" onClick={() => setIsCustomizerOpen(false)} />

      {/* Slide-over Customizer Drawer */}
      <div className="w-full max-w-md bg-[#111114] border-l border-neutral-800 shadow-2xl flex flex-col h-full text-white">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-[#141418]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow"
              style={{
                background: `linear-gradient(135deg, ${uiConfig.primaryAccent}, ${uiConfig.secondaryAccent})`,
              }}
            >
              <Paintbrush className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold font-outfit text-white">
                Full UI & Layout Customizer
              </h2>
              <p className="text-[11px] text-neutral-400">
                Move panels, resize, edit texts & re-theme anywhere
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCustomizerOpen(false)}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="p-2.5 border-b border-neutral-800 bg-[#0d0d10] grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setSection('layout')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              section === 'layout'
                ? 'bg-neutral-800 text-white ring-1 ring-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layout className="w-3.5 h-3.5 text-amber-400" />
            <span>Move & Layout</span>
          </button>
          <button
            onClick={() => setSection('theme')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              section === 'theme'
                ? 'bg-neutral-800 text-white ring-1 ring-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5 text-rose-400" />
            <span>Colors & UI</span>
          </button>
          <button
            onClick={() => setSection('texts')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              section === 'texts'
                ? 'bg-neutral-800 text-white ring-1 ring-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-emerald-400" />
            <span>Edit All Text</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* ===================================================== */}
          {/* SECTION 1: MOVE & LAYOUT CUSTOMIZATION                */}
          {/* ===================================================== */}
          {section === 'layout' && (
            <>
              {/* Video Preview Side Switcher */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Columns className="w-3.5 h-3.5 text-amber-400" />
                  <span>Move Video Preview Position</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'left', label: 'Left Side', icon: PanelLeft },
                    { id: 'right', label: 'Right Side', icon: PanelRight },
                    { id: 'top', label: 'Top Stacked', icon: PanelTop },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const active = uiConfig.previewSide === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => updateUiConfig({ previewSide: opt.id as any })}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                          active
                            ? 'bg-neutral-800 border-amber-500 text-white shadow'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Split Width Slider */}
              {uiConfig.previewSide !== 'top' && (
                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Preview Panel Width</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {uiConfig.splitPercent}% / {100 - uiConfig.splitPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={68}
                    value={uiConfig.splitPercent}
                    onChange={(e) => updateUiConfig({ splitPercent: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-neutral-400">
                    Tip: You can also drag the vertical divider directly in the Editor Studio!
                  </p>
                </div>
              )}

              {/* Move Template Strip */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white">Move Quick Template Strip</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'above_video', label: 'Above Video' },
                    { id: 'below_video', label: 'Below Video' },
                    { id: 'hidden', label: 'Hide Strip' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateUiConfig({ templateStripLocation: opt.id as any })}
                      className={`py-2 px-2 rounded-xl border font-semibold cursor-pointer transition-all ${
                        uiConfig.templateStripLocation === opt.id
                          ? 'bg-neutral-800 border-amber-500 text-white'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Move Studio Tabs Order & Show/Hide */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Reorder & Toggle Editor Tabs</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Move Up / Down</span>
                </label>
                <div className="space-y-1.5">
                  {uiConfig.tabOrder.map((tabId, idx) => {
                    const isHidden = uiConfig.hiddenTabs.includes(tabId);
                    return (
                      <div
                        key={tabId}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          isHidden
                            ? 'bg-neutral-950 border-neutral-900 opacity-60'
                            : 'bg-neutral-900 border-neutral-800'
                        }`}
                      >
                        <span className="font-semibold text-white">{TAB_LABELS[tabId]}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveTab(tabId, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 cursor-pointer"
                            title="Move left/up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveTab(tabId, 'down')}
                            disabled={idx === uiConfig.tabOrder.length - 1}
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 cursor-pointer"
                            title="Move right/down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleTabVisibility(tabId)}
                            className={`p-1 rounded cursor-pointer ${
                              isHidden
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                            title={isHidden ? 'Show tab' : 'Hide tab'}
                          >
                            {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Widget Toggles */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white">Show / Hide Studio Widgets</label>
                <div className="space-y-1.5 text-xs">
                  {[
                    { key: 'showFastAiBar', label: '1-Click Fast AI Subtitles Bar' },
                    { key: 'showSafeZoneBar', label: 'Safe Zone & Aspect Ratio Bar' },
                    { key: 'showAudioSyncBar', label: 'Audio Sync Offset Bar' },
                    { key: 'showCreatorBadge', label: 'Creator Attribution Badge' },
                  ].map((item) => {
                    const enabled = Boolean((uiConfig as any)[item.key]);
                    return (
                      <button
                        key={item.key}
                        onClick={() => updateUiConfig({ [item.key]: !enabled } as any)}
                        className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between hover:border-neutral-700 cursor-pointer"
                      >
                        <span className="text-neutral-200 font-medium">{item.label}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            enabled
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          {enabled ? 'Visible' : 'Hidden'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ===================================================== */}
          {/* SECTION 2: COLORS, FONTS & VISUAL THEME               */}
          {/* ===================================================== */}
          {section === 'theme' && (
            <>
              {/* 1-Click Theme Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>1-Click Studio Theme Presets</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PRESETS.map((preset) => {
                    const isActive =
                      uiConfig.primaryAccent === preset.primaryAccent &&
                      uiConfig.surfaceBg === preset.surfaceBg;
                    return (
                      <button
                        key={preset.name}
                        onClick={() =>
                          updateUiConfig({
                            primaryAccent: preset.primaryAccent,
                            secondaryAccent: preset.secondaryAccent,
                            surfaceBg: preset.surfaceBg,
                            cardBg: preset.cardBg,
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                          isActive
                            ? 'bg-neutral-800 border-white/40 ring-1 ring-white/20'
                            : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full shrink-0 border border-white/20"
                          style={{
                            background: `linear-gradient(135deg, ${preset.primaryAccent}, ${preset.secondaryAccent})`,
                          }}
                        />
                        <span className="text-xs font-semibold text-white truncate">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <span className="text-xs font-bold text-white block">Custom Brand Colors</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-neutral-800">
                    <span className="text-neutral-300">Primary</span>
                    <input
                      type="color"
                      value={uiConfig.primaryAccent}
                      onChange={(e) => updateUiConfig({ primaryAccent: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-neutral-800">
                    <span className="text-neutral-300">Secondary</span>
                    <input
                      type="color"
                      value={uiConfig.secondaryAccent}
                      onChange={(e) => updateUiConfig({ secondaryAccent: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-neutral-800">
                    <span className="text-neutral-300">Background</span>
                    <input
                      type="color"
                      value={uiConfig.surfaceBg}
                      onChange={(e) => updateUiConfig({ surfaceBg: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-neutral-800">
                    <span className="text-neutral-300">Cards</span>
                    <input
                      type="color"
                      value={uiConfig.cardBg}
                      onChange={(e) => updateUiConfig({ cardBg: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                  </label>
                </div>
              </div>

              {/* UI Font Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white">Global Interface Font</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(
                    [
                      'Plus Jakarta Sans',
                      'Outfit',
                      'DM Sans',
                      'Space Grotesk',
                      'Courier Prime',
                    ] as const
                  ).map((font) => (
                    <button
                      key={font}
                      onClick={() => updateUiConfig({ uiFont: font })}
                      style={{ fontFamily: `'${font}', sans-serif` }}
                      className={`p-2 rounded-xl border text-left cursor-pointer ${
                        uiConfig.uiFont === font
                          ? 'bg-neutral-800 border-amber-500 text-white font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              {/* Corner Radius & Spacing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white">Corner Style</label>
                  <select
                    value={uiConfig.cornerRadius}
                    onChange={(e) => updateUiConfig({ cornerRadius: e.target.value as any })}
                    className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white"
                  >
                    <option value="sharp">Sharp (6px)</option>
                    <option value="balanced">Balanced (12px)</option>
                    <option value="smooth">Extra Smooth (20px)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white">UI Density</label>
                  <select
                    value={uiConfig.density}
                    onChange={(e) => updateUiConfig({ density: e.target.value as any })}
                    className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white"
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ===================================================== */}
          {/* SECTION 3: LIVE EDIT ALL APP TEXTS & BRANDING         */}
          {/* ===================================================== */}
          {section === 'texts' && (
            <>
              {/* Live Inline Click-to-Edit Toggle */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/50 to-teal-950/30 border border-emerald-500/40 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>On-Page Direct Text Edit Mode</span>
                  </span>
                  <p className="text-[10px] text-neutral-300 mt-0.5">
                    Turn ON to click & edit headlines/labels directly on the page!
                  </p>
                </div>
                <button
                  onClick={() => setIsLiveEditMode(!isLiveEditMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all shrink-0 ${
                    isLiveEditMode
                      ? 'bg-emerald-500 text-black shadow'
                      : 'bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  {isLiveEditMode ? 'ON ✓' : 'OFF'}
                </button>
              </div>

              {/* Form Fields for All Brand & UI Copy */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1">App Brand Name</label>
                  <input
                    type="text"
                    value={uiConfig.brandName}
                    onChange={(e) => updateUiConfig({ brandName: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Creator / Owner Subtext</label>
                  <input
                    type="text"
                    value={uiConfig.brandSubtext}
                    onChange={(e) => updateUiConfig({ brandSubtext: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Top Hero Badge Text</label>
                  <input
                    type="text"
                    value={uiConfig.heroBadgeText}
                    onChange={(e) => updateUiConfig({ heroBadgeText: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-neutral-400 mb-1">Headline Part 1</label>
                    <input
                      type="text"
                      value={uiConfig.heroTitlePrefix}
                      onChange={(e) => updateUiConfig({ heroTitlePrefix: e.target.value })}
                      className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Highlight</label>
                    <input
                      type="text"
                      value={uiConfig.heroTitleHighlight}
                      onChange={(e) => updateUiConfig({ heroTitleHighlight: e.target.value })}
                      className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Part 3</label>
                    <input
                      type="text"
                      value={uiConfig.heroTitleSuffix}
                      onChange={(e) => updateUiConfig({ heroTitleSuffix: e.target.value })}
                      className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Hero Description</label>
                  <textarea
                    rows={3}
                    value={uiConfig.heroSubtitle}
                    onChange={(e) => updateUiConfig({ heroSubtitle: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Footer Text</label>
                  <input
                    type="text"
                    value={uiConfig.footerAttribution}
                    onChange={(e) => updateUiConfig({ footerAttribution: e.target.value })}
                    className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions: Export / Import / Reset */}
        <div className="p-4 border-t border-neutral-800 bg-[#141418] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportUiJson}
            />
            <button
              onClick={handleExportUiJson}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-1 cursor-pointer"
              title="Download UI theme & layout preset"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export UI</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-1 cursor-pointer"
              title="Import UI theme & layout preset"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          </div>

          <button
            onClick={() => {
              resetUiConfig();
              onShowToast?.('Reset UI layout & theme to defaults');
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
