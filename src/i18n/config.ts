import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import heCommon from './locales/he/common.json';
import enCommon from './locales/en/common.json';

i18n
  .use(LanguageDetector) // Detects browser language
  .use(initReactI18next)
  .init({
    resources: {
      he: { common: heCommon },
      en: { common: enCommon },
    },
    fallbackLng: 'he', // Hebrew default per CONTEXT.md
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'], // localStorage takes priority
      caches: ['localStorage'], // Persist user selection
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
