import I18nModule from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNLocalize from 'react-native-localize';

import en from './locales/en.json';
import hi from './locales/hi.json';

export const LANGUAGE_STORAGE_KEY = 'student_language';
export type SupportedLanguage = 'en' | 'hi';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'hi'];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// i18next's `index.d.ts` declares BOTH `export default i18next` (the live
// instance) AND a set of named exports (`use`, `changeLanguage`, …). Under
// `moduleResolution: "bundler"` TypeScript merges these into the module
// namespace, so a default import here binds to the namespace object rather
// than the instance. We recover the singleton via the namespace's `default`
// property and expose it with the proper `i18n` interface type.
const rawI18n: any = (I18nModule as any)?.default || I18nModule;
const i18next = rawI18n as {
  use: (module: any) => typeof i18next;
  init: (options: any) => Promise<typeof i18next>;
  changeLanguage: (lng: string) => Promise<typeof i18next>;
  language: string;
};

/**
 * Detect the best matching language from the user's device locales.
 * Falls back to English when no supported language is found.
 */
const detectInitialLanguage = (): SupportedLanguage => {
  try {
    const locales = RNLocalize.getLocales() || [];
    for (const l of locales) {
      const code = (l.languageCode || '').toLowerCase();
      if (code.startsWith('hi')) return 'hi';
      if (code.startsWith('en')) return 'en';
    }
  } catch (e) {
    // RNLocalize may not be available on web or during early boot — ignore.
  }
  return DEFAULT_LANGUAGE;
};

/**
 * Initialise i18next with English + Hindi resources and a persisted language
 * choice (AsyncStorage). Mirrors the web `student-dashboards/i18n/index.ts`.
 */
export const initI18n = async (): Promise<typeof i18next> => {
  let lng: SupportedLanguage = DEFAULT_LANGUAGE;
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)) {
      lng = saved as SupportedLanguage;
    } else {
      lng = detectInitialLanguage();
    }
  } catch (e) {
    lng = DEFAULT_LANGUAGE;
  }

  // i18next.init is safe to call multiple times; compatibilityJSON v3
  // is tailored for React Native / Hermes without requiring Intl.PluralRules polyfill.
  await i18next.use(initReactI18next as unknown as any).init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    lng,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

  return i18next;
};

/**
 * Persist the chosen language and switch i18next at runtime.
 */
export const changeStudentLanguage = async (
  language: SupportedLanguage
): Promise<void> => {
  if (!SUPPORTED_LANGUAGES.includes(language)) return;
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (e) {
    // Non-fatal: continue even if persistence fails.
  }
  await i18next.changeLanguage(language);
};

export const getStudentLanguage = (): SupportedLanguage => {
  const current: string = i18next.language || DEFAULT_LANGUAGE;
  return current.startsWith('hi') ? 'hi' : 'en';
};

export default i18next;