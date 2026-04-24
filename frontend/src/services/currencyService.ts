import api from './api';

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  created_at: string;
  updated_at: string;
}

export const currencyService = {
  getAll: async (): Promise<Currency[]> => {
    const response = await api.get('/currencies');
    return response.data;
  },

  getById: async (id: number): Promise<Currency> => {
    const response = await api.get(`/currencies/${id}`);
    return response.data;
  },

  create: async (data: { code: string; name: string; symbol: string }): Promise<Currency> => {
    const response = await api.post('/currencies', data);
    return response.data;
  },

  update: async (id: number, data: { code: string; name: string; symbol: string }): Promise<Currency> => {
    const response = await api.put(`/currencies/${id}`, data);
    return response.data;
  },
};
