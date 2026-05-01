import { getNextEasternMidnightTimestamp } from "@/lib/shuffle";

export function getMsUntilNextEasternDay(now = new Date()): number {
  return Math.max(0, getNextEasternMidnightTimestamp(now) - now.getTime());
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
