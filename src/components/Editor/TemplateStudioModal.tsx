import React, { useState, useEffect, useRef } from 'react';
import { CaptionProject, TemplateDefinition } from '../../types';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  Code2,
  Sliders,
  CheckCircle,
} from 'lucide-react';

interface TemplateStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToProject?: (updates: Partial<CaptionProject>) => void;
  showToast: (msg: string) => void;
}

type StudioTemplateKey = 'hormozi' | 'neon' | 'mixed' | 'typewriter' | 'multiline';

interface StudioTemplateConfig {
  key: StudioTemplateKey;
  title: string;
  desc: string;
  sampleText: string;
  defaultActiveColor: string;
  defaultBaseColor: string;
  fontFamily: string;
}

const STUDIO_TEMPLATES: StudioTemplateConfig[] = [
  {
    key: 'hormozi',
    title: '1. Hormozi Kinetic Pop',
    desc: 'Bold uppercase with active word pop & rotation effect.',
    sampleText: 'I think the BIGGEST challenge is here',
    defaultActiveColor: '#ccff00',
    defaultBaseColor: '#ffffff',
    fontFamily: 'Montserrat',
  },
  {
    key: 'neon',
    title: '2. Neon Glow Box',
    desc: 'Cyberpunk neon theme with framed glow container.',
    sampleText: 'THE CITY NEVER SLEEPS TONIGHT',
    defaultActiveColor: '#00f0ff',
    defaultBaseColor: '#ffffff',
    fontFamily: 'Poppins',
  },
  {
    key: 'mixed',
    title: '3. Modern Editorial Mix',
    desc: 'Combines Sans-Serif Bold with Italic Serif fonts.',
    sampleText: 'Have you ever asked yourself why',
    defaultActiveColor: '#ff3366',
    defaultBaseColor: '#ffffff',
    fontFamily: 'Montserrat / Playfair Display',
  },
  {
    key: 'typewriter',
    title: '4. Typewriter Pro Cursor',
    desc: 'Monospace terminal typing with animated cursor.',
    sampleText: 'intelligence rendered visually',
    defaultActiveColor: '#34d399',
    defaultBaseColor: '#34d399',
    fontFamily: 'Fira Code',
  },
  {
    key: 'multiline',
    title: '5. Kinetic Big Multi-Line',
    desc: 'Stacked text hierarchy with accent line scaling.',
    sampleText: 'FASTEST KINETIC ANIMATION FOR REELS',
    defaultActiveColor: '#ffcc00',
    defaultBaseColor: '#ffffff',
    fontFamily: 'Montserrat',
  },
];

