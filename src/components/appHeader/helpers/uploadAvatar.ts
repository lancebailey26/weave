'use server';
import { auth, clerkClient } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { AVATAR_URL_METADATA_KEY } from "@/lib/user-avatar";

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function assertValidAvatarFile(file: File) {
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    throw new Error("Please upload a JPG, PNG, or WEBP image.");
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error("Avatar image must be 2MB or smaller.");
  }
}

export async function uploadAvatar(file: File) {
  assertValidAvatarFile(file);
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must be signed in to change your avatar.");
  }

  const extensionByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensionByType[file.type] ?? "bin";
  const fileName = `avatars/${crypto.randomUUID()}.${extension}`;

  const { url } = await put(fileName, file, {
    access: "public",
    token: process.env.WEAVE_READ_WRITE_TOKEN,
  });

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      [AVATAR_URL_METADATA_KEY]: url,
    },
  });

  return url;
}