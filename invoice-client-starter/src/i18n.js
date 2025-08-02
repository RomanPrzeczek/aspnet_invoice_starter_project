import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationCS from './locales/cs/translation.json';

const resources = {
  en: { translation: translationEN },
  cs: { translation: translationCS },
};

i18n
  .use(LanguageDetector) // detekuje jazyk z localStorage, cookie, atd.
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en', // výchozí jazyk
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;