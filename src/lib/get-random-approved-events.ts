import "server-only";

import type { WithId, Document } from "mongodb";
import type { Event } from "@/lib/types";
import { getDb } from "@/lib/mongodb";
import { seededShuffle } from "@/lib/shuffle";
import type { WeaveCategory } from "@/lib/weave-categories";
import type { AppLocale } from "@/lib/i18n-locales";

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (value == null) return fallback;
  return String(value);
}

function asLocalizedString(
  value: unknown,
  locale: AppLocale,
  fallback = "",
): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const localized = value as Record<string, unknown>;
    const localeValue = localized[locale];
    if (typeof localeValue === "string") return localeValue;
    const englishValue = localized.en;
    if (typeof englishValue === "string") return englishValue;
  }
  if (value instanceof Date) return value.toISOString();
  if (value == null) return fallback;
  return String(value);
}

function mapDocToEvent(doc: WithId<Document>, locale: AppLocale): Event {
  const category =
    doc.category === "game" ||
    doc.category === "history" ||
    doc.category === "internet" ||
    doc.category === "movie" ||
    doc.category === "music" ||
    doc.category === "politics" ||
    doc.category === "science" ||
    doc.category === "sports" ||
    doc.category === "tech" ||
    doc.category === "tv" ||
    doc.category === "world"
      ? doc.category
      : "world";

  return {
    id: typeof doc.id === "string" ? doc.id : String(doc._id),
    title: asLocalizedString(doc.title, locale, "Untitled event"),
    description: asLocalizedString(doc.description, locale),
    date: asString(doc.date),
    precision:
      doc.precision === "day" ||
      doc.precision === "month" ||
      doc.precision === "year"
        ? doc.precision
        : "day",
    category,
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
  locale: AppLocale,
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

  const categoryEvents = seededShuffle(
    rows.map((row) => mapDocToEvent(row, locale)),
    `events:${dayKey}:${category ?? "all"}`,
  );
  if (!category || categoryEvents.length >= size) {
    return categoryEvents.slice(0, size);
  }

  const remainingRows = await db
    .collection<WithId<Document>>("events")
    .find({ ...baseQuery, category: { $ne: category } })
    .sort({ _id: 1 })
    .toArray();
  const remainingEvents = seededShuffle(
    remainingRows.map((row) => mapDocToEvent(row, locale)),
    `events:${dayKey}:fallback:${category}`,
  );

  return [...categoryEvents, ...remainingEvents].slice(0, size);
}

export async function getApprovedEventsByIds(
  ids: readonly string[],
  locale: AppLocale,
): Promise<Event[]> {
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
    .map((row) => mapDocToEvent(row, locale));
}
