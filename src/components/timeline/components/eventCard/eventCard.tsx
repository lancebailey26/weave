"use client";

import type { Event as EventType } from "@/lib/types";
import { formatEventDate } from "@/lib/format-event-date";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("timeline");

  return (
    <div
      className={`${styles.eventCard} ${eventCardVariantClass(variant)} ${
        showDate ? styles.eventCardWithDate : ""
      }`}
      data-dragging={isDragging ? "true" : undefined}
      data-locked={locked ? "true" : undefined}
      data-loss-reveal={lossReveal ? "true" : undefined}
    >
      {!showDate && !locked && (
        <div className={styles.eventCardHead}>
          <span className={styles.eventTitle}>{event.title}</span>
          <span className={styles.eventCategory} data-category={event.category}>
            {t(`categories.${event.category}`)}
          </span>
        </div>
      )}

      {showDate && (
        <>
          <div className={styles.eventCardScroll}>
            <div className={styles.eventCardHead}>
              <span className={styles.eventTitle}>{event.title}</span>
              {!locked ? (
                <span className={styles.eventCategory} data-category={event.category}>
                  {t(`categories.${event.category}`)}
                </span>
              ) : null}
            </div>
            <span className={styles.eventDescription}>{event.description}</span>
          </div>
          <span className={styles.eventDate}>{formatEventDate(event)}</span>
        </>
      )}
    </div>
  );
}
