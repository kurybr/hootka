"use client";

import {
  buildWhatsAppUrl,
  isContactWhatsAppEnabled,
  readContactWhatsAppEnvConfig,
} from "@/lib/contactWhatsApp";
import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/gtag";
import { cn } from "@/lib/utils";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export type ContactWhatsAppLinkVariant = "menu" | "mobileMenu" | "inline" | "dropdown";

interface ContactWhatsAppLinkProps {
  variant?: ContactWhatsAppLinkVariant;
  source?: string;
  className?: string;
  onNavigate?: () => void;
}

export function ContactWhatsAppLink({
  variant = "menu",
  source = "unknown",
  className,
  onNavigate,
}: ContactWhatsAppLinkProps) {
  const config = readContactWhatsAppEnvConfig();
  const href = buildWhatsAppUrl(config);

  if (!isContactWhatsAppEnabled(config) || !href) {
    return null;
  }

  const handleClick = () => {
    trackEvent("contact_whatsapp_clicked", { source });
    onNavigate?.();
  };

  if (variant === "inline") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "font-medium text-primary underline underline-offset-4 hover:text-primary/90",
          className
        )}
        aria-label="Fale comigo no WhatsApp (abre em nova aba)"
        onClick={handleClick}
      >
        WhatsApp
      </a>
    );
  }

  if (variant === "mobileMenu") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted",
          className
        )}
        aria-label="Fale comigo no WhatsApp (abre em nova aba)"
        onClick={handleClick}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        Fale comigo
      </a>
    );
  }

  if (variant === "dropdown") {
    return (
      <DropdownMenuItem asChild>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          aria-label="Fale comigo no WhatsApp (abre em nova aba)"
          onClick={handleClick}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Fale comigo
        </a>
      </DropdownMenuItem>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
      aria-label="Fale comigo no WhatsApp (abre em nova aba)"
      onClick={handleClick}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      Fale comigo
    </a>
  );
}

export function useContactWhatsAppEnabled(): boolean {
  return isContactWhatsAppEnabled(readContactWhatsAppEnvConfig());
}
