"use client";

import { useEffect } from "react";

type ShortcutActions = {
  onSave?: () => void;
  onTogglePanel?: () => void;
  onExportPdf?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
};

export function useCvKeyboardShortcuts(actions: ShortcutActions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModKey = e.metaKey || e.ctrlKey;
      if (!isModKey) return;

      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault();
          actions.onSave?.();
          break;
        case "e":
          e.preventDefault();
          actions.onTogglePanel?.();
          break;
        case "p":
          if (e.shiftKey) {
            e.preventDefault();
            actions.onExportPdf?.();
          }
          break;
        case "z":
          e.preventDefault();
          if (e.shiftKey) {
            actions.onRedo?.();
          } else {
            actions.onUndo?.();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions]);
}
