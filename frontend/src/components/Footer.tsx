import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

export default function Footer()
{
  const { t, i18n } = useTranslation();

  return (
    <footer className="bg-primary text-white py-4 px-6 flex flex-wrap items-center justify-between gap-4 text-sm font-sans">

      <nav aria-label="Liens légaux">
        <ul className="flex gap-6 list-none p-0 m-0">
          <li>
            <Link
              to="/privacy"
              className="hover:underline focus:outline-none focus:ring-2 focus:ring-white rounded"
            >
              {t('footer.privacy')}
            </Link>
          </li>
          <li>
            <Link
              to="/terms"
              className="hover:underline focus:outline-none focus:ring-2 focus:ring-white rounded"
            >
              {t('footer.terms')}
            </Link>
          </li>
        </ul>
      </nav>

      <div role="group" aria-label={t('footer.languageSwitcher')} className="flex gap-1">
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => i18n.changeLanguage(code)}
            aria-pressed={i18n.language.startsWith(code)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white ${
              i18n.language.startsWith(code)
                ? 'bg-white text-primary font-bold'
                : 'hover:bg-white/20'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

    </footer>
  );
}
