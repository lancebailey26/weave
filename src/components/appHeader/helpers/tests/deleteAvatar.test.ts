import { deleteAvatar } from "../deleteAvatar";
import { AVATAR_URL_METADATA_KEY } from "@/lib/user-avatar";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  del: vi.fn(),
}));

describe("deleteAvatar", () => {
  const getUser = vi.fn();
  const updateUserMetadata = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(clerkClient).mockResolvedValue({
      users: {
        getUser,
        updateUserMetadata,
      },
    } as unknown as Awaited<ReturnType<typeof clerkClient>>);
  });

  it("deletes the stored blob and clears metadata when avatar exists", async () => {
    getUser.mockResolvedValue({
      publicMetadata: {
        [AVATAR_URL_METADATA_KEY]: "https://blob.example/avatar.png",
      },
    });

    await deleteAvatar();

    expect(del).toHaveBeenCalledWith("https://blob.example/avatar.png", {
      token: process.env.WEAVE_READ_WRITE_TOKEN,
    });
    expect(updateUserMetadata).toHaveBeenCalledWith("user_123", {
      publicMetadata: {
        [AVATAR_URL_METADATA_KEY]: null,
      },
    });
  });

  it("still clears metadata when no avatar url is stored", async () => {
    getUser.mockResolvedValue({
      publicMetadata: {
        [AVATAR_URL_METADATA_KEY]: "   ",
      },
    });

    await deleteAvatar();

    expect(del).not.toHaveBeenCalled();
    expect(updateUserMetadata).toHaveBeenCalledWith("user_123", {
      publicMetadata: {
        [AVATAR_URL_METADATA_KEY]: null,
      },
    });
  });

  it("requires a signed in user", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

    await expect(deleteAvatar()).rejects.toThrow(
      "You must be signed in to delete your avatar.",
    );
    expect(clerkClient).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
  });
});

