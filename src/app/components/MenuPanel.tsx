
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Search, Utensils, Coffee, Sun, Moon, Calendar, ChevronRight, Minus, Globe, ChevronDown, ChevronUp, Pizza, Flame, Sandwich, Soup, Croissant, UtensilsCrossed } from 'lucide-react';
import { Dish } from '../modules/RecipeCalculatory/mockData';
import clsx from 'clsx';
import { format } from 'date-fns';

interface MenuPanelProps {
  availableDishes: Dish[];
  selectedDishes: { dish: Dish; servings: number }[];
  onAddDish: (dish: Dish) => void;
  onRemoveDish: (dishId: string) => void;
  onUpdateServings: (dishId: string, servings: number) => void;
  onSelectDish: (dish: Dish) => void;
  activeDishId: string | null;
  date: string;
  onDateChange: (date: string) => void;
}

export const MenuPanel: React.FC<MenuPanelProps> = ({
  availableDishes,
  selectedDishes,
  onAddDish,
  onRemoveDish,
  onUpdateServings,
  onSelectDish,
  activeDishId,
  date,
  onDateChange,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State to track collapsed/expanded cuisines
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (cuisine: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [cuisine]: !prev[cuisine]
    }));
  };

  // Group AVAILABLE dishes by cuisine (for the Add Dish dropdown)
  const filteredAvailableDishes = useMemo(() => {
    return availableDishes.filter(
      (dish) =>
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedDishes.some((selected) => selected.dish.id === dish.id)
    );
  }, [availableDishes, searchQuery, selectedDishes]);

  const groupedAvailableDishes = useMemo(() => {
    const groups: Record<string, Dish[]> = {};
    filteredAvailableDishes.forEach(dish => {
      const cuisine = dish.cuisine || 'Other';
      if (!groups[cuisine]) groups[cuisine] = [];
      groups[cuisine].push(dish);
    });
    return groups;
  }, [filteredAvailableDishes]);

  // Group SELECTED dishes by cuisine (for the main list)
  const groupedSelectedDishes = useMemo(() => {
    const groups: Record<string, typeof selectedDishes> = {};
    selectedDishes.forEach(item => {
      const cuisine = item.dish.cuisine || 'Other';
      if (!groups[cuisine]) groups[cuisine] = [];
      groups[cuisine].push(item);
    });
    return groups;
  }, [selectedDishes]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Breakfast': return <Coffee className="h-3.5 w-3.5" />;
      case 'Lunch': return <Sun className="h-3.5 w-3.5" />;
      case 'Dinner': return <Moon className="h-3.5 w-3.5" />;
      default: return <Utensils className="h-3.5 w-3.5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Breakfast': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Lunch': return 'text-sky-600 bg-sky-50 border-sky-100';
      case 'Dinner': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      default: return 'text-stone-600 bg-stone-50 border-stone-100';
    }
  };

  const getCuisineIcon = (cuisine: string) => {
    switch (cuisine) {
      case 'Italian': return <Pizza className="h-4 w-4 text-orange-600" />;
      case 'Indian': return <Flame className="h-4 w-4 text-red-600" />;
      case 'American': return <Sandwich className="h-4 w-4 text-amber-600" />;
      case 'Asian': return <Soup className="h-4 w-4 text-emerald-600" />;
      case 'Mexican': return <UtensilsCrossed className="h-4 w-4 text-rose-600" />;
      case 'Continental': return <Croissant className="h-4 w-4 text-yellow-600" />;
      default: return <Globe className="h-4 w-4 text-stone-400" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 flex flex-col h-full overflow-hidden">
      {/* Header Section */}
      <div className="p-5 border-b border-orange-100 bg-orange-50 z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-stone-800 tracking-tight">Menu Planning</h2>
            <p className="text-xs text-stone-400 font-medium">Manage daily servings</p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={clsx(
              "h-9 px-4 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2",
              isAdding 
                ? "bg-stone-100 text-stone-600 hover:bg-stone-200" 
                : "bg-stone-900 text-white hover:bg-stone-800 hover:shadow-md"
            )}
          >
            {isAdding ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isAdding ? "Close" : "Add Dish"}
          </button>
        </div>
        
        {/* Date Selector */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-emerald-600" />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm font-medium text-stone-700 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer hover:border-emerald-300"
          />
        </div>
      </div>

      {/* List Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
          {isAdding && (
            <div
              className="mb-4 overflow-hidden transition-all duration-300"
            >
              <div className="bg-stone-50 p-3 rounded-xl border border-emerald-500/30 shadow-inner">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search recipe catalog..."
                    className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {Object.keys(groupedAvailableDishes).length === 0 ? (
                    <p className="text-center text-stone-500 text-sm py-4 italic">No matching recipes found.</p>
                  ) : (
                    Object.entries(groupedAvailableDishes).map(([cuisine, dishes]) => (
                      <div key={cuisine}>
                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5 ml-1">{cuisine} Cuisine</h4>
                        <div className="space-y-1">
                          {dishes.map((dish) => (
                            <button
                              key={dish.id}
                              onClick={() => {
                                onAddDish(dish);
                                setIsAdding(false);
                                setSearchQuery('');
                              }}
                              className="w-full text-left px-3 py-2.5 text-sm text-stone-700 hover:bg-white hover:shadow-sm rounded-lg transition-all flex justify-between items-center group border border-transparent hover:border-stone-100"
                            >
                              <span className="font-medium">{dish.name}</span>
                              <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide", getCategoryColor(dish.category))}>
                                {dish.category}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedDishes.length === 0 && !isAdding ? (
            <div 
              className="flex flex-col items-center justify-center h-64 text-stone-400 border-2 border-dashed border-stone-100 rounded-xl bg-stone-50/50 m-2"
            >
              <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                <Utensils className="h-6 w-6 text-stone-300" />
              </div>
              <p className="text-sm font-medium text-stone-500">Menu is empty</p>
              <p className="text-xs mt-1 max-w-[150px] text-center">Start by adding dishes for {date ? format(new Date(date), 'MMM do') : 'today'}</p>
            </div>
          ) : (
            // Render grouped selected dishes
            <div
              className="space-y-4"
            >
              {Object.entries(groupedSelectedDishes).map(([cuisine, items]) => (
                <div
                  key={cuisine}
                  className="space-y-2"
                >
                  {/* Accordion Header */}
                <button
                  onClick={() => toggleSection(cuisine)}
                  className="flex items-center justify-between w-full px-2 py-2 text-sm font-bold text-stone-500 uppercase tracking-wider hover:text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {getCuisineIcon(cuisine)}
                    <span>{cuisine} Cuisine</span>
                    <span className="bg-stone-100 text-stone-500 text-[10px] px-1.5 py-0.5 rounded-full">{items.length}</span>
                  </div>
                  {collapsedSections[cuisine] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>

                {/* Accordion Body */}
                  {!collapsedSections[cuisine] && (
                    <div
                      className="space-y-3 overflow-hidden transition-all duration-300"
                    >
                      {items.map(({ dish, servings }) => (
                        <div
                          key={dish.id}
                          className={clsx(
                            "group relative border rounded-lg p-2.5 transition-all cursor-pointer",
                            activeDishId === dish.id
                              ? "border-emerald-500 bg-emerald-50/40 shadow-md ring-1 ring-emerald-500/20"
                              : "border-stone-200 bg-white hover:border-emerald-300 hover:shadow-sm"
                          )}
                          onClick={() => onSelectDish(dish)}
                        >
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={clsx("font-bold text-sm truncate", activeDishId === dish.id ? "text-emerald-900" : "text-stone-700")}>
                                  {dish.name}
                                </h3>
                                <div className={clsx("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border shrink-0", getCategoryColor(dish.category))}>
                                  {getCategoryIcon(dish.category)}
                                  <span className="uppercase tracking-wider hidden sm:inline">{dish.category}</span>
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveDish(dish.id);
                              }}
                              className="text-stone-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 absolute top-1 right-1"
                              title="Remove dish"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between bg-stone-50/80 px-2 py-1.5 rounded-md border border-stone-100 mt-1">
                            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">Portions</span>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => onUpdateServings(dish.id, Math.max(1, servings - 5))}
                                className="w-5 h-5 flex items-center justify-center rounded bg-white border border-stone-200 text-stone-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                              >
                                <Minus className="h-2.5 w-2.5" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={servings}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (val > 0) onUpdateServings(dish.id, val);
                                }}
                                className="w-10 text-center text-xs font-bold bg-transparent border-none focus:ring-0 p-0 text-stone-800"
                              />
                              <button 
                                onClick={() => onUpdateServings(dish.id, servings + 5)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-white border border-stone-200 text-stone-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          </div>
                          
                          {activeDishId === dish.id && (
                            <div className="absolute -right-[4px] top-1/2 -translate-y-1/2 hidden lg:block">
                              <ChevronRight className="h-4 w-4 text-emerald-500" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))}
            </div>
          )}
      </div>
    </div>
  );
};
