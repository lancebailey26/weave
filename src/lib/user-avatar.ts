export const AVATAR_URL_METADATA_KEY = "avatarUrl";

export function parseAvatarUrlFromMetadata(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
