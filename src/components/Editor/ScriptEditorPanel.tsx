import React, { useState } from 'react';
import { CaptionSegment, WordTimestamp } from '../../types';
import { convertDevanagariToHinglish, hasDevanagari, VIRAL_HINGLISH_PRESETS } from '../../lib/hinglishConverter';
import {
  FileText,
  Sparkles,
  Languages,
  Check,
  RotateCcw,
  Zap,
  Split,
  Copy,
} from 'lucide-react';

interface ScriptEditorPanelProps {
  captions: CaptionSegment[];
  duration: number;
  onUpdateCaptions: (captions: CaptionSegment[]) => void;
  showToast: (msg: string) => void;
}

export const ScriptEditorPanel: React.FC<ScriptEditorPanelProps> = ({
  captions,
  duration,
  onUpdateCaptions,
  showToast,
}) => {
  // Join all caption lines into one unified script text
  const initialText = captions.map((c) => c.text).join('\n');
  const [scriptText, setScriptText] = useState(initialText);
  const [wordsPerLine, setWordsPerLine] = useState(4);

  // Sync state if external captions change significantly
  React.useEffect(() => {
    setScriptText(captions.map((c) => c.text).join('\n'));
  }, [captions.length]);

  // Apply script changes back to timeline segments with even word distribution
  const handleApplyScript = () => {
    const lines = scriptText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      showToast('Script is empty');
      return;
    }

    const totalDur = Math.max(5, duration || 15);
    const lineDur = totalDur / lines.length;

    const newSegments: CaptionSegment[] = lines.map((line, idx) => {
      const start = Number((idx * lineDur).toFixed(2));
      const end = Number(((idx + 1) * lineDur).toFixed(2));
      const words = line.split(/\s+/).filter(Boolean);
      const wordDur = (end - start) / Math.max(1, words.length);

      const wordItems: WordTimestamp[] = words.map((w, wIdx) => ({
        text: w,
        start: Number((start + wIdx * wordDur).toFixed(2)),
        end: Number((start + (wIdx + 1) * wordDur).toFixed(2)),
      }));

      return {
        id: `cap-${Date.now()}-${idx}`,
        idx: idx + 1,
        start_time: start,
        end_time: end,
        text: line,
        words: wordItems,
      };
    });

    onUpdateCaptions(newSegments);
    showToast(`✓ Applied ${newSegments.length} subtitle lines to video!`);
  };

  // Convert entire text to Roman Hinglish
  const handleConvertToRomanHinglish = () => {
    const converted = convertDevanagariToHinglish(scriptText);
    setScriptText(converted);
    showToast('✓ Converted all text to Roman Hinglish!');
  };

  // Auto-break script into punchy N-word lines (great for short form reels!)
  const handleFormatIntoChunks = (chunkSize: number) => {
    const allWords = scriptText.trim().split(/\s+/).filter(Boolean);
    if (allWords.length === 0) return;

    const chunkedLines: string[] = [];
    for (let i = 0; i < allWords.length; i += chunkSize) {
      chunkedLines.push(allWords.slice(i, i + chunkSize).join(' '));
    }

    setScriptText(chunkedLines.join('\n'));
    showToast(`✓ Re-chunked into ${chunkSize}-word punchy lines!`);
  };

  // Insert a viral Roman Hinglish preset
  const handleInsertPreset = (presetText: string) => {
    setScriptText(presetText);
    showToast('Loaded Roman Hinglish preset hook');
  };

  const hasHindi = hasDevanagari(scriptText);

  return (
    <div className="flex flex-col h-full bg-[#121214] border border-neutral-800 rounded-2xl overflow-hidden p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#ff8c1a]" />
          <div>
            <h3 className="font-bold font-outfit text-white text-sm">Direct Script & Text Studio</h3>
            <p className="text-[11px] text-neutral-400">
              Khud se pura text edit karein in Roman Hinglish (English alphabet).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Convert to Roman Hinglish Button */}
          <button
            type="button"
            onClick={handleConvertToRomanHinglish}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
              hasHindi
                ? 'bg-orange-500/25 text-orange-400 border-orange-500/40 hover:bg-orange-500/40 animate-pulse'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
            title="Convert any Hindi Devanagari to Roman Hinglish"
          >
            <Languages className="w-3.5 h-3.5 text-orange-400" />
            <span>To Roman Hinglish</span>
          </button>

          <button
            type="button"
            onClick={handleApplyScript}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-95 shadow transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save & Sync Video</span>
          </button>
        </div>
      </div>

      {/* Quick Formatting Tools */}
      <div className="flex items-center justify-between text-xs bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80">
        <span className="text-neutral-300 font-medium flex items-center gap-1.5">
          <Split className="w-3.5 h-3.5 text-[#ff8c1a]" />
          <span>Auto Split Words Per Line:</span>
        </span>
        <div className="flex items-center gap-1">
          {[3, 4, 5, 6].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => handleFormatIntoChunks(count)}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] font-mono transition-colors"
              title={`Break text into ${count} words per subtitle line`}
            >
              {count} words
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="flex-1 flex flex-col min-h-[220px]">
        <label className="text-neutral-400 text-xs mb-1 font-medium flex items-center justify-between">
          <span>Continuous Subtitle Script (1 line = 1 subtitle popup)</span>
          <span className="font-mono text-neutral-500 text-[10px]">
            {scriptText.split(/\s+/).filter(Boolean).length} words ·{' '}
            {scriptText.split('\n').filter((l) => l.trim()).length} lines
          </span>
        </label>
        <textarea
          rows={8}
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          className="flex-1 w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs font-mono focus:outline-none focus:border-[#ff3d5a] resize-none leading-relaxed transition-colors"
          placeholder="Apna dialogue yahan type karein in Roman Hinglish:
Line 1: Yeh secret koi nahi batata
Line 2: Consistency beats talent har bar
Line 3: Roz video banao aur algorithm reward karega"
        />
      </div>

      {/* Viral Roman Hinglish Templates Palette */}
      <div className="pt-2 border-t border-neutral-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Viral Roman Hinglish Hooks (1-Click Paste)</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VIRAL_HINGLISH_PRESETS.slice(0, 4).map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleInsertPreset(preset.text)}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-left transition-colors text-xs group"
            >
              <div className="font-semibold text-white group-hover:text-[#ff8c1a] text-[11px] truncate">
                {preset.title}
              </div>
              <div className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                {preset.text}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
