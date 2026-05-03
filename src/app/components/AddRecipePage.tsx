import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Video, Image as ImageIcon, ChefHat, Clock, Users, Flame, Sparkles, BookOpen } from 'lucide-react';
import { inventoryApi } from '../modules/utils/inventoryApi';
import { InventoryItem } from '../types';
import { toast } from 'sonner';

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface AddRecipePageProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecipe: (recipe: any) => void;
  cuisines: string[];
  subCuisines?: Record<string, { id: string; name: string }[]>;
  preSelectedCuisine?: string;
}

export function AddRecipePage({ isOpen, onClose, onAddRecipe, cuisines, subCuisines, preSelectedCuisine }: AddRecipePageProps) {
  const [recipeName, setRecipeName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedSubCuisine, setSelectedSubCuisine] = useState('all');
  const [category, setCategory] = useState('Main Course');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [price, setPrice] = useState('');
  const [taxApplicable, setTaxApplicable] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', quantity: '', unit: '' }]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Fetch inventory items on mount
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await inventoryApi.getAll();
        if (response.success && response.data) {
          setInventoryItems(response.data);
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };
    if (isOpen) {
      fetchInventory();
    }
  }, [isOpen]);

  // Set pre-selected cuisine when component opens
  useEffect(() => {
    if (isOpen && preSelectedCuisine) {
      setSelectedCuisine(preSelectedCuisine);
      setSelectedSubCuisine('all');
    }
  }, [isOpen, preSelectedCuisine]);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleIngredientChange = (index: number, field: 'name' | 'quantity' | 'unit', value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleRemoveInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipeName.trim()) {
      toast.error('Please enter a recipe name');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (!selectedCuisine) {
      toast.error('Please select a cuisine');
      return;
    }
    if (!prepTime.trim()) {
      toast.error('Please enter prep time');
      return;
    }
    if (!cookTime.trim()) {
      toast.error('Please enter cook time');
      return;
    }
    if (!servings.trim()) {
      toast.error('Please enter servings');
      return;
    }
    if (!price.trim() || parseFloat(price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const validIngredients = ingredients.filter(ing => ing.name.trim() !== '' && ing.quantity.trim() !== '' && ing.unit.trim() !== '');
    if (validIngredients.length === 0) {
      toast.error('Please add at least one ingredient with name, quantity and unit');
      return;
    }

    const validInstructions = instructions.filter(inst => inst.trim() !== '');
    if (validInstructions.length === 0) {
      toast.error('Please add at least one cooking instruction');
      return;
    }

    const newRecipe = {
      id: Date.now().toString(),
      name: recipeName,
      description,
      cuisine: selectedCuisine,
      subCuisine: selectedSubCuisine !== 'all' ? selectedSubCuisine : undefined,
      category,
      prepTime,
      cookTime,
      servings,
      difficulty,
      price: parseFloat(price) || 0,
      taxApplicable,
      ingredients: validIngredients,
      instructions: validInstructions,
    };

    onAddRecipe(newRecipe);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setRecipeName('');
    setDescription('');
    setSelectedCuisine('');
    setSelectedSubCuisine('all');
    setCategory('Main Course');
    setPrepTime('');
    setCookTime('');
    setServings('');
    setDifficulty('Medium');
    setPrice('');
    setTaxApplicable(true);
    setIngredients([{ name: '', quantity: '', unit: '' }]);
    setInstructions(['']);
    setVideoFile(null);
    setImageFile(null);
  };

  if (!isOpen) return null;

  const availableSubCuisines = selectedCuisine && subCuisines?.[selectedCuisine] 
    ? subCuisines[selectedCuisine] 
    : [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full my-8 relative border-4 border-purple-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 px-8 py-6 rounded-t-3xl border-b-4 border-white/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
                <ChefHat className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                  Create New Recipe
                  <Sparkles className="w-6 h-6" />
                </h2>
                <p className="text-white/90 text-sm mt-1">Share your culinary masterpiece with the world</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl flex items-center justify-center transition-all group"
            >
              <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-8 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-8">
            {/* Basic Information */}
            <section className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Recipe Name *
                  </label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="e.g., Spicy Thai Basil Chicken"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your recipe..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all resize-none"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cuisine *
                  </label>
                  <select
                    value={selectedCuisine}
                    onChange={(e) => {
                      setSelectedCuisine(e.target.value);
                      setSelectedSubCuisine('all');
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all cursor-pointer"
                    required
                  >
                    <option value="">Select Cuisine</option>
                    {cuisines.map((cuisine) => (
                      <option key={cuisine} value={cuisine}>
                        {cuisine}
                      </option>
                    ))}
                  </select>
                </div>
                {availableSubCuisines.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sub-Cuisine Style
                    </label>
                    <select
                      value={selectedSubCuisine}
                      onChange={(e) => setSelectedSubCuisine(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all cursor-pointer"
                    >
                      {availableSubCuisines.map((subCuisine) => (
                        <option key={subCuisine.id} value={subCuisine.id}>
                          {subCuisine.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all cursor-pointer"
                    required
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Appetizer">Appetizer</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Snack">Snack</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Side Dish">Side Dish</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Difficulty Level *
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all cursor-pointer"
                    required
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g., 250"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tax & Charges Applicable *
                  </label>
                  <div className="flex gap-4">
                    <label className={`flex-1 flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${taxApplicable ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}`}>
                      <input type="radio" name="taxApplicable" checked={taxApplicable} onChange={() => setTaxApplicable(true)} className="w-4 h-4 text-green-600 accent-green-600" />
                      <div>
                        <span className="text-sm font-bold text-gray-800">Yes</span>
                        <p className="text-xs text-gray-500">GST, Service charge & other charges apply</p>
                      </div>
                    </label>
                    <label className={`flex-1 flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${!taxApplicable ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}>
                      <input type="radio" name="taxApplicable" checked={!taxApplicable} onChange={() => setTaxApplicable(false)} className="w-4 h-4 text-red-600 accent-red-600" />
                      <div>
                        <span className="text-sm font-bold text-gray-800">No</span>
                        <p className="text-xs text-gray-500">No taxes or charges on this item</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* Time & Servings */}
            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Time & Servings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prep Time *
                  </label>
                  <input
                    type="text"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    placeholder="e.g., 20 mins"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cook Time *
                  </label>
                  <input
                    type="text"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    placeholder="e.g., 30 mins"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Servings *
                  </label>
                  <input
                    type="text"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    placeholder="e.g., 4 people"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Ingredients */}
            <section className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-green-600" />
                  Ingredients
                </h3>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Ingredient
                </button>
              </div>
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-3">
                    <select
                      value={ingredient.name}
                      onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all cursor-pointer bg-white"
                    >
                      <option value="">Select Ingredient</option>
                      {inventoryItems.map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={ingredient.quantity}
                      onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                      placeholder="Quantity"
                      className="w-32 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all"
                    />
                    <select
                      value={ingredient.unit}
                      onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                      className="w-40 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all cursor-pointer bg-white"
                      required
                    >
                      <option value="">Select Unit</option>
                      <option value="cup">Cup(s)</option>
                      <option value="tbsp">Tablespoon(s)</option>
                      <option value="tsp">Teaspoon(s)</option>
                      <option value="ml">Milliliter(s)</option>
                      <option value="l">Liter(s)</option>
                      <option value="g">Gram(s)</option>
                      <option value="kg">Kilogram(s)</option>
                      <option value="oz">Ounce(s)</option>
                      <option value="lb">Pound(s)</option>
                      <option value="piece">Piece(s)</option>
                      <option value="slice">Slice(s)</option>
                      <option value="pinch">Pinch</option>
                      <option value="dash">Dash</option>
                      <option value="clove">Clove(s)</option>
                      <option value="bunch">Bunch</option>
                      <option value="can">Can(s)</option>
                      <option value="package">Package(s)</option>
                      <option value="to-taste">To Taste</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      disabled={ingredients.length === 1}
                      className="w-12 h-12 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Instructions */}
            <section className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border-2 border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-orange-600" />
                  Cooking Instructions
                </h3>
                <button
                  type="button"
                  onClick={handleAddInstruction}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </button>
              </div>
              <div className="space-y-3">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-10 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0 mt-1.5">
                      {index + 1}
                    </div>
                    <textarea
                      value={instruction}
                      onChange={(e) => handleInstructionChange(index, e.target.value)}
                      placeholder={`Step ${index + 1} - Describe this cooking step...`}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all resize-none"
                      rows={2}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveInstruction(index)}
                      disabled={instructions.length === 1}
                      className="w-12 h-12 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 mt-1.5"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Media Upload */}
            <section className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-2xl border-2 border-pink-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-pink-600" />
                Media (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Video Upload */}
                <div className="border-2 border-dashed border-pink-300 rounded-xl p-6 hover:border-pink-400 transition-all bg-white/50">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center mb-3">
                      <Video className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Recipe Video</h4>
                    <p className="text-sm text-gray-600 mb-4">Upload a cooking tutorial video</p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="video-upload"
                    />
                    <label
                      htmlFor="video-upload"
                      className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg cursor-pointer transition-all shadow-md hover:shadow-lg"
                    >
                      Choose Video
                    </label>
                    {videoFile && (
                      <p className="text-sm text-green-600 mt-3 font-medium">
                        ✓ {videoFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Image Upload */}
                <div className="border-2 border-dashed border-pink-300 rounded-xl p-6 hover:border-pink-400 transition-all bg-white/50">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-3">
                      <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Recipe Image</h4>
                    <p className="text-sm text-gray-600 mb-4">Upload a photo of your dish</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg cursor-pointer transition-all shadow-md hover:shadow-lg"
                    >
                      Choose Image
                    </label>
                    {imageFile && (
                      <p className="text-sm text-green-600 mt-3 font-medium">
                        ✓ {imageFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white pt-6 mt-8 border-t-2 border-gray-200 flex gap-4">
            <button
              type="submit"
              className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all text-lg flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Create Recipe
            </button>
            <button
              type="button"
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all text-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}