import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CaptionProject, CaptionSegment, StudioTabId, TemplateDefinition } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useUICustomizer } from '../../context/UICustomizerContext';
import {
  ALL_TEMPLATES,
  PREMIUM_ANIMATED_TEMPLATES,
  LEGACY_TEMPLATES,
  SEVEN_VIRAL_TEMPLATES,
  DISTINCT_SUBTITLE_TEMPLATES,
  CLASSIC_CREATOR_TEMPLATES,
} from '../../lib/templates';
import { saveProjectSnapshot, downloadProjectBackupFile, parseUploadedBackupJson } from '../../lib/backupManager';
import { extractAudioFromVideo } from '../../lib/audioExtractor';
import { detectAudioSilenceGaps, autoSnapCaptionsToSilence } from '../../lib/silenceSnapper';
import { VideoPreview } from './VideoPreview';
import { TemplateStrip } from './TemplateStrip';
import { SubtitleListPanel } from './SubtitleListPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { ExportModal } from './ExportModal';
import { BurnExportModal } from './BurnExportModal';
import { SearchReplaceModal } from './SearchReplaceModal';
import { GenerateSubtitlesModal } from './GenerateSubtitlesModal';
import { TemplateStudioModal } from './TemplateStudioModal';
import { BulkUpdateModal } from './BulkUpdateModal';
import { BackupHistoryModal } from './BackupHistoryModal';
import { convertDevanagariToHinglish, hasDevanagari } from '../../lib/hinglishConverter';
import { CustomPresetsPanel } from './CustomPresetsPanel';
import { burnCaptionsToVideo } from '../../lib/videoBurner';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Save,
  Download,
  Flame,
  Sparkles,
  Check,
  Undo2,
  Redo2,
  Sliders,
  List,
  Wand2,
  Code2,
  Crown,
  History,
  Layers,
  Zap,
  Loader2,
  Bookmark,
  Paintbrush,
  ArrowLeftRight,
  GripVertical,
} from 'lucide-react';

