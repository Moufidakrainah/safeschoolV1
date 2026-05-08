import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { memo } from 'react';
import { LANGUAGES } from './Footer.constants';
import { useLanguage } from '../../../hooks/useLanguage';

export const Footer = memo(function Footer() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <footer className="bg-primary text-white py-4 px-6" role="contentinfo">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 text-sm">
        <nav aria-label={t('footer.legalNav')} className="flex-grow">
          <ul className="flex gap-6 list-none p-0 m-0">
            <li>
              <Link
                to="/privacy"
                className="hover:underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary rounded transition-colors"
              >
                {t('footer.privacy')}
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="hover:underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary rounded transition-colors"
              >
                {t('footer.terms')}
              </Link>
            </li>
          </ul>
        </nav>

        <div
          role="group"
          aria-label={t('footer.languageSwitcher')}
          className="flex-shrink-0"
        >
          <ul className="flex gap-1 list-none p-0 m-0">
            {LANGUAGES.map(({ code, label, title }) => (
              <li key={code}>
                <button
                  onClick={() => changeLanguage(code)}
                  aria-pressed={currentLanguage.startsWith(code)}
                  aria-label={t('footer.changeLanguage', { language: title() })}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 
                    focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 
                    focus:ring-offset-primary min-w-[44px] ${
                      currentLanguage.startsWith(code)
                        ? 'bg-white text-primary font-bold shadow-sm'
                        : 'hover:bg-white/20 active:bg-white/30'
                    }`}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
});
