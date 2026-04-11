import { apiClient, ApiResponse } from './apiClient';

export const draftApi = {
  create: (data: {
    mobile_number: string;
    customer_name: string;
    order_type: string;
    table_number: string;
    number_of_persons: string;
    items: { name: string; price: number; quantity: number; category?: string }[];
  }): Promise<ApiResponse<{ id: number }>> => {
    return apiClient.post('/saved-orders', data);
  },

  getAll: (): Promise<ApiResponse<any[]>> => {
    return apiClient.get('/saved-orders');
  },

  delete: (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete(`/saved-orders/${id}`);
  },

  update: (id: number, data: {
    mobile_number: string;
    customer_name: string;
    order_type: string;
    table_number: string;
    number_of_persons: string;
    items: { name: string; price: number; quantity: number; category?: string }[];
  }): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.put(`/saved-orders/${id}`, data);
  },
};
