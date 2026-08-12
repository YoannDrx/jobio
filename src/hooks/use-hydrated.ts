"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/**
 * Returns false during SSR and the first hydration render, then true in the
 * browser. Use it for UI whose initial value depends on a client-only store.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
