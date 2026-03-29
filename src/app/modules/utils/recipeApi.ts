import { apiClient, ApiResponse } from './apiClient';

export interface RecipeIngredient {
  name: string;
  quantity: string;
}

export interface Recipe {
  id?: number;
  name: string;
  category: string;
  cuisine_id: number;
  cuisine?: string;
  description: string;
  prep_time: string;
  cook_time: string;
  servings: string;
  difficulty: string;
  price?: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
}

export interface CalculatorRecipe {
  id: string;
  name: string;
  category: string;
  cuisine: string;
  servings: string;
  ingredients: {
    ingredientId: string;
    amount: number;
    unit?: string;
  }[];
}

export const recipeApi = {
  // Get all recipes
  getAll: (): Promise<ApiResponse<Recipe[]>> => {
    return apiClient.get<Recipe[]>('/recipes');
  },

  // Get recipe by ID
  getById: (id: number): Promise<ApiResponse<Recipe>> => {
    return apiClient.get<Recipe>(`/recipes/${id}`);
  },

  // Create new recipe
  create: (data: Recipe): Promise<ApiResponse<{ id: number; message: string }>> => {
    return apiClient.post<{ id: number; message: string }>('/recipes', data);
  },

  // Update recipe
  update: (id: number, data: Recipe): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.put<{ message: string }>(`/recipes/${id}`, data);
  },

  // Delete recipe
  delete: (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/recipes/${id}`);
  },

  // Get recipes for calculator
  getForCalculator: (): Promise<ApiResponse<CalculatorRecipe[]>> => {
    return apiClient.get<CalculatorRecipe[]>('/recipes/calculator');
  },
};
