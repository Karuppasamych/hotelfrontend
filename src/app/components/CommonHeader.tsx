import { UtensilsCrossed, CheckCircle, LogOut, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import backgroundImage from '../../assets/pandianHotel.jpeg';
import logoWhite from '../../assets/MPH_Logo_White.png'
import { Navigation } from './Navigation';

interface CommonHeaderProps {
  successMessage?: string | null;
  showStats?: boolean;
  statsComponent?: React.ReactNode;
  orderHistoryStats?: boolean;
  orderHistoryStatsData?:any
}

export function CommonHeader({ successMessage, showStats = false, statsComponent, orderHistoryStats = false, orderHistoryStatsData }: CommonHeaderProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img 
          src={backgroundImage}
          alt="Traditional Indian biryani platters"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-gray-800/45 to-gray-900/50"></div>
      </div>

      <div className="relative max-w-7xl mx-auto p-6">
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
            <CheckCircle className="size-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                {/* <UtensilsCrossed className="size-8 text-white" /> */}
                <img src={logoWhite} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">Madurai Pandian Hotel</h1>
                <p className="text-orange-200 font-medium">Food Inventory Management System</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-red-500/30 text-sm font-medium"
            >
              <LogOut className="size-4" />
              Log Out
            </button>
          </div>
        </div>

        <Navigation />

        {showStats && statsComponent && (
          <div className="mb-6">
            {statsComponent}
          </div>
        )}

        {orderHistoryStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-xl text-white overflow-hidden relative hover:scale-105 hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <p className="text-blue-100 mb-2 font-semibold">Total Orders</p>
                <p className="text-4xl font-bold">{orderHistoryStatsData.total}</p>
                <div className="mt-3 flex items-center gap-2 text-blue-100 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>For year 2026</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-xl text-white overflow-hidden relative hover:scale-105 hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <p className="text-green-100 mb-2 font-semibold">Paid Orders</p>
                <p className="text-4xl font-bold">{orderHistoryStatsData.paid}</p>
                <div className="mt-3 flex items-center gap-2 text-green-100 text-sm">
                  <span>✓ Completed</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 shadow-xl text-white overflow-hidden relative hover:scale-105 hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <p className="text-red-100 mb-2 font-semibold">Cancelled</p>
                <p className="text-4xl font-bold">{orderHistoryStatsData.cancelled}</p>
                <div className="mt-3 flex items-center gap-2 text-red-100 text-sm">
                  <span>✗ Cancelled</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 shadow-xl text-white overflow-hidden relative hover:scale-105 hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <p className="text-orange-100 mb-2 font-semibold">Total Revenue</p>
                <p className="text-4xl font-bold">
                  ₹{orderHistoryStatsData.totalRevenue.toLocaleString('en-IN')}
                </p>
                <div className="mt-3 flex items-center gap-2 text-orange-100 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>For year 2026</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-xl text-white overflow-hidden relative hover:scale-105 hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <p className="text-purple-100 mb-2 font-semibold">Monthly Revenue</p>
                <p className="text-4xl font-bold">
                  ₹{orderHistoryStatsData.monthlyRevenue.toLocaleString('en-IN')}
                </p>
                <div className="mt-3 flex items-center gap-2 text-purple-100 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>{new Date().toLocaleString('en-IN', { month: 'long' })}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}