import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { LOCALE_METADATA_KEY, parseLocaleFromUnknown } from "@/lib/i18n-locales";

type UpdateBody = {
  locale?: unknown;
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

  const locale = parseLocaleFromUnknown(body.locale);
  if (!locale) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      [LOCALE_METADATA_KEY]: locale,
    },
  });

  return NextResponse.json({ locale });
}
