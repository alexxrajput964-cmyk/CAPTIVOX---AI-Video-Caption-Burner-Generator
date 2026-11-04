import React, { useState } from 'react';
import { CaptionProject, CaptionSegment } from '../../types';
import { X, Check, Layers, Sliders, Sparkles, Type, Move, Palette } from 'lucide-react';

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CaptionProject;
  onApplyBulkUpdate: (updatedCaptions: CaptionSegment[], styleUpdates?: Partial<CaptionProject>) => void;
  showToast: (msg: string) => void;
}

export const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({
  isOpen,
  onClose,
  project,
  onApplyBulkUpdate,
  showToast,
}) => {
  const [applyPositions, setApplyPositions] = useState(true);
  const [resetWordHighlights, setResetWordHighlights] = useState(false);
  const [applyAnimations, setApplyAnimations] = useState(true);

  if (!isOpen) return null;

  const totalCaptions = project.captions?.length || 0;

  const handleExecuteBulkUpdate = () => {
    if (!project.captions || project.captions.length === 0) {
      showToast('No subtitles to update');
      onClose();
      return;
    }

    const updated = project.captions.map((cap) => {
      const cloned = { ...cap };

      if (applyPositions) {
        cloned.positionX = project.position_x ?? 50;
        cloned.positionY = project.position_y ?? 82;
      }

      if (resetWordHighlights && cloned.words) {
        cloned.words = cloned.words.map((w) => ({
          ...w,
          customColor: undefined,
          customWeight: undefined,
          isHighlighted: false,
        }));
      }

      return cloned;
    });

    onApplyBulkUpdate(updated, {
      template_id: project.template_id,
      font_family: project.font_family,
      font_weight: project.font_weight,
      font_size: project.font_size,
      text_color: project.text_color,
      highlight_color: project.highlight_color,
      outline_color: project.outline_color,
      outline_width: project.outline_width,
      shadow_color: project.shadow_color,
      shadow_blur: project.shadow_blur,
      animation_style: project.animation_style,
      backdrop_style: project.backdrop_style,
      box_bg_color: project.box_bg_color,
      box_border_color: project.box_border_color,
      box_radius: project.box_radius,
    });

    showToast(`✅ Bulk updated all ${totalCaptions} subtitles with '${project.template_id}' theme!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#121216] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#17171d] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center text-white shadow-md">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Bulk-Update Control Panel</h3>
              <p className="text-[11px] text-neutral-400">
                Synchronize all {totalCaptions} subtitle blocks with 1 click
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Current Style Snapshot */}
          <div className="p-3.5 rounded-xl bg-black/50 border border-neutral-800 space-y-2">
            <span className="text-neutral-400 font-semibold block text-[11px]">
              Active Style Settings to Apply:
            </span>
            <div className="grid grid-cols-2 gap-2 text-neutral-300">
              <div className="flex items-center gap-1.5 truncate">
                <Palette className="w-3.5 h-3.5 text-[#ff8c1a]" />
                <span className="truncate">Template: <b>{project.template_id}</b></span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Type className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate">Font: <b>{project.font_family || 'Plus Jakarta'}</b></span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span className="truncate">Anim: <b>{project.animation_style || 'pop'}</b></span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Move className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">Pos: <b>{project.position_x ?? 50}%, {project.position_y ?? 82}%</b></span>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800 cursor-pointer hover:bg-neutral-900 transition-colors">
              <input
                type="checkbox"
                checked={applyPositions}
                onChange={(e) => setApplyPositions(e.target.checked)}
                className="rounded border-neutral-700 text-[#ff3d5a] focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-white block">Sync Screen Coordinates</span>
                <span className="text-[10px] text-neutral-400">Align all captions to current X/Y position</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800 cursor-pointer hover:bg-neutral-900 transition-colors">
              <input
                type="checkbox"
                checked={applyAnimations}
                onChange={(e) => setApplyAnimations(e.target.checked)}
                className="rounded border-neutral-700 text-[#ff3d5a] focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-white block">Apply Animation Style</span>
                <span className="text-[10px] text-neutral-400">Set word karaoke pop/slide/glow across all</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800 cursor-pointer hover:bg-neutral-900 transition-colors">
              <input
                type="checkbox"
                checked={resetWordHighlights}
                onChange={(e) => setResetWordHighlights(e.target.checked)}
                className="rounded border-neutral-700 text-[#ff3d5a] focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-white block">Reset Custom Word Color Overrides</span>
                <span className="text-[10px] text-neutral-400">Standardize all manual word colors to new theme</span>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#17171d] border-t border-neutral-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteBulkUpdate}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899] hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 cursor-pointer transition-all"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Apply to All ({totalCaptions})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
