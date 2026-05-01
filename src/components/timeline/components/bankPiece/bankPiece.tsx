"use client";

import { useDraggable } from "@dnd-kit/react";
import type { Event, DragPayload } from "@/lib/types";
import { EventCard } from "../eventCard/eventCard";
import styles from "./bankPiece.module.css";

export function BankPiece({ event }: { event: Event }) {
  const { ref, isDragging } = useDraggable({
    id: `bank:${event.id}`,
    data: { origin: "bank", eventId: event.id } satisfies DragPayload,
  });
  return (
    <div ref={ref} className={styles.bankPiece}>
      <EventCard event={event} isDragging={isDragging} variant="bank" />
    </div>
  );
}
