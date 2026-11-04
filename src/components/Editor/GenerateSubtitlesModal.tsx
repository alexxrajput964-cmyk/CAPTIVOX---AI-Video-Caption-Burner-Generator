import React, { useState } from 'react';
import { CaptionProject, CaptionSegment } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../lib/templates';
import { extractAudioFromVideo } from '../../lib/audioExtractor';
import { convertDevanagariToHinglish, hasDevanagari } from '../../lib/hinglishConverter';
import {
  X,
  Sparkles,
  Mic,
  FileText,
  AlertCircle,
  Loader2,
  Wand2,
  Languages,
} from 'lucide-react';

interface GenerateSubtitlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CaptionProject;
  onApplyCaptions: (captions: CaptionSegment[]) => void;
  showToast: (msg: string) => void;
}

const PRESET_TOPICS = [
  {
    title: '🔥 Consistency Beats Talent (Roman Hinglish)',
    lang: 'hinglish',
    prompt: 'Jab aap roz video upload karte ho, consistency beats talent. Yeh secret koi nahi batata.',
  },
  {
    title: '💰 Money & Investing Secret (Roman Hinglish)',
    lang: 'hinglish',
    prompt: 'Pehla kadam sabse mushkil hota hai. Paise sirf bachana nahi, smart tareeke se invest karna seekho.',
  },
  {
    title: '🚀 Top 3 AI Tools for Creators (Roman Hinglish)',
    lang: 'hinglish',
    prompt: 'Manual video editing mein ghanton waste mat karo. Ye 3 AI tools aapki speed ko 10x badha denge.',
  },
  {
    title: '🎯 Daily Focus & Discipline (Roman Hinglish)',
    lang: 'hinglish',
    prompt: 'Phone silent karo, distraction eliminate karo aur apne goal par laser focus rakho. Har din ek naya chance hai.',
  },
];

