"use client";

import { AnswerDistribution } from "@/components/AnswerDistribution";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QuizAnswerReport } from "@/lib/answerReportUtils";

interface QuizAnswerReportProps {
  report: QuizAnswerReport;
  title?: string;
  description?: string;
}

export function QuizAnswerReport({
  report,
  title = "Relatório de respostas",
  description = "Distribuição agregada por pergunta, sem identificar participantes.",
}: QuizAnswerReportProps) {
  if (report.questionCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Este quiz não tem perguntas.</p>
        </CardContent>
      </Card>
    );
  }

  if (report.totalSessions === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ainda não há {report.sessionsLabel} com respostas para exibir.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total de {report.sessionsLabel}
            </p>
            <p className="text-2xl font-bold">{report.totalSessions}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Perguntas
            </p>
            <p className="text-2xl font-bold">{report.questionCount}</p>
          </div>
        </div>

        <div className="space-y-8">
          {report.entries.map((entry) => (
            <div key={entry.questionIndex} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  Pergunta {entry.questionIndex + 1}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>
                    Respostas: {entry.totalAnswered} de {entry.totalSessions}
                  </span>
                  <span>Acerto: {entry.correctRate.toFixed(0)}%</span>
                </div>
              </div>
              <AnswerDistribution
                question={entry.question}
                counts={entry.counts}
                total={entry.totalAnswered}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
