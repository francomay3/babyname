import { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { locales } from '../locales';
import type { Locale, Strings } from '../locales';

interface LocaleContextValue {
  t: Strings;
  locale: Locale;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  t: locales.es,
  locale: 'es',
  toggleLocale: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useLocalStorage<Locale>({
    key: 'babyname-locale',
    defaultValue: 'es',
  });

  const value = useMemo(
    () => ({
      t: locales[locale],
      locale,
      toggleLocale: () => setLocale(locale === 'es' ? 'en' : 'es'),
    }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
