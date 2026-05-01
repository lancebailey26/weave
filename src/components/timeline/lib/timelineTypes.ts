export type StoredDailyResult = {
  date: string;
  placements: (string | null)[];
  misses: number;
  elapsedMs: number;
};

export type InitialStoredResult = {
  placements: (string | null)[];
  misses: number;
  elapsedMs: number;
};

declare global {
  interface Window {
    weaveClearDailyLock?: (reload?: boolean) => void;
    timelyClearDailyLock?: (reload?: boolean) => void;
  }
}

export {};
