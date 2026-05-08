import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, totalItems, onPageChange }: PaginationProps) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={t('pagination.nav')} className="flex justify-between items-center mt-5 text-sm text-gray-500">
      <span aria-live="polite">
        {t('pagination.summary', { totalItems, currentPage, totalPages })}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label={t('pagination.prev')}
          className="px-3 py-1 rounded border border-gray-200 bg-white disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span aria-hidden="true">«</span>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            aria-label={t('pagination.page', { n: page })}
            aria-current={currentPage === page ? 'page' : undefined}
            className={`px-3 py-1 rounded cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              currentPage === page
                ? 'bg-primary text-white border-none'
                : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label={t('pagination.next')}
          className="px-3 py-1 rounded border border-gray-200 bg-white disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span aria-hidden="true">»</span>
        </button>
      </div>
    </nav>
  );
}
