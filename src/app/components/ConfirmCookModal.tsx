import { useState, useEffect } from 'react';
import { X, ChefHat, Clock, Users, Coffee, Sun, Sunset, Moon, Sparkles } from 'lucide-react';

interface ConfirmCookModalProps {
  isOpen: boolean;
  recipeName: string;
  recipeId: string;
  defaultServings?: string;
  onClose: () => void;
  onConfirm: (data: { meal_time: string; servings: number; is_addon: boolean }) => void;
}

const MEAL_TIMES = [
  { id: 'breakfast', label: 'Breakfast', icon: Coffee, time: '7:00 AM - 10:00 AM', gradient: 'from-amber-400 to-orange-500', bg: 'from-amber-50 to-orange-50', border: 'border-amber-300', text: 'text-amber-700' },
  { id: 'lunch', label: 'Lunch', icon: Sun, time: '12:00 PM - 3:00 PM', gradient: 'from-green-400 to-emerald-500', bg: 'from-green-50 to-emerald-50', border: 'border-green-300', text: 'text-green-700' },
  { id: 'evening_snacks', label: 'Evening Snacks', icon: Sunset, time: '4:00 PM - 6:00 PM', gradient: 'from-purple-400 to-pink-500', bg: 'from-purple-50 to-pink-50', border: 'border-purple-300', text: 'text-purple-700' },
  { id: 'dinner', label: 'Dinner', icon: Moon, time: '7:00 PM - 10:00 PM', gradient: 'from-indigo-400 to-blue-500', bg: 'from-indigo-50 to-blue-50', border: 'border-indigo-300', text: 'text-indigo-700' },
];

export function ConfirmCookModal({ isOpen, recipeName, defaultServings, onClose, onConfirm }: ConfirmCookModalProps) {
  const [selectedMealTime, setSelectedMealTime] = useState('lunch');
  const [servings, setServings] = useState(parseInt(defaultServings || '4') || 4);
  const [isAddon, setIsAddon] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setServings(parseInt(defaultServings || '4') || 4);
    }
  }, [isOpen, defaultServings]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({
      meal_time: isAddon ? 'all_time' : selectedMealTime,
      servings,
      is_addon: isAddon,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-6 py-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/30 rounded-lg transition-all">
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-3 relative">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Confirm & Cook</h2>
              <p className="text-white/90 text-xs">{recipeName}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Add-on Toggle */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-semibold text-gray-700">ADD-ON / COMMON ITEM (ALL TIME)</span>
            </div>
            <button
              onClick={() => setIsAddon(!isAddon)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isAddon ? 'bg-yellow-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isAddon ? 'translate-x-5.5 left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Meal Time Selection */}
          {!isAddon && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Select Meal Time
              </label>
              <div className="grid grid-cols-2 gap-3">
                {MEAL_TIMES.map(meal => {
                  const Icon = meal.icon;
                  const isSelected = selectedMealTime === meal.id;
                  return (
                    <button
                      key={meal.id}
                      type="button"
                      onClick={() => setSelectedMealTime(meal.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? `bg-gradient-to-br ${meal.bg} ${meal.border} shadow-md scale-[1.02]`
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? `bg-gradient-to-br ${meal.gradient}` : 'bg-gray-100'}`}>
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <span className={`text-sm font-bold ${isSelected ? meal.text : 'text-gray-700'}`}>{meal.label}</span>
                      </div>
                      <p className={`text-xs ${isSelected ? meal.text : 'text-gray-400'} ml-9`}>{meal.time}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Servings */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              Number of Servings
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-lg font-bold text-gray-600 transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center px-3 py-2 border-2 border-gray-300 rounded-xl text-lg font-bold focus:outline-none focus:border-orange-400"
              />
              <button
                type="button"
                onClick={() => setServings(servings + 1)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-lg font-bold text-gray-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-bold flex items-center justify-center gap-2"
            >
              <ChefHat className="w-4 h-4" />
              Send to Kitchen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
