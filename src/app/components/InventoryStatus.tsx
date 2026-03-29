
import React, { useMemo, useState } from 'react';
import { Dish, Ingredient } from '../modules/RecipeCalculatory/mockData';
import { ShoppingCart, Check, ArrowRight, FileSpreadsheet, FileText, X, Plus, Trash2, AlertCircle, ChefHat, Search } from 'lucide-react';
import { purchaseListApi } from '../modules/utils/purchaseListApi';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
// import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

import { toast } from 'sonner';

interface InventoryStatusProps {
  selectedDishes: { dish: Dish; servings: number }[];
  inventory: Ingredient[];
  onConfirm: () => void;
  date: string;
}

interface CustomItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  inStock: number;
  required: number;
}

export const InventoryStatus: React.FC<InventoryStatusProps> = ({ selectedDishes, inventory, onConfirm, date }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Custom items state
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const analysis = useMemo(() => {
    const requirements = new Map<string, number>();
    selectedDishes.forEach(({ dish, servings }) => {
      dish.ingredients.forEach((req) => {
        const current = requirements.get(req.ingredientId) || 0;
        requirements.set(req.ingredientId, current + (req.amount * servings));
      });
    });

    let sufficientCount = 0;
    let insufficientCount = 0;
    const missingIngredients: { name: string; required: number; available: number; unit: string }[] = [];

    requirements.forEach((required, id) => {
      const item = inventory.find(i => i.id === id);
      if (item) {
        if (item.stock >= required) {
          sufficientCount++;
        } else {
          insufficientCount++;
          missingIngredients.push({
            name: item.name,
            required,
            available: item.stock,
            unit: item.unit
          });
        }
      }
    });

    return {
      totalItems: requirements.size,
      sufficient: sufficientCount,
      insufficient: insufficientCount,
      missingIngredients,
      isFeasible: insufficientCount === 0 && requirements.size > 0
    };
  }, [selectedDishes, inventory]);

  const [nameSearch, setNameSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null);

  const filteredInventory = useMemo(() => {
    if (!nameSearch.trim()) return inventory;
    return inventory.filter(item => item.name.toLowerCase().includes(nameSearch.toLowerCase()));
  }, [nameSearch, inventory]);

  const handleSelectInventoryItem = (item: Ingredient) => {
    setNewItemName(item.name);
    setNewItemUnit(item.unit);
    setSelectedInventoryId(String(item.id));
    setNameSearch(item.name);
    setShowDropdown(false);
  };

  const handleNameInputChange = (value: string) => {
    setNameSearch(value);
    setNewItemName(value);
    setSelectedInventoryId(null);
    setShowDropdown(true);
  };

  const handleAddCustomItem = async () => {
    if (newItemName && newItemQuantity) {
      const qty = parseFloat(newItemQuantity);
      const matchedItem = inventory.find(i => i.name.toLowerCase() === newItemName.toLowerCase());
      const inStock = matchedItem ? parseFloat(String(matchedItem.stock)) : 0;
      console.log('Purchase item debug:', { qty, inStock, matchedItem: matchedItem?.name, toBuyGreaterThanStock: qty > inStock });
      const required = qty > inStock ? qty : 0;

      try {
        const response = await purchaseListApi.create({
          item_name: newItemName,
          quantity: qty,
          unit: newItemUnit,
          date
        });

        const itemId = (response.data as any)?.id?.toString() || Date.now().toString();

        const newItem: CustomItem = {
          id: itemId,
          name: newItemName,
          quantity: qty,
          unit: newItemUnit,
          inStock,
          required
        };
        setCustomItems([...customItems, newItem]);
        toast.success(matchedItem ? 'Item added to purchase list' : 'New item added to inventory & purchase list');
      } catch {
        toast.error('Failed to save purchase item');
      }

      setNewItemName('');
      setNewItemQuantity('');
      setNewItemUnit('kg');
      setNameSearch('');
      setSelectedInventoryId(null);
      setIsAddingItem(false);
    }
  };

  const handleRemoveCustomItem = (id: string) => {
    setCustomItems(customItems.filter(item => item.id !== id));
  };

  const getExportData = () => {
    const standardItems = analysis.missingIngredients.map(item => ({
      name: item.name,
      toPurchase: (item.required - item.available).toFixed(2),
      unit: item.unit,
      inStock: item.available.toFixed(2),
      required: item.required.toFixed(2),
      isCustom: false
    }));

    const extraItems = customItems.map(item => ({
      name: item.name,
      toPurchase: item.quantity.toFixed(2),
      unit: item.unit,
      inStock: item.inStock.toFixed(2),
      required: item.required > 0 ? item.required.toFixed(2) : 'Sufficient',
      isCustom: true
    }));

    return [...standardItems, ...extraItems];
  };

  const handleExportPDF = () => {
    toast.error('PDF export requires jspdf package to be installed');
    setIsDialogOpen(false);
  };

  const handleExportExcel = () => {
    const allItems = getExportData();
    const data = allItems.map(item => ({
      'Ingredient': item.isCustom ? `${item.name} (Manual)` : item.name,
      'To Buy': Number(item.toPurchase),
      'Unit': item.unit,
      'In Stock': isNaN(Number(item.inStock)) ? item.inStock : Number(item.inStock),
      'Required': isNaN(Number(item.required)) ? item.required : Number(item.required)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase List");
    XLSX.writeFile(wb, `purchase-list-${date}.xlsx`);
    setIsDialogOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 relative overflow-hidden mb-6">
      {/* Decorative background accent */}
      <div 
        style={{ backgroundColor: selectedDishes.length > 0 ? (analysis.isFeasible ? '#10b981' : '#f43f5e') : '#94a3b8' }}
        className="absolute top-0 left-0 w-1.5 h-full" 
      />

      <div className="flex flex-col lg:flex-row justify-between items-center gap-8 pl-4">
        
        {/* Status Message Section */}
        <div className="flex-1 w-full">
            <div
              className="flex items-start gap-4"
            >
              <div className={`p-3 rounded-xl flex-shrink-0 ${selectedDishes.length === 0 ? 'bg-stone-100 text-stone-400' : (analysis.isFeasible ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600')}`}>
                {selectedDishes.length === 0 ? <AlertCircle className="h-6 w-6" /> : (analysis.isFeasible ? <Check className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 leading-tight">
                  {selectedDishes.length === 0 ? 'No Dishes Selected' : (analysis.isFeasible ? 'Inventory Check Passed' : 'Inventory Shortage Detected')}
                </h3>
                <p className="text-sm text-stone-500 mt-1 max-w-xl">
                  {selectedDishes.length === 0
                    ? 'Add dishes to your menu to check inventory availability and proceed with cooking.'
                    : (analysis.isFeasible 
                      ? `All ${analysis.totalItems} required ingredients are available in sufficient quantities. You are ready to proceed.`
                      : `${analysis.insufficient} ingredients are below required levels. Purchase orders are needed for: `
                    )
                  }
                  {selectedDishes.length > 0 && !analysis.isFeasible && (
                    <span className="font-semibold text-stone-700">
                      {analysis.missingIngredients.slice(0, 3).map(i => i.name).join(', ')}{analysis.missingIngredients.length > 3 ? '...' : ''}
                    </span>
                  )}
                </p>
              </div>
            </div>
        </div>

        {/* Buttons Section */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button 
                className="group flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold bg-white text-stone-700 border-2 border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all shadow-sm focus:ring-4 focus:ring-stone-100"
              >
                <ShoppingCart className="h-4.5 w-4.5 text-stone-400 group-hover:text-stone-600 transition-colors" />
                <span>Purchase List</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <ShoppingCart className="h-5 w-5 text-emerald-600" />
                  Purchase List Review
                </DialogTitle>
                <DialogDescription>
                  Review the items needed for the selected menu on {format(new Date(date), 'PPP')}.
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[300px] overflow-y-auto border rounded-lg mt-4 scrollbar-thin scrollbar-thumb-stone-200">
                <table className="w-full text-sm text-left text-stone-600">
                  <thead className="text-xs text-stone-700 uppercase bg-stone-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Ingredient</th>
                      <th className="px-4 py-3 text-right">To Buy</th>
                      <th className="px-4 py-3 text-right">In Stock</th>
                      <th className="px-4 py-3 text-right">Required</th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* If nothing is missing and no custom items, show empty state message in table row if desired, or just empty */}
                    {analysis.missingIngredients.length === 0 && customItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-stone-400 italic">
                          No items in purchase list. Add manual items below.
                        </td>
                      </tr>
                    )}

                    {/* Standard Missing Items */}
                    {analysis.missingIngredients.map((item, index) => (
                      <tr key={`missing-${index}`} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50">
                        <td className="px-4 py-3 font-medium text-stone-900">{item.name}</td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600">
                          {(item.required - item.available).toFixed(2)} <span className="text-xs font-normal text-stone-400">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-stone-500">
                          {item.available.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-stone-500">
                          {item.required.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    ))} 
                    {/* Custom Items */}
                    {customItems.map((item) => (
                      <tr key={item.id} className="border-b border-stone-100 last:border-0 bg-blue-50/30 hover:bg-blue-50/60">
                          <td className="px-4 py-3 font-medium text-stone-900 flex items-center gap-2">
                            {item.name}
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 uppercase font-bold tracking-wide">Manual</span>
                          </td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600">
                          {item.quantity.toFixed(2)} <span className="text-xs font-normal text-stone-400">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-stone-500">
                          {item.inStock.toFixed(2)} <span className="text-xs font-normal text-stone-400">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          {item.required > 0 ? (
                            <span className="text-rose-600">{item.required.toFixed(2)} <span className="text-xs font-normal text-stone-400">{item.unit}</span></span>
                          ) : (
                            <span className="text-emerald-600 text-xs">Sufficient</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleRemoveCustomItem(item.id)}
                            className="text-stone-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Item Section */}
              <div className="mt-4 bg-stone-50 rounded-lg p-3 border border-stone-200">
                {!isAddingItem ? (
                  <button
                    onClick={() => setIsAddingItem(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md border border-dashed border-stone-300 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Add Manual Item
                  </button>
                ) : (
                  <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative flex-1">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                        <input
                          type="text"
                          placeholder="Search or type new item..."
                          value={nameSearch}
                          onChange={(e) => handleNameInputChange(e.target.value)}
                          onFocus={() => setShowDropdown(true)}
                          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                          className="w-full pl-8 pr-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          autoFocus
                        />
                      </div>
                      {showDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {filteredInventory.length > 0 ? (
                            filteredInventory.map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onMouseDown={() => handleSelectInventoryItem(item)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 flex justify-between items-center"
                              >
                                <span className="font-medium text-stone-800">{item.name}</span>
                                <span className="text-xs text-stone-400">{parseFloat(String(item.stock)).toFixed(1)} {item.unit}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-stone-500">
                              No match — <span className="font-semibold text-emerald-600">"{nameSearch}"</span> will be added as new item
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={newItemQuantity}
                      onChange={(e) => setNewItemQuantity(e.target.value)}
                      className="w-20 px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <select
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      className="w-24 px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                      <option value="pcs">pcs</option>
                      <option value="box">box</option>
                    </select>
                    <button
                      onClick={handleAddCustomItem}
                      disabled={!newItemName || !newItemQuantity}
                      className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setIsAddingItem(false); setNameSearch(''); setShowDropdown(false); setSelectedInventoryId(null); }}
                      className="px-3 py-2 bg-white border border-stone-300 text-stone-500 rounded-md hover:bg-stone-50 hover:text-stone-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <div className="flex gap-2 w-full justify-end">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors font-medium text-sm"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors font-medium text-sm"
                  >
                    <FileText className="h-4 w-4" />
                    Export PDF
                  </button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <button 
            disabled={selectedDishes.length === 0 || !analysis.isFeasible}
            onClick={() => {
              onConfirm();
            }}
            className={`
              group flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold shadow-md transition-all focus:ring-4
              ${selectedDishes.length > 0 && analysis.isFeasible 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg focus:ring-emerald-500/30' 
                : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'}
            `}
          >
            <span>Confirm & Cook</span>
            {selectedDishes.length > 0 && analysis.isFeasible && <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </div>

      </div>
    </div>
  );
};
