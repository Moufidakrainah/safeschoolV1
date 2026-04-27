import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';
import de from './locales/de.json';

i18n
  .use(LanguageDetector)   // détecte la langue du navigateur automatiquement
  .use(initReactI18next)   // branche i18next sur React
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      de: { translation: de },
    },
    fallbackLng: 'fr',     // langue par défaut si la langue détectée n'est pas supportée
    interpolation: {
      escapeValue: false,  // React échappe déjà le HTML, pas besoin de le faire deux fois
    },
  });

export default i18n;
