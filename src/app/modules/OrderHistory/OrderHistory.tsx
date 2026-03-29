import { UtensilsCrossed, Check, ClipboardList, TrendingUp, Search, Filter, X, RefreshCw, Download, Loader2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { billingApi } from '../utils/billingApi';
import { AgGridDataTable } from '../../components/AgGridDataTable';
import { createOrderHistoryColumnDefs } from '../../components/OrderHistoryColumnDefs';
import { DateRangePicker } from './DateRangePicker';
import { OrderDetailsModal } from './OrderDetailsModal';
import { CommonHeader } from '@/app/components/CommonHeader';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderId: string;
  billId: string;
  date: string;
  orderType: 'dine-in' | 'takeaway';
  tableNumber?: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMode: 'Cash' | 'UPI' | 'Card';
  orderStatus: 'Paid' | 'Cancelled';
}


const mapPaymentMethod = (method: string): 'Cash' | 'UPI' | 'Card' => {
  const map: Record<string, 'Cash' | 'UPI' | 'Card'> = { cash: 'Cash', upi: 'UPI', card: 'Card' };
  return map[method?.toLowerCase()] || 'Cash';
};

const mapOrderType = (type: string): 'dine-in' | 'takeaway' => {
  return type === 'parcel' ? 'takeaway' : 'dine-in';
};

