import { apiClient, ApiResponse } from './apiClient';

export interface KitchenOrderItem {
  id?: number;
  item_name: string;
  quantity: number;
  category?: string;
  notes?: string;
}

export interface KitchenOrder {
  id: number;
  order_number: string;
  table_number: string | null;
  order_type: 'dine-in' | 'parcel';
  number_of_persons: string | null;
  customer_name: string | null;
  mobile_number: string | null;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  created_at: string;
  items: KitchenOrderItem[];
}

export interface CreateKitchenOrderData {
  table_number?: string;
  order_type: string;
  number_of_persons?: string;
  customer_name?: string;
  mobile_number?: string;
  items: { name: string; quantity: number; category?: string }[];
}

export const kitchenApi = {
  create: (data: CreateKitchenOrderData): Promise<ApiResponse<{ id: number; orderNumber: string }>> => {
    return apiClient.post('/kitchen', data);
  },

  getAll: (): Promise<ApiResponse<KitchenOrder[]>> => {
    return apiClient.get('/kitchen');
  },

  getToday: (): Promise<ApiResponse<KitchenOrder[]>> => {
    return apiClient.get('/kitchen/today');
  },

  updateStatus: (id: number, status: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.put(`/kitchen/${id}/status`, { status });
  },

  delete: (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete(`/kitchen/${id}`);
  },

  reduceItemQuantity: (itemName: string, quantity: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.put('/kitchen/reduce-item', { item_name: itemName, quantity });
  },
};
