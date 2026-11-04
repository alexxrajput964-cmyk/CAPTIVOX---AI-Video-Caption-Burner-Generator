import { CaptionSegment } from '../types';

export interface SilenceGap {
  start: number;
  end: number;
  duration: number;
}

/**
 * Detects silent segments in an AudioBuffer where speech is paused.
 * Returns an array of silence intervals (in seconds).
 */
export function detectAudioSilenceGaps(
  audioBuffer: AudioBuffer,
  threshold = 0.018,
  minSilenceDuration = 0.15
): SilenceGap[] {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const windowSize = Math.floor(sampleRate * 0.02); // 20ms analysis window
  const gaps: SilenceGap[] = [];

  let inSilence = false;
  let silenceStartSec = 0;

  for (let i = 0; i < channelData.length; i += windowSize) {
    let sum = 0;
    const limit = Math.min(i + windowSize, channelData.length);
    for (let j = i; j < limit; j++) {
      sum += channelData[j] * channelData[j];
    }
    const rms = Math.sqrt(sum / (limit - i));
    const currentSec = i / sampleRate;

    if (rms < threshold) {
      if (!inSilence) {
        inSilence = true;
        silenceStartSec = currentSec;
      }
    } else {
      if (inSilence) {
        inSilence = false;
        const duration = currentSec - silenceStartSec;
        if (duration >= minSilenceDuration) {
          gaps.push({
            start: Number(silenceStartSec.toFixed(3)),
            end: Number(currentSec.toFixed(3)),
            duration: Number(duration.toFixed(3)),
          });
        }
      }
    }
  }

  if (inSilence) {
    const endSec = channelData.length / sampleRate;
    if (endSec - silenceStartSec >= minSilenceDuration) {
      gaps.push({
        start: Number(silenceStartSec.toFixed(3)),
        end: Number(endSec.toFixed(3)),
        duration: Number((endSec - silenceStartSec).toFixed(3)),
      });
    }
  }

  return gaps;
}

/**
 * Snaps subtitle start and end boundaries to nearest silence gaps
 * within a max snap distance (default 0.35s).
 */
export function autoSnapCaptionsToSilence(
  captions: CaptionSegment[],
  silenceGaps: SilenceGap[],
  maxSnapDistance = 0.35
): { updatedCaptions: CaptionSegment[]; snappedCount: number } {
  if (!silenceGaps || silenceGaps.length === 0 || !captions || captions.length === 0) {
    return { updatedCaptions: captions, snappedCount: 0 };
  }

  let snappedCount = 0;

  const updatedCaptions = captions.map((segment) => {
    let newStart = segment.start_time;
    let newEnd = segment.end_time;
    let wasModified = false;

    // Check start snap (snap to end of silence preceding speech)
    for (const gap of silenceGaps) {
      if (Math.abs(segment.start_time - gap.end) <= maxSnapDistance) {
        newStart = Number(gap.end.toFixed(3));
        wasModified = true;
        break;
      }
    }

    // Check end snap (snap to start of silence following speech)
    for (const gap of silenceGaps) {
      if (Math.abs(segment.end_time - gap.start) <= maxSnapDistance) {
        newEnd = Number(gap.start.toFixed(3));
        wasModified = true;
        break;
      }
    }

    // Ensure valid non-negative order and minimum duration
    if (newEnd <= newStart + 0.3) {
      newEnd = Number((newStart + 0.5).toFixed(3));
    }

    if (wasModified) snappedCount++;

    return {
      ...segment,
      start_time: newStart,
      end_time: newEnd,
    };
  });

  return { updatedCaptions, snappedCount };
}
