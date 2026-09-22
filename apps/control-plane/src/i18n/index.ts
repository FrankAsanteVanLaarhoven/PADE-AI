import { en, type MessageKey, type Messages } from "./en";
import { localeById, LOCALES, type LocaleId } from "./locales";

export const catalogs: Record<LocaleId, Messages> = {
  en,
  zh: en,
  hi: en,
  es: en,
  fr: en,
  ar: en,
  bn: en,
  pt: en,
  ja: en,
  de: en,
  ko: en,
  tr: en,
  vi: en,
  pl: en,
  uk: en,
  id: en,
  th: en,
  fa: en,
  ur: en,
  sw: en,
  ru: en,
  nl: en,
  it: en,
  sv: en,
  el: en,
};

export function translate(locale: string, key: MessageKey, vars?: Record<string, string>): string {
  const id = localeById(locale).id;
  const table = catalogs[id] ?? en;
  let text = table[key] ?? en[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, value);
  }
  return text;
}

const PHRASES: Record<string, Record<string, string>> = { en: {} };

export function registerPhrases(locale: LocaleId, map: Record<string, string>) {
  PHRASES[locale] = map;
}

export function localize(locale: string, text: string): string {
  if (!text) return text;
  const id = localeById(locale).id;
  if (id === "en") return text;
  const map = PHRASES[id] ?? {};
  const direct = map[text] ?? map[text.trim()];
  if (direct) return direct;
  if (text.includes(" — ")) return text.split(" — ").map((part) => localize(locale, part.trim())).join(" — ");
  if (text.includes(" · ")) return text.split(" · ").map((part) => localize(locale, part.trim())).join(" · ");
  const bits = text.split(" ");
  if (bits.length === 2 && map[bits[1]]) return `${bits[0]} ${map[bits[1]]}`;
  return text;
}

export function catalogCoverage(): { locale: LocaleId; identical: number; total: number }[] {
  const keys = Object.keys(en) as MessageKey[];
  return LOCALES.filter((item) => item.id !== "en").map((item) => {
    const table = catalogs[item.id];
    const identical = keys.filter((key) => table[key] === en[key]).length;
    return { locale: item.id, identical, total: keys.length };
  });
}
