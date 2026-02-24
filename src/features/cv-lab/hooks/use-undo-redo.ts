"use client";

import { useCallback, useRef, useState } from "react";

const MAX_HISTORY = 50;
const DEBOUNCE_MS = 500;

type UndoRedoReturn<T> = {
  push: (state: T) => void;
  undo: () => T | null;
  redo: () => T | null;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
};

export function useUndoRedo<T>(
  isEqual?: (a: T, b: T) => boolean,
): UndoRedoReturn<T> {
  const historyRef = useRef<T[]>([]);
  const indexRef = useRef(-1);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, forceRender] = useState(0);

  const push = useCallback(
    (state: T) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const history = historyRef.current;
        const currentIndex = indexRef.current;

        if (currentIndex >= 0 && currentIndex < history.length) {
          const current = history[currentIndex];
          if (
            isEqual
              ? isEqual(current, state)
              : JSON.stringify(current) === JSON.stringify(state)
          ) {
            return;
          }
        }

        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(state);

        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }

        historyRef.current = newHistory;
        indexRef.current = newHistory.length - 1;
        forceRender((n) => n + 1);
      }, DEBOUNCE_MS);
    },
    [isEqual],
  );

  const undo = useCallback((): T | null => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const currentIndex = indexRef.current;
    if (currentIndex <= 0) return null;

    const newIndex = currentIndex - 1;
    indexRef.current = newIndex;
    forceRender((n) => n + 1);
    return historyRef.current[newIndex];
  }, []);

  const redo = useCallback((): T | null => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const currentIndex = indexRef.current;
    const history = historyRef.current;
    if (currentIndex >= history.length - 1) return null;

    const newIndex = currentIndex + 1;
    indexRef.current = newIndex;
    forceRender((n) => n + 1);
    return history[newIndex];
  }, []);

  const clear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    historyRef.current = [];
    indexRef.current = -1;
    forceRender((n) => n + 1);
  }, []);

  return {
    push,
    undo,
    redo,
    canUndo: indexRef.current > 0,
    canRedo: indexRef.current < historyRef.current.length - 1,
    clear,
  };
}
