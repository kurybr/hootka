"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DonateInviteLine, getDonatePromptCardCopy } from "@/lib/donateInviteCopy";
import type { DonateTrigger } from "@/lib/donatePromptStorage";
import {
  recordDonatePromptShown,
  shouldShowDonatePrompt,
} from "@/lib/donatePromptStorage";
import { trackEvent } from "@/lib/gtag";
import { useDonate } from "@/providers/DonateProvider";

interface DonatePromptCardProps {
  trigger: DonateTrigger;
}

export function DonatePromptCard({ trigger }: DonatePromptCardProps) {
  const { enabled, isHostContext, openDonateDialog } = useDonate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled || !isHostContext) {
      setVisible(false);
      return;
    }

    const shouldShow = shouldShowDonatePrompt(trigger, { isHostContext });
    setVisible(shouldShow);

    if (shouldShow) {
      trackEvent("donate_prompt_shown", { trigger });
    }
  }, [enabled, isHostContext, trigger]);

  if (!visible) return null;

  const copy = getDonatePromptCardCopy(trigger);

  const handleOpen = () => {
    recordDonatePromptShown(trigger, "opened");
    openDonateDialog({ source: trigger });
  };

  const handleDismiss = () => {
    recordDonatePromptShown(trigger, "dismiss");
    trackEvent("donate_prompt_dismissed", { trigger });
    setVisible(false);
  };

  return (
    <Card className="border-dashed border-primary/40 bg-primary/5">
      <CardHeader className="relative pb-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8"
          onClick={handleDismiss}
          aria-label="Fechar convite de apoio"
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
        <CardTitle className="pr-10 text-base font-heading font-normal">
          {copy.successTitle}
        </CardTitle>
        <CardDescription className="space-y-1">
          <span className="block">{copy.hookLine}</span>
          <span className="block text-foreground/90">
            <DonateInviteLine />
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="outline" onClick={handleOpen}>
          Apoiar
        </Button>
      </CardContent>
    </Card>
  );
}
