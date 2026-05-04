interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 10; // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than or equal to maxVisible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate how many pages to show around current page
      const sideCount = Math.floor((maxVisible - 2) / 2); // -2 for first and last page

      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, currentPage - sideCount);
      let end = Math.min(totalPages - 1, currentPage + sideCount);

      // Adjust if we're near the start
      if (start <= 2) {
        end = Math.min(totalPages - 1, maxVisible - 1);
      }

      // Adjust if we're near the end
      if (end >= totalPages - 1) {
        start = Math.max(2, totalPages - maxVisible + 2);
      }

      // Add ellipsis before range if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add pages in range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis after range if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
      >
        Previous
      </button>
      {getPageNumbers().map((page, index) => (
        typeof page === 'number' ? (
          <button
            key={index}
            onClick={() => onPageChange(page)}
            className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium shadow-theme-xs ${
              currentPage === page
                ? "border-brand-500 bg-brand-500 text-white dark:border-brand-400 dark:bg-brand-400"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            }`}
          >
            {page}
          </button>
        ) : (
          <span
            key={index}
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-500"
          >
            {page}
          </span>
        )
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
      >
        Next
      </button>
    </div>
  );
}
