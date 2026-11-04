import React, { useState } from 'react';
import { CaptionSegment, WordTimestamp } from '../../types';
import { convertDevanagariToHinglish, hasDevanagari } from '../../lib/hinglishConverter';
import {
  Play,
  Trash2,
  Plus,
  Clock,
  Search,
  Sparkles,
  Languages,
  Scissors,
  Edit2,
  ChevronRight,
  Check,
} from 'lucide-react';

interface TimelinePanelProps {
  captions: CaptionSegment[];
  currentTime: number;
  onUpdateCaptions: (captions: CaptionSegment[]) => void;
  onJumpToTime: (time: number) => void;
  onOpenSearchReplace: () => void;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  captions,
  currentTime,
  onUpdateCaptions,
  onJumpToTime,
  onOpenSearchReplace,
}) => {
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [wordInput, setWordInput] = useState('');

  // Handle line text change
  const handleTextChange = (id: string, newText: string) => {
    const updated = captions.map((c) => {
      if (c.id === id) {
        const words = newText.trim().split(/\s+/).filter(Boolean);
        const duration = Math.max(0.4, c.end_time - c.start_time);
        const wordDuration = duration / Math.max(1, words.length);

        const newWordItems: WordTimestamp[] = words.map((w, idx) => ({
          text: w,
          start: Number((c.start_time + idx * wordDuration).toFixed(2)),
          end: Number((c.start_time + (idx + 1) * wordDuration).toFixed(2)),
        }));

        return { ...c, text: newText, words: newWordItems };
      }
      return c;
    });
    onUpdateCaptions(updated);
  };

  // Convert single segment to Roman Hinglish
  const handleSegmentToHinglish = (id: string) => {
    const seg = captions.find((c) => c.id === id);
    if (!seg) return;
    const roman = convertDevanagariToHinglish(seg.text);
    handleTextChange(id, roman);
  };

  // Convert ALL segments to Roman Hinglish
  const handleConvertAllToHinglish = () => {
    const updated = captions.map((c) => {
      const roman = convertDevanagariToHinglish(c.text);
      const words = roman.trim().split(/\s+/).filter(Boolean);
      const duration = Math.max(0.4, c.end_time - c.start_time);
      const wordDur = duration / Math.max(1, words.length);
      return {
        ...c,
        text: roman,
        words: words.map((w, idx) => ({
          text: w,
          start: Number((c.start_time + idx * wordDur).toFixed(2)),
          end: Number((c.start_time + (idx + 1) * wordDur).toFixed(2)),
        })),
      };
    });
    onUpdateCaptions(updated);
  };

  const handleTimeChange = (id: string, field: 'start_time' | 'end_time', val: number) => {
    const updated = captions.map((c) => {
      if (c.id === id) {
        return { ...c, [field]: Math.max(0, val) };
      }
      return c;
    });
    onUpdateCaptions(updated);
  };

  // Nudge timing (-0.1s / +0.1s)
  const handleNudgeTime = (id: string, delta: number) => {
    const updated = captions.map((c) => {
      if (c.id === id) {
        const newStart = Math.max(0, Number((c.start_time + delta).toFixed(2)));
        const newEnd = Math.max(newStart + 0.3, Number((c.end_time + delta).toFixed(2)));
        const words = (c.words || []).map((w) => ({
          ...w,
          start: Math.max(0, Number((w.start + delta).toFixed(2))),
          end: Math.max(0.2, Number((w.end + delta).toFixed(2))),
        }));
        return { ...c, start_time: newStart, end_time: newEnd, words };
      }
      return c;
    });
    onUpdateCaptions(updated);
  };

  // Split segment in half
  const handleSplitSegment = (id: string) => {
    const idx = captions.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const seg = captions[idx];
    const words = seg.text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 1) return;

    const mid = Math.ceil(words.length / 2);
    const firstWords = words.slice(0, mid);
    const secondWords = words.slice(mid);

    const midTime = Number(((seg.start_time + seg.end_time) / 2).toFixed(2));

    const seg1: CaptionSegment = {
      id: seg.id,
      idx: seg.idx,
      start_time: seg.start_time,
      end_time: midTime,
      text: firstWords.join(' '),
      words: seg.words ? seg.words.slice(0, mid) : undefined,
    };

    const seg2: CaptionSegment = {
      id: 'cap-' + Date.now(),
      idx: seg.idx + 1,
      start_time: midTime,
      end_time: seg.end_time,
      text: secondWords.join(' '),
      words: seg.words ? seg.words.slice(mid) : undefined,
    };

    const updated = [...captions.slice(0, idx), seg1, seg2, ...captions.slice(idx + 1)];
    onUpdateCaptions(updated);
  };

  const handleDeleteSegment = (id: string) => {
    const updated = captions.filter((c) => c.id !== id);
    onUpdateCaptions(updated);
  };

  const handleAddSegment = () => {
    const last = captions[captions.length - 1];
    const newStart = last ? Number((last.end_time + 0.2).toFixed(1)) : 0;
    const newEnd = Number((newStart + 2.4).toFixed(1));

    const newSegment: CaptionSegment = {
      id: 'cap-' + Date.now(),
      idx: captions.length + 1,
      start_time: newStart,
      end_time: newEnd,
      text: 'Yeh naya dialogue hai',
      words: [
        { text: 'Yeh', start: newStart, end: newStart + 0.6 },
        { text: 'naya', start: newStart + 0.6, end: newStart + 1.2 },
        { text: 'dialogue', start: newStart + 1.2, end: newStart + 1.8 },
        { text: 'hai', start: newStart + 1.8, end: newEnd },
      ],
    };

    onUpdateCaptions([...captions, newSegment]);
    onJumpToTime(newStart);
  };

  // Capitalize & clean punctuation
  const handleAutoPunctuate = () => {
    const updated = captions.map((c) => {
      let t = c.text.trim();
      if (!t) return c;
      t = t.charAt(0).toUpperCase() + t.slice(1);
      if (!/[.!?]$/.test(t)) {
        t = t + '.';
      }
      return { ...c, text: t };
    });
    onUpdateCaptions(updated);
  };

  // Save single word edit from karaoke pill
  const handleSaveWordEdit = (segId: string, wordIdx: number) => {
    if (!wordInput.trim()) {
      setEditingWordId(null);
      return;
    }

    const updated = captions.map((c) => {
      if (c.id === segId && c.words) {
        const newWords = [...c.words];
        newWords[wordIdx] = { ...newWords[wordIdx], text: wordInput.trim() };
        const newFullText = newWords.map((w) => w.text).join(' ');
        return { ...c, text: newFullText, words: newWords };
      }
      return c;
    });

    onUpdateCaptions(updated);
    setEditingWordId(null);
  };

  const anyDevanagari = captions.some((c) => hasDevanagari(c.text));

  return (
    <div className="flex flex-col h-full bg-[#121214] border border-neutral-800 rounded-2xl overflow-hidden">
      {/* Timeline Controls Header */}
      <div className="p-3.5 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2.5 bg-[#141416]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#ff8c1a]" />
          <h3 className="font-bold font-outfit text-white text-sm">
            Subtitles Studio <span className="text-neutral-500 font-mono">({captions.length} lines)</span>
          </h3>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 1-Click All to Roman Hinglish */}
          <button
            onClick={handleConvertAllToHinglish}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              anyDevanagari
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 hover:bg-orange-500/30 animate-pulse'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
            title="Convert entire subtitle timeline to Roman Hinglish (English letters)"
          >
            <Languages className="w-3.5 h-3.5 text-orange-400" />
            <span>Roman Hinglish</span>
          </button>

          <button
            onClick={handleAutoPunctuate}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
            title="Auto-Capitalize First Letter"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden sm:inline">Punctuate</span>
          </button>

          <button
            onClick={onOpenSearchReplace}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
            title="Find & Replace Words"
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Replace</span>
          </button>

          <button
            onClick={handleAddSegment}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white text-xs font-semibold flex items-center gap-1 hover:opacity-95 shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Line</span>
          </button>
        </div>
      </div>

      {/* Segments List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {captions.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 text-xs">
            No caption segments yet. Upload video to auto-transcribe in Roman Hinglish or click "+ Add Line".
          </div>
        ) : (
          captions.map((seg, idx) => {
            const isActive = currentTime >= seg.start_time && currentTime <= seg.end_time;
            const hasHindi = hasDevanagari(seg.text);

            return (
              <div
                key={seg.id}
                onClick={() => onJumpToTime(seg.start_time)}
                className={`group p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1e1c24] border-[#ff3d5a] ring-1 ring-[#ff3d5a]/40 shadow-md'
                    : 'bg-[#151518] border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2 text-xs">
                  {/* Timing inputs & Nudge */}
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="font-mono text-neutral-500 font-semibold w-5">
                      #{idx + 1}
                    </span>

                    <div className="flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                      <input
                        type="number"
                        step="0.1"
                        value={seg.start_time}
                        onChange={(e) =>
                          handleTimeChange(seg.id, 'start_time', parseFloat(e.target.value) || 0)
                        }
                        className="w-12 bg-transparent text-white font-mono text-[11px] focus:outline-none text-center"
                      />
                      <span className="text-neutral-500">→</span>
                      <input
                        type="number"
                        step="0.1"
                        value={seg.end_time}
                        onChange={(e) =>
                          handleTimeChange(seg.id, 'end_time', parseFloat(e.target.value) || 0)
                        }
                        className="w-12 bg-transparent text-white font-mono text-[11px] focus:outline-none text-center"
                      />
                      <span className="text-neutral-500 text-[10px]">s</span>
                    </div>

                    {/* Quick Timing Nudge (-0.1s / +0.1s) */}
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleNudgeTime(seg.id, -0.1)}
                        className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-neutral-400 hover:text-white"
                        title="Nudge 0.1s Earlier"
                      >
                        -0.1s
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudgeTime(seg.id, 0.1)}
                        className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-neutral-400 hover:text-white"
                        title="Nudge 0.1s Later"
                      >
                        +0.1s
                      </button>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Convert to Roman Hinglish Button */}
                    {hasHindi && (
                      <button
                        type="button"
                        onClick={() => handleSegmentToHinglish(seg.id)}
                        className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-semibold hover:bg-orange-500/30 transition-colors"
                        title="Convert this line to Roman Hinglish"
                      >
                        → Roman
                      </button>
                    )}

                    {/* Split line */}
                    <button
                      type="button"
                      onClick={() => handleSplitSegment(seg.id)}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                      title="Split Line in Half"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                    </button>

                    {/* Play Segment */}
                    <button
                      type="button"
                      onClick={() => onJumpToTime(seg.start_time)}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                      title="Play Segment"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>

                    {/* Delete Line */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSegment(seg.id)}
                      className="p-1 rounded hover:bg-red-950/60 text-neutral-500 hover:text-red-400 transition-colors"
                      title="Delete Line"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Direct Self-Editing Textarea */}
                <div onClick={(e) => e.stopPropagation()}>
                  <textarea
                    rows={2}
                    value={seg.text}
                    onChange={(e) => handleTextChange(seg.id, e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs font-medium focus:outline-none focus:border-[#ff3d5a] resize-none leading-relaxed transition-colors"
                    placeholder="Type Roman Hinglish subtitle text..."
                  />
                </div>

                {/* Word timing badges (Karaoke breakdown with click-to-edit) */}
                {seg.words && seg.words.length > 0 && (
                  <div
                    className="mt-2 flex flex-wrap gap-1 text-[10px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {seg.words.map((w, wIdx) => {
                      const isWordSpeaking = currentTime >= w.start && currentTime <= w.end;
                      const wordKey = `${seg.id}-${wIdx}`;
                      const isEditingThisWord = editingWordId === wordKey;

                      if (isEditingThisWord) {
                        return (
                          <span key={wIdx} className="inline-flex items-center gap-0.5 bg-neutral-900 p-0.5 rounded border border-[#ff3d5a]">
                            <input
                              type="text"
                              value={wordInput}
                              onChange={(e) => setWordInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveWordEdit(seg.id, wIdx);
                                if (e.key === 'Escape') setEditingWordId(null);
                              }}
                              className="w-16 bg-black px-1 text-white text-[10px] font-mono focus:outline-none rounded"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveWordEdit(seg.id, wIdx)}
                              className="text-emerald-400 p-0.5 hover:text-white"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      }

                      return (
                        <span
                          key={wIdx}
                          onClick={() => {
                            setEditingWordId(wordKey);
                            setWordInput(w.text);
                          }}
                          className={`px-1.5 py-0.5 rounded font-mono transition-all cursor-pointer hover:ring-1 hover:ring-white/40 ${
                            isWordSpeaking
                              ? 'bg-[#ff3d5a] text-white font-bold shadow'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                          }`}
                          title="Click to edit single word"
                        >
                          {w.text}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
