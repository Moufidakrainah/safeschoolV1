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
    lng: 'fr',             // langue par défaut au premier chargement
    fallbackLng: 'fr',     // langue de secours si clé manquante
    detection: {
      order: ['localStorage'], // mémorise le choix de l'utilisateur, ignore la langue du navigateur
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,  // React échappe déjà le HTML, pas besoin de le faire deux fois
    },
  });

export default i18n;
