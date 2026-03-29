import React, { useState } from 'react';
import { ChevronDown, Plus, Globe, X, Sparkles, ChefHat, Utensils, Lightbulb, Edit2, Search, Trash2 } from 'lucide-react';

interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  category: string;
}

interface Cuisine {
  id: string;
  name: string;
  icon: string;
}

interface AddCuisineManagerProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddCuisine: (cuisineName: string, cuisineIcon: string) => void;
  onOpenAddRecipe?: () => void;
  onEditRecipe?: (recipeId: string) => void;
  allRecipes?: Recipe[];
  allCuisines?: Cuisine[];
  onEditCuisine?: (cuisineId: string, cuisineName: string, cuisineIcon: string) => void;
  onDeleteCuisine?: (cuisineId: string, cuisineName: string) => void;
  onMessage?: (msg: string, type: 'success' | 'error') => void;
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export function AddCuisineManager({ isOpen, onToggle, onAddCuisine, onOpenAddRecipe, onEditRecipe, allRecipes, allCuisines, onEditCuisine, onDeleteCuisine, onMessage }: AddCuisineManagerProps) {
  const [newCuisineName, setNewCuisineName] = useState('');
  const [newCuisineIcon, setNewCuisineIcon] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('purple');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showEditRecipe, setShowEditRecipe] = useState(false);
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [selectedCuisineFilter, setSelectedCuisineFilter] = useState('all');
  const [cuisineSearchQuery, setCuisineSearchQuery] = useState('');
  const [editingCuisineId, setEditingCuisineId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCuisineName.trim() && newCuisineIcon.trim()) {
      if (editingCuisineId) {
        // Update existing cuisine
        if (onEditCuisine) {
          onEditCuisine(editingCuisineId, newCuisineName.trim(), newCuisineIcon.trim());
        }
      } else {
        // Add new cuisine
        onAddCuisine(newCuisineName.trim(), newCuisineIcon.trim());
      }
      setNewCuisineName('');
      setNewCuisineIcon('');
      setShowForm(false);
      setSelectedTheme('purple');
      setSelectedTags([]);
      setEditingCuisineId(null);
    }
  };

  const getSuggestedDishes = (cuisineName: string) => {
    const dishes: { [key: string]: string[] } = {
      'Thai': ['Pad Thai', 'Tom Yum Soup', 'Green Curry'],
      'Japanese': ['Sushi', 'Ramen', 'Tempura'],
      'Korean': ['Kimchi', 'Bibimbap', 'Kimbap'],
      'French': ['Croissant', 'Coq au Vin', 'Crème Brûlée'],
      'Spanish': ['Paella', 'Tapas', 'Flan'],
      'Greek': ['Moussaka', 'Gyros', 'Spanakopita'],
      'Vietnamese': ['Pho', 'Banh Mi', 'Spring Rolls'],
      'Lebanese': ['Kibbeh', 'Tabbouleh', 'Falafel'],
    };
    return dishes[cuisineName] || [];
  };

  const colorThemes = [
    { name: 'purple', from: 'from-purple-400', to: 'to-pink-500', border: 'border-purple-300' },
    { name: 'blue', from: 'from-blue-400', to: 'to-cyan-500', border: 'border-blue-300' },
    { name: 'green', from: 'from-green-400', to: 'to-emerald-500', border: 'border-green-300' },
    { name: 'orange', from: 'from-orange-400', to: 'to-red-500', border: 'border-orange-300' },
    { name: 'indigo', from: 'from-indigo-400', to: 'to-purple-500', border: 'border-indigo-300' },
    { name: 'rose', from: 'from-rose-400', to: 'to-pink-500', border: 'border-rose-300' },
  ];

  const cuisineTags = [
    '🌶️ Spicy', '🥗 Healthy', '⚡ Quick', '👨‍🍳 Complex',
    '🌱 Vegetarian', '🍖 Meat-Heavy', '🌊 Seafood', '🍰 Dessert-Rich'
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-violet-50 rounded-2xl shadow-xl border-2 border-purple-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            {/* Animated Pulsing Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-violet-500 blur-md opacity-30 rounded-full group-hover:opacity-60 transition-opacity animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-500 blur-lg opacity-20 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            
            {/* Icon Container with Rotation on Hover */}
            <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 via-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
              {/* Sparkle Effect */}
              <div className="absolute -top-1 -right-1 text-yellow-300 animate-ping" style={{animationDuration: '2s'}}>✨</div>
              
              {/* Chef Hat Icon with Bounce */}
              <ChefHat className="w-6 h-6 text-white animate-bounce" strokeWidth={2.5} style={{animationDuration: '2s'}} />
              
              {/* Plus Symbol Overlay */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-md animate-pulse">
                <Plus className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            </div>
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-purple-500 animate-pulse" style={{animationDuration: '2s'}} />
              Add New Cuisine
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Expand your recipe collection with new cuisines
            </p>
          </div>
        </div>
        <ChevronDown 
          className={`w-6 h-6 text-purple-500 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-6 pb-6 bg-gradient-to-br from-purple-50 via-violet-50 to-white border-t-2 border-purple-100">
          <div className="pt-6 space-y-6">
            {/* Custom Cuisine Form */}
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                Create Custom Cuisine
              </button>
            ) : (
              <div className="bg-white p-6 rounded-xl border-2 border-purple-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-800">
                    {editingCuisineId ? 'Edit Cuisine Details' : 'Custom Cuisine Details'}
                  </h4>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setNewCuisineName('');
                      setNewCuisineIcon('');
                      setEditingCuisineId(null);
                    }}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column - Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cuisine Name *
                      </label>
                      <input
                        type="text"
                        value={newCuisineName}
                        onChange={(e) => setNewCuisineName(e.target.value)}
                        placeholder="e.g., Thai, Japanese, Korean"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cuisine Image *
                      </label>
                      {newCuisineIcon && (
                        <div className="mb-2">
                          <img src={newCuisineIcon} alt="Preview" className="w-20 h-20 rounded-xl object-cover border-2 border-purple-200 shadow-sm" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                            onMessage?.('Please upload PNG or JPG format only', 'error');
                            e.target.value = '';
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => setNewCuisineIcon(reader.result as string);
                          reader.readAsDataURL(file);
                        }}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        required={!editingCuisineId}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Accepted formats: PNG, JPG
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="px-3 py-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all text-xs"
                      >
                        {editingCuisineId ? 'Update Cuisine' : 'Add Cuisine'}
                      </button>
                    </div>
                  </form>

                  {/* Right Column - Empty (Tips removed) */}
                  <div className="space-y-4">
                    {/* Edit Existing Cuisine Section */}
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border-2 border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-bold text-gray-800 flex items-center gap-2">
                          <Edit2 className="w-4 h-4 text-purple-600" />
                          Edit Existing Cuisine
                        </h5>
                      </div>
                      
                      {allCuisines && allCuisines.length > 0 ? (
                        <div className="space-y-3">
                          {/* Search Bar */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={cuisineSearchQuery}
                              onChange={(e) => setCuisineSearchQuery(e.target.value)}
                              placeholder="Search cuisines..."
                              className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 transition-all"
                            />
                          </div>

                          {/* Cuisine List */}
                          <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                            {allCuisines
                              .filter(cuisine => {
                                // Filter out "All Cuisines" option
                                if (cuisine.id === 'all') return false;
                                const matchesSearch = cuisine.name.toLowerCase().includes(cuisineSearchQuery.toLowerCase());
                                return matchesSearch;
                              })
                              .map(cuisine => (
                                <div
                                  key={cuisine.id}
                                  className="w-full text-left p-3 bg-white hover:bg-purple-50 border-2 border-gray-200 hover:border-purple-400 rounded-lg transition-all group"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border-2 border-purple-200">
                                        <img 
                                          src={cuisine.icon} 
                                          alt={cuisine.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 text-sm truncate">{cuisine.name}</p>
                                        <p className="text-xs text-gray-500">
                                          {allRecipes?.filter(r => r.cuisine === cuisine.name).length || 0} recipes
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                      <button
                                        onClick={() => {
                                          setEditingCuisineId(cuisine.id);
                                          setNewCuisineName(cuisine.name);
                                          setNewCuisineIcon(cuisine.icon);
                                          setShowForm(true);
                                        }}
                                        className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors"
                                        title="Edit cuisine"
                                      >
                                        <Edit2 className="w-4 h-4 text-purple-600" />
                                      </button>
                                      <button
                                        onClick={() => onDeleteCuisine?.(cuisine.id, cuisine.name)}
                                        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                        title="Delete cuisine"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            {allCuisines.filter(cuisine => {
                              if (cuisine.id === 'all') return false;
                              const matchesSearch = cuisine.name.toLowerCase().includes(cuisineSearchQuery.toLowerCase());
                              return matchesSearch;
                            }).length === 0 && (
                              <div className="text-center py-6 text-gray-500 text-sm">
                                <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>No cuisines found</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          <Globe className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p>No cuisines available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
