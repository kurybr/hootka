"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConsent } from "@/providers/ConsentProvider";

export function CookieConsentBanner() {
  const { openBanner, acceptConsent, rejectConsent } = useConsent();

  return (
    <AnimatePresence>
      {openBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 p-4 shadow-lg backdrop-blur sm:p-6"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Cookie className="mt-0.5 h-6 w-6 shrink-0 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Cookies e privacidade</p>
                <p className="text-sm text-muted-foreground">
                  Utilizamos cookies para melhorar sua experiência e analisar o
                  uso do site. Ao continuar, você concorda com nossa{" "}
                  <Link
                    href="/privacy"
                    className="underline hover:text-primary"
                  >
                    política de privacidade
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={rejectConsent}>
                Recusar
              </Button>
              <Button size="sm" onClick={acceptConsent}>
                Aceitar
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
