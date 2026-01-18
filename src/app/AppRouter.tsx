import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './modules/Dashboard/Dashboard';
import InventoryStock from './modules/InventoryStock/InventoryStock';
import ChefRecipe from './modules/ChefRecipe/ChefRecipe';
import RecipeCalculatory from './modules/RecipeCalculatory/RecipeCalculatory';
import UserManagement from './modules/UserManagement/UserManagement';
import Billing from './modules/Billing/Billing';
import PurchaseList from './modules/PurchaseList/PurchaseList';

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<InventoryStock />} />
        <Route path="/recipes" element={<ChefRecipe />} />
        <Route path="/calculator" element={<RecipeCalculatory />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/purchases" element={<PurchaseList />} />
      </Routes>
    </Router>
  );
}