import { useState, useEffect, useRef, useCallback } from 'react';
import { CommonHeader } from '../../components/CommonHeader';
import { kitchenApi, KitchenOrder } from '../utils/kitchenApi';
import { ChefHat, Clock, Trash2, RefreshCw, UtensilsCrossed, CheckCircle2, AlertCircle, Timer, Users, Hash, Phone, XCircle, BellRing, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-300', cardBorder: 'border-amber-300', headerBg: 'from-amber-400 to-orange-500', order: 1 },
  preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-800 border-blue-300', cardBorder: 'border-blue-300', headerBg: 'from-blue-400 to-indigo-500', order: 2 },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-800 border-green-300', cardBorder: 'border-green-300', headerBg: 'from-green-400 to-emerald-500', order: 3 },
  served: { label: 'Served', color: 'bg-gray-100 text-gray-600 border-gray-300', cardBorder: 'border-gray-300', headerBg: 'from-gray-400 to-gray-500', order: 4 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300', cardBorder: 'border-red-400', headerBg: 'from-red-500 to-rose-600', order: 5 },
};

const STATUSES = ['pending', 'preparing', 'ready','cancelled'] as const; //served
const ACTIVE_STATUSES = ['pending', 'preparing', 'ready', 'served'] as const;
const POLL_INTERVAL = 5000;

