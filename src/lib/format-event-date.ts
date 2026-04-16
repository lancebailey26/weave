import type { Event } from "@/lib/types";

/**
 * Calendar `Event.date` (YYYY-MM-DD) → prose like "December 19, 1997".
 * Uses UTC so the calendar day matches the stored string across time zones.
 */
export function formatEventDate(event: Event): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(event.date.trim());
  if (!m) return event.date;

  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const utc = Date.UTC(y, mo, d, 12, 0, 0, 0);
  const dt = new Date(utc);

  const precision = event.precision ?? "day";

  if (precision === "year") {
    return dt.toLocaleDateString("en-US", {
      year: "numeric",
      timeZone: "UTC",
    });
  }

  if (precision === "month") {
    return dt.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  return dt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
