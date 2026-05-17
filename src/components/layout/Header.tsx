"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle, LogIn, Trophy, Menu, Shield, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
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
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            </nav>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
