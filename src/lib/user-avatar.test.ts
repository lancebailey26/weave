import {
  AVATAR_URL_METADATA_KEY,
  parseAvatarUrlFromMetadata,
} from "./user-avatar";

describe("user avatar metadata helpers", () => {
  it("exports the expected metadata key", () => {
    expect(AVATAR_URL_METADATA_KEY).toBe("avatarUrl");
  });

  it("returns null for non-string metadata values", () => {
    expect(parseAvatarUrlFromMetadata(undefined)).toBeNull();
    expect(parseAvatarUrlFromMetadata(null)).toBeNull();
    expect(parseAvatarUrlFromMetadata(123)).toBeNull();
    expect(parseAvatarUrlFromMetadata({})).toBeNull();
  });

  it("trims and returns a valid string url", () => {
    expect(parseAvatarUrlFromMetadata("  https://example.com/a.png  ")).toBe(
      "https://example.com/a.png",
    );
  });

  it("returns null for empty strings", () => {
    expect(parseAvatarUrlFromMetadata("")).toBeNull();
    expect(parseAvatarUrlFromMetadata("   ")).toBeNull();
  });
});
