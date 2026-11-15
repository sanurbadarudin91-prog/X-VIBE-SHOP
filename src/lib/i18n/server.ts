import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_META,
  isLocale,
  translate,
  type Locale,
  type MessageKey,
} from "@/lib/i18n/dictionaries";

/** Locale aktif dari cookie (server-side). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Helper terjemahan server-side untuk halaman/komponen server. */
export async function getTranslator() {
  const locale = await getLocale();
  return {
    locale,
    dir: LOCALE_META[locale].dir,
    t: (key: MessageKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
  };
}
