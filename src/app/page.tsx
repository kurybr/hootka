"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-8 lg:p-12">
      <motion.div
        className="mx-auto w-full max-w-2xl space-y-8 text-center lg:max-w-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Quiz em Tempo Real
          </h1>
          <p className="text-muted-foreground">
            Crie ou entre em uma sala para começar a jogar
          </p>
        </div>

        <Separator />

        <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="p-6 lg:p-8">
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                <Users className="h-5 w-5" />
                Criar Sala
              </CardTitle>
              <CardDescription>
                Crie uma nova sala, adicione perguntas e convide participantes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 lg:p-8 lg:pt-0">
              <Button asChild size="lg" className="w-full">
                <Link href="/host">Criar Sala</Link>
              </Button>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="p-6 lg:p-8">
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                <LogIn className="h-5 w-5" />
                Entrar em Sala
              </CardTitle>
              <CardDescription>
                Entre em uma sala existente usando o código fornecido pelo host
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 lg:p-8 lg:pt-0">
              <Button asChild variant="secondary" size="lg" className="w-full">
                <Link href="/join">Entrar em Sala</Link>
              </Button>
            </CardContent>
          </Card>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}
