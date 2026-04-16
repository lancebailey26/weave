import { getDailyApprovedEvents } from "@/lib/get-random-approved-events";
import { sortChronological } from "@/lib/sort-events-chronological";
import { getEasternDateKey, seededShuffle } from "@/lib/shuffle";
import {
  AUTOPLACED_CHRONOLOGY_INDEX,
  DAILY_WEAVE_EVENT_COUNT,
  MAX_TRIES,
} from "@/lib/weave-config";
import styles from "./page.module.css";
import Timeline from "@/components/timeline/timeline";
import AppHeader from "@/components/appHeader/appHeader";
import { cookies } from "next/headers";
const DAILY_LOCK_COOKIE = "weave_daily_lock_v1";
const DAILY_RESULT_COOKIE = "weave_daily_result_v1";

type InitialStoredResult = {
  placements: (string | null)[];
  triesLeft: number;
};

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
      triesLeft?: unknown;
    };
    if (parsed.date !== dayKey) return null;
    if (!Array.isArray(parsed.placements) || parsed.placements.length !== expectedLength) {
      return null;
    }
    if (typeof parsed.triesLeft !== "number") return null;
    if (parsed.placements.some((value) => value !== null && typeof value !== "string")) {
      return null;
    }
    return {
      placements: parsed.placements,
      triesLeft: Math.max(0, Math.min(MAX_TRIES, Math.floor(parsed.triesLeft))),
    };
  } catch {
    return null;
  }
}

export default async function Home() {
  const dayKey = getEasternDateKey();
  const events = await getDailyApprovedEvents(DAILY_WEAVE_EVENT_COUNT, dayKey);
  const answer = sortChronological(events);
  const autoPlacedEventId = answer[AUTOPLACED_CHRONOLOGY_INDEX]?.id ?? null;
  const bankPool =
    autoPlacedEventId != null
      ? events.filter((e) => e.id !== autoPlacedEventId)
      : events;
  const initialBank = seededShuffle(bankPool, `bank:${dayKey}`);
  const cookieStore = await cookies();
  const lockCookie = cookieStore.get(DAILY_LOCK_COOKIE)?.value;
  const initialLockedForToday = lockCookie === dayKey;
  const initialStoredResult = parseStoredResultForDay(
    cookieStore.get(DAILY_RESULT_COOKIE)?.value,
    dayKey,
    events.length,
  );

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <Timeline
          key={initialBank.map((e) => e.id).join("-")}
          events={events}
          initialBank={initialBank}
          autoPlacedEventId={autoPlacedEventId}
          initialLockedForToday={initialLockedForToday}
          initialStoredResult={initialStoredResult}
        />
      </main>
    </div>
  );
}
