import { apiClient, ApiResponse } from './apiClient';

export interface ConfirmedMenuDish {
  dish_id: string;
  servings: number;
  is_addon?: boolean;
}

export interface ConfirmedMenuData {
  date: string;
  meal_time: string;
  dishes: ConfirmedMenuDish[];
}

export interface ConfirmedMenuItem {
  id: string;
  date: string;
  timestamp: number;
  mealTime: string;
  status: string;
  dishes: {
    dish: {
      id: string;
      name: string;
      category: string;
      cuisine: string;
      servings: string;
      ingredients: any[];
      instructions: string[];
    };
    servings: number;
    is_addon?: boolean;
  }[];
}

export const confirmedMenuApi = {
  create: (data: ConfirmedMenuData): Promise<ApiResponse<{ id: number; message: string }>> => {
    return apiClient.post('/confirmed-menus', data);
  },

  getAll: (): Promise<ApiResponse<ConfirmedMenuItem[]>> => {
    return apiClient.get('/confirmed-menus');
  },

  getByDate: (date: string): Promise<ApiResponse<any>> => {
    return apiClient.get(`/confirmed-menus/${date}`);
  },

  update: (id: number, data: ConfirmedMenuData): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.put(`/confirmed-menus/${id}`, data);
  },

  updateStatus: (id: number, status: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.put(`/confirmed-menus/${id}/status`, { status });
  },

  delete: (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete(`/confirmed-menus/${id}`);
  },

  reduceServings: (dishName: string, quantity: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.put('/confirmed-menus/reduce-servings', { dish_name: dishName, quantity });
  },
};
