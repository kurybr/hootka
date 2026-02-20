"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useConsent } from "@/providers/ConsentProvider";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GA_ENABLED =
  process.env.NEXT_PUBLIC_GA_ENABLED !== "false" && !!GA_MEASUREMENT_ID;

function GoogleAnalyticsInner() {
  const pathname = usePathname();
  const { hasConsent } = useConsent();

  useEffect(() => {
    if (GA_ENABLED && hasConsent && typeof window !== "undefined" && window.gtag) {
      window.gtag("config", GA_MEASUREMENT_ID!, {
        page_path: pathname,
      });
    }
  }, [pathname, hasConsent]);

  if (!GA_MEASUREMENT_ID || !GA_ENABLED || !hasConsent) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}

export function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner />
    </Suspense>
  );
}
