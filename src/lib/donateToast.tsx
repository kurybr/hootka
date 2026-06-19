"use client";

import { ToastAction } from "@/components/ui/toast";
import {
  DonateInviteLine,
  getDonateToastCopy,
  type DonateToastCopyInput,
} from "@/lib/donateInviteCopy";
import type { DonateTrigger } from "@/lib/donatePromptStorage";
import {
  recordDonatePromptShown,
  shouldShowDonatePrompt,
} from "@/lib/donatePromptStorage";
import { toast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/gtag";

interface ShowDonateSuccessToastOptions extends DonateToastCopyInput {
  isHostContext: boolean;
  enabled: boolean;
  onOpenDonate: (source: DonateTrigger) => void;
}

export function showDonateSuccessToast({
  trigger,
  csvKind,
  importCount,
  isHostContext,
  enabled,
  onOpenDonate,
}: ShowDonateSuccessToastOptions): void {
  const copy = getDonateToastCopy({ trigger, csvKind, importCount });

  const canInvite =
    enabled &&
    isHostContext &&
    shouldShowDonatePrompt(trigger, { isHostContext });

  if (!canInvite) {
    toast({
      title: copy.successTitle,
      description: copy.fallbackDescription,
    });
    return;
  }

  trackEvent("donate_prompt_shown", { trigger });

  toast({
    title: copy.successTitle,
    description: (
      <div className="space-y-1">
        <p>{copy.hookLine}</p>
        <p>
          <DonateInviteLine />
        </p>
      </div>
    ),
    action: (
      <ToastAction
        altText="Apoiar"
        onClick={() => {
          recordDonatePromptShown(trigger, "opened");
          onOpenDonate(trigger);
        }}
      >
        Apoiar
      </ToastAction>
    ),
  });
}
