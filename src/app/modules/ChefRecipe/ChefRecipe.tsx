import { InventoryItem } from '@/app/types';
import { CommonHeader } from '../../components/CommonHeader';
import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, CheckCircle2, ChefHat, ChevronDown, ChevronLeft, ChevronRight, Filter, Plus, Search, Utensils, X } from 'lucide-react';
import { InventoryManager } from '@/app/components/InventoryManager';
import { AddCuisineManager } from '@/app/components/AddCuisineManager';
import { RecipeBook, Recipe } from '@/app/components/RecipeBook';
import { AddRecipePage } from '@/app/components/AddRecipePage';
import { RecipeModal } from '@/app/components/RecipeModal';
import { recipes } from './constants';
import { cuisineApi } from '../utils/cuisineApi';
import { inventoryApi } from '../utils/inventoryApi';
import { recipeApi } from '../utils/recipeApi';


interface Ingredient {
  name: string;
  quantity: string;
}
export default function ChefRecipe() {
  // return (
  //   <div className="min-h-screen bg-gray-100">
  //     <CommonHeader showStats={false} />
      
  //     <div className="max-w-7xl mx-auto p-6">
  //       <div className="bg-white rounded-lg shadow-md p-6">
  //         <h2 className="text-2xl font-bold text-gray-800 mb-4">Chef Recipe Management</h2>
  //         <p className="text-gray-600">Manage recipes and cooking instructions.</p>
  //       </div>
  //     </div>
  //   </div>
  // );
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inventoryOpen, setInventoryOpen] = useState<boolean>(false);
  const [showOnlyMakeable, setShowOnlyMakeable] = useState<boolean>(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [expandedCuisines, setExpandedCuisines] = useState<Set<string>>(new Set());
  const [selectedSubCuisines, setSelectedSubCuisines] = useState<Record<string, string>>({
    'Indian': 'all',
    'Chinese': 'all',
    'Italian': 'all',
    'Mexican': 'all'
  });
  const [excludedCuisines, setExcludedCuisines] = useState<Set<string>>(new Set());
  const [showExcludeDropdown, setShowExcludeDropdown] = useState<boolean>(false);
  const [addCuisineOpen, setAddCuisineOpen] = useState<boolean>(false);
  const [customCuisines, setCustomCuisines] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [addRecipeOpen, setAddRecipeOpen] = useState<Record<string, boolean>>({});
  const [addRecipePageOpen, setAddRecipePageOpen] = useState<boolean>(false);
  const [preSelectedCuisine, setPreSelectedCuisine] = useState<string>('');
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [cuisinePage, setCuisinePage] = useState<Record<string, number>>({});
  const [cuisineSearchQuery, setCuisineSearchQuery] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loadedCuisines, setLoadedCuisines] = useState<Set<string>>(new Set());
  
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch cuisines and recipes from database on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cuisinesResponse, recipesResponse, inventoryResponse] = await Promise.all([
          cuisineApi.getAll(),
          recipeApi.getAll(),
          inventoryApi.getAll()
        ]);
        
        if (cuisinesResponse.success && cuisinesResponse.data) {
          const cuisinesFromDb = cuisinesResponse.data.map(c => ({
            id: c.id.toString(),
            name: c.cuisine_name,
            icon: c.cuisine_image
          }));
          setCustomCuisines(cuisinesFromDb);
        }
        
        if (recipesResponse.success && recipesResponse.data) {
          const formattedRecipes = recipesResponse.data.map(r => ({
            id: r.id?.toString() || '',
            name: r.name,
            description: r.description,
            category: r.category,
            cuisine: r.cuisine || '',
            prepTime: r.prep_time,
            cookTime: r.cook_time,
            servings: r.servings,
            difficulty: r.difficulty,
            ingredients: r.ingredients,
            instructions: r.instructions
          }));
          setUserRecipes(formattedRecipes);
        }

        if (inventoryResponse.success && inventoryResponse.data) {
          setInventory(inventoryResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowExcludeDropdown(false);
      }
    };

    if (showExcludeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExcludeDropdown]);

  // Initialize inventory as empty, will be loaded from database
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Hardcoded cuisines for reference (now loaded from database)
  // const cuisines = [
  //   { id: 'all', name: 'All Cuisines', icon: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400' },
  //   { id: 'Indian', name: 'Indian', icon: 'https://images.unsplash.com/photo-1567337710282-00832b415979?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBjdXJyeSUyMGZvb2R8ZW58MXx8fHwxNzY4MTA0MDg1fDA&ixlib=rb-4.1.0&q=80&w=400' },
  //   { id: 'Chinese', name: 'Chinese', icon: 'https://images.unsplash.com/photo-1716535232835-6d56282dfe8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwbm9vZGxlcyUyMGZvb2R8ZW58MXx8fHwxNzY4MTIwNTI5fDA&ixlib=rb-4.1.0&q=80&w=400' },
  //   { id: 'Italian', name: 'Italian', icon: 'https://images.unsplash.com/photo-1634672192240-ed8e1e8c1cf7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdGFsaWFuJTIwcGl6emElMjBwYXN0YXxlbnwxfHx8fDE3NjgxMzgwNzN8MA&ixlib=rb-4.1.0&q=80&w=400' },
  //   { id: 'Mexican', name: 'Mexican', icon: 'https://images.unsplash.com/photo-1688845465690-e5ea24774fd5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXhpY2FuJTIwdGFjb3MlMjBmb29kfGVufDF8fHx8MTc2ODExOTA1NHww&ixlib=rb-4.1.0&q=80&w=400' },
  // ];

  // Define sub-cuisines for each main cuisine
  const subCuisines: Record<string, { id: string; name: string }[]> = {
    'Indian': [
      { id: 'all', name: 'All Styles' },
      { id: 'north', name: 'North Indian' },
      { id: 'south', name: 'South Indian' },
      { id: 'street', name: 'Street Food' },
      { id: 'vegetarian', name: 'Vegetarian' },
    ],
    'Chinese': [
      { id: 'all', name: 'All Styles' },
      { id: 'indo-chinese', name: 'Indo-Chinese' },
      { id: 'cantonese', name: 'Cantonese' },
      { id: 'szechuan', name: 'Szechuan' },
      { id: 'hunan', name: 'Hunan' },
    ],
    'Italian': [
      { id: 'all', name: 'All Styles' },
      { id: 'pasta', name: 'Pasta Dishes' },
      { id: 'pizza', name: 'Pizza' },
      { id: 'risotto', name: 'Risotto' },
      { id: 'regional', name: 'Regional' },
    ],
    'Mexican': [
      { id: 'all', name: 'All Styles' },
      { id: 'tex-mex', name: 'Tex-Mex' },
      { id: 'traditional', name: 'Traditional' },
      { id: 'street', name: 'Street Food' },
      { id: 'coastal', name: 'Coastal' },
    ],
  };

  const handleUpdateStock = (ingredientName: string, quantity_available: number) => {
    setInventory(prev => 
      prev.map(item => 
        item.name === ingredientName 
          ? { ...item, quantity_available } 
          : item
      )
    );
  };

  const getRecipeStockPercentage = (recipe: Recipe): number => {
    const totalIngredients = recipe.ingredients.length;
    const inStockCount = recipe.ingredients.filter(ing => {
      const inventoryItem = inventory.find(
        item => item.name.toLowerCase() === ing.name.toLowerCase()
      );
      return inventoryItem ? inventoryItem.quantity_available > 0 : false;
    }).length;
    return Math.round((inStockCount / totalIngredients) * 100);
  };

  // Combine default recipes with user-added recipes
  const allRecipes = [...userRecipes];

  // Combine cuisines from database
  const allCuisines = [
    { id: 'all', name: 'All Cuisines', icon: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400' },
    ...customCuisines
  ];

  const filteredRecipes = allRecipes.filter(recipe => {
    // Filter by cuisine
    const matchesCuisine = 
      selectedCuisine === 'all' ||
      recipe.cuisine === selectedCuisine;
    
    // Filter by excluded cuisines
    const notExcluded = !excludedCuisines.has(recipe.cuisine);
    
    // Filter by search query
    const matchesSearch = 
      searchQuery === '' ||
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.ingredients.some(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by makeable (100% stock)
    const isMakeable = getRecipeStockPercentage(recipe) === 100;
    const matchesMakeable = !showOnlyMakeable || isMakeable;
    
    return matchesCuisine && notExcluded && matchesSearch && matchesMakeable;
  });

  // Group recipes by cuisine
  const groupedRecipes = allCuisines.slice(1).map(cuisine => ({
    cuisine: cuisine.name,
    icon: cuisine.icon,
    recipes: filteredRecipes.filter(r => r.cuisine === cuisine.name)
  })).filter(group => {
    // Show custom cuisines even if empty, but hide excluded cuisines
    const isCustomCuisine = customCuisines.some(c => c.name === group.cuisine);
    const isExcluded = excludedCuisines.has(group.cuisine);
    return !isExcluded && (group.recipes.length > 0 || isCustomCuisine);
  });

  const toggleCuisine = async (cuisineName: string) => {
    const isExpanding = !expandedCuisines.has(cuisineName);
    
    setExpandedCuisines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cuisineName)) {
        newSet.delete(cuisineName);
      } else {
        newSet.add(cuisineName);
      }
      return newSet;
    });
    
    // Fetch recipes for this cuisine if expanding and not already loaded
    if (isExpanding && !loadedCuisines.has(cuisineName)) {
      try {
        const response = await recipeApi.getAll();
        if (response.success && response.data) {
          const cuisineRecipes = response.data
            .filter(r => r.cuisine === cuisineName)
            .map(r => ({
              id: r.id?.toString() || '',
              name: r.name,
              description: r.description,
              category: r.category,
              cuisine: r.cuisine || '',
              prepTime: r.prep_time,
              cookTime: r.cook_time,
              servings: r.servings,
              difficulty: r.difficulty,
              ingredients: r.ingredients,
              instructions: r.instructions
            }));
          
          setUserRecipes(prev => {
            const filtered = prev.filter(r => r.cuisine !== cuisineName);
            return [...filtered, ...cuisineRecipes];
          });
          setLoadedCuisines(prev => new Set([...prev, cuisineName]));
        }
      } catch (error) {
        console.error('Error fetching recipes:', error);
      }
    }
  };

  const handleNextPage = (cuisineName: string, totalRecipes: number) => {
    const recipesPerPage = 5;
    const maxPage = Math.ceil(totalRecipes / recipesPerPage) - 1;
    setCuisinePage(prev => ({
      ...prev,
      [cuisineName]: Math.min((prev[cuisineName] || 0) + 1, maxPage)
    }));
  };

  const handlePrevPage = (cuisineName: string) => {
    setCuisinePage(prev => ({
      ...prev,
      [cuisineName]: Math.max((prev[cuisineName] || 0) - 1, 0)
    }));
  };

  const handleAddCuisine = async (cuisineName: string, cuisineIcon: string) => {
    try {
      console.log('Adding cuisine:', { cuisineName, cuisineIcon });
      const response = await cuisineApi.create({ 
        cuisine_name: cuisineName, 
        cuisine_image: cuisineIcon 
      });
      
      console.log('API Response:', response);
      
      if (response.success && response.data) {
        const newCuisine = {
          id: response.data.id.toString(),
          name: cuisineName,
          icon: cuisineIcon
        };
        setCustomCuisines(prev => [...prev, newCuisine]);
        setSelectedSubCuisines(prev => ({ ...prev, [cuisineName]: 'all' }));
        setSuccessMessage(`${cuisineName} cuisine has been successfully added!`);
        setExpandedCuisines(prev => new Set([...prev, cuisineName]));
        setAddCuisineOpen(false);
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        console.error('API Error:', response.error);
        setSuccessMessage(`Error: ${response.error || 'Failed to add cuisine'}`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      console.error('Exception:', error);
      setSuccessMessage('Error adding cuisine. Please try again.');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleEditCuisine = async (cuisineId: string, cuisineName: string, cuisineIcon: string) => {
    try {
      const response = await cuisineApi.update(Number(cuisineId), { 
        cuisine_name: cuisineName, 
        cuisine_image: cuisineIcon 
      });
      
      if (response.success) {
        setCustomCuisines(prev => prev.map(c => 
          c.id === cuisineId ? { ...c, name: cuisineName, icon: cuisineIcon } : c
        ));
        setSuccessMessage(`${cuisineName} cuisine has been successfully updated!`);
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setSuccessMessage(`Error: ${response.error || 'Failed to update cuisine'}`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      setSuccessMessage('Error updating cuisine. Please try again.');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleAddRecipe = async (recipe: any) => {
    try {
      // Find cuisine_id from cuisine name
      const cuisine = customCuisines.find(c => c.name === recipe.cuisine);
      if (!cuisine) {
        setSuccessMessage('Error: Cuisine not found');
        setTimeout(() => setSuccessMessage(''), 5000);
        return;
      }

      const recipeData = {
        name: recipe.name,
        category: recipe.category,
        cuisine_id: Number(cuisine.id),
        description: recipe.description,
        prep_time: recipe.prepTime,
        cook_time: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        ingredients: recipe.ingredients.map((ing: any) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit
        })),
        instructions: recipe.instructions
      };

      const response = await recipeApi.create(recipeData);
      
      if (response.success) {
        // Deduct ingredients from inventory with unit conversion
        for (const ing of recipe.ingredients) {
          const item = inventory.find(i => i.name.toLowerCase() === ing.name.toLowerCase());
          if (item && item.id) {
            try {
              const recipeQty = parseFloat(ing.quantity) || 0;
              const recipeUnit = ing.unit.toLowerCase();
              const inventoryUnit = item.unit.toLowerCase();
              
              // Convert recipe quantity to inventory unit
              let convertedQty = recipeQty;
              if (recipeUnit === 'g' && inventoryUnit === 'kg') {
                convertedQty = recipeQty / 1000;
              } else if (recipeUnit === 'kg' && inventoryUnit === 'g') {
                convertedQty = recipeQty * 1000;
              } else if (recipeUnit === 'ml' && inventoryUnit === 'l') {
                convertedQty = recipeQty / 1000;
              } else if (recipeUnit === 'l' && inventoryUnit === 'ml') {
                convertedQty = recipeQty * 1000;
              }
              
              // Only update if inventory has enough stock
              if (item.quantity_available >= convertedQty) {
                const newQty = item.quantity_available - convertedQty;
                
                if (!item.id) {
                  console.error('Item ID is missing:', item);
                  continue;
                }
                
                const updatePayload = {
                  product_code: item.product_code,
                  name: item.name,
                  category: item.category,
                  quantity_available: newQty,
                  unit: item.unit,
                  price: Number(item.price),
                  minimum_stock: Number(item.minimum_stock)
                };
                console.log('Updating inventory:', item.id, updatePayload);
                
                const updateResponse = await inventoryApi.update(item.id, updatePayload);
                console.log('Update response:', updateResponse);
              }
            } catch (err) {
              console.error(`Failed to update inventory for ${item.name}:`, err);
            }
          }
        }

        // Refresh inventory
        const inventoryResponse = await inventoryApi.getAll();
        if (inventoryResponse.success && inventoryResponse.data) {
          setInventory(inventoryResponse.data);
        }

        setUserRecipes(prev => [...prev, { ...recipe, id: response.data?.id.toString() || recipe.id }]);
        setSuccessMessage(`${recipe.name} has been successfully added!`);
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setSuccessMessage(`Error: ${response.error || 'Failed to add recipe'}`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error adding recipe:', error);
      setSuccessMessage('Error adding recipe. Please try again.');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* New Animated Background Design */}
      <div className="fixed inset-0 z-0">
        {/* Top Half - Enhanced Artistic Background Design */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 overflow-hidden">
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 opacity-20 bg-cover bg-center"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1619951873474-ca3683c7c77a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb29raW5nJTIwa2l0Y2hlbiUyMHBhdHRlcm4lMjB0ZXh0dXJlfGVufDF8fHx8MTc2ODE0MjQ1NXww&ixlib=rb-4.1.0&q=80&w=1080)' }}
          ></div>
          
          {/* Gradient Overlay on Image */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-100/80 via-purple-50/80 to-fuchsia-100/80"></div>
          
          {/* Large Decorative Shapes - Top Left */}
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-fuchsia-500/30 rounded-full blur-3xl"></div>
          <div className="absolute top-10 left-10 w-80 h-80 bg-gradient-to-tr from-violet-400/20 to-pink-400/20 rounded-full blur-2xl animate-pulse"></div>
          
          {/* Large Decorative Shapes - Top Right */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-to-bl from-fuchsia-400/30 to-purple-500/30 rounded-full blur-3xl"></div>
          <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-bl from-pink-400/25 to-violet-400/25 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
          
          {/* Floating Food Icons Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-16 left-20 text-6xl">🍕</div>
            <div className="absolute top-32 right-40 text-5xl">🍜</div>
            <div className="absolute top-48 left-1/3 text-7xl">🍛</div>
            <div className="absolute top-20 right-1/4 text-6xl">🌮</div>
            <div className="absolute top-52 left-1/2 text-5xl">🍝</div>
            <div className="absolute top-12 left-2/3 text-6xl">🥘</div>
          </div>
          
          {/* Geometric Pattern Overlay - Enhanced */}
          <div className="absolute inset-0 opacity-8">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <circle cx="25" cy="25" r="2" fill="currentColor" className="text-purple-400" opacity="0.3"/>
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-purple-300" opacity="0.2"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Abstract Wavy Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,100 Q250,50 500,100 T1000,100 T1500,100 T2000,100" stroke="currentColor" strokeWidth="3" fill="none" className="text-fuchsia-500"/>
            <path d="M0,150 Q250,100 500,150 T1000,150 T1500,150 T2000,150" stroke="currentColor" strokeWidth="3" fill="none" className="text-purple-500"/>
            <path d="M0,200 Q250,150 500,200 T1000,200 T1500,200 T2000,200" stroke="currentColor" strokeWidth="2" fill="none" className="text-violet-500"/>
          </svg>
          
          {/* Animated Sparkle Effects */}
          <div className="absolute top-24 left-1/4 w-3 h-3 bg-white rounded-full opacity-60 animate-ping"></div>
          <div className="absolute top-40 right-1/3 w-2 h-2 bg-white rounded-full opacity-50 animate-ping" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute top-56 left-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-70 animate-ping" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-16 right-1/4 w-2 h-2 bg-white rounded-full opacity-40 animate-ping" style={{animationDelay: '1.5s'}}></div>
          
          {/* Floating Gradient Orbs with Animation */}
          <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-violet-400 to-purple-600 rounded-full opacity-15 blur-3xl animate-bounce" style={{animationDuration: '3s'}}></div>
          <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-gradient-to-br from-fuchsia-400 to-pink-600 rounded-full opacity-15 blur-3xl animate-bounce" style={{animationDuration: '4s', animationDelay: '0.5s'}}></div>
          
          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-64 h-64 border-l-4 border-t-4 border-purple-300/20 rounded-tl-[100px]"></div>
          <div className="absolute top-0 right-0 w-64 h-64 border-r-4 border-t-4 border-fuchsia-300/20 rounded-tr-[100px]"></div>
        </div>
        
        {/* Bottom Half - Extended Art Background */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100"></div>
      </div>
      <CommonHeader showStats={false} />

      {/* Content Wrapper */}
      <div className="relative z-10">
        {/* Professional Header */}
        {/* <header className="relative shadow-xl sticky top-0 z-20 border-b-4 border-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden"> */}
        
        {/* Library Room Background Image */}
        {/* <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1640273837947-ea830d50c191?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWJyYXJ5JTIwcm9vbSUyMGludGVyaW9yfGVufDF8fHx8MTc2ODE0NTk3OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral)'
            }}
          />
        </div> */}
        {/* <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10"></div>
        <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4"> */}
            {/* Logo and Title Section */}
            {/* <div className="flex items-center gap-4"> */}
              {/* <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 blur-2xl opacity-50 rounded-full animate-pulse group-hover:opacity-80 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-400 blur-xl opacity-40 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-300 to-orange-600 blur-lg opacity-30 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 opacity-30 animate-spin" style={{animationDuration: '10s', clipPath: 'circle(50% at 50% 50%)'}}></div>
                  
                  <div className="absolute inset-2 rounded-full border-3 border-transparent bg-gradient-to-l from-yellow-400 via-orange-500 to-red-500 opacity-20 animate-spin" style={{animationDuration: '8s', animationDirection: 'reverse'}}></div>
                  
                  <div className="relative transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-2xl border-4 border-white ring-4 ring-gradient-to-br ring-orange-400 transform">
                      <img 
                        src="https://images.unsplash.com/photo-1746494557235-9e99f3193101?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb29raW5nJTIwY2hlZiUyMGtpdGNoZW4lMjBmb29kfGVufDF8fHx8MTc2ODE0NzM1MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                        alt="Chef's Recipe Library"
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-transparent to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full" style={{transition: 'transform 1s ease-in-out, opacity 0.5s'}}></div>
                    </div>
                    
                    <div className="absolute -top-3 -right-2 text-2xl animate-bounce" style={{animationDuration: '1.5s'}}>🍳</div>
                    <div className="absolute -bottom-2 -left-3 text-xl animate-bounce" style={{animationDuration: '2s', animationDelay: '0.3s'}}>🥘</div>
                    <div className="absolute top-1/2 -right-4 text-lg animate-bounce" style={{animationDuration: '1.8s', animationDelay: '0.6s'}}>🍲</div>
                    <div className="absolute -top-2 -left-2 text-sm animate-ping" style={{animationDuration: '2.5s'}}>✨</div>
                    <div className="absolute -bottom-1 -right-1 text-sm animate-ping" style={{animationDuration: '2s', animationDelay: '0.8s'}}>⭐</div>
                  </div>
                  
                  <div className="absolute inset-0 animate-spin" style={{animationDuration: '6s'}}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-400 rounded-full shadow-lg"></div>
                  </div>
                  <div className="absolute inset-0 animate-spin" style={{animationDuration: '6s', animationDelay: '2s'}}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-400 rounded-full shadow-lg"></div>
                  </div>
                  <div className="absolute inset-0 animate-spin" style={{animationDuration: '6s', animationDelay: '4s'}}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-pink-400 rounded-full shadow-lg"></div>
                  </div>
                </div>
              </div> */}
              {/* <div>
                <h1 className="text-4xl font-bold text-white" style={{ 
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 4px 16px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.5)',
                  letterSpacing: '0.5px'
                }}>
                  Chef's Recipe Library
                </h1>
                <p className="text-amber-100 font-semibold mt-1 flex items-center gap-2 text-lg" style={{ 
                  textShadow: '0 2px 6px rgba(0, 0, 0, 0.9), 0 4px 12px rgba(0, 0, 0, 0.7), 0 0 15px rgba(251, 191, 36, 0.4)' 
                }}>
                  <Globe className="w-5 h-5 text-amber-300" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))' }} />
                  Authentic recipes from around the world
                </p>
              </div> */}
            {/* </div>
            

          </div>
        </div>
      </header> */}

      {/* Search and Filter Section - Outside Header */}
      <div className="sticky top-20 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          {/* Cuisine Filter Pills with Enhanced Design */}
          <div className="flex gap-4 flex-wrap items-center justify-between">
          {/* Show/Hide Cuisines Dropdown */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setShowExcludeDropdown(!showExcludeDropdown)}
              className="px-5 py-3 bg-white border-2 border-indigo-200 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-gray-700 font-semibold hover:bg-indigo-50 group"
            >
              <Filter className="w-5 h-5 text-indigo-500 group-hover:rotate-12 transition-transform" />
              Show/Hide Cuisines
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showExcludeDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {showExcludeDropdown && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-gray-200">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-indigo-500" />
                    Show/Hide Cuisines
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">Select which cuisines to display</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {allCuisines.filter(c => c.id !== 'all').map(cuisine => {
                    const isExcluded = excludedCuisines.has(cuisine.name);
                    return (
                      <button
                        key={cuisine.id}
                        onClick={() => {
                          setExcludedCuisines(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(cuisine.name)) {
                              newSet.delete(cuisine.name);
                            } else {
                              newSet.add(cuisine.name);
                            }
                            return newSet;
                          });
                        }}
                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-all border-b border-gray-100 ${
                          isExcluded ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img src={cuisine.icon} alt={cuisine.name} className="w-12 h-12 rounded-lg object-cover shadow-sm" />
                          <span className={`font-medium ${isExcluded ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {cuisine.name}
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          isExcluded 
                            ? 'border-gray-300 bg-gray-100' 
                            : 'border-green-500 bg-green-500'
                        }`}>
                          {!isExcluded && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="p-3 bg-gray-50 border-t-2 border-gray-200 flex gap-2">
                  <button
                    onClick={() => setExcludedCuisines(new Set())}
                    className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                  >
                    Show All
                  </button>
                  <button
                    onClick={() => setShowExcludeDropdown(false)}
                    className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

                        <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-400 blur-lg opacity-0 group-hover:opacity-50 rounded-2xl transition-opacity"></div>
                <div className="relative px-5 py-3 bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl border-2 border-orange-200 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-600 font-semibold">Total Recipes</p>
                      <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600">{allRecipes.length}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 blur-lg opacity-0 group-hover:opacity-50 rounded-2xl transition-opacity"></div>
                <div className="relative px-5 py-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                      <ChefHat className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-600 font-semibold">Ready to Cook</p>
                      <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
                        {Math.min(allRecipes.filter(r => getRecipeStockPercentage(r) === 100).length, 5)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Select Cuisine Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-purple-500" />
              Select Cuisine:
            </label>
            <select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              className="px-4 py-2.5 text-sm rounded-xl border-2 border-purple-200 bg-white text-gray-700 font-medium shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all cursor-pointer"
            >
              <option value="all">All Cuisines</option>
              {allCuisines.filter(c => c.id !== 'all').map(cuisine => (
                <option key={cuisine.id} value={cuisine.name}>
                  {cuisine.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar with Compact Design */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 blur-lg opacity-0 group-hover:opacity-15 rounded-xl transition-opacity"></div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Search className="text-indigo-400 w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search for recipes, ingredients, or cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-5 py-2.5 rounded-xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 bg-white shadow-md text-gray-800 placeholder-gray-400 transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="text-gray-600 font-bold w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-4">
        {/* Inventory Manager */}
        <InventoryManager
          inventory={inventory}
          onUpdateStock={handleUpdateStock}
          isOpen={inventoryOpen}
          onToggle={() => setInventoryOpen(!inventoryOpen)}
        />

        {/* Add Cuisine Manager */}
        <AddCuisineManager
          isOpen={addCuisineOpen}
          onToggle={() => setAddCuisineOpen(!addCuisineOpen)}
          onAddCuisine={handleAddCuisine}
          onOpenAddRecipe={() => {
            setPreSelectedCuisine('');
            setAddRecipePageOpen(true);
          }}
          allRecipes={allRecipes}
          allCuisines={allCuisines}
          onEditRecipe={(recipeId) => {
            const recipe = allRecipes.find(r => r.id === recipeId);
            if (recipe) {
              setSelectedRecipe(recipe);
            }
          }}
          onEditCuisine={(cuisineId, cuisineName, cuisineIcon) => {
            handleEditCuisine(cuisineId, cuisineName, cuisineIcon);
          }}
        />
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-top duration-500">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            <p className="text-green-800 font-semibold flex-1">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Recipe Books Grouped by Cuisine */}
      <main className="max-w-7xl mx-auto px-4 pb-16 mt-8">
        {selectedCuisine === 'all' ? (
          // Show grouped by cuisine with accordion
          groupedRecipes.length > 0 ? (
            <div className="space-y-6">
              {groupedRecipes.map(group => {
                const isExpanded = expandedCuisines.has(group.cuisine);
                
                // Calculate availability count
                const availableCount = group.recipes.filter(recipe => {
                  const inStockCount = recipe.ingredients.filter(ing => {
                    const inventoryItem = inventory.find(
                      item => item.name.toLowerCase() === ing.name.toLowerCase()
                    );
                    return inventoryItem ? inventoryItem.quantity_available : false;
                  }).length;
                  return inStockCount === recipe.ingredients.length;
                }).length;
                
                return (
                  <div key={group.cuisine} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
                    {/* Accordion Header */}
                    <button
                      onClick={() => toggleCuisine(group.cuisine)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 blur-lg opacity-20 rounded-xl"></div>
                          <img src={group.icon} alt={group.cuisine} className="relative w-14 h-14 rounded-xl object-cover shadow-lg" />
                        </div>
                        <div className="text-left">
                          <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-xl">
                            {group.cuisine} Cuisine
                          </h2>
                          <p className="text-gray-600 text-sm mt-0.5 flex items-center gap-2">
                            <span className="inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                            {group.recipes.length} recipe{group.recipes.length !== 1 ? 's' : ''} available
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Availability Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-bold text-green-700">
                            {availableCount}/{group.recipes.length}
                          </span>
                          <span className="text-xs text-green-600 font-medium">Ready</span>
                        </div>
                        <ChevronDown 
                          className={`w-6 h-6 text-indigo-500 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>
                    
                    {/* Accordion Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t-2 border-gray-100 pt-4 bg-gradient-to-br from-slate-50 to-blue-50">
                        {/* Search within Cuisine */}
                        <div className="mb-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-indigo-400" />
                            <input
                              type="text"
                              placeholder={`Search in ${group.cuisine} cuisine...`}
                              value={cuisineSearchQuery[group.cuisine] || ''}
                              onChange={(e) => {
                                setCuisineSearchQuery(prev => ({
                                  ...prev,
                                  [group.cuisine]: e.target.value
                                }));
                                // Reset to first page when searching
                                setCuisinePage(prev => ({
                                  ...prev,
                                  [group.cuisine]: 0
                                }));
                              }}
                              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border-2 border-indigo-200 bg-white text-gray-700 placeholder-gray-400 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                            />
                          </div>
                        </div>
                        
                        {/* Filter by Recipe */}
                        <div className="mb-4 flex items-center gap-3">
                          <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5 text-indigo-500" />
                            Filter by Recipe:
                          </label>
                          <select
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.value !== 'all') {
                                const recipe = group.recipes.find(r => r.id === e.target.value);
                                if (recipe) setSelectedRecipe(recipe);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 text-sm rounded-lg border-2 border-indigo-200 bg-white text-gray-700 font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all cursor-pointer"
                          >
                            <option value="all">All Recipes</option>
                            {group.recipes.map(recipe => (
                              <option key={recipe.id} value={recipe.id}>
                                {recipe.name}
                              </option>
                            ))}
                          </select>
                          <span className="text-xs text-gray-500">
                            ({ group.recipes.length} recipe{group.recipes.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        
                        {/* Add New Recipe Button */}
                        <div className="mb-4">
                          <button
                            onClick={() => {
                              setPreSelectedCuisine(group.cuisine);
                              setAddRecipePageOpen(true);
                            }}
                            className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                          >
                            <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                            Add New Recipe to {group.cuisine} Cuisine
                          </button>
                        </div>
                        
                        {/* Recipe Grid with Pagination */}
                        {(() => {
                          // Filter recipes based on cuisine-specific search
                          const searchQuery = cuisineSearchQuery[group.cuisine] || '';
                          const filteredRecipes = group.recipes.filter(recipe => 
                            searchQuery === '' ||
                            recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            recipe.category.toLowerCase().includes(searchQuery.toLowerCase())
                          );
                          
                          const recipesPerPage = 5;
                          const currentPage = cuisinePage[group.cuisine] || 0;
                          const startIndex = currentPage * recipesPerPage;
                          const endIndex = startIndex + recipesPerPage;
                          const paginatedRecipes = filteredRecipes.slice(startIndex, endIndex);
                          const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
                          const hasMultiplePages = filteredRecipes.length > recipesPerPage;

                          return (
                            <>
                              {hasMultiplePages && (
                                <div className="flex items-center justify-between mb-4">
                                  <button
                                    onClick={() => handlePrevPage(group.cuisine)}
                                    disabled={currentPage === 0}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                  </button>
                                  <div className="text-sm font-semibold text-gray-700">
                                    Page {currentPage + 1} of {totalPages} ({filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''})
                                  </div>
                                  <button
                                    onClick={() => handleNextPage(group.cuisine, filteredRecipes.length)}
                                    disabled={currentPage >= totalPages - 1}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                                  >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                              
                              {filteredRecipes.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200">
                                  {searchQuery === '' && group.recipes.length === 0 ? (
                                    <>
                                      <BookOpen className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                                      <h3 className="text-gray-700 font-semibold mb-1">No recipes yet in {group.cuisine} cuisine</h3>
                                      <p className="text-gray-500 text-sm mb-4">Get started by adding your first recipe!</p>
                                      <button
                                        onClick={() => {
                                          setPreSelectedCuisine(group.cuisine);
                                          setAddRecipePageOpen(true);
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                                      >
                                        <Plus className="w-4 h-4" />
                                        Add First Recipe
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                      <h3 className="text-gray-700 font-semibold mb-1">No recipes found</h3>
                                      <p className="text-gray-500 text-sm">Try adjusting your search query</p>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                                  {paginatedRecipes.map(recipe => (
                                    <RecipeBook
                                      key={recipe.id}
                                      recipe={recipe}
                                      inventory={inventory}
                                      onClick={() => setSelectedRecipe(recipe)}
                                    />
                                  ))}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl shadow-xl border-2 border-gray-200">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-gray-800 mb-3">No recipes found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )
        ) : (
          // Show single cuisine
          filteredRecipes.length > 0 ? (
            <div>
              <div className="relative mb-8">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 blur-2xl opacity-30 rounded-2xl"></div>
                    <img 
                      src={customCuisines.find(c => c.id === selectedCuisine)?.icon} 
                      alt={customCuisines.find(c => c.id === selectedCuisine)?.name}
                      className="relative w-24 h-24 rounded-2xl object-cover shadow-xl"
                    />
                  </div>
                  <div>
                    <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                      {customCuisines.find(c => c.id === selectedCuisine)?.name} Cuisine
                    </h2>
                    <p className="text-gray-600 mt-2 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full"></span>
                      Showing {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent rounded-full"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredRecipes.map(recipe => (
                  <RecipeBook
                    key={recipe.id}
                    recipe={recipe}
                    inventory={inventory}
                    onClick={() => setSelectedRecipe(recipe)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl shadow-xl border-2 border-gray-200">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-gray-800 mb-3">No recipes found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )
        )}
      </main>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          inventory={inventory}
          onClose={() => setSelectedRecipe(null)}
          onUpdate={async () => {
            // Refresh recipes and inventory
            const [recipesResponse, inventoryResponse] = await Promise.all([
              recipeApi.getAll(),
              inventoryApi.getAll()
            ]);
            if (recipesResponse.success && recipesResponse.data) {
              const formattedRecipes = recipesResponse.data.map(r => ({
                id: r.id?.toString() || '',
                name: r.name,
                description: r.description,
                category: r.category,
                cuisine: r.cuisine || '',
                prepTime: r.prep_time,
                cookTime: r.cook_time,
                servings: r.servings,
                difficulty: r.difficulty,
                ingredients: r.ingredients,
                instructions: r.instructions
              }));
              setUserRecipes(formattedRecipes);
            }
            if (inventoryResponse.success && inventoryResponse.data) {
              setInventory(inventoryResponse.data);
            }
          }}
          cuisines={allCuisines}
        />
      )}

      {/* Add Recipe Page */}
      <AddRecipePage
        isOpen={addRecipePageOpen}
        onClose={() => {
          setAddRecipePageOpen(false);
          setPreSelectedCuisine('');
        }}
        onAddRecipe={handleAddRecipe}
        cuisines={allCuisines.map(c => c.name)}
        subCuisines={subCuisines}
        preSelectedCuisine={preSelectedCuisine}
      />
      </div>
    </div>
  );
}