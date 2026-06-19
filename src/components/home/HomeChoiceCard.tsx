import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface HomeChoiceCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function HomeChoiceCard({
  href,
  icon: Icon,
  title,
  description,
  className,
}: HomeChoiceCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col items-center rounded-xl border border-border/70 bg-card px-6 py-8 text-center shadow-sm transition-colors",
        "hover:border-border hover:bg-muted/20 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <span
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground"
        aria-hidden="true"
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className="font-heading text-base font-semibold text-foreground">{title}</span>
      <span className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</span>
    </Link>
  );
}
