"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import {
  DragDropProvider,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/react";
import { Feedback } from "@dnd-kit/dom";
import type { Event, GameState, DragPayload, DropPayload } from "@/lib/types";
import { sortChronological } from "@/lib/sort-events-chronological";
import {
  ALL_WEAVE_CATEGORY,
  parseWeaveCategoryFilter,
} from "@/lib/weave-categories";
import Results from "../splash/screens/results/results";
import Splash from "../splash/splash";
import { BankPiece } from "./components/bankPiece/bankPiece";
import { BankZone } from "./components/bankZone/bankZone";
import bankZoneStyles from "./components/bankZone/bankZone.module.css";
import { TimelineSlot } from "./components/timelineSlot/timelineSlot";
import styles from "./timeline.module.css";
import {
  DAILY_SIGNIN_DISMISSED_COOKIE,
} from "./lib/timelineConstants";
import { readCookie, writeCookie } from "./lib/timelineCookies";
import { formatCountdown } from "./lib/timelineCountdown";
import { formatElapsed } from "./lib/timelineFormatting";
import { applyDropResult, markGameStarted } from "./lib/timelineGameActions";
import {
  useAutoRevealResults,
  useCountdownReady,
  useExposeDailyLockReset,
  useNextWeaveCountdown,
  useNowTicker,
  usePersistDailyResult,
  usePersistDailySelection,
  useWrongDropFlash,
} from "./lib/timelineHooks";
import { createInitialGameState } from "./lib/timelineInitialGameState";
import type { InitialStoredResult } from "./lib/timelineTypes";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
export default function Timeline({
  events,
  initialBank,
  autoPlacedEventId,
  initialLockedForToday,
  initialStoredResult,
  dailyScopeKey,
}: {
  events: Event[];
  initialBank: Event[];
  autoPlacedEventId: string | null;
  initialLockedForToday: boolean;
  initialStoredResult: InitialStoredResult | null;
  dailyScopeKey: string;
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
  const [showSignInBanner, setShowSignInBanner] = useState(() => {
    const dismissedForDay = readCookie(DAILY_SIGNIN_DISMISSED_COOKIE);
    return dismissedForDay !== dailyScopeKey;
  });
  const clerk = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const [resultsDismissed, setResultsDismissed] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { wrongFlash, triggerWrongDropFeedback } = useWrongDropFlash();

  const { bank, placements, misses } = game;

  const byId = useMemo(
    () => new Map(events.map((e) => [e.id, e] as const)),
    [events],
  );
  const t = useTranslations("timeline");
  const categoryLabel = useMemo(() => {
    const rawCategory = searchParams.get("category");
    if (!rawCategory) return "";
    const category = parseWeaveCategoryFilter(rawCategory);
    return ` - ${t(`categories.${category}`)}`;
  }, [searchParams, t]);
  const selectedCategory = useMemo(
    () => parseWeaveCategoryFilter(searchParams.get("category") ?? undefined),
    [searchParams],
  );
  const nextWeaveLabel = useMemo(
    () =>
      selectedCategory === ALL_WEAVE_CATEGORY
        ? t("nextWeaveIn")
        : t("nextCategoryWeaveIn", {
            category: t(`categories.${selectedCategory}`),
          }),
    [selectedCategory, t],
  );

  const answer = useMemo(() => sortChronological(events), [events]);

  const won = placements.every((id) => id != null);
  const isInteractionLocked = won;
  const hasEnded = won;
  const isEnding = hasEnded && !showResults && !initialLockedForToday;
  const countdownReady = useCountdownReady();
  const msUntilNextWeave = useNextWeaveCountdown(won);
  const nowMs = useNowTicker(game.startedAtMs, won);
  const elapsedMs =
    won || game.startedAtMs == null ? game.elapsedMs : game.elapsedMs + (nowMs - game.startedAtMs);

  const dismissSignInBanner = useCallback(() => {
    const oneDaySeconds = 24 * 60 * 60;
    writeCookie(DAILY_SIGNIN_DISMISSED_COOKIE, dailyScopeKey, oneDaySeconds);
    setShowSignInBanner(false);
  }, [dailyScopeKey]);

  usePersistDailySelection(dailyScopeKey, events);
  usePersistDailyResult({ won, game, dailyScopeKey });
  useAutoRevealResults({
    hasEnded,
    initialLockedForToday,
    onReveal: () => setShowResults(true),
  });
  useExposeDailyLockReset();

  const handleDragStart = useCallback((dragEvent: DragStartEvent) => {
    const source = dragEvent.operation.source;
    if (!source?.data) return;
    const drag = source.data as DragPayload;
    if (drag.origin !== "bank") return;
    setGame((g) => markGameStarted(g, Date.now()));
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

      setGame((g) => {
        const { nextGame, isWrongDrop, warmHint } = applyDropResult({
          game: g,
          answer,
          dropIndex: to,
          draggedEventId: drag.eventId,
          nowMs: Date.now(),
        });
        if (isWrongDrop) {
          triggerWrongDropFeedback(to, warmHint);
        }
        return nextGame;
      });
    },
    [answer, isInteractionLocked, placements, triggerWrongDropFeedback],
  );

  return (
    <>
      {isLoaded && !isSignedIn && showSignInBanner ? (
        <div
          className={styles.signInBanner}
          role="status"
          aria-live="polite"
          aria-label={t("signInNudgeAria")}
        >
          <button
            type="button"
            className={styles.signInBannerAction}
            onClick={() => {
              void clerk.openSignIn();
              dismissSignInBanner();
            }}
          >
            {t("signInNudge")}
          </button>
          <button
            type="button"
            className={styles.signInBannerDismiss}
            aria-label={t("signInNudgeDismiss")}
            onClick={(event) => {
              event.stopPropagation();
              dismissSignInBanner();
            }}
          >
            ×
          </button>
        </div>
      ) : null}
      {showResults && hasEnded && !resultsDismissed && (
        <Splash
          onClose={() => setResultsDismissed(true)}
          screen={<Results game={game} orderedEvents={answer} />}
        />
      )}
      <DragDropProvider
        onDragStart={handleDragStart}
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
        <div className={`${styles.board} ${isEnding ? styles.boardEndgame : ""}`}>
          <section className={styles.boardBand}>
            <BankZone title={t("bank")}>
              {won && (
                <p className={bankZoneStyles.nextWeaveCountdown}>
                  {nextWeaveLabel}{" "}
                  <strong>
                    {countdownReady ? formatCountdown(msUntilNextWeave) : "--:--:--"}
                  </strong>
                </p>
              )}
              {bank.length === 0 ? (
                <button
                  type="button"
                  className={styles.viewResultsButton}
                  onClick={() => {
                    setResultsDismissed(false);
                    setShowResults(true);
                  }}
                >
                  {t("viewResults")}
                </button>
              ) : (
                <BankPiece event={bank[0]} />
              )}
            </BankZone>
          </section>
          <section className={`${styles.boardBand} ${styles.timeline}`}>
            <p className={styles.timelineTitle}>
              {t("title")}
              {categoryLabel}
            </p>
            <div className={styles.slotList}>
              {placements.map((id, index) => (
                <TimelineSlot
                  key={index}
                  index={index}
                  slotAnchorEvent={answer[index]}
                  event={
                    id
                      ? (byId.get(id) ?? null)
                      : null
                  }
                  slotCount={placements.length}
                  playerHasPlacement={id != null}
                  dropDisabled={isInteractionLocked || id != null}
                  wrongFlash={wrongFlash?.index === index}
                  wrongWarmHint={wrongFlash?.warmHint === true}
                  lossReveal={false}
                />
              ))}
              <div className={styles.tries}>
                {t("misses")}: <strong>{misses}</strong> - {t("time")}: <strong>{formatElapsed(elapsedMs)}</strong>
              </div>
            </div>
          </section>
        </div>
      </DragDropProvider>
    </>
  );
}
