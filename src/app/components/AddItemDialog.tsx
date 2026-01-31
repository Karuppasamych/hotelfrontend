import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { InventoryItem } from '../types';

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id'> & { id?: string }) => void;
  editItem?: InventoryItem | null;
}

const CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Dairy',
  'Meat',
  'Grains',
  'Beverages',
  'Snacks',
  'Condiments',
  'Other',
];

const UNITS = ['kg', 'g', 'L', 'ml', 'pieces', 'packs', 'bottles', 'cans'];

export function AddItemDialog({
  isOpen,
  onClose,
  onSave,
  editItem,
}: AddItemDialogProps) {
  const [formData, setFormData] = useState({
    product_code: '',
    name: '',
    category: 'Vegetables',
    quantity_available: '',
    unit: 'kg',
    price: '',
    minimum_stock: '',
  });

  useEffect(() => {
    console.log(editItem,'editItemKK')
    if (editItem) {
      setFormData({
        product_code: editItem?.product_code,
        name: editItem?.name,
        category: editItem?.category,
        quantity_available: editItem?.quantity_available?.toString(),
        unit: editItem?.unit,
        price: editItem?.price?.toString(),
        minimum_stock: editItem?.minimum_stock?.toString(),
      });
    } else {
      setFormData({
        product_code: '',
        name: '',
        category: 'Vegetables',
        quantity_available: '',
        unit: 'kg',
        price: '',
        minimum_stock: '',
      });
    }
  }, [editItem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(editItem && { id: editItem.id }),
      product_code: formData.product_code,
      name: formData.name,
      category: formData.category,
      quantity_available: parseFloat(formData.quantity_available),
      unit: formData.unit,
      price: parseFloat(formData.price),
      minimum_stock: parseFloat(formData.minimum_stock),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {editItem ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Code *
              </label>
              <input
                type="text"
                required
                value={formData.product_code}
                onChange={(e) =>
                  setFormData({ ...formData, product_code: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., MPH001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Tomatoes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.1"
                  value={formData.quantity_available}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity_available: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Unit (₹) 
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stock Level *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.minimum_stock}
                onChange={(e) =>
                  setFormData({ ...formData, minimum_stock: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Alert when stock falls below this level
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/50 font-medium"
            >
              {editItem ? 'Update' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}