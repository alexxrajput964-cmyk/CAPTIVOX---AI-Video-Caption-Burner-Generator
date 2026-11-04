import React, { useState } from 'react';
import {
  ALL_TEMPLATES,
  PREMIUM_ANIMATED_TEMPLATES,
  SEVEN_VIRAL_TEMPLATES,
  DISTINCT_SUBTITLE_TEMPLATES,
  CLASSIC_CREATOR_TEMPLATES,
} from '../../lib/templates';
import { TemplateDefinition } from '../../types';
import { Flame, Check, Sparkles } from 'lucide-react';

interface TemplateStripProps {
  selectedTemplateId: string;
  onSelectTemplate: (template: TemplateDefinition) => void;
}

export const TemplateStrip: React.FC<TemplateStripProps> = ({
  selectedTemplateId,
  onSelectTemplate,
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'animated' | 'seven_viral' | 'distinct' | 'classic'>('animated');

  const filteredTemplates =
    filterCategory === 'animated'
      ? PREMIUM_ANIMATED_TEMPLATES
      : filterCategory === 'seven_viral'
      ? SEVEN_VIRAL_TEMPLATES
      : filterCategory === 'distinct'
      ? DISTINCT_SUBTITLE_TEMPLATES
      : filterCategory === 'classic'
      ? CLASSIC_CREATOR_TEMPLATES
      : ALL_TEMPLATES;

  const handleTemplateClick = (tmpl: TemplateDefinition) => {
    // Immediately apply ANY clicked template without restrictions
    onSelectTemplate(tmpl);
  };

  return (
    <div className="w-full py-2.5 border-t border-neutral-900 bg-[#0c0c0e]">
      {/* Top Header with Quick Filter Tabs */}
      <div className="flex items-center justify-between px-3 mb-2 flex-wrap gap-1.5">
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-[#ff3d5a]" />
          <span className="text-xs font-bold text-white">
            Viral Templates ({ALL_TEMPLATES.length})
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
            100% Unlocked
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          {[
            { id: 'animated', label: '✨ Animated (12)' },
            { id: 'all', label: `All (${ALL_TEMPLATES.length})` },
            { id: 'seven_viral', label: '🔥 7 Viral' },
            { id: 'distinct', label: '⚡ Distinct' },
            { id: 'classic', label: '👑 Classic' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id as any)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                filterCategory === tab.id
                  ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-neutral-700'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Scrollable Strip with 1-Click Apply */}
      <div className="flex items-center gap-2.5 overflow-x-auto px-3 pb-1 no-scrollbar">
        {filteredTemplates.map((tmpl) => {
          const isSelected = selectedTemplateId === tmpl.id;

          return (
            <button
              key={tmpl.id}
              onClick={() => handleTemplateClick(tmpl)}
              className={`group relative shrink-0 w-36 h-20 rounded-xl p-2 text-left border transition-all flex flex-col justify-between overflow-hidden cursor-pointer ${
                isSelected
                  ? 'border-[#ff3d5a] ring-2 ring-[#ff3d5a]/40 shadow-lg shadow-[#ff3d5a]/20 bg-[#1c1c22]'
                  : 'border-neutral-800 bg-[#131316] hover:border-neutral-700 hover:bg-[#18181c]'
              }`}
              title={`Click to instantly apply "${tmpl.name}" style`}
            >
              {/* Top Row: Template Name & Active Dot */}
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-bold text-white truncate max-w-[82%]">
                  {tmpl.name}
                </span>

                {isSelected ? (
                  <div className="w-3.5 h-3.5 rounded-full bg-[#ff3d5a] flex items-center justify-center text-white">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                ) : (
                  <span
                    className="w-2 h-2 rounded-full ring-1 ring-white/20"
                    style={{ backgroundColor: tmpl.highlight_color }}
                  />
                )}
              </div>

              {/* Visual Preview */}
              <div className="w-full text-center">
                <span
                  className="text-[10px] font-bold block truncate"
                  style={{
                    fontFamily: `'${tmpl.font_family}', sans-serif`,
                    color: tmpl.highlight_color,
                  }}
                >
                  SAMPLE TEXT
                </span>
                <span className="text-[9px] text-neutral-400 block truncate">
                  {tmpl.font_family}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
