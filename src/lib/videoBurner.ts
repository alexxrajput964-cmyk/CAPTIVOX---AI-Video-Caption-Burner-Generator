import { CaptionProject, CaptionSegment, WordTimestamp } from '../types';
import { saveExportToIndexedDB } from './exportStorage';

export interface BurnProgressCallback {
  (progress: { percent: number; status: string; currentTime: number; duration: number }): void;
}

export type ExportQualityPreset = 'fast' | 'balanced' | 'best';

/**
 * Calculates current active word index with frame-accurate threshold checking (tolerance ~0.035s)
 * and takes global audio_offset into account.
 */
export function getActiveWordIndex(
  segment: CaptionSegment,
  currentTime: number,
  globalAudioOffset = 0
): number {
  if (!segment.words || segment.words.length === 0) return -1;
  const effectiveTime = currentTime - globalAudioOffset;
  const FRAME_TOLERANCE = 0.035; // ~1 frame at 30fps

  // 1. Exact match check
  const exactIdx = segment.words.findIndex(
    (w) => effectiveTime >= w.start && effectiveTime <= w.end
  );
  if (exactIdx !== -1) return exactIdx;

  // 2. Frame-accurate boundary check (bridges tiny gaps between words to prevent flicker)
  for (let i = 0; i < segment.words.length; i++) {
    const w = segment.words[i];
    const prevEnd = i > 0 ? segment.words[i - 1].end : w.start - FRAME_TOLERANCE;
    const nextStart = i < segment.words.length - 1 ? segment.words[i + 1].start : w.end + FRAME_TOLERANCE;

    if (
      effectiveTime >= Math.max(prevEnd, w.start - FRAME_TOLERANCE) &&
      effectiveTime <= Math.min(nextStart, w.end + FRAME_TOLERANCE)
    ) {
      return i;
    }
  }

  return -1;
}

/**
 * Draws styled captions, karaoke text, visual layers, and distinct templates on an HTML5 2D Canvas context
 */
