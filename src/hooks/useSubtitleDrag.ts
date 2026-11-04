import { useState, useRef, useCallback, useEffect } from 'react';

export interface SubtitleDragOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  currentX: number; // percentage 0 - 100
  currentY: number; // percentage 0 - 100
  onPositionChange: (x: number, y: number) => void;
  disabled?: boolean;
}

export function useSubtitleDrag({
  containerRef,
  currentX,
  currentY,
  onPositionChange,
  disabled = false,
}: SubtitleDragOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isSnappedX, setIsSnappedX] = useState(false);
  const [isSnappedY, setIsSnappedY] = useState(false);

  const dragSessionRef = useRef<{
    pointerId: number | null;
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
    hasMoved: boolean;
  }>({
    pointerId: null,
    clientX: 0,
    clientY: 0,
    startX: currentX,
    startY: currentY,
    hasMoved: false,
  });

  const triggerHaptic = (ms = 10) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {
      // ignore
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;

    // Check if clicking an interactive element (buttons, textareas, etc.)
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-drag="true"]')) return;

    e.preventDefault();
    e.stopPropagation();

    dragSessionRef.current = {
      pointerId: e.pointerId,
      clientX: e.clientX,
      clientY: e.clientY,
      startX: currentX,
      startY: currentY,
      hasMoved: false,
    };

    setIsSelected(true);
    setIsDragging(true);
    triggerHaptic(12);

    // Lock page scrolling while actively dragging the subtitle object
    document.body.style.touchAction = 'none';
    document.body.style.userSelect = 'none';

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaPxX = e.clientX - dragSessionRef.current.clientX;
      const deltaPxY = e.clientY - dragSessionRef.current.clientY;

      if (Math.abs(deltaPxX) > 4 || Math.abs(deltaPxY) > 4) {
        dragSessionRef.current.hasMoved = true;
      }

      // Delta relative to video preview container dimensions
      let newPercentX = dragSessionRef.current.startX + (deltaPxX / rect.width) * 100;
      let newPercentY = dragSessionRef.current.startY + (deltaPxY / rect.height) * 100;

      // Magnetic Snapping for Center X (50%)
      let snappedX = false;
      if (Math.abs(newPercentX - 50) <= 3) {
        newPercentX = 50;
        snappedX = true;
      }
      setIsSnappedX(snappedX);

      // Magnetic Snapping for Vertical Presets (15% Top, 32% Upper, 50% Mid, 68% Lower, 82% Bottom)
      let snappedY = false;
      const yAnchors = [15, 32, 50, 68, 82];
      for (const anchor of yAnchors) {
        if (Math.abs(newPercentY - anchor) <= 2.2) {
          newPercentY = anchor;
          snappedY = true;
          break;
        }
      }
      setIsSnappedY(snappedY);

      // Bounds clamping within 5% to 95% of container frame
      const clampedX = Math.max(5, Math.min(95, Math.round(newPercentX)));
      const clampedY = Math.max(5, Math.min(95, Math.round(newPercentY)));

      onPositionChange(clampedX, clampedY);
    },
    [isDragging, containerRef, onPositionChange]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (isDragging) {
        setIsDragging(false);
        setIsSnappedX(false);
        setIsSnappedY(false);

        // Restore normal page scroll & user select
        document.body.style.touchAction = '';
        document.body.style.userSelect = '';

        if (!dragSessionRef.current.hasMoved) {
          setIsSelected(true);
        }
      }
    },
    [isDragging]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
        document.body.style.touchAction = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return {
    isDragging,
    isSelected,
    setIsSelected,
    isSnappedX,
    isSnappedY,
    handlePointerDown,
  };
}
