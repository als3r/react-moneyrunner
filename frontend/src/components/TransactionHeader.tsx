import { useState, useEffect } from "react";
import { Account } from "../services/accountService";

interface TransactionHeaderProps {
  onFilterClick: () => void;
  onAddClick: () => void;
  onClearFilters?: () => void;
  showAccountFilter?: boolean;
  accounts?: Account[];
  selectedAccountId?: string;
  onAccountChange?: (accountId: string) => void;
  hasActiveFilters?: boolean;
  showExport?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onSearchSubmit?: () => void;
}

export default function TransactionHeader({
  onFilterClick,
  onAddClick,
  onClearFilters,
  showAccountFilter = false,
  accounts = [],
  selectedAccountId = "",
  onAccountChange,
  hasActiveFilters = false,
  showExport = true,
  searchTerm = "",
  onSearchChange,
  onSearchSubmit,
}: TransactionHeaderProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(localSearchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localSearchTerm, onSearchChange]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <div className="flex items-center gap-3">
      {showAccountFilter && (
        <select
          value={selectedAccountId}
          onChange={(e) => onAccountChange?.(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          <option value="">All Accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id.toString()}>
              {account.name}
            </option>
          ))}
        </select>
      )}
      {onSearchChange && (
        <input
          type="text"
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search: text, >100, <100, >=100, <=100, >2024-01-01, >100 food, or >2024-01-01 >100 (Press Enter)"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 w-96"
        />
      )}
      {hasActiveFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          Clear filters
        </button>
      )}
      <button
        onClick={onFilterClick}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
      >
        <svg
          className="stroke-current fill-white dark:fill-gray-800"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.29004 5.90393H17.7067"
            stroke=""
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.7075 14.0961H2.29085"
            stroke=""
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
            fill=""
            stroke=""
            strokeWidth="1.5"
          />
          <path
            d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
            fill=""
            stroke=""
            strokeWidth="1.5"
          />
        </svg>
        Filter
      </button>
      <button
        onClick={onAddClick}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
      >
        <svg
          className="stroke-current fill-white dark:fill-gray-800"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 5V10M10 10V15M10 10H5M10 10H15"
            stroke=""
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Add
      </button>
      {showExport && (
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
          Export
        </button>
      )}
    </div>
  );
}
