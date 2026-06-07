import { apiClient, ApiResponse } from './apiClient';

export interface ManagerTodoItem {
  id: number;
  date: string;
  ingredient_name: string;
  ingredient_id: number | null;
  total_quantity: number;
  used_quantity: number;
  remaining_quantity: number;
  unit: string;
  dish_name: string | null;
  status: 'active' | 'completed' | 'moved';
  created_at: string;
}

export interface ConsolidatedTodoItem {
  ingredient_name: string;
  ingredient_id: number | null;
  unit: string;
  total_quantity: number;
  used_quantity: number;
  remaining_quantity: number;
  dishes: string;
  status: string;
}

export const managerTodoApi = {
  addFromMenu: (data: { date: string; items: { ingredient_name: string; ingredient_id?: number; quantity: number; unit: string; dish_name?: string }[] }): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post('/manager-todo', data);
  },

  getByDate: (date: string): Promise<ApiResponse<ManagerTodoItem[]>> => {
    return apiClient.get(`/manager-todo/date/${date}`);
  },

  getConsolidatedByDate: (date: string): Promise<ApiResponse<ConsolidatedTodoItem[]>> => {
    return apiClient.get(`/manager-todo/consolidated/${date}`);
  },

  deductOnBillPaid: (data: { date?: string; items: { ingredient_name: string; quantity: number; unit: string }[] }): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post('/manager-todo/deduct', data);
  },

  moveToInventory: (id: number, toAvailable?: number, toPrepared?: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.put(`/manager-todo/move/${id}`, { to_available: toAvailable, to_prepared: toPrepared });
  },

  bulkMoveToInventory: (date: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post('/manager-todo/bulk-move', { date });
  },

  bulkMoveSelectedToInventory: (ids: number[]): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post('/manager-todo/bulk-move-selected', { ids });
  },

  updateTotalQuantity: (id: number, newTotal: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.put(`/manager-todo/update-total/${id}`, { new_total: newTotal });
  },

  delete: (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete(`/manager-todo/${id}`);
  },
};