export function renderCaptionsToCanvas(
  ctx: CanvasRenderingContext2D,
  project: CaptionProject,
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number,
  includeWatermark: boolean
) {
  // If free tier watermark is enabled, render in bottom-right corner
  if (includeWatermark) {
    ctx.save();
    const wmFontSize = Math.max(14, Math.round(canvasWidth * 0.024));
    ctx.font = `600 ${wmFontSize}px 'Outfit', sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    const wmText = '⚡ Made with CAPTIVOX';
    const textMetrics = ctx.measureText(wmText);
    const bgX = canvasWidth - textMetrics.width - 24;
    const bgY = canvasHeight - wmFontSize - 20;
    const bgW = textMetrics.width + 16;
    const bgH = wmFontSize + 12;

    ctx.fillStyle = 'rgba(10, 10, 10, 0.75)';
    ctx.beginPath();
    ctx.roundRect(bgX, bgY, bgW, bgH, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(wmText, canvasWidth - 16, canvasHeight - 14);
    ctx.restore();
  }

  // Draw Visual Layers (Badges / Shapes)
  if (project.visual_elements && project.visual_elements.length > 0) {
    project.visual_elements.forEach((elem) => {
      ctx.save();
      const elX = (elem.x / 100) * canvasWidth;
      const elY = (elem.y / 100) * canvasHeight;
      const badgeFontSize = Math.max(14, Math.round(canvasWidth * 0.028));
      ctx.font = `800 ${badgeFontSize}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (elem.text) {
        const textMetrics = ctx.measureText(elem.text);
        const w = textMetrics.width + 24;
        const h = badgeFontSize * 1.8;

        ctx.fillStyle = elem.bgColor || '#FF3D5A';
        ctx.beginPath();
        ctx.roundRect(elX - w / 2, elY - h / 2, w, h, 8);
        ctx.fill();

        ctx.fillStyle = elem.textColor || '#FFFFFF';
        ctx.fillText(elem.text, elX, elY);
      }
      ctx.restore();
    });
  }

  // Find currently active caption segment with global audio offset
  const globalOffset = project.audio_offset || 0;
  const effectiveTime = currentTime - globalOffset;

  const activeSegment = project.captions?.find(
    (cap) => effectiveTime >= cap.start_time && effectiveTime <= cap.end_time
  );

  if (!activeSegment) return;

  ctx.save();

  // Compute responsive font size based on canvas width and user font_size (2 - 16 scale)
  const scaleMultiplier = (project.font_size || 6) / 5;
  const computedFontSize = Math.max(18, Math.round(canvasWidth * 0.052 * scaleMultiplier));
  const fontWeight = project.font_weight || 700;
  const fontFamily = project.font_family || 'Plus Jakarta Sans';
  const isItalic = project.is_italic ? 'italic ' : '';
  ctx.font = `${isItalic}${fontWeight} ${computedFontSize}px '${fontFamily}', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Responsive coordinates from project position_x and position_y
  let posX = canvasWidth * 0.5; // default center
  if (project.position_x !== undefined) {
    posX = (project.position_x / 100) * canvasWidth;
  }

  let posY = canvasHeight * 0.80; // default bottom
  if (project.position_y !== undefined) {
    posY = (project.position_y / 100) * canvasHeight;
  } else if (project.position === 'top') {
    posY = canvasHeight * 0.15;
  } else if (project.position === 'center') {
    posY = canvasHeight * 0.50;
  }

  // Active word detection with audio offset
  const activeWordIdx = getActiveWordIndex(activeSegment, currentTime, globalOffset);

  // Template ID
  const templateId = project.template_id || 'minimal_clean';
  const isBackdropRemoved = project.backdrop_style === 'none' || project.box_bg_color === 'transparent';

  // Words list
  const wordsToRender: string[] =
    activeSegment.words && activeSegment.words.length > 0
      ? activeSegment.words.map((w) => {
          let text = w.text;
          if (project.text_case === 'uppercase') text = text.toUpperCase();
          else if (project.text_case === 'lowercase') text = text.toLowerCase();
          return text;
        })
      : [
          project.text_case === 'uppercase'
            ? activeSegment.text.toUpperCase()
            : project.text_case === 'lowercase'
            ? activeSegment.text.toLowerCase()
            : activeSegment.text,
        ];

  // Multi-line wrap calculation
  const maxLineWidth = canvasWidth * 0.84;
  const spaceWidth = ctx.measureText(' ').width;
  const lines: { words: string[]; originalIndices: number[] }[] = [];
  let currentLineWords: string[] = [];
  let currentLineIndices: number[] = [];
  let currentLineWidth = 0;

  wordsToRender.forEach((word, idx) => {
    const wordWidth = ctx.measureText(word).width;
    if (currentLineWords.length > 0 && currentLineWidth + spaceWidth + wordWidth > maxLineWidth) {
      lines.push({ words: currentLineWords, originalIndices: currentLineIndices });
      currentLineWords = [word];
      currentLineIndices = [idx];
      currentLineWidth = wordWidth;
    } else {
      currentLineWords.push(word);
      currentLineIndices.push(idx);
      currentLineWidth += (currentLineWords.length > 1 ? spaceWidth : 0) + wordWidth;
    }
  });

  if (currentLineWords.length > 0) {
    lines.push({ words: currentLineWords, originalIndices: currentLineIndices });
  }

  const lineHeight = computedFontSize * (project.line_spacing || 1.35);
  const totalBlockHeight = lines.length * lineHeight;
  const blockStartY = posY - totalBlockHeight / 2 + lineHeight / 2;

  // Render each line
  lines.forEach((line, lineIdx) => {
    const currentY = blockStartY + lineIdx * lineHeight;
    const lineMetrics = line.words.map((w) => ctx.measureText(w).width);
    const lineTotalWidth =
      lineMetrics.reduce((acc, val) => acc + val, 0) + (line.words.length - 1) * spaceWidth;

    let currentX = posX - lineTotalWidth / 2;

    // -------------------------------------------------------------
    // TEMPLATE BACKDROP BOX (Respects "none" removal)
    // -------------------------------------------------------------
    if (!isBackdropRemoved) {
      if (templateId === 'anim_neon_pulse') {
        ctx.save();
        ctx.strokeStyle = '#00F5D4';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00F5D4';
        ctx.shadowBlur = 24 + Math.sin(currentTime * 10) * 8;
        ctx.fillStyle = 'rgba(5, 20, 24, 0.88)';
        ctx.beginPath();
        ctx.roundRect(currentX - 22, currentY - computedFontSize * 0.78, lineTotalWidth + 44, computedFontSize * 1.56, 12);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (templateId === 'anim_typewriter_glow' || templateId === 'retro_vhs') {
        ctx.save();
        ctx.fillStyle = 'rgba(8, 20, 10, 0.92)';
        ctx.beginPath();
        ctx.roundRect(currentX - 20, currentY - computedFontSize * 0.75, lineTotalWidth + 40, computedFontSize * 1.5, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(57, 255, 20, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#39FF14';
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.restore();
      } else if (templateId === 'anim_glitch_cyber') {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 10, 24, 0.92)';
        ctx.beginPath();
        ctx.roundRect(currentX - 22, currentY - computedFontSize * 0.75, lineTotalWidth + 44, computedFontSize * 1.5, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 0, 85, 0.45)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#FF0055';
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.restore();
      } else if (templateId === 'anim_gold_luxe' || templateId === 'golden_luxury') {
        ctx.save();
        ctx.fillStyle = 'rgba(18, 15, 10, 0.92)';
        ctx.beginPath();
        ctx.roundRect(currentX - 22, currentY - computedFontSize * 0.75, lineTotalWidth + 44, computedFontSize * 1.5, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.55)';
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.restore();
      } else if (templateId === 'anim_wave_flow') {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 20, 32, 0.88)';
        ctx.beginPath();
        ctx.roundRect(currentX - 22, currentY - computedFontSize * 0.75, lineTotalWidth + 44, computedFontSize * 1.5, 14);
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.restore();
      } else if (templateId === 'anim_box_highlight') {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 17, 23, 0.94)';
        ctx.beginPath();
        ctx.roundRect(currentX - 20, currentY - computedFontSize * 0.75, lineTotalWidth + 40, computedFontSize * 1.5, 14);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 140, 26, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
      } else if (templateId === 'anim_soft_blur_reveal' || templateId === 'transparent_glass' || project.backdrop_style === 'frosted') {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.beginPath();
        ctx.roundRect(currentX - 22, currentY - computedFontSize * 0.75, lineTotalWidth + 44, computedFontSize * 1.5, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.restore();
      } else if (templateId === 'anim_3d_flip') {
        ctx.save();
        ctx.fillStyle = 'rgba(20, 10, 35, 0.9)';
        ctx.beginPath();
        ctx.roundRect(currentX - 22, currentY - computedFontSize * 0.75, lineTotalWidth + 44, computedFontSize * 1.5, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#A855F7';
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.restore();
      } else if (templateId === 'rounded_box' || templateId === 'beerbiceps') {
        ctx.save();
        ctx.fillStyle = 'rgba(18, 18, 22, 0.92)';
        ctx.beginPath();
        ctx.roundRect(currentX - 22, currentY - computedFontSize * 0.75, lineTotalWidth + 44, computedFontSize * 1.5, 14);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      } else if (templateId === 'neon_glow') {
        ctx.save();
        ctx.strokeStyle = '#00F5D4';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00F5D4';
        ctx.shadowBlur = 24;
        ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
        ctx.beginPath();
        ctx.roundRect(currentX - 20, currentY - computedFontSize * 0.75, lineTotalWidth + 40, computedFontSize * 1.5, 10);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (templateId === 'editorial_caption' || templateId === 'iman_gadzhi' || templateId === 'elegant_serif') {
        ctx.save();
        ctx.fillStyle = 'rgba(24, 21, 18, 0.9)';
        ctx.beginPath();
        ctx.roundRect(currentX - 20, currentY - computedFontSize * 0.75, lineTotalWidth + 40, computedFontSize * 1.5, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.shadowColor = 'rgba(212, 175, 55, 0.3)';
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.restore();
      } else if (project.box_bg_color && project.box_bg_color !== 'transparent') {
        ctx.save();
        ctx.fillStyle = project.box_bg_color;
        ctx.beginPath();
        ctx.roundRect(
          currentX - (project.box_padding || 18),
          currentY - computedFontSize * 0.75,
          lineTotalWidth + (project.box_padding || 18) * 2,
          computedFontSize * 1.5,
          project.box_radius || 12
        );
        ctx.fill();
        if (project.box_border_color) {
          ctx.strokeStyle = project.box_border_color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // -------------------------------------------------------------
    // RENDER EACH WORD WITH DISTINCT TEMPLATE & ANIMATION TRAITS
    // -------------------------------------------------------------
    line.words.forEach((word, wordLocalIdx) => {
      const origIdx = line.originalIndices[wordLocalIdx];
      const isWordActive = origIdx === activeWordIdx;
      const wordObj = activeSegment.words ? activeSegment.words[origIdx] : null;
      const isHighlighted = isWordActive || (wordObj && wordObj.isHighlighted);
      const wordWidth = lineMetrics[wordLocalIdx];
      const wordCenterX = currentX + wordWidth / 2;

      ctx.save();

      // Animations calculation
      const animStyle = project.animation_style || 'pop';
      let animScale = 1.0;
      let animOffsetY = 0;

      if (isWordActive && wordObj) {
        const wordElapsed = currentTime - wordObj.start;
        if (animStyle === 'fade') {
          animScale = 1.05;
        } else if (animStyle === 'slide') {
          if (wordElapsed >= 0 && wordElapsed < 0.22) {
            const p = wordElapsed / 0.22;
            animOffsetY = (1 - p) * 4;
            animScale = 0.98 + p * 0.08;
          } else {
            animScale = 1.06;
          }
        } else if (animStyle === 'zoom') {
          animScale = 1.12;
        } else if (animStyle === 'bounce') {
          animScale = 1.16;
          animOffsetY = Math.sin(currentTime * 8) * 3;
        } else if (animStyle === 'wavy_float') {
          animScale = 1.08;
          animOffsetY = Math.sin(currentTime * 6 + origIdx) * 4;
        } else if (animStyle === 'glitch_shake') {
          animScale = 1.1;
          animOffsetY = (Math.random() - 0.5) * 3;
        } else if (animStyle === 'kinetic_3d') {
          animScale = 1.18;
          animOffsetY = -2;
        } else if (animStyle === 'neon_pulse') {
          animScale = 1.1 + Math.sin(currentTime * 12) * 0.06;
        } else {
          // Pop bounce
          if (wordElapsed >= 0 && wordElapsed < 0.18) {
            const wp = wordElapsed / 0.18;
            animScale = wp < 0.65 ? (wp / 0.65) * 1.25 : 1.25 - ((wp - 0.65) / 0.35) * 0.12;
          } else {
            animScale = 1.14;
          }
        }
      }

      if (animScale !== 1.0 || animOffsetY !== 0) {
        ctx.translate(wordCenterX, currentY + animOffsetY);
        ctx.scale(animScale, animScale);
        ctx.translate(-wordCenterX, -(currentY + animOffsetY));
      }

      // Word color: Custom override > Highlight > Text
      const targetColor =
        wordObj?.customColor ||
        (isHighlighted
          ? project.highlight_color || '#FAFF00'
          : project.text_color || '#FFFFFF');

      // Outline & Shadow per template
      if (templateId === 'anim_pop_burst' || templateId === 'bold_punchy' || templateId === 'bold_highlight') {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(5, Math.round(computedFontSize * 0.2));
        ctx.lineJoin = 'miter';
        ctx.strokeText(word, wordCenterX, currentY);

        ctx.fillStyle = targetColor;
        ctx.fillText(word, wordCenterX, currentY);
      } else if (templateId === 'anim_karaoke_fill') {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(6, Math.round(computedFontSize * 0.22));
        ctx.strokeText(word, wordCenterX, currentY);

        ctx.fillStyle = isWordActive ? '#FFE600' : '#FFFFFF';
        ctx.fillText(word, wordCenterX, currentY);
      } else if (templateId === 'anim_neon_pulse' || templateId === 'neon_glow') {
        ctx.shadowColor = '#00F5D4';
        ctx.shadowBlur = isWordActive ? 28 : 12;
        ctx.strokeStyle = '#00382E';
        ctx.lineWidth = 3;
        ctx.strokeText(word, wordCenterX, currentY);

        ctx.fillStyle = targetColor;
        ctx.fillText(word, wordCenterX, currentY);
      } else if (templateId === 'anim_fire_heat' || templateId === 'fire_beast') {
        ctx.shadowColor = '#FF3D00';
        ctx.shadowBlur = isWordActive ? 26 : 14;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(5, Math.round(computedFontSize * 0.18));
        ctx.strokeText(word, wordCenterX, currentY);

        ctx.fillStyle = isWordActive ? '#FF3D00' : targetColor;
        ctx.fillText(word, wordCenterX, currentY);
      } else if (templateId === 'anim_comic_bang' || templateId === 'comic_pop') {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(7, Math.round(computedFontSize * 0.24));
        ctx.strokeText(word, wordCenterX, currentY);

        ctx.fillStyle = isWordActive ? '#FF1493' : '#FFF200';
        ctx.fillText(word, wordCenterX, currentY);
      } else if (templateId === 'anim_gold_luxe' || templateId === 'golden_luxury' || templateId === 'elegant_serif') {
        ctx.shadowColor = 'rgba(255, 215, 0, 0.55)';
        ctx.shadowBlur = isWordActive ? 20 : 10;
        ctx.strokeStyle = '#211B0B';
        ctx.lineWidth = 2;
        ctx.strokeText(word, wordCenterX, currentY);

        ctx.fillStyle = targetColor;
        ctx.fillText(word, wordCenterX, currentY);
      } else if (templateId === 'anim_glitch_cyber') {
        // Chromatic split effect
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 85, 0.7)';
        ctx.fillText(word, wordCenterX - 2, currentY);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
        ctx.fillText(word, wordCenterX + 2, currentY);
        ctx.restore();

        ctx.fillStyle = targetColor;
        ctx.fillText(word, wordCenterX, currentY);
      } else if (templateId === 'social_media_outlined' || templateId === 'outline_typography') {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(6, Math.round(computedFontSize * 0.22));
        ctx.shadowColor = '#000000';
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.strokeText(word, wordCenterX, currentY);

        ctx.fillStyle = targetColor;
        ctx.fillText(word, wordCenterX, currentY);
      } else if (templateId === 'shadow_depth') {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(4, Math.round(computedFontSize * 0.14));
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.shadowBlur = 12;
        ctx.strokeText(word, wordCenterX, currentY);

        ctx.fillStyle = targetColor;
        ctx.fillText(word, wordCenterX, currentY);
      } else if (templateId === 'retro_vhs' || templateId === 'anim_typewriter_glow') {
        ctx.shadowColor = '#39FF14';
        ctx.shadowBlur = isWordActive ? 22 : 12;
        ctx.strokeStyle = '#051A05';
        ctx.lineWidth = 2;
        ctx.strokeText(word, wordCenterX, currentY);

        ctx.fillStyle = targetColor;
        ctx.fillText(word, wordCenterX, currentY);
      } else {
        // Default with user outline/shadow settings
        if (project.outline_width && project.outline_width > 0) {
          ctx.strokeStyle = project.outline_color || '#000000';
          ctx.lineWidth = project.outline_width;
          ctx.strokeText(word, wordCenterX, currentY);
        } else {
          ctx.strokeStyle = 'rgba(0,0,0,0.85)';
          ctx.lineWidth = Math.max(2, Math.round(computedFontSize * 0.08));
          ctx.strokeText(word, wordCenterX, currentY);
        }

        if (project.shadow_blur && project.shadow_blur > 0) {
          ctx.shadowColor = project.shadow_color || 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = project.shadow_blur;
        }

        ctx.fillStyle = targetColor;
        ctx.fillText(word, wordCenterX, currentY);
      }

      ctx.restore();
      currentX += wordWidth + spaceWidth;
    });
  });

  ctx.restore();
}

/**
 * Executes full video render and caption burn-in
 */
export async function burnCaptionsToVideo(
  videoElement: HTMLVideoElement,
  project: CaptionProject,
  includeWatermark: boolean,
  onProgress: BurnProgressCallback,
  quality: ExportQualityPreset = 'balanced'
): Promise<Blob> {
  // Request screen wake lock so long exports don't sleep or throttle
  let wakeLockSentinel: any = null;
  try {
    if ('wakeLock' in navigator) {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
    }
  } catch (e) {
    // Wake lock non-critical
  }

  return new Promise(async (resolve, reject) => {
    try {
      const origCurrentTime = videoElement.currentTime;
      const origMuted = videoElement.muted;

      // Determine dimensions and bitrate according to preset
      let targetWidth = 1080;
      let targetHeight = 1920;
      let bitrate = 8_000_000; // Balanced: 8Mbps

      if (quality === 'fast') {
        targetWidth = 720;
        targetHeight = 1280;
        bitrate = 4_000_000;
      } else if (quality === 'best') {
        targetWidth = 1080;
        targetHeight = 1920;
        bitrate = 12_000_000; // Best: 12Mbps
      }

      // Adjust aspect ratio if horizontal or square
      if (project.frame === '16:9') {
        const temp = targetWidth;
        targetWidth = targetHeight;
        targetHeight = temp;
      } else if (project.frame === '1:1') {
        targetWidth = quality === 'fast' ? 720 : 1080;
        targetHeight = quality === 'fast' ? 720 : 1080;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        throw new Error('Canvas 2D context could not be created');
      }

      onProgress({ percent: 5, status: `Initializing ${quality.toUpperCase()} encoder (${targetWidth}x${targetHeight})...`, currentTime: 0, duration: videoElement.duration });

      let combinedStream: MediaStream;
      const canvasStream = canvas.captureStream(30);

      try {
        // Capture audio track from video
        // @ts-expect-error captureStream might not be in standard HTMLVideoElement types
        const videoStream = videoElement.captureStream ? videoElement.captureStream() : null;
        if (videoStream && videoStream.getAudioTracks().length > 0) {
          const audioTrack = videoStream.getAudioTracks()[0];
          canvasStream.addTrack(audioTrack);
          combinedStream = canvasStream;
        } else {
          combinedStream = canvasStream;
        }
      } catch (err) {
        console.warn('Audio capture fallback', err);
        combinedStream = canvasStream;
      }

      // Best supported MP4 / WebM mimeType
      let mimeType = 'video/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
          mimeType = 'video/mp4;codecs=avc1';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          mimeType = 'video/webm;codecs=vp9,opus';
        } else {
          mimeType = 'video/webm';
        }
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: bitrate,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const finalBlob = new Blob(chunks, { type: mimeType });
          videoElement.currentTime = origCurrentTime;
          videoElement.muted = origMuted;

          // Automatically cache last 3 exports in IndexedDB
          try {
            await saveExportToIndexedDB(finalBlob, project.id, project.title, videoElement.duration);
          } catch (storageErr) {
            console.warn('IndexedDB auto-save warning', storageErr);
          }

          if (wakeLockSentinel) {
            wakeLockSentinel.release().catch(() => {});
          }

          onProgress({ percent: 100, status: 'Complete! Burning finished.', currentTime: videoElement.duration, duration: videoElement.duration });
          resolve(finalBlob);
        } catch (stopErr) {
          reject(stopErr);
        }
      };

      recorder.onerror = (e) => {
        if (wakeLockSentinel) wakeLockSentinel.release().catch(() => {});
        reject(e);
      };

      videoElement.currentTime = 0;
      videoElement.muted = false;

      await new Promise<void>((r) => {
        const onSeeked = () => {
          videoElement.removeEventListener('seeked', onSeeked);
          r();
        };
        videoElement.addEventListener('seeked', onSeeked);
      });

      recorder.start(100);
      await videoElement.play();

      const duration = videoElement.duration || 10;
      let animId: number;
      let rfcId: number;

      const renderLoop = () => {
        if (videoElement.paused || videoElement.ended || videoElement.currentTime >= duration) {
          if (animId) cancelAnimationFrame(animId);
          if (recorder.state === 'recording') {
            recorder.stop();
          }
          return;
        }

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        renderCaptionsToCanvas(ctx, project, videoElement.currentTime, canvas.width, canvas.height, includeWatermark);

        const currentPct = Math.min(98, Math.round((videoElement.currentTime / duration) * 90) + 8);
        onProgress({
          percent: currentPct,
          status: `Burning frame ${Math.round(videoElement.currentTime * 30)} (${currentPct}%)`,
          currentTime: videoElement.currentTime,
          duration,
        });

        if ('requestVideoFrameCallback' in videoElement) {
          rfcId = (videoElement as any).requestVideoFrameCallback(renderLoop);
        } else {
          animId = requestAnimationFrame(renderLoop);
        }
      };

      if ('requestVideoFrameCallback' in videoElement) {
        rfcId = (videoElement as any).requestVideoFrameCallback(renderLoop);
      } else {
        animId = requestAnimationFrame(renderLoop);
      }

      videoElement.onended = () => {
        if (animId) cancelAnimationFrame(animId);
        if (rfcId && 'cancelVideoFrameCallback' in videoElement) {
          (videoElement as any).cancelVideoFrameCallback(rfcId);
        }
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      };
    } catch (error) {
      if (wakeLockSentinel) wakeLockSentinel.release().catch(() => {});
      reject(error);
    }
  });
}
