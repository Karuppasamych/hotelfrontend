
import React, { useMemo, useState } from 'react';
import { Dish, Ingredient } from '../modules/RecipeCalculatory/mockData';
import { Package, CheckCircle2, AlertTriangle, XCircle, BarChart3, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface InventoryPanelProps {
  selectedDishes: { dish: Dish; servings: number }[];
  inventory: Ingredient[];
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ selectedDishes, inventory }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };
  
  const inventoryStatus = useMemo(() => {
    const requirements = new Map<string, number>();

    selectedDishes.forEach(({ dish, servings }) => {
      dish.ingredients.forEach((req) => {
        const perServing = req.amount / parseInt(dish.servings || '1');
        const totalRequired = perServing * servings;
        
        // Match by ingredient ID
        const inventoryItem = inventory.find(inv => 
          String(inv.id) === String(req.ingredientId)
        );
        
        if (inventoryItem) {
          // Convert units if needed
          let convertedRequired = totalRequired;
          const reqUnit = (req.unit || '').toLowerCase();
          const invUnit = inventoryItem.unit.toLowerCase();
          
          // Weight conversions
          if (reqUnit === 'g' && invUnit === 'kg') convertedRequired = totalRequired / 1000;
          else if (reqUnit === 'kg' && invUnit === 'g') convertedRequired = totalRequired * 1000;
          else if (reqUnit === 'oz' && invUnit === 'g') convertedRequired = totalRequired * 28.3495;
          else if (reqUnit === 'g' && invUnit === 'oz') convertedRequired = totalRequired / 28.3495;
          else if (reqUnit === 'lb' && invUnit === 'kg') convertedRequired = totalRequired * 0.453592;
          else if (reqUnit === 'kg' && invUnit === 'lb') convertedRequired = totalRequired / 0.453592;
          // Volume conversions
          else if (reqUnit === 'ml' && invUnit === 'l') convertedRequired = totalRequired / 1000;
          else if (reqUnit === 'l' && invUnit === 'ml') convertedRequired = totalRequired * 1000;
          else if (reqUnit === 'cup' && invUnit === 'ml') convertedRequired = totalRequired * 236.588;
          else if (reqUnit === 'ml' && invUnit === 'cup') convertedRequired = totalRequired / 236.588;
          
          const current = requirements.get(String(inventoryItem.id)) || 0;
          requirements.set(String(inventoryItem.id), current + convertedRequired);
        }
      });
    });

    return inventory.map((item) => {
      const required = requirements.get(String(item.id)) || 0;
      const available = parseFloat(String(item.stock));
      const shortage = required - available;
      
      let status: 'sufficient' | 'low' | 'insufficient' = 'sufficient';
      if (shortage > 0) status = 'insufficient';
      else if (available - required < available * 0.2 && required > 0) status = 'low';

      return {
        ...item,
        stock: available,
        required,
        status,
        shortage: shortage > 0 ? shortage : 0,
        coveragePercent: required > 0 ? Math.min(100, (available / required) * 100) : 100
      };
    }).filter(item => item.required > 0).sort((a, b) => {
      const priority = { insufficient: 0, low: 1, sufficient: 2 };
      return priority[a.status] - priority[b.status];
    });
  }, [selectedDishes, inventory]);

  const hasShortages = inventoryStatus.some(i => i.status === 'insufficient');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-orange-100 flex justify-between items-center bg-orange-50">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-stone-800 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Stock Availability
          </h2>
          <button
            onClick={handleRefresh}
            className={clsx(
              "p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              isRefreshing && "animate-spin text-blue-600 bg-blue-50"
            )}
            title="Refresh Inventory Status"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        {inventoryStatus.length > 0 && (
           hasShortages ? (
            <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Action Required
            </span>
          ) : (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Stock Secured
            </span>
          )
        )}
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin max-h-[500px] lg:max-h-full">
        {inventoryStatus.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-stone-400 p-8">
            <BarChart3 className="h-12 w-12 text-stone-200 mb-4" />
            <p className="font-medium text-stone-500">No active requirements</p>
            <p className="text-sm mt-1">Add items to the menu to run inventory checks.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-stone-50 text-stone-500 text-xs font-bold uppercase tracking-wider border-b border-stone-200 sticky top-0 z-10 backdrop-blur-sm bg-stone-50/90">
              <tr>
                <th className="px-5 py-3.5">Item</th>
                <th className="px-5 py-3.5 text-right">Required</th>
                <th className="px-5 py-3.5 text-right">Available</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
                {inventoryStatus.map((item) => (
                  <tr 
                    key={`${item.id}-${item.required}`}
                    className={clsx(
                      "hover:bg-stone-50 transition-colors group relative",
                      item.status === 'insufficient' ? "bg-rose-50/30" : ""
                    )}
                  >
                    <td className="px-5 py-3.5 font-semibold text-stone-700">
                      {item.name}
                      {item.status !== 'sufficient' && (
                         <div className="w-full bg-stone-100 rounded-full h-1 mt-1.5 overflow-hidden">
                            <div 
                              className={clsx("h-full rounded-full transition-all duration-500", 
                                item.status === 'insufficient' ? "bg-rose-500" : "bg-amber-500"
                              )} 
                              style={{ width: `${item.coveragePercent}%` }}
                            />
                         </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-stone-800">
                      {item.required.toFixed(1)} <span className="text-stone-400 text-xs font-sans font-normal ml-0.5">{item.unit}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-stone-600">
                      {item.stock.toFixed(1)} <span className="text-stone-400 text-xs font-sans ml-0.5">{item.unit}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div>
                        {item.status === 'sufficient' && (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                          </span>
                        )}
                        {item.status === 'low' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            <AlertTriangle className="h-3.5 w-3.5" /> Low
                          </div>
                        )}
                        {item.status === 'insufficient' && (
                          <div className="flex flex-col items-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                              <XCircle className="h-3.5 w-3.5" /> Shortage
                            </div>
                            <span className="text-[10px] text-rose-600 font-bold mt-1">
                              -{item.shortage.toFixed(1)} {item.unit}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
