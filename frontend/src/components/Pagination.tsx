interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, totalItems, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-between items-center mt-5 text-sm text-gray-500">
      <span>{totalItems} résultats · Page {currentPage} sur {totalPages}</span>
      <div className="flex gap-2">
        <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
          className="px-3 py-1 rounded border border-gray-200 bg-white disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer">
          «
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button key={page} onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded cursor-pointer font-medium
              ${currentPage === page ? 'bg-[#0097b2] text-white border-none' : 'bg-white border border-gray-200 text-gray-700'}
            `}>
            {page}
          </button>
        ))}
        <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
          className="px-3 py-1 rounded border border-gray-200 bg-white disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer">
          »
        </button>
      </div>
    </div>
  );
}