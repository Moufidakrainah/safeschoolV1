import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { type LanguageCode } from '../components/layout/Footer/Footer.constants';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = useCallback(
    (code: LanguageCode) => {
      i18n.changeLanguage(code);
      localStorage.setItem('preferred-language', code);
      document.documentElement.lang = code;
    },
    [i18n],
  );

  return { currentLanguage: i18n.language, changeLanguage };
};
