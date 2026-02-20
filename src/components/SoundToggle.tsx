"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSound } from "@/providers/SoundProvider";

export function SoundToggle() {
  const { enabled, toggle } = useSound();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      title={enabled ? "Desativar sons" : "Ativar sons"}
      className="shrink-0"
    >
      {enabled ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );
}
