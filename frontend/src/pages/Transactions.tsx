import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import Badge from "../components/ui/badge/Badge";
import PageMeta from "../components/common/PageMeta";
import { transactionService, Transaction, TransactionFilters, CreateTransaction } from "../services/transactionService";
import { accountService, Account } from "../services/accountService";
import { categoryService, Category } from "../services/categoryService";
import { tagService, Tag } from "../services/tagService";

interface DisplayTransaction {
  id: number;
  description: string;
  category: string;
  categoryId: number;
  account: string;
  accountId: number;
  amount: string;
  tags: string[];
  tagIds: number[];
  date: string;
  type: 'income' | 'expense' | 'transfer';
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500];

export default function Transactions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [transactions, setTransactions] = useState<DisplayTransaction[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense' | 'transfer',
    account_id: '',
    category_id: '',
    tag_ids: [] as number[],
  });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: TransactionFilters = {
        page: currentPage,
        per_page: itemsPerPage,
      };

      // Add tag filter if selected
      if (selectedTags.length > 0) {
        filters.tag_ids = selectedTags;
      }

      // Add category filter if selected
      if (selectedCategories.length > 0) {
        filters.category_id = selectedCategories[0]; // Single category filter for now
      }

      const response = await transactionService.getAll(filters);
      
      const displayData: DisplayTransaction[] = response.data.map((t: Transaction) => ({
        id: t.id,
        description: t.description,
        category: t.category.name,
        categoryId: t.category.id,
        account: t.account.name,
        accountId: t.account.id,
        amount: `${t.account.currency.symbol}${Number(t.amount).toFixed(2)}`,
        tags: t.tags.map(tag => tag.name),
        tagIds: t.tags.map(tag => tag.id),
        date: t.date.split('T')[0],
        type: t.type,
      }));
      
      setTransactions(displayData);
      setTotalPages(response.meta.last_page);
    } catch (err) {
      setError('Failed to load transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, selectedTags, selectedCategories]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  const currentData = transactions;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handleTagClick = (tagId: number) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleCategoryClick = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedCategories([]);
    setCurrentPage(1);
  };

  const fetchFormData = async () => {
    try {
      const [accountsRes, categoriesRes, tagsRes] = await Promise.all([
        accountService.getAll({ page: 1, per_page: 100 }),
        categoryService.getAll({ page: 1, per_page: 100 }),
        tagService.getAll({ page: 1, per_page: 100 }),
      ]);
      setAccounts(accountsRes.data);
      setCategories(categoriesRes.data);
      setTags(tagsRes.data);
    } catch (err) {
      console.error('Error fetching form data:', err);
    }
  };

  const handleOpenModal = () => {
    setEditingId(null);
    fetchFormData();
    setFormData({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      account_id: '',
      category_id: '',
      tag_ids: [],
    });
    setIsModalOpen(true);
  };

  const handleEditTransaction = async (transaction: DisplayTransaction) => {
    await fetchFormData();
    setEditingId(transaction.id);
    setFormData({
      description: transaction.description,
      amount: transaction.amount.replace(/[^0-9.-]/g, ''),
      date: transaction.date,
      type: transaction.type,
      account_id: transaction.accountId.toString(),
      category_id: transaction.categoryId.toString(),
      tag_ids: transaction.tagIds || [],
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      account_id: '',
      category_id: '',
      tag_ids: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const transactionData: CreateTransaction = {
        account_id: parseInt(formData.account_id),
        category_id: parseInt(formData.category_id),
        type: formData.type,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        tag_ids: formData.tag_ids,
      };
      if (editingId) {
        await transactionService.update(editingId, transactionData);
      } else {
        await transactionService.create(transactionData);
      }
      setIsSubmitting(false);
      handleCloseModal();
      fetchTransactions();
    } catch (err) {
      console.error('Error saving transaction:', err);
      alert('Failed to save transaction. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageMeta
          title="Transactions | MoneyRunner"
          description="View all your transactions"
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Loading transactions...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta
          title="Transactions | MoneyRunner"
          description="View all your transactions"
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </>
    );
  }

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
            {(selectedTags.length > 0 || selectedCategories.length > 0) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                Clear filters ({selectedTags.length + selectedCategories.length})
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
            <button
              onClick={handleOpenModal}
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
                  d="M10 5V10M10 10V15M10 10H5M10 10H15"
                  stroke=""
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Add Transaction
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
                    Account
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
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
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
                      {transaction.account}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <button
                        onClick={() => handleCategoryClick(transaction.categoryId)}
                        className={`cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 ${
                          selectedCategories.includes(transaction.categoryId)
                            ? "text-brand-500 dark:text-brand-400 font-medium"
                            : ""
                        }`}
                      >
                        {transaction.category}
                      </button>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {transaction.amount}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <div className="flex gap-1 flex-wrap">
                        {transaction.tags.map((tag, index) => (
                          <button
                            key={index}
                            onClick={() => handleTagClick(transaction.tagIds[index])}
                            className="cursor-pointer"
                          >
                            <Badge
                              size="sm"
                              color={selectedTags.includes(transaction.tagIds[index]) ? "primary" : "light"}
                            >
                              {tag}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="text-brand-500 hover:text-brand-600 text-sm font-medium"
                      >
                        Edit
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
                {(selectedTags.length > 0 || selectedCategories.length > 0) && (
                  <span>
                    {" "}(filtered by {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} and {selectedCategories.length} category{selectedCategories.length !== 1 ? 'ies' : 'y'})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  Rows per page:
                </label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  {ITEMS_PER_PAGE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
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

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editingId ? 'Edit Transaction' : 'Add Transaction'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4L16 16M4 16L16 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' | 'transfer' })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
                  <select
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <label key={tag.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.tag_ids.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, tag_ids: [...formData.tag_ids, tag.id] });
                            } else {
                              setFormData({ ...formData, tag_ids: formData.tag_ids.filter(id => id !== tag.id) });
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
