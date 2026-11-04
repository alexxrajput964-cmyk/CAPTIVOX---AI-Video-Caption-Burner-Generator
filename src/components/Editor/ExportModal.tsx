import React, { useState } from 'react';
import { CaptionProject } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { burnCaptionsToVideo } from '../../lib/videoBurner';
import { generateSrt, generateVtt } from '../../lib/srtGenerator';
import { generateAssFile } from '../../lib/assGenerator';
import confetti from 'canvas-confetti';
import {
  X,
  Download,
  Film,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CaptionProject;
  videoElement: HTMLVideoElement | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  videoElement,
}) => {
  const { user, refreshUser, showToast, setIsUpgradeModalOpen } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorText, setErrorText] = useState('');
  const [showPythonModal, setShowPythonModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedFfmpeg, setCopiedFfmpeg] = useState(false);

  if (!isOpen) return null;

  const isFreeTier = user?.tier === 'free';
  const hasWatermark = isFreeTier;

  const triggerConfettiCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  const handleExportBurnedVideo = async () => {
    if (!videoElement) {
      setErrorText('Video track not ready. Please ensure the video is loaded.');
      return;
    }

    setIsExporting(true);
    setProgressPct(5);
    setStatusMessage('Starting subtitle burn engine with pop-up animation...');
    setErrorText('');

    try {
      // Burn captions into the video file
      const burnedBlob = await burnCaptionsToVideo(
        videoElement,
        project,
        hasWatermark,
        (progress) => {
          setProgressPct(progress.percent);
          setStatusMessage(progress.status);
        }
      );

      // Record export in backend & deduct credit
      const res = await fetch('/api/exports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-user',
        },
        body: JSON.stringify({
          project_id: project.id,
          project_title: project.title,
          format: 'mp4',
          duration: project.duration,
          has_watermark: hasWatermark,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (errData.upgradeRequired) {
          setIsExporting(false);
          setIsUpgradeModalOpen(true);
          showToast(errData.error || 'Export limit reached');
          return;
        }
      }

      await refreshUser();

      // Trigger auto-download of the MP4 with burned captions
      const downloadUrl = URL.createObjectURL(burnedBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const cleanTitle = (project.title || 'captivox_burned_video').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${cleanTitle}_burned_captions.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      triggerConfettiCelebration();
      showToast('🎉 Burned MP4 downloaded successfully!');
    } catch (err: any) {
      console.error('Burn error', err);
      setErrorText(err.message || 'Error occurred while burning captions');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSrt = () => {
    const srtText = generateSrt(project.captions, project.text_case);
    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title || 'subtitles'}.srt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('SRT file downloaded');
  };

  const handleDownloadVtt = () => {
    const vttText = generateVtt(project.captions, project.text_case);
    const blob = new Blob([vttText], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title || 'subtitles'}.vtt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('VTT file downloaded');
  };

  const handleDownloadAss = () => {
    const assText = generateAssFile(project, {
      enablePopAnimation: true,
      includeWatermark: hasWatermark,
      videoWidth: 1080,
      videoHeight: 1920,
    });
    const blob = new Blob([assText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'animated_subs.ass';
    a.click();
    URL.revokeObjectURL(url);
    showToast('animated_subs.ass downloaded with {\\fscx0\\fscy0\\t(0,150,\\fscx100\\fscy100)} tags!');
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title || 'project'}.captivox.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Project .captivox.json downloaded');
  };

  const pythonScriptCode = `# CAPTIVOX Animated Whisper + FFmpeg Pipeline
import os
import whisper

def format_ass_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centiseconds = int(round((seconds % 1) * 100))
    if centiseconds >= 100: centiseconds = 99
    return f"{hours}:{minutes:02d}:{secs:02d}.{centiseconds:02d}"

def create_animated_ass(segments, filename="animated_subs.ass", video_width=1080, video_height=1920):
    ass_content = """[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial Black,75,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,6,0,5,10,10,10,1
""".format(width=video_width, height=video_height)

    ass_content += "\\n[Events]\\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\\n"

    for segment in segments:
        start_time = format_ass_time(segment['start'])
        end_time = format_ass_time(segment['end'])
        text = segment['text'].upper().strip()
        # POP-UP / BOUNCE ANIMATION: 0% to 100% in 150ms
        animated_text = "{\\\\fscx0\\\\fscy0\\\\t(0,150,\\\\fscx100\\\\fscy100)}" + text
        ass_content += f"Dialogue: 0,{start_time},{end_time},Default,,0,0,0,,{animated_text}\\n"

    with open(filename, "w", encoding="utf-8") as f:
        f.write(ass_content)

if __name__ == "__main__":
    input_video = "${project.video_name || 'your_video.mp4'}"
    output_video = "final_animated_output.mp4"
    subtitle_file = "animated_subs.ass"

    model = whisper.load_model("base")
    result = model.transcribe(input_video, word_timestamps=True)
    create_animated_ass(result["segments"], filename=subtitle_file)

    # FFmpeg Burn-in command:
    command = f'ffmpeg -y -i "{input_video}" -vf "subtitles={subtitle_file}" -c:a copy "{output_video}"'
    os.system(command)
`;

  const copyPythonCode = () => {
    navigator.clipboard.writeText(pythonScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast('Python script copied to clipboard!');
  };

  const copyFfmpegCmd = () => {
    const cmd = `ffmpeg -y -i "${project.video_name || 'input.mp4'}" -vf "subtitles=animated_subs.ass" -c:a copy "final_animated_output.mp4"`;
    navigator.clipboard.writeText(cmd);
    setCopiedFfmpeg(true);
    setTimeout(() => setCopiedFfmpeg(false), 2000);
    showToast('FFmpeg command copied!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#141416] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff3d5a]/15 text-[#ff3d5a] border border-[#ff3d5a]/30 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            MP4 Burner Engine + Animated ASS
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-outfit text-white">
            Export Video with Burned Captions
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Permanent pop-up bounce subtitles baked into video frames with audio preservation.
          </p>
        </div>

        {errorText && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        {/* Free Tier Watermark Warning / Pro Notice */}
        {hasWatermark ? (
          <div className="mb-5 p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
            <div className="text-neutral-300">
              <span className="font-semibold text-white">Free Plan:</span> Video includes "Made with CAPTIVOX" watermark.
            </div>
            <button
              onClick={() => {
                onClose();
                setIsUpgradeModalOpen(true);
              }}
              className="text-[#ff8c1a] font-semibold hover:underline text-xs shrink-0 ml-2"
            >
              Remove for ₹199 →
            </button>
          </div>
        ) : (
          <div className="mb-5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{user?.tier?.toUpperCase()} Plan active · 100% Clean Watermark-Free Export</span>
          </div>
        )}

        {/* Progress Display */}
        {isExporting ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#ff3d5a] to-[#ff8c1a] mx-auto flex items-center justify-center animate-spin">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-black font-outfit text-white font-mono">
                {progressPct}%
              </div>
              <div className="text-xs text-neutral-400">{statusMessage}</div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] h-full transition-all duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Big Primary Burn Button */}
            <button
              onClick={handleExportBurnedVideo}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ff3d5a] via-[#ff8c1a] to-[#ffcb45] text-white font-bold font-outfit text-base shadow-xl shadow-[#ff3d5a]/25 hover:opacity-95 transition-all flex items-center justify-center gap-3 group cursor-pointer"
            >
              <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
              <span>⬇ Export Video with Burned Captions (MP4)</span>
            </button>

            {/* Subtitle Formats & ASS Download */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#141416] text-neutral-500 font-medium">
                  Subtitles & FFmpeg Animation File
                </span>
              </div>
            </div>

            {/* Secondary Formats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                onClick={handleDownloadAss}
                className="p-3 rounded-xl bg-[#1e1c24] border border-[#ff3d5a]/40 hover:border-[#ff3d5a] text-white flex flex-col items-center gap-1.5 transition-colors group cursor-pointer"
                title="Download animated_subs.ass with pop-up bounce tags"
              >
                <Sparkles className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold">animated_subs.ass</span>
                <span className="text-[10px] text-neutral-400">Pop-up Tags</span>
              </button>

              <button
                onClick={handleDownloadSrt}
                className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="font-semibold">SRT</span>
                <span className="text-[10px] text-neutral-500">YouTube</span>
              </button>

              <button
                onClick={handleDownloadVtt}
                className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">VTT</span>
                <span className="text-[10px] text-neutral-500">Web/HTML5</span>
              </button>

              <button
                onClick={handleDownloadJson}
                className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#ff8c1a]" />
                <span className="font-semibold">Project</span>
                <span className="text-[10px] text-neutral-500">.captivox.json</span>
              </button>
            </div>

            {/* Python + FFmpeg CLI Tool Modal Button */}
            <div className="pt-2">
              <button
                onClick={() => setShowPythonModal(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-xs text-neutral-300 hover:text-white flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>View Python Whisper + FFmpeg Burn Script</span>
                </div>
                <span className="text-[10px] font-mono text-[#ff8c1a]">Open Script →</span>
              </button>
            </div>
          </div>
        )}

        {/* Python Script Modal */}
        {showPythonModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
            <div className="relative w-full max-w-2xl bg-[#121214] border border-neutral-800 rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
              <button
                onClick={() => setShowPythonModal(false)}
                className="absolute top-5 right-5 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <div className="flex items-center gap-2 text-white font-bold font-outfit text-lg">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <span>Python Whisper & FFmpeg Burn-In Script</span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Runs Whisper AI model locally and burns <code className="text-yellow-400 font-mono">animated_subs.ass</code> with <code className="text-[#ff3d5a] font-mono">ffmpeg -vf "subtitles=..."</code>.
                </p>
              </div>

              {/* FFmpeg 1-liner copy bar */}
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs font-mono mb-3">
                <span className="truncate text-neutral-300">
                  ffmpeg -y -i "{project.video_name || 'input.mp4'}" -vf "subtitles=animated_subs.ass" -c:a copy "final_animated_output.mp4"
                </span>
                <button
                  onClick={copyFfmpegCmd}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white shrink-0 ml-2 flex items-center gap-1 font-sans text-xs"
                >
                  {copiedFfmpeg ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFfmpeg ? 'Copied' : 'Copy Command'}</span>
                </button>
              </div>

              {/* Python Code Block */}
              <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-black/80 border border-neutral-800/80 font-mono text-[11px] text-neutral-300 leading-relaxed select-all">
                <pre>{pythonScriptCode}</pre>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
                <button
                  onClick={handleDownloadAss}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1e1c24] border border-[#ff3d5a]/40 text-white text-xs font-semibold hover:border-[#ff3d5a]"
                >
                  Download animated_subs.ass
                </button>
                <button
                  onClick={copyPythonCode}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white text-xs font-semibold flex items-center gap-1.5 hover:opacity-95"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Copied Python Script!' : 'Copy Full Python Code'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
