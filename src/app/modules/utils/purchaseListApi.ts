import { apiClient } from './apiClient';

export const purchaseListApi = {
  create: async (data: { item_name: string; quantity: number; unit: string; date: string }) => {
    return apiClient.post('/purchase-list', data);
  },

  getByDate: async (date: string) => {
    return apiClient.get(`/purchase-list/${date}`);
  },

  getAll: async () => {
    return apiClient.get('/purchase-list');
  },

  updateStatus: async (ids: number[], status: string = 'purchased') => {
    return apiClient.put('/purchase-list/status', { ids, status });
  },

  update: async (id: number, data: { item_name: string; quantity: number; unit: string }) => {
    return apiClient.put(`/purchase-list/${id}`, data);
  },

  delete: async (id: number) => {
    return apiClient.delete(`/purchase-list/${id}`);
  }
};
