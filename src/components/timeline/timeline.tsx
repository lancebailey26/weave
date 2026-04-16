"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DragDropProvider,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";
import { Feedback } from "@dnd-kit/dom";
import type { Event, GameState, DragPayload, DropPayload } from "@/lib/types";
import { formatEventDate } from "@/lib/format-event-date";
import { getEasternDateKey, getNextEasternMidnightTimestamp } from "@/lib/shuffle";
import { sortChronological } from "@/lib/sort-events-chronological";
import { AUTOPLACED_CHRONOLOGY_INDEX, MAX_TRIES } from "@/lib/weave-config";
import { EventCard } from "./events";
import styles from "./timeline.module.css";
import Results from "../results/results";
const DAILY_LOCK_COOKIE = "weave_daily_lock_v1";
const DAILY_RESULT_COOKIE = "weave_daily_result_v1";
/** Keep in sync with `wrong-*-flash` animation duration in `timeline.module.css`. */
const WRONG_DROP_FLASH_MS = 880;

type StoredDailyResult = {
  date: string;
  placements: (string | null)[];
  triesLeft: number;
};

type InitialStoredResult = {
  placements: (string | null)[];
  triesLeft: number;
};

declare global {
  interface Window {
    weaveClearDailyLock?: (reload?: boolean) => void;
    timelyClearDailyLock?: (reload?: boolean) => void;
  }
}

function getTodayKey(): string {
  return getEasternDateKey();
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

function createInitialGameState({
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
      triesLeft: MAX_TRIES,
    };
  }

  if (!initialStoredResult) {
    return {
      bank: initialBank,
      placements: Array.from({ length: events.length }, () => null),
      triesLeft: 0,
    };
  }

  const placedIds = new Set(
    initialStoredResult.placements.filter((id): id is string => typeof id === "string"),
  );

  return {
    bank: initialBank.filter((event) => !placedIds.has(event.id)),
    placements: initialStoredResult.placements,
    triesLeft: initialStoredResult.triesLeft,
  };
}

function BankZone({ children }: { children: React.ReactNode }) {
  return (
    <aside className={styles.bank}>
      <div className={styles.bankList}>{children}</div>
    </aside>
  );
}

function BankPiece({ event }: { event: Event }) {
  const { ref, isDragging } = useDraggable({
    id: `bank:${event.id}`,
    data: { origin: "bank", eventId: event.id } satisfies DragPayload,
  });
  return (
    <div ref={ref} className={styles.bankPiece}>
      <EventCard event={event} isDragging={isDragging} />
    </div>
  );
}

