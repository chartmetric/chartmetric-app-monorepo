import { i18n, type Messages } from "@lingui/core";

/* eslint-disable lingui/no-unlocalized-strings --
 * Locale names are endonyms: each is intentionally shown in its own language. */
export const LOCALE_LABELS = {
  de: "Deutsch",
  en: "English",
  es: "Español",
  fr: "Français",
  ja: "日本語",
  ko: "한국어",
  pt: "Português",
} as const;
/* eslint-enable lingui/no-unlocalized-strings */

export type Locale = keyof typeof LOCALE_LABELS;

const DEFAULT_LOCALE: Locale = "en";
const STORAGE_KEY = "locale";

export const isLocale = (value: string): value is Locale =>
  Object.hasOwn(LOCALE_LABELS, value);

export const detectLocale = (): Locale => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null && isLocale(stored)) {
    return stored;
  }

  const [browserLanguage] = navigator.language.split("-", 1);
  if (browserLanguage !== undefined && isLocale(browserLanguage)) {
    return browserLanguage;
  }

  return DEFAULT_LOCALE;
};

// Persist only explicit user choices (the locale switcher) — persisting the
// boot-time detected locale would pin it even when the browser language changes.
export const storeLocale = (locale: Locale): void => {
  localStorage.setItem(STORAGE_KEY, locale);
};

// One catalog per directory under src/pages, plus "common" for everything
// else (see lingui.config.ts). Add new page directories here.
const CATALOG_NAMES = [
  "account",
  "common",
  "creators",
  "demo",
  "music",
  "sports",
];

export const dynamicActivate = async (locale: Locale): Promise<void> => {
  const catalogs = await Promise.all(
    CATALOG_NAMES.map(
      async (name) =>
        (await import(`./locales/${name}/${locale}/messages.po`)) as {
          messages: Messages;
        },
    ),
  );

  const messages: Messages = {};
  for (const catalog of catalogs) {
    Object.assign(messages, catalog.messages);
  }

  i18n.load(locale, messages);
  i18n.activate(locale);
};
