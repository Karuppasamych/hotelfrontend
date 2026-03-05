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

import { toast } from 'sonner';
import { ChefHat } from 'lucide-react';


export default function RecipeCalculatory() {

    // State
  const [recipes, setRecipes] = useState<Dish[]>([]);
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [selectedDishes, setSelectedDishes] = useState<{ dish: Dish; servings: number }[]>([]);
  const [activeDishId, setActiveDishId] = useState<string | null>(null);
  const [confirmedMenus, setConfirmedMenus] = useState<ConfirmedMenu[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
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

    try {
      // Check if menu already exists for this date
      const existingMenu = confirmedMenus.find(m => m.date === selectedDate);
      
      const menuData = {
        date: selectedDate,
        dishes: selectedDishes.map(item => ({
          dish_id: item.dish.id,
          servings: item.servings
        }))
      };

      let response;
      if (existingMenu) {
        // Update existing menu
        response = await confirmedMenuApi.update(parseInt(existingMenu.id), menuData);
      } else {
        // Create new menu
        response = await confirmedMenuApi.create(menuData);
      }
      
      if (response.success) {
        const newMenu: ConfirmedMenu = {
          id: existingMenu?.id || (response.data as any)?.id?.toString() || Date.now().toString(),
          date: selectedDate,
          timestamp: Date.now(),
          dishes: [...selectedDishes]
        };

        if (existingMenu) {
          setConfirmedMenus(prev => prev.map(m => m.id === existingMenu.id ? newMenu : m));
        } else {
          setConfirmedMenus(prev => [...prev, newMenu]);
        }
        
        setSelectedDishes([]);
        setActiveDishId(null);
        
        toast.success(existingMenu ? 'Menu Updated!' : 'Menu Confirmed!', {
          description: `Menu for ${selectedDate} has been ${existingMenu ? 'updated' : 'saved'} successfully.`,
          icon: <ChefHat className="h-5 w-5" />,
        });
      } else {
        toast.error('Failed to confirm menu', {
          description: response.error || 'Please try again.'
        });
      }
    } catch (error) {
      console.error('Error confirming menu:', error);
      toast.error('Error confirming menu', {
        description: 'An unexpected error occurred.'
      });
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
                
                <CookingQueue confirmedMenus={confirmedMenus} onEdit={handleEditMenu} />
              </Layout>
        </div>
      </div>
    </div>

  );
}