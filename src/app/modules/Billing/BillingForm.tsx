import { useState, useEffect, useRef } from 'react';
import { Plus, Package, Phone, ShoppingBag, Trash2, ShoppingCart, X, ChevronUp, ChevronDown, FileText, Clock, Search, User, Printer } from 'lucide-react';
import { DraftOrder } from './BillingDashboard';
import { recipeApi } from '../utils/recipeApi';
import { kitchenApi } from '../utils/kitchenApi';
import { apiClient } from '../utils/apiClient';
import { draftApi } from '../utils/draftApi';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

interface BillingFormProps {
  onAddItems: (items: { name: string; price: number; quantity: number; code?: string; taxApplicable?: boolean }[]) => void;
  mobileNumber: string;
  customerName: string;
  orderType: 'dine-in' | 'parcel';
  tableNumber: string;
  numberOfPersons: string;
  onMobileNumberChange: (number: string) => void;
  onCustomerNameChange: (name: string) => void;
  onOrderTypeChange: (type: 'dine-in' | 'parcel') => void;
  onTableNumberChange: (tableNumber: string) => void;
  onNumberOfPersonsChange: (numberOfPersons: string) => void;
  draftOrders: DraftOrder[];
  onLoadDraft: (draftId: string) => void;
  onDeleteDraft: (draftId: string) => void;
  onSaveDraft?: (items?: { name: string; price: number; quantity: number; category: string }[]) => void;
  onDraftCreated?: (draft: DraftOrder) => void;
  billingSettings?: { serviceChargeEnabled: boolean; serviceChargePercent: number; serviceChargeParcelExempt?: boolean; cgstPercent: number; sgstPercent: number; customCharges?: { id: string; name: string; percent: number; enabled: boolean }[] };
}

interface StagedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  code?: string;
  category: string;
  taxApplicable: boolean;
}

interface ProductSuggestion {
  name: string;
  price: number;
  code: string;
  category: string;
  taxApplicable: boolean;
  availableQty?: number;
}

