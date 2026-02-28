import React, { useEffect } from 'react';
import { X, Clock, ChefHat, Package, CheckCircle2, XCircle, Sparkles, Play, Upload, Edit2, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { Recipe } from './RecipeBook';
import { InventoryItem } from '@/app/types';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { recipeApi } from '../modules/utils/recipeApi';
import { inventoryApi } from '../modules/utils/inventoryApi';

interface RecipeModalProps {
  recipe: Recipe | null;
  inventory: InventoryItem[];
  onClose: () => void;
  onUpdate?: () => void;
  cuisines?: { id: string; name: string }[];
}

const ItemType = {
  INSTRUCTION: 'instruction',
};

interface DraggableInstructionProps {
  instruction: string;
  index: number;
  moveInstruction: (dragIndex: number, hoverIndex: number) => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  colors: any;
}

function DraggableInstruction({ instruction, index, moveInstruction, onUpdate, onRemove, colors }: DraggableInstructionProps) {
  const ref = React.useRef<HTMLLIElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemType.INSTRUCTION,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType.INSTRUCTION,
    hover: (item: { index: number }) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveInstruction(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <li
      ref={ref}
      className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 p-3.5 rounded-xl transition-all shadow-sm ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{ cursor: 'move' }}
    >
      <div className="flex gap-3">
        <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing" />
        <span className={`flex-shrink-0 w-8 h-8 bg-gradient-to-br ${colors.iconBg} text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-md`}>
          {index + 1}
        </span>
        <textarea
          value={instruction}
          onChange={(e) => onUpdate(index, e.target.value)}
          placeholder={`Step ${index + 1} instruction...`}
          rows={2}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-800 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 resize-none"
        />
        <button
          onClick={() => onRemove(index)}
          className="p-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 transition-colors h-8"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
}

export function RecipeModal({ recipe, inventory, onClose, onUpdate, cuisines }: RecipeModalProps) {
  if (!recipe) return null;

  const [isEditingIngredients, setIsEditingIngredients] = React.useState(false);
  const [isEditingInstructions, setIsEditingInstructions] = React.useState(false);
  const [editedIngredients, setEditedIngredients] = React.useState(recipe.ingredients);
  const [editedInstructions, setEditedInstructions] = React.useState(recipe.instructions);
  const [originalIngredients, setOriginalIngredients] = React.useState(recipe.ingredients);

  // Reset edited values when recipe changes
  useEffect(() => {
    setEditedIngredients(recipe.ingredients);
    setEditedInstructions(recipe.instructions);
    setOriginalIngredients(recipe.ingredients);
    setIsEditingIngredients(false);
    setIsEditingInstructions(false);
  }, [recipe]);

  const handleSaveIngredients = async () => {
    try {
      console.log('Starting to save ingredients...');
      console.log('Original ingredients:', originalIngredients);
      console.log('Edited ingredients:', editedIngredients);
      
      // Find cuisine_id
      const cuisineName = recipe.cuisine;
      const cuisine = cuisines?.find(c => c.name === cuisineName);
      if (!cuisine) {
        console.error('Cuisine not found:', cuisineName);
        return;
      }

      // Update recipe in database
      const recipeData = {
        name: recipe.name,
        category: recipe.category,
        cuisine_id: Number(cuisine.id),
        description: recipe.description,
        prep_time: recipe.prepTime,
        cook_time: recipe.cookTime,
        servings: recipe.servings || '',
        difficulty: recipe.difficulty || 'Medium',
        ingredients: editedIngredients.map(ing => {
          // Handle both formats: combined string "200 g" or separate fields
          let qty: string;
          let unit: string;
          
          if (typeof ing.quantity === 'string' && ing.quantity.includes(' ')) {
            const parts = ing.quantity.trim().split(/\s+/);
            qty = parts[0];
            unit = parts[1] || '';
          } else {
            qty = String(ing.quantity);
            unit = ing.unit || '';
          }
          
          return {
            name: ing.name,
            quantity: qty,
            unit: unit
          };
        }),
        instructions: recipe.instructions
      };

      await recipeApi.update(Number(recipe.id), recipeData);

      // Fetch fresh inventory
      const freshInventoryResponse = await inventoryApi.getAll();
      const freshInventory = freshInventoryResponse.success && freshInventoryResponse.data ? freshInventoryResponse.data : inventory;

      // Step 1: Restore old ingredient quantities
      for (const oldIng of originalIngredients) {
        // Handle both formats: combined string "200 g" or separate fields
        let recipeQty: number;
        let recipeUnit: string;
        
        if (typeof oldIng.quantity === 'string' && oldIng.quantity.includes(' ')) {
          const parts = oldIng.quantity.trim().split(/\s+/);
          recipeQty = parseFloat(parts[0]) || 0;
          recipeUnit = (parts[1] || '').toLowerCase();
        } else {
          recipeQty = parseFloat(oldIng.quantity as any) || 0;
          recipeUnit = (oldIng.unit || '').toLowerCase();
        }
        
        console.log(`Original ingredient: ${oldIng.name}, quantity: ${recipeQty}, unit: ${recipeUnit}`);
        
        const item = freshInventory.find(i => i.name.toLowerCase() === oldIng.name.toLowerCase());
        if (item && item.id) {
          const inventoryUnit = item.unit.toLowerCase();
          let convertedQty = recipeQty;
          
          // Weight conversions
          if (recipeUnit === 'g' && inventoryUnit === 'kg') convertedQty = recipeQty / 1000;
          else if (recipeUnit === 'kg' && inventoryUnit === 'g') convertedQty = recipeQty * 1000;
          else if (recipeUnit === 'oz' && inventoryUnit === 'g') convertedQty = recipeQty * 28.3495;
          else if (recipeUnit === 'g' && inventoryUnit === 'oz') convertedQty = recipeQty / 28.3495;
          else if (recipeUnit === 'lb' && inventoryUnit === 'kg') convertedQty = recipeQty * 0.453592;
          else if (recipeUnit === 'kg' && inventoryUnit === 'lb') convertedQty = recipeQty / 0.453592;
          else if (recipeUnit === 'lb' && inventoryUnit === 'g') convertedQty = recipeQty * 453.592;
          else if (recipeUnit === 'g' && inventoryUnit === 'lb') convertedQty = recipeQty / 453.592;
          else if (recipeUnit === 'oz' && inventoryUnit === 'lb') convertedQty = recipeQty / 16;
          else if (recipeUnit === 'lb' && inventoryUnit === 'oz') convertedQty = recipeQty * 16;
          // Volume conversions
          else if (recipeUnit === 'ml' && inventoryUnit === 'l') convertedQty = recipeQty / 1000;
          else if (recipeUnit === 'l' && inventoryUnit === 'ml') convertedQty = recipeQty * 1000;
          else if (recipeUnit === 'cup' && inventoryUnit === 'ml') convertedQty = recipeQty * 236.588;
          else if (recipeUnit === 'ml' && inventoryUnit === 'cup') convertedQty = recipeQty / 236.588;
          else if (recipeUnit === 'tbsp' && inventoryUnit === 'ml') convertedQty = recipeQty * 14.7868;
          else if (recipeUnit === 'ml' && inventoryUnit === 'tbsp') convertedQty = recipeQty / 14.7868;
          else if (recipeUnit === 'tsp' && inventoryUnit === 'ml') convertedQty = recipeQty * 4.92892;
          else if (recipeUnit === 'ml' && inventoryUnit === 'tsp') convertedQty = recipeQty / 4.92892;
          else if (recipeUnit === 'cup' && inventoryUnit === 'l') convertedQty = recipeQty * 0.236588;
          else if (recipeUnit === 'l' && inventoryUnit === 'cup') convertedQty = recipeQty / 0.236588;
          
          const currentQty = parseFloat(item.quantity_available as any) || 0;
          const newQty = currentQty + convertedQty;
          
          console.log(`RESTORE: ${item.name} - Recipe: ${recipeQty}${recipeUnit}, Inventory: ${currentQty}${inventoryUnit}, Converted: ${convertedQty}, New: ${newQty}`);
          
          await inventoryApi.update(item.id, {
            product_code: item.product_code,
            name: item.name,
            category: item.category,
            quantity_available: newQty,
            unit: item.unit,
            price: parseFloat(item.price as any) || 0,
            minimum_stock: parseFloat(item.minimum_stock as any) || 0
          });
        }
      }

      // Step 2: Deduct new ingredient quantities
      const updatedInventoryResponse = await inventoryApi.getAll();
      const updatedInventory = updatedInventoryResponse.success && updatedInventoryResponse.data ? updatedInventoryResponse.data : freshInventory;

      for (const newIng of editedIngredients) {
        // Handle both formats: combined string "200 g" or separate fields
        let recipeQty: number;
        let recipeUnit: string;
        
        if (typeof newIng.quantity === 'string' && newIng.quantity.includes(' ')) {
          const parts = newIng.quantity.trim().split(/\s+/);
          recipeQty = parseFloat(parts[0]) || 0;
          recipeUnit = (parts[1] || '').toLowerCase();
        } else {
          recipeQty = parseFloat(newIng.quantity as any) || 0;
          recipeUnit = (newIng.unit || '').toLowerCase();
        }
        
        console.log(`Edited ingredient: ${newIng.name}, quantity: ${recipeQty}, unit: ${recipeUnit}`);
        
        const item = updatedInventory.find(i => i.name.toLowerCase() === newIng.name.toLowerCase());
        if (item && item.id) {
          const inventoryUnit = item.unit.toLowerCase();
          let convertedQty = recipeQty;
          
          // Weight conversions
          if (recipeUnit === 'g' && inventoryUnit === 'kg') convertedQty = recipeQty / 1000;
          else if (recipeUnit === 'kg' && inventoryUnit === 'g') convertedQty = recipeQty * 1000;
          else if (recipeUnit === 'oz' && inventoryUnit === 'g') convertedQty = recipeQty * 28.3495;
          else if (recipeUnit === 'g' && inventoryUnit === 'oz') convertedQty = recipeQty / 28.3495;
          else if (recipeUnit === 'lb' && inventoryUnit === 'kg') convertedQty = recipeQty * 0.453592;
          else if (recipeUnit === 'kg' && inventoryUnit === 'lb') convertedQty = recipeQty / 0.453592;
          else if (recipeUnit === 'lb' && inventoryUnit === 'g') convertedQty = recipeQty * 453.592;
          else if (recipeUnit === 'g' && inventoryUnit === 'lb') convertedQty = recipeQty / 453.592;
          else if (recipeUnit === 'oz' && inventoryUnit === 'lb') convertedQty = recipeQty / 16;
          else if (recipeUnit === 'lb' && inventoryUnit === 'oz') convertedQty = recipeQty * 16;
          // Volume conversions
          else if (recipeUnit === 'ml' && inventoryUnit === 'l') convertedQty = recipeQty / 1000;
          else if (recipeUnit === 'l' && inventoryUnit === 'ml') convertedQty = recipeQty * 1000;
          else if (recipeUnit === 'cup' && inventoryUnit === 'ml') convertedQty = recipeQty * 236.588;
          else if (recipeUnit === 'ml' && inventoryUnit === 'cup') convertedQty = recipeQty / 236.588;
          else if (recipeUnit === 'tbsp' && inventoryUnit === 'ml') convertedQty = recipeQty * 14.7868;
          else if (recipeUnit === 'ml' && inventoryUnit === 'tbsp') convertedQty = recipeQty / 14.7868;
          else if (recipeUnit === 'tsp' && inventoryUnit === 'ml') convertedQty = recipeQty * 4.92892;
          else if (recipeUnit === 'ml' && inventoryUnit === 'tsp') convertedQty = recipeQty / 4.92892;
          else if (recipeUnit === 'cup' && inventoryUnit === 'l') convertedQty = recipeQty * 0.236588;
          else if (recipeUnit === 'l' && inventoryUnit === 'cup') convertedQty = recipeQty / 0.236588;
          
          const currentQty = parseFloat(item.quantity_available as any) || 0;
          const newQty = Math.max(0, currentQty - convertedQty);
          
          console.log(`DEDUCT: ${item.name} - Recipe: ${recipeQty}${recipeUnit}, Inventory: ${currentQty}${inventoryUnit}, Converted: ${convertedQty}, New: ${newQty}`);
          
          if (currentQty >= convertedQty) {
            await inventoryApi.update(item.id, {
              product_code: item.product_code,
              name: item.name,
              category: item.category,
              quantity_available: newQty,
              unit: item.unit,
              price: parseFloat(item.price as any) || 0,
              minimum_stock: parseFloat(item.minimum_stock as any) || 0
            });
          } else {
            console.warn(`Insufficient stock for ${item.name}: need ${convertedQty}, have ${currentQty}`);
          }
        }
      }

      recipe.ingredients = editedIngredients;
      setOriginalIngredients(editedIngredients);
      setIsEditingIngredients(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error saving ingredients:', error);
    }
  };

  const parseQuantity = (quantityStr: string): number => {
    const match = quantityStr.match(/([0-9.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const handleSaveInstructions = async () => {
    try {
      const cuisineName = recipe.cuisine;
      const cuisine = cuisines?.find(c => c.name === cuisineName);
      if (!cuisine) return;

      const recipeData = {
        name: recipe.name,
        category: recipe.category,
        cuisine_id: Number(cuisine.id),
        description: recipe.description,
        prep_time: recipe.prepTime,
        cook_time: recipe.cookTime,
        servings: recipe.servings || '',
        difficulty: recipe.difficulty || 'Medium',
        ingredients: recipe.ingredients.map(ing => {
          // const [quantity, unit] = ing.quantity.split(' ');
          return {
            name: ing.name,
            quantity: `${ing.quantity}`,
            unit: ing.unit || ''
          };
        }),
        instructions: editedInstructions
      };

      await recipeApi.update(Number(recipe.id), recipeData);
      recipe.instructions = editedInstructions;
      setIsEditingInstructions(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error saving instructions:', error);
    }
  };

  const handleAddIngredient = () => {
    setEditedIngredients([...editedIngredients, { name: '', quantity: '' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setEditedIngredients(editedIngredients.filter((_, i) => i !== index));
  };

  const handleUpdateIngredient = (index: number, field: 'name' | 'quantity', value: string) => {
    const updated = [...editedIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setEditedIngredients(updated);
  };

  const handleAddInstruction = () => {
    setEditedInstructions([...editedInstructions, '']);
  };

  const handleRemoveInstruction = (index: number) => {
    setEditedInstructions(editedInstructions.filter((_, i) => i !== index));
  };

  const handleUpdateInstruction = (index: number, value: string) => {
    const updated = [...editedInstructions];
    updated[index] = value;
    setEditedInstructions(updated);
  };

  const handleMoveInstruction = (dragIndex: number, hoverIndex: number) => {
    const updated = [...editedInstructions];
    const [dragged] = updated.splice(dragIndex, 1);
    updated.splice(hoverIndex, 0, dragged);
    setEditedInstructions(updated);
  };

  const isIngredientInStock = (ingredientName: string): boolean => {
    const inventoryItem = inventory.find(
      item => item.name.toLowerCase() === ingredientName.toLowerCase()
    );
    return inventoryItem ? inventoryItem.quantity_available > 0 : false;
  };

  // Get cuisine-specific colors
  const getCuisineColors = () => {
    switch (recipe.cuisine) {
      case 'Indian':
        return {
          headerGradient: 'from-amber-500 via-orange-500 to-red-500',
          textGradient: 'from-amber-600 to-red-600',
          iconBg: 'from-amber-500 to-red-600',
          borderColor: 'border-amber-200',
          lightBg: 'from-amber-50 to-orange-50'
        };
      case 'Chinese':
        return {
          headerGradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
          textGradient: 'from-rose-600 to-fuchsia-600',
          iconBg: 'from-rose-500 to-fuchsia-600',
          borderColor: 'border-rose-200',
          lightBg: 'from-rose-50 to-pink-50'
        };
      case 'Italian':
        return {
          headerGradient: 'from-teal-500 via-cyan-500 to-blue-500',
          textGradient: 'from-teal-600 to-blue-600',
          iconBg: 'from-teal-500 to-blue-600',
          borderColor: 'border-teal-200',
          lightBg: 'from-teal-50 to-cyan-50'
        };
      case 'Mexican':
        return {
          headerGradient: 'from-lime-500 via-green-500 to-emerald-500',
          textGradient: 'from-lime-600 to-emerald-600',
          iconBg: 'from-lime-500 to-emerald-600',
          borderColor: 'border-lime-200',
          lightBg: 'from-lime-50 to-green-50'
        };
      default:
        return {
          headerGradient: 'from-indigo-500 via-purple-500 to-pink-500',
          textGradient: 'from-indigo-600 to-pink-600',
          iconBg: 'from-indigo-500 to-pink-600',
          borderColor: 'border-indigo-200',
          lightBg: 'from-indigo-50 to-purple-50'
        };
    }
  };

  const colors = getCuisineColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-scaleIn border-2 border-gray-200">
        {/* Header with cuisine-specific gradient */}
        <div className={`relative bg-gradient-to-r ${colors.headerGradient} text-white p-5 overflow-hidden`}>
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black bg-opacity-30 hover:bg-opacity-40 rounded-lg transition-all hover:rotate-90 duration-300 z-10 backdrop-blur-sm border border-white border-opacity-20 shadow-lg"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="relative flex items-start gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-300 blur-md opacity-40 rounded-xl"></div>
              <div className="relative w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-white border-opacity-30">
                <ChefHat className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-white mb-1.5 leading-tight drop-shadow-lg text-xl font-bold">{recipe.name}</h2>
              <p className="text-white text-opacity-90 text-sm mb-2.5 leading-snug drop-shadow-md">{recipe.description}</p>
              <div className="flex gap-1.5 flex-wrap">
                <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 backdrop-blur-sm rounded-lg text-xs font-semibold shadow-md flex items-center gap-1 border border-white border-opacity-20">
                  <Sparkles className="w-3 h-3" />
                  {recipe.cuisine}
                </span>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 backdrop-blur-sm rounded-lg text-xs font-semibold shadow-md border border-white border-opacity-20">
                  {recipe.category}
                </span>
                <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 backdrop-blur-sm rounded-lg text-xs font-semibold shadow-md border border-white border-opacity-20">
                  <Clock className="w-3 h-3" />
                  Prep: {recipe.prepTime}
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-pink-600 to-rose-600 backdrop-blur-sm rounded-lg text-xs font-semibold shadow-md border border-white border-opacity-20">
                  <Clock className="w-3 h-3" />
                  Cook: {recipe.cookTime}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`p-8 overflow-y-auto max-h-[calc(90vh-180px)] bg-gradient-to-br ${colors.lightBg}`}>
          {/* Video Placeholder */}
          <div className="mb-6">
            <div className={`relative w-full h-40 bg-gradient-to-br ${colors.headerGradient} rounded-xl overflow-hidden shadow-lg border-2 ${colors.borderColor} group cursor-pointer transition-all hover:shadow-xl`}>
              {/* Video Placeholder Background */}
              <div className="absolute inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  {/* Upload Icon Container */}
                  <div className="relative inline-block mb-2">
                    <div className="absolute inset-0 bg-yellow-300 blur-lg opacity-50 rounded-full animate-pulse"></div>
                    <div className={`relative w-14 h-14 bg-gradient-to-br ${colors.iconBg} rounded-xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 border-2 border-white border-opacity-50`}>
                      <Upload className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
                    </div>
                  </div>
                  
                  {/* Text and Button */}
                  <p className="text-white font-semibold text-sm drop-shadow-lg mb-1">Upload Cooking Tutorial</p>
                  <p className="text-white text-opacity-90 text-xs mb-2 drop-shadow">Add your step-by-step video guide</p>
                  
                  {/* Upload Button */}
                  <button className="px-4 py-1.5 bg-white bg-opacity-95 hover:bg-opacity-100 text-gray-800 rounded-lg font-semibold text-xs shadow-lg transition-all hover:scale-105 flex items-center gap-1.5 mx-auto border-2 border-white border-opacity-40">
                    <Upload className="w-3 h-3" strokeWidth={2.5} />
                    <span>Choose Video File</span>
                  </button>
                  
                  {/* File Format Info */}
                  <p className="text-white text-opacity-75 text-xs mt-1.5 drop-shadow">MP4, MOV, AVI • Max 100MB</p>
                </div>
              </div>
              
              {/* Decorative Grid Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-8 grid-rows-4 h-full w-full gap-4 p-4">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Ingredients with cuisine colors */}
            <div className={`bg-white p-6 rounded-2xl border-2 ${colors.borderColor} shadow-lg`}>
              <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-gray-200">
                <h3 className={`text-transparent bg-clip-text bg-gradient-to-r ${colors.textGradient} flex items-center gap-3`}>
                  <div className={`w-10 h-10 bg-gradient-to-br ${colors.iconBg} rounded-xl flex items-center justify-center shadow-md`}>
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <span>Ingredients (Per Plate)</span>
                </h3>
                {!isEditingIngredients && (
                  <button
                    onClick={() => setIsEditingIngredients(true)}
                    className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-lg text-white shadow-md transition-all hover:scale-110"
                    title="Edit Ingredients"
                  >
                    <Edit2 className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                )}
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {isEditingIngredients ? (
                  <>
                    {editedIngredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 p-3.5 rounded-xl transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {isIngredientInStock(ingredient.name) ? (
                            <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-md">
                              <XCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <select
                            value={ingredient.name}
                            onChange={(e) => handleUpdateIngredient(index, 'name', e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-800 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 cursor-pointer"
                          >
                            <option value="">Select Ingredient</option>
                            {inventory.map((item) => (
                              <option key={item.id} value={item.name}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleRemoveIngredient(index)}
                            className="p-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={ingredient.quantity}
                          onChange={(e) => handleUpdateIngredient(index, 'quantity', e.target.value)}
                          placeholder="Quantity (e.g., 200g, 2 cups)"
                          className="w-full px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                        />
                      </div>
                    ))}
                    <button
                      onClick={handleAddIngredient}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 border-2 border-blue-300 border-dashed rounded-xl flex items-center justify-center gap-2 text-blue-700 font-semibold text-sm transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Add Ingredient
                    </button>
                    <button
                      onClick={handleSaveIngredients}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg transition-all hover:scale-102 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" strokeWidth={2.5} />
                      Save Ingredients
                    </button>
                  </>
                ) : (
                  <>
                    {recipe.ingredients.map((ingredient, index) => {
                      const inStock = isIngredientInStock(ingredient.name);
                      return (
                        <div
                          key={index}
                          className={`flex justify-between items-center p-3.5 rounded-xl border-2 transition-all hover:scale-102 shadow-sm ${
                            inStock
                              ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300'
                              : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {inStock ? (
                              <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-md">
                                <XCircle className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <span className={`text-sm font-medium ${
                              inStock ? 'text-gray-800' : 'text-gray-500 line-through'
                            }`}>
                              {ingredient.name}
                            </span>
                          </div>
                          <span className={`font-bold text-sm ml-3 ${
                            inStock ? 'text-emerald-700' : 'text-red-600'
                          }`}>
                            {ingredient.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            {/* Instructions with cuisine colors */}
            <div className={`bg-white p-6 rounded-2xl border-2 ${colors.borderColor} shadow-lg`}>
              <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-gray-200">
                <h3 className={`text-transparent bg-clip-text bg-gradient-to-r ${colors.textGradient} flex items-center gap-3`}>
                  <div className={`w-10 h-10 bg-gradient-to-br ${colors.iconBg} rounded-xl flex items-center justify-center shadow-md`}>
                    <ChefHat className="w-5 h-5 text-white" />
                  </div>
                  <span>Cooking Instructions</span>
                </h3>
                {!isEditingInstructions && (
                  <button
                    onClick={() => setIsEditingInstructions(true)}
                    className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-lg text-white shadow-md transition-all hover:scale-110"
                    title="Edit Instructions"
                  >
                    <Edit2 className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                )}
              </div>
              <ol className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {isEditingInstructions ? (
                  <DndProvider backend={HTML5Backend}>
                    {editedInstructions.map((instruction, index) => (
                      <DraggableInstruction
                        key={index}
                        instruction={instruction}
                        index={index}
                        moveInstruction={handleMoveInstruction}
                        onUpdate={handleUpdateInstruction}
                        onRemove={handleRemoveInstruction}
                        colors={colors}
                      />
                    ))}
                    <button
                      onClick={handleAddInstruction}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 border-2 border-blue-300 border-dashed rounded-xl flex items-center justify-center gap-2 text-blue-700 font-semibold text-sm transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Add Instruction
                    </button>
                    <button
                      onClick={handleSaveInstructions}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg transition-all hover:scale-102 flex items-center justify-center gap-2 mt-2"
                    >
                      <Save className="w-4 h-4" strokeWidth={2.5} />
                      Save Instructions
                    </button>
                  </DndProvider>
                ) : (
                  <>
                    {recipe.instructions.map((instruction, index) => (
                      <li key={index} className="flex gap-4 group">
                        <span className={`flex-shrink-0 w-8 h-8 bg-gradient-to-br ${colors.iconBg} text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-md group-hover:scale-110 transition-transform`}>
                          {index + 1}
                        </span>
                        <span className="text-gray-800 pt-1 text-sm leading-relaxed font-medium">
                          {instruction}
                        </span>
                      </li>
                    ))}
                  </>
                )}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}