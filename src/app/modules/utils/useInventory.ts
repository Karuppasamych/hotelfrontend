import { useState, useEffect } from 'react';
import { InventoryItem } from '../../types';
import { inventoryApi } from './inventoryApi';
import { ApiResponse } from './apiClient';

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryApi.getAll();
      if (response.success && response.data) {
        setInventory(response.data);
      } else {
        setError(response.error || 'Failed to fetch inventory');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: Omit<InventoryItem, 'id'>) => {
    setLoading(true);
    try {
      const response = await inventoryApi.create(item);
      if (response.success && response.data) {
        setInventory(prev => [...prev, response.data!]);
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to add item');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const error = 'Failed to add item';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, item: Partial<InventoryItem>) => {
    setLoading(true);
    try {
      const response = await inventoryApi.update(id, item);
      if (response.success && response.data) {
        setInventory(prev => 
          prev.map(i => i.id === id ? response.data! : i)
        );
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Failed to update item');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const error = 'Failed to update item';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    setLoading(true);
    try {
      const response = await inventoryApi.delete(id);
      if (response.success) {
        setInventory(prev => prev.filter(i => i.id !== id));
        return { success: true };
      } else {
        setError(response.error || 'Failed to delete item');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const error = 'Failed to delete item';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return {
    inventory,
    loading,
    error,
    fetchInventory,
    addItem,
    updateItem,
    deleteItem,
    setError
  };
}

export function useInventorySearch() {
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await inventoryApi.search(query);
      if (response.success && response.data) {
        setResults(response.data);
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, search };
}

export function useLowStock() {
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLowStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryApi.getLowStock();
      if (response.success && response.data) {
        setLowStockItems(response.data);
      } else {
        setError(response.error || 'Failed to fetch low stock items');
      }
    } catch (err) {
      setError('Failed to fetch low stock items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  return { lowStockItems, loading, error, fetchLowStock };
}