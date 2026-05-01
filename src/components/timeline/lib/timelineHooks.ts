import { useCallback, useEffect, useRef, useState } from "react";
import type { Event, GameState } from "@/lib/types";
import {
  DAILY_EVENT_SELECTION_COOKIE,
  DAILY_LOCK_COOKIE,
  DAILY_RESULT_COOKIE,
  DAILY_SIGNIN_DISMISSED_COOKIE,
  ENDGAME_REVEAL_DELAY_MS,
  WRONG_DROP_FLASH_MS,
} from "./timelineConstants";
import { deleteCookie, writeCookie } from "./timelineCookies";
import { getMsUntilNextEasternDay } from "./timelineCountdown";
import { persistDailyEventSelection } from "./timelineDailySelection";
import type { StoredDailyResult } from "./timelineTypes";

export function useWrongDropFlash() {
  const [wrongFlash, setWrongFlash] = useState<{
    index: number;
    warmHint: boolean;
  } | null>(null);
  const wrongFlashTimerRef = useRef<number | null>(null);

  const triggerWrongDropFeedback = useCallback((slotIndex: number, warmHint: boolean) => {
    setWrongFlash({ index: slotIndex, warmHint });
    if (wrongFlashTimerRef.current != null) {
      window.clearTimeout(wrongFlashTimerRef.current);
    }
    wrongFlashTimerRef.current = window.setTimeout(() => {
      setWrongFlash(null);
      wrongFlashTimerRef.current = null;
    }, WRONG_DROP_FLASH_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (wrongFlashTimerRef.current != null) {
        window.clearTimeout(wrongFlashTimerRef.current);
      }
    };
  }, []);

  return { wrongFlash, triggerWrongDropFeedback };
}

export function usePersistDailySelection(dailyScopeKey: string, events: Event[]): void {
  useEffect(() => {
    persistDailyEventSelection(dailyScopeKey, events);
  }, [dailyScopeKey, events]);
}

export function usePersistDailyResult({
  won,
  game,
  dailyScopeKey,
}: {
  won: boolean;
  game: GameState;
  dailyScopeKey: string;
}): void {
  useEffect(() => {
    if (!won) return;

    const oneDaySeconds = 24 * 60 * 60;
    writeCookie(DAILY_LOCK_COOKIE, dailyScopeKey, oneDaySeconds);
    writeCookie(
      DAILY_RESULT_COOKIE,
      JSON.stringify({
        date: dailyScopeKey,
        placements: game.placements,
        misses: game.misses,
        elapsedMs: game.elapsedMs,
      } satisfies StoredDailyResult),
      oneDaySeconds,
    );
  }, [won, game.misses, game.elapsedMs, game.placements, dailyScopeKey]);
}

export function useAutoRevealResults({
  hasEnded,
  initialLockedForToday,
  onReveal,
}: {
  hasEnded: boolean;
  initialLockedForToday: boolean;
  onReveal: () => void;
}): void {
  useEffect(() => {
    if (!hasEnded || initialLockedForToday) return;

    const timerId = window.setTimeout(() => {
      onReveal();
    }, ENDGAME_REVEAL_DELAY_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [hasEnded, initialLockedForToday, onReveal]);
}

export function useCountdownReady(): boolean {
  const [countdownReady, setCountdownReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setCountdownReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return countdownReady;
}

export function useExposeDailyLockReset(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const clearDailyLock = (reload = true) => {
      deleteCookie(DAILY_EVENT_SELECTION_COOKIE);
      deleteCookie(DAILY_LOCK_COOKIE);
      deleteCookie(DAILY_RESULT_COOKIE);
      deleteCookie(DAILY_SIGNIN_DISMISSED_COOKIE);
      if (reload) window.location.reload();
    };

    window.weaveClearDailyLock = clearDailyLock;
    window.timelyClearDailyLock = clearDailyLock;

    return () => {
      delete window.weaveClearDailyLock;
      delete window.timelyClearDailyLock;
    };
  }, []);
}

export function useNextWeaveCountdown(won: boolean): number {
  const [msUntilNextWeave, setMsUntilNextWeave] = useState(0);

  useEffect(() => {
    if (!won) return;
    const tick = () => setMsUntilNextWeave(getMsUntilNextEasternDay());
    tick();
    const timerId = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(timerId);
    };
  }, [won]);

  return msUntilNextWeave;
}

export function useNowTicker(startedAtMs: number | null, won: boolean): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (startedAtMs == null || won) return;
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 250);
    return () => {
      window.clearInterval(timerId);
    };
  }, [startedAtMs, won]);

  return nowMs;
}
