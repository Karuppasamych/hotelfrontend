import { apiClient, ApiResponse } from './apiClient';

export interface AdminSettings {
  service_charge_enabled: string;
  service_charge_percent: string;
  cgst_percent: string;
  sgst_percent: string;
}

export const adminApi = {
  getSettings: (): Promise<ApiResponse<AdminSettings>> => {
    return apiClient.get('/admin/settings');
  },

  updateSettings: (settings: Partial<AdminSettings>): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.put('/admin/settings', settings);
  },
};
