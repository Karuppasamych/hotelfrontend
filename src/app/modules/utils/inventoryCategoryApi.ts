import { apiClient, ApiResponse } from './apiClient';

export interface InventoryCategory {
  id: number;
  name: string;
}

export const inventoryCategoryApi = {
  getAll: (): Promise<ApiResponse<InventoryCategory[]>> => {
    return apiClient.get('/inventory-categories');
  },

  create: (name: string): Promise<ApiResponse<InventoryCategory>> => {
    return apiClient.post('/inventory-categories', { name });
  },

  delete: (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete(`/inventory-categories/${id}`);
  },
};
