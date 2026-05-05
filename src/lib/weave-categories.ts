import type { Event } from "@/lib/types";

export type WeaveCategory = Event["category"];

export const WEAVE_CATEGORIES: readonly WeaveCategory[] = [
  "game",
  "history",
  "internet",
  "movie",
  "music",
  "politics",
  "science",
  "sports",
  "tech",
  "tv",
  "world",
];

export const ALL_WEAVE_CATEGORY = "all";

export type WeaveCategoryFilter = WeaveCategory | typeof ALL_WEAVE_CATEGORY;
export const WEAVE_CATEGORY_METADATA_KEY = "preferredWeaveCategory";

const CATEGORY_LABELS: Record<WeaveCategoryFilter, string> = {
  all: "All categories",
  game: "Game",
  history: "History",
  internet: "Internet",
  movie: "Movie",
  music: "Music",
  politics: "Politics",
  science: "Science",
  sports: "Sports",
  tech: "Tech",
  tv: "TV",
  world: "World",
};

export function isWeaveCategory(value: string): value is WeaveCategory {
  return WEAVE_CATEGORIES.includes(value as WeaveCategory);
}

export function parseWeaveCategoryFilter(
  raw: string | string[] | undefined,
): WeaveCategoryFilter {
  if (!raw) return ALL_WEAVE_CATEGORY;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === ALL_WEAVE_CATEGORY) return value;
  return isWeaveCategory(value) ? value : ALL_WEAVE_CATEGORY;
}

export function parseWeaveCategoryFilterFromUnknown(raw: unknown): WeaveCategoryFilter {
  if (typeof raw !== "string") return ALL_WEAVE_CATEGORY;
  return parseWeaveCategoryFilter(raw);
}

export function getWeaveCategoryLabel(category: WeaveCategoryFilter): string {
  return CATEGORY_LABELS[category];
}
