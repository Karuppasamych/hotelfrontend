import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../modules/utils/adminApi';

const DEFAULT_ACCESS: Record<string, string[]> = {
  admin: ['dashboard', 'inventory', 'recipes', 'calculator', 'billing', 'purchases', 'orders', 'kitchen', 'users', 'admin'],
  manager: ['dashboard', 'inventory', 'recipes', 'calculator', 'billing', 'purchases', 'orders', 'kitchen'],
  stock_manager: ['inventory', 'purchases'],
  staff: ['billing', 'orders', 'kitchen'],
  kitchen_staff: ['recipes', 'calculator', 'kitchen'],
};

const ROLE_DEFAULTS: Record<string, string> = {
  admin: '/dashboard',
  manager: '/dashboard',
  stock_manager: '/inventory',
  staff: '/billing',
  kitchen_staff: '/kitchen',
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  menuKey?: string;
}

export function ProtectedRoute({ children, allowedRoles, menuKey }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [roleAccess, setRoleAccess] = useState<Record<string, string[]> | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const response = await adminApi.getSettings();
        const data = (response.data as any)?.data || response.data;
        if (data?.role_menu_access) {
          setRoleAccess(JSON.parse(data.role_menu_access));
        }
      } catch { /* use defaults */ }
      setAccessLoading(false);
    };
    fetchAccess();
  }, []);

  if (isLoading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && menuKey) {
    const access = roleAccess || DEFAULT_ACCESS;
    const userMenus = access[user.role] || DEFAULT_ACCESS[user.role] || [];
    if (!userMenus.includes(menuKey)) {
      return <Navigate to={ROLE_DEFAULTS[user.role] || '/billing'} replace />;
    }
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_DEFAULTS[user.role] || '/billing'} replace />;
  }

  return <>{children}</>;
}
