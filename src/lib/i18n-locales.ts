export const SUPPORTED_LOCALES = ["en", "fr"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_METADATA_KEY = "preferredLocale";

export function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function parseLocaleFromUnknown(value: unknown): AppLocale | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return isSupportedLocale(normalized) ? normalized : null;
}

export function pickLocaleFromAcceptLanguage(headerValue: string | null): AppLocale | null {
  if (!headerValue) return null;
  const candidates = headerValue
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .filter((part): part is string => Boolean(part));

  for (const candidate of candidates) {
    const base = candidate.split("-")[0];
    if (base && isSupportedLocale(base)) {
      return base;
    }
  }

  return null;
}
