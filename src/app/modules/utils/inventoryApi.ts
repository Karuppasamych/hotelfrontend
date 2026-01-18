import { InventoryItem } from '../../types';
import { apiClient, ApiResponse } from './apiClient';

export const inventoryApi = {
  // Get all inventory items
  getAll: (): Promise<ApiResponse<InventoryItem[]>> => {
    return apiClient.get<InventoryItem[]>('/inventory');
  },

  // Get inventory item by ID
  getById: (id: string): Promise<ApiResponse<InventoryItem>> => {
    return apiClient.get<InventoryItem>(`/inventory/${id}`);
  },

  // Create new inventory item
  create: (item: Omit<InventoryItem, 'id'>): Promise<ApiResponse<InventoryItem>> => {
    return apiClient.post<InventoryItem>('/inventory', item);
  },

  // Update inventory item
  update: (id: string, item: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> => {
    return apiClient.put<InventoryItem>(`/inventory/${id}`, item);
  },

  // Delete inventory item
  delete: (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/inventory/${id}`);
  },

  // Get inventory by category
  getByCategory: (category: string): Promise<ApiResponse<InventoryItem[]>> => {
    return apiClient.get<InventoryItem[]>(`/inventory/category/${category}`);
  },

  // Get low stock items
  getLowStock: (): Promise<ApiResponse<InventoryItem[]>> => {
    return apiClient.get<InventoryItem[]>('/inventory/low-stock');
  },

  // Search inventory items
  search: (query: string): Promise<ApiResponse<InventoryItem[]>> => {
    return apiClient.get<InventoryItem[]>(`/inventory/search?q=${encodeURIComponent(query)}`);
  },
};