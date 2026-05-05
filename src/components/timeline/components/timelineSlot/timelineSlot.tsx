"use client";

import { useDroppable } from "@dnd-kit/react";
import type { Event, DropPayload } from "@/lib/types";
import { formatEventDate } from "@/lib/format-event-date";
import { useTranslations } from "next-intl";
import { EventCard } from "../eventCard/eventCard";
import styles from "./timelineSlot.module.css";

export function TimelineSlot({
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
  const t = useTranslations("timeline");
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
        <span className={styles.slotOf}>
          {t("slotOf", { count: slotCount })}
        </span>
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
