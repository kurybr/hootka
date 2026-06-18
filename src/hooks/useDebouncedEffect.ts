"use client";

import { useEffect, useRef } from "react";

const DEFAULT_DEBOUNCE_MS = 400;

export function useDebouncedEffect(
  effect: () => void,
  deps: unknown[],
  delayMs = DEFAULT_DEBOUNCE_MS
): void {
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      effectRef.current();
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce wrapper for caller deps
  }, [...deps, delayMs]);
}
