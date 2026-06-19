"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import { DonateDialog } from "@/components/DonateDialog";
import { isDonateHostContext } from "@/lib/donateAudience";
import type { DonateConfig } from "@/lib/donateConfig";
import { fetchDonateConfig } from "@/lib/donateClient";

interface OpenDonateDialogOptions {
  source?: string;
}

interface DonateContextValue {
  config: DonateConfig | null;
  enabled: boolean;
  isHostContext: boolean;
  openDonateDialog: (options?: OpenDonateDialogOptions) => void;
}

const defaultConfig: DonateConfig = {
  enabled: false,
  pixKey: "",
  merchantName: "Hootka",
  merchantCity: "Sao Paulo",
};

const DonateContext = createContext<DonateContextValue>({
  config: null,
  enabled: false,
  isHostContext: false,
  openDonateDialog: () => {},
});

export function DonateProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHostContext = isDonateHostContext(pathname);
  const [config, setConfig] = useState<DonateConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSource, setDialogSource] = useState<string | undefined>();

  useEffect(() => {
    if (!isHostContext) {
      setConfig(null);
      return;
    }

    let cancelled = false;

    void fetchDonateConfig()
      .then((nextConfig) => {
        if (!cancelled) setConfig(nextConfig);
      })
      .catch(() => {
        if (!cancelled) setConfig(defaultConfig);
      });

    return () => {
      cancelled = true;
    };
  }, [isHostContext]);

  const enabled = Boolean(config?.enabled && isHostContext);

  const openDonateDialog = useCallback(
    (options?: OpenDonateDialogOptions) => {
      if (!enabled || !config) return;
      setDialogSource(options?.source);
      setDialogOpen(true);
    },
    [enabled, config]
  );

  const value = useMemo(
    () => ({
      config,
      enabled,
      isHostContext,
      openDonateDialog,
    }),
    [config, enabled, isHostContext, openDonateDialog]
  );

  return (
    <DonateContext.Provider value={value}>
      {children}
      {enabled && config && (
        <DonateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          config={config}
          source={dialogSource}
        />
      )}
    </DonateContext.Provider>
  );
}

export function useDonate(): DonateContextValue {
  return useContext(DonateContext);
}
