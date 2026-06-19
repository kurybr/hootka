import { trackEvent } from "@/lib/gtag";
import {
  recordDonatePromptShown,
  shouldShowDonatePrompt,
} from "@/lib/donatePromptStorage";

interface PromptDonateAfterCsvExportOptions {
  enabled: boolean;
  isHostContext: boolean;
  onOpenDonate: () => void;
}

/** Abre o modal de apoio após exportação CSV, respeitando audiência e cooldown. */
export function promptDonateAfterCsvExport({
  enabled,
  isHostContext,
  onOpenDonate,
}: PromptDonateAfterCsvExportOptions): void {
  if (!enabled || !isHostContext) return;
  if (!shouldShowDonatePrompt("csv_export", { isHostContext })) return;

  trackEvent("donate_prompt_shown", { trigger: "csv_export" });
  recordDonatePromptShown("csv_export", "opened");
  onOpenDonate();
}
