import api from './api';

export interface Account {
  id: number;
  name: string;
  balance: number;
  initial_balance: number;
  currency_id: number;
  currency: {
    id: number;
    code: string;
    symbol: string;
  };
  account_hash: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface AccountFilters {
  page?: number;
  per_page?: number;
  name?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  search?: string;
  type?: 'income' | 'expense' | 'transfer';
  category_id?: number;
  tag_ids?: number[];
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

export interface CreateAccount {
  name: string;
  type: string;
  currency_id: number;
  balance: number;
  initial_balance: number;
}

export const accountService = {
  getAll: async (filters?: AccountFilters): Promise<PaginatedResponse<Account>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get('/accounts', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Account> => {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  create: async (data: CreateAccount): Promise<Account> => {
    const response = await api.post('/accounts', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Account>): Promise<Account> => {
    const response = await api.put(`/accounts/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/accounts/${id}`);
  },

  getByHash: async (accountHash: string, filters?: AccountFilters, signal?: AbortSignal): Promise<{
    account: Account;
    transactions: PaginatedResponse<{
      id: number;
      description: string;
      amount: number;
      date: string;
      type: string;
      category: {
        id: number;
        name: string;
      };
      tags: Array<{
        id: number;
        name: string;
      }>;
    }>;
  }> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/account/${accountHash}`, { params, signal });
    return response.data;
  },
};
