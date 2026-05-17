import Link from "next/link";
import { PlusCircle, LogIn, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const quickLinks = [
  { href: "/host", label: "Criar uma sala", icon: PlusCircle },
  { href: "/join", label: "Entrar em uma sala", icon: LogIn },
  { href: "/quizzes", label: "Ranking global", icon: Trophy },
];

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Página não encontrada</CardTitle>
          <CardDescription>
            Parece que você se perdeu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Talvez você queira:</p>
          <nav className="flex flex-col gap-2" aria-label="Links rápidos">
            {quickLinks.map(({ href, label, icon: Icon }) => (
              <Button key={href} variant="outline" asChild className="w-full justify-start gap-2">
                <Link href={href}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              </Button>
            ))}
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}
