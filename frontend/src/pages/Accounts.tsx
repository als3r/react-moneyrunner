import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import PageMeta from "../components/common/PageMeta";
import Pagination from "../components/Pagination";
import { accountService, Account, AccountFilters, CreateAccount } from "../services/accountService";
import { currencyService, Currency } from "../services/currencyService";
import importPresetService, { ImportPreset } from "../services/importPresetService";
import axios from 'axios';

interface DisplayAccount {
  id: number;
  name: string;
  balance: string;
  initial_balance: string;
  currency: string;
  currency_id: number;
  type: string;
  createdAt: string;
  accountHash: string;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500];

export default function Accounts() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [accounts, setAccounts] = useState<DisplayAccount[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [importPresets, setImportPresets] = useState<ImportPreset[]>([]);
  const [importFormData, setImportFormData] = useState({
    account_id: '',
    preset_id: '',
    file: null as File | null,
  });
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    currency_id: '',
    initial_balance: '0',
    balance: '0',
  });
  const [filterData, setFilterData] = useState({
    name: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
  });

  const fetchAccounts = useCallback(async (nameFilter?: string) => {
    try {
      setLoading(true);
      setError(null);

      const filters: AccountFilters = {
        page: currentPage,
        per_page: itemsPerPage,
      };

      if (nameFilter !== undefined) {
        filters.name = nameFilter;
      } else if (appliedFilters.name) {
        filters.name = appliedFilters.name;
      }

      const response = await accountService.getAll(filters);

      const displayData: DisplayAccount[] = response.data.map((a: Account) => ({
        id: a.id,
        name: a.name,
        balance: `${a.currency.symbol}${Number(a.balance).toFixed(2)}`,
        initial_balance: `${a.currency.symbol}${Number(a.initial_balance || 0).toFixed(2)}`,
        currency: a.currency.code,
        currency_id: a.currency.id,
        type: a.type,
        createdAt: new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        accountHash: a.account_hash,
      }));

      setAccounts(displayData);
      setTotalPages(response.meta.last_page);
    } catch (err) {
      setError('Failed to load accounts');
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, appliedFilters.name]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
      if (e.key === 'Escape' && isFilterModalOpen) {
        handleCloseFilterModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen, isFilterModalOpen]);

  const currentData = accounts;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  const fetchCurrencies = async () => {
    try {
      const data = await currencyService.getAll();
      setCurrencies(data);
    } catch (err) {
      console.error('Error fetching currencies:', err);
    }
  };

  const handleOpenModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      type: 'checking',
      currency_id: '',
      initial_balance: '0',
      balance: '0',
    });
    setIsModalOpen(true);
    // Fetch currencies in background
    fetchCurrencies();
  };

  const handleEditAccount = (account: DisplayAccount) => {
    setEditingId(account.id);
    setFormData({
      name: account.name,
      type: account.type,
      currency_id: account.currency_id.toString(),
      initial_balance: account.initial_balance.replace(/[^0-9.-]/g, ''),
      balance: account.balance.replace(/[^0-9.-]/g, ''),
    });
    setIsModalOpen(true);
    // Fetch currencies in background
    fetchCurrencies();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      type: 'checking',
      currency_id: '',
      initial_balance: '0',
      balance: '0',
    });
  };

  const handleOpenFilterModal = () => {
    setFilterData({ ...appliedFilters });
    setIsFilterModalOpen(true);
  };

  const handleCloseFilterModal = () => {
    setIsFilterModalOpen(false);
  };

  const handleOpenImportModal = async () => {
    setImportError(null);
    setImportResult(null);
    setImportFormData({
      account_id: '',
      preset_id: '',
      file: null,
    });
    setIsImportModalOpen(true);

    // Fetch import presets in background
    try {
      const presets = await importPresetService.getAll();
      setImportPresets(presets);
    } catch (err) {
      console.error('Error fetching import presets:', err);
    }
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportError(null);
    setImportResult(null);
    setImportFormData({
      account_id: '',
      preset_id: '',
      file: null,
    });
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    setImportResult(null);

    if (!importFormData.file || !importFormData.account_id || !importFormData.preset_id) {
      setImportError('Please fill in all fields');
      return;
    }

    setImportLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', importFormData.file);
      formData.append('account_id', importFormData.account_id);
      formData.append('preset_id', importFormData.preset_id);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const token = localStorage.getItem('token');

      const response = await axios.post(`${API_URL}/transactions/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setImportResult(response.data);
      fetchAccounts();
    } catch (err: any) {
      setImportError(err.response?.data?.message || 'Import failed. Please try again.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ ...filterData });
    handleCloseFilterModal();
    fetchAccounts(filterData.name);
  };

  const handleClearFilter = () => {
    setFilterData({
      name: '',
    });
  };

  const clearFilters = () => {
    setAppliedFilters({
      name: '',
    });
    fetchAccounts('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const accountData: CreateAccount = {
        name: formData.name,
        type: formData.type,
        currency_id: parseInt(formData.currency_id),
        balance: parseFloat(formData.balance),
        initial_balance: parseFloat(formData.initial_balance),
      };
      if (editingId) {
        await accountService.update(editingId, accountData);
      } else {
        await accountService.create(accountData);
      }
      setIsSubmitting(false);
      handleCloseModal();
      fetchAccounts();
    } catch (err) {
      console.error('Error saving account:', err);
      alert('Failed to save account. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <>
        <PageMeta
          title="Accounts | MoneyRunner"
          description="View all your accounts"
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
        title="Accounts | MoneyRunner"
        description="View all your accounts"
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Accounts
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage and view all your accounts
            </p>
          </div>
          <div className="flex items-center gap-3">
            {appliedFilters.name && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                Clear filters
              </button>
            )}
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
                  d="M10 5V15M5 10H15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Add Account
            </button>
            <button
              onClick={handleOpenImportModal}
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
                  d="M3 17V3H17V17H3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 8H13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 12H11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Import
            </button>
            <button
              onClick={handleOpenFilterModal}
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
                    Account Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Initial Balance
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actual Balance
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Currency
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Created At
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400">Loading accounts...</p>
                    </TableCell>
                  </TableRow>
                ) : currentData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400">No accounts found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentData.map((account) => (
                    <TableRow key={account.id} className="">
                      <TableCell className="py-3">
                        <button
                          onClick={() => navigate(`/account/${account.accountHash}`)}
                          className="font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400 text-left"
                        >
                          {account.name}
                        </button>
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {account.initial_balance}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {account.balance}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {account.currency}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {account.createdAt}
                      </TableCell>
                      <TableCell className="py-3">
                        <button
                          onClick={() => handleEditAccount(account)}
                          className="text-brand-500 hover:text-brand-600 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

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
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Filter Accounts
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={filterData.name}
                  onChange={(e) => setFilterData({ ...filterData, name: e.target.value })}
                  placeholder="Search by name..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                />
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

      {/* Import Transactions Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Import Transactions
              </h3>
              <button
                onClick={handleCloseImportModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4L16 16M4 16L16 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleImportSubmit}>
              <div className="space-y-4">
                {importError && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                    {importError}
                  </div>
                )}
                {importResult && (
                  <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg dark:bg-green-900/20 dark:text-green-400">
                    Successfully imported {importResult.imported} transactions
                    {importResult.errors.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        {importResult.errors.length} errors occurred
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
                  <select
                    value={importFormData.account_id}
                    onChange={(e) => setImportFormData({ ...importFormData, account_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.currency})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Import Preset</label>
                  <select
                    value={importFormData.preset_id}
                    onChange={(e) => setImportFormData({ ...importFormData, preset_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select preset</option>
                    {importPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name} {preset.description && `- ${preset.description}`}
                      </option>
                    ))}
                  </select>
                  {importPresets.length === 0 && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      No presets available. Create one first to configure CSV column mapping.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFormData({ ...importFormData, file: e.target.files?.[0] || null })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseImportModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50"
                >
                  {importLoading ? 'Importing...' : 'Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editingId ? 'Edit Account' : 'Add Account'}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                    <option value="cash">Cash</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                  <select
                    value={formData.currency_id}
                    onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select currency</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.code} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.initial_balance}
                    onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Actual Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Calculated from initial balance and transactions
                  </p>
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