export const GenerateSubtitlesModal: React.FC<GenerateSubtitlesModalProps> = ({
  isOpen,
  onClose,
  project,
  onApplyCaptions,
  showToast,
}) => {
  const [activeMode, setActiveMode] = useState<'audio' | 'topic' | 'text'>('audio');
  const [selectedLanguage, setSelectedLanguage] = useState('hinglish'); // Default to Roman Hinglish!
  const [forceRomanHinglish, setForceRomanHinglish] = useState(true);
  const [topicInput, setTopicInput] = useState('');
  const [pastedTextInput, setPastedTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusStep, setStatusStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [customApiKey, setCustomApiKey] = useState(() => {
    try {
      return localStorage.getItem('captivox_custom_gemini_key') || '';
    } catch {
      return '';
    }
  });
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (customApiKey.trim()) {
      headers['x-gemini-api-key'] = customApiKey.trim();
    }
    return headers;
  };

  const handleSaveApiKey = (keyVal: string) => {
    setCustomApiKey(keyVal);
    try {
      localStorage.setItem('captivox_custom_gemini_key', keyVal.trim());
    } catch (e) {
      console.warn('Failed to save API key to localStorage', e);
    }
  };

  if (!isOpen) return null;

  // Converts raw words array into 4-5 word rhythmic chunks with exact seconds precision (e.g., 2.345s)
  const chunkWordsIntoCaptions = (
    rawWords: { text: string; start: number; end: number }[],
    speechOnset = 0.1,
    speechOffset?: number
  ): CaptionSegment[] => {
    if (!rawWords || rawWords.length === 0) return [];
    const CHUNK_SIZE = 5;
    const segments: CaptionSegment[] = [];

    // Ensure words are converted to Roman Hinglish if forceRomanHinglish is on
    // and timestamps are strict non-negative seconds with millisecond precision
    const processedWords = rawWords.map((w, index) => {
      let wordText = w.text;
      if (forceRomanHinglish || selectedLanguage === 'hinglish') {
        if (hasDevanagari(wordText)) {
          wordText = convertDevanagariToHinglish(wordText);
        }
      }

      // Preserve first word acoustic onset so leading speech is never cut off
      let startSec = Math.max(0, Number(w.start));
      if (index === 0) {
        // Guarantee first word starts at speech onset or earlier, never dropping leading audio
        if (speechOnset !== undefined && speechOnset >= 0) {
          startSec = Math.min(startSec, speechOnset);
        }
      }

      let endSec = Math.max(startSec + 0.12, Number(w.end));
      if (index === rawWords.length - 1) {
        // Guarantee last word extends to speech offset or trailing silence, never dropping trailing audio
        if (speechOffset !== undefined && speechOffset > startSec) {
          endSec = Math.max(endSec, speechOffset);
        } else {
          endSec = Math.max(endSec, startSec + 0.35);
        }
      }

      return {
        text: wordText,
        start: Number(startSec.toFixed(3)),
        end: Number(endSec.toFixed(3)),
      };
    });

    // Intelligently group words into 3-4 word high-retention caption blocks:
    // 1. Break on acoustic silence pauses (gap >= 0.32s between words)
    // 2. Break on terminal punctuation (. ! ? — or , with 2+ words)
    // 3. Keep chunks between 1 and 4 words for optimal rhythm and mobile readability
    // 4. Ensure non-overlapping timestamps and tight alignment with audio
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

      // Conditions to split chunk:
      // A: Silence gap between words >= 0.32s (speaker paused or took a breath)
      // B: Sentence boundary (. ! ?)
      // C: Clause boundary with at least 2 words
      // D: Reached max optimal chunk size (4 words)
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

    // Convert chunks into CaptionSegment with validated boundaries
    for (let i = 0; i < rawChunks.length; i++) {
      const slice = rawChunks[i];
      if (slice.length === 0) continue;

      const segStart = Number(slice[0].start.toFixed(3));
      let segEnd = Number(slice[slice.length - 1].end.toFixed(3));

      // Add a slight trailing hold for readability if next segment allows
      const nextChunk = rawChunks[i + 1];
      if (nextChunk && nextChunk.length > 0) {
        const nextStart = nextChunk[0].start;
        segEnd = Math.min(nextStart - 0.04, segEnd + 0.08);
      } else {
        segEnd = segEnd + 0.12;
      }

      // Guarantee minimum duration of 0.3s
      segEnd = Math.max(segStart + 0.3, segEnd);

      const text = slice.map((w) => w.text).join(' ');

      segments.push({
        id: `cap-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        idx: segments.length + 1,
        start_time: Number(segStart.toFixed(3)),
        end_time: Number(segEnd.toFixed(3)),
        text,
        words: slice.map((w) => ({
          text: w.text,
          start: Number(w.start.toFixed(3)),
          end: Number(w.end.toFixed(3)),
        })),
      });
    }

    return segments;
  };

  // 1. Transcribe from Video's Real Audio Track
  const handleTranscribeAudio = async () => {
    setLoading(true);
    setErrorMessage('');
    setStatusStep('1/3 Extracting audio track & computing acoustic speech envelopes...');

    try {
      let audioBase64 = '';
      let speechOnset = 0.1;
      let speechOffset = project.duration || 15;

      if (project.video_url) {
        try {
          const extracted = await extractAudioFromVideo(project.video_url, Math.min(90, project.duration || 30));
          audioBase64 = extracted.base64;
          speechOnset = extracted.speechOnset;
          speechOffset = extracted.speechOffset;
        } catch (audioErr: any) {
          console.warn('Direct audio extraction fallback', audioErr);
        }
      }

      setStatusStep('2/3 AI extracting acoustic word-level timestamps directly from speech buffer...');

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          language: selectedLanguage,
          audioBase64,
          videoDuration: project.duration || 15,
          speechOnset,
          speechOffset,
          textContext: project.title,
          customApiKey: customApiKey.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Speech transcription failed');
      }

      setStatusStep('3/3 Aligning word boundaries with millisecond precision & Roman script...');

      const rawWords = data.words || [];
      if (rawWords.length === 0) {
        throw new Error('No spoken voice detected in this video track. Use "AI Viral Script" or "Paste Script" mode below!');
      }

      const segments = chunkWordsIntoCaptions(rawWords, speechOnset, speechOffset);
      onApplyCaptions(segments);
      showToast(`🎉 Generated ${segments.length} Roman Hinglish subtitle lines with exact audio sync!`);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to extract audio or transcribe');
    } finally {
      setLoading(false);
    }
  };

  // 2. Generate from Topic / Prompt (for silent reels or new hooks)
  const handleGenerateFromTopic = async () => {
    if (!topicInput.trim()) {
      setErrorMessage('Please enter a video topic or select one of the presets');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setStatusStep('AI writing Roman Hinglish viral creator script & timing timestamps...');

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          mode: 'generate_topic',
          topicPrompt: topicInput,
          language: selectedLanguage,
          videoDuration: project.duration || 15,
          customApiKey: customApiKey.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate subtitles');
      }

      const segments = chunkWordsIntoCaptions(data.words || []);
      if (segments.length > 0) {
        onApplyCaptions(segments);
        showToast(`🎉 Generated ${segments.length} Roman Hinglish viral subtitle lines!`);
        onClose();
      } else {
        throw new Error('Could not parse subtitles');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  // 3. Generate from Pasted Text
  const handleAlignPastedText = async () => {
    if (!pastedTextInput.trim()) {
      setErrorMessage('Please paste your video script or dialogue');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setStatusStep('Aligning text and calculating word-level timestamps in Roman Hinglish...');

    // Convert pasted text to Roman Hinglish if requested
    let cleanedText = pastedTextInput;
    if (forceRomanHinglish && hasDevanagari(cleanedText)) {
      cleanedText = convertDevanagariToHinglish(cleanedText);
    }

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          textContext: cleanedText,
          language: selectedLanguage,
          videoDuration: project.duration || 15,
          customApiKey: customApiKey.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to align text');
      }

      const segments = chunkWordsIntoCaptions(data.words || []);
      if (segments.length > 0) {
        onApplyCaptions(segments);
        showToast(`🎉 Synced ${segments.length} Roman Hinglish subtitle lines to video!`);
        onClose();
      } else {
        throw new Error('Failed to align words');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Alignment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#141416] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff3d5a]/15 text-[#ff3d5a] border border-[#ff3d5a]/30 text-xs font-semibold mb-2">
            <Languages className="w-3.5 h-3.5" />
            Roman Hinglish AI Subtitles Engine
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-outfit text-white">
            Generate Roman Hinglish Subtitles
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Hindi audio ko natural Roman Hinglish script mein auto-transcribe karein with word-by-word karaoke timestamps.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <div>
              <div className="font-semibold">Notice</div>
              <div className="mt-0.5 text-neutral-300">{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 mb-5 text-xs">
          <button
            type="button"
            onClick={() => setActiveMode('audio')}
            className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'audio'
                ? 'bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span className="truncate">From Video Audio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('topic')}
            className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'topic'
                ? 'bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span className="truncate">AI Viral Script</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('text')}
            className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'text'
                ? 'bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="truncate">Paste Script</span>
          </button>
        </div>

        {/* Language Selection (25+ Languages) & Roman Hinglish Guarantee Switch */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-[#ff8c1a]" />
              <span>Language ({SUPPORTED_LANGUAGES.length} Supported)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-400 font-medium">
              <input
                type="checkbox"
                checked={forceRomanHinglish}
                onChange={(e) => setForceRomanHinglish(e.target.checked)}
                className="w-4 h-4 rounded accent-[#ff3d5a]"
              />
              <span>Force Roman Script (A, B, C...)</span>
            </label>
          </div>

          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#ff3d5a]"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Gemini API Key Option */}
        <div className="mb-5 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Custom Gemini API Key</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
                Optional
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="text-[11px] text-[#ff8c1a] hover:underline cursor-pointer"
            >
              {showApiKeyInput ? 'Hide Key' : customApiKey ? 'Key Saved (Change)' : '+ Add Custom Key'}
            </button>
          </div>

          {showApiKeyInput && (
            <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                placeholder="AIzaSy... (leave empty to use default server AI)"
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono text-xs focus:outline-none focus:border-[#ff3d5a]"
              />
              <p className="text-[10px] text-neutral-400 leading-tight">
                Leave blank to use the built-in system key, or paste your Gemini API key for private limits and dedicated speed.
              </p>
            </div>
          )}
        </div>

        {/* Tab 1: Audio Extraction & Speech Recognition */}
        {activeMode === 'audio' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs space-y-2 text-neutral-300">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Mic className="w-4 h-4 text-[#ff8c1a]" />
                Direct Speech Recognition in Roman Hinglish
              </div>
              <p className="text-neutral-400 leading-relaxed">
                CAPTIVOX video ka audio sun kar Hindi bol-chaal ko direct <strong>Roman Hinglish</strong> mein likhega (e.g. <em>"Yeh video viral hogi"</em>) aur har word ki exact timing sync karega.
              </p>
              <div className="pt-2 text-[11px] text-neutral-500 font-mono">
                Duration: {Math.round(project.duration || 15)}s · Video: {project.video_name}
              </div>
            </div>

            <button
              onClick={handleTranscribeAudio}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-[#ff3d5a]/25 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{statusStep || 'Processing audio in Hinglish...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Roman Hinglish Subtitles</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: Viral AI Script from Topic */}
        {activeMode === 'topic' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-neutral-300 mb-1.5 block">
                Enter Video Topic or Idea
              </label>
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="e.g. 5 Habits of High Performers, Gym Motivation in Roman Hinglish..."
                className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#ff3d5a]"
              />
            </div>

            {/* Presets */}
            <div>
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Or pick a viral Roman Hinglish creator preset:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_TOPICS.map((pt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setTopicInput(pt.prompt);
                      setSelectedLanguage(pt.lang);
                    }}
                    className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-left transition-colors text-xs cursor-pointer"
                  >
                    <div className="font-semibold text-white truncate">{pt.title}</div>
                    <div className="text-[10px] text-neutral-400 truncate mt-0.5">{pt.prompt}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateFromTopic}
              disabled={loading || !topicInput.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-[#ff3d5a]/25 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{statusStep || 'Generating viral Hinglish script...'}</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Roman Hinglish Reel Captions</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 3: Paste Custom Script & Auto-Align */}
        {activeMode === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-neutral-300 mb-1.5 block">
                Paste Your Dialogue or Script
              </label>
              <textarea
                rows={4}
                value={pastedTextInput}
                onChange={(e) => setPastedTextInput(e.target.value)}
                placeholder="Paste your dialogue here in Roman Hinglish (e.g., 'Yeh video aapke content ko 10x viral kar degi...')"
                className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-[#ff3d5a] resize-none leading-relaxed"
              />
            </div>

            <button
              onClick={handleAlignPastedText}
              disabled={loading || !pastedTextInput.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-[#ff3d5a]/25 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{statusStep || 'Aligning timestamps in Hinglish...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Auto-Align Script into Roman Hinglish Subtitles</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
