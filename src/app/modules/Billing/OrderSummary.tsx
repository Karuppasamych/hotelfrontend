import { useState } from 'react';
import { X, Trash2, ShoppingCart, FileText, AlertTriangle } from 'lucide-react';
import { OrderItem } from './BillingDashboard';
import { billingApi } from '../utils/billingApi';
import { confirmedMenuApi } from '../utils/confirmedMenuApi';
import { kitchenApi } from '../utils/kitchenApi';
import { toast } from 'sonner';

interface OrderSummaryProps {
  orders: OrderItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearOrder: () => void;
  onCheckout: () => void;
  onSaveDraft: () => void;
  tableNumber?: string;
  orderType?: string;
  sentToKitchen?: boolean;
  onItemCancelled?: () => void;
  billingSettings?: { serviceChargeEnabled: boolean; serviceChargePercent: number; cgstPercent: number; sgstPercent: number; customCharges?: { id: string; name: string; percent: number; enabled: boolean }[] };
}


export function OrderSummary({ 
  orders, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearOrder,
  onCheckout,
  onSaveDraft,
  tableNumber,
  orderType,
  sentToKitchen,
  onItemCancelled,
  billingSettings
}: OrderSummaryProps) {
  const [cancelConfirm, setCancelConfirm] = useState<OrderItem | null>(null);
  const [cancelQty, setCancelQty] = useState(1);
  const [cancelReason, setCancelReason] = useState<'prepared' | 'not_prepared' | 'others' | ''>('');
  const [cancelOtherReason, setCancelOtherReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const SERVICE_CHARGE_ENABLED = billingSettings?.serviceChargeEnabled ?? true;
  const SERVICE_CHARGE_RATE = (billingSettings?.serviceChargePercent ?? 5) / 100;
  const CGST_RATE = (billingSettings?.cgstPercent ?? 2.5) / 100;
  const SGST_RATE = (billingSettings?.sgstPercent ?? 2.5) / 100;
  const enabledCustomCharges = (billingSettings?.customCharges || []).filter(c => c.enabled);

  const subtotal = orders.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceCharge = SERVICE_CHARGE_ENABLED ? subtotal * SERVICE_CHARGE_RATE : 0;
  const cgst = subtotal * CGST_RATE;
  const sgst = subtotal * SGST_RATE;
  const customChargesTotal = enabledCustomCharges.reduce((sum, c) => sum + subtotal * c.percent / 100, 0);
  const total = subtotal + serviceCharge + cgst + sgst + customChargesTotal;

  const handleCancelItem = async () => {
    if (!cancelConfirm) return;
    if (!cancelReason) {
      toast.error('Please select a reason for cancellation');
      return;
    }
    setCancelling(true);
    const reasonText = cancelReason === 'prepared' ? 'Prepared and cancelled'
      : cancelReason === 'not_prepared' ? 'Not Prepared and cancelled'
      : cancelOtherReason || 'Others';
    try {
      const response = await billingApi.cancelItem({
        item_name: cancelConfirm.name,
        quantity: cancelQty,
        price: cancelConfirm.price,
        reason: reasonText,
        table_number: tableNumber || undefined,
        order_type: orderType || undefined,
      });
      if ((response as any).success !== false) {
        // Reduce quantity in kitchen order
        try {
          await kitchenApi.reduceItemQuantity(cancelConfirm.name, cancelQty);
        } catch { /* ignore */ }
        // If prepared and cancelled, reduce servings in production queue
        if (cancelReason === 'prepared') {
          try {
            await confirmedMenuApi.reduceServings(cancelConfirm.name, cancelQty);
          } catch { /* ignore if no matching confirmed menu */ }
        }
        if (cancelQty >= cancelConfirm.quantity) {
          onRemoveItem(cancelConfirm.id);
        } else {
          onUpdateQuantity(cancelConfirm.id, cancelConfirm.quantity - cancelQty);
        }
        toast.success(`${cancelConfirm.name} (x${cancelQty}) cancelled and recorded`);
        onItemCancelled?.();
      } else {
        toast.error('Failed to record cancellation');
      }
    } catch {
      toast.error('Error cancelling item');
    }
    setCancelling(false);
    setCancelConfirm(null);
    setCancelReason('');
    setCancelOtherReason('');
    setCancelQty(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-orange-500 rounded"></div>
          <ShoppingCart className="w-6 h-6 text-orange-600" />
          <h2 className="text-gray-800 text-xl font-bold">Current Order</h2>
        </div>
        {orders.length > 0 && (
          <button
            onClick={onClearOrder}
            className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear all items"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-10 h-10 text-orange-600" />
          </div>
          <p className="text-gray-600 font-medium text-lg">No items added yet</p>
          <p className="text-gray-400">Start adding items from the form</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto pr-2">
            {orders.map(item => (
              <div key={item.id} className="flex items-start justify-between gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-2 border-orange-200 hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 truncate font-medium">{item.name}</p>
                  <p className="text-orange-600 font-bold">₹{item.price.toFixed(2)}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="w-10 text-center text-gray-900 font-bold text-lg">{item.quantity}</span>
                  <button
                    onClick={() => { setCancelConfirm(item); setCancelQty(item.quantity); setCancelReason(''); setCancelOtherReason(''); }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                    title="Cancel item"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-orange-200 pt-4 space-y-3 bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg">
            <div className="flex justify-between text-gray-700 text-lg">
              <span>Subtotal</span>
              <span className="font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
            {SERVICE_CHARGE_ENABLED && (
              <div className="flex justify-between text-gray-600">
                <span>Service Charge ({(SERVICE_CHARGE_RATE * 100).toFixed(1)}%)</span>
                <span className="font-medium">₹{serviceCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>CGST ({(CGST_RATE * 100).toFixed(1)}%)</span>
              <span className="font-medium">₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>SGST ({(SGST_RATE * 100).toFixed(1)}%)</span>
              <span className="font-medium">₹{sgst.toFixed(2)}</span>
            </div>
            {enabledCustomCharges.map(c => (
              <div key={c.id} className="flex justify-between text-gray-600">
                <span>{c.name} ({c.percent}%)</span>
                <span className="font-medium">{(subtotal * c.percent / 100).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between text-gray-900 pt-3 border-t-2 border-orange-500 text-xl">
              <span className="font-bold">Total Amount</span>
              <span className="font-bold text-orange-600">{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={onSaveDraft}
            disabled={!sentToKitchen}
            className={`w-full mt-4 px-6 py-3 rounded-lg transition-all shadow-lg font-bold flex items-center justify-center gap-2 ${
              sentToKitchen
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 hover:shadow-xl transform hover:scale-[1.02]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            <FileText className="w-5 h-5" />
            Save Order
          </button>

          <button
            onClick={onCheckout}
            className="w-full mt-3 px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-lg font-bold"
          >
            Generate Bill
          </button>
        </>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6 border-b flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Cancel Item</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-3">How many do you want to cancel?</p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="font-bold text-gray-900 mb-3">{cancelConfirm.name}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCancelQty(Math.max(1, cancelQty - 1))}
                      className="w-9 h-9 bg-white border-2 border-orange-300 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center text-orange-600 font-bold text-lg"
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-gray-900 font-bold text-xl">{cancelQty}</span>
                    <button
                      onClick={() => setCancelQty(Math.min(cancelConfirm.quantity, cancelQty + 1))}
                      className="w-9 h-9 bg-white border-2 border-orange-300 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center text-orange-600 font-bold text-lg"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-400">of {cancelConfirm.quantity}</span>
                  </div>
                  <p className="text-sm text-gray-500">₹{cancelConfirm.price.toFixed(2)} × {cancelQty} = <span className="font-bold text-orange-600">₹{(cancelConfirm.price * cancelQty).toFixed(2)}</span></p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for cancellation *</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-2.5 rounded-lg border-2 cursor-pointer transition-all hover:bg-orange-50 ${cancelReason === 'prepared' ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}">
                    <input
                      type="radio"
                      name="cancelReason"
                      checked={cancelReason === 'prepared'}
                      onChange={() => setCancelReason('prepared')}
                      className="w-4 h-4 text-orange-600 accent-orange-600"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-800">Prepared and cancelled</span>
                      <p className="text-[10px] text-orange-600 font-medium">Servings will be reduced from production queue</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-2.5 rounded-lg border-2 cursor-pointer transition-all hover:bg-green-50 ${cancelReason === 'not_prepared' ? 'border-green-400 bg-green-50' : 'border-gray-200'}">
                    <input
                      type="radio"
                      name="cancelReason"
                      checked={cancelReason === 'not_prepared'}
                      onChange={() => setCancelReason('not_prepared')}
                      className="w-4 h-4 text-green-600 accent-green-600"
                    />
                    <span className="text-sm font-medium text-gray-800">Not Prepared and cancelled</span>
                  </label>
                  <label className="flex items-center gap-3 p-2.5 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 ${cancelReason === 'others' ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}">
                    <input
                      type="radio"
                      name="cancelReason"
                      checked={cancelReason === 'others'}
                      onChange={() => setCancelReason('others')}
                      className="w-4 h-4 text-blue-600 accent-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-800">Others</span>
                  </label>
                  {cancelReason === 'others' && (
                    <input
                      type="text"
                      value={cancelOtherReason}
                      onChange={(e) => setCancelOtherReason(e.target.value)}
                      placeholder="Enter reason (optional)"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 text-sm ml-7"
                    />
                  )}
                </div>
              </div>
              <p className="text-xs text-red-500 mt-3">This will be recorded in cancellation history.</p>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => { setCancelConfirm(null); setCancelReason(''); setCancelOtherReason(''); setCancelQty(1); }}
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium"
                disabled={cancelling}
              >
                Keep Item
              </button>
              <button
                onClick={handleCancelItem}
                disabled={cancelling}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg font-medium flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Cancel Item'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
