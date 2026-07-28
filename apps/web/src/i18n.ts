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

export const dynamicActivate = async (locale: Locale): Promise<void> => {
  const { messages } = (await import(`./locales/${locale}/messages.po`)) as {
    messages: Messages;
  };

  i18n.load(locale, messages);
  i18n.activate(locale);
  localStorage.setItem(STORAGE_KEY, locale);
};
