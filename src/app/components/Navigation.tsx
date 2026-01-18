import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ChefHat, 
  Calculator, 
  Users, 
  Receipt, 
  ShoppingCart 
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/recipes', label: 'Recipes', icon: ChefHat },
  { path: '/calculator', label: 'Calculator', icon: Calculator },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/billing', label: 'Billing', icon: Receipt },
  { path: '/purchases', label: 'Purchases', icon: ShoppingCart },
];

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-white/10 backdrop-blur-md rounded-lg p-2 mb-4">
      <div className="flex flex-wrap gap-2">
        {navItems.map(({ path, label, icon: Icon }) => (
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