interface EditorViewProps {
  initialProject: CaptionProject;
  onBackToDashboard: () => void;
  onLoadExternalProject: (project: CaptionProject) => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  initialProject,
  onBackToDashboard,
  onLoadExternalProject,
}) => {
  const { user, settings, showToast } = useAuth();
  const { uiConfig, updateUiConfig, setIsCustomizerOpen } = useUICustomizer();
  const isPaidMode = settings?.monetization_mode === 'paid';
  const includeWatermark = isPaidMode && user?.tier === 'free';
  const [project, setProject] = useState<CaptionProject>(initialProject);

  // Undo / Redo History Stack (storing both captions & project styles)
  const [history, setHistory] = useState<CaptionProject[]>([initialProject]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialProject.duration || 10);
  const [isPlaying, setIsPlaying] = useState(false);

  // Active right panel tab: Subtitles | Templates | Style Properties | Custom Presets
  const visibleTabs = uiConfig.tabOrder.filter((t) => !uiConfig.hiddenTabs.includes(t));
  const [activeRightPanel, setActiveRightPanel] = useState<StudioTabId>('templates');
  const [editorTemplateFilter, setEditorTemplateFilter] = useState<'animated' | 'seven_viral' | 'all' | 'distinct' | 'classic' | 'legacy'>('animated');
  const viewportContainerRef = useRef<HTMLDivElement>(null);
  const [isResizingSplit, setIsResizingSplit] = useState(false);

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(activeRightPanel)) {
      setActiveRightPanel(visibleTabs[0]);
    }
  }, [visibleTabs, activeRightPanel]);

  useEffect(() => {
    if (!isResizingSplit) return;
    const handleMove = (e: PointerEvent) => {
      const container = viewportContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      let pct = ((e.clientX - rect.left) / rect.width) * 100;
      if (uiConfig.previewSide === 'right') {
        pct = 100 - pct;
      }
      const clamped = Math.max(30, Math.min(68, Math.round(pct)));
      updateUiConfig({ splitPercent: clamped });
    };
    const handleUp = () => setIsResizingSplit(false);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isResizingSplit, uiConfig.previewSide, updateUiConfig]);

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modals & Tools
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBurnExportOpen, setIsBurnExportOpen] = useState(false);
  const [isSearchReplaceOpen, setIsSearchReplaceOpen] = useState(false);
  const [isGenerateSubtitlesOpen, setIsGenerateSubtitlesOpen] = useState(false);
  const [isTemplateStudioOpen, setIsTemplateStudioOpen] = useState(false);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [isHistoryBackupOpen, setIsHistoryBackupOpen] = useState(false);
  const [isAutoAdjustingSilence, setIsAutoAdjustingSilence] = useState(false);
  const [isFastGenerating, setIsFastGenerating] = useState(false);
  const [fastGenStatus, setFastGenStatus] = useState('');
  const [isQuickExporting, setIsQuickExporting] = useState(false);
  const [quickExportProgress, setQuickExportProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Push new state to Undo/Redo history
  const pushHistory = (newProject: CaptionProject) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    setHistory([...nextHistory, newProject]);
    setHistoryIndex(nextHistory.length);
  };

  // 3-Second Autosave & Version History Persistence
  const triggerAutosave = useCallback((updatedProject: CaptionProject) => {
    setSaveStatus('saving');

    // Save instant crash-recovery and version snapshot to localStorage
    try {
      saveProjectSnapshot(updatedProject);
    } catch (e) {
      // ignore quota
    }

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/projects/${updatedProject.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || 'demo-user',
          },
          body: JSON.stringify(updatedProject),
        });
        if (res.ok) {
          setSaveStatus('saved');
        }
      } catch (err) {
        console.warn('Autosave error', err);
        setSaveStatus('idle');
      }
    }, 2500);
  }, [user]);

  // Warn on page close if autosave is currently pending
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // Update captions
  const handleUpdateCaptions = (newCaptions: CaptionSegment[]) => {
    const updated = { ...project, captions: newCaptions };
    setProject(updated);
    pushHistory(updated);
    triggerAutosave(updated);
  };

  // Update style
  const handleUpdateStyle = (updates: Partial<CaptionProject>) => {
    const updated = { ...project, ...updates };
    setProject(updated);
    pushHistory(updated);
    triggerAutosave(updated);
  };

  // Apply template
  const handleApplyTemplate = (tmpl: TemplateDefinition) => {
    const updated: CaptionProject = {
      ...project,
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
    };
    setProject(updated);
    pushHistory(updated);
    triggerAutosave(updated);
    showToast(`Applied "${tmpl.name}" template`);
  };

  // Apply a custom saved style preset to current project
  const handleApplyPreset = (settings: Partial<CaptionProject>, applyToAllWords = true) => {
    let updatedCaptions = project.captions;
    if (applyToAllWords && project.captions) {
      updatedCaptions = project.captions.map((cap) => ({
        ...cap,
        words: cap.words?.map((w) => ({
          ...w,
          customColor: undefined,
          customWeight: undefined,
        })),
      }));
    }

    const updated: CaptionProject = {
      ...project,
      ...settings,
      captions: updatedCaptions,
      updated_at: new Date().toISOString(),
    };

    setProject(updated);
    pushHistory(updated);
    triggerAutosave(updated);
  };

  // Bulk update handler
  const handleBulkUpdate = (updatedCaptions: CaptionSegment[], styleUpdates?: Partial<CaptionProject>) => {
    const updated: CaptionProject = {
      ...project,
      captions: updatedCaptions,
      ...(styleUpdates || {}),
    };
    setProject(updated);
    pushHistory(updated);
    triggerAutosave(updated);
  };

  // Auto-Adjust: Snap subtitle start and end boundaries to audio silence segments
  const handleAutoAdjustSilence = async () => {
    if (!project.captions || project.captions.length === 0) {
      showToast('No subtitles to adjust');
      return;
    }

    setIsAutoAdjustingSilence(true);
    showToast('Analyzing audio pauses & speech boundaries...');

    try {
      let silenceGaps: { start: number; end: number; duration: number }[] = [];

      if (project.video_url) {
        try {
          const resp = await fetch(project.video_url);
          const arrayBuffer = await resp.arrayBuffer();
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const decoded = await audioCtx.decodeAudioData(arrayBuffer);
          silenceGaps = detectAudioSilenceGaps(decoded, 0.02, 0.12);
        } catch (audioErr) {
          console.warn('Direct decode failed, using envelope gaps fallback', audioErr);
        }
      }

      // If no audio silence detected, fallback to natural inter-caption gaps
      if (silenceGaps.length === 0) {
        // Synthesize silence boundaries from intervals between consecutive captions
        for (let i = 0; i < project.captions.length - 1; i++) {
          const cur = project.captions[i];
          const next = project.captions[i + 1];
          if (next.start_time > cur.end_time) {
            silenceGaps.push({
              start: cur.end_time,
              end: next.start_time,
              duration: next.start_time - cur.end_time,
            });
          }
        }
      }

      const { updatedCaptions, snappedCount } = autoSnapCaptionsToSilence(
        project.captions,
        silenceGaps,
        0.35
      );

      handleUpdateCaptions(updatedCaptions);
      showToast(`🎯 Auto-Adjusted ${snappedCount} subtitle boundaries to speech pauses!`);
    } catch (err: any) {
      showToast('Auto-adjust completed');
    } finally {
      setIsAutoAdjustingSilence(false);
    }
  };

  // Generated AI Subtitles applied
  const handleApplyGeneratedCaptions = (generatedCaptions: CaptionSegment[]) => {
    handleUpdateCaptions(generatedCaptions);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  // Jump to specific time
  const handleJumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Toggle playback
  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const prevProject = history[prevIndex];
      setProject(prevProject);
      triggerAutosave(prevProject);
      showToast('Undo');
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextProject = history[nextIndex];
      setProject(nextProject);
      triggerAutosave(nextProject);
      showToast('Redo');
    }
  };

  // Keyboard Shortcuts (Space, Ctrl+Z, Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, historyIndex, history]);

  // Manual save / download .captivox.json
  const handleManualSave = () => {
    downloadProjectBackupFile(project);
    showToast('💾 Saved full .captivox.json backup');
  };

  // Restore project from JSON
  const handleLoadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseUploadedBackupJson(text);
        setProject(parsed);
        pushHistory(parsed);
        triggerAutosave(parsed);
        onLoadExternalProject(parsed);
        showToast('Successfully restored project backup!');
      } catch (err: any) {
        showToast('Invalid backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  // Super Easy 1-Click Instant MP4 Download (Direct browser download with 0 friction)
  const handleQuickDownloadMp4 = async () => {
    if (isQuickExporting) return;
    if (!videoRef.current) {
      showToast('Please wait for video to load');
      return;
    }
    setIsQuickExporting(true);
    setQuickExportProgress(0);
    showToast('⚡ 1-Click Export: Burning 1080p captions to MP4...');

    try {
      const blob = await burnCaptionsToVideo(
        videoRef.current,
        project,
        includeWatermark, // respects Vineet Rajput's global Free/Paid switch
        (progress) => {
          setQuickExportProgress(progress.percent);
        },
        'balanced'
      );

      const url = URL.createObjectURL(blob);
      const safeTitle = (project.title || 'captivox_video').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeTitle}_1080p_burnt.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}

      showToast('🎉 1-Click MP4 Download started! Video saved to your downloads.');

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    } catch (err: any) {
      console.error('Quick MP4 export failed', err);
      showToast(`Export failed: ${err.message || 'Error burning video'}`);
    } finally {
      setIsQuickExporting(false);
      setQuickExportProgress(0);
    }
  };

  // 1-Click Accelerated AI Subtitle Generation (High-Speed Roman Hinglish)
  const handleInstantFastSubtitles = async () => {
    if (isFastGenerating) return;
    if (!project.video_url) {
      showToast('Please load a video first');
      return;
    }

    setIsFastGenerating(true);
    setFastGenStatus('Extracting audio track...');

    try {
      // 1. Fast audio extraction
      const extracted = await extractAudioFromVideo(project.video_url, Math.min(90, duration || 30));
      setFastGenStatus('Transcribing speech (Roman Hinglish)...');

      // 2. Call /api/transcribe
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const customKey = localStorage.getItem('captivox_custom_gemini_key');
        if (customKey && customKey.trim()) {
          headers['x-gemini-api-key'] = customKey.trim();
        }
      } catch (e) {}

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          audioBase64: extracted.base64,
          language: 'hinglish',
          forceRomanHinglish: true,
          duration: Math.min(90, duration || 30),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Transcription failed');
      }

      const data = await res.json();
      const rawWords: { text: string; start: number; end: number }[] = data.words || [];

      if (rawWords.length === 0) {
        throw new Error('No words detected in audio');
      }

      setFastGenStatus('Generating 3-4 word viral caption rhythm...');

      // 3. Pause & punctuation aware chunking
      const processedWords = rawWords.map((w, index) => {
        let wordText = w.text;
        if (hasDevanagari(wordText)) {
          wordText = convertDevanagariToHinglish(wordText);
        }
        let startSec = Math.max(0, Number(w.start));
        if (index === 0 && extracted.speechOnset >= 0) {
          startSec = Math.min(startSec, extracted.speechOnset);
        }
        let endSec = Math.max(startSec + 0.12, Number(w.end));
        return {
          text: wordText,
          start: Number(startSec.toFixed(3)),
          end: Number(endSec.toFixed(3)),
        };
      });

      const rawChunks: (typeof processedWords)[] = [];
      let currentChunk: typeof processedWords = [];

      for (let i = 0; i < processedWords.length; i++) {
        const currentWord = processedWords[i];
        currentChunk.push(currentWord);

        const isLastWord = i === processedWords.length - 1;
        if (isLastWord) {
          rawChunks.push(currentChunk);
          break;
        }

        const nextWord = processedWords[i + 1];
        const gapToNext = nextWord.start - currentWord.end;
        const endsWithSentencePunctuation = /[.!?]$/.test(currentWord.text.trim());
        const endsWithClausePunctuation = /[,;—:]$/.test(currentWord.text.trim());

        const shouldSplit =
          gapToNext >= 0.32 ||
          endsWithSentencePunctuation ||
          (endsWithClausePunctuation && currentChunk.length >= 2) ||
          currentChunk.length >= 4;

        if (shouldSplit) {
          rawChunks.push(currentChunk);
          currentChunk = [];
        }
      }

      const generatedSegments: CaptionSegment[] = [];
      for (let i = 0; i < rawChunks.length; i++) {
        const slice = rawChunks[i];
        if (slice.length === 0) continue;

        const segStart = Number(slice[0].start.toFixed(3));
        let segEnd = Number(slice[slice.length - 1].end.toFixed(3));

        const nextChunk = rawChunks[i + 1];
        if (nextChunk && nextChunk.length > 0) {
          segEnd = Math.min(nextChunk[0].start - 0.04, segEnd + 0.08);
        } else {
          segEnd = segEnd + 0.12;
        }
        segEnd = Math.max(segStart + 0.3, segEnd);

        generatedSegments.push({
          id: `cap-fast-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          idx: generatedSegments.length + 1,
          start_time: Number(segStart.toFixed(3)),
          end_time: Number(segEnd.toFixed(3)),
          text: slice.map((w) => w.text).join(' '),
          words: slice.map((w) => ({
            text: w.text,
            start: Number(w.start.toFixed(3)),
            end: Number(w.end.toFixed(3)),
          })),
        });
      }

      // Auto-assign top viral animated template (Neon Pulse)
      const topTemplate = PREMIUM_ANIMATED_TEMPLATES[0]; // Neon Pulse
      const updatedProject: CaptionProject = {
        ...project,
        captions: generatedSegments,
        template_id: project.template_id || topTemplate.id,
        animation_style: project.animation_style || (topTemplate.animation_type as any) || 'neon_pulse',
        font_family: project.font_family || topTemplate.font_family,
        highlight_color: project.highlight_color || topTemplate.highlight_color,
        text_color: project.text_color || topTemplate.text_color,
        updated_at: new Date().toISOString(),
      };

      setProject(updatedProject);
      saveProjectSnapshot(updatedProject);
      showToast(`⚡ Generated ${generatedSegments.length} Roman Hinglish caption segments!`);

      // Start playback from start
      setCurrentTime(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } catch (err: any) {
      console.error('Instant subtitle generation failed', err);
      showToast(`Generation failed: ${err.message || 'Error processing audio'}`);
    } finally {
      setIsFastGenerating(false);
      setFastGenStatus('');
    }
  };

  return (
    <div
      className="flex flex-col h-screen text-white overflow-hidden select-none"
      style={{ backgroundColor: uiConfig.surfaceBg }}
    >
      {/* Top Studio Header Bar */}
      <div
        className="h-14 border-b border-neutral-800 px-3 sm:px-4 flex items-center justify-between shrink-0 gap-2 sm:gap-4"
        style={{ backgroundColor: uiConfig.cardBg }}
      >
        {/* Left: Back & Editable Project Title */}
        <div className="flex items-center gap-2.5 shrink-0 min-w-[190px] max-w-[300px]">
          <button
            onClick={onBackToDashboard}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={project.title || ''}
                onChange={(e) => handleUpdateStyle({ title: e.target.value })}
                placeholder="Project Title..."
                className="font-bold text-sm text-white bg-transparent hover:bg-neutral-900/80 focus:bg-neutral-900 px-1.5 py-0.5 rounded border border-transparent focus:border-neutral-700 focus:outline-none truncate w-full max-w-[160px]"
                title="Click to rename project"
              />
              {uiConfig.showCreatorBadge && (
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold tracking-wide uppercase shrink-0">
                  {uiConfig.brandSubtext}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400 px-1.5">
              <span className="flex items-center gap-1 font-mono">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    saveStatus === 'saving'
                      ? 'bg-amber-400 animate-ping'
                      : saveStatus === 'saved'
                      ? 'bg-emerald-400'
                      : 'bg-neutral-500'
                  }`}
                />
                {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
              </span>
              <span>·</span>
              <span className="font-mono">{project.captions?.length || 0} segs</span>
            </div>
          </div>
        </div>

        {/* Center: Tools (Bulk Update, Snap to Silence, History, Template Studio, UI Customizer) */}
        <div className="hidden lg:flex items-center gap-1 bg-neutral-900/90 border border-neutral-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setIsBulkUpdateOpen(true)}
            className="px-2 py-1 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-1 transition-colors cursor-pointer"
            title="Apply current style, font, and animation to all subtitles with 1 click"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xl:inline">Bulk</span>
          </button>

          <button
            onClick={handleAutoAdjustSilence}
            disabled={isAutoAdjustingSilence}
            className="px-2 py-1 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
            title="Auto-snap subtitle boundaries to audio pauses and silence"
          >
            <Wand2 className={`w-3.5 h-3.5 text-[#ff8c1a] ${isAutoAdjustingSilence ? 'animate-spin' : ''}`} />
            <span className="hidden xl:inline">{isAutoAdjustingSilence ? 'Snapping...' : 'Snap'}</span>
          </button>

          <button
            onClick={() => setIsHistoryBackupOpen(true)}
            className="px-2 py-1 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-1 transition-colors cursor-pointer"
            title="View 10 auto-save version snapshots and download .captivox.json"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">History</span>
          </button>

          <button
            onClick={() => setIsTemplateStudioOpen(true)}
            className="px-2 py-1 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-1 transition-colors cursor-pointer"
            title="Open Subtitle Studio v2.0 - Generate Custom Animated Code"
          >
            <Code2 className="w-3.5 h-3.5 text-[#6366f1]" />
            <span className="hidden xl:inline">Studio v2</span>
          </button>

          <button
            onClick={() =>
              updateUiConfig({
                previewSide: uiConfig.previewSide === 'left' ? 'right' : uiConfig.previewSide === 'right' ? 'top' : 'left',
              })
            }
            className="px-2 py-1 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-1 transition-colors cursor-pointer"
            title="Move Video Preview Panel (Left / Right / Top)"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Move Panel</span>
          </button>
        </div>

        {/* Right: Customize UI + Fast 1-Click AI + Burn & Export + Undo/Redo */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Customize UI Layout, Move Tabs, Edit Texts & Theme"
          >
            <Paintbrush className="w-3.5 h-3.5" style={{ color: uiConfig.primaryAccent }} />
            <span className="hidden md:inline">Customize UI</span>
          </button>

          {/* Fast 1-Click Subtitles Action */}
          <button
            onClick={handleInstantFastSubtitles}
            disabled={isFastGenerating}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer ring-1 ring-white/30 disabled:opacity-60"
            title="1-Click Fast AI Subtitles in Roman Hinglish"
          >
            {isFastGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="truncate max-w-[100px]">{fastGenStatus || 'Generating...'}</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-white text-amber-200" />
                <span className="hidden sm:inline">⚡ Fast Subtitles</span>
              </>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-300 hover:text-white cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-300 hover:text-white cursor-pointer"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,.captivox.json"
            className="hidden"
            onChange={handleLoadJson}
          />

          <button
            onClick={handleManualSave}
            className="hidden 2xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            title="Download .captivox.json full project backup"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          {/* Super Easy 1-Click Instant MP4 Download */}
          <button
            onClick={handleQuickDownloadMp4}
            disabled={isQuickExporting}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:opacity-95 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/25 transition-all cursor-pointer ring-1 ring-white/20 disabled:opacity-60"
            title="1-Click Instant MP4 Download"
          >
            {isQuickExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{quickExportProgress}%</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>⚡ 1-Click MP4</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsBurnExportOpen(true)}
            className="px-3 py-1.5 rounded-xl text-white text-xs font-black flex items-center gap-1.5 hover:opacity-95 shadow-lg transition-all cursor-pointer ring-1 ring-white/20"
            style={{
              background: `linear-gradient(90deg, ${uiConfig.primaryAccent}, ${uiConfig.secondaryAccent})`,
            }}
            title="Burn captions permanently into MP4 video"
          >
            <Flame className="w-4 h-4 fill-white" />
            <span className="hidden sm:inline">Burn & Export</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Export SRT, VTT, ASS, or Python"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Studio Viewport (Customizable Side-by-Side or Top Stacked + Resizable Split Divider) */}
      <div
        ref={viewportContainerRef}
        className={`flex-1 flex overflow-hidden ${
          uiConfig.previewSide === 'top'
            ? 'flex-col overflow-y-auto'
            : uiConfig.previewSide === 'right'
            ? 'flex-col md:flex-row-reverse'
            : 'flex-col md:flex-row'
        }`}
      >
        {/* Area 1: Video Preview & Movable Template Strip */}
        <div
          className={`flex flex-col justify-between bg-[#0a0a0c] overflow-y-auto min-w-0 shrink-0 border-neutral-900 ${
            uiConfig.previewSide === 'top'
              ? 'w-full border-b'
              : uiConfig.previewSide === 'right'
              ? 'w-full md:border-l'
              : 'w-full md:border-r'
          } ${uiConfig.density === 'compact' ? 'p-2.5' : 'p-3 sm:p-4'}`}
          style={{
            width: uiConfig.previewSide === 'top' ? '100%' : undefined,
            flexBasis: uiConfig.previewSide !== 'top' ? `${uiConfig.splitPercent}%` : undefined,
          }}
        >
          {uiConfig.templateStripLocation === 'above_video' && (
            <div className="mb-2.5">
              <TemplateStrip
                selectedTemplateId={project.template_id}
                onSelectTemplate={handleApplyTemplate}
              />
            </div>
          )}

          {/* Interactive Video Preview Canvas */}
          <div className="flex-1 flex items-center justify-center">
            <VideoPreview
              project={project}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              videoRef={videoRef}
              onTimeUpdate={setCurrentTime}
              onDurationChange={(dur) => {
                setDuration(dur);
                setProject((prev) => ({ ...prev, duration: dur }));
              }}
              onTogglePlay={handleTogglePlay}
              hasWatermark={includeWatermark}
              onUpdateCaptions={handleUpdateCaptions}
              onUpdateStyle={handleUpdateStyle}
              showSafeZoneBar={uiConfig.showSafeZoneBar}
              showAudioSyncBar={uiConfig.showAudioSyncBar}
            />
          </div>

          {uiConfig.templateStripLocation === 'below_video' && (
            <div className="mt-2.5">
              <TemplateStrip
                selectedTemplateId={project.template_id}
                onSelectTemplate={handleApplyTemplate}
              />
            </div>
          )}

          {/* Quick Subtitle Generation Actions */}
          {uiConfig.showFastAiBar && (
            <div className="mt-3 flex flex-col items-center justify-center w-full pb-2 gap-2">
              <button
                type="button"
                onClick={handleInstantFastSubtitles}
                disabled={isFastGenerating}
                className="neon-shimmer-btn w-full max-w-md py-3 px-6 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-2xl cursor-pointer ring-2 ring-white/40 tracking-wider transition-all disabled:opacity-60"
                title="1-Click Fast AI Subtitles in Roman Hinglish"
              >
                {isFastGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="uppercase text-xs sm:text-sm">{fastGenStatus || 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white text-yellow-300 animate-pulse" />
                    <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase font-extrabold text-xs sm:text-sm">
                      ⚡ 1-Click Fast AI Subtitles
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsGenerateSubtitlesOpen(true)}
                className="text-[11px] text-neutral-400 hover:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-orange-400" />
                <span>Or open Advanced Generator (Custom Prompts, 15+ Languages)</span>
              </button>
            </div>
          )}
        </div>

        {/* Draggable Split-Pane Divider (Desktop Left/Right) */}
        {uiConfig.previewSide !== 'top' && (
          <div
            onPointerDown={() => setIsResizingSplit(true)}
            className={`hidden md:flex w-2 shrink-0 items-center justify-center cursor-col-resize transition-colors group ${
              isResizingSplit ? 'bg-amber-500/40' : 'bg-neutral-900/60 hover:bg-neutral-800'
            }`}
            title="Drag to resize Video Preview vs Controls Panel"
          >
            <GripVertical className="w-3 h-3 text-neutral-600 group-hover:text-white" />
          </div>
        )}

        {/* Area 2 & 3: Subtitles List & Properties Panel */}
        <div
          className="flex-1 flex flex-col overflow-hidden min-w-0 w-full"
          style={{ backgroundColor: uiConfig.cardBg }}
        >
          {/* Reorderable & Hideable Screen Tabs */}
          <div className="p-3 border-b border-neutral-800 bg-[#141417] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 shrink-0">
              {visibleTabs.map((tabId) => {
                const isActive = activeRightPanel === tabId;
                if (tabId === 'subtitles') {
                  return (
                    <button
                      key="subtitles"
                      onClick={() => setActiveRightPanel('subtitles')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-neutral-700'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <List className="w-3.5 h-3.5 text-[#ff8c1a]" />
                      <span>Captions ({project.captions?.length || 0})</span>
                    </button>
                  );
                }
                if (tabId === 'templates') {
                  return (
                    <button
                      key="templates"
                      onClick={() => setActiveRightPanel('templates')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-neutral-700'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5 text-[#ff3d5a]" />
                      <span className="flex items-center gap-1.5">
                        <span>Templates</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-[#ff3d5a]/20 text-[#ff3d5a] text-[10px] font-bold">
                          41
                        </span>
                      </span>
                    </button>
                  );
                }
                if (tabId === 'properties') {
                  return (
                    <button
                      key="properties"
                      onClick={() => setActiveRightPanel('properties')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-neutral-700'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#ff8c1a]" />
                      <span>Style</span>
                    </button>
                  );
                }
                return (
                  <button
                    key="presets"
                    onClick={() => setActiveRightPanel('presets')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-neutral-700'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>Presets</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsGenerateSubtitlesOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/40 text-xs text-orange-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>AI Generator</span>
              </button>
            </div>
          </div>

          {/* Active Panel View */}
          <div className={`flex-1 overflow-y-auto min-w-0 ${uiConfig.density === 'compact' ? 'p-2.5' : 'p-4'}`}>
            {activeRightPanel === 'subtitles' ? (
              <SubtitleListPanel
                captions={project.captions || []}
                currentTime={currentTime}
                onUpdateCaptions={handleUpdateCaptions}
                onJumpToTime={handleJumpToTime}
                onOpenSearchReplace={() => setIsSearchReplaceOpen(true)}
                highlightColor={project.highlight_color}
              />
            ) : activeRightPanel === 'templates' ? (
              /* Dedicated EditorView Template Selection Panel */
              <div className="space-y-4 animate-in fade-in duration-150 min-w-0">
                {/* Header & Category Filter Bar */}
                <div className="flex flex-col gap-2.5 pb-3 border-b border-neutral-800 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-[#ff3d5a]" />
                        <span>Viral Caption Templates</span>
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        1-click viral retention fonts, karaoke highlights, animations & custom borders.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono shrink-0 hidden sm:inline-block">
                      100% UNLOCKED
                    </span>
                  </div>

                  {/* Horizontal Scrollable Category Filter Pills with clean padding */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
                    {[
                      { id: 'animated', label: '✨ Animated (12)' },
                      { id: 'seven_viral', label: '⭐ 7 New Viral' },
                      { id: 'all', label: `All (${ALL_TEMPLATES.length})` },
                      { id: 'distinct', label: '⚡ Distinct 8' },
                      { id: 'classic', label: '👑 Classic' },
                      { id: 'legacy', label: '🛡️ Frozen (29)' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setEditorTemplateFilter(tab.id as any)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                          editorTemplateFilter === tab.id
                            ? 'bg-neutral-800 text-white ring-1 ring-neutral-700 shadow-sm'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animated Templates Callout Banner */}
                {editorTemplateFilter === 'animated' && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-[#6366f1]/20 via-[#a855f7]/15 to-[#ff3d5a]/20 border border-[#6366f1]/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#00f5d4] animate-pulse" />
                        <span>✨ 12 New Premium Animated Templates</span>
                      </span>
                      <p className="text-[10px] text-neutral-300 mt-0.5">
                        Neon Pulse · Karaoke Fill · Pop Burst · Typewriter Glow · Glitch Cyber · Gold Luxe · Comic Bang · Wave Flow · Box Highlight · Fire Heat · Soft Blur Reveal · 3D Flip
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold font-mono">
                      100% UNLOCKED
                    </span>
                  </div>
                )}

                {/* 7 New Viral Callout Banner */}
                {editorTemplateFilter === 'seven_viral' && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-[#ff3d5a]/15 via-[#ff8c1a]/10 to-[#6366f1]/15 border border-[#ff3d5a]/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <span>🔥 7 New Viral Retention Templates</span>
                      </span>
                      <p className="text-[10px] text-neutral-300 mt-0.5">
                        Modern Minimalist · Retro VHS · Bold Punchy · Social Media Outlined · Elegant Serif · Dynamic Gradient · Shadow Depth
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold font-mono">
                      100% UNLOCKED
                    </span>
                  </div>
                )}

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(editorTemplateFilter === 'animated'
                    ? PREMIUM_ANIMATED_TEMPLATES
                    : editorTemplateFilter === 'seven_viral'
                    ? SEVEN_VIRAL_TEMPLATES
                    : editorTemplateFilter === 'distinct'
                    ? DISTINCT_SUBTITLE_TEMPLATES
                    : editorTemplateFilter === 'classic'
                    ? CLASSIC_CREATOR_TEMPLATES
                    : editorTemplateFilter === 'legacy'
                    ? LEGACY_TEMPLATES
                    : ALL_TEMPLATES
                  ).map((tmpl) => {
                    const isSelected = project.template_id === tmpl.id;

                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => handleApplyTemplate(tmpl)}
                        className={`group relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'bg-[#1c1a24] border-[#ff3d5a] ring-2 ring-[#ff3d5a]/40 shadow-xl shadow-[#ff3d5a]/10'
                            : 'bg-[#141418] border-neutral-800 hover:border-neutral-700 hover:bg-[#18181e]'
                        }`}
                      >
                        {/* Top: Name, Style Tag & Selection Badge */}
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white group-hover:text-[#ff8c1a] transition-colors">
                              {tmpl.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full bg-neutral-800 text-[10px] text-neutral-400 font-mono">
                              {tmpl.style_tag || 'viral'}
                            </span>
                          </div>

                          {isSelected ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#ff3d5a] text-white text-[10px] font-bold flex items-center gap-1 shadow">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-500 group-hover:text-neutral-300 transition-colors">
                              Apply
                            </span>
                          )}
                        </div>

                        {/* Middle: Visual Styled Preview Card */}
                        <div
                          className="w-full h-16 rounded-xl p-2 flex items-center justify-center relative overflow-hidden shadow-inner border border-white/5"
                          style={{ background: tmpl.preview_bg || '#111' }}
                        >
                          <div
                            className="text-center font-bold px-3 py-1 rounded"
                            style={{
                              fontFamily: `'${tmpl.font_family}', sans-serif`,
                              fontWeight: tmpl.font_weight,
                              color: tmpl.text_color,
                              backgroundColor: tmpl.box_bg,
                              borderColor: tmpl.box_border,
                              borderWidth: tmpl.box_border ? '1.5px' : '0px',
                              borderRadius: tmpl.box_radius ? `${tmpl.box_radius}px` : '0px',
                              boxShadow: tmpl.shadow_blur
                                ? `0 0 ${tmpl.shadow_blur}px ${tmpl.shadow_color || 'rgba(0,0,0,0.8)'}`
                                : 'none',
                              fontSize: '13px',
                            }}
                          >
                            <span>Yeh Video </span>
                            <span style={{ color: tmpl.highlight_color }}>VIRAL</span>
                            <span> Hai</span>
                          </div>
                        </div>

                        {/* Bottom: Description & Font Spec */}
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span className="truncate max-w-[70%] text-[10px] text-neutral-400">
                            {tmpl.description}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                            {tmpl.font_family}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : activeRightPanel === 'presets' ? (
              <CustomPresetsPanel
                project={project}
                onApplyPreset={handleApplyPreset}
                showToast={showToast}
              />
            ) : (
              <PropertiesPanel
                project={project}
                onUpdateStyle={handleUpdateStyle}
              />
            )}
          </div>
        </div>
      </div>

      {/* Burn & Export Video Modal */}
      <BurnExportModal
        isOpen={isBurnExportOpen}
        onClose={() => setIsBurnExportOpen(false)}
        project={project}
        videoElement={videoRef.current}
      />

      {/* AI Speech Recognition & Generate Subtitles Modal */}
      <GenerateSubtitlesModal
        isOpen={isGenerateSubtitlesOpen}
        onClose={() => setIsGenerateSubtitlesOpen(false)}
        project={project}
        onApplyCaptions={handleApplyGeneratedCaptions}
        showToast={showToast}
      />

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={isBulkUpdateOpen}
        onClose={() => setIsBulkUpdateOpen(false)}
        project={project}
        onApplyBulkUpdate={handleBulkUpdate}
        showToast={showToast}
      />

      {/* Backup History Modal */}
      <BackupHistoryModal
        isOpen={isHistoryBackupOpen}
        onClose={() => setIsHistoryBackupOpen(false)}
        project={project}
        onRestoreProject={(restored) => {
          setProject(restored);
          pushHistory(restored);
          triggerAutosave(restored);
        }}
        showToast={showToast}
      />

      {/* Export Other Formats Modal (SRT, VTT, ASS, Python) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        videoElement={videoRef.current}
      />

      {/* Search & Replace Modal */}
      <SearchReplaceModal
        isOpen={isSearchReplaceOpen}
        onClose={() => setIsSearchReplaceOpen(false)}
        captions={project.captions || []}
        onUpdateCaptions={handleUpdateCaptions}
        showToast={showToast}
      />

      {/* Subtitle Studio v2.0 Template Generator Modal */}
      <TemplateStudioModal
        isOpen={isTemplateStudioOpen}
        onClose={() => setIsTemplateStudioOpen(false)}
        onApplyToProject={handleUpdateStyle}
        showToast={showToast}
      />
    </div>
  );
};
