"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuizCreatePageShellProps {
  title: string;
  description: string;
  backHref: string;
  backLabel?: string;
  maxWidth?: "2xl" | "4xl" | "5xl";
  children: ReactNode;
  className?: string;
}

export function QuizCreatePageShell({
  title,
  description,
  backHref,
  backLabel = "Voltar",
  maxWidth = "5xl",
  children,
  className,
}: QuizCreatePageShellProps) {
  return (
    <main className={cn("min-h-screen p-8 lg:p-12", className)}>
      <div
        className={cn(
          "mx-auto w-full space-y-6",
          maxWidth === "2xl"
            ? "max-w-2xl"
            : maxWidth === "4xl"
              ? "max-w-4xl"
              : "max-w-5xl"
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </div>
        {children}
      </div>
    </main>
  );
}
