export const PLAYER_AWAITING_OTHERS_MESSAGE =
  "Aguardando os demais jogadores...";

export const PLAYER_TIMEOUT_NEXT_MESSAGE = "Preparando próxima pergunta...";

export const PLAYER_SOLO_LABEL = "Jogando sozinho";

export const PLAYER_LEADING_BADGE = "🏆 Você está liderando!";
export const PLAYER_TIED_LEADERSHIP_BADGE = "🤝 Empatado na liderança";

export type PlayerRankBadge = {
  text: string;
  highlight: boolean;
};

export function formatPlayerRankHighlight(position: number): string {
  if (position === 2) return "🥈 Você está em 2º lugar!";
  if (position === 3) return "🥉 Você está em 3º lugar!";
  return `Você está em ${position}º lugar`;
}

export function resolvePlayerRankBadge(
  myEntry: { position: number; totalScore: number },
  ranking: { totalScore: number }[]
): PlayerRankBadge | null {
  if (ranking.length === 0) return null;

  const maxScore = Math.max(...ranking.map((p) => p.totalScore));
  if (maxScore === 0) return null;

  const leadersAtTop = ranking.filter((p) => p.totalScore === maxScore).length;
  const myScore = myEntry.totalScore;

  if (myScore === maxScore) {
    if (leadersAtTop === 1) {
      return { text: PLAYER_LEADING_BADGE, highlight: true };
    }
    return { text: PLAYER_TIED_LEADERSHIP_BADGE, highlight: true };
  }

  return {
    text: formatPlayerRankHighlight(myEntry.position),
    highlight: isTopThreeRank(myEntry.position),
  };
}

export function isTopThreeRank(position: number): boolean {
  return position >= 1 && position <= 3;
}

export const PLAYER_RANK_HIGHLIGHT_CLASS =
  "mx-auto w-fit rounded-md border border-yellow-300 bg-yellow-50 px-4 py-2 text-center text-sm font-medium text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-100";

export const PLAYER_RANK_NEUTRAL_CLASS =
  "mx-auto w-fit rounded-md border border-border bg-muted/40 px-4 py-2 text-center text-sm font-medium text-foreground";

export const PLAYER_GAME_OVER_TITLE = "Fim de jogo";
export const PLAYER_GAME_OVER_DESCRIPTION = "Confira a classificação final.";
