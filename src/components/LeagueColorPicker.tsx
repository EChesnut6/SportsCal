import React, { useRef, useEffect } from 'react';
import type { League } from '../types';
import { applyLeagueColor } from '../colorUtils';

interface LeagueColorPickerProps {
  league: League;
  color: string;
  onColorCommit: (league: League, newColor: string) => void;
  title?: string;
}

export const LeagueColorPicker: React.FC<LeagueColorPickerProps> = React.memo(({
  league,
  color,
  onColorCommit,
  title,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCommittedColor = useRef<string>(color);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external changes (e.g. Reset Colors button or initial state load)
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== color) {
      inputRef.current.value = color;
    }
    lastCommittedColor.current = color;
  }, [color]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    // Live dragging: update CSS variable directly on DOM (60fps, zero React re-renders)
    const handleInput = (e: Event) => {
      const val = (e.target as HTMLInputElement).value;
      applyLeagueColor(league, val);

      // Debounce commit fallback in case user drags continuously without firing change
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        if (val && val !== lastCommittedColor.current) {
          lastCommittedColor.current = val;
          onColorCommit(league, val);
        }
      }, 300);
    };

    // Commit change on release, dialog close, or blur
    const handleCommit = (e: Event) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      const val = (e.target as HTMLInputElement).value;
      if (val && val !== lastCommittedColor.current) {
        lastCommittedColor.current = val;
        applyLeagueColor(league, val);
        onColorCommit(league, val);
      }
    };

    input.addEventListener('input', handleInput);
    input.addEventListener('change', handleCommit);
    input.addEventListener('blur', handleCommit);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      input.removeEventListener('input', handleInput);
      input.removeEventListener('change', handleCommit);
      input.removeEventListener('blur', handleCommit);
    };
  }, [league, onColorCommit]);

  return (
    <input
      ref={inputRef}
      type="color"
      defaultValue={color}
      className="league-color-picker"
      title={title}
      onClick={e => e.stopPropagation()}
    />
  );
});
