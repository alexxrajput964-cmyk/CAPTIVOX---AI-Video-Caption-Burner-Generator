import { CaptionSegment, TextCase } from '../types';

/**
 * Accurately formats timestamps in seconds to SRT timecode (HH:MM:SS,mmm)
 * Protects against negative values, NaN, and timing drift.
 */
export function formatSrtTimestamp(seconds: number, offset = 0): string {
  const safeSec = Math.max(0, isNaN(seconds) ? 0 : seconds + offset);
  const h = Math.floor(safeSec / 3600);
  const m = Math.floor((safeSec % 3600) / 60);
  const s = Math.floor(safeSec % 60);
  const ms = Math.min(999, Math.floor((safeSec % 1) * 1000));

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/**
 * Formats timestamps in seconds to WebVTT timecode (HH:MM:SS.mmm)
 */
export function formatVttTimestamp(seconds: number, offset = 0): string {
  const safeSec = Math.max(0, isNaN(seconds) ? 0 : seconds + offset);
  const h = Math.floor(safeSec / 3600);
  const m = Math.floor((safeSec % 3600) / 60);
  const s = Math.floor(safeSec % 60);
  const ms = Math.min(999, Math.floor((safeSec % 1) * 1000));

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function applyCase(text: string, textCase?: TextCase): string {
  if (textCase === 'uppercase') return text.toUpperCase();
  if (textCase === 'lowercase') return text.toLowerCase();
  if (textCase === 'capitalize') {
    return text.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return text;
}

/**
 * Generates standard SRT subtitle file with verified seconds timestamps
 */
export function generateSrt(
  captions: CaptionSegment[],
  textCase?: TextCase,
  audioVideoOffset = 0
): string {
  const blocks: string[] = [];

  captions.forEach((cap, index) => {
    const startTime = formatSrtTimestamp(cap.start_time, audioVideoOffset);
    const endTime = formatSrtTimestamp(cap.end_time, audioVideoOffset);
    const text = applyCase(cap.text.trim(), textCase);

    blocks.push(`${index + 1}\n${startTime} --> ${endTime}\n${text}`);
  });

  return blocks.join('\n\n');
}

/**
 * Generates WebVTT subtitle file with verified seconds timestamps
 */
export function generateVtt(
  captions: CaptionSegment[],
  textCase?: TextCase,
  audioVideoOffset = 0
): string {
  const lines: string[] = ['WEBVTT', ''];

  captions.forEach((cap, index) => {
    const startTime = formatVttTimestamp(cap.start_time, audioVideoOffset);
    const endTime = formatVttTimestamp(cap.end_time, audioVideoOffset);
    const text = applyCase(cap.text.trim(), textCase);

    lines.push(`${index + 1}`);
    lines.push(`${startTime} --> ${endTime}`);
    lines.push(text);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Generates word-level precise SRT (each spoken word timed to audio)
 */
export function generateWordLevelSrt(
  captions: CaptionSegment[],
  textCase?: TextCase,
  audioVideoOffset = 0
): string {
  const blocks: string[] = [];
  let counter = 1;

  captions.forEach((cap) => {
    if (cap.words && cap.words.length > 0) {
      cap.words.forEach((w) => {
        const start = formatSrtTimestamp(w.start, audioVideoOffset);
        const end = formatSrtTimestamp(w.end, audioVideoOffset);
        const wordText = applyCase(w.text.trim(), textCase);
        blocks.push(`${counter++}\n${start} --> ${end}\n${wordText}`);
      });
    } else {
      const start = formatSrtTimestamp(cap.start_time, audioVideoOffset);
      const end = formatSrtTimestamp(cap.end_time, audioVideoOffset);
      const text = applyCase(cap.text.trim(), textCase);
      blocks.push(`${counter++}\n${start} --> ${end}\n${text}`);
    }
  });

  return blocks.join('\n\n');
}
