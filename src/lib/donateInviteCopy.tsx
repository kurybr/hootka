import type { ReactNode } from "react";

import type { DonateTrigger } from "@/lib/donatePromptStorage";

export function DonateInviteLine(): ReactNode {
  return (
    <>
      Se o <span className="font-bold">Hootka</span> te ajudou hoje, me paga um ☕
    </>
  );
}

export interface DonateToastCopyInput {
  trigger: DonateTrigger;
  importCount?: number;
}

export interface DonateToastCopy {
  successTitle: string;
  hookLine: string;
  fallbackDescription?: string;
}

export function getDonateToastCopy({
  trigger,
  importCount = 1,
}: DonateToastCopyInput): DonateToastCopy {
  if (trigger === "csv_export") {
    return {
      successTitle: "✓ CSV exportado com sucesso",
      hookLine: "Gostou do relatório?",
      fallbackDescription: "O arquivo foi baixado com sucesso.",
    };
  }

  const plural = importCount !== 1;
  return {
    successTitle: plural
      ? `✓ ${importCount} quizzes importados com sucesso`
      : "✓ Quiz importado com sucesso",
    hookLine: plural ? "Gostou dos quizzes?" : "Gostou do quiz?",
    fallbackDescription: plural
      ? `${importCount} quizzes foram adicionados à biblioteca.`
      : "O quiz foi adicionado à biblioteca.",
  };
}
