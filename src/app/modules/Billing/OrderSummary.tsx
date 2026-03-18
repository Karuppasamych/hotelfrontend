import { Minus, Plus, X, Trash2, ShoppingCart, FileText } from 'lucide-react';
import { OrderItem } from './BillingDashboard';

interface OrderSummaryProps {
  orders: OrderItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearOrder: () => void;
  onCheckout: () => void;
  onSaveDraft: () => void;
}

const CGST_RATE = 0.025; // 2.5% CGST
const SGST_RATE = 0.025; // 2.5% SGST
const SERVICE_CHARGE_RATE = 0.05; // 5% Service Charge

export function OrderSummary({ 
  orders, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearOrder,
  onCheckout,
  onSaveDraft
}: OrderSummaryProps) {
  const subtotal = orders.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
  const cgst = subtotal * CGST_RATE;
  const sgst = subtotal * SGST_RATE;
  const total = subtotal + serviceCharge + cgst + sgst;

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
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="p-2 bg-white border-2 border-orange-300 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-orange-600" />
                  </button>
                  <span className="w-10 text-center text-gray-900 font-bold text-lg">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="p-2 bg-white border-2 border-orange-300 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-orange-600" />
                  </button>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
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
            <div className="flex justify-between text-gray-600">
              <span>Service Charge (5%)</span>
              <span className="font-medium">₹{serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>CGST (2.5%)</span>
              <span className="font-medium">₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>SGST (2.5%)</span>
              <span className="font-medium">₹{sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-900 pt-3 border-t-2 border-orange-500 text-xl">
              <span className="font-bold">Total Amount</span>
              <span className="font-bold text-orange-600">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={onSaveDraft}
            className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] font-bold flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Save as Draft
          </button>

          <button
            onClick={onCheckout}
            className="w-full mt-3 px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-lg font-bold"
          >
            Generate Bill
          </button>
        </>
      )}
    </div>
  );
}