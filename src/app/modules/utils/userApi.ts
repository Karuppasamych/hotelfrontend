import { apiClient, ApiResponse } from './apiClient';

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export const userApi = {
  getAll: (): Promise<ApiResponse<User[]>> => {
    return apiClient.get('/auth/users');
  },

  create: (data: { username: string; password: string; name: string; role: string }): Promise<ApiResponse<{ user: User }>> => {
    return apiClient.post('/auth/register', data);
  },

  update: (id: number, data: { name?: string; role?: string; is_active?: boolean; password?: string }): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.put(`/auth/users/${id}`, data);
  },

  delete: (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete(`/auth/users/${id}`);
  },
};
