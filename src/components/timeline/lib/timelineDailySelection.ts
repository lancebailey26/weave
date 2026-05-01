import type { Event } from "@/lib/types";
import { DAILY_EVENT_SELECTION_COOKIE } from "./timelineConstants";
import { readCookie, writeCookie } from "./timelineCookies";

export function persistDailyEventSelection(dailyScopeKey: string, events: Event[]): void {
  const oneDaySeconds = 24 * 60 * 60;
  const existing = readCookie(DAILY_EVENT_SELECTION_COOKIE);
  let parsed: Record<string, string[]> = {};

  if (existing) {
    try {
      const next = JSON.parse(existing) as Record<string, unknown>;
      parsed = Object.fromEntries(
        Object.entries(next).filter(
          ([, value]) => Array.isArray(value) && value.every((id) => typeof id === "string"),
        ),
      ) as Record<string, string[]>;
    } catch {
      parsed = {};
    }
  }

  parsed[dailyScopeKey] = events.map((event) => event.id);
  writeCookie(DAILY_EVENT_SELECTION_COOKIE, JSON.stringify(parsed), oneDaySeconds);
}
