import { useMemo, useState, useEffect } from 'react';
import { Dish } from '../modules/RecipeCalculatory/mockData';
import { ClipboardList, ChefHat, Calendar, Printer, Edit3, Coffee, Sun, Sunset, Moon, Sparkles, Trash2, ChevronDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { apiClient } from '../modules/utils/apiClient';

export interface ConfirmedMenu {
  id: string;
  date: string;
  timestamp: number;
  mealTime?: string;
  dishes: { dish: Dish; servings: number }[];
}

interface CookingQueueProps {
  confirmedMenus: ConfirmedMenu[];
  onEdit: (date: string, dishes: { dish: Dish; servings: number }[]) => void;
  onDeleteMenu?: (menuId: string) => void;
}

const MEAL_COLUMNS = [
  { id: 'breakfast', label: 'Breakfast', icon: Coffee, gradient: 'from-amber-400 to-orange-500', bg: 'from-amber-50 to-orange-50', border: 'border-amber-200', text: 'text-amber-700' },
  { id: 'lunch', label: 'Lunch', icon: Sun, gradient: 'from-green-400 to-emerald-500', bg: 'from-green-50 to-emerald-50', border: 'border-green-200', text: 'text-green-700' },
  { id: 'evening_snacks', label: 'Evening Snacks', icon: Sunset, gradient: 'from-purple-400 to-pink-500', bg: 'from-purple-50 to-pink-50', border: 'border-purple-200', text: 'text-purple-700' },
  { id: 'dinner', label: 'Dinner', icon: Moon, gradient: 'from-indigo-400 to-blue-500', bg: 'from-indigo-50 to-blue-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  { id: 'all_time', label: 'Add-ons', icon: Sparkles, gradient: 'from-yellow-400 to-amber-500', bg: 'from-yellow-50 to-amber-50', border: 'border-yellow-200', text: 'text-yellow-700' },
];

export const CookingQueue: React.FC<CookingQueueProps> = ({ confirmedMenus, onEdit, onDeleteMenu }) => {
  const [soldCounts, setSoldCounts] = useState<Record<string, Record<string, number>>>({});
  const today = new Date().toISOString().split('T')[0];
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set([today]));
  const [filterStartDate, setFilterStartDate] = useState(today);
  const [filterEndDate, setFilterEndDate] = useState(today);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  // Get unique dates from confirmed menus
  const uniqueDates = useMemo(() => {
    const dates = new Set(confirmedMenus.map(m => m.date));
    return Array.from(dates);
  }, [confirmedMenus]);

  // Fetch sold counts for each date
  useEffect(() => {
    const fetchSoldCounts = async () => {
      const counts: Record<string, Record<string, number>> = {};
      for (const date of uniqueDates) {
        try {
          const response = await apiClient.get<Record<string, number>>(`/billing/sold/${date}`);
          if (response.success && response.data) {
            counts[date] = response.data;
          }
        } catch { /* ignore */ }
      }
      setSoldCounts(counts);
    };
    if (uniqueDates.length > 0) fetchSoldCounts();
  }, [uniqueDates.join(',')]);

  const groupedByDate = useMemo(() => {
    const dateGroups: Record<string, { date: string; mealGroups: Record<string, ConfirmedMenu[]> }> = {};
    confirmedMenus
      .filter(menu => menu.date >= filterStartDate && menu.date <= filterEndDate)
      .forEach(menu => {
      if (!dateGroups[menu.date]) {
        dateGroups[menu.date] = { date: menu.date, mealGroups: {} };
      }
      const key = menu.mealTime || 'lunch';
      if (!dateGroups[menu.date].mealGroups[key]) {
        dateGroups[menu.date].mealGroups[key] = [];
      }
      dateGroups[menu.date].mealGroups[key].push(menu);
    });
    return Object.values(dateGroups).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [confirmedMenus, filterStartDate, filterEndDate]);

  const getMergedDishes = (menus: ConfirmedMenu[]) => {
    const dishMap = new Map<string, { dish: Dish; servings: number; menuId: string }>();
    menus.forEach(menu => {
      menu.dishes.forEach(item => {
        const existing = dishMap.get(item.dish.id);
        if (existing) {
          existing.servings += item.servings;
        } else {
          dishMap.set(item.dish.id, { ...item, menuId: menu.id });
        }
      });
    });
    return Array.from(dishMap.values());
  };

  if (confirmedMenus.length === 0) return null;

  const handlePrintDate = (group: { date: string; mealGroups: Record<string, ConfirmedMenu[]> }) => {
    const dateStr = format(parseISO(group.date), 'MMMM dd, yyyy');
    const dateSold = soldCounts[group.date] || {};

    let mealSections = '';
    MEAL_COLUMNS.forEach(meal => {
      const menus = group.mealGroups[meal.id] || [];
      const dishes = getMergedDishes(menus);
      if (dishes.length === 0) return;

      const totalServings = dishes.reduce((acc, d) => acc + d.servings, 0);
      mealSections += `
        <div class="meal-section">
          <h3>${meal.label} <span class="meal-total">(${totalServings} servings)</span></h3>
          <table>
            <thead><tr><th>#</th><th>Dish Name</th><th>Cuisine</th><th class="text-right">Servings</th><th class="text-right">Sold</th><th class="text-right">Remaining</th></tr></thead>
            <tbody>
              ${dishes.map(({ dish, servings }, idx) => {
                const sold = dateSold[dish.name] || 0;
                const remaining = Math.max(0, servings - sold);
                return `<tr>
                  <td>${idx + 1}</td>
                  <td class="bold">${dish.name}</td>
                  <td>${dish.cuisine || '-'}</td>
                  <td class="text-right">${servings}</td>
                  <td class="text-right">${sold}</td>
                  <td class="text-right bold ${remaining === 0 ? 'text-red' : ''}">${remaining}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    });

    const totalDishes = Object.values(group.mealGroups).reduce((acc, menus) => acc + getMergedDishes(menus).length, 0);
    const totalServings = Object.values(group.mealGroups).reduce((acc, menus) => acc + getMergedDishes(menus).reduce((s, d) => s + d.servings, 0), 0);

    const html = `
      <html>
      <head>
        <title>Production Queue - ${dateStr}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1a1a1a; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; }
          .header h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
          .header h2 { font-size: 16px; font-weight: 600; color: #374151; margin-top: 4px; }
          .header p { font-size: 12px; color: #6b7280; margin-top: 2px; }
          .meal-section { margin-bottom: 20px; }
          .meal-section h3 { font-size: 14px; font-weight: 700; color: #1f2937; margin-bottom: 8px; padding: 6px 10px; background: #f3f4f6; border-radius: 6px; }
          .meal-total { font-weight: 400; color: #6b7280; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #374151; padding: 8px 10px; text-align: left; border-bottom: 2px solid #d1d5db; background: #f9fafb; }
          td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
          tr:nth-child(even) { background: #f9fafb; }
          .text-right { text-align: right; }
          .bold { font-weight: 700; }
          .text-red { color: #dc2626; }
          .footer { margin-top: 20px; padding-top: 12px; border-top: 2px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Madurai Pandiyan Hotel</h1>
          <h2>Production Queue</h2>
          <p>${dateStr} &bull; ${totalDishes} dishes &bull; ${totalServings} total servings</p>
        </div>
        ${mealSections}
        <div class="footer">
          <span>Total: ${totalDishes} dishes, ${totalServings} servings</span>
          <span>Printed: ${new Date().toLocaleString('en-IN')}</span>
        </div>
        <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }<\/script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
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
            <p className="text-sm text-stone-500 font-medium">Kitchen orders grouped by meal time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-stone-400" />
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => {
              setFilterStartDate(e.target.value);
              if (e.target.value > filterEndDate) setFilterEndDate(e.target.value);
            }}
            className="px-3 py-1.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-stone-400 text-sm">to</span>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => {
              setFilterEndDate(e.target.value);
              if (e.target.value < filterStartDate) setFilterStartDate(e.target.value);
            }}
            className="px-3 py-1.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="space-y-8">
        {groupedByDate.map(group => {
          const dateSold = soldCounts[group.date] || {};

          return (
            <div key={group.date} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              {/* Date Header — Accordion Toggle */}
              <button
                onClick={() => toggleDate(group.date)}
                className="w-full bg-stone-50 border-b border-stone-200 px-6 py-3 flex justify-between items-center relative hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400" />
                <div className="flex items-center gap-3 pl-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold text-stone-800">{format(parseISO(group.date), 'MMM dd, yyyy')}</span>
                  {group.date === today && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">Today</span>
                  )}
                  <span className="text-xs text-stone-400 font-medium">
                    {Object.values(group.mealGroups).reduce((acc, menus) => acc + getMergedDishes(menus).length, 0)} dishes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        const all: { dish: Dish; servings: number }[] = [];
                        Object.values(group.mealGroups).forEach(menus => all.push(...getMergedDishes(menus)));
                        onEdit(group.date, all);
                      }}
                      className="text-stone-500 hover:text-blue-600 hover:bg-blue-50 border border-stone-200 hover:border-blue-200 bg-white px-3 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button onClick={() => handlePrintDate(group)} className="text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 p-1.5 rounded-lg transition-all" title="Print">
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform duration-300 ${expandedDates.has(group.date) ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Meal Time Columns — Collapsible */}
              {expandedDates.has(group.date) && (
              <div className="grid grid-cols-5 divide-x divide-stone-100 min-h-[200px]">
                {MEAL_COLUMNS.map(meal => {
                  const Icon = meal.icon;
                  const menus = group.mealGroups[meal.id] || [];
                  const dishes = getMergedDishes(menus);
                  const totalServings = dishes.reduce((acc, d) => acc + d.servings, 0);

                  return (
                    <div key={meal.id} className="flex flex-col">
                      {/* Column Header */}
                      <div className={`px-3 py-3 bg-gradient-to-r ${meal.bg} border-b ${meal.border} flex items-center gap-2`}>
                        <div className={`w-7 h-7 bg-gradient-to-br ${meal.gradient} rounded-lg flex items-center justify-center shadow-sm`}>
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${meal.text}`}>{meal.label}</p>
                          {dishes.length > 0 && (
                            <p className="text-[10px] text-stone-400">{totalServings} srvs</p>
                          )}
                        </div>
                      </div>

                      {/* Dishes List */}
                      <div className="flex-1 p-2 space-y-1.5">
                        {dishes.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-[11px] text-stone-300 italic">No dishes</p>
                          </div>
                        ) : (
                          dishes.map(({ dish, servings, menuId }, idx) => {
                            const sold = dateSold[dish.name] || 0;
                            const remaining = Math.max(0, servings - sold);
                            const allSold = remaining === 0 && sold > 0;

                            return (
                              <div
                                key={dish.id}
                                className={`p-2 rounded-lg border ${meal.border} bg-gradient-to-r ${meal.bg} transition-all hover:shadow-sm ${allSold ? 'opacity-60' : ''}`}
                              >
                                <div className="flex items-start gap-1.5">
                                  <div className={`w-4 h-4 rounded bg-gradient-to-br ${meal.gradient} text-white flex items-center justify-center text-[9px] font-bold shadow-sm shrink-0 mt-0.5`}>
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className={`font-bold text-[11px] leading-tight truncate ${allSold ? 'line-through text-stone-400' : 'text-stone-700'}`}>{dish.name}</p>
                                      {onDeleteMenu && (
                                        <button
                                          onClick={() => onDeleteMenu(menuId)}
                                          className="p-0.5 hover:bg-red-100 rounded transition-colors shrink-0 ml-1"
                                          title="Remove dish"
                                        >
                                          <Trash2 className="w-3 h-3 text-red-400 hover:text-red-600" />
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-[10px] text-stone-400">{dish.cuisine}</span>
                                      <span className={`text-[11px] font-bold ${allSold ? 'text-red-500' : remaining < servings ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {remaining}/{servings}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
