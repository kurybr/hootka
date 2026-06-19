"use client";

import Link from "next/link";

import {
  ContactWhatsAppLink,
  useContactWhatsAppEnabled,
} from "@/components/ContactWhatsAppLink";
import { getGitHubRepoUrl, isGitHubLinkVisible } from "@/lib/siteLinks";

const footerLinkClass =
  "underline-offset-4 hover:text-foreground hover:underline";

export function HomeFooter() {
  const githubVisible = isGitHubLinkVisible();
  const githubUrl = getGitHubRepoUrl();
  const whatsAppEnabled = useContactWhatsAppEnabled();

  return (
    <footer className="space-y-3 pb-8 text-center text-sm text-muted-foreground">
      <nav
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2"
        aria-label="Links do site"
      >
        <Link href="/about" className={footerLinkClass}>
          Sobre
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/privacy" className={footerLinkClass}>
          Privacidade
        </Link>
        {githubVisible && (
          <>
            <span aria-hidden="true">·</span>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={footerLinkClass}
            >
              GitHub
            </a>
          </>
        )}
        {whatsAppEnabled && (
          <>
            <span aria-hidden="true">·</span>
            <ContactWhatsAppLink
              variant="inline"
              source="home_footer"
              className="text-sm font-normal text-muted-foreground no-underline hover:text-foreground hover:underline"
            >
              Fale comigo
            </ContactWhatsAppLink>
          </>
        )}
      </nav>
    </footer>
  );
}
