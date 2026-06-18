import {
  PLAYER_LEADING_BADGE,
  PLAYER_TIED_LEADERSHIP_BADGE,
  resolvePlayerRankBadge,
} from "./playerMicrocopy";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function testAllZeroScoresHidesBadge() {
  const ranking = [
    { totalScore: 0 },
    { totalScore: 0 },
    { totalScore: 0 },
  ];
  const badge = resolvePlayerRankBadge({ position: 1, totalScore: 0 }, ranking);
  assert(badge === null, "expected no badge when everyone has 0 points");
}

function testIsolatedLeader() {
  const ranking = [
    { totalScore: 120 },
    { totalScore: 80 },
    { totalScore: 40 },
  ];
  const badge = resolvePlayerRankBadge({ position: 1, totalScore: 120 }, ranking);
  assert(badge?.text === PLAYER_LEADING_BADGE, "expected isolated leader badge");
  assert(badge?.highlight === true, "expected highlight for leader");
}

function testTiedLeadership() {
  const ranking = [
    { totalScore: 100 },
    { totalScore: 100 },
    { totalScore: 50 },
  ];
  const leader = resolvePlayerRankBadge({ position: 1, totalScore: 100 }, ranking);
  const tiedSecond = resolvePlayerRankBadge({ position: 2, totalScore: 100 }, ranking);
  assert(leader?.text === PLAYER_TIED_LEADERSHIP_BADGE, "expected tied badge for 1st");
  assert(tiedSecond?.text === PLAYER_TIED_LEADERSHIP_BADGE, "expected tied badge for 2nd");
}

function testNonLeaderPositionBadge() {
  const ranking = [
    { totalScore: 120 },
    { totalScore: 80 },
    { totalScore: 40 },
  ];
  const badge = resolvePlayerRankBadge({ position: 2, totalScore: 80 }, ranking);
  assert(badge?.text === "🥈 Você está em 2º lugar!", "expected 2nd place badge");
  assert(badge?.highlight === true, "expected highlight for top 3");
}

testAllZeroScoresHidesBadge();
testIsolatedLeader();
testTiedLeadership();
testNonLeaderPositionBadge();

console.log("playerMicrocopy.test.ts: all tests passed");
