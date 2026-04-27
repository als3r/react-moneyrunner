import api from './api';

export interface Tag {
  id: number;
  name: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface TagFilters {
  page?: number;
  per_page?: number;
  name?: string;
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

export const tagService = {
  getAll: async (filters?: TagFilters): Promise<PaginatedResponse<Tag>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get('/tags', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Tag> => {
    const response = await api.get(`/tags/${id}`);
    return response.data;
  },

  create: async (data: Partial<Tag>): Promise<Tag> => {
    const response = await api.post('/tags', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Tag>): Promise<Tag> => {
    const response = await api.put(`/tags/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tags/${id}`);
  },
};
