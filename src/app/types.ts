export interface InventoryItem {
  id: string;
  product_code: string;
  name: string;
  category: string;
  quantity_available: number;
  prepared_stock: number;
  unit: string;
  price: number;
  minimum_stock: number;
}