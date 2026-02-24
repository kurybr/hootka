import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <ConsentProvider>
            <GoogleAnalytics />
            <AdSenseScript />
            <AuthProvider>
              <RealTimeProvider>
                <SoundProvider>
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