const mapStatus = (status: string): 'Paid' | 'Cancelled' => {
  return status === 'cancelled' ? 'Cancelled' : 'Paid';
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [billsResponse, cancellationsResponse] = await Promise.all([
        billingApi.getAll(),
        billingApi.getCancellations(),
      ]);

      // Map paid bills
      const bills = (billsResponse as any)?.data || billsResponse || [];
      const billsArray = Array.isArray(bills) ? bills : [];
      const mappedBills: Order[] = billsArray.map((bill: any) => ({
        id: String(bill.id),
        orderId: `ORD-${String(bill.id).padStart(3, '0')}`,
        billId: bill.bill_number,
        date: bill.created_at,
        orderType: mapOrderType(bill.order_type),
        tableNumber: bill.table_number || undefined,
        items: (bill.items || []).map((item: any, idx: number) => ({
          id: String(item.id || `${bill.id}-${idx}`),
          name: item.item_name,
          quantity: item.quantity,
          price: parseFloat(item.unit_price),
        })),
        totalAmount: parseFloat(bill.total_amount),
        paymentMode: mapPaymentMethod(bill.payment_method),
        orderStatus: mapStatus(bill.status),
      }));

      // Map cancellations
      const cancellations = (cancellationsResponse as any)?.data?.data || (cancellationsResponse as any)?.data || [];
      const cancellationsArray = Array.isArray(cancellations) ? cancellations : [];
      const mappedCancellations: Order[] = cancellationsArray.map((c: any) => ({
        id: `cancel-${c.id}`,
        orderId: `CAN-${String(c.id).padStart(3, '0')}`,
        billId: '-',
        date: c.created_at,
        orderType: mapOrderType(c.order_type || 'dine-in'),
        tableNumber: c.table_number || undefined,
        items: [{
          id: `cancel-item-${c.id}`,
          name: c.item_name,
          quantity: c.quantity,
          price: parseFloat(c.price),
        }],
        totalAmount: parseFloat(c.price) * c.quantity,
        paymentMode: 'Cash' as const,
        orderStatus: 'Cancelled' as const,
      }));

      setOrders([...mappedBills, ...mappedCancellations]);
    } catch (err) {
      console.error('Failed to fetch order history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.billId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderType.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        statusFilter === 'all' || order.orderStatus === statusFilter;

      const matchesOrderType =
        orderTypeFilter === 'all' || order.orderType === orderTypeFilter;

      const orderDate = new Date(order.date);
      const endOfDay = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999) : null;
      const matchesDateRange = 
        (!startDate || orderDate >= startDate) &&
        (!endOfDay || orderDate <= endOfDay);

      return matchesSearch && matchesStatus && matchesOrderType && matchesDateRange;
    });
  }, [orders, searchQuery, statusFilter, orderTypeFilter, startDate, endDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = orders.length;
    const paid = orders.filter((o) => o.orderStatus === 'Paid').length;
    const cancelled = orders.filter((o) => o.orderStatus === 'Cancelled').length;
    const totalRevenue = orders
      .filter((o) => o.orderStatus === 'Paid')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = orders
      .filter((o) => {
        const orderDate = new Date(o.date);
        return (
          o.orderStatus === 'Paid' &&
          orderDate.getMonth() === currentMonth &&
          orderDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, order) => sum + order.totalAmount, 0);

    return { total, paid, cancelled, totalRevenue, monthlyRevenue };
  }, [orders]);

  const handlePrintOrder = (order: Order) => {
    console.log('Printing order:', order.orderId);
    alert(`Printing bill for ${order.orderId}`);
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Order ID', 'Bill ID', 'Date', 'Time', 'Type', 'Items', 'Quantity', 'Amount', 'Payment', 'Status'];
    const csvData = filteredOrders.map(order => [
      order.orderId,
      order.billId,
      new Date(order.date).toLocaleDateString('en-IN'),
      new Date(order.date).toLocaleTimeString('en-IN'),
      order.orderType,
      order.items.map(item => `${item.name} (${item.quantity})`).join('; '),
      order.items.reduce((sum, item) => sum + item.quantity, 0),
      `₹${order.totalAmount.toFixed(2)}`,
      order.paymentMode,
      order.orderStatus
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setOrderTypeFilter('all');
    setStartDate(null);
    setEndDate(null);
    fetchOrders();
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setOrderTypeFilter('all');
    setStartDate(null);
    setEndDate(null);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || orderTypeFilter !== 'all' || startDate || endDate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Hero Section with Background */}
      {/* <div 
        className="relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80')`,
        }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-xl text-white overflow-hidden relative hover:scale-105 hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <p className="text-blue-100 mb-2 font-semibold">Total Orders</p>
                <p className="text-4xl font-bold">{stats.total}</p>
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
                <p className="text-4xl font-bold">{stats.paid}</p>
                <div className="mt-3 flex items-center gap-2 text-green-100 text-sm">
                  <span>✓ Completed</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 shadow-xl text-white overflow-hidden relative hover:scale-105 hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <p className="text-red-100 mb-2 font-semibold">Cancelled</p>
                <p className="text-4xl font-bold">{stats.cancelled}</p>
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
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
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
                  ₹{stats.monthlyRevenue.toLocaleString('en-IN')}
                </p>
                <div className="mt-3 flex items-center gap-2 text-purple-100 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>{new Date().toLocaleString('en-IN', { month: 'long' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> */}
      <CommonHeader 
          // successMessage={successMessage}
          showStats={false}
          orderHistoryStats={true}
          orderHistoryStatsData={stats}
          // statsComponent={<InventoryStats inventory={inventory} />}
        />
      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div
          className="mb-6 space-y-4"
        >
          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by Order ID, Bill ID, or Type (dine-in/takeaway)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700 placeholder-gray-400"
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filters and Actions Bar */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Filter Icon and Label */}
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <Filter className="w-5 h-5" />
                <span className="text-sm">Filters:</span>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-medium">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700 text-sm bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Order Type Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-medium">Type:</label>
                <select
                  value={orderTypeFilter}
                  onChange={(e) => setOrderTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700 text-sm bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="dine-in">Dine-in</option>
                  <option value="takeaway">Takeaway</option>
                </select>
              </div>

              {/* Date Range Picker */}
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />

              {/* Spacer */}
              <div className="flex-1"></div>

              {/* Clear All Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium text-sm inline-flex items-center gap-2 border border-red-200"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              )}

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm inline-flex items-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>

              {/* Export Button */}
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium text-sm inline-flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-600 font-medium">Active Filters:</span>
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                      Search: "{searchQuery}"
                      <button onClick={() => setSearchQuery('')} className="hover:bg-blue-100 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                      Status: {statusFilter}
                      <button onClick={() => setStatusFilter('all')} className="hover:bg-green-100 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {orderTypeFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium border border-orange-200">
                      Type: {orderTypeFilter}
                      <button onClick={() => setOrderTypeFilter('all')} className="hover:bg-orange-100 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {(startDate || endDate) && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200">
                      Date: {startDate?.toLocaleDateString('en-IN')} - {endDate?.toLocaleDateString('en-IN')}
                      <button onClick={() => { setStartDate(null); setEndDate(null); }} className="hover:bg-purple-100 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden p-4">
          {loading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-semibold">Loading orders...</p>
            </div>
          ) : (
            <AgGridDataTable
              data={filteredOrders}
              columnDefs={createOrderHistoryColumnDefs(setSelectedOrder, handlePrintOrder)}
              height="500px"
              paginationPageSize={10}
              emptyMessage="No orders found matching your criteria"
              emptyIcon="🍽️"
              rowHeight={60}
              onRowClicked={(event: any) => setSelectedOrder(event.data)}
              suppressRowClickSelection={true}
            />
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );

}
