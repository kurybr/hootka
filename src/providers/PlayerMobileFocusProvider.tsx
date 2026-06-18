"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface PlayerMobileFocusContextValue {
  active: boolean;
  setActive: (active: boolean) => void;
}

const PlayerMobileFocusContext = createContext<PlayerMobileFocusContextValue>({
  active: false,
  setActive: () => {},
});

export function PlayerMobileFocusProvider({ children }: { children: ReactNode }) {
  const [active, setActiveState] = useState(false);
  const setActive = useCallback((next: boolean) => {
    setActiveState(next);
  }, []);

  const value = useMemo(
    () => ({
      active,
      setActive,
    }),
    [active, setActive]
  );

  return (
    <PlayerMobileFocusContext.Provider value={value}>
      {children}
    </PlayerMobileFocusContext.Provider>
  );
}

export function usePlayerMobileFocus() {
  return useContext(PlayerMobileFocusContext);
}
