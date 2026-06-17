import type { RankedParticipant } from "@/hooks/useRanking";
import type { GlobalQuizAdminUserEntry } from "@/types/quiz";

export interface PlayerRankingEntry {
  id: string;
  name: string;
  score: number;
  position: number;
}

export interface PlayerRankingReport {
  totalPlayers: number;
  entries: PlayerRankingEntry[];
  playersLabel: string;
}

export function buildLivePlayerRankingReport(
  participants: RankedParticipant[]
): PlayerRankingReport {
  const entries = participants.map((participant) => ({
    id: participant.id,
    name: participant.name,
    score: participant.totalScore,
    position: participant.position,
  }));

  return {
    totalPlayers: entries.length,
    entries,
    playersLabel: "participantes",
  };
}

export function buildGlobalPlayerRankingReport(
  userStats: GlobalQuizAdminUserEntry[]
): PlayerRankingReport {
  const sorted = [...userStats].sort((a, b) => {
    if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
    return a.username.localeCompare(b.username, "pt-BR");
  });

  const entries = sorted.map((stats, index) => ({
    id: stats.userId,
    name: stats.username,
    score: stats.bestScore,
    position: index + 1,
  }));

  return {
    totalPlayers: entries.length,
    entries,
    playersLabel: "jogadores",
  };
}