export function BillingForm({ 
  onAddItems,
  mobileNumber,
  customerName,
  orderType,
  tableNumber,
  numberOfPersons,
  onMobileNumberChange,
  onCustomerNameChange,
  onOrderTypeChange,
  onTableNumberChange,
  onNumberOfPersonsChange,
  draftOrders,
  onLoadDraft,
  onDeleteDraft,
  onSaveDraft,
  onDraftCreated,
  billingSettings
}: BillingFormProps) {
  const { user } = useAuth();
  const [itemName, setItemName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');

  const [selectedCategory, setSelectedCategory] = useState('');
  const [productSuggestions, setProductSuggestions] = useState<ProductSuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [isProductSelected, setIsProductSelected] = useState(false);
  const [selectedTaxApplicable, setSelectedTaxApplicable] = useState(true);
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const [showKOT, setShowKOT] = useState(false);
  const [kotItems, setKotItems] = useState<StagedItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await recipeApi.getAll();
        const recipes = (response.data as any)?.data || response.data || [];
        const mapped: ProductSuggestion[] = recipes.map((r: any) => ({
          name: r.name,
          price: parseFloat(r.price) || 0,
          code: `R${String(r.id).padStart(3, '0')}`,
          category: r.category || 'Uncategorized',
          taxApplicable: r.tax_applicable !== 0 && r.tax_applicable !== false,
        }));
        setProductSuggestions(mapped);
      } catch { /* ignore */ }

      // Fetch availability separately
      try {
        const today = new Date().toISOString().split('T')[0];
        const [menusRes, soldRes] = await Promise.all([
          apiClient.get<any>(`/confirmed-menus/${today}`),
          apiClient.get<Record<string, number>>(`/billing/sold/${today}`),
        ]);
        const menuData = (menusRes.data as any)?.data || menusRes.data;
        const sold = (soldRes.data as any) || {};
        const confirmedMap: Record<string, number> = {};
        if (menuData) {
          const dishes = menuData.dishes || [];
          dishes.forEach((d: any) => {
            const name = d.name || d.dish?.name || '';
            const servings = d.servings || 0;
            if (name) confirmedMap[name] = (confirmedMap[name] || 0) + servings;
          });
          if (Array.isArray(menuData)) {
            menuData.filter((m: any) => m.date === today).forEach((menu: any) => {
              (menu.dishes || []).forEach((d: any) => {
                const name = d.dish?.name || d.name || '';
                const servings = d.servings || 0;
                if (name) confirmedMap[name] = (confirmedMap[name] || 0) + servings;
              });
            });
          }
        }
        setProductSuggestions(prev => prev.map(p => {
          const confirmed = confirmedMap[p.name] || 0;
          const soldQty = sold[p.name] || 0;
          return { ...p, availableQty: confirmed > 0 ? Math.max(0, confirmed - soldQty) : undefined };
        }));
      } catch { /* ignore */ }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (itemName.trim().length > 0) {
      const filtered = productSuggestions.filter(item =>
        item.name.toLowerCase().includes(itemName.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setSelectedSuggestionIndex(-1);
  }, [itemName, productSuggestions]);

  const handleSuggestionClick = (suggestion: ProductSuggestion) => {
    setItemName(suggestion.name);
    setPrice(suggestion.price.toString());
    setProductCode(suggestion.code);
    setSelectedCategory(suggestion.category);
    setSelectedTaxApplicable(suggestion.taxApplicable);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setIsProductSelected(true);
    
    // Focus on quantity field after selection
    setTimeout(() => {
      document.getElementById('quantity')?.focus();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedSuggestionIndex]);
    }
  };

  const addToStaging = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemName.trim() || !price || !quantity) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!isProductSelected) {
      toast.error('Please select a valid product from the suggestions');
      return;
    }

    const priceNum = parseFloat(price);
    const quantityNum = parseInt(quantity);

    if (priceNum <= 0 || quantityNum <= 0) {
      toast.error('Price and quantity must be greater than 0');
      return;
    }

    const newItem: StagedItem = {
      id: Date.now().toString() + Math.random(),
      name: itemName.trim(),
      price: priceNum,
      quantity: quantityNum,
      code: productCode || undefined,
      category: selectedCategory || 'Uncategorized',
      taxApplicable: selectedTaxApplicable,

    };

    setStagedItems(prev => [...prev, newItem]);
    
    // Clear product fields
    setItemName('');
    setProductCode('');
    setPrice('');
    setQuantity('1');
    setSelectedCategory('');
    setShowSuggestions(false);
    setIsProductSelected(false);
    
    // Focus back to item name
    inputRef.current?.focus();
  };

  const removeStagedItem = (id: string) => {
    setStagedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddAllToBill = () => {
    if (stagedItems.length === 0) {
      toast.error('Please add at least one product to the staging area');
      return;
    }

    // Convert staged items to the format expected by parent
    const itemsToAdd = stagedItems.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      code: item.code
    }));

    onAddItems(itemsToAdd);
    setStagedItems([]);
    inputRef.current?.focus();
  };

  const stagedTotal = stagedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxableTotal = stagedItems.filter(i => i.taxApplicable).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const SERVICE_CHARGE_ENABLED = billingSettings?.serviceChargeEnabled ?? true;
  const SERVICE_CHARGE_PARCEL_EXEMPT = billingSettings?.serviceChargeParcelExempt ?? true;
  const SERVICE_CHARGE_RATE = (billingSettings?.serviceChargePercent ?? 5) / 100;
  const isParcel = orderType === 'parcel';
  const applyServiceCharge = SERVICE_CHARGE_ENABLED && !(isParcel && SERVICE_CHARGE_PARCEL_EXEMPT);
  const CGST_RATE = (billingSettings?.cgstPercent ?? 2.5) / 100;
  const SGST_RATE = (billingSettings?.sgstPercent ?? 2.5) / 100;
  const enabledCustomCharges = (billingSettings?.customCharges || []).filter(c => c.enabled);
  const stagedServiceCharge = applyServiceCharge ? taxableTotal * SERVICE_CHARGE_RATE : 0;
  const stagedCgst = taxableTotal * CGST_RATE;
  const stagedSgst = taxableTotal * SGST_RATE;
  const stagedCustomTotal = enabledCustomCharges.reduce((sum, c) => sum + taxableTotal * c.percent / 100, 0);
  const stagedGrandTotal = stagedTotal + stagedServiceCharge + stagedCgst + stagedSgst + stagedCustomTotal;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-orange-500 rounded"></div>
        <Package className="w-6 h-6 text-orange-600" />
        <h2 className="text-gray-800 text-xl font-bold">Billing Information</h2>
      </div>

      {/* Customer Details Section */}
      <div className="mb-5 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-2 border-orange-200 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4 text-orange-600" />
          <h3 className="text-gray-800 font-bold text-sm">Customer</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="mobileNumber" className="block text-gray-700 mb-1.5 font-medium text-sm">
              Mobile Number *
            </label>
            <input
              id="mobileNumber"
              type="tel"
              value={mobileNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) {
                  onMobileNumberChange(value);
                }
              }}
              placeholder="10-digit mobile number"
              className="w-full px-3 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white transform focus:scale-[1.02] text-sm"
              maxLength={10}
            />
          </div>
          <div>
            <label htmlFor="customerName" className="block text-gray-700 mb-1.5 font-medium text-sm">
              Customer Name
            </label>
            <div className="relative">
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white transform focus:scale-[1.02] text-sm"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <label className="block text-gray-700 mb-1.5 font-medium text-sm">
            Order Type *
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onOrderTypeChange('dine-in')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 ${
                orderType === 'dine-in'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-orange-300'
              }`}
            >
              🍽️ Dine-In
            </button>
            <button
              type="button"
              onClick={() => onOrderTypeChange('parcel')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 ${
                orderType === 'parcel'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-orange-300'
              }`}
            >
              📦 Parcel
            </button>
          </div>
        </div>
        
        {/* Table Number and Number of Persons - Only shown for Dine-in */}
        {orderType === 'dine-in' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label htmlFor="tableNumber" className="block text-gray-700 mb-1.5 font-medium text-sm">
                Table Number *
              </label>
              <input
                id="tableNumber"
                type="text"
                value={tableNumber}
                onChange={(e) => onTableNumberChange(e.target.value)}
                placeholder="Enter table number"
                className="w-full px-3 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white transform focus:scale-[1.02] text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="numberOfPersons" className="block text-gray-700 mb-1.5 font-medium text-sm">
                Number of Persons
              </label>
              <input
                id="numberOfPersons"
                type="number"
                min="1"
                value={numberOfPersons}
                onChange={(e) => onNumberOfPersonsChange(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white transform focus:scale-[1.02] text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Product Entry Section */}
      <div className="mb-4 p-5 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-xl border-2 border-orange-200 shadow-sm animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-6 h-6 text-orange-600" />
          <h3 className="text-gray-800 font-bold text-lg">Add Products</h3>
        </div>

        <form onSubmit={addToStaging} className="space-y-4">
          {/* Product Name and Category Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label htmlFor="itemName" className="block text-gray-700 mb-2 font-medium text-sm">
                Product Name *
              </label>
              <input
                ref={inputRef}
                id="itemName"
                type="text"
                value={itemName}
                onChange={(e) => {
                  setItemName(e.target.value);
                  if (isProductSelected) {
                    setIsProductSelected(false);
                    setPrice('');
                    setProductCode('');
                    setSelectedCategory('');
                  }
                }}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  // Delay to allow click events to register
                  setTimeout(() => setShowSuggestions(false), 300);
                }}
                onFocus={() => {
                  if (itemName.length > 0) {
                    const filtered = productSuggestions.filter(item =>
                      item.name.toLowerCase().includes(itemName.toLowerCase())
                    );
                    setSuggestions(filtered);
                    setShowSuggestions(filtered.length > 0);
                  }
                }}
                placeholder="Type product name..."
                className="w-full px-4 py-2.5 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all bg-white shadow-sm"
                autoComplete="off"
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-20 w-full mt-1 bg-white border-2 border-orange-300 rounded-xl shadow-2xl max-h-72 overflow-y-auto"
                  onMouseDown={(e) => {
                    // Prevent blur on input when clicking suggestions
                    e.preventDefault();
                  }}
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSuggestionClick(suggestion);
                      }}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      className={`px-4 py-3 cursor-pointer transition-all flex items-center gap-3 border-b border-orange-100 last:border-b-0 ${
                        index === selectedSuggestionIndex ? 'bg-orange-100 border-l-4 border-l-orange-500' : 'hover:bg-orange-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="text-gray-900 font-semibold">{suggestion.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-gray-500 text-xs font-mono">{suggestion.code}</span>
                          {suggestion.availableQty !== undefined ? (
                            suggestion.availableQty > 0 ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">{suggestion.availableQty} available</span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 border border-red-200">Sold Out</span>
                            )
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">Not in Queue</span>
                          )}
                        </div>
                      </div>
                      <div className="text-orange-600 font-bold text-lg">₹{suggestion.price}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-gray-700 mb-2 font-medium text-sm">
                Category *
              </label>
              <input
                id="category"
                type="text"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                placeholder="Enter category"
                className="w-full px-4 py-2.5 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Quantity and Price Row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="quantity" className="block text-gray-700 mb-2 font-medium text-sm">
                Quantity *
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Qty"
                className="w-full px-3 py-2.5 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all text-center font-bold text-lg bg-white shadow-sm"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-gray-700 mb-2 font-medium text-sm">
                Price (₹) *
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                readOnly
                placeholder="0.00"
                className="w-full px-3 py-2.5 border-2 border-orange-200 rounded-lg font-bold text-lg bg-gray-100 cursor-not-allowed shadow-sm"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg font-bold"
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </div>
          </div>

          {/* Item Total Preview */}
          {price && quantity && (
            <div className="bg-white border-2 border-orange-300 rounded-lg p-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Item Total:</span>
                <span className="text-orange-600 font-bold text-xl">₹{(parseFloat(price || '0') * parseInt(quantity || '1')).toFixed(2)}</span>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Staged Products Display */}
      {stagedItems.length > 0 && (
        <div className="mb-6 p-5 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-xl border-2 border-orange-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-orange-600" />
              <h3 className="text-gray-800 font-bold text-lg">All Products</h3>
              <span className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full font-bold">
                {stagedItems.length}
              </span>
            </div>
            <button
              onClick={() => setStagedItems([])}
              className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear all staged products"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stagedItems.map((product, index) => (
              <div 
                key={product.id} 
                className="bg-white border-2 border-orange-200 rounded-xl p-4 hover:shadow-lg transition-all group animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-900 font-bold truncate">{product.name}</h4>
                      {product.code && (
                        <p className="text-gray-500 text-xs font-mono mt-0.5">{product.code}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeStagedItem(product.id)}
                      className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all transform hover:scale-110 active:scale-95"
                      title="Remove product"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="pt-2 border-t-2 border-orange-100">
                    {/* Quantity and Price on same row */}
                    <div className="flex items-center gap-3">
                      {/* Quantity with up/down arrows */}
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1">Qty</p>
                        <div className="flex items-center gap-1 bg-orange-50 border-2 border-orange-200 rounded-lg px-2 py-1">
                          <button
                            onClick={() => {
                              setStagedItems(prev => prev.map(item => 
                                item.id === product.id && item.quantity > 1
                                  ? { ...item, quantity: item.quantity - 1 }
                                  : item
                              ));
                            }}
                            className="p-0.5 hover:bg-orange-200 rounded transition-all transform active:scale-90"
                          >
                            <ChevronDown className="w-4 h-4 text-orange-600" />
                          </button>
                          <span className="flex-1 text-center text-orange-600 font-bold text-base min-w-[30px]">{product.quantity}</span>
                          <button
                            onClick={() => {
                              setStagedItems(prev => prev.map(item => 
                                item.id === product.id
                                  ? { ...item, quantity: item.quantity + 1 }
                                  : item
                              ));
                            }}
                            className="p-0.5 hover:bg-orange-200 rounded transition-all transform active:scale-90"
                          >
                            <ChevronUp className="w-4 h-4 text-orange-600" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1">Price</p>
                        <p className="text-gray-900 font-bold text-lg">₹{product.price.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview Bill */}
          <div className="mt-4 border-t-2 border-orange-200 pt-4 space-y-2 bg-white p-4 rounded-lg border-2 border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-orange-600" />
              <h4 className="text-gray-800 font-bold text-sm">Bill Preview</h4>
            </div>
            <div className="flex justify-between text-sm text-gray-700">
              <span>Subtotal</span>
              <span className="font-bold">{stagedTotal.toFixed(2)}</span>
            </div>
            {applyServiceCharge && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>{`Service Charge (${(SERVICE_CHARGE_RATE * 100).toFixed(1)}%)`}</span>
                <span className="font-medium">{stagedServiceCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>{`CGST (${(CGST_RATE * 100).toFixed(1)}%)`}</span>
              <span className="font-medium">{stagedCgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{`SGST (${(SGST_RATE * 100).toFixed(1)}%)`}</span>
              <span className="font-medium">{stagedSgst.toFixed(2)}</span>
            </div>
            {enabledCustomCharges.map(c => (
              <div key={c.id} className="flex justify-between text-sm text-gray-500">
                <span>{c.name} ({c.percent}%)</span>
                <span className="font-medium">{(stagedTotal * c.percent / 100).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between text-gray-900 pt-2 border-t-2 border-orange-300 text-lg">
              <span className="font-bold">Estimated Total</span>
              <span className="font-bold text-orange-600">{stagedGrandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={async () => {
                if (stagedItems.length === 0) {
                  toast.error('No items to send to kitchen');
                  return;
                }
                if (!mobileNumber.trim() || mobileNumber.length !== 10) {
                  toast.error('Please enter a valid 10-digit mobile number');
                  return;
                }
                if (orderType === 'dine-in' && !tableNumber.trim()) {
                  toast.error('Please enter table number');
                  return;
                }
                try {
                  const response = await kitchenApi.create({
                    table_number: tableNumber || undefined,
                    order_type: orderType,
                    number_of_persons: numberOfPersons || undefined,
                    customer_name: customerName || undefined,
                    mobile_number: mobileNumber || undefined,
                    initiated_by: user?.name || user?.username || undefined,
                    items: stagedItems.map(item => ({ name: item.name, quantity: item.quantity, category: item.category })),
                  });
                  if (response.success) {
                    // Add items to bill order
                    const itemsToAdd = stagedItems.map(item => ({
                      name: item.name,
                      price: item.price,
                      quantity: item.quantity,
                      code: item.code,
                      taxApplicable: item.taxApplicable,
                    }));
                    onAddItems(itemsToAdd);
                    setKotItems([...stagedItems]);
                    // Auto-save as draft with items directly
                    const saveResponse = await draftApi.create({
                      mobile_number: mobileNumber,
                      customer_name: customerName,
                      order_type: orderType,
                      table_number: tableNumber,
                      number_of_persons: numberOfPersons,
                      items: stagedItems.map(i => ({ name: i.name, price: i.price, quantity: i.quantity, category: i.category })),
                    });
                    if ((saveResponse as any).success !== false) {
                      const newDraftId = String((saveResponse.data as any)?.data?.id || (saveResponse.data as any)?.id || Date.now());
                      const newDraft: any = {
                        id: newDraftId,
                        orders: stagedItems.map(i => ({ id: Date.now().toString() + Math.random(), name: i.name, price: i.price, quantity: i.quantity, category: i.category })),
                        mobileNumber,
                        customerName,
                        orderType,
                        tableNumber,
                        numberOfPersons,
                        timestamp: new Date()
                      };
                      onDraftCreated?.(newDraft);
                    }
                    setStagedItems([]);
                    toast.success(`KOT ${(response.data as any)?.orderNumber || ''} sent to kitchen!`);
                    setShowKOT(true);
                  } else {
                    toast.error('Failed to send to kitchen');
                  }
                } catch {
                  toast.error('Error sending to kitchen');
                }
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-bold flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Sent To Kitchen ({stagedItems.length} items)
            </button>
          </div>
        </div>
      )}

      {/* Saved Orders Section */}
      {draftOrders.length > 0 && (
        <div className="p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-orange-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-6 h-6 text-orange-600" />
            <h3 className="text-gray-800 font-bold text-lg">Saved Orders</h3>
            <span className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full font-bold">
              {draftOrders.length}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={draftSearchQuery}
                onChange={(e) => setDraftSearchQuery(e.target.value)}
                placeholder="Search by mobile, name, table or item..."
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all bg-white shadow-sm"
              />
            </div>
            {draftOrders
              .filter(draft => {
                if (!draftSearchQuery.trim()) return true;
                const searchLower = draftSearchQuery.toLowerCase().trim();
                
                // Check mobile number
                const mobileMatch = draft.mobileNumber.includes(draftSearchQuery.trim());
                
                // Check customer name
                const nameMatch = draft.customerName && 
                  draft.customerName.toLowerCase().includes(searchLower);

                // Check table number (more flexible matching)
                const tableMatch = draft.tableNumber && 
                  draft.tableNumber.toLowerCase().includes(searchLower);
                
                // Check item names
                const itemMatch = draft.orders.some(item =>
                  item.name.toLowerCase().includes(searchLower)
                );
                
                return mobileMatch || nameMatch || tableMatch || itemMatch;
              })
              .map((draft) => {
                const draftTotal = draft.orders.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                return (
                  <div 
                    key={draft.id}
                    className="bg-white border-2 border-orange-200 rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {new Date(draft.timestamp).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            draft.orderType === 'dine-in' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {draft.orderType === 'dine-in' ? '🍽️ Dine-In' : '📦 Parcel'}
                          </span>
                          {draft.mobileNumber && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                              📱 {draft.mobileNumber}
                            </span>
                          )}
                          {draft.customerName && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                              👤 {draft.customerName}
                            </span>
                          )}
                          {draft.tableNumber && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                              Table {draft.tableNumber}
                            </span>
                          )}
                          {draft.numberOfPersons && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                              {draft.numberOfPersons} persons
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">{draft.orders.length} items</div>
                        <div className="text-orange-600 font-bold text-lg">₹{draftTotal.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="mb-3 max-h-24 overflow-y-auto">
                      <div className="space-y-1">
                        {draft.orders.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm text-gray-700">
                            <span>{item.name} <span className="text-orange-600 font-semibold">×{item.quantity}</span></span>
                            <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onLoadDraft(draft.id)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
                      >
                        Load Order
                      </button>
                      <button
                        onClick={() => onDeleteDraft(draft.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all font-semibold text-sm border-2 border-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* KOT Modal */}
      {showKOT && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-blue-200">
            {/* KOT Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">Kitchen Order Ticket</h2>
              </div>
              <button onClick={() => setShowKOT(false)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* KOT Content */}
            <div id="kot-print-area" className="p-6">
              <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                <h3 className="text-xl font-bold text-gray-900">KOT</h3>
                <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>

              <div className="flex justify-between text-sm mb-4">
                <div>
                  {orderType === 'dine-in' && tableNumber && (
                    <p className="font-bold text-gray-900">Table: <span className="text-blue-600">{tableNumber}</span></p>
                  )}
                  {orderType === 'parcel' && (
                    <p className="font-bold text-gray-900">Type: <span className="text-green-600">Parcel</span></p>
                  )}
                </div>
                {numberOfPersons && <p className="text-gray-600">Persons: <span className="font-bold">{numberOfPersons}</span></p>}
              </div>

              <div className="border-t-2 border-b-2 border-gray-200 py-2 mb-2">
                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                  <span className="flex-1">Item</span>
                  <span className="w-12 text-center">Qty</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {kotItems.map((item, idx) => (
                  <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}.</span>
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    </div>
                    <span className="w-12 text-center text-sm font-bold text-blue-600 bg-blue-50 rounded-md py-0.5">{item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-gray-300 pt-3 text-center">
                <p className="text-xs text-gray-400">Total Items: <span className="font-bold text-gray-700">{kotItems.reduce((sum, i) => sum + i.quantity, 0)}</span></p>
              </div>
            </div>

            {/* KOT Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowKOT(false)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const printContent = document.getElementById('kot-print-area');
                  if (printContent) {
                    const win = window.open('', '_blank', 'width=350,height=500');
                    if (win) {
                      win.document.write(`<html><head><title>KOT</title><style>body{font-family:monospace;padding:10px;font-size:12px}h3{text-align:center;margin:0}p{margin:4px 0}.item{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dotted #ccc}.header{text-align:center;border-bottom:2px dashed #000;padding-bottom:8px;margin-bottom:8px}.footer{border-top:2px dashed #000;padding-top:8px;margin-top:8px;text-align:center}</style></head><body>`);
                      win.document.write('<div class="header"><h3>KITCHEN ORDER TICKET</h3>');
                      win.document.write(`<p>${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>`);
                      if (orderType === 'dine-in' && tableNumber) win.document.write(`<p><strong>Table: ${tableNumber}</strong></p>`);
                      if (orderType === 'parcel') win.document.write('<p><strong>PARCEL</strong></p>');
                      if (numberOfPersons) win.document.write(`<p>Persons: ${numberOfPersons}</p>`);
                      win.document.write('</div>');
                      kotItems.forEach((item, idx) => {
                        win.document.write(`<div class="item"><span>${idx + 1}. ${item.name}</span><strong>x${item.quantity}</strong></div>`);
                      });
                      win.document.write(`<div class="footer"><p>Total Items: ${kotItems.reduce((sum, i) => sum + i.quantity, 0)}</p></div>`);
                      win.document.write('</body></html>');
                      win.document.close();
                      win.print();
                    }
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all font-bold flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print KOT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
