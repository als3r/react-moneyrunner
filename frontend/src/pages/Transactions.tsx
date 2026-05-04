import { useState, useEffect, useCallback, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import PageMeta from "../components/common/PageMeta";
import TransactionTable from "../components/TransactionTable";
import TransactionHeader from "../components/TransactionHeader";
import Pagination from "../components/Pagination";
import { transactionService, TransactionFilters, CreateTransaction } from "../services/transactionService";
import { accountService, Account } from "../services/accountService";
import { categoryService, Category } from "../services/categoryService";
import { tagService, Tag } from "../services/tagService";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500];

export default function Transactions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
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
  const [filterData, setFilterData] = useState({
    start_date: '',
    end_date: '',
    description: '',
    account_id: '',
    category_id: '',
    tag_ids: [] as number[],
    type: '' as 'income' | 'expense' | 'transfer' | '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    start_date: '',
    end_date: '',
    description: '',
    account_id: '',
    category_id: '',
    tag_ids: [] as number[],
    type: '' as 'income' | 'expense' | 'transfer' | '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const startDatePickerRef = useRef<flatpickr.Instance | null>(null);
  const endDatePickerRef = useRef<flatpickr.Instance | null>(null);
  const transactionDateRef = useRef<HTMLInputElement>(null);
  const transactionDatePickerRef = useRef<flatpickr.Instance | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchTransactions = useCallback(async (accountId?: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      setError(null);

      const filters: TransactionFilters = {
        page: currentPage,
        per_page: itemsPerPage,
      };

      // Apply filters from appliedFilters
      if (appliedFilters.start_date) filters.start_date = appliedFilters.start_date;
      if (appliedFilters.end_date) filters.end_date = appliedFilters.end_date;
      if (appliedFilters.description) filters.description = appliedFilters.description;
      if (searchTerm) filters.search = searchTerm;
      if (accountId !== undefined) {
        filters.account_id = accountId ? parseInt(accountId) : undefined;
      } else if (appliedFilters.account_id) {
        filters.account_id = parseInt(appliedFilters.account_id);
      }
      if (appliedFilters.category_id) filters.category_id = parseInt(appliedFilters.category_id);
      if (appliedFilters.tag_ids.length > 0) filters.tag_ids = appliedFilters.tag_ids;
      if (appliedFilters.type) filters.type = appliedFilters.type;

      const response = await transactionService.getAll(filters, abortController.signal);

      const displayData: Transaction[] = response.data.map((t) => ({
        id: t.id,
        description: t.description,
        category: t.category?.name || 'No category',
        categoryId: t.category?.id || 0,
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
    } catch (err: any) {
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        setError('Failed to load transactions');
        console.error('Error fetching transactions:', err);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [currentPage, itemsPerPage, appliedFilters, searchTerm]);

  useEffect(() => {
    fetchTransactions();
    fetchFormData();
  }, [fetchTransactions]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
      if (e.key === 'Escape' && isFilterModalOpen) {
        setIsFilterModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen, isFilterModalOpen]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handleTagClick = (tagId: number) => {
    setAppliedFilters(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(t => t !== tagId)
        : [...prev.tag_ids, tagId]
    }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleCategoryClick = (categoryId: number) => {
    setAppliedFilters(prev => ({
      ...prev,
      category_id: prev.category_id === categoryId.toString() ? '' : categoryId.toString()
    }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedCategories([]);
    setAppliedFilters({
      start_date: '',
      end_date: '',
      description: '',
      account_id: '',
      category_id: '',
      tag_ids: [],
      type: '',
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleOpenFilterModal = () => {
    // Sync filterData with appliedFilters so the modal shows current selections
    setFilterData({ ...appliedFilters });
    setIsFilterModalOpen(true);

    // Fetch form data in background
    fetchFormData();

    // Initialize flatpickr after modal is open
    setTimeout(() => {
      if (startDateRef.current) {
        startDatePickerRef.current = flatpickr(startDateRef.current, {
          dateFormat: 'Y-m-d',
          onChange: (selectedDates) => {
            if (selectedDates[0]) {
              setFilterData(prev => ({ ...prev, start_date: selectedDates[0].toISOString().split('T')[0] }));
            }
          },
        });
      }
      if (endDateRef.current) {
        endDatePickerRef.current = flatpickr(endDateRef.current, {
          dateFormat: 'Y-m-d',
          onChange: (selectedDates) => {
            if (selectedDates[0]) {
              setFilterData(prev => ({ ...prev, end_date: selectedDates[0].toISOString().split('T')[0] }));
            }
          },
        });
      }
    }, 100);
  };

  const handleCloseFilterModal = () => {
    // Destroy flatpickr instances
    if (startDatePickerRef.current) {
      startDatePickerRef.current.destroy();
      startDatePickerRef.current = null;
    }
    if (endDatePickerRef.current) {
      endDatePickerRef.current.destroy();
      endDatePickerRef.current = null;
    }
    setIsFilterModalOpen(false);
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ ...filterData });
    setCurrentPage(1);
    handleCloseFilterModal();
  };

  const handleClearFilter = () => {
    setFilterData({
      start_date: '',
      end_date: '',
      description: '',
      account_id: '',
      category_id: '',
      tag_ids: [],
      type: '',
    });
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
    // Fetch form data in background
    fetchFormData();

    // Initialize transaction date picker
    setTimeout(() => {
      if (transactionDateRef.current) {
        transactionDatePickerRef.current = flatpickr(transactionDateRef.current, {
          dateFormat: 'Y-m-d',
          onChange: (selectedDates) => {
            if (selectedDates[0]) {
              setFormData(prev => ({ ...prev, date: selectedDates[0].toISOString().split('T')[0] }));
            }
          },
        });
      }
    }, 100);
  };

  const handleEditTransaction = (transaction: Transaction) => {
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
    // Fetch form data in background
    fetchFormData();

    // Initialize transaction date picker
    setTimeout(() => {
      if (transactionDateRef.current) {
        transactionDatePickerRef.current = flatpickr(transactionDateRef.current, {
          dateFormat: 'Y-m-d',
          onChange: (selectedDates) => {
            if (selectedDates[0]) {
              setFormData(prev => ({ ...prev, date: selectedDates[0].toISOString().split('T')[0] }));
            }
          },
        });
      }
    }, 100);
  };

  const handleCloseModal = () => {
    // Destroy transaction date picker
    if (transactionDatePickerRef.current) {
      transactionDatePickerRef.current.destroy();
      transactionDatePickerRef.current = null;
    }
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
      const transactionData: any = {
        account_id: parseInt(formData.account_id),
        type: formData.type,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        tag_ids: formData.tag_ids,
      };
      const categoryId = parseInt(formData.category_id);
      if (categoryId && categoryId > 0) {
        transactionData.category_id = categoryId;
      } else {
        transactionData.category_id = null;
      }
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
          <TransactionHeader
            onFilterClick={handleOpenFilterModal}
            onAddClick={handleOpenModal}
            onClearFilters={clearFilters}
            showAccountFilter={true}
            accounts={accounts}
            selectedAccountId={appliedFilters.account_id}
            onAccountChange={(value) => {
              setAppliedFilters({ ...appliedFilters, account_id: value });
              setFilterData({ ...filterData, account_id: value });
              fetchTransactions(value);
            }}
            hasActiveFilters={!!(appliedFilters.start_date || appliedFilters.end_date || appliedFilters.description || appliedFilters.account_id || appliedFilters.category_id || appliedFilters.tag_ids.length > 0 || appliedFilters.type)}
            showExport={true}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearchSubmit={() => setCurrentPage(1)}
          />
        </div>

        <TransactionTable
          transactions={transactions}
          loading={loading}
          onEdit={handleEditTransaction}
          onCategoryClick={handleCategoryClick}
          onTagClick={handleTagClick}
          selectedCategoryId={appliedFilters.category_id}
          selectedTagIds={appliedFilters.tag_ids}
          showAccount={true}
          showActions={true}
        />

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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
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
                    ref={transactionDateRef}
                    type="text"
                    placeholder="Select date"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category (optional)</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">No category</option>
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

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Filter Transactions
              </h3>
              <button
                onClick={handleCloseFilterModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4L16 16M4 16L16 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                  <input
                    ref={startDateRef}
                    type="text"
                    placeholder="Select start date"
                    value={filterData.start_date}
                    onChange={(e) => setFilterData({ ...filterData, start_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                  <input
                    ref={endDateRef}
                    type="text"
                    placeholder="Select end date"
                    value={filterData.end_date}
                    onChange={(e) => setFilterData({ ...filterData, end_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  value={filterData.description}
                  onChange={(e) => setFilterData({ ...filterData, description: e.target.value })}
                  placeholder="Search by description..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select
                  value={filterData.type}
                  onChange={(e) => setFilterData({ ...filterData, type: e.target.value as 'income' | 'expense' | 'transfer' | '' })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All types</option>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
                <select
                  value={filterData.account_id}
                  onChange={(e) => setFilterData({ ...filterData, account_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All accounts</option>
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
                  value={filterData.category_id}
                  onChange={(e) => setFilterData({ ...filterData, category_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All categories</option>
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
                        checked={filterData.tag_ids.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilterData({ ...filterData, tag_ids: [...filterData.tag_ids, tag.id] });
                          } else {
                            setFilterData({ ...filterData, tag_ids: filterData.tag_ids.filter(id => id !== tag.id) });
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
                onClick={handleClearFilter}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleApplyFilter}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
