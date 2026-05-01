"use client";

import type { Event as EventType } from "@/lib/types";
import { formatEventDate } from "@/lib/format-event-date";
import { getWeaveCategoryLabel } from "@/lib/weave-categories";
import styles from "./eventCard.module.css";

function eventCardVariantClass(
  variant: "default" | "slot" | "bank",
): string {
  if (variant === "slot") return styles.eventCardSlot;
  if (variant === "bank") return `${styles.eventCardDefault} ${styles.eventCardBank}`;
  return styles.eventCardDefault;
}

export function EventCard({
  event,
  isDragging,
  variant = "default",
  showDate = false,
  locked = false,
  lossReveal = false,
}: {
  event: EventType;
  isDragging?: boolean;
  variant?: "default" | "slot" | "bank";
  showDate?: boolean;
  locked?: boolean;
  lossReveal?: boolean;
}) {
  return (
    <div
      className={`${styles.eventCard} ${eventCardVariantClass(variant)} ${
        showDate ? styles.eventCardWithDate : ""
      }`}
      data-dragging={isDragging ? "true" : undefined}
      data-locked={locked ? "true" : undefined}
      data-loss-reveal={lossReveal ? "true" : undefined}
    >
      {!locked && (
        <>
          <span className={styles.eventTitle}>{event.title}</span>
          <span className={styles.eventCategory} data-category={event.category}>
            {getWeaveCategoryLabel(event.category)}
          </span>
        </>
      )}

      {showDate && (
        <>
          <span className={styles.eventDescription}>{event.description}</span>
          <span className={styles.eventDate}>{formatEventDate(event)}</span>
        </>
      )}
    </div>
  );
}
