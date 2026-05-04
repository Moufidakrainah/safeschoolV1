import { t } from 'i18next';

export const LANGUAGES = [
  {
    code: 'fr',
    label: 'FR',
    title: () => t('languages.french'),
  },
  {
    code: 'en',
    label: 'EN',
    title: () => t('languages.english'),
  },
  {
    code: 'de',
    label: 'DE',
    title: () => t('languages.german'),
  },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];
