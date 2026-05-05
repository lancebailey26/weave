import { auth, clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  DEFAULT_LOCALE,
  LOCALE_METADATA_KEY,
  pickLocaleFromAcceptLanguage,
  parseLocaleFromUnknown,
} from "@/lib/i18n-locales";

export default getRequestConfig(async () => {
  const requestHeaders = await headers();
  const browserLocale = pickLocaleFromAcceptLanguage(requestHeaders.get("accept-language"));

  const { userId } = await auth();
  let userLocale = null;
  if (userId) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    userLocale = parseLocaleFromUnknown(user.publicMetadata?.[LOCALE_METADATA_KEY]);
  }

  const locale = userLocale ?? browserLocale ?? DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});