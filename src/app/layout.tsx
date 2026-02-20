import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { RealTimeProvider } from "@/providers/RealTimeContext";
import { SoundProvider } from "@/providers/SoundProvider";
import { ConsentProvider } from "@/providers/ConsentProvider";
import { ReconnectingOverlay } from "@/components/ReconnectingOverlay";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quiz em Tempo Real",
  description: "Sistema de questionários interativos em tempo real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ConsentProvider>
            <GoogleAnalytics />
            <RealTimeProvider>
              <SoundProvider>
                {children}
                <ReconnectingOverlay />
                <Toaster />
                <CookieConsentBanner />
              </SoundProvider>
            </RealTimeProvider>
          </ConsentProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
