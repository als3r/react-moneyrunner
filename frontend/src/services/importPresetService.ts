import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface ImportPreset {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  column_mapping: Record<string, number>;
  date_format: string;
  amount_format: string;
  skip_header_row: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateImportPreset {
  name: string;
  description?: string;
  column_mapping: Record<string, number>;
  date_format?: string;
  amount_format?: string;
  skip_header_row?: boolean;
}

export interface UpdateImportPreset extends CreateImportPreset {
  name: string;
  description?: string;
  column_mapping: Record<string, number>;
  date_format?: string;
  amount_format?: string;
  skip_header_row?: boolean;
}

const importPresetService = {
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get<ImportPreset[]>(`${API_URL}/import-presets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  getById: async (id: number) => {
    const token = localStorage.getItem('token');
    const response = await axios.get<ImportPreset>(`${API_URL}/import-presets/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  create: async (data: CreateImportPreset) => {
    const token = localStorage.getItem('token');
    const response = await axios.post<ImportPreset>(`${API_URL}/import-presets`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  update: async (id: number, data: UpdateImportPreset) => {
    const token = localStorage.getItem('token');
    const response = await axios.put<ImportPreset>(`${API_URL}/import-presets/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  delete: async (id: number) => {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/import-presets/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

export default importPresetService;
