import type { Event, GameState } from "@/lib/types";

export function markGameStarted(game: GameState, nowMs: number): GameState {
  if (game.startedAtMs != null) return game;
  return { ...game, startedAtMs: nowMs };
}

export function applyDropResult({
  game,
  answer,
  dropIndex,
  draggedEventId,
  nowMs,
}: {
  game: GameState;
  answer: Event[];
  dropIndex: number;
  draggedEventId: string;
  nowMs: number;
}): { nextGame: GameState; isWrongDrop: boolean; warmHint: boolean } {
  const wonNow = game.placements.every((id) => id != null);
  if (wonNow) {
    return { nextGame: game, isWrongDrop: false, warmHint: false };
  }

  if (game.placements[dropIndex] != null) {
    return { nextGame: game, isWrongDrop: false, warmHint: false };
  }

  const expectedId = answer[dropIndex]?.id;
  const isWrongDrop = !expectedId || draggedEventId !== expectedId;
  const correctIndex = answer.findIndex((event) => event.id === draggedEventId);
  const warmHint = isWrongDrop && correctIndex >= 0 && Math.abs(dropIndex - correctIndex) === 1;

  if (isWrongDrop) {
    return {
      nextGame: {
        ...game,
        misses: game.misses + 1,
      },
      isWrongDrop: true,
      warmHint,
    };
  }

  const nextPlacements = game.placements.map((id, index) => (index === dropIndex ? draggedEventId : id));
  const solvedNow = nextPlacements.every((id) => id != null);
  const completedElapsedMs =
    solvedNow && game.startedAtMs != null ? game.elapsedMs + (nowMs - game.startedAtMs) : game.elapsedMs;

  return {
    nextGame: {
      bank: game.bank.filter((event) => event.id !== draggedEventId),
      placements: nextPlacements,
      misses: game.misses,
      startedAtMs: solvedNow ? null : game.startedAtMs,
      elapsedMs: completedElapsedMs,
    },
    isWrongDrop: false,
    warmHint: false,
  };
}
