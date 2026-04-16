'use client';

import type { Event, GameState } from "@/lib/types";
import styles from "./results.module.css";
import { formatEventDate } from "@/lib/format-event-date";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
export default function Results({
  game,
  orderedEvents,
  onClose,
}: {
  game: GameState;
  orderedEvents: Event[];
  onClose: () => void;
}) {
  const placedCount = game.placements.filter((id) => id != null).length;
  const totalCount = game.placements.length;
  const won = placedCount === totalCount;
  const lost = game.triesLeft <= 0 && !won;
  const emojiLine = game.placements
    .map((id, index) =>
      id && id === orderedEvents[index]?.id ? "🟩" : "🟥",
    )
    .join("");

  async function handleCopyResults() {
    const header = won ? "Weave - Solved" : lost ? "Weave - Out of tries" : "Weave - In progress";
    const shareText = [
      `${header} (${placedCount}/${totalCount})`,
      `Tries left: ${game.triesLeft}`,
      emojiLine,
      window.location.href,
    ].join("\n");

    await navigator.clipboard.writeText(shareText);
  }

  return (
    <div
      className={styles.resultsOverlay}
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className={styles.results}>
        <div className={styles.closeButtonContainer}>
        <FontAwesomeIcon icon={faXmark} onClick={onClose} />
        </div>
        <div className={styles.resultsContent}>
          <p className={styles.summary}>
            {placedCount}/{totalCount} placed - {game.triesLeft} tries left
          </p>
          <p className={styles.emojiLine} aria-label="placement summary">
            {emojiLine}
          </p>
        </div>
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
      </section>
    </div>
  );
}