export default function Kitchen() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; orderNumber: string } | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const prevOrdersRef = useRef<KitchenOrder[]>([]);
  const isFirstLoad = useRef(true);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await kitchenApi.getToday();
      if (response.success) {
        const data = (response.data as any)?.data || response.data;
        const newOrders: KitchenOrder[] = Array.isArray(data) ? data : [];

        // Detect changes after first load
        if (!isFirstLoad.current) {
          const prevIds = new Set(prevOrdersRef.current.map(o => o.id));
          const prevStatusMap = new Map(prevOrdersRef.current.map(o => [o.id, o.status]));

          // New orders
          const addedOrders = newOrders.filter(o => !prevIds.has(o.id));
          addedOrders.forEach(o => {
            toast.success(`🆕 New Order: ${o.order_number}`, {
              description: `${o.items.length} item(s) — ${o.order_type === 'parcel' ? 'Parcel' : `Table ${o.table_number || '-'}`}`,
              duration: 6000,
              icon: <BellRing className="h-5 w-5 text-green-600" />,
            });
          });

          // Newly cancelled orders
          newOrders.forEach(o => {
            const prevStatus = prevStatusMap.get(o.id);
            if (prevStatus && prevStatus !== 'cancelled' && o.status === 'cancelled') {
              toast.error(`❌ Order Cancelled: ${o.order_number}`, {
                description: `${o.items.map(i => i.item_name).join(', ')}`,
                duration: 8000,
                icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
              });
            }
          });
        }

        isFirstLoad.current = false;
        prevOrdersRef.current = newOrders;
        setOrders(newOrders);
        setLastRefresh(new Date());
      }
    } catch {
      if (!silent) toast.error('Failed to load kitchen orders');
    }
    if (!silent) setLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Auto-refresh polling
  useEffect(() => {
    const interval = setInterval(() => fetchOrders(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const response = await kitchenApi.updateStatus(id, status);
      if ((response as any).success !== false) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as any } : o));
        prevOrdersRef.current = prevOrdersRef.current.map(o => o.id === id ? { ...o, status: status as any } : o);
        toast.success(`Order updated to ${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}`);
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      const response = await kitchenApi.updateStatus(id, 'cancelled');
      if ((response as any).success !== false) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' as any } : o));
        prevOrdersRef.current = prevOrdersRef.current.map(o => o.id === id ? { ...o, status: 'cancelled' as any } : o);
        toast.error('Order cancelled');
      }
    } catch {
      toast.error('Failed to cancel order');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await kitchenApi.delete(deleteConfirm.id);
      const updated = orders.filter(o => o.id !== deleteConfirm.id);
      setOrders(updated);
      prevOrdersRef.current = updated;
      toast.success('Order removed');
    } catch {
      toast.error('Failed to delete order');
    }
    setDeleteConfirm(null);
  };

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50">
      <CommonHeader showStats={false} />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Kitchen Display</h1>
              <p className="text-sm text-gray-500">Today's kitchen order tickets</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Auto-refresh • {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <button onClick={() => fetchOrders()} className="p-2.5 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all">
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-6 gap-3 mb-6">
          
          {STATUSES.map(s => {
            const config = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`p-3 rounded-xl border-2 transition-all text-center ${filterStatus === s ? `${config.cardBorder} bg-gradient-to-br ${config.color} shadow-md` : 'border-gray-200 bg-white hover:border-gray-300'}`}
              >
                <p className="text-lg font-bold">{statusCounts[s]}</p>
                <p className="text-xs font-semibold">{config.label}</p>
              </button>
            );
          })}
          <button
            onClick={() => setFilterStatus('all')}
            className={`p-3 rounded-xl border-2 transition-all text-center ${filterStatus === 'all' ? 'border-orange-400 bg-orange-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}
          >
            <p className="text-lg font-bold text-gray-800">{orders.length}</p>
            <p className="text-xs font-semibold text-gray-500">All Orders</p>
          </button>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-gray-200 shadow-sm">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No orders found</h3>
            <p className="text-sm text-gray-400">KOT orders from billing will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map(order => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const isCancelled = order.status === 'cancelled';
              const nextStatus = isCancelled ? undefined : ACTIVE_STATUSES[ACTIVE_STATUSES.indexOf(order.status as any) + 1];

              return (
                <div key={order.id} className={`bg-white rounded-xl border-2 ${config.cardBorder} shadow-sm overflow-hidden hover:shadow-md transition-all relative ${isCancelled ? 'opacity-80' : ''}`}>
                  {/* Cancelled Alert Banner */}
                  {isCancelled && (
                    <div className="bg-red-600 text-white px-4 py-2 flex items-center gap-2 animate-pulse">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wide">Order Cancelled</span>
                    </div>
                  )}

                  {/* Card Header */}
                  <div className={`bg-gradient-to-r ${config.headerBg} px-4 py-3 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5" />
                        <span className={`font-bold text-sm ${isCancelled ? 'line-through' : ''}`}>{order.order_number}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20">
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-white/80 text-xs">
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {getTimeSince(order.created_at)}
                      </span>
                      {order.table_number && (
                        <span className="font-bold text-white">Table {order.table_number}</span>
                      )}
                      {order.order_type === 'parcel' && (
                        <span className="font-bold text-white">📦 Parcel</span>
                      )}
                    </div>
                  </div>

                  {/* Customer Info */}
                  {(order.customer_name || order.mobile_number || order.number_of_persons) && (
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-2 text-xs">
                      {order.customer_name && (
                        <span className="flex items-center gap-1 text-gray-600">
                          <Users className="w-3 h-3" /> {order.customer_name}
                        </span>
                      )}
                      {order.mobile_number && (
                        <span className="flex items-center gap-1 text-gray-600">
                          <Phone className="w-3 h-3" /> {order.mobile_number}
                        </span>
                      )}
                      {order.number_of_persons && (
                        <span className="text-gray-500">{order.number_of_persons} persons</span>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div className="px-4 py-3 space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div key={item.id || idx} className={`flex justify-between items-center py-1 border-b border-gray-50 last:border-0 ${isCancelled ? 'line-through text-gray-400' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}.</span>
                          <span className={`text-sm font-medium ${isCancelled ? 'text-gray-400' : 'text-gray-800'}`}>{item.item_name}</span>
                        </div>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded ${isCancelled ? 'bg-red-50 text-red-400' : 'bg-blue-50 text-blue-600'}`}>x{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
                    {isCancelled ? (
                      <div className="flex-1 flex items-center justify-center gap-2 text-red-500 py-1">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs font-bold">Cancelled</span>
                      </div>
                    ) : order.status === 'ready' ? (
                      <span className="flex-1 text-center text-xs font-semibold text-green-600 flex items-center justify-center gap-1.5 py-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Complete
                      </span>
                    ) : order.status === 'served' ? (
                      <span className="flex-1 text-center text-xs font-semibold text-green-600 flex items-center justify-center gap-1.5 py-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Completed
                      </span>
                    ) : (
                      <>
                        {nextStatus && (
                          <button
                            onClick={() => handleStatusChange(order.id, nextStatus)}
                            className={`flex-1 px-3 py-2 bg-gradient-to-r ${STATUS_CONFIG[nextStatus].headerBg} text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark {STATUS_CONFIG[nextStatus].label}
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm({ id: order.id, orderNumber: order.order_number })}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="p-6 border-b flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Remove Order</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-2">Are you sure you want to remove this kitchen order?</p>
                <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">{deleteConfirm.orderNumber}</p>
                <p className="text-sm text-red-500 mt-3">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 p-6 pt-0">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium">
                  Cancel
                </button>
                <button onClick={handleDelete} className="flex-1 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg font-medium">
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
