export type Event = {
  id: string;

  // Basic fields.
  title: string;
  description: string;

  // Date of the event.
  date: string; // ISO: "YYYY-MM-DD"
  precision?: "day" | "month" | "year";

  // Category of the event.
  category:
    | "game"
    | "history"
    | "internet"
    | "movie"
    | "music"
    | "politics"
    | "science"
    | "sports"
    | "tech"
    | "tv"
    | "world";

  // When the event was added to the database.
  createdAt: string; // ISO timestamp: "YYYY-MM-DDTHH:mm:ssZ"

  // Submitted by (for user-submitted events).
  submittedBy: string;

  // Status of the event; only approved events are used by the game API.
  status?: "approved" | "needs_review";
};

export type GameState = {
  bank: Event[];
  placements: (string | null)[];
  misses: number;
  startedAtMs: number | null;
  elapsedMs: number;
};

export type DragPayload = { origin: "bank"; eventId: string };

export type DropPayload = { type: "timeline-slot"; index: number };

export type SplashProps = {
  onClose: () => void;
  screen: React.ReactNode;
};