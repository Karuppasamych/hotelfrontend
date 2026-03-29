import React from 'react';
import { CheckCircle2, XCircle, Clock, ChefHat, Package, Sparkles, Star, Trash2 } from 'lucide-react';
import { InventoryItem } from '@/app/types';

interface Ingredient {
  name: string;
  quantity: string | number;
  unit?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  category: string;
  cuisine: string;
  prepTime: string;
  cookTime: string;
  servings?: string;
  difficulty?: string;
  price?: number;
  ingredients: Ingredient[];
  instructions: string[];
}

interface RecipeBookProps {
  recipe: Recipe;
  inventory: InventoryItem[];
  onClick: () => void;
  onDelete?: (recipeId: string, recipeName: string) => void;
}

export function RecipeBook({ recipe, inventory, onClick, onDelete }: RecipeBookProps) {
  const isIngredientInStock = (ingredientName: string): boolean => {
    const inventoryItem = inventory.find(
      item => item.name.toLowerCase() === ingredientName.toLowerCase()
    );
    return inventoryItem ? inventoryItem.quantity_available > 0 : false;
  };

  const getRecipeStockPercentage = (): number => {
    const totalIngredients = recipe.ingredients.length;
    const inStockCount = recipe.ingredients.filter(ing => 
      isIngredientInStock(ing.name)
    ).length;
    return Math.round((inStockCount / totalIngredients) * 100);
  };

  const stockPercentage = getRecipeStockPercentage();
  const canMake = stockPercentage === 100;

  // Determine cuisine-based color scheme
  const getCuisineColors = () => {
    switch (recipe.cuisine) {
      case 'Chinese':
        return {
          gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
          lightBg: 'from-rose-50 via-pink-50 to-fuchsia-50',
          border: 'border-rose-300',
          text: 'text-rose-700',
          badge: 'bg-rose-500',
          icon: 'text-rose-600'
        };
      case 'Italian':
        return {
          gradient: 'from-teal-500 via-cyan-500 to-blue-500',
          lightBg: 'from-teal-50 via-cyan-50 to-blue-50',
          border: 'border-teal-300',
          text: 'text-teal-700',
          badge: 'bg-teal-500',
          icon: 'text-teal-600'
        };
      default:
        return {
          gradient: 'from-violet-500 via-purple-500 to-indigo-500',
          lightBg: 'from-violet-50 via-purple-50 to-indigo-50',
          border: 'border-violet-300',
          text: 'text-violet-700',
          badge: 'bg-violet-500',
          icon: 'text-violet-600'
        };
    }
  };

  const colors = getCuisineColors();

  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
        canMake ? 'hover:shadow-xl hover:shadow-emerald-200/50' : 'hover:shadow-xl hover:shadow-slate-300/50'
      }`}
    >
      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(recipe.id, recipe.name);
          }}
          className="absolute top-2 left-2 z-10 p-1.5 bg-white/90 hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-lg shadow-sm transition-all"
          title="Delete recipe"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      )}

      {/* Decorative Corner Bookmark */}
      {canMake && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-600 rotate-45 shadow-md"></div>
            <Star className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 w-3.5 h-3.5 text-white" fill="white" />
          </div>
        </div>
      )}

      {/* Book Container */}
      <div className="relative bg-white rounded-xl overflow-hidden shadow-md border border-gray-200 group-hover:border-gray-300 transition-all">
        {/* Decorative Top Ribbon */}
        <div className={`h-1 bg-gradient-to-r ${colors.gradient}`}></div>

        {/* Book Spine Effect (Left Border) */}
        <div className={`absolute left-0 top-1 bottom-0 w-1.5 bg-gradient-to-b ${colors.gradient} rounded-r-full`}></div>

        {/* Content */}
        <div className="p-4 pl-5 relative bg-gradient-to-br from-white to-gray-50">
          {/* Floating Badge */}
          <div className="absolute top-3 right-3">
            {canMake ? (
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400 blur opacity-40 rounded-full animate-pulse"></div>
                <div className="relative px-2 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full text-xs font-bold shadow flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Ready</span>
                </div>
              </div>
            ) : stockPercentage > 0 ? (
              <div className="px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full text-xs font-bold shadow">
                {stockPercentage}%
              </div>
            ) : (
              <div className="px-2 py-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-full text-xs font-bold shadow">
                0%
              </div>
            )}
          </div>

          {/* Recipe Icon */}
          <div className={`w-10 h-10 mb-3 bg-gradient-to-br ${colors.gradient} rounded-lg flex items-center justify-center shadow group-hover:rotate-6 transition-transform duration-300`}>
            <ChefHat className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>

          {/* Recipe Title */}
          <h3 className="text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] leading-tight text-base font-semibold">
            {recipe.name}
          </h3>
          
          {/* Cuisine Badge */}
          <div className="mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${colors.badge} text-white rounded-md text-xs font-semibold shadow-sm`}>
              <Sparkles className="w-2.5 h-2.5" />
              {recipe.cuisine}
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-xs mb-3 line-clamp-2 min-h-[2rem] leading-relaxed">
            {recipe.description}
          </p>

          {/* Time Info with Modern Design */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 px-2 py-1.5 rounded-lg border border-blue-200">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-semibold leading-tight">Prep</p>
                  <p className="text-xs text-gray-700 font-medium leading-tight">{recipe.prepTime}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-gradient-to-br from-purple-50 to-pink-50 px-2 py-1.5 rounded-lg border border-purple-200">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-600" />
                <div>
                  <p className="text-xs text-purple-600 font-semibold leading-tight">Cook</p>
                  <p className="text-xs text-gray-700 font-medium leading-tight">{recipe.cookTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ingredients Status Card */}
          <div className={`relative overflow-hidden p-3 bg-gradient-to-br ${colors.lightBg} rounded-lg border ${colors.border} shadow-sm`}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 bg-white rounded-md flex items-center justify-center shadow-sm`}>
                    <Package className={`w-3.5 h-3.5 ${colors.icon}`} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Ingredients</span>
                </div>
                <span className={`text-sm font-bold ${
                  stockPercentage === 100 ? 'text-emerald-600' : 
                  stockPercentage >= 50 ? 'text-amber-600' : 
                  'text-red-600'
                }`}>
                  {recipe.ingredients.filter(ing => isIngredientInStock(ing.name)).length}/{recipe.ingredients.length}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-white rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 rounded-full ${
                    stockPercentage === 100 ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 
                    stockPercentage >= 50 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 
                    'bg-gradient-to-r from-red-400 to-rose-500'
                  }`}
                  style={{ width: `${stockPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Call to Action - Enhanced Visibility */}
          <div className="mt-4">
            <div className={`w-full py-2.5 px-3 bg-gradient-to-r ${colors.gradient} rounded-lg shadow-md group-hover:shadow-lg transition-all`}>
              <div className="flex items-center justify-center gap-2 text-white">
                <ChefHat className="w-4 h-4" strokeWidth={2.5} />
                <span className="font-bold text-sm">View Full Recipe</span>
                <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}