function TimelineSlot({
  index,
  event,
  slotAnchorEvent,
  slotCount,
  playerHasPlacement,
  dropDisabled,
  wrongFlash,
  wrongWarmHint,
  lossReveal,
}: {
  index: number;
  event: Event | null;
  /** Chronological answer at this index; used to show a date on empty playable slots. */
  slotAnchorEvent: Event;
  slotCount: number;
  playerHasPlacement: boolean;
  dropDisabled: boolean;
  wrongFlash: boolean;
  wrongWarmHint: boolean;
  lossReveal: boolean;
}) {
  const { ref: dropRef, isDropTarget } = useDroppable({
    id: `slot:${index}`,
    data: { type: "timeline-slot", index } satisfies DropPayload,
    disabled: dropDisabled,
  });

  const showSuccessLock = playerHasPlacement;
  const showLossReveal = lossReveal && !showSuccessLock;

  return (
    <div
      ref={dropRef}
      className={styles.slot}
      data-active={isDropTarget ? "true" : undefined}
      data-locked={showSuccessLock ? "true" : undefined}
      data-loss-reveal={showLossReveal ? "true" : undefined}
      data-wrong={wrongFlash ? "true" : undefined}
      data-wrong-warm={wrongFlash && wrongWarmHint ? "true" : undefined}
    >
      <div className={styles.slotMeta}>
        <span className={styles.slotIndex}>{index + 1}</span>
        <span className={styles.slotOf}>of {slotCount}</span>
      </div>
      {event ? (
        <div className={styles.lockedPiece}>
          <EventCard
            event={event}
            variant="slot"
            showDate
            locked={showSuccessLock}
            lossReveal={showLossReveal}
          />
        </div>
      ) : (
        <div className={styles.slotEmpty}>
          {dropDisabled ? (
            "—"
          ) : (
            <span className={styles.slotEmptyDate}>
              {formatEventDate(slotAnchorEvent)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function getMsUntilNextEasternDay(now = new Date()): number {
  return Math.max(0, getNextEasternMidnightTimestamp(now) - now.getTime());
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function Timeline({
  events,
  initialBank,
  autoPlacedEventId,
  initialLockedForToday,
  initialStoredResult,
}: {
  events: Event[];
  /** Pre-shuffled on the server so SSR and hydration match (no `Math.random()` in client state). */
  initialBank: Event[];
  /** Chronological middle event id; starts locked in slot `AUTOPLACED_CHRONOLOGY_INDEX + 1`. */
  autoPlacedEventId: string | null;
  initialLockedForToday: boolean;
  initialStoredResult: InitialStoredResult | null;
}) {
  const [game, setGame] = useState<GameState>(() =>
    createInitialGameState({
      events,
      initialBank,
      autoPlacedEventId,
      initialLockedForToday,
      initialStoredResult,
    }),
  );
  const [resultsDismissed, setResultsDismissed] = useState(false);
  const [wrongFlash, setWrongFlash] = useState<{
    index: number;
    warmHint: boolean;
  } | null>(null);
  const [msUntilNextWeave, setMsUntilNextWeave] = useState(() => getMsUntilNextEasternDay());
  const wrongFlashTimerRef = useRef<number | null>(null);

  const { bank, placements, triesLeft } = game;

  const byId = useMemo(
    () => new Map(events.map((e) => [e.id, e] as const)),
    [events],
  );

  const answer = useMemo(() => sortChronological(events), [events]);

  const won = placements.every((id) => id != null);
  const lost = triesLeft <= 0 && !won;
  const isInteractionLocked = won || lost;

  const triggerWrongDropFeedback = useCallback((slotIndex: number, warmHint: boolean) => {
    setWrongFlash({ index: slotIndex, warmHint });
    if (wrongFlashTimerRef.current != null) {
      window.clearTimeout(wrongFlashTimerRef.current);
    }
    const durationMs = WRONG_DROP_FLASH_MS;
    wrongFlashTimerRef.current = window.setTimeout(() => {
      setWrongFlash(null);
      wrongFlashTimerRef.current = null;
    }, durationMs);
  }, []);

  useEffect(() => {
    if (!(won || lost)) return;

    const oneDaySeconds = 24 * 60 * 60;
    const todayKey = getTodayKey();
    writeCookie(DAILY_LOCK_COOKIE, todayKey, oneDaySeconds);
    writeCookie(
      DAILY_RESULT_COOKIE,
      JSON.stringify({
        date: todayKey,
        placements: game.placements,
        triesLeft: game.triesLeft,
      } satisfies StoredDailyResult),
      oneDaySeconds,
    );
  }, [won, lost, game.placements, game.triesLeft]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const clearDailyLock = (reload = true) => {
      deleteCookie(DAILY_LOCK_COOKIE);
      deleteCookie(DAILY_RESULT_COOKIE);
      if (reload) window.location.reload();
    };
    window.weaveClearDailyLock = clearDailyLock;
    // Backward-compatible alias for older local docs/tests.
    window.timelyClearDailyLock = clearDailyLock;

    return () => {
      delete window.weaveClearDailyLock;
      delete window.timelyClearDailyLock;
    };
  }, []);

  useEffect(() => {
    if (!(won || lost)) return;
    const nextResetTs = getNextEasternMidnightTimestamp();
    const timerId = window.setInterval(() => {
      setMsUntilNextWeave(Math.max(0, nextResetTs - Date.now()));
    }, 1000);
    return () => {
      window.clearInterval(timerId);
    };
  }, [won, lost]);

  useEffect(() => {
    return () => {
      if (wrongFlashTimerRef.current != null) {
        window.clearTimeout(wrongFlashTimerRef.current);
      }
    };
  }, []);

  const handleDragEnd = useCallback(
    (dragEvent: DragEndEvent) => {
      if (isInteractionLocked) return;
      if (dragEvent.canceled) return;

      const source = dragEvent.operation.source;
      const target = dragEvent.operation.target;
      if (!source?.data || !target?.data) return;

      const drag = source.data as DragPayload;
      const drop = target.data as DropPayload;

      if (drop.type !== "timeline-slot") return;
      if (drag.origin !== "bank") return;

      const to = drop.index;
      if (placements[to] != null) return;
      const expectedId = answer[to]?.id;
      const isWrongDrop = !expectedId || drag.eventId !== expectedId;
      const correctIndex = answer.findIndex((e) => e.id === drag.eventId);
      const withinOneSpot =
        isWrongDrop &&
        correctIndex >= 0 &&
        Math.abs(to - correctIndex) === 1;

      if (isWrongDrop) {
        triggerWrongDropFeedback(to, withinOneSpot);
      }

      setGame((g) => {
        const wonNow = g.placements.every((id) => id != null);
        const lostNow = g.triesLeft <= 0 && !wonNow;
        if (lostNow) return g;

        if (g.placements[to] != null) return g;

        if (isWrongDrop) {
          return { ...g, triesLeft: Math.max(0, g.triesLeft - 1) };
        }

        return {
          bank: g.bank.filter((e) => e.id !== drag.eventId),
          placements: g.placements.map((id, i) =>
            i === to ? drag.eventId : id,
          ),
          triesLeft: g.triesLeft,
        };
      });
    },
    [answer, isInteractionLocked, placements, triggerWrongDropFeedback],
  );

  return (
    <>
    {(won || lost) && !resultsDismissed && (
      <Results
        game={game}
        orderedEvents={answer}
        onClose={() => setResultsDismissed(true)}
      />
    )}
      <DragDropProvider
        onDragEnd={handleDragEnd}
        plugins={(defaults) => [
          ...defaults,
          Feedback.configure({ dropAnimation: null }),
        ]}
        sensors={[
          PointerSensor.configure({
            activationConstraints: () => undefined,
          }),
          KeyboardSensor,
        ]}
      >
        <div className={styles.board}>
          <BankZone>
            {(won || lost) && (
              <p className={styles.nextWeaveCountdown}>
                New Weave in <strong>{formatCountdown(msUntilNextWeave)}</strong>
              </p>
            )}
            {bank.length === 0 ? (
              <p className={styles.emptyBank}>
                {won ? "Timeline complete. Return tomorrow for a new Weave." : "No events left in the bank."}
              </p>
            ) : (
              lost
                ? <p className={styles.emptyBank}>You lost. Return tomorrow for a new Weave.</p>
                : <BankPiece event={bank[0]} />
            )}
          </BankZone>

          <section className={styles.timeline}>
            <div className={styles.slotList}>
              {placements.map((id, index) => (
                <TimelineSlot
                  key={index}
                  index={index}
                  slotAnchorEvent={answer[index]}
                  event={
                    lost
                      ? (answer[index] ?? null)
                      : id
                        ? (byId.get(id) ?? null)
                        : null
                  }
                  slotCount={placements.length}
                  playerHasPlacement={id != null}
                  dropDisabled={isInteractionLocked || id != null}
                  wrongFlash={wrongFlash?.index === index}
                  wrongWarmHint={wrongFlash?.warmHint === true}
                  lossReveal={lost}
                />
              ))}
              <div className={styles.tries}>
                Tries left: <strong>{triesLeft}</strong> / {MAX_TRIES}
              </div>
            </div>
          </section>
        </div>
      </DragDropProvider>
    </>
  );
}
