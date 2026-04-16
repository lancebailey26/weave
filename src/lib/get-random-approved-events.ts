import "server-only";

import type { WithId, Document } from "mongodb";
import type { Event } from "@/lib/types";
import { getDb } from "@/lib/mongodb";
import { seededShuffle } from "@/lib/shuffle";

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (value == null) return fallback;
  return String(value);
}

function mapDocToEvent(doc: WithId<Document>): Event {
  return {
    id: typeof doc.id === "string" ? doc.id : String(doc._id),
    title: asString(doc.title, "Untitled event"),
    description: asString(doc.description),
    date: asString(doc.date),
    precision:
      doc.precision === "day" ||
      doc.precision === "month" ||
      doc.precision === "year"
        ? doc.precision
        : "day",
    category:
      doc.category === "tech" ||
      doc.category === "movie" ||
      doc.category === "music" ||
      doc.category === "tv" ||
      doc.category === "world" ||
      doc.category === "product" ||
      doc.category === "game" ||
      doc.category === "internet" ||
      doc.category === "other"
        ? doc.category
        : "other",
    createdAt: asString(doc.createdAt),
    submittedBy: asString(doc.submittedBy),
    status:
      doc.status === "approved" || doc.status === "needs_review"
        ? doc.status
        : undefined,
  };
}

/** Deterministic daily approved events for the game / API. */
export async function getDailyApprovedEvents(
  size: number,
  dayKey: string,
): Promise<Event[]> {
  const db = await getDb();
  const rows = await db
    .collection<WithId<Document>>("events")
    .find({ status: "approved" })
    .sort({ _id: 1 })
    .toArray();

  const events = rows.map(mapDocToEvent);
  return seededShuffle(events, `events:${dayKey}`).slice(0, size);
}
