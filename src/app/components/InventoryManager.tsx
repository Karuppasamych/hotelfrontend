import React from 'react';
import { Package, Sparkles, ChevronDown, ArrowRight } from 'lucide-react';
import { InventoryItem } from '@/app/types';
import { useNavigate } from 'react-router-dom';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onUpdateStock: (ingredientName: string, quantity_available: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function InventoryManager({ inventory, onUpdateStock, isOpen, onToggle }: InventoryManagerProps) {
  const navigate = useNavigate();
  const inStockCount = inventory.filter(item => item.quantity_available > 0).length;
  const totalCount = inventory.length;
  const stockPercentage = Math.round((inStockCount / totalCount) * 100);

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 blur-xl opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity"></div>
      <div className="relative bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden transition-all hover:shadow-2xl hover:border-indigo-200">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between p-6 hover:bg-gradient-to-r hover:from-indigo-50 hover:via-purple-50 hover:to-pink-50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 blur-md opacity-50 rounded-2xl"></div>
              <div className="relative w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
                <Package className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-left">
              <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2">
                Inventory Stock Manager
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </h3>
              <p className="text-gray-600 mt-1 font-medium">Manage your available ingredients</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-gray-500 font-semibold mb-1">Stock Status</div>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${
                  stockPercentage === 100 ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600' :
                  stockPercentage >= 50 ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600' :
                  'text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600'
                }`}>
                  {inStockCount} / {totalCount}
                </span>
                <div className="relative">
                  <div className={`absolute inset-0 blur-md opacity-50 rounded-full ${
                    stockPercentage === 100 ? 'bg-emerald-400' :
                    stockPercentage >= 50 ? 'bg-amber-400' :
                    'bg-red-400'
                  }`}></div>
                  <span className={`relative px-3 py-1.5 rounded-full text-sm font-bold shadow-lg ${
                    stockPercentage === 100 ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' :
                    stockPercentage >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' :
                    'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                  }`}>
                    {stockPercentage}%
                  </span>
                </div>
              </div>
            </div>
            <ChevronDown className={`w-6 h-6 text-indigo-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <div className="border-t-2 border-gray-100 p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-center">
            {/* Main message */}
            <div className="mb-6">
              <p className="text-gray-700 font-semibold text-lg mb-2">
                View and manage your complete inventory stock
              </p>
              <p className="text-gray-600 text-sm">
                Access the full inventory management system to track all available ingredients and their stock levels
              </p>
            </div>

            {/* Navigation Button */}
            <button
              className="relative group/btn inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
              onClick={() => navigate('/inventory')}
            >
              <Package className="w-6 h-6" />
              <span>Go to Inventory Stock Management Page</span>
              <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-20 rounded-2xl transition-opacity"></div>
            </button>

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold mb-1">Total Items</p>
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{totalCount}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold mb-1">In Stock</p>
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">{inStockCount}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold mb-1">Out of Stock</p>
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">{totalCount - inStockCount}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}