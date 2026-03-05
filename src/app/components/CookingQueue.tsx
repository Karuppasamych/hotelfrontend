import React, { useMemo } from 'react';
import { Dish } from '../modules/RecipeCalculatory/mockData';
import { ClipboardList, Clock, CheckCircle2, ChefHat, Calendar, Printer, Hash, Globe, Edit3 } from 'lucide-react';
import { format } from 'date-fns';

export interface ConfirmedMenu {
  id: string;
  date: string;
  timestamp: number;
  dishes: { dish: Dish; servings: number }[];
}

interface CookingQueueProps {
  confirmedMenus: ConfirmedMenu[];
  onEdit: (date: string, dishes: { dish: Dish; servings: number }[]) => void;
}

export const CookingQueue: React.FC<CookingQueueProps> = ({ confirmedMenus, onEdit }) => {
  if (confirmedMenus.length === 0) return null;
console.log(confirmedMenus,'CONFIRMEEEED')
  // Group menus by Date first
  const groupedByDate = useMemo(() => {
    const groups: Record<string, { date: string, menus: ConfirmedMenu[] }> = {};
    
    confirmedMenus.forEach(menu => {
      if (!groups[menu.date]) {
        groups[menu.date] = { date: menu.date, menus: [] };
      }
      groups[menu.date].menus.push(menu);
    });
    
    // Sort dates descending (newest first)
    return Object.values(groups).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [confirmedMenus]);

  // For a specific date, merge all dishes from all menus
  const getMergedDishesForDate = (menus: ConfirmedMenu[]) => {
    const dishMap = new Map<string, { dish: Dish; servings: number }>();
    
    menus.forEach(menu => {
      menu.dishes.forEach(item => {
        const existing = dishMap.get(item.dish.id);
        if (existing) {
          existing.servings += item.servings;
        } else {
          // Clone to avoid mutation issues
          dishMap.set(item.dish.id, { ...item });
        }
      });
    });
    
    return Array.from(dishMap.values());
  };

  const groupDishesByCuisine = (dishes: { dish: Dish; servings: number }[]) => {
    return dishes.reduce((acc, item) => {
      const cuisine = item.dish.cuisine || 'Other';
      if (!acc[cuisine]) {
        acc[cuisine] = [];
      }
      acc[cuisine].push(item);
      return acc;
    }, {} as Record<string, typeof dishes>);
  };

  return (
    <div className="mt-8 mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-2.5 rounded-xl border border-emerald-200 shadow-sm">
            <ClipboardList className="h-6 w-6 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-stone-800 tracking-tight">Production Queue</h2>
            <p className="text-sm text-stone-500 font-medium">Daily kitchen orders grouped by date</p>
          </div>
        </div>
        <span className="bg-white text-stone-600 text-sm font-bold px-4 py-2 rounded-full border border-stone-200 shadow-sm flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {Object.keys(groupedByDate).length} Active Dates
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {groupedByDate.map((group, index) => {
            const mergedDishes = getMergedDishesForDate(group.menus);
            const groupedDishes = groupDishesByCuisine(mergedDishes);
            const totalServings = mergedDishes.reduce((acc, item) => acc + item.servings, 0);
            
            return (
              <div
                key={group.date}
                className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Ticket Header */}
                <div className="bg-stone-50 border-b border-stone-200 p-5 flex justify-between items-start relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400 group-hover:bg-orange-500 transition-colors" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">
                      <Hash className="h-3 w-3" />
                      <span>{group.menus.length} Batch{group.menus.length > 1 ? 'es' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Calendar className="h-4 w-4 text-emerald-600" />
                       <span className="font-bold text-stone-800 text-lg">{format(new Date(group.date), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                     <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500 bg-white px-2 py-1 rounded-md border border-stone-200 shadow-sm">
                      <Clock className="h-3.5 w-3.5 text-orange-500" />
                      Last: {format(Math.max(...group.menus.map(m => m.timestamp)), 'h:mm a')}
                    </div>
                  </div>
                </div>

                {/* Ticket Body */}
                <div className="p-5 flex-1 space-y-6">
                  {Object.entries(groupedDishes).map(([cuisine, items], groupIdx) => (
                    <div key={cuisine}>
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="h-3.5 w-3.5 text-stone-400" />
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">{cuisine} Cuisine</span>
                        <div className="h-px bg-stone-100 flex-1"></div>
                      </div>
                      
                      <ul className="space-y-3">
                        {items.map(({ dish, servings }, idx) => (
                          <li key={`${group.date}-${dish.id}`} className="flex justify-between items-center group/item bg-stone-50/50 p-2 rounded-lg border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                            <div className="flex gap-2.5 items-center">
                              <div className="h-5 w-5 rounded bg-white text-stone-400 flex items-center justify-center text-[10px] font-bold border border-stone-200 shadow-sm shrink-0">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-bold text-stone-700 text-xs leading-tight group-hover/item:text-emerald-700 transition-colors">
                                  {dish.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-stone-200">
                              <span className="text-sm font-bold text-stone-800 leading-none">{servings}</span>
                              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Srvs</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                
                {/* Ticket Footer */}
                <div className="px-5 py-4 bg-stone-50/80 border-t border-stone-100 flex justify-between items-center mt-auto">
                   <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                        <ChefHat className="h-4 w-4 text-emerald-700" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-emerald-700 uppercase">Total: {totalServings}</span>
                        <span className="text-[10px] text-emerald-600/70 font-medium">Servings</span>
                      </div>
                   </div>
                   
                   <div className="flex gap-2">
                      <button 
                        onClick={() => onEdit(group.date, mergedDishes)}
                        className="text-stone-500 hover:text-blue-600 hover:bg-blue-50 border border-stone-200 hover:border-blue-200 bg-white px-3 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm" 
                        title="Edit Menu"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button className="text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 p-2 rounded-lg transition-all" title="Print Ticket">
                          <Printer className="h-5 w-5" />
                      </button>
                   </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};