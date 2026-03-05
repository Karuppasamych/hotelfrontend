
import React, { useState } from 'react';
import { Dish, Ingredient, IngredientRequirement } from '../modules/RecipeCalculatory/mockData';
import { ChefHat, Scale, Users, ChevronDown, ChevronUp } from 'lucide-react';

interface RecipeDetailsProps {
  dish: Dish | null;
  servings: number;
  ingredients: Ingredient[];
}

export const RecipeDetails: React.FC<RecipeDetailsProps> = ({ dish, servings, ingredients }) => {
  const [isBillOpen, setIsBillOpen] = useState(false);
  console.log(ingredients,'ingredientsKKKS', dish?.ingredients, servings )
  if (!dish) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <div className="bg-stone-50 p-6 rounded-full mb-6 border border-stone-100 shadow-sm">
          <ChefHat className="h-10 w-10 text-stone-300" />
        </div>
        <h3 className="text-lg font-bold text-stone-900 mb-2">Recipe Specifications</h3>
        <p className="text-stone-500 max-w-xs text-sm leading-relaxed">Select a dish from the menu panel to view detailed ingredient breakdown and requirements.</p>
      </div>
    );
  }

  const getIngredientName = (id: string) => ingredients.find(i => i.id == id)?.name || 'Unknown';
  const getIngredientUnit = (id: string, recipeUnit?: string) => recipeUnit || ingredients.find(i => i.id == id)?.unit || '';

  console.log(dish,'DISHHH')
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-orange-100 bg-orange-50">
        <h2 className="font-bold text-stone-800 flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-orange-600" />
          Recipe Card
        </h2>
      </div>

      <div className="p-6 overflow-y-auto scrollbar-thin flex-1 relative">
          <div
            key={dish.id}
            className="h-full"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl font-bold text-stone-800 mb-2 tracking-tight">{dish.name}</h3>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200">
                    {dish.category}
                  </span>
                  <span className="text-xs text-stone-400 font-medium">ID: #{dish.id.padStart(4, '0')}</span>
                </div>
              </div>
              <div className="text-right bg-stone-50 px-4 py-2 rounded-xl border border-stone-100">
                <div className="flex items-center justify-end gap-2 text-stone-500 mb-1">
                   <Users className="h-4 w-4" />
                   <span className="text-[10px] font-bold uppercase tracking-wider">Servings</span>
                </div>
                <div className="text-2xl font-bold text-stone-900 leading-none">{servings}</div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border rounded-xl border-stone-200 bg-white overflow-hidden">
                <button 
                  onClick={() => setIsBillOpen(!isBillOpen)}
                  className="w-full flex items-center justify-between p-4 bg-stone-50 hover:bg-stone-100 transition-colors"
                >
                  <h4 className="text-xs font-bold text-stone-600 uppercase tracking-widest flex items-center gap-2">
                    <Scale className="h-4 w-4 text-stone-400" /> Material Bill
                  </h4>
                  {isBillOpen ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
                </button>
                
                  {isBillOpen && (
                    <div className="transition-all duration-300">
                      <div className="border-t border-stone-200">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                            <tr>
                              <th className="px-4 py-3 w-1/2">Ingredient</th>
                              <th className="px-4 py-3 text-right">Per Serving</th>
                              <th className="px-4 py-3 text-right bg-stone-100/50">Total Req.</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 bg-white">
                            {dish.ingredients.map((req: IngredientRequirement) => {
                              const perServing = req.amount / parseInt(dish.servings || '1');
                              const totalAmount = perServing * servings;
                              const unit = getIngredientUnit(req.ingredientId, req.unit);
                              
                              return (
                                <tr key={req.ingredientId} className="hover:bg-stone-50/50 transition-colors">
                                  <td className="px-4 py-3 font-medium text-stone-700">{getIngredientName(req.ingredientId)}</td>
                                  <td className="px-4 py-3 text-right text-stone-500 font-mono text-xs">
                                    {perServing.toFixed(2)} <span className="text-stone-400">{unit}</span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-stone-900 bg-stone-50/30 font-mono">
                                    {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    <span className="text-xs ml-1 font-normal text-stone-500">{unit}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};
