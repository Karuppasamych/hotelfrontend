import React, { useState, useEffect } from 'react';
import { CommonHeader } from '../../components/CommonHeader';
import { Layout } from '../../components/Layout';

import { MenuPanel } from '../../components/MenuPanel';
import { RecipeDetails } from '../../components/RecipeDetails';
import { InventoryPanel } from '../../components/InventoryPanel';
import { CookingQueue, ConfirmedMenu } from '../../components/CookingQueue';
import { InventoryStatus } from '../../components/InventoryStatus';
import { Dish, Ingredient } from '../RecipeCalculatory/mockData';
import { recipeApi } from '../utils/recipeApi';
import { inventoryApi } from '../utils/inventoryApi';
import { confirmedMenuApi } from '../utils/confirmedMenuApi';
import { ConfirmCookModal } from '../../components/ConfirmCookModal';

import { toast } from 'sonner';
import { ChefHat, Trash2 } from 'lucide-react';


export default function RecipeCalculatory() {

    // State
  const [recipes, setRecipes] = useState<Dish[]>([]);
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [selectedDishes, setSelectedDishes] = useState<{ dish: Dish; servings: number }[]>([]);
  const [activeDishId, setActiveDishId] = useState<string | null>(null);
  const [confirmedMenus, setConfirmedMenus] = useState<ConfirmedMenu[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showConfirmCookModal, setShowConfirmCookModal] = useState(false);
  const [deleteQueueConfirm, setDeleteQueueConfirm] = useState<{ menuId: string; dishName: string } | null>(null);
  
  // Handlers
  const handleAddDish = (dish: Dish) => {
    setSelectedDishes((prev) => [...prev, { dish, servings: parseInt(dish.servings) || 20 }]);
    setActiveDishId(dish.id);
  };

  const handleRemoveDish = (dishId: string) => {
    setSelectedDishes((prev) => prev.filter((item) => item.dish.id !== dishId));
    if (activeDishId === dishId) {
      setActiveDishId(null);
    }
  };

  const handleUpdateServings = (dishId: string, servings: number) => {
    setSelectedDishes((prev) =>
      prev.map((item) =>
        item.dish.id === dishId ? { ...item, servings } : item
      )
    );
  };

  const handleConfirmMenu = async () => {
    if (selectedDishes.length === 0) return;
    setShowConfirmCookModal(true);
  };

  const handleConfirmWithMealTime = async (data: { meal_time: string; servings: number; is_addon: boolean }) => {
    try {
      const menuData = {
        date: selectedDate,
        meal_time: data.meal_time,
        dishes: selectedDishes.map(item => ({
          dish_id: item.dish.id,
          servings: item.servings,
          is_addon: data.is_addon
        }))
      };

      const response = await confirmedMenuApi.create(menuData);
      
      if (response.success) {
        const newMenu: ConfirmedMenu = {
          id: (response.data as any)?.id?.toString() || Date.now().toString(),
          date: selectedDate,
          timestamp: Date.now(),
          mealTime: data.meal_time,
          dishes: [...selectedDishes]
        };

        setConfirmedMenus(prev => [...prev, newMenu]);
        setSelectedDishes([]);
        setActiveDishId(null);
        setShowConfirmCookModal(false);
        
        const mealLabel = data.is_addon ? 'Add-on (All Time)' : data.meal_time.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
        toast.success('Menu Confirmed!', {
          description: `Sent to kitchen for ${mealLabel} on ${selectedDate}`,
          icon: <ChefHat className="h-5 w-5" />,
        });
      } else {
        toast.error('Failed to confirm menu', {
          description: response.error || 'Please try again.'
        });
      }
    } catch (error) {
      console.error('Error confirming menu:', error);
      toast.error('Error confirming menu');
    }
  };

  const handleEditMenu = async (date: string, dishes: { dish: Dish; servings: number }[], menuId?: string) => {
    // Load dishes into selection
    setSelectedDishes(dishes);
    
    // Set the active date
    setSelectedDate(date);
    
    // Set first dish as active if available
    if (dishes.length > 0) {
      setActiveDishId(dishes[0].dish.id);
    }

    toast.info("Menu Loaded for Editing", {
      description: `You can now modify the menu for ${date}`,
      icon: <ChefHat className="h-5 w-5" />,
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeDish = activeDishId 
    ? selectedDishes.find(d => d.dish.id === activeDishId)?.dish || recipes.find(d => d.id === activeDishId) || null
    : null;

  const activeServings = activeDishId
    ? selectedDishes.find(d => d.dish.id === activeDishId)?.servings || 0
    : 0;

  // If no dish is active but we have selected dishes, select the first one
  useEffect(() => {
    if (!activeDishId && selectedDishes.length > 0) {
      setActiveDishId(selectedDishes[0].dish.id);
    }
  }, [selectedDishes, activeDishId]);

  // Fetch recipes from API
  useEffect(() => {
    const fetchRecipes = async () => {
      const response = await recipeApi.getForCalculator();
      if (response.success && response.data) {
        setRecipes(response.data as unknown as Dish[]);
      } else {
        toast.error('Failed to load recipes');
        setRecipes([]);
      }
    };
    fetchRecipes();
  }, []);

  // Fetch inventory from API
  useEffect(() => {
    const fetchInventory = async () => {
      const response = await inventoryApi.getAll();
      if (response.success && response.data) {
        const mappedInventory: Ingredient[] = response.data.map(item => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          stock: item.quantity_available
        }));
        setInventory(mappedInventory);
      } else {
        toast.error('Failed to load inventory');
        setInventory([]);
      }
    };
    fetchInventory();
  }, []);

  // Fetch confirmed menus from API
  useEffect(() => {
    const fetchConfirmedMenus = async () => {
      const response = await confirmedMenuApi.getAll();
      if (response.success && response.data) {
        const data = (response.data as any)?.data;
        setConfirmedMenus(Array.isArray(data) ? data : []);
      }
    };
    fetchConfirmedMenus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <CommonHeader showStats={false} />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="">
          {/* <h2 className="text-2xl font-bold text-gray-800 mb-4">Recipe Calculator</h2>
          <p className="text-gray-600">Calculate recipe costs and portions.</p> */}
              <Layout>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-8rem)] h-auto mb-6">
                  {/* Left Column: Menu Planning */}
                  <div className="lg:col-span-3 h-full min-h-[500px] lg:min-h-0">
                    <MenuPanel
                      availableDishes={recipes}
                      selectedDishes={selectedDishes}
                      onAddDish={handleAddDish}
                      onRemoveDish={handleRemoveDish}
                      onUpdateServings={handleUpdateServings}
                      onSelectDish={(dish) => setActiveDishId(dish.id)}
                      activeDishId={activeDishId}
                      date={selectedDate}
                      onDateChange={setSelectedDate}
                    />
                  </div>

                  {/* Right Column: Details & Inventory */}
                  <div className="lg:col-span-9 flex flex-col h-full gap-6">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0 lg:overflow-hidden h-auto lg:h-full">
                      {/* Top Row: Recipe Detail & Inventory side-by-side on desktop */}
                      <div className="h-full lg:overflow-hidden min-h-[400px]">
                        <RecipeDetails 
                          dish={activeDish} 
                          servings={activeServings}
                          ingredients={inventory}
                        />
                      </div>
                      <div className="h-full lg:overflow-hidden min-h-[400px]">
                        <InventoryPanel 
                          selectedDishes={selectedDishes}
                          inventory={inventory}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <InventoryStatus 
                  selectedDishes={selectedDishes}
                  inventory={inventory}
                  onConfirm={handleConfirmMenu}
                  date={selectedDate}
                />
                
                <CookingQueue confirmedMenus={confirmedMenus} onEdit={handleEditMenu} onDeleteMenu={(menuId) => {
                  const menu = confirmedMenus.find(m => m.id === menuId);
                  const dishName = menu?.dishes.map(d => d.dish.name).join(', ') || 'this item';
                  setDeleteQueueConfirm({ menuId, dishName });
                }} />
              </Layout>

        {/* Confirm Cook Modal */}
        <ConfirmCookModal
          isOpen={showConfirmCookModal}
          recipeName={selectedDishes.map(d => d.dish.name).join(', ')}
          recipeId={selectedDishes[0]?.dish.id || ''}
          defaultServings={String(selectedDishes.reduce((sum, d) => sum + d.servings, 0) || 4)}
          onClose={() => setShowConfirmCookModal(false)}
          onConfirm={handleConfirmWithMealTime}
        />

        {/* Delete Queue Confirmation Dialog */}
        {deleteQueueConfirm && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="p-6 border-b flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Remove from Queue</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-2">Are you sure you want to remove this dish from the production queue?</p>
                <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">{deleteQueueConfirm.dishName}</p>
                <p className="text-sm text-red-500 mt-3">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => setDeleteQueueConfirm(null)}
                  className="flex-1 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await confirmedMenuApi.delete(parseInt(deleteQueueConfirm.menuId));
                      if (response.success) {
                        setConfirmedMenus(prev => prev.filter(m => m.id !== deleteQueueConfirm.menuId));
                        toast.success('Removed from production queue');
                      }
                    } catch (error) {
                      console.error('Error deleting menu:', error);
                    }
                    setDeleteQueueConfirm(null);
                  }}
                  className="flex-1 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>

  );
}