export const TemplateStudioModal: React.FC<TemplateStudioModalProps> = ({
  isOpen,
  onClose,
  onApplyToProject,
  showToast,
}) => {
  const [currentTemplate, setCurrentTemplate] = useState<StudioTemplateKey>('hormozi');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [customText, setCustomText] = useState(STUDIO_TEMPLATES[0].sampleText);
  const [colorActive, setColorActive] = useState(STUDIO_TEMPLATES[0].defaultActiveColor);
  const [colorBase, setColorBase] = useState(STUDIO_TEMPLATES[0].defaultBaseColor);
  const [exportFormat, setExportFormat] = useState<'css' | 'json' | 'ass'>('css');
  const [copiedCode, setCopiedCode] = useState(false);

  const animTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const tmpl = STUDIO_TEMPLATES.find((t) => t.key === currentTemplate);
    if (tmpl) {
      setCustomText(tmpl.sampleText);
      setColorActive(tmpl.defaultActiveColor);
      setColorBase(tmpl.defaultBaseColor);
      setActiveWordIndex(0);
    }
  }, [currentTemplate]);

  // Live animation player
  useEffect(() => {
    if (isPlaying) {
      const words = customText.trim().split(/\s+/).filter(Boolean);
      animTimerRef.current = setInterval(() => {
        setActiveWordIndex((prev) => (words.length > 0 ? (prev + 1) % words.length : 0));
      }, 400);
    } else {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
    }
    return () => {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
    };
  }, [isPlaying, customText]);

  if (!isOpen) return null;

  const words = customText.trim().split(/\s+/).filter(Boolean);

  // Generate exported code string
  const generateExportCode = () => {
    if (exportFormat === 'css') {
      return `/* Subtitle Studio v2.0 - Template: ${currentTemplate.toUpperCase()} */
.subtitle-container {
  position: absolute;
  bottom: 20%;
  width: 100%;
  text-align: center;
}

.word {
  color: ${colorBase};
  font-size: 32px;
  transition: all 0.15s ease;
}

.word.active {
  color: ${colorActive};
  transform: scale(1.25) rotate(-2deg);
  text-shadow: 4px 4px 0px #000;
}`;
    }

    if (exportFormat === 'json') {
      return JSON.stringify(
        {
          template_id: currentTemplate,
          generator_version: '2.0',
          sample_text: customText,
          styles: {
            base_color: colorBase,
            active_color: colorActive,
            font_family: currentTemplate === 'typewriter' ? 'Fira Code' : currentTemplate === 'neon' ? 'Poppins' : 'Montserrat',
            animation_type: currentTemplate === 'typewriter' ? 'typewriter_cursor' : 'word_by_word_highlight',
          },
        },
        null,
        2
      );
    }

    if (exportFormat === 'ass') {
      return `[Script Info]
Title: Subtitle Studio ${currentTemplate.toUpperCase()}
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour
Style: ${currentTemplate},Montserrat,32,&H00FFFFFF,&H0000FFCC,&H00000000,&H80000000`;
    }

    return '';
  };

  const handleCopyCode = () => {
    const code = generateExportCode();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast('Template code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // 1-Click apply to the current loaded project
  const handleApplyToActiveProject = () => {
    if (onApplyToProject) {
      if (currentTemplate === 'hormozi') {
        onApplyToProject({
          template_id: 'bold_highlight',
          font_family: 'Montserrat',
          font_weight: 900,
          text_color: colorBase,
          highlight_color: colorActive,
          text_case: 'uppercase',
          animation_style: 'pop',
          outline_color: '#000000',
          outline_width: 6,
        });
      } else if (currentTemplate === 'neon') {
        onApplyToProject({
          template_id: 'neon_glow',
          font_family: 'Poppins',
          font_weight: 800,
          text_color: colorBase,
          highlight_color: colorActive,
          box_bg_color: 'rgba(0, 0, 0, 0.75)',
          box_border_color: colorActive,
          box_radius: 10,
          shadow_color: colorActive,
          shadow_blur: 20,
        });
      } else if (currentTemplate === 'mixed') {
        onApplyToProject({
          template_id: 'editorial_caption',
          font_family: 'Playfair Display',
          font_weight: 700,
          text_color: colorBase,
          highlight_color: colorActive,
          is_italic: true,
          animation_style: 'word_reveal',
        });
      } else if (currentTemplate === 'typewriter') {
        onApplyToProject({
          template_id: 'typewriter',
          font_family: 'Fira Code',
          font_weight: 700,
          text_color: colorBase,
          highlight_color: colorActive,
          animation_style: 'typewriter',
          backdrop_style: 'minimal_strip',
        });
      } else if (currentTemplate === 'multiline') {
        onApplyToProject({
          template_id: 'kinetic_typography',
          font_family: 'Montserrat',
          font_weight: 900,
          text_color: colorBase,
          highlight_color: colorActive,
          text_case: 'uppercase',
          animation_style: 'wipe',
        });
      }
      showToast(`Applied ${currentTemplate.toUpperCase()} style to project!`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-[#14161f] border border-[#2e3444] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[#f3f4f6]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1a1d26] border-b border-[#2e3444] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Subtitle Studio</span>
              <span className="bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
                v2.0 Template Generator
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {onApplyToProject && (
              <button
                onClick={handleApplyToActiveProject}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Apply to Video Reel</span>
              </button>
            )}

            <button
              onClick={handleCopyCode}
              className="px-3.5 py-1.5 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied!' : 'Copy Template Code'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3-Column Studio Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[560px]">
          {/* Left Panel: Presets (3 cols) */}
          <div className="lg:col-span-3 bg-[#1a1d26] border-r border-[#2e3444] p-4 overflow-y-auto space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Select Preset Style
            </div>

            {STUDIO_TEMPLATES.map((tmpl) => {
              const isActive = currentTemplate === tmpl.key;
              return (
                <div
                  key={tmpl.key}
                  onClick={() => {
                    setCurrentTemplate(tmpl.key);
                    setActiveWordIndex(0);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#6366f1] bg-[#2d3345] shadow-md'
                      : 'border-transparent bg-[#242836] hover:border-[#4f46e5] hover:-translate-y-0.5'
                  }`}
                >
                  <h3 className="font-bold text-sm text-white mb-0.5">{tmpl.title}</h3>
                  <p className="text-xs text-neutral-400">{tmpl.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Center Panel: Live Preview (5 cols) */}
          <div className="lg:col-span-5 bg-[#0b0c10] flex flex-col items-center justify-center p-6 relative">
            <div className="w-[320px] h-[520px] rounded-2xl overflow-hidden relative shadow-2xl border border-neutral-800 flex items-center justify-center bg-gradient-to-b from-neutral-900 via-neutral-950 to-black">
              {/* Background Mock Video Atmosphere */}
              <div
                className="absolute inset-0 opacity-40 bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-black/50" />

              {/* Subtitle Target Overlay */}
              <div className="absolute w-[92%] text-center bottom-24 left-[4%] pointer-events-none transition-all">
                {currentTemplate === 'hormozi' && (
                  <div className="tpl-hormozi">
                    {words.map((w, idx) => (
                      <span
                        key={idx}
                        className={`word ${idx === activeWordIndex ? 'active' : ''}`}
                        style={{
                          color: idx === activeWordIndex ? colorActive : colorBase,
                        }}
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                )}

                {currentTemplate === 'neon' && (
                  <div className="tpl-neon" style={{ borderColor: colorActive, boxShadow: `0 0 15px ${colorActive}66` }}>
                    {words.map((w, idx) => (
                      <span
                        key={idx}
                        className={`word ${idx === activeWordIndex ? 'active' : ''}`}
                        style={{
                          color: idx === activeWordIndex ? colorActive : colorBase,
                          textShadow: idx === activeWordIndex ? `0 0 10px ${colorActive}, 0 0 20px ${colorActive}` : 'none',
                        }}
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                )}

                {currentTemplate === 'mixed' && (
                  <div className="tpl-mixed">
                    {words.map((w, idx) => (
                      <span
                        key={idx}
                        className={idx % 2 === 1 ? 'w-serif' : 'w-normal'}
                        style={{
                          color: idx % 2 === 1 ? colorActive : colorBase,
                        }}
                      >
                        {w}{' '}
                      </span>
                    ))}
                  </div>
                )}

                {currentTemplate === 'typewriter' && (
                  <div
                    className="tpl-typewriter"
                    style={{ color: colorActive, borderLeftColor: colorActive }}
                  >
                    <span>{words.slice(0, activeWordIndex + 1).join(' ')}</span>
                    <span className="cursor" style={{ background: colorActive }} />
                  </div>
                )}

                {currentTemplate === 'multiline' && (
                  <div className="tpl-multiline">
                    {words.length > 2 ? (
                      <>
                        <div className="line-small" style={{ color: colorBase }}>
                          {words.slice(0, Math.ceil(words.length / 2)).join(' ')}
                        </div>
                        <div className="line-big" style={{ color: colorActive }}>
                          {words.slice(Math.ceil(words.length / 2)).join(' ')}
                        </div>
                      </>
                    ) : (
                      <div className="line-big" style={{ color: colorActive }}>
                        {customText}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Play Controls */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                <span>{isPlaying ? 'Pause' : 'Play Preview'}</span>
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setActiveWordIndex(0);
                }}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Right Panel: Customizer & Exporter (4 cols) */}
          <div className="lg:col-span-4 bg-[#1a1d26] border-l border-[#2e3444] p-4 overflow-y-auto space-y-4 text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Template Customizer
            </div>

            {/* Sample Caption Text Input */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium">Sample Caption Text</label>
              <input
                type="text"
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  setActiveWordIndex(0);
                }}
                className="w-full bg-[#111319] border border-[#2e3444] text-white p-2.5 rounded-lg text-xs focus:outline-none focus:border-[#6366f1]"
              />
            </div>

            {/* Color Controls */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-neutral-300 font-medium">Active Word Color</label>
                <div className="flex items-center gap-2 bg-[#111319] p-1.5 rounded-lg border border-[#2e3444]">
                  <input
                    type="color"
                    value={colorActive}
                    onChange={(e) => setColorActive(e.target.value)}
                    className="w-7 h-7 rounded border-none bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-white">{colorActive}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-300 font-medium">Base Text Color</label>
                <div className="flex items-center gap-2 bg-[#111319] p-1.5 rounded-lg border border-[#2e3444]">
                  <input
                    type="color"
                    value={colorBase}
                    onChange={(e) => setColorBase(e.target.value)}
                    className="w-7 h-7 rounded border-none bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-white">{colorBase}</span>
                </div>
              </div>
            </div>

            {/* Export Format Select */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium">Export Format</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="w-full bg-[#111319] border border-[#2e3444] text-white p-2.5 rounded-lg text-xs focus:outline-none focus:border-[#6366f1]"
              >
                <option value="css">CSS + HTML Template</option>
                <option value="json">JSON Config (Subtitle Studio)</option>
                <option value="ass">ASS Subtitle Style Format</option>
              </select>
            </div>

            {/* Exported Code Box */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Exported Code
                </span>
                <button
                  onClick={handleCopyCode}
                  className="text-[11px] text-[#6366f1] hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </button>
              </div>

              <pre className="p-3 bg-[#111319] border border-[#2e3444] rounded-lg font-mono text-[11px] text-[#34d399] overflow-x-auto max-h-48 whitespace-pre-wrap break-all select-all">
                {generateExportCode()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
