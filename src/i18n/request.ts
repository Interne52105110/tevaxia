import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

export default getRequestConfig(async () => {
  const headersList = await headers();
  const url = headersList.get("x-url") || "";
  const locale = url.startsWith("/en") ? "en" : "fr";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
