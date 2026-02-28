import { apiClient, ApiResponse } from './apiClient';

export interface Cuisine {
  id: number;
  cuisine_name: string;
  cuisine_image: string;
  created_at?: string;
  updated_at?: string;
}

export const cuisineApi = {
  // Get all cuisines
  getAll: (): Promise<ApiResponse<Cuisine[]>> => {
    return apiClient.get<Cuisine[]>('/cuisines');
  },

  // Create new cuisine
  create: (data: { cuisine_name: string; cuisine_image: string }): Promise<ApiResponse<Cuisine>> => {
    return apiClient.post<Cuisine>('/cuisines', data);
  },

  // Update cuisine
  update: (id: number, data: { cuisine_name: string; cuisine_image: string }): Promise<ApiResponse<Cuisine>> => {
    return apiClient.put<Cuisine>(`/cuisines/${id}`, data);
  },

  // Delete cuisine
  delete: (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/cuisines/${id}`);
  },
};
