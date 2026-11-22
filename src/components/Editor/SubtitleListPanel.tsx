import React, { useState } from 'react';
import { CaptionSegment, WordTimestamp } from '../../types';
import { convertDevanagariToHinglish, hasDevanagari } from '../../lib/hinglishConverter';
import {
  Play,
  Trash2,
  Plus,
  Search,
  Languages,
  Scissors,
  CheckSquare,
  Square,
  Copy,
  Clock,
  X,
  ArrowUp,
  ArrowDown,
  MapPin,
} from 'lucide-react';

interface SubtitleListPanelProps {
  captions: CaptionSegment[];
  currentTime: number;
  onUpdateCaptions: (captions: CaptionSegment[]) => void;
  onJumpToTime: (time: number) => void;
  onOpenSearchReplace: () => void;
  highlightColor?: string;
}

export const SubtitleListPanel: React.FC<SubtitleListPanelProps> = ({
  captions,
  currentTime,
  onUpdateCaptions,
  onJumpToTime,
  onOpenSearchReplace,
  highlightColor = '#FAFF00',
}) => {
  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customShiftTime, setCustomShiftTime] = useState<string>('0.2');

  // Word styling popover state
  const [activeWordEdit, setActiveWordEdit] = useState<{
    segmentId: string;
    wordIdx: number;
    word: WordTimestamp;
  } | null>(null);

  // Toggle single item selection
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all or deselect all
  const handleSelectAll = () => {
    if (selectedIds.size === captions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(captions.map((c) => c.id)));
    }
  };

  // Handle line text change and recalculate default word timings
  const handleTextChange = (id: string, newText: string) => {
    const updated = captions.map((c) => {
      if (c.id === id) {
        const words = newText.trim().split(/\s+/).filter(Boolean);
        const duration = Math.max(0.4, c.end_time - c.start_time);
        const wordDur = duration / Math.max(1, words.length);

        // Preserve previous word styles if words match
        const prevWords = c.words || [];
        const newWordItems: WordTimestamp[] = words.map((w, idx) => {
          const matched = prevWords[idx];
          return {
            text: w,
            start: Number((c.start_time + idx * wordDur).toFixed(2)),
            end: Number((c.start_time + (idx + 1) * wordDur).toFixed(2)),
            isHighlighted: matched?.isHighlighted,
            customColor: matched?.customColor,
            customWeight: matched?.customWeight,
            customEffect: matched?.customEffect,
          };
        });

        return { ...c, text: newText, words: newWordItems };
      }
      return c;
    });
    onUpdateCaptions(updated);
  };

  // Convert single line to Roman Hinglish
  const handleConvertSingleToHinglish = (id: string) => {
    const seg = captions.find((c) => c.id === id);
    if (!seg) return;
    const roman = convertDevanagariToHinglish(seg.text);
    handleTextChange(id, roman);
  };

  // Convert ALL to Roman Hinglish
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

  // Batch shift time (+/- delta) for all selected (or all if none selected)
  const handleBatchShiftTime = (delta: number) => {
    const targets = selectedIds.size > 0 ? selectedIds : new Set(captions.map((c) => c.id));
    const updated = captions.map((c) => {
      if (targets.has(c.id)) {
        const newStart = Math.max(0, Number((c.start_time + delta).toFixed(2)));
        const newEnd = Math.max(newStart + 0.3, Number((c.end_time + delta).toFixed(2)));
        const updatedWords = (c.words || []).map((w) => ({
          ...w,
          start: Math.max(0, Number((w.start + delta).toFixed(2))),
          end: Math.max(0.1, Number((w.end + delta).toFixed(2))),
        }));
        return { ...c, start_time: newStart, end_time: newEnd, words: updatedWords };
      }
      return c;
    });
    onUpdateCaptions(updated);
  };

  // Batch Roman Hinglish for selected
  const handleBatchHinglish = () => {
    const targets = selectedIds.size > 0 ? selectedIds : new Set(captions.map((c) => c.id));
    const updated = captions.map((c) => {
      if (targets.has(c.id)) {
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
      }
      return c;
    });
    onUpdateCaptions(updated);
  };

  // Batch Auto-Capitalize & Punctuate
  const handleBatchPunctuate = () => {
    const targets = selectedIds.size > 0 ? selectedIds : new Set(captions.map((c) => c.id));
    const updated = captions.map((c) => {
      if (targets.has(c.id)) {
        let t = c.text.trim();
        if (!t) return c;
        t = t.charAt(0).toUpperCase() + t.slice(1);
        return { ...c, text: t };
      }
      return c;
    });
    onUpdateCaptions(updated);
  };

  // Batch Delete
  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    const updated = captions.filter((c) => !selectedIds.has(c.id));
    onUpdateCaptions(updated);
    setSelectedIds(new Set());
  };

  // Time change
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
          end: Math.max(0.1, Number((w.end + delta).toFixed(2))),
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

  // Duplicate segment
  const handleDuplicateSegment = (id: string) => {
    const idx = captions.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const seg = captions[idx];
    const dur = seg.end_time - seg.start_time;
    const newStart = Number((seg.end_time + 0.1).toFixed(2));
    const newEnd = Number((newStart + dur).toFixed(2));

    const copySeg: CaptionSegment = {
      ...seg,
      id: 'cap-' + Date.now(),
      idx: seg.idx + 1,
      start_time: newStart,
      end_time: newEnd,
      words: seg.words?.map((w, i) => ({
        ...w,
        start: Number((newStart + i * (dur / Math.max(1, seg.words?.length || 1))).toFixed(2)),
        end: Number((newStart + (i + 1) * (dur / Math.max(1, seg.words?.length || 1))).toFixed(2)),
      })),
    };

    const updated = [...captions.slice(0, idx + 1), copySeg, ...captions.slice(idx + 1)];
    onUpdateCaptions(updated);
  };

  // Move segment up or down in the list
  const handleMoveSegment = (id: string, direction: 'up' | 'down') => {
    const idx = captions.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= captions.length) return;
    const updated = [...captions];
    [updated[idx], updated[targetIdx]] = [updated[targetIdx], updated[idx]];
    onUpdateCaptions(updated.map((seg, i) => ({ ...seg, idx: i + 1 })));
  };

  // Clear per-segment custom (X%, Y%) override
  const handleClearSegmentPosition = (id: string) => {
    const updated = captions.map((c) =>
      c.id === id ? { ...c, positionX: undefined, positionY: undefined } : c
    );
    onUpdateCaptions(updated);
  };

  // Delete segment
  const handleDeleteSegment = (id: string) => {
    const updated = captions.filter((c) => c.id !== id);
    onUpdateCaptions(updated);
    if (selectedIds.has(id)) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Add new line at end
  const handleAddSegment = () => {
    const last = captions[captions.length - 1];
    const newStart = last ? Number((last.end_time + 0.2).toFixed(1)) : 0;
    const newEnd = Number((newStart + 2.5).toFixed(1));

    const newSegment: CaptionSegment = {
      id: 'cap-' + Date.now(),
      idx: captions.length + 1,
      start_time: newStart,
      end_time: newEnd,
      text: 'Yeh naya dialogue hai',
      words: [
        { text: 'Yeh', start: newStart, end: newStart + 0.6 },
        { text: 'naya', start: newStart + 0.6, end: newStart + 1.2 },
        { text: 'dialogue', start: newStart + 1.2, end: newStart + 1.9 },
        { text: 'hai', start: newStart + 1.9, end: newEnd },
      ],
    };

    onUpdateCaptions([...captions, newSegment]);
    onJumpToTime(newStart);
  };

  // Word-level styling updates
  const handleUpdateWordStyle = (
    segId: string,
    wordIdx: number,
    updates: Partial<WordTimestamp>
  ) => {
    const updated = captions.map((c) => {
      if (c.id === segId && c.words) {
        const nextWords = [...c.words];
        nextWords[wordIdx] = { ...nextWords[wordIdx], ...updates };
        return { ...c, words: nextWords };
      }
      return c;
    });
    onUpdateCaptions(updated);
    if (activeWordEdit && activeWordEdit.segmentId === segId && activeWordEdit.wordIdx === wordIdx) {
      setActiveWordEdit({
        ...activeWordEdit,
        word: { ...activeWordEdit.word, ...updates },
      });
    }
  };

  const anyDevanagari = captions.some((c) => hasDevanagari(c.text));

  return (
    <div className="flex flex-col h-full bg-[#111113] border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header Bar */}
      <div className="p-3 bg-[#161619] border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="p-1 rounded text-neutral-400 hover:text-white transition-colors"
            title={selectedIds.size === captions.length ? 'Deselect All' : 'Select All'}
          >
            {selectedIds.size === captions.length && captions.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-[#ff3d5a]" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>

          <span className="font-semibold text-white text-xs">
            Subtitles List <span className="text-neutral-500 font-mono">({captions.length})</span>
          </span>

          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            No Timeline · Clean Editor
          </span>
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
            title="Convert all subtitles to natural Roman Hinglish (Latin alphabet)"
          >
            <Languages className="w-3.5 h-3.5 text-orange-400" />
            <span>Roman Hinglish</span>
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
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white text-xs font-bold flex items-center gap-1 hover:opacity-95 shadow transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Line</span>
          </button>
        </div>
      </div>

      {/* Multi-Selection & Batch Toolbar */}
      {selectedIds.size > 0 && (
        <div className="px-3 py-2 bg-gradient-to-r from-[#1c1822] via-[#1a1720] to-[#141219] border-b border-[#ff3d5a]/40 flex flex-wrap items-center justify-between gap-2 text-xs animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#ff8c1a] bg-[#ff8c1a]/10 px-2 py-0.5 rounded border border-[#ff8c1a]/30">
              {selectedIds.size} Selected
            </span>
            <span className="text-neutral-400 text-[11px]">Batch Shift Timing:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleBatchShiftTime(-0.5)}
                className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-mono"
                title="Shift -0.5s"
              >
                -0.5s
              </button>
              <button
                onClick={() => handleBatchShiftTime(-0.1)}
                className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-mono"
                title="Shift -0.1s"
              >
                -0.1s
              </button>
              <button
                onClick={() => handleBatchShiftTime(0.1)}
                className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-mono"
                title="Shift +0.1s"
              >
                +0.1s
              </button>
              <button
                onClick={() => handleBatchShiftTime(0.5)}
                className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-mono"
                title="Shift +0.5s"
              >
                +0.5s
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleBatchHinglish}
              className="px-2 py-1 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[11px] font-medium hover:bg-orange-500/30"
              title="Convert selected to Roman Hinglish"
            >
              Convert to Roman
            </button>
            <button
              onClick={handleBatchPunctuate}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px]"
              title="Capitalize first letter"
            >
              Capitalize
            </button>
            <button
              onClick={handleBatchDelete}
              className="px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-medium hover:bg-red-500/30"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Subtitles Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {captions.length === 0 ? (
          <div className="text-center py-20 text-neutral-500 text-xs flex flex-col items-center gap-2">
            <Clock className="w-8 h-8 text-neutral-600" />
            <p>No subtitle lines yet.</p>
            <button
              onClick={handleAddSegment}
              className="mt-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium"
            >
              + Create First Subtitle Line
            </button>
          </div>
        ) : (
          captions.map((seg, idx) => {
            const isActive = currentTime >= seg.start_time && currentTime <= seg.end_time;
            const isSelected = selectedIds.has(seg.id);
            const hasHindi = hasDevanagari(seg.text);

            return (
              <div
                key={seg.id}
                onClick={() => onJumpToTime(seg.start_time)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1c1924] border-[#ff3d5a] ring-1 ring-[#ff3d5a]/40 shadow-lg'
                    : isSelected
                    ? 'bg-[#181620] border-orange-500/50'
                    : 'bg-[#141417] border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                {/* Top Row: Checkbox, Index, Timestamps, Actions */}
                <div className="flex items-center justify-between mb-2 text-xs">
                  {/* Left: Checkbox + Index + Editable Timestamps */}
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => handleToggleSelect(seg.id, e)}
                      className="p-0.5 text-neutral-400 hover:text-white"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#ff8c1a]" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <span className="font-mono text-neutral-500 font-semibold w-5 text-[11px]">
                      #{idx + 1}
                    </span>

                    {/* Start -> End inputs */}
                    <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-lg border border-neutral-800 text-[11px]">
                      <input
                        type="number"
                        step="0.05"
                        value={seg.start_time}
                        onChange={(e) =>
                          handleTimeChange(seg.id, 'start_time', parseFloat(e.target.value) || 0)
                        }
                        className="w-12 bg-transparent text-white font-mono focus:outline-none text-center"
                      />
                      <span className="text-neutral-500">→</span>
                      <input
                        type="number"
                        step="0.05"
                        value={seg.end_time}
                        onChange={(e) =>
                          handleTimeChange(seg.id, 'end_time', parseFloat(e.target.value) || 0)
                        }
                        className="w-12 bg-transparent text-white font-mono focus:outline-none text-center"
                      />
                      <span className="text-neutral-500 text-[10px]">s</span>
                    </div>

                    {/* Timing Nudges */}
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleNudgeTime(seg.id, -0.1)}
                        className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-neutral-400 hover:text-white font-mono"
                        title="Nudge 0.1s Earlier"
                      >
                        -0.1s
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudgeTime(seg.id, 0.1)}
                        className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-neutral-400 hover:text-white font-mono"
                        title="Nudge 0.1s Later"
                      >
                        +0.1s
                      </button>
                    </div>
                  </div>

                  {/* Right: Actions (Move Up/Down, Custom Pos Badge, Split, Duplicate, Play, Delete) */}
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(seg.positionX !== undefined || seg.positionY !== undefined) && (
                      <button
                        type="button"
                        onClick={() => handleClearSegmentPosition(seg.id)}
                        className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono flex items-center gap-0.5 hover:bg-cyan-500/25 cursor-pointer"
                        title="Custom position set for this caption. Click to reset to global position."
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{seg.positionX ?? 50},{seg.positionY ?? 82}</span>
                        <X className="w-2.5 h-2.5 ml-0.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleMoveSegment(seg.id, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Move caption up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveSegment(seg.id, 'down')}
                      disabled={idx === captions.length - 1}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Move caption down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {hasHindi && (
                      <button
                        type="button"
                        onClick={() => handleConvertSingleToHinglish(seg.id)}
                        className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-semibold hover:bg-orange-500/30"
                        title="Convert line to Roman Hinglish"
                      >
                        → Roman
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSplitSegment(seg.id)}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                      title="Split line in half"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateSegment(seg.id)}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                      title="Duplicate line"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onJumpToTime(seg.start_time)}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                      title="Play segment"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSegment(seg.id)}
                      className="p-1 rounded hover:bg-red-950/60 text-neutral-500 hover:text-red-400"
                      title="Delete line"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtitle Text Input */}
                <div onClick={(e) => e.stopPropagation()}>
                  <textarea
                    rows={2}
                    value={seg.text}
                    onChange={(e) => handleTextChange(seg.id, e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-white text-xs font-medium focus:outline-none focus:border-[#ff3d5a] resize-none leading-relaxed transition-colors"
                    placeholder="Type Roman Hinglish subtitle text..."
                  />
                </div>

                {/* Word Breakdown & Word-Level Styling Controls */}
                {seg.words && seg.words.length > 0 && (
                  <div
                    className="mt-2 flex flex-wrap items-center gap-1 text-[11px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] text-neutral-500 mr-1">Words:</span>
                    {seg.words.map((w, wIdx) => {
                      const isWordActive = currentTime >= w.start && currentTime <= w.end;
                      const isCustomStyled = w.isHighlighted || w.customColor || w.customWeight;

                      return (
                        <div key={wIdx} className="relative inline-block">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveWordEdit(
                                activeWordEdit?.segmentId === seg.id && activeWordEdit.wordIdx === wIdx
                                  ? null
                                  : { segmentId: seg.id, wordIdx: wIdx, word: w }
                              )
                            }
                            className={`px-2 py-0.5 rounded-md font-mono text-[10px] transition-all flex items-center gap-1 border ${
                              isWordActive
                                ? 'bg-[#ff3d5a] text-white border-[#ff3d5a] font-bold shadow'
                                : w.isHighlighted
                                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 font-bold'
                                : w.customColor
                                ? 'bg-neutral-900 border-neutral-700 font-semibold'
                                : 'bg-neutral-900/90 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                            }`}
                            style={{
                              color: w.customColor || undefined,
                              fontWeight: w.customWeight || undefined,
                            }}
                            title={`Word: "${w.text}" (${w.start}s - ${w.end}s). Click for word-level styles.`}
                          >
                            <span>{w.text}</span>
                            {isCustomStyled && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            )}
                          </button>

                          {/* Word-Level Styling Popover */}
                          {activeWordEdit?.segmentId === seg.id && activeWordEdit.wordIdx === wIdx && (
                            <div className="absolute top-full left-0 mt-1 z-30 p-2.5 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-56 text-left animate-in zoom-in-95 duration-100">
                              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 mb-2">
                                <span className="font-bold text-white text-[11px] truncate">
                                  Word: "{w.text}"
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setActiveWordEdit(null)}
                                  className="text-neutral-400 hover:text-white"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Highlight Word Toggle */}
                              <div className="space-y-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateWordStyle(seg.id, wIdx, {
                                      isHighlighted: !w.isHighlighted,
                                    })
                                  }
                                  className={`w-full py-1 px-2 rounded-lg text-[10px] font-semibold border flex items-center justify-between ${
                                    w.isHighlighted
                                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                                      : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-750'
                                  }`}
                                >
                                  <span>Word Highlight</span>
                                  <span>{w.isHighlighted ? 'ON' : 'OFF'}</span>
                                </button>

                                {/* Custom Word Color Presets */}
                                <div>
                                  <label className="text-[10px] text-neutral-400 block mb-1">
                                    Custom Word Color:
                                  </label>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {[
                                      '#FAFF00',
                                      '#00F5D4',
                                      '#FF007F',
                                      '#FF8C1A',
                                      '#4ADE80',
                                      '#38BDF8',
                                      '#FFFFFF',
                                    ].map((c) => (
                                      <button
                                        key={c}
                                        type="button"
                                        onClick={() =>
                                          handleUpdateWordStyle(seg.id, wIdx, {
                                            customColor: c,
                                          })
                                        }
                                        className="w-4 h-4 rounded border border-white/20 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: c }}
                                      />
                                    ))}
                                    {w.customColor && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateWordStyle(seg.id, wIdx, {
                                            customColor: undefined,
                                          })
                                        }
                                        className="text-[9px] text-neutral-500 hover:text-white underline ml-1"
                                      >
                                        Reset
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Custom Word Weight */}
                                <div>
                                  <label className="text-[10px] text-neutral-400 block mb-1">
                                    Word Weight:
                                  </label>
                                  <div className="grid grid-cols-3 gap-1">
                                    {[
                                      { weight: 400, label: 'Regular' },
                                      { weight: 700, label: 'Bold' },
                                      { weight: 900, label: 'Heavy' },
                                    ].map((wt) => (
                                      <button
                                        key={wt.weight}
                                        type="button"
                                        onClick={() =>
                                          handleUpdateWordStyle(seg.id, wIdx, {
                                            customWeight: wt.weight,
                                          })
                                        }
                                        className={`py-0.5 rounded text-[9px] border ${
                                          w.customWeight === wt.weight
                                            ? 'bg-white text-black font-bold'
                                            : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                                        }`}
                                      >
                                        {wt.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Word Effect (Box / Glow / Underline) */}
                                <div>
                                  <label className="text-[10px] text-neutral-400 block mb-1">
                                    Word Effect:
                                  </label>
                                  <div className="grid grid-cols-4 gap-1">
                                    {(['none', 'glow', 'box', 'underline'] as const).map((eff) => (
                                      <button
                                        key={eff}
                                        type="button"
                                        onClick={() =>
                                          handleUpdateWordStyle(seg.id, wIdx, {
                                            customEffect: eff,
                                          })
                                        }
                                        className={`py-0.5 rounded text-[9px] capitalize border ${
                                          (w.customEffect || 'none') === eff
                                            ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 font-bold'
                                            : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                                        }`}
                                      >
                                        {eff}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
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
