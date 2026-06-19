"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ContactWhatsAppLink, useContactWhatsAppEnabled } from "@/components/ContactWhatsAppLink";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DonateConfig } from "@/lib/donateConfig";
import {
  buildDonatePixBrCode,
  buildDonatePixQrImage,
  type DonatePixQrInput,
} from "@/lib/donatePixQr";
import { toast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/gtag";

interface DonateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: DonateConfig;
  source?: string;
}

export function DonateDialog({
  open,
  onOpenChange,
  config,
  source,
}: DonateDialogProps) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const whatsAppEnabled = useContactWhatsAppEnabled();

  const pixInput = useMemo<DonatePixQrInput>(
    () => ({
      pixKey: config.pixKey,
      merchantName: config.merchantName,
      merchantCity: config.merchantCity,
      infoAdicional: "Um cafézinho por usar o Hootka",
    }),
    [config.pixKey, config.merchantName, config.merchantCity]
  );

  const suggestedAmountLabel =
    config.suggestedAmount !== null
      ? config.suggestedAmount.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
      : null;

  useEffect(() => {
    if (!open) return;

    trackEvent("donate_dialog_opened", { source: source ?? "unknown" });

    let cancelled = false;
    setLoadingQr(true);
    setQrError(false);
    setQrImage(null);

    void buildDonatePixQrImage(pixInput)
      .then((image) => {
        if (!cancelled) setQrImage(image);
      })
      .catch(() => {
        if (!cancelled) setQrError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingQr(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, pixInput, source]);

  const handleCopyBrCode = async () => {
    try {
      const brCode = buildDonatePixBrCode(pixInput);
      await navigator.clipboard.writeText(brCode);
      trackEvent("donate_pix_key_copied", { source: source ?? "unknown" });
      toast({
        title: "Pix copia e cola copiado",
        description: "Cole no app do seu banco para concluir o pagamento.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Não foi possível copiar",
        description: "Tente novamente ou escaneie o QR Code.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-3 text-center sm:text-center">
          <DialogTitle className="font-heading text-lg font-normal leading-snug sm:text-xl">
            Se o <span className="font-bold">Hootka</span> te ajudou hoje, me paga um ☕
          </DialogTitle>
          <DialogDescription className="sr-only">
            Escaneie o QR Code ou copie o Pix copia e cola para agradecer pelo uso
            do Hootka.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 py-1">
            {loadingQr && (
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
            )}
            {!loadingQr && qrImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrImage}
                alt="QR Code Pix para apoiar o Hootka"
                width={240}
                height={240}
                className="rounded-lg border bg-white p-3 shadow-sm"
              />
            )}
            {!loadingQr && qrError && (
              <p className="text-center text-sm text-muted-foreground">
                Não foi possível gerar o QR Code. Use o botão abaixo para copiar.
              </p>
            )}
            {/* {!loadingQr && !qrError && suggestedAmountLabel && (
              <p className="text-center text-sm text-muted-foreground">
                Sugestão: {suggestedAmountLabel} (um café). Você pode pagar o valor
                que quiser.
              </p>
            )} */}
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyBrCode}
            >
              Copiar PIX copia e cola
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Obrigado pelo apoio. 
            O <strong>Hootka</strong> continua evoluindo graças a pessoas como <strong>você</strong>. 💛
          </p>

          {whatsAppEnabled && (
            <div className="border-t border-border/60 pt-4 text-center text-xs leading-relaxed text-muted-foreground/75">
              <p>Tem uma ideia para o Hootka?</p>
              <p>
                Me chama no{" "}
                <ContactWhatsAppLink variant="inline" source="donate_dialog" />.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
