'use server';

import { auth, clerkClient } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import {
  AVATAR_URL_METADATA_KEY,
  parseAvatarUrlFromMetadata,
} from "@/lib/user-avatar";

export async function deleteAvatar() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must be signed in to delete your avatar.");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const avatarUrl = parseAvatarUrlFromMetadata(
    user.publicMetadata?.[AVATAR_URL_METADATA_KEY],
  );

  if (avatarUrl) {
    await del(avatarUrl, {
      token: process.env.WEAVE_READ_WRITE_TOKEN,
    });
  }

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      [AVATAR_URL_METADATA_KEY]: null,
    },
  });
}
