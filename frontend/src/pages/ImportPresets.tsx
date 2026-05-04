import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import PageMeta from "../components/common/PageMeta";
import importPresetService, { ImportPreset } from "../services/importPresetService";

export default function ImportPresets() {
  const [presets, setPresets] = useState<ImportPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    column_mapping: {
      description_column: number;
      amount_column: number;
      debit_column: number;
      credit_column: number;
      date_column: number;
      type_column: number;
    };
    date_format: string;
    amount_format: string;
    skip_header_row: boolean;
  }>({
    name: '',
    description: '',
    column_mapping: {
      description_column: 0,
      amount_column: 1,
      debit_column: -1,
      credit_column: -1,
      date_column: 2,
      type_column: -1,
    },
    date_format: 'Y-m-d',
    amount_format: 'decimal',
    skip_header_row: true,
  });

  const fetchPresets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await importPresetService.getAll();
      setPresets(data);
    } catch (err) {
      setError('Failed to load import presets');
      console.error('Error fetching import presets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleOpenModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      column_mapping: {
        description_column: 0,
        amount_column: 1,
        debit_column: -1,
        credit_column: -1,
        date_column: 2,
        type_column: -1,
      },
      date_format: 'Y-m-d',
      amount_format: 'decimal',
      skip_header_row: true,
    });
    setIsModalOpen(true);
  };

  const handleEditPreset = (preset: ImportPreset) => {
    setEditingId(preset.id);
    setFormData({
      name: preset.name,
      description: preset.description || '',
      column_mapping: {
        description_column: (preset.column_mapping as any).description_column ?? 0,
        amount_column: (preset.column_mapping as any).amount_column ?? 1,
        debit_column: (preset.column_mapping as any).debit_column ?? -1,
        credit_column: (preset.column_mapping as any).credit_column ?? -1,
        date_column: (preset.column_mapping as any).date_column ?? 2,
        type_column: (preset.column_mapping as any).type_column ?? -1,
      },
      date_format: preset.date_format,
      amount_format: preset.amount_format,
      skip_header_row: preset.skip_header_row,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      column_mapping: {
        description_column: 0,
        amount_column: 1,
        debit_column: -1,
        credit_column: -1,
        date_column: 2,
        type_column: -1,
      },
      date_format: 'Y-m-d',
      amount_format: 'decimal',
      skip_header_row: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (editingId) {
        await importPresetService.update(editingId, formData);
      } else {
        await importPresetService.create(formData);
      }
      handleCloseModal();
      fetchPresets();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preset. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePreset = async (id: number) => {
    if (!confirm('Are you sure you want to delete this preset?')) {
      return;
    }

    try {
      await importPresetService.delete(id);
      fetchPresets();
    } catch {
      setError('Failed to delete preset');
    }
  };

  const handleColumnMappingChange = (key: string, value: number) => {
    setFormData({
      ...formData,
      column_mapping: {
        ...formData.column_mapping,
        [key]: value,
      },
    });
  };

  return (
    <>
      <PageMeta title="Import Presets" description="Manage CSV import presets" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Import Presets
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage CSV column mapping configurations for transaction imports
            </p>
          </div>
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
            Add Preset
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Description
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Date Format
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Skip Header
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
                    <TableCell colSpan={6} className="py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400">Loading presets...</p>
                    </TableCell>
                  </TableRow>
                ) : presets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400">No import presets found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  presets.map((preset) => (
                    <TableRow key={preset.id} className="">
                      <TableCell className="py-3">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {preset.name}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                          {preset.description || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                          {preset.date_format}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                          {preset.skip_header_row ? 'Yes' : 'No'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                          {new Date(preset.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditPreset(preset)}
                            className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePreset(preset.id)}
                            className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editingId ? 'Edit Import Preset' : 'Add Import Preset'}
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
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400 mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preset Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Format</label>
                  <select
                    value={formData.date_format}
                    onChange={(e) => setFormData({ ...formData, date_format: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Y-m-d">YYYY-MM-DD (2024-01-15)</option>
                    <option value="m/d/Y">MM/DD/YYYY (01/15/2024)</option>
                    <option value="d/m/Y">DD/MM/YYYY (15/01/2024)</option>
                    <option value="Y/m/d">YYYY/MM/DD (2024/01/15)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount Format</label>
                  <select
                    value={formData.amount_format}
                    onChange={(e) => setFormData({ ...formData, amount_format: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="decimal">Decimal (1000.00)</option>
                    <option value="comma">Comma decimal (1.000,00)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="skip_header"
                    checked={formData.skip_header_row}
                    onChange={(e) => setFormData({ ...formData, skip_header_row: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="skip_header" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Skip first row (header)
                  </label>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Column Mapping (0-indexed)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description Column</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.column_mapping.description_column}
                        onChange={(e) => handleColumnMappingChange('description_column', parseInt(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount Column (single column)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.column_mapping.amount_column}
                        onChange={(e) => handleColumnMappingChange('amount_column', parseInt(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Debit Column (expenses)</label>
                      <input
                        type="number"
                        min="-1"
                        value={formData.column_mapping.debit_column}
                        onChange={(e) => handleColumnMappingChange('debit_column', parseInt(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Credit Column (income)</label>
                      <input
                        type="number"
                        min="-1"
                        value={formData.column_mapping.credit_column}
                        onChange={(e) => handleColumnMappingChange('credit_column', parseInt(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Column</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.column_mapping.date_column}
                        onChange={(e) => handleColumnMappingChange('date_column', parseInt(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type Column (-1 for auto)</label>
                      <input
                        type="number"
                        min="-1"
                        value={formData.column_mapping.type_column}
                        onChange={(e) => handleColumnMappingChange('type_column', parseInt(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Use either Amount Column (single) OR Debit/Credit columns (separate). Set to -1 to disable.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
