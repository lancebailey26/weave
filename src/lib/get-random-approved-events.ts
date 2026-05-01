import "server-only";

import type { WithId, Document } from "mongodb";
import type { Event } from "@/lib/types";
import { getDb } from "@/lib/mongodb";
import { seededShuffle } from "@/lib/shuffle";
import type { WeaveCategory } from "@/lib/weave-categories";

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
      doc.category === "culture" ||
      doc.category === "game" ||
      doc.category === "history" ||
      doc.category === "internet" ||
      doc.category === "movie" ||
      doc.category === "music" ||
      doc.category === "politics" ||
      doc.category === "product" ||
      doc.category === "science" ||
      doc.category === "sports" ||
      doc.category === "tech" ||
      doc.category === "tv" ||
      doc.category === "world"
        ? doc.category
        : "world",
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
  category?: WeaveCategory,
): Promise<Event[]> {
  const db = await getDb();
  const baseQuery: Record<string, unknown> = { status: "approved" };
  const categoryQuery = category ? { ...baseQuery, category } : baseQuery;
  const rows = await db
    .collection<WithId<Document>>("events")
    .find(categoryQuery)
    .sort({ _id: 1 })
    .toArray();

  const categoryEvents = seededShuffle(rows.map(mapDocToEvent), `events:${dayKey}:${category ?? "all"}`);
  if (!category || categoryEvents.length >= size) {
    return categoryEvents.slice(0, size);
  }

  const remainingRows = await db
    .collection<WithId<Document>>("events")
    .find({ ...baseQuery, category: { $ne: category } })
    .sort({ _id: 1 })
    .toArray();
  const remainingEvents = seededShuffle(
    remainingRows.map(mapDocToEvent),
    `events:${dayKey}:fallback:${category}`,
  );

  return [...categoryEvents, ...remainingEvents].slice(0, size);
}

export async function getApprovedEventsByIds(ids: readonly string[]): Promise<Event[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  const rows = await db
    .collection<WithId<Document>>("events")
    .find({ status: "approved", id: { $in: [...ids] } })
    .toArray();

  const byId = new Map(rows.map((row) => [typeof row.id === "string" ? row.id : String(row._id), row]));
  return ids
    .map((id) => byId.get(id))
    .filter((row): row is WithId<Document> => row != null)
    .map(mapDocToEvent);
}
