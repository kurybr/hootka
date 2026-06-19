"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LogIn,
  Menu,
  Mic,
  Trophy,
  User,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HeaderAccountActions } from "@/components/layout/HeaderAccountActions";
import { useAuth } from "@/providers/AuthProvider";
import { usePlayerMobileFocus } from "@/providers/PlayerMobileFocusProvider";
import { toast } from "@/hooks/use-toast";
import {
  getUserNavbarLabel,
  getUserProfileHeading,
  truncateEmail,
} from "@/lib/userDisplay";
import { cn } from "@/lib/utils";

const mainNavItems: {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
}[] = [
  { href: "/quizzes", label: "Explorar", icon: Trophy },
  { href: "/host", label: "Criar sala", icon: Mic, primary: true },
];

function NavLinkLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </>
  );
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const { active: mobileFocusActive } = usePlayerMobileFocus();
  const { user, profile, loading, signOut, signInWithGoogle } = useAuth();
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (mobileFocusActive) {
      setMobileOpen(false);
    }
  }, [mobileFocusActive]);

  const profileHeading = user
    ? getUserProfileHeading({
        displayName: user.displayName,
        username: profile?.username,
        email: user.email ?? profile?.email,
        isAnonymous: user.isAnonymous,
      })
    : null;

  const navbarLabel = user
    ? getUserNavbarLabel({
        displayName: user.displayName,
        username: profile?.username,
        email: user.email ?? profile?.email,
        isAnonymous: user.isAnonymous,
      })
    : null;

  const profileEmail =
    user && !user.isAnonymous
      ? user.email?.trim() || profile?.email?.trim() || null
      : null;

  const handleSignInGoogle = async () => {
    try {
      await signInWithGoogle();
      toast({ title: "Login realizado", description: "Bem-vindo ao Hootka." });
    } catch (e: unknown) {
      const code =
        typeof e === "object" && e !== null && "code" in e
          ? String((e as { code?: string }).code)
          : "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return;
      }
      toast({
        variant: "destructive",
        title: "Não foi possível entrar",
        description: e instanceof Error ? e.message : "Tente novamente.",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Sessão encerrada" });
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Tente novamente.",
      });
    }
  };

  const closeMobile = () => setMobileOpen(false);

  const isNavActive = (href: string) => {
    if (href === "/host") {
      return pathname === "/host" || pathname.startsWith("/host/");
    }
    if (href === "/quizzes") {
      return (
        pathname.startsWith("/quizzes") || pathname.startsWith("/community/quizzes")
      );
    }
    return pathname.startsWith(href);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        mobileFocusActive && "max-md:hidden"
      )}
    >
      <div className="container flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-lg font-semibold transition-opacity hover:opacity-90"
        >
          Hootka
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-end gap-1 md:flex"
          aria-label="Navegação principal"
        >
          {mainNavItems.map(({ href, label, icon, primary }) => (
            <Button
              key={href}
              variant={isNavActive(href) ? "secondary" : primary ? "outline" : "ghost"}
              size="sm"
              asChild
              className="shrink-0"
            >
              <Link href={href} className="flex items-center gap-1.5">
                <NavLinkLabel icon={icon} label={label} />
              </Link>
            </Button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!loading &&
            (user ? (
              <DropdownMenu open={profileMenuOpen} onOpenChange={setProfileMenuOpen} modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer gap-1.5 text-muted-foreground"
                    aria-label={`Menu da conta: ${profileHeading}`}
                  >
                    <User className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="max-w-[8rem] truncate">{navbarLabel}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{profileHeading}</span>
                      {profileEmail && (
                        <span className="text-xs font-normal text-muted-foreground">
                          {truncateEmail(profileEmail)}
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <HeaderAccountActions
                    variant="dropdown"
                    donateSource="header_profile_menu"
                    whatsAppSource="header_profile_menu"
                    isAdmin={isAdmin}
                    onDonate={() => setProfileMenuOpen(false)}
                    onNavigate={() => setProfileMenuOpen(false)}
                    onSignOut={() => void handleSignOut()}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <DropdownMenu open={moreMenuOpen} onOpenChange={setMoreMenuOpen} modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer gap-1 text-muted-foreground"
                      aria-label="Mais opções"
                    >
                      Mais
                      <ChevronDown className="h-4 w-4 opacity-60" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <HeaderAccountActions
                      variant="dropdown"
                      donateSource="header_profile_menu"
                      whatsAppSource="header_profile_menu"
                      showSignOut={false}
                      onDonate={() => setMoreMenuOpen(false)}
                      onNavigate={() => setMoreMenuOpen(false)}
                    />
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => void handleSignInGoogle()}>
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      Entrar com Google
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ))}
        </div>

        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[300px]" showClose={true}>
            <DialogHeader>
              <DialogTitle>Menu</DialogTitle>
            </DialogHeader>
            <nav className="mt-4 flex flex-col gap-2" aria-label="Navegação mobile">
              {mainNavItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobile}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    isNavActive(href)
                      ? "bg-secondary text-secondary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                </Link>
              ))}

              <div className="my-2 border-t border-border" role="presentation" />

              {user && profileHeading && (
                <div className="px-4 py-1">
                  <p className="text-sm font-medium">{profileHeading}</p>
                  {profileEmail && (
                    <p className="text-xs text-muted-foreground">{truncateEmail(profileEmail)}</p>
                  )}
                </div>
              )}

              <HeaderAccountActions
                variant="mobile"
                donateSource="header_profile_menu"
                whatsAppSource="header_profile_menu"
                isAdmin={isAdmin}
                onNavigate={closeMobile}
                showSignOut={Boolean(user)}
                onSignOut={() => void handleSignOut()}
              />

              {!loading && !user && (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-2 w-full justify-start gap-2"
                  onClick={() => {
                    closeMobile();
                    void handleSignInGoogle();
                  }}
                >
                  <LogIn className="h-5 w-5" aria-hidden="true" />
                  Entrar com Google
                </Button>
              )}
            </nav>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
