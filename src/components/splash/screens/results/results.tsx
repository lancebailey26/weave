"use client";

import type { Event, GameState } from "@/lib/types";
import { formatEventDate } from "@/lib/format-event-date";
import {
  ALL_WEAVE_CATEGORY,
  getWeaveCategoryLabel,
  parseWeaveCategoryFilter,
} from "@/lib/weave-categories";
import { useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";
import styles from "./results.module.css";

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function Results({
  game,
  orderedEvents,
}: {
  game: GameState;
  orderedEvents: Event[];
}) {
  const misses = game.misses;
  const solvedLine = `Solved in ${formatElapsed(game.elapsedMs)} with ${misses} misses.`;
  const searchParams = useSearchParams();
  const category = parseWeaveCategoryFilter(searchParams.get("category") ?? undefined);
  const weaveTitle =
    category === ALL_WEAVE_CATEGORY ? "Weave" : `Weave (${getWeaveCategoryLabel(category)})`;

  async function handleCopyResults() {
    const shareText = [
      `${weaveTitle} - ${solvedLine}`,
      window.location.href,
    ].join("\n");
    track("user copied results");
    await navigator.clipboard.writeText(shareText);
  }

  return (
    <>
      <div className={styles.resultsContent}>
        <p className={styles.summary}>{solvedLine}</p>
        <ol className={styles.placementList}>
          {orderedEvents.map((event, index) => (
            <li key={index}>
              <div className={styles.eventInfo}>
                <strong>{event.title}</strong>
                <small>{formatEventDate(event)}</small>
              </div>
              <strong>{game.placements[index] ? "✓" : "❌"}</strong>
            </li>
          ))}
        </ol>

        <button type="button" className={styles.copyButton} onClick={handleCopyResults}>
          Copy Results
        </button>
      </div>
    </>
  );
}
