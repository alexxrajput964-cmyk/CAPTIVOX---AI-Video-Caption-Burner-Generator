import React, { useState } from 'react';
import { CaptionSegment } from '../../types';
import { convertDevanagariToHinglish } from '../../lib/hinglishConverter';
import { X, Search, Replace, Check, Languages } from 'lucide-react';

interface SearchReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  captions: CaptionSegment[];
  onUpdateCaptions: (newCaptions: CaptionSegment[]) => void;
  showToast: (msg: string) => void;
}

export const SearchReplaceModal: React.FC<SearchReplaceModalProps> = ({
  isOpen,
  onClose,
  captions,
  onUpdateCaptions,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matchCase, setMatchCase] = useState(false);

  if (!isOpen) return null;

  const handleReplaceAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;

    let totalReplacements = 0;
    const flags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);

    const updated = captions.map((seg) => {
      if (regex.test(seg.text)) {
        const newText = seg.text.replace(regex, (match) => {
          totalReplacements++;
          return replaceTerm;
        });

        // Update word arrays too if present
        const updatedWords = seg.words?.map((w) => {
          if (regex.test(w.text)) {
            return { ...w, text: w.text.replace(regex, replaceTerm) };
          }
          return w;
        });

        return { ...seg, text: newText, words: updatedWords };
      }
      return seg;
    });

    onUpdateCaptions(updated);
    showToast(`Replaced ${totalReplacements} occurrence(s)`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#141416] border border-neutral-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Replace className="w-5 h-5 text-[#ff8c1a]" />
          <h3 className="font-bold font-outfit text-white text-base">Find & Replace Words</h3>
        </div>

        <form onSubmit={handleReplaceAll} className="space-y-4 text-xs">
          <div>
            <label className="text-neutral-400 font-medium block mb-1">Find text</label>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. consistency"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#ff3d5a]"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-neutral-400 font-medium block mb-1">Replace with</label>
            <input
              type="text"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="e.g. rozana mehnat"
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#ff3d5a]"
            />
          </div>

          <label className="flex items-center gap-2 text-neutral-400 cursor-pointer">
            <input
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
              className="rounded bg-neutral-900 border-neutral-700 text-[#ff3d5a] focus:ring-0"
            />
            <span>Match exact case</span>
          </label>

          {/* 1-Click All to Roman Hinglish */}
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">Hindi to Roman Hinglish:</span>
            <button
              type="button"
              onClick={() => {
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
                showToast('✓ Converted all captions to Roman Hinglish!');
                onClose();
              }}
              className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[11px] font-semibold hover:bg-orange-500/30 transition-colors"
            >
              Convert All to Roman Hinglish
            </button>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!searchTerm}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white font-semibold hover:opacity-95 disabled:opacity-50"
            >
              Replace All
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
