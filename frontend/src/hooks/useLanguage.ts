import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
  };

  return { currentLanguage: i18n.language, changeLanguage };
};
