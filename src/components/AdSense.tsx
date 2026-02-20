"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { useConsent } from "@/providers/ConsentProvider";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ADSENSE_ENABLED =
  process.env.NEXT_PUBLIC_ADSENSE_ENABLED !== "false" && !!ADSENSE_CLIENT_ID;

type AdFormat = "horizontal" | "rectangle" | "auto";

interface AdSenseProps {
  /** Slot ID do AdSense (obtido ao criar unidade de anúncio no painel) */
  slot?: string;
  /** Formato do anúncio */
  format?: AdFormat;
  /** Estilo customizado */
  className?: string;
}

export function AdSense({ slot, format = "auto", className = "" }: AdSenseProps) {
  const { hasConsent } = useConsent();
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!ADSENSE_ENABLED || !hasConsent || !slot || !adRef.current) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      // Ignore
    }
  }, [hasConsent, slot]);

  if (!ADSENSE_CLIENT_ID || !ADSENSE_ENABLED || !hasConsent) {
    return null;
  }

  // Sem slot configurado: não renderiza bloco (usuário precisa criar unidades no AdSense)
  if (!slot) {
    return null;
  }

  const style =
    format === "horizontal"
      ? { display: "block", minHeight: 90 }
      : format === "rectangle"
        ? { display: "inline-block", width: 300, height: 250 }
        : { display: "block" };

  return (
    <div className={`overflow-hidden rounded-lg ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={style}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={format === "auto"}
      />
    </div>
  );
}

/** Carrega o script do AdSense uma vez (usar no layout ou provider) */
export function AdSenseScript() {
  const { hasConsent } = useConsent();

  if (!ADSENSE_CLIENT_ID || !ADSENSE_ENABLED || !hasConsent) {
    return null;
  }

  return (
    <Script
      id="adsense-script"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      strategy="lazyOnload"
      crossOrigin="anonymous"
    />
  );
}
