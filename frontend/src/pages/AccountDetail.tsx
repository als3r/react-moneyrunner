import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import PageMeta from "../components/common/PageMeta";
import TransactionTable, { Transaction } from "../components/TransactionTable";
import TransactionHeader from "../components/TransactionHeader";
import { accountService, Account } from "../services/accountService";
import { transactionService, CreateTransaction } from "../services/transactionService";
import { categoryService, Category } from "../services/categoryService";
import { tagService, Tag } from "../services/tagService";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500];

export default function AccountDetail() {
  const { accountHash } = useParams<{ accountHash: string }>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
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
    type: '',
    category_id: '',
    tag_ids: [] as number[],
  });
  const [appliedFilters, setAppliedFilters] = useState({
    start_date: '',
    end_date: '',
    description: '',
    type: '',
    category_id: '',
    tag_ids: [] as number[],
  });

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const startDatePickerRef = useRef<flatpickr.Instance | null>(null);
  const endDatePickerRef = useRef<flatpickr.Instance | null>(null);
  const transactionDateRef = useRef<HTMLInputElement>(null);
  const transactionDatePickerRef = useRef<flatpickr.Instance | null>(null);

  const fetchAccountData = useCallback(async () => {
    if (!accountHash) return;

    try {
      setLoading(true);
      setError(null);

      const response = await accountService.getByHash(accountHash, {
        page: currentPage,
        per_page: itemsPerPage,
      });

      const accountData = response.account;
      setAccount(accountData);
      const displayData: Transaction[] = response.transactions.data.map((t) => ({
        id: t.id,
        description: t.description,
        amount: `${accountData.currency.symbol}${Number(t.amount).toFixed(2)}`,
        date: t.date.split('T')[0],
        type: t.type as 'income' | 'expense' | 'transfer',
        category: t.category.name,
        categoryId: t.category.id,
        account: accountData.name,
        accountId: accountData.id,
        tags: t.tags.map(tag => tag.name),
        tagIds: t.tags.map(tag => tag.id),
      }));

      setTransactions(displayData);
      setTotalPages(response.transactions.meta.last_page);
    } catch (err) {
      setError('Failed to load account data');
      console.error('Error fetching account data:', err);
    } finally {
      setLoading(false);
    }
  }, [accountHash, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
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
    setCurrentPage(1);
  };

  const handleOpenFilterModal = () => {
    setFilterData({ ...appliedFilters });
    setIsFilterModalOpen(true);

    // Fetch form data in background
    fetchFormData();

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
    handleCloseFilterModal();
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setFilterData({
      start_date: '',
      end_date: '',
      description: '',
      type: '',
      category_id: '',
      tag_ids: [],
    });
  };

  const clearFilters = () => {
    setAppliedFilters({
      start_date: '',
      end_date: '',
      description: '',
      type: '',
      category_id: '',
      tag_ids: [],
    });
    setCurrentPage(1);
  };

  const fetchFormData = async () => {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        categoryService.getAll({ page: 1, per_page: 100 }),
        tagService.getAll({ page: 1, per_page: 100 }),
      ]);
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
      account_id: account?.id?.toString() || '',
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
      fetchAccountData();
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
          title="Account Detail | MoneyRunner"
          description="View account details and transactions"
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </>
    );
  }

  if (!account) {
    return (
      <>
        <PageMeta
          title="Account Detail | MoneyRunner"
          description="View account details and transactions"
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`${account.name} | MoneyRunner`}
        description="View account details and transactions"
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/accounts')}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2"
            >
              ← Back to Accounts
            </button>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              {account.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {account.type} • {account.currency.code}
            </p>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Balance</p>
              <p className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                {account.currency.symbol}{Number(account.balance).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Currency</p>
              <p className="text-lg font-medium text-gray-800 dark:text-white/90">
                {account.currency.code} ({account.currency.symbol})
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Account Hash</p>
              <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                {account.account_hash}
              </p>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Transactions
            </h3>
            <TransactionHeader
              onFilterClick={handleOpenFilterModal}
              onAddClick={handleOpenModal}
              showAccountFilter={false}
              showExport={false}
            />
          </div>
          <TransactionTable
            transactions={transactions}
            loading={loading}
            showAccount={false}
            showActions={false}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
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
                  <input
                    type="text"
                    value={account?.name || ''}
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-600 dark:text-gray-400"
                  />
                  <input type="hidden" value={formData.account_id} />
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
                onClick={handleClearFilter}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Clear
              </button>
              <button
                onClick={handleApplyFilter}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
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
