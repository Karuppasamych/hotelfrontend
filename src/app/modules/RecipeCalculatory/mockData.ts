
export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
}

export interface IngredientRequirement {
  ingredientId: string;
  amount: number;
  unit?: string;
}

export interface Dish {
  id: string;
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner';
  cuisine: 'Italian' | 'Indian' | 'American' | 'Asian' | 'Mexican' | 'Continental';
  ingredients: IngredientRequirement[];
  servings: string;
}

export const inventoryData: Ingredient[] = [
  { id: '1', name: 'Rice', unit: 'kg', stock: 50 },
  { id: '2', name: 'Chicken Breast', unit: 'kg', stock: 10 },
  { id: '3', name: 'Tomatoes', unit: 'kg', stock: 5 },
  { id: '4', name: 'Onions', unit: 'kg', stock: 8 },
  { id: '5', name: 'Potatoes', unit: 'kg', stock: 20 },
  { id: '6', name: 'Eggs', unit: 'pieces', stock: 60 },
  { id: '7', name: 'Milk', unit: 'liters', stock: 12 },
  { id: '8', name: 'Flour', unit: 'kg', stock: 15 },
  { id: '9', name: 'Butter', unit: 'kg', stock: 2 },
  { id: '10', name: 'Cheese', unit: 'kg', stock: 3 },
  { id: '11', name: 'Pasta', unit: 'kg', stock: 10 },
  { id: '12', name: 'Tomato Sauce', unit: 'liters', stock: 4 },
  { id: '13', name: 'Ground Beef', unit: 'kg', stock: 5 },
  { id: '14', name: 'Lettuce', unit: 'pieces', stock: 10 },
  { id: '15', name: 'Cucumber', unit: 'kg', stock: 4 },
  { id: '16', name: 'Tortillas', unit: 'pieces', stock: 30 },
  { id: '17', name: 'Beans', unit: 'kg', stock: 5 },
  { id: '18', name: 'Soy Sauce', unit: 'liters', stock: 2 },
  { id: '19', name: 'Ginger', unit: 'kg', stock: 1 },
];

// export const recipesData: Dish[] = [
//   {
//     id: '1',
//     name: 'Chicken Curry',
//     category: 'Lunch',
//     cuisine: 'Indian',
//     ingredients: [
//       { ingredientId: '2', amount: 0.2 }, // 200g chicken
//       { ingredientId: '4', amount: 0.1 }, // 100g onion
//       { ingredientId: '3', amount: 0.1 }, // 100g tomato
//       { ingredientId: '1', amount: 0.15 }, // 150g rice
//     ]
//   },
//   {
//     id: '2',
//     name: 'Scrambled Eggs',
//     category: 'Breakfast',
//     cuisine: 'American',
//     ingredients: [
//       { ingredientId: '6', amount: 3 }, // 3 eggs
//       { ingredientId: '7', amount: 0.05 }, // 50ml milk
//       { ingredientId: '9', amount: 0.02 }, // 20g butter
//     ]
//   },
//   {
//     id: '3',
//     name: 'Pasta Bolognese',
//     category: 'Dinner',
//     cuisine: 'Italian',
//     ingredients: [
//       { ingredientId: '11', amount: 0.15 }, // 150g pasta
//       { ingredientId: '13', amount: 0.15 }, // 150g beef
//       { ingredientId: '12', amount: 0.2 }, // 200ml sauce
//       { ingredientId: '10', amount: 0.05 }, // 50g cheese
//     ]
//   },
//   {
//     id: '4',
//     name: 'Garden Salad',
//     category: 'Lunch',
//     cuisine: 'Continental',
//     ingredients: [
//       { ingredientId: '14', amount: 0.5 }, // half lettuce
//       { ingredientId: '3', amount: 0.1 }, // 100g tomato
//       { ingredientId: '15', amount: 0.1 }, // 100g cucumber
//     ]
//   },
//   {
//     id: '5',
//     name: 'Pancakes',
//     category: 'Breakfast',
//     cuisine: 'American',
//     ingredients: [
//       { ingredientId: '8', amount: 0.1 }, // 100g flour
//       { ingredientId: '6', amount: 1 }, // 1 egg
//       { ingredientId: '7', amount: 0.2 }, // 200ml milk
//       { ingredientId: '9', amount: 0.03 }, // 30g butter
//     ]
//   },
//   {
//     id: '6',
//     name: 'Chicken Stir Fry',
//     category: 'Dinner',
//     cuisine: 'Asian',
//     ingredients: [
//       { ingredientId: '2', amount: 0.2 }, // 200g chicken
//       { ingredientId: '18', amount: 0.03 }, // 30ml soy sauce
//       { ingredientId: '19', amount: 0.01 }, // 10g ginger
//       { ingredientId: '1', amount: 0.15 }, // 150g rice
//     ]
//   },
//   {
//     id: '7',
//     name: 'Beef Tacos',
//     category: 'Dinner',
//     cuisine: 'Mexican',
//     ingredients: [
//       { ingredientId: '13', amount: 0.15 }, // 150g beef
//       { ingredientId: '16', amount: 3 }, // 3 tortillas
//       { ingredientId: '10', amount: 0.05 }, // 50g cheese
//       { ingredientId: '17', amount: 0.1 }, // 100g beans
//     ]
//   }
// ];
