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

  delete: async (id: number) => {
    return apiClient.delete(`/purchase-list/${id}`);
  }
};
