import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SignInScreen } from './modules/UserManagement/SignInScreen';
import Dashboard from './modules/Dashboard/Dashboard';
import InventoryStock from './modules/InventoryStock/InventoryStock';
import ChefRecipe from './modules/ChefRecipe/ChefRecipe';
import RecipeCalculatory from './modules/RecipeCalculatory/RecipeCalculatory';
import UserManagement from './modules/UserManagement/UserManagement';
import Billing from './modules/Billing/Billing';
import PurchaseList from './modules/PurchaseList/PurchaseList';

export default function AppRouter() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<SignInScreen />} />
            <Route path="/" element={<Navigate to="/inventory" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><InventoryStock /></ProtectedRoute>} />
            <Route path="/recipes" element={<ProtectedRoute><ChefRecipe /></ProtectedRoute>} />
            <Route path="/calculator" element={<ProtectedRoute><RecipeCalculatory /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/purchases" element={<ProtectedRoute><PurchaseList /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </Provider>
  );
}