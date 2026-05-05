import {
  getApprovedEventsByIds,
  getDailyApprovedEvents,
} from "@/lib/get-random-approved-events";
import { sortChronological } from "@/lib/sort-events-chronological";
import { getEasternDateKey, seededShuffle } from "@/lib/shuffle";
import {
  AUTOPLACED_CHRONOLOGY_INDEX,
  DAILY_WEAVE_EVENT_COUNT,
  MAX_TRIES,
} from "@/lib/weave-config";
import styles from "./page.module.css";
import Timeline from "@/components/timeline/timeline";
import {
  DAILY_EVENT_SELECTION_COOKIE,
  DAILY_LOCK_COOKIE,
  DAILY_RESULT_COOKIE,
} from "@/components/timeline/lib/timelineConstants";
import type { InitialStoredResult } from "@/components/timeline/lib/timelineTypes";
import AppHeader from "@/components/appHeader/appHeader";
import { cookies } from "next/headers";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  ALL_WEAVE_CATEGORY,
  WEAVE_CATEGORY_METADATA_KEY,
  parseWeaveCategoryFilterFromUnknown,
  parseWeaveCategoryFilter,
  type WeaveCategoryFilter,
} from "@/lib/weave-categories";
import { getLocale } from "next-intl/server";
import { DEFAULT_LOCALE, parseLocaleFromUnknown } from "@/lib/i18n-locales";

function parseStoredResultForDay(
  raw: string | undefined,
  dayKey: string,
  expectedLength: number,
): InitialStoredResult | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      date?: unknown;
      placements?: unknown;
      misses?: unknown;
      attempts?: unknown;
      elapsedMs?: unknown;
      triesLeft?: unknown;
    };
    if (parsed.date !== dayKey) return null;
    if (!Array.isArray(parsed.placements) || parsed.placements.length !== expectedLength) {
      return null;
    }
    if (parsed.placements.some((value) => value !== null && typeof value !== "string")) {
      return null;
    }
    const misses =
      typeof parsed.misses === "number"
        ? Math.max(0, Math.floor(parsed.misses))
        : typeof parsed.attempts === "number"
          ? Math.max(0, Math.floor(parsed.attempts))
          : typeof parsed.triesLeft === "number"
            ? Math.max(0, MAX_TRIES - Math.floor(parsed.triesLeft))
            : 0;
    const elapsedMs =
      typeof parsed.elapsedMs === "number" ? Math.max(0, Math.floor(parsed.elapsedMs)) : 0;
    return {
      placements: parsed.placements,
      misses,
      elapsedMs,
    };
  } catch {
    return null;
  }
}

function parseDailyEventSelections(raw: string | undefined): Record<string, string[]> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const entries = Object.entries(parsed).filter(
      ([, value]) => Array.isArray(value) && value.every((id) => typeof id === "string"),
    );
    return Object.fromEntries(entries) as Record<string, string[]>;
  } catch {
    return {};
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams?:
    | { category?: string | string[] }
    | Promise<{ category?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const locale = parseLocaleFromUnknown(await getLocale()) ?? DEFAULT_LOCALE;
  const hasExplicitCategoryInQuery =
    resolvedSearchParams?.category != null &&
    (!Array.isArray(resolvedSearchParams.category) ||
      resolvedSearchParams.category[0] != null);
  const { userId } = await auth();
  let userDefaultCategory: WeaveCategoryFilter = ALL_WEAVE_CATEGORY;
  if (userId && !hasExplicitCategoryInQuery) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    userDefaultCategory = parseWeaveCategoryFilterFromUnknown(
      user.publicMetadata?.[WEAVE_CATEGORY_METADATA_KEY],
    );
  }
  const dayKey = getEasternDateKey();
  const categoryFilter = hasExplicitCategoryInQuery
    ? parseWeaveCategoryFilter(resolvedSearchParams?.category)
    : userDefaultCategory;
  const selectedCategory =
    categoryFilter === ALL_WEAVE_CATEGORY ? undefined : categoryFilter;
  const storageDayKey = `${dayKey}:${categoryFilter}`;
  const cookieStore = await cookies();
  const eventSelectionsByScope = parseDailyEventSelections(
    cookieStore.get(DAILY_EVENT_SELECTION_COOKIE)?.value,
  );
  const savedEventIds = eventSelectionsByScope[storageDayKey];
  const savedEvents =
    savedEventIds && savedEventIds.length === DAILY_WEAVE_EVENT_COUNT
      ? await getApprovedEventsByIds(savedEventIds, locale)
      : [];
  const events =
    savedEvents.length === DAILY_WEAVE_EVENT_COUNT
      ? savedEvents
      : await getDailyApprovedEvents(
          DAILY_WEAVE_EVENT_COUNT,
          dayKey,
          locale,
          selectedCategory,
        );
  const answer = sortChronological(events);
  const autoPlacedEventId = answer[AUTOPLACED_CHRONOLOGY_INDEX]?.id ?? null;
  const bankPool =
    autoPlacedEventId != null
      ? events.filter((e) => e.id !== autoPlacedEventId)
      : events;
  const initialBank = seededShuffle(bankPool, `bank:${dayKey}`);
  const lockCookie = cookieStore.get(DAILY_LOCK_COOKIE)?.value;
  const initialStoredResult = parseStoredResultForDay(
    cookieStore.get(DAILY_RESULT_COOKIE)?.value,
    storageDayKey,
    events.length,
  );
  const storedSolved =
    initialStoredResult != null &&
    initialStoredResult.placements.every((placement) => placement != null);
  const initialLockedForToday = lockCookie === storageDayKey && storedSolved;

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <Timeline
          key={`${storageDayKey}:${initialBank.map((e) => e.id).join("-")}`}
          events={events}
          initialBank={initialBank}
          autoPlacedEventId={autoPlacedEventId}
          initialLockedForToday={initialLockedForToday}
          initialStoredResult={initialStoredResult}
          dailyScopeKey={storageDayKey}
        />
      </main>
    </div>
  );
}
