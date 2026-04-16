const EASTERN_TIME_ZONE = "America/New_York";
const EASTERN_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: EASTERN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function cyrb128(seed: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < seed.length; i++) {
    const k = seed.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    const t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    const out = (t + d) | 0;
    c = (c + out) | 0;
    return (out >>> 0) / 4294967296;
  };
}

/** Deterministic Fisher–Yates shuffle for stable daily puzzles. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const rand = sfc32(...cyrb128(seed));
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** New York date key used to keep one daily puzzle per EST/EDT day. */
export function getEasternDateKey(input = new Date()): string {
  return EASTERN_DATE_FORMATTER.format(input);
}

/**
 * Returns the next instant where the Eastern date key changes.
 * Uses a bounded binary search so DST transitions are handled safely.
 */
export function getNextEasternMidnightTimestamp(input = new Date()): number {
  const currentKey = getEasternDateKey(input);
  let low = input.getTime();
  let high = low + 36 * 60 * 60 * 1000;

  while (getEasternDateKey(new Date(high)) === currentKey) {
    high += 12 * 60 * 60 * 1000;
  }

  while (low + 1 < high) {
    const mid = Math.floor((low + high) / 2);
    if (getEasternDateKey(new Date(mid)) === currentKey) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return high;
}
