import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export const useLanguage = () => {
  const { i18n } = useTranslation();


  // i18n est un objet singleton qui ne change jamais. Le useCallback n'apporte rien ici
  const changeLanguage = useCallback(
    (code: LanguageCode) => {
      i18n.changeLanguage(code);
      document.documentElement.lang = code;
    },
    [i18n],
  );

  return { currentLanguage: i18n.language, changeLanguage };
};
