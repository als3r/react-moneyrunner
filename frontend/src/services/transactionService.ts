import api from './api';

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  notes?: string;
  receipt?: string;
  account: {
    id: number;
    name: string;
    currency: {
      id: number;
      code: string;
      symbol: string;
    };
  };
  category: {
    id: number;
    name: string;
  };
  tags: {
    id: number;
    name: string;
    color?: string;
  }[];
}

export interface CreateTransaction {
  account_id: number;
  category_id: number;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  amount: number;
  date: string;
  notes?: string;
  receipt?: string;
  tag_ids?: number[];
}

export interface TransactionFilters {
  start_date?: string;
  end_date?: string;
  description?: string;
  search?: string;
  type?: 'income' | 'expense' | 'transfer';
  account_id?: number;
  category_id?: number;
  tag_ids?: number[];
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export const transactionService = {
  getAll: async (filters?: TransactionFilters, signal?: AbortSignal): Promise<PaginatedResponse<Transaction>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    const response = await api.get('/transactions', { params, signal });
    return response.data;
  },

  getById: async (id: number): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  create: async (data: CreateTransaction): Promise<Transaction> => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Transaction>): Promise<Transaction> => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },
};
