import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ChefHat, 
  Calculator, 
  Users, 
  Receipt, 
  ShoppingCart,
  History,
  UtensilsCrossed,
  Settings 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../modules/utils/adminApi';

const ALL_NAV_ITEMS = [
  { path: '/dashboard', key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', key: 'inventory', label: 'Inventory', icon: Package },
  { path: '/recipes', key: 'recipes', label: 'Recipes', icon: ChefHat },
  { path: '/calculator', key: 'calculator', label: 'Calculator', icon: Calculator },
  { path: '/billing', key: 'billing', label: 'Billing', icon: Receipt },
  { path: '/purchases', key: 'purchases', label: 'Purchases', icon: ShoppingCart },
  { path: '/orders', key: 'orders', label: 'Order History', icon: History },
  { path: '/kitchen', key: 'kitchen', label: 'Kitchen', icon: UtensilsCrossed },
  { path: '/users', key: 'users', label: 'Users', icon: Users },
  { path: '/admin', key: 'admin', label: 'Admin', icon: Settings },
];

const DEFAULT_ACCESS: Record<string, string[]> = {
  admin: ['dashboard', 'inventory', 'recipes', 'calculator', 'billing', 'purchases', 'orders', 'kitchen', 'users', 'admin'],
  manager: ['dashboard', 'inventory', 'recipes', 'calculator', 'billing', 'purchases', 'orders', 'kitchen'],
  stock_manager: ['inventory', 'purchases'],
  staff: ['billing', 'orders', 'kitchen'],
  kitchen_staff: ['recipes', 'calculator', 'kitchen'],
};

export function Navigation() {
  const location = useLocation();
  const { user } = useAuth();
  const userRole = user?.role || 'staff';
  const [roleAccess, setRoleAccess] = useState<Record<string, string[]>>(DEFAULT_ACCESS);

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const response = await adminApi.getSettings();
        const data = (response.data as any)?.data || response.data;
        if (data?.role_menu_access) {
          setRoleAccess(JSON.parse(data.role_menu_access));
        }
      } catch { /* use defaults */ }
    };
    fetchAccess();
  }, []);

  const allowedMenus = roleAccess[userRole] || DEFAULT_ACCESS[userRole] || [];
  const filteredNavItems = ALL_NAV_ITEMS.filter(item => allowedMenus.includes(item.key));

  return (
    <nav className="bg-white/10 backdrop-blur-md rounded-lg p-2 mb-4">
      <div className="flex flex-wrap gap-2">
        {filteredNavItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              location.pathname === path
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
