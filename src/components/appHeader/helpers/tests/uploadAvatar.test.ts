import { uploadAvatar } from "../uploadAvatar";
import { AVATAR_URL_METADATA_KEY } from "@/lib/user-avatar";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
}));

describe("uploadAvatar", () => {
  const updateUserMetadata = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("avatar-uuid");
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(clerkClient).mockResolvedValue({
      users: {
        updateUserMetadata,
      },
    } as unknown as Awaited<ReturnType<typeof clerkClient>>);
    vi.mocked(put).mockResolvedValue({
      url: "https://blob.example/avatar.png",
    } as Awaited<ReturnType<typeof put>>);
  });

  it("uploads a supported avatar and stores metadata", async () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });

    const url = await uploadAvatar(file);

    expect(url).toBe("https://blob.example/avatar.png");
    expect(put).toHaveBeenCalledWith("avatars/avatar-uuid.png", file, {
      access: "public",
      token: process.env.WEAVE_READ_WRITE_TOKEN,
    });
    expect(updateUserMetadata).toHaveBeenCalledWith("user_123", {
      publicMetadata: {
        [AVATAR_URL_METADATA_KEY]: "https://blob.example/avatar.png",
      },
    });
  });

  it("rejects unsupported file types", async () => {
    const file = new File(["avatar"], "avatar.gif", { type: "image/gif" });

    await expect(uploadAvatar(file)).rejects.toThrow(
      "Please upload a JPG, PNG, or WEBP image.",
    );
    expect(auth).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects files larger than 2mb", async () => {
    const hugeFile = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "avatar.png", {
      type: "image/png",
    });

    await expect(uploadAvatar(hugeFile)).rejects.toThrow(
      "Avatar image must be 2MB or smaller.",
    );
    expect(auth).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("requires a signed in user", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });

    await expect(uploadAvatar(file)).rejects.toThrow(
      "You must be signed in to change your avatar.",
    );
    expect(put).not.toHaveBeenCalled();
    expect(updateUserMetadata).not.toHaveBeenCalled();
  });
});
