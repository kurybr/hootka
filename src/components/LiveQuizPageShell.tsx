"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LiveQuizPageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: "3xl" | "4xl";
  className?: string;
}

export function LiveQuizPageShell({
  title,
  description,
  actions,
  children,
  maxWidth = "3xl",
  className,
}: LiveQuizPageShellProps) {
  return (
    <main className={cn("min-h-screen p-8 lg:p-12", className)}>
      <div
        className={cn(
          "mx-auto w-full space-y-6",
          maxWidth === "4xl" ? "max-w-4xl" : "max-w-3xl"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </main>
  );
}
