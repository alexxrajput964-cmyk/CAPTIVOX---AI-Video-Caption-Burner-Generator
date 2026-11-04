import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Check, Heart, Sparkles, Coffee, ShieldCheck, Video, Wand2 } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { user, settings, upgradeTier, showToast } = useAuth();
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const isPaidMode = settings?.monetization_mode === 'paid';

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('vineetrajput@upi');
    setCopiedUpi(true);
    showToast('Copied voluntary sponsor UPI ID: vineetrajput@upi');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleDirectUpgrade = async (tier: 'pro' | 'unlimited') => {
    setIsUpgrading(true);
    try {
      await upgradeTier(tier);
      onClose();
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#121216] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Founder Header */}
        <div className="text-center max-w-lg mx-auto mb-6">
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold mb-3 ${
              isPaidMode
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isPaidMode ? 'Commercial Pro Tier Upgrade' : '100% Free Lifetime · No Subscriptions'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-outfit text-white">
            {isPaidMode ? 'Unlock Unlimited Clean 1080p Exports' : 'Built by Vineet Rajput for Creators'}
          </h2>
          <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
            {isPaidMode
              ? 'Upgrade to Pro for watermark-free video exports, unlimited burning queue, and priority AI subtitle rendering.'
              : 'CAPTIVOX is completely free for all Indian video creators, reel editors, and YouTubers. Every template, feature, and 1080p export is 100% unlocked with zero watermarks.'}
          </p>
        </div>

        {/* Free Features Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {[
            { title: '41 Viral Templates', desc: 'All 12 animated + 29 classic templates unlocked' },
            { title: 'Zero Watermark', desc: 'Clean, professional 1080p MP4 burnt video export' },
            { title: 'Roman Hinglish AI', desc: 'Accurate word-level timestamp audio recognition' },
            { title: 'Custom Style Presets', desc: 'Save & reuse your favorite fonts, colors, and animations' },
            { title: 'Direct Preview Editing', desc: 'Drag, reposition, and touch-align captions on video' },
            { title: 'Unlimited Video Exports', desc: 'Burn as many reels and shorts as you create' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#18181e] border border-neutral-800 flex items-start gap-3"
            >
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{item.title}</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* If Paid Mode Active: Direct Upgrade Action */}
        {isPaidMode && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border border-amber-500/50 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Commercial Creator Plan
              </span>
              <h3 className="text-lg font-extrabold text-white">CAPTIVOX PRO · ₹499 / mo</h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                Zero watermarks, unlimited 1080p MP4 exports, priority AI transcription.
              </p>
            </div>

            <button
              onClick={() => handleDirectUpgrade('pro')}
              disabled={isUpgrading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 transition-all cursor-pointer shrink-0"
            >
              {isUpgrading ? 'Activating Pro...' : 'Activate Pro Plan'}
            </button>
          </div>
        )}

        {/* Optional Sponsor / Community Support Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
              <span>Support the Creator (Optional)</span>
            </span>
            <p className="text-xs text-neutral-300 mt-1">
              If CAPTIVOX saves you hours of video editing, you can voluntarily buy Vineet a coffee to support server hosting and GPU costs!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyUpi}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer transition-all"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>{copiedUpi ? 'Copied UPI!' : 'Sponsor Vineet'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium cursor-pointer transition-colors"
            >
              Keep Creating
            </button>
          </div>
        </div>

        {/* Founder Signature Footer */}
        <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lifetime Free Creator License · Active for all users</span>
          </span>
          <span className="text-neutral-500 font-mono">Founder: Vineet Rajput</span>
        </div>
      </div>
    </div>
  );
};
