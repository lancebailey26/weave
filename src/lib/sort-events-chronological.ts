import type { Event } from "@/lib/types";

export function sortChronological(events: readonly Event[]): Event[] {
  return [...events].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
}
