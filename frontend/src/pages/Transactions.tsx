import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import Badge from "../components/ui/badge/Badge";
import PageMeta from "../components/common/PageMeta";

interface Transaction {
  id: number;
  description: string;
  category: string;
  amount: string;
  tags: string[];
  date: string;
}

const tableData: Transaction[] = [
  {
    id: 1,
    description: "Grocery shopping",
    category: "Food",
    amount: "$150.00",
    tags: ["weekly"],
    date: "2024-01-15",
  },
  {
    id: 2,
    description: "Electric bill",
    category: "Utilities",
    amount: "$85.50",
    tags: ["monthly", "essential"],
    date: "2024-01-14",
  },
  {
    id: 3,
    description: "Netflix subscription",
    category: "Entertainment",
    amount: "$15.99",
    tags: ["monthly"],
    date: "2024-01-13",
  },
  {
    id: 4,
    description: "Gas station",
    category: "Transport",
    amount: "$45.00",
    tags: ["weekly"],
    date: "2024-01-12",
  },
  {
    id: 5,
    description: "Restaurant dinner",
    category: "Food",
    amount: "$62.50",
    tags: ["dining"],
    date: "2024-01-11",
  },
  {
    id: 6,
    description: "Internet bill",
    category: "Utilities",
    amount: "$59.99",
    tags: ["monthly", "essential"],
    date: "2024-01-10",
  },
  {
    id: 7,
    description: "Coffee shop",
    category: "Food",
    amount: "$8.50",
    tags: ["daily"],
    date: "2024-01-09",
  },
  {
    id: 8,
    description: "Gym membership",
    category: "Health",
    amount: "$45.00",
    tags: ["monthly"],
    date: "2024-01-08",
  },
  {
    id: 9,
    description: "Book purchase",
    category: "Education",
    amount: "$24.99",
    tags: ["one-time"],
    date: "2024-01-07",
  },
  {
    id: 10,
    description: "Bus pass",
    category: "Transport",
    amount: "$30.00",
    tags: ["monthly"],
    date: "2024-01-06",
  },
  {
    id: 11,
    description: "Phone bill",
    category: "Utilities",
    amount: "$65.00",
    tags: ["monthly", "essential"],
    date: "2024-01-05",
  },
  {
    id: 12,
    description: "Clothing",
    category: "Shopping",
    amount: "$120.00",
    tags: ["seasonal"],
    date: "2024-01-04",
  },
];

const ITEMS_PER_PAGE = 10;

export default function Transactions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Filter transactions based on selected tags
  const filteredData = selectedTags.length > 0
    ? tableData.filter(transaction =>
        selectedTags.every(tag => transaction.tags.includes(tag))
      )
    : tableData;

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setCurrentPage(1);
  };

  return (
    <>
      <PageMeta
        title="Transactions | MoneyRunner"
        description="View all your transactions"
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Transactions
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage and view all your transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedTags.length > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                Clear filters ({selectedTags.length})
              </button>
            )}
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
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
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              Export
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Transactions
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Date
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Category
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Amount
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Tags
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {currentData.map((transaction) => (
                  <TableRow key={transaction.id} className="">
                    <TableCell className="py-3">
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {transaction.description}
                      </p>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {transaction.date}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {transaction.category}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {transaction.amount}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <div className="flex gap-1 flex-wrap">
                        {transaction.tags.map((tag, index) => (
                          <button
                            key={index}
                            onClick={() => handleTagClick(tag)}
                            className="cursor-pointer"
                          >
                            <Badge
                              size="sm"
                              color={selectedTags.includes(tag) ? "primary" : "light"}
                            >
                              {tag}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of{" "}
              {filteredData.length} transactions
              {selectedTags.length > 0 && ` (filtered by ${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''})`}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium shadow-theme-xs ${
                    currentPage === page
                      ? "border-brand-500 bg-brand-500 text-white dark:border-brand-400 dark:bg-brand-400"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
