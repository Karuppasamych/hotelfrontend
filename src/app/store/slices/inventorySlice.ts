import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../modules/utils/apiClient';
import { InventoryItem } from '../../types';

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  items: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async (_, { rejectWithValue }) => {
    const response = await apiClient.get<InventoryItem[]>('/inventory');
    if (response.success && response.data) {
      return response.data;
    }
    return rejectWithValue(response.error || 'Failed to fetch inventory');
  }
);

export const addInventoryItem = createAsyncThunk(
  'inventory/addItem',
  async (item: Omit<InventoryItem, 'id'>, { rejectWithValue }) => {
    const response = await apiClient.post<InventoryItem>('/inventory', item);
    if (response.success && response.data) {
      return response.data;
    }
    return rejectWithValue(response.error || 'Failed to add item');
  }
);

export const updateInventoryItem = createAsyncThunk(
  'inventory/updateItem',
  async ({ id, data }: { id: string; data: Partial<InventoryItem> }, { rejectWithValue }) => {
    const response = await apiClient.put<InventoryItem>(`/inventory/${id}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    return rejectWithValue(response.error || 'Failed to update item');
  }
);

export const deleteInventoryItem = createAsyncThunk(
  'inventory/deleteItem',
  async (id: string, { rejectWithValue }) => {
    const response = await apiClient.delete(`/inventory/${id}`);
    if (response.success) {
      return id;
    }
    return rejectWithValue(response.error || 'Failed to delete item');
  }
);

// Slice
const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Inventory
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action: PayloadAction<InventoryItem[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Item
      .addCase(addInventoryItem.fulfilled, (state, action: PayloadAction<InventoryItem>) => {
        state.items.push(action.payload);
      })
      .addCase(addInventoryItem.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update Item
      .addCase(updateInventoryItem.fulfilled, (state, action: PayloadAction<InventoryItem>) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateInventoryItem.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete Item
      .addCase(deleteInventoryItem.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(deleteInventoryItem.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = inventorySlice.actions;
export default inventorySlice.reducer;
