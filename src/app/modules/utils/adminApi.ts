import { apiClient, ApiResponse } from './apiClient';

export interface CustomCharge {
  id: string;
  name: string;
  percent: number;
  enabled: boolean;
}

export interface AdminSettings {
  service_charge_enabled: string;
  service_charge_percent: string;
  cgst_percent: string;
  sgst_percent: string;
  custom_charges?: string; // JSON string of CustomCharge[]
  role_menu_access?: string;
  [key: string]: string | undefined;
}

export const adminApi = {
  getSettings: (): Promise<ApiResponse<AdminSettings>> => {
    return apiClient.get('/admin/settings');
  },

  updateSettings: (settings: Partial<AdminSettings>): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.put('/admin/settings', settings);
  },
};
