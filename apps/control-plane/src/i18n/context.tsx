import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { localize, translate } from "./index";
import { localeById, LOCALES, type LocaleId } from "./locales";
import type { MessageKey } from "./en";

type Theme = "light" | "dark" | "system";

interface I18nValue {
  locale: LocaleId;
  setLocale: (id: LocaleId) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: MessageKey, vars?: Record<string, string>) => string;
  tx: (text: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function stored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleId>(() => localeById(stored("pade-locale") ?? "en").id);
  const [theme, setThemeState] = useState<Theme>(() => {
    const value = stored("pade-theme");
    return value === "light" || value === "dark" || value === "system" ? value : "system";
  });

  useEffect(() => {
    const item = localeById(locale);
    document.documentElement.lang = item.bcp47;
    document.documentElement.dir = item.dir;
    try {
      localStorage.setItem("pade-locale", locale);
    } catch {
      /* private mode */
    }
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("pade-theme", theme);
    } catch {
      /* private mode */
    }
  }, [theme]);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      theme,
      setTheme: setThemeState,
      t: (key, vars) => translate(locale, key, vars),
      tx: (text) => localize(locale, text),
    }),
    [locale, theme],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("i18n missing");
  return value;
}

export { LOCALES };
