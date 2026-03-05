import { apiClient } from './apiClient';

export interface ConfirmedMenuData {
  date: string;
  dishes: {
    dish_id: string;
    servings: number;
  }[];
}

export const confirmedMenuApi = {
  create: async (data: ConfirmedMenuData) => {
    return apiClient.post('/confirmed-menus', data);
  },

  getByDate: async (date: string) => {
    return apiClient.get(`/confirmed-menus/${date}`);
  },

  update: async (id: number, data: ConfirmedMenuData) => {
    return apiClient.put(`/confirmed-menus/${id}`, data);
  },

  delete: async (id: number) => {
    return apiClient.delete(`/confirmed-menus/${id}`);
  },

  getAll: async () => {
    return apiClient.get('/confirmed-menus');
  }
};
