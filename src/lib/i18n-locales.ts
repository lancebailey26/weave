export const SUPPORTED_LOCALES = ["en", "es", "fr", "de", "pt-BR"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_METADATA_KEY = "preferredLocale";

export function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function canonicalizeLocale(value: string): AppLocale | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  const direct = SUPPORTED_LOCALES.find(
    (supported) => supported.toLowerCase() === normalized,
  );
  if (direct) return direct;

  const base = normalized.split("-")[0];
  if (!base) return null;
  if (base === "pt") return "pt-BR";

  const baseMatch = SUPPORTED_LOCALES.find(
    (supported) => supported.toLowerCase() === base,
  );
  return baseMatch ?? null;
}

export function parseLocaleFromUnknown(value: unknown): AppLocale | null {
  if (typeof value !== "string") return null;
  return canonicalizeLocale(value);
}

export function pickLocaleFromAcceptLanguage(headerValue: string | null): AppLocale | null {
  if (!headerValue) return null;
  const candidates = headerValue
    .split(",")
    .map((part) => part.trim().split(";")[0])
    .filter((part): part is string => Boolean(part));

  for (const candidate of candidates) {
    const locale = canonicalizeLocale(candidate);
    if (locale) return locale;
  }

  return null;
}
