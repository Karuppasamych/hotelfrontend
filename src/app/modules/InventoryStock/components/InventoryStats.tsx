import { Package2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { InventoryItem } from '../../../types';

interface InventoryStatsProps {
  inventory: InventoryItem[];
}

export function InventoryStats({ inventory }: InventoryStatsProps) {
  const lowStockCount = inventory.filter(
    (item) => item.quantity_available <= item.minimum_stock && item.quantity_available > 0
  ).length;

  const outOfStockCount = inventory.filter((item) => item.quantity_available === 0).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Items Card */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
        <div className="relative bg-white/10 backdrop-blur-md border-2 border-blue-400/30 rounded-xl p-4 hover:border-blue-400/50 transition-all duration-300 hover:scale-105">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 rounded-full mb-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wide">Total</span>
              </div>
              <h3 className="text-3xl font-black text-white mb-0.5 group-hover:text-blue-300 transition-colors">
                {inventory.length}
              </h3>
              <p className="text-xs text-gray-300 font-medium">Total Products</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-blue-500/30 group-hover:rotate-12 transition-all duration-500">
              <Package2 className="size-6 text-white" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-1000" style={{width: '100%'}}></div>
            </div>
            <span className="text-xs font-bold text-blue-300">100%</span>
          </div>
        </div>
      </div>

      {/* In Stock Card */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
        <div className="relative bg-white/10 backdrop-blur-md border-2 border-green-400/30 rounded-xl p-4 hover:border-green-400/50 transition-all duration-300 hover:scale-105">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-full mb-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-green-300 uppercase tracking-wide">Healthy</span>
              </div>
              <h3 className="text-3xl font-black text-white mb-0.5 group-hover:text-green-300 transition-colors">
                {inventory.length - outOfStockCount - lowStockCount}
              </h3>
              <p className="text-xs text-gray-300 font-medium">Items In Stock</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-green-500/30 group-hover:rotate-12 transition-all duration-500">
              <CheckCircle className="size-6 text-white" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000" style={{width: `${((inventory.length - outOfStockCount - lowStockCount) / inventory.length) * 100}%`}}></div>
            </div>
            <span className="text-xs font-bold text-green-300">
              {Math.round(((inventory.length - outOfStockCount - lowStockCount) / inventory.length) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Low Stock Card */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
        <div className="relative bg-white/10 backdrop-blur-md border-2 border-amber-400/30 rounded-xl p-4 hover:border-amber-400/50 transition-all duration-300 hover:scale-105">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 rounded-full mb-2">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">Warning</span>
              </div>
              <h3 className="text-3xl font-black text-white mb-0.5 group-hover:text-amber-300 transition-colors">
                {lowStockCount}
              </h3>
              <p className="text-xs text-gray-300 font-medium">Low Stock Alert</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-amber-500/30 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
              <AlertTriangle className="size-6 text-white animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000" style={{width: inventory.length > 0 ? `${(lowStockCount / inventory.length) * 100}%` : '0%'}}></div>
            </div>
            <span className="text-xs font-bold text-amber-300">
              {inventory.length > 0 ? Math.round((lowStockCount / inventory.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Out of Stock Card */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
        <div className="relative bg-white/10 backdrop-blur-md border-2 border-red-400/30 rounded-xl p-4 hover:border-red-400/50 transition-all duration-300 hover:scale-105">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/20 rounded-full mb-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping"></div>
                <span className="text-xs font-bold text-red-300 uppercase tracking-wide">Critical</span>
              </div>
              <h3 className="text-3xl font-black text-white mb-0.5 group-hover:text-red-300 transition-colors">
                {outOfStockCount}
              </h3>
              <p className="text-xs text-gray-300 font-medium">Out of Stock</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-red-500/30 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
              <XCircle className="size-6 text-white" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-1000" style={{width: inventory.length > 0 ? `${(outOfStockCount / inventory.length) * 100}%` : '0%'}}></div>
            </div>
            <span className="text-xs font-bold text-red-300">
              {inventory.length > 0 ? Math.round((outOfStockCount / inventory.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}