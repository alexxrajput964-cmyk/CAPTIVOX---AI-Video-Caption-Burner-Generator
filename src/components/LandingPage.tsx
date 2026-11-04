import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Upload,
  Sparkles,
  Flame,
  Play,
  CheckCircle2,
  Download,
  Languages,
  Film,
  Zap,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { TIER_LIMITS } from '../lib/templates';

interface LandingPageProps {
  onStartEditorWithFile: (file: File) => void;
  onOpenSampleProject: (sampleId: string) => void;
  onNavigateToDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartEditorWithFile,
  onOpenSampleProject,
  onNavigateToDashboard,
}) => {
  const { user, setIsUpgradeModalOpen, setIsAuthModalOpen } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onStartEditorWithFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onStartEditorWithFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-neutral-900">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#ff3d5a]/15 to-[#ff8c1a]/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Hero Copy & Dropzone */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>100% Free Creator Tool · Built with ❤️ by Vineet Rajput</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-outfit tracking-tight text-white leading-[1.1] text-balance">
                Burn Viral AI Captions{' '}
                <span className="bg-gradient-to-r from-[#ff3d5a] via-[#ff8c1a] to-[#ffcb45] bg-clip-text text-transparent">
                  Directly Into
                </span>{' '}
                Your Video.
              </h1>

              <p className="text-base sm:text-lg text-neutral-400 max-w-xl leading-relaxed">
                Free India-first AI video subtitle burner built by <strong className="text-white font-semibold">Vineet Rajput</strong>. Permanently renders word-by-word animated Roman Hinglish, Hindi & English karaoke subtitles directly into 1080p MP4s — 100% free with zero watermarks.
              </p>

              {/* Upload Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#ff3d5a] bg-[#ff3d5a]/10 scale-[1.01]'
                    : 'border-neutral-700/80 bg-[#141416]/90 hover:border-neutral-500 hover:bg-[#18181c]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ff3d5a]/20 to-[#ff8c1a]/20 border border-[#ff3d5a]/40 mx-auto flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7 text-[#ff8c1a]" />
                </div>
                <h3 className="font-semibold text-white text-base">
                  Drop your video here or <span className="text-[#ff8c1a] underline underline-offset-4">Browse Files</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1.5">
                  Supports MP4, MOV, WebM, MKV (Up to 500 MB) · Voice unmuted & auto-sync
                </p>

                {/* Instant Sample Video Quick Launch */}
                <div className="mt-4 pt-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-center gap-2 text-xs">
                  <span className="text-neutral-500 text-[11px]">Or try with demo videos:</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSampleProject('proj-hinglish-viral');
                    }}
                    className="px-2.5 py-1 rounded-md bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 text-[#ff8c1a]" />
                    Hinglish Tech Reel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSampleProject('proj-hindi-hormozi');
                    }}
                    className="px-2.5 py-1 rounded-md bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 text-[#FAFF00]" />
                    Hindi Short
                  </button>
                </div>
              </div>

              {/* Creator Trust Stats */}
              <div className="pt-3 flex flex-wrap items-center gap-6 text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>100% In-Browser & Cloud Burn-in</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>13 Viral Templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>SRT + VTT + MP4 Export</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[340px] aspect-[9/16] rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl shadow-black/80 bg-[#121214] group">
                <img
                  src="/src/assets/images/hero_captivox_reel_1792817870608.jpg"
                  alt="Captivox Burned Captions Reel"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />

                {/* Live Floating Badge */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Burned into MP4
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-[#ff8c1a] border border-[#ff8c1a]/30">
                    4K READY
                  </div>
                </div>

                {/* Bottom Interactive Preview Play Action */}
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Viral Karaoke Style</div>
                    <div className="text-[10px] text-neutral-400">Hindi + Hinglish Synced</div>
                  </div>
                  <button
                    onClick={() => onOpenSampleProject('proj-hinglish-viral')}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white font-medium text-xs flex items-center gap-1 hover:opacity-95"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    Open Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Example Showcase Cards */}
      <section className="py-20 border-b border-neutral-900 bg-[#0d0d0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-outfit text-white">
              Engineered For Modern Content Creators
            </h2>
            <p className="text-sm text-neutral-400 mt-2">
              Explore the viral caption formats that drive 80%+ watch-through rates on Instagram Reels and YouTube Shorts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div
              onClick={() => onOpenSampleProject('proj-hinglish-viral')}
              className="group p-5 rounded-2xl bg-[#141416] border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="h-36 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center p-4 border border-neutral-800/80 mb-4 overflow-hidden relative">
                  <div className="text-center">
                    <span className="font-outfit font-black text-lg text-white">
                      YEH SECRET <span className="text-[#FF8C1A]">KOI NAHI</span> BATATA
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-neutral-400 font-mono">
                    Hinglish
                  </div>
                </div>
                <h3 className="font-bold font-outfit text-white text-base">SaaS Gradient</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Warm coral and gold dynamic keyword pop, perfect for business, SaaS & agency founders.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-[#ff8c1a] font-medium group-hover:translate-x-0.5 transition-transform">
                <span>Try Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 2 */}
            <div
              onClick={() => onOpenSampleProject('proj-hindi-hormozi')}
              className="group p-5 rounded-2xl bg-[#141416] border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="h-36 rounded-xl bg-[#161510] flex items-center justify-center p-4 border border-neutral-800/80 mb-4 overflow-hidden relative">
                  <div className="text-center">
                    <span className="font-archivo font-black text-base text-white sub-stroke-black">
                      पहला कदम <span className="text-[#FAFF00]">सबसे मुश्किल</span>
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-neutral-400 font-mono">
                    Hindi
                  </div>
                </div>
                <h3 className="font-bold font-outfit text-white text-base">Alex Hormozi Yellow</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  High-converting thick black stroke with solid yellow banner highlight that grabs attention.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-[#ff8c1a] font-medium group-hover:translate-x-0.5 transition-transform">
                <span>Try Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 3 */}
            <div
              onClick={() => onOpenSampleProject('proj-hinglish-viral')}
              className="group p-5 rounded-2xl bg-[#141416] border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="h-36 rounded-xl bg-[#111622] flex items-center justify-center p-4 border border-neutral-800/80 mb-4 overflow-hidden relative">
                  <div className="text-center">
                    <span className="font-outfit font-extrabold text-lg text-white sub-glow-blue">
                      CONSISTENCY <span className="text-[#5B9EFF]">BEATS TALENT</span>
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-neutral-400 font-mono">
                    Global
                  </div>
                </div>
                <h3 className="font-bold font-outfit text-white text-base">Blue Glow</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Electric cyberpunk glow styling tailored for tech reviewers, gaming reels, and futuristic shorts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-[#ff8c1a] font-medium group-hover:translate-x-0.5 transition-transform">
                <span>Try Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 4 */}
            <div
              onClick={() => onOpenSampleProject('proj-hinglish-viral')}
              className="group p-5 rounded-2xl bg-[#141416] border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="h-36 rounded-xl bg-[#1b1214] flex items-center justify-center p-4 border border-neutral-800/80 mb-4 overflow-hidden relative">
                  <div className="text-center">
                    <span className="font-playfair italic font-black text-xl text-white">
                      Luxury <span className="text-[#FFCB45] not-italic">Gold Accents</span>
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-neutral-400 font-mono">
                    Editorial
                  </div>
                </div>
                <h3 className="font-bold font-outfit text-white text-base">Premium Serif</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Sophisticated editorial aesthetic with gold luster for podcasts, lifestyle vlogs, and storytelling.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-[#ff8c1a] font-medium group-hover:translate-x-0.5 transition-transform">
                <span>Try Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (4 Steps) */}
      <section className="py-20 border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff8c1a]">Simple Workflow</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-outfit text-white mt-1">
              How CAPTIVOX Burns Video Captions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold font-outfit text-white">
                01
              </div>
              <h3 className="font-semibold text-white text-base">Drop Your Video</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Upload MP4, MOV, or WebM files up to 500 MB. Video loads with audio intact for precision synchronization.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold font-outfit text-white">
                02
              </div>
              <h3 className="font-semibold text-white text-base">AI Auto-Transcribe</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                OpenAI Whisper & Gemini models transcribe speech into sequential 5-word chunks with word-level timestamps.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold font-outfit text-white">
                03
              </div>
              <h3 className="font-semibold text-white text-base">Style & Fine-Tune</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Select from 13 viral templates, customize fonts, weights, positions, and edit any word with instant karaoke preview.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff3d5a] to-[#ff8c1a] flex items-center justify-center font-bold font-outfit text-white shadow-lg shadow-[#ff3d5a]/20">
                04
              </div>
              <h3 className="font-semibold text-white text-base">Burn & Download MP4</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Click "Export Video with Captions" to bake the subtitles directly into the video pixels for high retention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section with 18% GST */}
      <section className="py-20 border-b border-neutral-900 bg-[#0d0d0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff8c1a]">Transparent Pricing</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-outfit text-white mt-1">
              Indian Creator Plans (18% GST Included)
            </h2>
            <p className="text-xs text-neutral-400 mt-2">
              Start free with 3 daily exports, or upgrade for unlimited 4K caption burning and clean watermark-free videos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Free */}
            <div className="p-6 rounded-2xl bg-[#141416] border border-neutral-800 flex flex-col justify-between">
              <div>
                <h3 className="font-bold font-outfit text-white text-lg">Free Tier</h3>
                <div className="mt-3 mb-4">
                  <span className="text-3xl font-black font-outfit text-white">₹0</span>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Forever Free · ₹0 GST</div>
                </div>
                <div className="space-y-2 text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Videos up to 5 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>3 exports per day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>5 viral templates</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Check className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Watermark "Made with CAPTIVOX"</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onNavigateToDashboard}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors"
              >
                Start Free
              </button>
            </div>

            {/* Pro */}
            <div className="p-6 rounded-2xl bg-[#18181c] border border-[#ff3d5a] shadow-xl shadow-[#ff3d5a]/10 flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white text-[10px] font-bold uppercase tracking-wider shadow">
                Best Value
              </div>
              <div>
                <h3 className="font-bold font-outfit text-white text-lg">Pro Creator</h3>
                <div className="mt-3 mb-4">
                  <span className="text-3xl font-black font-outfit text-white">₹199</span>
                  <span className="text-xs text-neutral-400">/mo</span>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    + ₹35.82 GST = <span className="text-neutral-200 font-semibold">₹234.82</span>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Videos up to 15 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>50 exports per day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>All 13 templates unlocked</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-emerald-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>No Watermark (Clean)</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white font-semibold text-xs hover:opacity-95 transition-opacity"
              >
                Upgrade to Pro
              </button>
            </div>

            {/* Business */}
            <div className="p-6 rounded-2xl bg-[#141416] border border-neutral-800 flex flex-col justify-between">
              <div>
                <h3 className="font-bold font-outfit text-white text-lg">Business</h3>
                <div className="mt-3 mb-4">
                  <span className="text-3xl font-black font-outfit text-white">₹499</span>
                  <span className="text-xs text-neutral-400">/mo</span>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    + ₹89.82 GST = <span className="text-neutral-200 font-semibold">₹588.82</span>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Videos up to 60 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>500 exports per day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>All 13 templates + custom styles</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-emerald-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Zero watermark</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors"
              >
                Select Business
              </button>
            </div>

            {/* Unlimited */}
            <div className="p-6 rounded-2xl bg-[#141416] border border-neutral-800 flex flex-col justify-between">
              <div>
                <h3 className="font-bold font-outfit text-white text-lg">Unlimited</h3>
                <div className="mt-3 mb-4">
                  <span className="text-3xl font-black font-outfit text-white">₹999</span>
                  <span className="text-xs text-neutral-400">/mo</span>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    + ₹179.82 GST = <span className="text-neutral-200 font-semibold">₹1178.82</span>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Unlimited video duration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Unlimited daily exports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Priority GPU pipeline</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-emerald-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Clean watermark-free</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors"
              >
                Go Unlimited
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Testimonial Section */}
      <section className="py-16 border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#141416] border border-neutral-800 flex items-center gap-4">
              <img
                src="/src/assets/images/creator_avatar_1_1792817870911.jpg"
                alt="Creator Avatar"
                className="w-14 h-14 rounded-full object-cover shrink-0 border border-neutral-700"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-xs text-neutral-300 italic">
                  "CAPTIVOX cut my reel captioning time from 40 minutes in Premiere down to 90 seconds. The burned-in MP4 looks crisp and watches effortlessly on Instagram."
                </p>
                <div className="text-xs font-semibold text-white mt-2">
                  Aakash Verma <span className="text-neutral-500 font-normal">· Tech & Gadget YouTuber (450K)</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#141416] border border-neutral-800 flex items-center gap-4">
              <img
                src="/src/assets/images/creator_avatar_2_1792817870613.jpg"
                alt="Creator Avatar"
                className="w-14 h-14 rounded-full object-cover shrink-0 border border-neutral-700"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-xs text-neutral-300 italic">
                  "Having flawless Hinglish transcription without weird spelling errors is a game changer for Indian creators. The Hormozi yellow and SaaS gradient styles are pure fire."
                </p>
                <div className="text-xs font-semibold text-white mt-2">
                  Pooja Deshmukh <span className="text-neutral-500 font-normal">· Business & Finance Creator</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Founder Attribution */}
      <footer className="py-12 bg-[#09090b] border-t border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-400 gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#ff3d5a] to-[#ff8c1a] flex items-center justify-center font-extrabold text-white text-sm">
                C
              </div>
              <span className="font-extrabold text-white font-outfit text-base">CAPTIVOX</span>
            </div>
            <span className="hidden sm:inline text-neutral-600">|</span>
            <span>
              Crafted with ❤️ by <strong className="text-white font-bold">Vineet Rajput</strong>. 100% Free forever for creators.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[11px] font-semibold">
              ✨ 100% Free Lifetime
            </span>
            <a
              href="mailto:alexxrajput964@gmail.com"
              className="text-neutral-400 hover:text-white transition-colors underline underline-offset-4"
            >
              Contact Vineet Rajput
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
