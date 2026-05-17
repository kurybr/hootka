import type { Metadata } from "next";
import { Montserrat, Nunito } from "next/font/google";

import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/toaster";
import { RealTimeProvider } from "@/providers/RealTimeContext";
import { SoundProvider } from "@/providers/SoundProvider";
import { ConsentProvider } from "@/providers/ConsentProvider";
import { ReconnectingOverlay } from "@/components/ReconnectingOverlay";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { AdSenseScript } from "@/components/AdSense";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { AuthProvider } from "@/providers/AuthProvider";

/** Corpo — substituto open source da Gotham (SIL Open Font License). */
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
});

/** Títulos — substituto open source da Ample Soft (SIL Open Font License). */
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Hootka",
  description: "Quiz interativo em tempo real",
  other: {
    "google-adsense-account": "ca-pub-4212036856145911",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${montserrat.variable} ${nunito.variable}`}>
        <ErrorBoundary>
          <ConsentProvider>
            <GoogleAnalytics />
            <AdSenseScript />
            <AuthProvider>
              <RealTimeProvider>
                <SoundProvider>
                  <Header />
                  {children}
                  <ReconnectingOverlay />
                  <Toaster />
                  <CookieConsentBanner />
                </SoundProvider>
              </RealTimeProvider>
            </AuthProvider>
          </ConsentProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
