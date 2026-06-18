"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PlusCircle,
  LogIn,
  LogOut,
  Trophy,
  Menu,
  Shield,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { usePlayerMobileFocus } from "@/providers/PlayerMobileFocusProvider";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const secondaryNavItems = [
  { href: "/quizzes", label: "Quizzes", icon: Trophy },
  { href: "/community/quizzes", label: "Criar quiz", icon: BookOpen },
  { href: "/join", label: "Entrar em sala", icon: LogIn },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { active: mobileFocusActive } = usePlayerMobileFocus();
  const { user, profile, loading, signOut, signInWithGoogle } = useAuth();
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (mobileFocusActive) {
      setMobileOpen(false);
    }
  }, [mobileFocusActive]);

  const sessionLabel = user
    ? user.isAnonymous
      ? profile?.username?.trim() ||
        user.displayName?.trim() ||
        "Sessão de jogo"
      : user.email?.trim() ||
        profile?.email?.trim() ||
        profile?.username?.trim() ||
        user.displayName?.trim() ||
        "Conta Google"
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

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        mobileFocusActive && "max-md:hidden"
      )}
    >
      <div className="container flex h-14 items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg hover:opacity-90 transition-opacity"
        >
          Hootka
        </Link>

        {/* Desktop nav: primary action + secondary links */}
        <nav className="hidden md:flex items-center gap-2" aria-label="Navegação principal">
          {secondaryNavItems.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              variant={pathname.startsWith(href) ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link href={href} className="flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            </Button>
          ))}
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href="/admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" aria-hidden="true" />
                Admin
              </Link>
            </Button>
          )}
          <Button size="sm" variant="outline" asChild>
            <Link href="/host" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Sala ao vivo
            </Link>
          </Button>
          {!loading &&
            (user ? (
              <div className="flex items-center gap-2 border-l pl-3 ml-1 max-w-[200px]">
                <span className="text-xs text-muted-foreground truncate hidden lg:inline" title={sessionLabel ?? undefined}>
                  {sessionLabel}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1"
                  onClick={() => void handleSignOut()}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sair
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1 shrink-0 ml-1"
                onClick={() => void handleSignInGoogle()}
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Entrar
              </Button>
            ))}
        </nav>

        {/* Mobile nav */}
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[280px]" showClose={true}>
            <DialogHeader>
              <DialogTitle>Menu</DialogTitle>
            </DialogHeader>
            <nav className="flex flex-col gap-2 mt-4" aria-label="Navegação mobile">
              {secondaryNavItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    pathname.startsWith(href)
                      ? "bg-secondary text-secondary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Shield className="h-5 w-5" aria-hidden="true" />
                  Admin
                </Link>
              )}
              <Link
                href="/host"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium border border-border hover:bg-muted transition-colors mt-2"
              >
                <PlusCircle className="h-5 w-5" aria-hidden="true" />
                Sala ao vivo
              </Link>
              {!loading && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  {user ? (
                    <>
                      {sessionLabel && (
                        <p className="px-4 text-xs text-muted-foreground truncate" title={sessionLabel}>
                          {sessionLabel}
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          setMobileOpen(false);
                          void handleSignOut();
                        }}
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Sair
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        setMobileOpen(false);
                        void handleSignInGoogle();
                      }}
                    >
                      <LogIn className="h-5 w-5" aria-hidden="true" />
                      Entrar com Google
                    </Button>
                  )}
                </div>
              )}
            </nav>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
