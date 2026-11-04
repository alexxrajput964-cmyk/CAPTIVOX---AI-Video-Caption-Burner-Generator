/**
 * Audio Analysis & Extraction Engine
 * Extracts audio track from video, analyzes acoustic energy envelopes,
 * detects speech onset/offset to prevent first/last word truncation,
 * and encodes to 16kHz mono WAV for precision word-level transcription.
 */

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Encodes an AudioBuffer into 16-bit PCM WAV format
 */
export function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = 1; // mono
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const channelData = buffer.getChannelData(0);
  const dataLength = channelData.length * (bitDepth / 8);
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataLength, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw PCM)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataLength, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < channelData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return arrayBuffer;
}

export interface AcousticEnvelope {
  speechOnset: number;    // seconds where first voice activity starts
  speechOffset: number;   // seconds where last voice activity ends
  averageEnergy: number;
  duration: number;
}

/**
 * Analyzes audio channel data to determine exact acoustic voice boundaries
 * so that early first words and late ending words are never lost or clipped.
 */
export function analyzeAudioEnvelope(channelData: Float32Array, sampleRate: number): AcousticEnvelope {
  const windowSize = Math.floor(sampleRate * 0.025); // 25ms frame
  const totalWindows = Math.floor(channelData.length / windowSize);
  const energies: number[] = new Array(totalWindows);

  let totalEnergy = 0;
  for (let w = 0; w < totalWindows; w++) {
    let sumSquares = 0;
    const startSample = w * windowSize;
    for (let i = 0; i < windowSize; i++) {
      const val = channelData[startSample + i];
      sumSquares += val * val;
    }
    const rms = Math.sqrt(sumSquares / windowSize);
    energies[w] = rms;
    totalEnergy += rms;
  }

  const avgEnergy = energies.length > 0 ? totalEnergy / energies.length : 0.01;
  const threshold = Math.max(0.005, avgEnergy * 0.25);

  let firstVoiceWindow = -1;
  let lastVoiceWindow = -1;

  for (let w = 0; w < totalWindows; w++) {
    if (energies[w] >= threshold) {
      if (firstVoiceWindow === -1) firstVoiceWindow = w;
      lastVoiceWindow = w;
    }
  }

  // Pre-roll buffer of 60ms to guarantee no word starts are chopped
  const onsetSec = firstVoiceWindow >= 0 ? Math.max(0, (firstVoiceWindow * 0.025) - 0.06) : 0.1;
  // Post-roll buffer of 120ms to guarantee word tail finishes cleanly
  const offsetSec = lastVoiceWindow >= 0 ? Math.min(channelData.length / sampleRate, (lastVoiceWindow * 0.025) + 0.12) : (channelData.length / sampleRate);

  return {
    speechOnset: Number(onsetSec.toFixed(3)),
    speechOffset: Number(offsetSec.toFixed(3)),
    averageEnergy: avgEnergy,
    duration: channelData.length / sampleRate,
  };
}

/**
 * Extracts audio from video URL or File, decodes, resamples to 16kHz mono,
 * computes speech boundaries, and returns Base64 WAV with exact acoustic bounds.
 */
export async function extractAudioFromVideo(
  videoSource: string | File,
  maxDurationSec = 90
): Promise<{
  base64: string;
  duration: number;
  speechOnset: number;
  speechOffset: number;
}> {
  let arrayBuffer: ArrayBuffer;

  if (typeof videoSource === 'string') {
    const response = await fetch(videoSource);
    if (!response.ok) {
      throw new Error(`Failed to load video: ${response.statusText}`);
    }
    arrayBuffer = await response.arrayBuffer();
  } else {
    arrayBuffer = await videoSource.arrayBuffer();
  }

  // Create AudioContext to decode audio
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  try {
    const decodedAudio = await audioCtx.decodeAudioData(arrayBuffer);

    // If audio is longer than maxDurationSec, slice it for fast transcription
    const durationToProcess = Math.min(decodedAudio.duration, maxDurationSec);
    const targetSampleRate = 16000;
    const targetLength = Math.floor(durationToProcess * targetSampleRate);

    // Resample to 16kHz mono using OfflineAudioContext
    const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedAudio;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const channelData = renderedBuffer.getChannelData(0);

    // Compute acoustic boundaries directly from audio waveform buffer
    const envelope = analyzeAudioEnvelope(channelData, targetSampleRate);

    const wavBuffer = audioBufferToWav(renderedBuffer);

    // Convert to base64
    let binary = '';
    const bytes = new Uint8Array(wavBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);

    return {
      base64: `data:audio/wav;base64,${base64}`,
      duration: durationToProcess,
      speechOnset: envelope.speechOnset,
      speechOffset: envelope.speechOffset,
    };
  } finally {
    audioCtx.close().catch(() => {});
  }
}
