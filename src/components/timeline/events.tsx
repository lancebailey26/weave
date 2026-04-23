"use client";

import type { Event as EventType } from "@/lib/types";
import { formatEventDate } from "@/lib/format-event-date";
import styles from "./timeline.module.css";

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
  variant?: "default" | "slot";
  showDate?: boolean;
  locked?: boolean;
  lossReveal?: boolean;
}) {
  return (
    <div
      className={`${styles.eventCard} ${
        variant === "slot" ? styles.eventCardSlot : styles.eventCardDefault
      } ${showDate ? styles.eventCardWithDate : ""}`}
      data-dragging={isDragging ? "true" : undefined}
      data-locked={locked ? "true" : undefined}
      data-loss-reveal={lossReveal ? "true" : undefined}
    >
      {!locked && <span className={styles.eventTitle}>{event.title}</span>}

      {showDate && (
        <>
          <span className={styles.eventDescription}>{event.description}</span>
          <span className={styles.eventDate}>{formatEventDate(event)}</span>
        </>
      )}
    </div>
  );
}
