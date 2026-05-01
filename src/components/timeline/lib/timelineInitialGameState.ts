import type { Event, GameState } from "@/lib/types";
import { AUTOPLACED_CHRONOLOGY_INDEX } from "@/lib/weave-config";
import type { InitialStoredResult } from "./timelineTypes";

export function createInitialGameState({
  events,
  initialBank,
  autoPlacedEventId,
  initialLockedForToday,
  initialStoredResult,
}: {
  events: Event[];
  initialBank: Event[];
  autoPlacedEventId: string | null;
  initialLockedForToday: boolean;
  initialStoredResult: InitialStoredResult | null;
}): GameState {
  if (!initialLockedForToday) {
    const placements = Array.from({ length: events.length }, () => null as string | null);
    if (
      autoPlacedEventId != null &&
      AUTOPLACED_CHRONOLOGY_INDEX >= 0 &&
      AUTOPLACED_CHRONOLOGY_INDEX < placements.length
    ) {
      placements[AUTOPLACED_CHRONOLOGY_INDEX] = autoPlacedEventId;
    }
    return {
      bank: initialBank,
      placements,
      misses: 0,
      startedAtMs: null,
      elapsedMs: 0,
    };
  }

  if (!initialStoredResult) {
    return {
      bank: initialBank,
      placements: Array.from({ length: events.length }, () => null),
      misses: 0,
      startedAtMs: null,
      elapsedMs: 0,
    };
  }

  const placedIds = new Set(
    initialStoredResult.placements.filter((id): id is string => typeof id === "string"),
  );

  return {
    bank: initialBank.filter((event) => !placedIds.has(event.id)),
    placements: initialStoredResult.placements,
    misses: initialStoredResult.misses,
    startedAtMs: null,
    elapsedMs: initialStoredResult.elapsedMs,
  };
}
