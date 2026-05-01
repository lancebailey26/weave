import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  ALL_WEAVE_CATEGORY,
  parseWeaveCategoryFilter,
  WEAVE_CATEGORY_METADATA_KEY,
} from "@/lib/weave-categories";

type UpdateBody = {
  category?: string;
};

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UpdateBody;
  try {
    body = (await request.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const category = parseWeaveCategoryFilter(body.category);
  const client = await clerkClient();

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      [WEAVE_CATEGORY_METADATA_KEY]:
        category === ALL_WEAVE_CATEGORY ? null : category,
    },
  });

  return NextResponse.json({ category });
}
