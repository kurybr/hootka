import type { ReactNode } from "react";

import type { DonateTrigger } from "@/lib/donatePromptStorage";
import type { LiveReportCsvKind } from "@/lib/liveReportCsvExport";

export function DonateInviteLine(): ReactNode {
  return (
    <>
      Se o <span className="font-bold">Hootka</span> te ajudou hoje, me paga um ☕
    </>
  );
}

export interface DonateToastCopyInput {
  trigger: DonateTrigger;
  csvKind?: LiveReportCsvKind;
  importCount?: number;
}

export interface DonateToastCopy {
  successTitle: string;
  hookLine: string;
  fallbackDescription?: string;
}

export function getDonateToastCopy({
  trigger,
  csvKind,
  importCount = 1,
}: DonateToastCopyInput): DonateToastCopy {
  if (trigger === "csv_export") {
    const isRanking = csvKind === "ranking";
    return {
      successTitle: isRanking
        ? "✓ Ranking exportado com sucesso"
        : "✓ Relatório exportado com sucesso",
      hookLine: "Gostou do relatório?",
      fallbackDescription: isRanking
        ? "O ranking foi baixado com sucesso."
        : "O relatório de respostas foi baixado com sucesso.",
    };
  }

  if (trigger === "library_import") {
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

  return {
    successTitle: "✓ Partida encerrada",
    hookLine: "Gostou da partida?",
    fallbackDescription: "A partida foi finalizada com sucesso.",
  };
}

export function getDonatePromptCardCopy(trigger: DonateTrigger): DonateToastCopy {
  return getDonateToastCopy({ trigger });
}
