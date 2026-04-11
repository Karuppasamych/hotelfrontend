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
import PurchaseList from './modules/PurchaseList/PurchaseList';
import { BillingDashboard } from './modules/Billing/BillingDashboard';
import OrderHistory from './modules/OrderHistory/OrderHistory';
import Kitchen from './modules/Kitchen/Kitchen';
import Admin from './modules/Admin/Admin';
import { Toaster } from 'sonner';

export default function AppRouter() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <Toaster position="top-center" richColors />
          <Routes>
            <Route path="/login" element={<SignInScreen />} />
            <Route path="/" element={<Navigate to="/billing" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute menuKey="dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute menuKey="inventory"><InventoryStock /></ProtectedRoute>} />
            <Route path="/recipes" element={<ProtectedRoute menuKey="recipes"><ChefRecipe /></ProtectedRoute>} />
            <Route path="/calculator" element={<ProtectedRoute menuKey="calculator"><RecipeCalculatory /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute menuKey="users"><UserManagement /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute menuKey="billing"><BillingDashboard /></ProtectedRoute>} />
            <Route path="/purchases" element={<ProtectedRoute menuKey="purchases"><PurchaseList /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute menuKey="orders"><OrderHistory /></ProtectedRoute>} />
            <Route path="/kitchen" element={<ProtectedRoute menuKey="kitchen"><Kitchen /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute menuKey="admin"><Admin /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </Provider>
  );
}