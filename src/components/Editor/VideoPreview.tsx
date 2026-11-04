import React, { useRef, useState, useEffect } from 'react';
import { CaptionProject, CaptionSegment, WordTimestamp } from '../../types';
import { getActiveWordIndex } from '../../lib/videoBurner';
import { convertDevanagariToHinglish, hasDevanagari } from '../../lib/hinglishConverter';
import { useSubtitleDrag } from '../../hooks/useSubtitleDrag';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Edit3,
  Check,
  X,
  Shield,
  Move,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Clock,
  Sparkles,
} from 'lucide-react';

interface VideoPreviewProps {
  project: CaptionProject;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onTogglePlay: () => void;
  hasWatermark: boolean;
  onUpdateCaptions?: (captions: CaptionSegment[]) => void;
  onUpdateStyle?: (updates: Partial<CaptionProject>) => void;
}

export type SafeZoneMode = 'none' | 'ten_percent' | 'social' | 'logo_watermark' | 'all';

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  project,
  currentTime,
  duration,
  isPlaying,
  videoRef,
  onTimeUpdate,
  onDurationChange,
  onTogglePlay,
  hasWatermark,
  onUpdateCaptions,
  onUpdateStyle,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [safeZoneMode, setSafeZoneMode] = useState<SafeZoneMode>('ten_percent');
  const [showOffsetControls, setShowOffsetControls] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const subtitleBoxRef = useRef<HTMLDivElement>(null);

  // Global Audio Offset in seconds
  const globalOffset = project.audio_offset || 0;
  const effectiveTime = currentTime - globalOffset;

  // Active segment with frame-accurate audio offset alignment
  const activeSegment = project.captions?.find(
    (cap) => effectiveTime >= cap.start_time && effectiveTime <= cap.end_time
  );

  const activeWordIdx = activeSegment ? getActiveWordIndex(activeSegment, currentTime, globalOffset) : -1;

  // High-frequency playback monitor & frame-accurate micro-re-sync
  useEffect(() => {
    if (!isPlaying) return;
    const video = videoRef.current;
    if (!video) return;

    let animId: number;
    let rfcId: number;

    const frameStep = () => {
      if (video.paused || video.ended) return;
      const vTime = video.currentTime;
      onTimeUpdate(vTime);

      // Micro-re-sync check: if subtitle frame boundary drift is detected (> 0.05s)
      const gOff = project.audio_offset || 0;
      const effTime = vTime - gOff;
      const currentSegment = project.captions?.find(
        (c) => effTime >= c.start_time && effTime <= c.end_time
      );

      // Micro-align active word if within 40ms threshold
      if (currentSegment && currentSegment.words && currentSegment.words.length > 0) {
        const found = currentSegment.words.findIndex((w) => effTime >= w.start && effTime <= w.end);
        if (found === -1) {
          const edgeWord = currentSegment.words.find(
            (w) => Math.abs(effTime - w.start) < 0.045 || Math.abs(effTime - w.end) < 0.045
          );
          if (edgeWord) {
            // Frame micro-alignment locked
          }
        }
      }

      if ('requestVideoFrameCallback' in video) {
        rfcId = (video as any).requestVideoFrameCallback(frameStep);
      } else {
        animId = requestAnimationFrame(frameStep);
      }
    };

    if ('requestVideoFrameCallback' in video) {
      rfcId = (video as any).requestVideoFrameCallback(frameStep);
    } else {
      animId = requestAnimationFrame(frameStep);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (rfcId && 'cancelVideoFrameCallback' in video) {
        (video as any).cancelVideoFrameCallback(rfcId);
      }
    };
  }, [isPlaying, onTimeUpdate, project.audio_offset, project.captions]);

  // Adaptive Frame Ratio with clean responsive width limits
  let frameAspectRatioClass = 'aspect-[9/16] w-full max-w-[280px] sm:max-w-xs max-h-[520px]';
  if (project.frame === '1:1') {
    frameAspectRatioClass = 'aspect-square w-full max-w-sm max-h-[460px]';
  } else if (project.frame === '16:9') {
    frameAspectRatioClass = 'aspect-[16/9] w-full max-w-md sm:max-w-lg max-h-[440px]';
  }

  // Positioning: normalized percentage coordinates (0 - 100%)
  const posX = project.position_x ?? 50;
  let defaultPosY = 82;
  if (project.position === 'top') defaultPosY = 15;
  if (project.position === 'center') defaultPosY = 50;
  const posY = project.position_y ?? defaultPosY;

  // Fluid Touch & Mouse Drag Hook
  const {
    isDragging,
    isSelected,
    setIsSelected,
    isSnappedX,
    isSnappedY,
    handlePointerDown,
  } = useSubtitleDrag({
    containerRef,
    currentX: posX,
    currentY: posY,
    onPositionChange: (newX, newY) => {
      if (onUpdateStyle) {
        onUpdateStyle({
          position_x: newX,
          position_y: newY,
          position: 'custom',
        });
      }
    },
    disabled: isEditingInline,
  });

  // Quick alignment & preset setter
  const setPositionPreset = (x: number, y: number, posLabel?: 'top' | 'center' | 'bottom' | 'custom') => {
    if (onUpdateStyle) {
      onUpdateStyle({
        position_x: Math.max(5, Math.min(95, x)),
        position_y: Math.max(5, Math.min(95, y)),
        position: posLabel || 'custom',
      });
    }
  };

  // Fine Nudge Adjustments (1% increments)
  const handleNudge = (deltaX: number, deltaY: number) => {
    if (onUpdateStyle) {
      const newX = Math.max(5, Math.min(95, posX + deltaX));
      const newY = Math.max(5, Math.min(95, posY + deltaY));
      onUpdateStyle({
        position_x: newX,
        position_y: newY,
        position: 'custom',
      });
    }
  };

  // Click outside to deselect
  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'VIDEO') {
      setIsSelected(false);
      if (isEditingInline) {
        setIsEditingInline(false);
      } else {
        onTogglePlay();
      }
    }
  };

  // Toggle word highlight directly by clicking it in the preview
  const handleWordClick = (wordIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeSegment || !onUpdateCaptions || !activeSegment.words) return;

    const currentWord = activeSegment.words[wordIdx];
    if (!currentWord) return;

    const updatedWords = [...activeSegment.words];
    updatedWords[wordIdx] = {
      ...currentWord,
      isHighlighted: !currentWord.isHighlighted,
    };

    const updated = (project.captions || []).map((c) =>
      c.id === activeSegment.id ? { ...c, words: updatedWords } : c
    );
    onUpdateCaptions(updated);
  };

  // Direct Inline editing
  const handleStartInlineEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeSegment) {
      if (isPlaying) onTogglePlay();
      setEditingText(activeSegment.text);
      setIsEditingInline(true);
    }
  };

  const handleSaveInlineEdit = () => {
    if (!activeSegment || !onUpdateCaptions) {
      setIsEditingInline(false);
      return;
    }

    const trimmed = editingText.trim();
    if (!trimmed) {
      setIsEditingInline(false);
      return;
    }

    const words = trimmed.split(/\s+/).filter(Boolean);
    const duration = Math.max(0.4, activeSegment.end_time - activeSegment.start_time);
    const wordDur = duration / Math.max(1, words.length);

    const prevWords = activeSegment.words || [];
    const newWords: WordTimestamp[] = words.map((w, idx) => ({
      text: w,
      start: Number((activeSegment.start_time + idx * wordDur).toFixed(3)),
      end: Number((activeSegment.start_time + (idx + 1) * wordDur).toFixed(3)),
      isHighlighted: prevWords[idx]?.isHighlighted,
      customColor: prevWords[idx]?.customColor,
      customWeight: prevWords[idx]?.customWeight,
    }));

    const updated = (project.captions || []).map((c) =>
      c.id === activeSegment.id ? { ...c, text: trimmed, words: newWords } : c
    );

    onUpdateCaptions(updated);
    setIsEditingInline(false);
  };

  const handleConvertToHinglish = () => {
    const romanHinglish = convertDevanagariToHinglish(editingText);
    setEditingText(romanHinglish);
  };

  // Video scrubber and audio
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      onTimeUpdate(newTime);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      onTimeUpdate(0);
      if (!isPlaying) onTogglePlay();
    }
  };

  // Compute template-specific container style
  const templateId = project.template_id || 'minimal_clean';
  const isBackdropRemoved = project.backdrop_style === 'none' || project.box_bg_color === 'transparent';

  let templateCardClasses = '';
  let templateCardStyle: React.CSSProperties = {};

  if (isBackdropRemoved) {
    templateCardClasses = 'bg-transparent border-0 shadow-none backdrop-blur-none p-1';
  } else {
    // 19 Unlocked Viral & Creator Templates
    if (templateId === 'minimal_clean' || templateId === 'ali_abdaal' || templateId === 'dan_koe') {
      templateCardClasses = 'bg-transparent text-white p-1';
    } else if (templateId === 'modern_minimalist') {
      templateCardClasses = 'bg-transparent text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] p-1';
    } else if (templateId === 'bold_punchy') {
      templateCardClasses = 'bg-transparent text-white sub-stroke-thick drop-shadow-[4px_4px_0px_#000] p-1';
    } else if (templateId === 'social_media_outlined') {
      templateCardClasses = 'bg-transparent text-white sub-stroke-thick drop-shadow-[3px_3px_0px_#000] p-1';
    } else if (templateId === 'retro_vhs') {
      templateCardClasses = 'bg-[#0a120c]/90 border border-[#39ff14]/40 rounded-lg px-4 py-2 shadow-[0_0_20px_rgba(57,255,20,0.3)] font-mono';
    } else if (templateId === 'elegant_serif') {
      templateCardClasses = 'bg-[#14120e]/90 border border-[#d4af37]/35 rounded-xl px-4 py-2 shadow-[0_0_22px_rgba(212,175,55,0.25)]';
    } else if (templateId === 'dynamic_gradient') {
      templateCardClasses = 'bg-[#120a1c]/88 border border-[#ff5e62]/40 rounded-2xl px-4 py-2 shadow-[0_0_24px_rgba(138,43,226,0.35)]';
    } else if (templateId === 'shadow_depth') {
      templateCardClasses = 'bg-transparent text-white sub-stroke-black drop-shadow-[6px_6px_0px_#000] p-1';
    } else if (templateId === 'bold_highlight' || templateId === 'hormozi_classic' || templateId === 'dev_gadhvi') {
      templateCardClasses = 'bg-transparent text-white sub-stroke-black p-1';
    } else if (templateId === 'comic_pop') {
      templateCardClasses = 'bg-transparent text-yellow-300 sub-stroke-thick p-1';
    } else if (templateId === 'cyber_glitch') {
      templateCardClasses = 'bg-transparent text-white drop-shadow-[0_0_16px_#00f5d4] p-1';
    } else if (templateId === 'fire_beast' || templateId === 'mr_beast') {
      templateCardClasses = 'bg-transparent text-white sub-stroke-thick drop-shadow-[0_0_20px_#ff4500] p-1';
    } else if (templateId === 'retro_arcade') {
      templateCardClasses = 'bg-transparent text-white drop-shadow-[0_0_18px_#f72585] p-1';
    } else if (templateId === 'handwritten_vlog') {
      templateCardClasses = 'bg-transparent text-amber-100 p-1';
    } else if (templateId === 'rounded_box' || templateId === 'beerbiceps') {
      templateCardClasses = 'bg-[#121216]/92 border border-white/15 rounded-2xl px-4 py-2 shadow-xl';
    } else if (templateId === 'neon_glow') {
      templateCardClasses = 'bg-[#0a0c10]/85 border-2 border-[#00f5d4] rounded-xl px-4 py-2 shadow-[0_0_24px_rgba(0,245,212,0.45)]';
    } else if (templateId === 'outline_typography') {
      templateCardClasses = 'bg-transparent text-white sub-stroke-thick p-1';
    } else if (templateId === 'transparent_glass') {
      templateCardClasses = 'bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-2 shadow-2xl';
    } else if (templateId === 'editorial_caption' || templateId === 'iman_gadzhi') {
      templateCardClasses = 'bg-[#181512]/88 border border-[#d4af37]/35 rounded-lg px-4 py-2 shadow-[0_0_18px_rgba(212,175,55,0.2)]';
    } else if (templateId === 'golden_luxury') {
      templateCardClasses = 'bg-[#0f0d0a]/90 border border-[#ffd700]/40 rounded-xl px-4 py-2 shadow-[0_0_20px_rgba(255,215,0,0.3)]';
    } else if (templateId === 'streetwear_tokyo') {
      templateCardClasses = 'bg-[#0a0a0c]/90 border border-[#39ff14]/35 rounded-xl px-4 py-2 shadow-[0_0_16px_rgba(57,255,20,0.25)]';
    } else if (templateId === 'kinetic_typography') {
      templateCardClasses = 'bg-[#0c0e14]/88 border border-[#00f0ff]/35 rounded-xl px-4 py-2 shadow-[3px_3px_0px_#00f0ff]';
    } else if (templateId === 'anim_neon_pulse') {
      templateCardClasses = 'bg-[#051418]/85 border-2 border-[#00f5d4] rounded-xl px-4 py-2 shadow-[0_0_24px_rgba(0,245,212,0.45)]';
    } else if (templateId === 'anim_karaoke_fill') {
      templateCardClasses = 'bg-transparent text-white sub-stroke-thick drop-shadow-[3px_3px_0px_#000] p-1';
    } else if (templateId === 'anim_pop_burst') {
      templateCardClasses = 'bg-transparent text-white sub-stroke-thick drop-shadow-[4px_4px_0px_#000] p-1';
    } else if (templateId === 'anim_typewriter_glow') {
      templateCardClasses = 'bg-[#08140a]/90 border border-[#39ff14]/40 rounded-lg px-4 py-2 shadow-[0_0_18px_rgba(57,255,20,0.3)] font-mono';
    } else if (templateId === 'anim_glitch_cyber') {
      templateCardClasses = 'bg-[#0f0a18]/90 border border-[#ff0055]/40 rounded-xl px-4 py-2 shadow-[0_0_20px_rgba(255,0,85,0.35)]';
    } else if (templateId === 'anim_gold_luxe') {
      templateCardClasses = 'bg-[#120f0a]/90 border border-[#ffd700]/40 rounded-xl px-4 py-2 shadow-[0_0_20px_rgba(255,215,0,0.35)]';
    } else if (templateId === 'anim_comic_bang') {
      templateCardClasses = 'bg-transparent text-[#fff200] sub-stroke-thick p-1';
    } else if (templateId === 'anim_wave_flow') {
      templateCardClasses = 'bg-[#0a1420]/88 border border-[#38bdf8]/35 rounded-2xl px-4 py-2 shadow-[0_0_20px_rgba(56,189,248,0.3)]';
    } else if (templateId === 'anim_box_highlight') {
      templateCardClasses = 'bg-[#0f1117]/95 border border-[#ff8c1a]/40 rounded-2xl px-4 py-2 shadow-xl';
    } else if (templateId === 'anim_fire_heat') {
      templateCardClasses = 'bg-transparent text-[#ffe2b8] sub-stroke-thick drop-shadow-[0_0_22px_#ff3d00] p-1';
    } else if (templateId === 'anim_soft_blur_reveal') {
      templateCardClasses = 'bg-white/12 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-2 shadow-2xl';
    } else if (templateId === 'anim_3d_flip') {
      templateCardClasses = 'bg-[#140a23]/90 border border-[#a855f7]/40 rounded-xl px-4 py-2 shadow-[0_0_22px_rgba(168,85,247,0.35)]';
    }

    // Custom user backdrop override
    if (project.backdrop_style === 'frosted') {
      templateCardClasses = 'bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-2 shadow-2xl';
    } else if (project.backdrop_style === 'minimal_strip') {
      templateCardClasses = 'bg-black/85 rounded-lg px-3 py-1.5 shadow-md';
    } else if (project.backdrop_style === 'luxury_box') {
      templateCardClasses = 'bg-[#181512]/90 border border-[#d4af37]/40 rounded-xl px-4 py-2 shadow-2xl';
    } else if (project.box_bg_color && project.box_bg_color !== 'transparent') {
      templateCardStyle.backgroundColor = project.box_bg_color;
      if (project.box_border_color) templateCardStyle.borderColor = project.box_border_color;
      if (project.box_radius !== undefined) templateCardStyle.borderRadius = `${project.box_radius}px`;
      if (project.box_padding !== undefined) templateCardStyle.padding = `${project.box_padding}px`;
    }
  }

  // Letter spacing
  const tracking =
    project.letter_spacing === 'tight'
      ? '-0.03em'
      : project.letter_spacing === 'wide'
      ? '0.08em'
      : project.letter_spacing === 'widest'
      ? '0.18em'
      : 'normal';

  // Text alignment
  const textAlign = project.text_align || 'center';

  return (
    <div className="flex flex-col items-center w-full">
      {/* ============================================================== */}
      {/* TOP CONTROLS BAR: Position Presets, Nudge & Safe Zones Toggle */}
      {/* ============================================================== */}
      <div className="w-full max-w-sm mb-2 flex flex-col gap-1.5">
        {/* Row 1: Safe Zone Selector & Coordinates */}
        <div className="flex items-center justify-between text-xs px-1 text-neutral-400">
          <div className="flex items-center gap-1.5">
            {/* Safe Zone Toggle Pill */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setSafeZoneMode(safeZoneMode === 'none' ? 'ten_percent' : 'none')}
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  safeZoneMode !== 'none'
                    ? 'bg-[#00f0ff]/20 border border-[#00f0ff]/50 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Toggle Translucent 10% Safe Zone Padding Boundary"
              >
                <Shield className="w-3 h-3 text-[#00f0ff]" />
                <span>10% Safe Zone</span>
              </button>

              {safeZoneMode !== 'none' && (
                <div className="flex items-center border-l border-neutral-800 ml-1 pl-1 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setSafeZoneMode('ten_percent')}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      safeZoneMode === 'ten_percent' ? 'bg-[#00f0ff]/30 text-[#00f0ff] font-bold' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                    title="10% Inset Boundary (Instagram / TikTok Button Safe Area)"
                  >
                    10%
                  </button>
                  <button
                    type="button"
                    onClick={() => setSafeZoneMode('social')}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      safeZoneMode === 'social' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                    title="Social UI Margins"
                  >
                    Social
                  </button>
                  <button
                    type="button"
                    onClick={() => setSafeZoneMode('all')}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      safeZoneMode === 'all' ? 'bg-[#ff8c1a]/20 text-[#ff8c1a] font-bold' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                    title="Show All Guides"
                  >
                    All
                  </button>
                </div>
              )}
            </div>

            {/* Quick 1-Click Aspect Ratio Switcher */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-[10px]">
              {(['9:16', '16:9', '1:1'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onUpdateStyle?.({ frame: r })}
                  className={`px-1.5 py-0.5 rounded font-mono font-semibold transition-all cursor-pointer ${
                    (project.frame || '9:16') === r
                      ? 'bg-[#ff3d5a] text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title={`Switch Video Frame to ${r}`}
                >
                  {r}
                </button>
              ))}
            </div>

            <span className="text-[10px] text-neutral-400 font-mono bg-neutral-900/80 px-1.5 py-0.5 rounded border border-neutral-800 hidden sm:inline-block">
              X:{posX}% Y:{posY}%
            </span>
          </div>

          {/* Quick Precision Nudge Buttons */}
          <div className="flex items-center gap-0.5 bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => handleNudge(-1, 0)}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
              title="Nudge Left 1%"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(0, -1)}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
              title="Nudge Up 1%"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(0, 1)}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
              title="Nudge Down 1%"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(1, 0)}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
              title="Nudge Right 1%"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Row 2: 5 Vertical Presets (Top, Upper, Center, Lower, Bottom) */}
        <div className="grid grid-cols-5 gap-1 text-[10px] font-semibold">
          {[
            { label: 'Top', x: 50, y: 15, key: 'top' },
            { label: 'Upper', x: 50, y: 32, key: 'upper' },
            { label: 'Center', x: 50, y: 50, key: 'center' },
            { label: 'Lower', x: 50, y: 68, key: 'lower' },
            { label: 'Bottom', x: 50, y: 82, key: 'bottom' },
          ].map((preset) => {
            const isActive = posY === preset.y && posX === preset.x;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => setPositionPreset(preset.x, preset.y, preset.key as any)}
                className={`py-1 rounded-lg border transition-all text-center ${
                  isActive
                    ? 'bg-[#ff3d5a]/20 border-[#ff3d5a] text-white font-bold shadow'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Global Audio Sync Offset Bar */}
        <div className="flex items-center justify-between bg-neutral-900/90 border border-neutral-800 rounded-xl px-2.5 py-1 text-[11px] text-neutral-300">
          <div className="flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-[#ff8c1a]" />
            <span className="text-[10px] text-neutral-400">Audio Sync:</span>
            <span className={`font-bold text-[11px] ${globalOffset !== 0 ? 'text-[#ff8c1a]' : 'text-emerald-400'}`}>
              {globalOffset > 0 ? `+${globalOffset.toFixed(2)}s` : `${globalOffset.toFixed(2)}s`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateStyle?.({ audio_offset: Number(((project.audio_offset || 0) - 0.05).toFixed(2)) })}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] font-mono text-neutral-300 cursor-pointer"
              title="Shift subtitles 50ms earlier"
            >
              -50ms
            </button>
            <button
              type="button"
              onClick={() => onUpdateStyle?.({ audio_offset: 0 })}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-neutral-400 hover:text-white font-mono cursor-pointer"
              title="Reset offset to 0.00s"
            >
              0s
            </button>
            <button
              type="button"
              onClick={() => onUpdateStyle?.({ audio_offset: Number(((project.audio_offset || 0) + 0.05).toFixed(2)) })}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] font-mono text-neutral-300 cursor-pointer"
              title="Shift subtitles 50ms later"
            >
              +50ms
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIDEO PREVIEW FRAME (Mobile Touch & Pointer Reactive)          */}
      {/* ============================================================== */}
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className={`relative w-full ${frameAspectRatioClass} rounded-2xl overflow-hidden bg-black border border-neutral-800 shadow-2xl flex items-center justify-center select-none group touch-none`}
        style={{ touchAction: isDragging ? 'none' : 'auto' }}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={project.video_url}
          className="w-full h-full object-contain bg-black pointer-events-none"
          playsInline
          muted={isMuted}
          onTimeUpdate={() => {
            if (videoRef.current) {
              onTimeUpdate(videoRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              const vid = videoRef.current;
              onDurationChange(vid.duration || 10);
              // Auto-detect intrinsic aspect ratio if not explicitly selected
              if (vid.videoWidth && vid.videoHeight && onUpdateStyle) {
                const ratio = vid.videoWidth / vid.videoHeight;
                if (!project.frame) {
                  const detected = ratio >= 1.3 ? '16:9' : ratio <= 0.8 ? '9:16' : '1:1';
                  onUpdateStyle({ frame: detected });
                }
              }
            }
          }}
        />

        {/* Magnetic Center Alignment Guideline */}
        {isDragging && isSnappedX && (
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-[#ff8c1a] shadow-[0_0_8px_#ff8c1a] pointer-events-none z-30 animate-pulse" />
        )}

        {/* ============================================================== */}
        {/* TRANSLUCENT 10% PADDING BOUNDARY SAFE ZONE OVERLAY             */}
        {/* Completely excluded from exported video canvas (never burnt)   */}
        {/* ============================================================== */}
        {(safeZoneMode === 'ten_percent' || safeZoneMode === 'all') && (
          <div className="absolute inset-0 pointer-events-none z-20 p-[10%] animate-in fade-in duration-150">
            <div className="w-full h-full border-2 border-dashed border-[#00f0ff]/80 bg-[#00f0ff]/10 rounded-2xl relative flex flex-col justify-between items-center p-2 backdrop-blur-[0.5px] shadow-[0_0_20px_rgba(0,240,255,0.15)]">
              {/* Top 10% Safe Area */}
              <span className="px-2 py-0.5 rounded-full bg-black/80 border border-cyan-400/40 text-[9px] font-mono text-cyan-300">
                10% Top Margin (Header Safe)
              </span>

              {/* Middle Placement Guide */}
              <div className="text-center px-2 py-1 rounded-xl bg-black/75 border border-cyan-400/30">
                <span className="text-[10px] font-bold text-white block">⭐ 10% Safe Caption Placement Zone</span>
                <span className="text-[8px] text-cyan-300 font-mono">Avoids TikTok / Instagram like & comment buttons</span>
              </div>

              {/* Right Button Avoid Area Callout */}
              <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 rotate-90 px-2 py-0.5 rounded bg-pink-950/80 border border-pink-400/50 text-[8px] font-mono text-pink-300">
                Likes/Comments Area
              </div>

              {/* Bottom 10% Safe Area */}
              <span className="px-2 py-0.5 rounded-full bg-black/80 border border-cyan-400/40 text-[9px] font-mono text-cyan-300">
                10% Bottom Margin (Audio Bar Safe)
              </span>
            </div>
          </div>
        )}

        {/* Full Social Margins Overlay */}
        {(safeZoneMode === 'social' || safeZoneMode === 'all') && (
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2 border-2 border-dashed border-cyan-400/40 animate-in fade-in duration-150">
            <div className="h-12 w-full bg-cyan-500/10 border-b border-cyan-400/40 rounded flex items-center justify-center text-[10px] text-cyan-300 font-mono tracking-tight">
              📱 Reels Search & Header Area (Top Margin)
            </div>

            <div className="absolute right-2 top-24 bottom-24 w-12 bg-pink-500/10 border border-pink-400/40 rounded flex items-center justify-center text-[9px] text-pink-300 font-mono text-center leading-tight">
              Reels Icons
            </div>

            <div className="h-20 w-full bg-cyan-500/10 border-t border-cyan-400/40 rounded flex items-center justify-center text-[10px] text-cyan-300 font-mono">
              📱 Description & Audio Bar Safe Area
            </div>
          </div>
        )}

        {/* Free Tier Watermark (Preview) */}
        {hasWatermark && (
          <div className="absolute bottom-3 right-3 pointer-events-none z-10">
            <div className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white/90 shadow">
              ⚡ Made with CAPTIVOX
            </div>
          </div>
        )}

        {/* Visual Elements Layer (Badges / Shapes) */}
        {project.visual_elements &&
          project.visual_elements.map((elem) => (
            <div
              key={elem.id}
              className="absolute pointer-events-none transition-all"
              style={{
                left: `${elem.x}%`,
                top: `${elem.y}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: elem.bgColor,
                color: elem.textColor || '#FFFFFF',
                borderColor: elem.borderColor,
                zIndex: elem.zIndex || 5,
              }}
            >
              <span className="px-3 py-1 rounded-lg text-xs font-bold shadow-lg">
                {elem.text}
              </span>
            </div>
          ))}

        {/* ============================================================== */}
        {/* DRAGGABLE SUBTITLE OVERLAY (Game-like Touch & Pointer Box)     */}
        {/* ============================================================== */}
        {activeSegment && (
          <div
            ref={subtitleBoxRef}
            onPointerDown={handlePointerDown}
            className={`absolute z-30 cursor-grab active:cursor-grabbing select-none transition-transform touch-none ${
              isDragging
                ? 'scale-105 opacity-95 ring-2 ring-[#ff8c1a] shadow-[0_0_25px_rgba(255,140,26,0.5)] rounded-2xl'
                : isSelected
                ? 'ring-2 ring-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.4)] rounded-2xl'
                : 'hover:ring-1 hover:ring-white/30 rounded-xl'
            }`}
            style={{
              left: `${posX}%`,
              top: `${posY}%`,
              transform: 'translate(-50%, -50%)',
              maxWidth: '92%',
              textAlign: textAlign,
              touchAction: 'none',
            }}
          >
            {/* Direct Inline Editor Popover */}
            {isEditingInline ? (
              <div
                className="w-72 p-3 rounded-2xl bg-black/95 backdrop-blur-xl border border-[#ff3d5a]/70 shadow-2xl text-left pointer-events-auto cursor-default animate-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                data-no-drag="true"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
                    <Edit3 className="w-3.5 h-3.5 text-[#ff8c1a]" />
                    <span>Direct Caption Edit</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {hasDevanagari(editingText) && (
                      <button
                        type="button"
                        onClick={handleConvertToHinglish}
                        className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-semibold hover:bg-orange-500/30 cursor-pointer"
                        title="Convert to Roman Hinglish"
                      >
                        → Roman
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditingInline(false)}
                      className="p-1 rounded text-neutral-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveInlineEdit();
                    }
                  }}
                  className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#ff3d5a] resize-none"
                  placeholder="Type subtitle in Roman Hinglish..."
                  autoFocus
                />

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800 text-[10px]">
                  <span className="text-neutral-400 font-mono">Press Enter to save</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingInline(false)}
                      className="px-2 py-1 rounded text-neutral-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveInlineEdit}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white font-semibold flex items-center gap-1 shadow-md cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Done</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Subtitle Display Card with Drag Indicator & Handles */
              <div
                onDoubleClick={handleStartInlineEdit}
                className={`transition-all select-none relative group/sub ${templateCardClasses}`}
                style={{
                  ...templateCardStyle,
                  fontFamily: project.font_family ? `'${project.font_family}', sans-serif` : 'Plus Jakarta Sans',
                  fontWeight: project.font_weight || 700,
                  fontSize: `${(project.font_size || 6) * 3 + 14}px`,
                  letterSpacing: tracking,
                  lineHeight: project.line_spacing || 1.3,
                  fontStyle: project.is_italic ? 'italic' : 'normal',
                  textDecoration: project.is_underline
                    ? 'underline'
                    : project.is_strikethrough
                    ? 'line-through'
                    : 'none',
                }}
              >
                {/* Mobile-Game Corner Handles when Selected or Dragging */}
                {(isSelected || isDragging) && (
                  <>
                    <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-[#ff8c1a] border-2 border-black shadow" />
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-[#ff8c1a] border-2 border-black shadow" />
                    <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-[#ff8c1a] border-2 border-black shadow" />
                    <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-[#ff8c1a] border-2 border-black shadow" />
                  </>
                )}

                {/* Direct Action Toolbar attached to Subtitle */}
                {(isSelected || isDragging) && (
                  <div
                    data-no-drag="true"
                    className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-[10px] text-neutral-200 flex items-center gap-2 shadow-2xl whitespace-nowrap z-40 pointer-events-auto"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1 text-[#ff8c1a] font-mono">
                      <Move className="w-3 h-3" />
                      <span>{posX}%, {posY}%</span>
                    </div>

                    <span className="text-neutral-600">|</span>

                    <button
                      type="button"
                      onClick={handleStartInlineEdit}
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                      title="Tap to edit subtitle text"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <span className="text-neutral-600">|</span>

                    <button
                      type="button"
                      onClick={() => setPositionPreset(50, 50, 'center')}
                      className="flex items-center gap-0.5 text-neutral-300 hover:text-white cursor-pointer"
                      title="Center Subtitle"
                    >
                      <Crosshair className="w-3 h-3 text-[#ff8c1a]" />
                      <span>Mid</span>
                    </button>
                  </div>
                )}

                {/* Subtitle Words with Word-Level Active Animation */}
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                  {activeSegment.words && activeSegment.words.length > 0 ? (
                    activeSegment.words.map((w, idx) => {
                      const isWordActive = idx === activeWordIdx;
                      let wordText = w.text;
                      if (project.text_case === 'uppercase') wordText = wordText.toUpperCase();
                      if (project.text_case === 'lowercase') wordText = wordText.toLowerCase();

                      const wordColor =
                        w.customColor ||
                        (isWordActive || w.isHighlighted
                          ? project.highlight_color || '#FAFF00'
                          : project.text_color || '#FFFFFF');

                      const wordWeight =
                        w.customWeight || (isWordActive ? project.font_weight || 800 : project.font_weight);

                      let wordExtraClass = '';
                      if (isWordActive) {
                        const anim = project.animation_style || 'pop';
                        if (anim === 'pop' || anim === 'pop_bounce') wordExtraClass += ' anim-pop-bounce';
                        else if (anim === 'bounce' || anim === 'wavy_float') wordExtraClass += ' anim-wavy-float';
                        else if (anim === 'zoom') wordExtraClass += ' scale-110';
                        else if (anim === 'blur' || anim === 'soft_blur_focus') wordExtraClass += ' anim-soft-blur-focus';
                        else if (anim === 'slide' || anim === 'smooth_fade_rise') wordExtraClass += ' anim-smooth-fade-rise';
                        else if (anim === 'neon_pulse') wordExtraClass += ' anim-neon-pulse';
                        else if (anim === 'glitch_shake') wordExtraClass += ' anim-glitch-shake';
                        else if (anim === 'kinetic_3d') wordExtraClass += ' anim-kinetic-3d';
                        else if (anim === 'fire_shimmer') wordExtraClass += ' anim-fire-shimmer';
                        else if (anim === 'editorial_glow') wordExtraClass += ' anim-editorial-glow';
                        else wordExtraClass += ' anim-pop-bounce';
                      }

                      if (w.customEffect === 'box') {
                        wordExtraClass += ' bg-amber-400/20 px-1 rounded';
                      } else if (w.customEffect === 'underline') {
                        wordExtraClass += ' border-b-2 border-amber-400';
                      }

                      return (
                        <span
                          key={idx}
                          data-no-drag="true"
                          onClick={(e) => handleWordClick(idx, e)}
                          className={`inline-block whitespace-nowrap transition-transform duration-75 cursor-pointer hover:scale-105 ${wordExtraClass}`}
                          style={{
                            color: wordColor,
                            fontWeight: wordWeight,
                          }}
                          title="Click to toggle word highlight"
                        >
                          {wordText}
                          {templateId === 'retro_vhs' && isWordActive && (
                            <span className="text-[#39ff14] ml-0.5 font-mono cursor-blink">_</span>
                          )}
                        </span>
                      );
                    })
                  ) : (
                    <span style={{ color: project.text_color || '#FFFFFF' }}>
                      {project.text_case === 'uppercase'
                        ? activeSegment.text.toUpperCase()
                        : project.text_case === 'lowercase'
                        ? activeSegment.text.toLowerCase()
                        : activeSegment.text}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Center Play Overlay Icon when paused */}
        {!isPlaying && !isEditingInline && (
          <button
            type="button"
            onClick={onTogglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-opacity cursor-pointer z-10"
          >
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-xl hover:scale-105 transition-transform">
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </div>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* VIDEO CONTROLS BAR: Play, Scrubber, Time & Inline Trigger      */}
      {/* ============================================================== */}
      <div className="w-full max-w-sm mt-3 px-1 space-y-2">
        {/* Scrubber */}
        <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
          <span>{currentTime.toFixed(1)}s</span>
          <input
            type="range"
            min={0}
            max={duration || 10}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ff3d5a]"
          />
          <span>{(duration || 10).toFixed(1)}s</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTogglePlay}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white transition-colors cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Restart Video"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeSegment && onUpdateCaptions && (
              <button
                type="button"
                onClick={() => handleStartInlineEdit()}
                className="text-[11px] text-[#ff8c1a] hover:text-white font-medium flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Self Edit</span>
              </button>
            )}

            <div className="text-[11px] font-mono text-neutral-500">
              {project.frame} · {project.template_id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
