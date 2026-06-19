"use client";

import Link from "next/link";
import {
  Coffee,
  Github,
  Info,
  LogOut,
  MessageCircle,
  Shield,
} from "lucide-react";

import { ContactWhatsAppLink, useContactWhatsAppEnabled } from "@/components/ContactWhatsAppLink";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getGitHubRepoUrl } from "@/lib/siteLinks";
import { useDonate } from "@/providers/DonateProvider";

interface HeaderAccountActionsProps {
  variant: "dropdown" | "mobile";
  donateSource?: string;
  whatsAppSource?: string;
  isAdmin?: boolean;
  onDonate?: () => void;
  onNavigate?: () => void;
  onSignOut?: () => void;
  showSignOut?: boolean;
}

export function HeaderAccountActions({
  variant,
  donateSource = "header_menu",
  whatsAppSource = "header_menu",
  isAdmin = false,
  onDonate,
  onNavigate,
  onSignOut,
  showSignOut = true,
}: HeaderAccountActionsProps) {
  const { enabled: donateEnabled, openDonateDialog } = useDonate();
  const whatsAppEnabled = useContactWhatsAppEnabled();
  const githubUrl = getGitHubRepoUrl();

  const handleDonate = () => {
    onNavigate?.();
    onDonate?.();
    openDonateDialog({ source: donateSource });
  };

  if (variant === "dropdown") {
    return (
      <>
        {donateEnabled && (
          <DropdownMenuItem onSelect={handleDonate}>
            <Coffee className="h-4 w-4" aria-hidden="true" />
            Apoiar o Hootka
          </DropdownMenuItem>
        )}
        {whatsAppEnabled && (
          <ContactWhatsAppLink
            variant="dropdown"
            source={whatsAppSource}
            onNavigate={onNavigate}
          />
        )}
        <DropdownMenuItem asChild>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            GitHub
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/about" onClick={onNavigate}>
            <Info className="h-4 w-4" aria-hidden="true" />
            Sobre o Hootka
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" onClick={onNavigate}>
                <Shield className="h-4 w-4" aria-hidden="true" />
                Admin
              </Link>
            </DropdownMenuItem>
          </>
        )}
        {showSignOut && onSignOut && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSignOut}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </DropdownMenuItem>
          </>
        )}
      </>
    );
  }

  return (
    <div className="space-y-1">
      {donateEnabled && (
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          onClick={handleDonate}
        >
          <Coffee className="h-5 w-5" aria-hidden="true" />
          Apoiar o Hootka
        </button>
      )}
      {whatsAppEnabled && (
        <ContactWhatsAppLink
          variant="mobileMenu"
          source={whatsAppSource}
          onNavigate={onNavigate}
        />
      )}
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
        onClick={onNavigate}
      >
        <Github className="h-5 w-5" aria-hidden="true" />
        GitHub
      </a>
      <Link
        href="/about"
        onClick={onNavigate}
        className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
      >
        <Info className="h-5 w-5" aria-hidden="true" />
        Sobre o Hootka
      </Link>
      {isAdmin && (
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Shield className="h-5 w-5" aria-hidden="true" />
          Admin
        </Link>
      )}
      {showSignOut && onSignOut && (
        <>
          <div className="my-2 border-t border-border" role="presentation" />
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
            onClick={() => {
              onNavigate?.();
              onSignOut();
            }}
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Sair
          </button>
        </>
      )}
    </div>
  );
}
