"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const CONSENT_KEY = "hootka_analytics_consent";

type ConsentStatus = "pending" | "accepted" | "rejected";

interface ConsentContextValue {
  hasConsent: boolean;
  status: ConsentStatus;
  acceptConsent: () => void;
  rejectConsent: () => void;
  openBanner: boolean;
  setOpenBanner: (open: boolean) => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConsentStatus>("pending");
  const [openBanner, setOpenBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentStatus | null;
    if (stored === "accepted" || stored === "rejected") {
      setStatus(stored);
    } else {
      setOpenBanner(true);
    }
    setMounted(true);
  }, []);

  const acceptConsent = useCallback(() => {
    setStatus("accepted");
    setOpenBanner(false);
    if (mounted) {
      localStorage.setItem(CONSENT_KEY, "accepted");
    }
  }, [mounted]);

  const rejectConsent = useCallback(() => {
    setStatus("rejected");
    setOpenBanner(false);
    if (mounted) {
      localStorage.setItem(CONSENT_KEY, "rejected");
    }
  }, [mounted]);

  const hasConsent = status === "accepted";

  return (
    <ConsentContext.Provider
      value={{
        hasConsent,
        status,
        acceptConsent,
        rejectConsent,
        openBanner,
        setOpenBanner,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    return {
      hasConsent: false,
      status: "pending" as ConsentStatus,
      acceptConsent: () => {},
      rejectConsent: () => {},
      openBanner: false,
      setOpenBanner: () => {},
    };
  }
  return context;
}
