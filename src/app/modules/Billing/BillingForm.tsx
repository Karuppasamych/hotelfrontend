import { useState, useEffect, useRef } from 'react';
import { Plus, Package, Phone, ShoppingBag, Trash2, ShoppingCart, X, ChevronUp, ChevronDown, FileText, Clock, Search, User } from 'lucide-react';
import { DraftOrder } from './BillingDashboard';

interface BillingFormProps {
  onAddItems: (items: { name: string; price: number; quantity: number; code?: string }[]) => void;
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
}

interface StagedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  code?: string;
  category: string;
  image?: string;
}

// Common Indian restaurant items for auto-complete
const PRODUCT_SUGGESTIONS = [
  { name: 'Paneer Tikka', price: 180, code: 'P001', category: 'Starters', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmb29kJTIwcGFuZWVyJTIwdGlra2F8ZW58MXx8fHwxNzY4MTMyMTg5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Paneer Butter Masala', price: 220, code: 'P002', category: 'Veg Curries', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmb29kJTIwcGFuZWVyJTIwdGlra2F8ZW58MXx8fHwxNzY4MTMyMTg5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Dal Makhani', price: 180, code: 'P003', category: 'Veg Curries', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXR0ZXIlMjBjaGlja2VuJTIwY3Vycnl8ZW58MXx8fHwxNzY4MTMyMTg5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Butter Chicken', price: 280, code: 'P004', category: 'Non-Veg Curries', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXR0ZXIlMjBjaGlja2VuJTIwY3Vycnl8ZW58MXx8fHwxNzY4MTMyMTg5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Chicken Tikka Masala', price: 260, code: 'P005', category: 'Non-Veg Curries', image: 'https://images.unsplash.com/photo-1727280376746-b89107a5b0df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YW5kb29yaSUyMGNoaWNrZW58ZW58MXx8fHwxNzY4MTMwMTgyfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Chicken Biryani', price: 250, code: 'P006', category: 'Rice & Biryani', image: 'https://images.unsplash.com/photo-1666190092689-e3968aa0c32c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ5YW5pJTIwcmljZSUyMGRpc2h8ZW58MXx8fHwxNzY4MDM2MjUzfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Veg Biryani', price: 200, code: 'P007', category: 'Rice & Biryani', image: 'https://images.unsplash.com/photo-1666190092689-e3968aa0c32c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ5YW5pJTIwcmljZSUyMGRpc2h8ZW58MXx8fHwxNzY4MDM2MjUzfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Mutton Rogan Josh', price: 320, code: 'P008', category: 'Non-Veg Curries', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXR0ZXIlMjBjaGlja2VuJTIwY3Vycnl8ZW58MXx8fHwxNzY4MTMyMTg5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Palak Paneer', price: 200, code: 'P009', category: 'Veg Curries', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmb29kJTIwcGFuZWVyJTIwdGlra2F8ZW58MXx8fHwxNzY4MTMyMTg5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Chana Masala', price: 160, code: 'P010', category: 'Veg Curries', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXR0ZXIlMjBjaGlja2VuJTIwY3Vycnl8ZW58MXx8fHwxNzY4MTMyMTg5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Fish Curry', price: 300, code: 'P011', category: 'Non-Veg Curries', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXR0ZXIlMjBjaGlja2VuJTIwY3Vycnl8ZW58MXx8fHwxNzY4MTMyMTg5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Tandoori Chicken', price: 220, code: 'P012', category: 'Starters', image: 'https://images.unsplash.com/photo-1727280376746-b89107a5b0df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YW5kb29yaSUyMGNoaWNrZW58ZW58MXx8fHwxNzY4MTMwMTgyfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Chicken 65', price: 200, code: 'P013', category: 'Starters', image: 'https://images.unsplash.com/photo-1727280376746-b89107a5b0df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YW5kb29yaSUyMGNoaWNrZW58ZW58MXx8fHwxNzY4MTMwMTgyfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Gobi Manchurian', price: 150, code: 'P014', category: 'Starters', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmb29kJTIwcGFuZWVyJTIwdGlra2F8ZW58MXx8fHwxNzY4MTMyMTg5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Veg Spring Roll', price: 120, code: 'P015', category: 'Starters', image: 'https://images.unsplash.com/photo-1697155836252-d7f969108b5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW1vc2ElMjBpbmRpYW4lMjBzbmFja3xlbnwxfHx8fDE3NjgxMzIxOTB8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Samosa', price: 40, code: 'P016', category: 'Starters', image: 'https://images.unsplash.com/photo-1697155836252-d7f969108b5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW1vc2ElMjBpbmRpYW4lMjBzbmFja3xlbnwxfHx8fDE3NjgxMzIxOTB8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Butter Naan', price: 50, code: 'P017', category: 'Breads', image: 'https://images.unsplash.com/photo-1697155406014-04dc649b0953?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYWFuJTIwYnJlYWQlMjBpbmRpYW58ZW58MXx8fHwxNzY4MTMyMTg5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Garlic Naan', price: 60, code: 'P018', category: 'Breads', image: 'https://images.unsplash.com/photo-1697155406014-04dc649b0953?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYWFuJTIwYnJlYWQlMjBpbmRpYW58ZW58MXx8fHwxNzY4MTMyMTg5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Tandoori Roti', price: 30, code: 'P019', category: 'Breads', image: 'https://images.unsplash.com/photo-1697155406014-04dc649b0953?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYWFuJTIwYnJlYWQlMjBpbmRpYW58ZW58MXx8fHwxNzY4MTMyMTg5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Lachha Paratha', price: 60, code: 'P020', category: 'Breads', image: 'https://images.unsplash.com/photo-1697155406014-04dc649b0953?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYWFuJTIwYnJlYWQlMjBpbmRpYW58ZW58MXx8fHwxNzY4MTMyMTg5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Jeera Rice', price: 120, code: 'P021', category: 'Rice & Biryani', image: 'https://images.unsplash.com/photo-1666190092689-e3968aa0c32c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ5YW5pJTIwcmljZSUyMGRpc2h8ZW58MXx8fHwxNzY4MDM2MjUzfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Steamed Rice', price: 100, code: 'P022', category: 'Rice & Biryani', image: 'https://images.unsplash.com/photo-1666190092689-e3968aa0c32c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ5YW5pJTIwcmljZSUyMGRpc2h8ZW58MXx8fHwxNzY4MDM2MjUzfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Veg Pulao', price: 150, code: 'P023', category: 'Rice & Biryani', image: 'https://images.unsplash.com/photo-1666190092689-e3968aa0c32c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ5YW5pJTIwcmljZSUyMGRpc2h8ZW58MXx8fHwxNzY4MDM2MjUzfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Gulab Jamun', price: 60, code: 'P024', category: 'Desserts', image: 'https://images.unsplash.com/photo-1666190092159-3171cf0fbb12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBkZXNzZXJ0JTIwZ3VsYWIlMjBqYW11bnxlbnwxfHx8fDE3NjgxMjA1MzB8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Rasmalai', price: 80, code: 'P025', category: 'Desserts', image: 'https://images.unsplash.com/photo-1666190092159-3171cf0fbb12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBkZXNzZXJ0JTIwZ3VsYWIlMjBqYW11bnxlbnwxfHx8fDE3NjgxMjA1MzB8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Kulfi', price: 70, code: 'P026', category: 'Desserts', image: 'https://images.unsplash.com/photo-1666190092159-3171cf0fbb12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBkZXNzZXJ0JTIwZ3VsYWIlMjBqYW11bnxlbnwxfHx8fDE3NjgxMjA1MzB8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Gajar Halwa', price: 90, code: 'P027', category: 'Desserts', image: 'https://images.unsplash.com/photo-1666190092159-3171cf0fbb12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBkZXNzZXJ0JTIwZ3VsYWIlMjBqYW11bnxlbnwxfHx8fDE3NjgxMjA1MzB8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Sweet Lassi', price: 60, code: 'P028', category: 'Beverages', image: 'https://images.unsplash.com/photo-1692620811917-664ebd27a8c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXNzaSUyMGRyaW5rfGVufDF8fHx8MTc2ODEzMjE5MHww&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Mango Lassi', price: 80, code: 'P029', category: 'Beverages', image: 'https://images.unsplash.com/photo-1692620811917-664ebd27a8c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXNzaSUyMGRyaW5rfGVufDF8fHx8MTc2ODEzMjE5MHww&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Masala Chai', price: 30, code: 'P030', category: 'Beverages', image: 'https://images.unsplash.com/photo-1692620811917-664ebd27a8c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXNzaSUyMGRyaW5rfGVufDF8fHx8MTc2ODEzMjE5MHww&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Cold Coffee', price: 70, code: 'P031', category: 'Beverages', image: 'https://images.unsplash.com/photo-1692620811917-664ebd27a8c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXNzaSUyMGRyaW5rfGVufDF8fHx8MTc2ODEzMjE5MHww&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Fresh Lime Soda', price: 50, code: 'P032', category: 'Beverages', image: 'https://images.unsplash.com/photo-1692620811917-664ebd27a8c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXNzaSUyMGRyaW5rfGVufDF8fHx8MTc2ODEzMjE5MHww&ixlib=rb-4.1.0&q=80&w=1080' },
  { name: 'Buttermilk', price: 40, code: 'P033', category: 'Beverages', image: 'https://images.unsplash.com/photo-1692620811917-664ebd27a8c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXNzaSUyMGRyaW5rfGVufDF8fHx8MTc2ODEzMjE5MHww&ixlib=rb-4.1.0&q=80&w=1080' },
];

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
  onDeleteDraft
}: BillingFormProps) {
  const [itemName, setItemName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [suggestions, setSuggestions] = useState<typeof PRODUCT_SUGGESTIONS>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemName.trim().length > 0) {
      const filtered = PRODUCT_SUGGESTIONS.filter(item =>
        item.name.toLowerCase().includes(itemName.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setSelectedSuggestionIndex(-1);
  }, [itemName]);

  const handleSuggestionClick = (suggestion: typeof PRODUCT_SUGGESTIONS[0]) => {
    setItemName(suggestion.name);
    setPrice(suggestion.price.toString());
    setProductCode(suggestion.code);
    setSelectedImage(suggestion.image);
    setSelectedCategory(suggestion.category);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
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
      alert('Please fill all required fields');
      return;
    }

    const priceNum = parseFloat(price);
    const quantityNum = parseInt(quantity);

    if (priceNum <= 0 || quantityNum <= 0) {
      alert('Price and quantity must be greater than 0');
      return;
    }

    const newItem: StagedItem = {
      id: Date.now().toString() + Math.random(),
      name: itemName.trim(),
      price: priceNum,
      quantity: quantityNum,
      code: productCode || undefined,
      category: selectedCategory || 'Uncategorized',
      image: selectedImage || undefined
    };

    setStagedItems(prev => [...prev, newItem]);
    
    // Clear product fields
    setItemName('');
    setProductCode('');
    setPrice('');
    setQuantity('1');
    setSelectedImage('');
    setSelectedCategory('');
    setShowSuggestions(false);
    
    // Focus back to item name
    inputRef.current?.focus();
  };

  const removeStagedItem = (id: string) => {
    setStagedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddAllToBill = () => {
    if (stagedItems.length === 0) {
      alert('Please add at least one product to the staging area');
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
                Table Number
              </label>
              <input
                id="tableNumber"
                type="text"
                value={tableNumber}
                onChange={(e) => onTableNumberChange(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white transform focus:scale-[1.02] text-sm"
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
                onChange={(e) => setItemName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  // Delay to allow click events to register
                  setTimeout(() => setShowSuggestions(false), 300);
                }}
                onFocus={() => {
                  if (itemName.length > 0) {
                    const filtered = PRODUCT_SUGGESTIONS.filter(item =>
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
                      <img 
                        src={suggestion.image} 
                        alt={suggestion.name}
                        className="w-14 h-14 object-cover rounded-lg shadow-sm"
                      />
                      <div className="flex-1">
                        <div className="text-gray-900 font-semibold">{suggestion.name}</div>
                        <div className="text-gray-500 text-xs font-mono mt-0.5">{suggestion.code}</div>
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
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all font-bold text-lg bg-white shadow-sm"
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
                {product.image && (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-40 object-cover rounded-lg mb-3 shadow-sm transform group-hover:scale-105 transition-transform duration-300"
                  />
                )}
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

          <button
            onClick={handleAddAllToBill}
            className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl font-bold flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Add All to Order ({stagedItems.length} items)
          </button>
        </div>
      )}

      {/* Draft Orders Section */}
      {draftOrders.length > 0 && (
        <div className="p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-orange-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-6 h-6 text-orange-600" />
            <h3 className="text-gray-800 font-bold text-lg">Draft Orders</h3>
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
                        Load Draft
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
    </div>
  );
}
