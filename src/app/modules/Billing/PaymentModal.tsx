import { useState } from 'react';
import { CreditCard, Smartphone, Banknote, X, CheckCircle } from 'lucide-react';
import { OrderItem, PaymentDetails } from './BillingDashboard';

interface PaymentModalProps {
  orders: OrderItem[];
  onComplete: (payment: PaymentDetails) => void;
  onCancel: () => void;
  billingSettings?: { serviceChargeEnabled: boolean; serviceChargePercent: number; cgstPercent: number; sgstPercent: number; customCharges?: { id: string; name: string; percent: number; enabled: boolean }[] };
}


export function PaymentModal({ orders, onComplete, onCancel, billingSettings }: PaymentModalProps) {
  const SERVICE_CHARGE_ENABLED = billingSettings?.serviceChargeEnabled ?? true;
  const SERVICE_CHARGE_RATE = (billingSettings?.serviceChargePercent ?? 5) / 100;
  const CGST_RATE = (billingSettings?.cgstPercent ?? 2.5) / 100;
  const SGST_RATE = (billingSettings?.sgstPercent ?? 2.5) / 100;
  const enabledCustomCharges = (billingSettings?.customCharges || []).filter(c => c.enabled);

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Card payment states
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  
  // UPI payment states
  const [upiId, setUpiId] = useState('');
  
  // Cash payment states
  const [cashReceived, setCashReceived] = useState('');

  const subtotal = orders.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceCharge = SERVICE_CHARGE_ENABLED ? subtotal * SERVICE_CHARGE_RATE : 0;
  const cgst = subtotal * CGST_RATE;
  const sgst = subtotal * SGST_RATE;
  const customChargesTotal = enabledCustomCharges.reduce((sum, c) => sum + subtotal * c.percent / 100, 0);
  const total = subtotal + serviceCharge + cgst + sgst + customChargesTotal;

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (paymentMethod === 'card') {
      // Card payment processed via terminal - no field validation needed
    }

    if (paymentMethod === 'upi') {
      // UPI payment processed via QR scan - no field validation needed
    }

    if (paymentMethod === 'cash') {
      const cash = parseFloat(cashReceived);
      if (!cashReceived || cash < total) {
        alert(`Cash received must be at least ₹${total.toFixed(2)}`);
        return;
      }
    }

    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      const payment: PaymentDetails = {
        method: paymentMethod,
        transactionId: paymentMethod !== 'cash' 
          ? `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
          : undefined,
        amountPaid: paymentMethod === 'cash' ? parseFloat(cashReceived) : total,
      };

      onComplete(payment);
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-orange-200 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-orange-200 bg-gradient-to-r from-orange-500 to-amber-500">
          <div>
            <h2 className="text-white text-xl font-bold">Complete Payment</h2>
            <p className="text-orange-50 text-xs mt-0.5">Review your order and select payment method</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all transform hover:scale-110 active:scale-95"
            disabled={processing}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Bill Summary with Product Details */}
        <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-b-2 border-orange-100">
          <h3 className="text-gray-900 font-bold mb-3 text-base flex items-center gap-2">
            <span className="w-1 h-4 bg-orange-500 rounded"></span>
            Order Summary
          </h3>
          
          {/* Product List */}
          <div className="space-y-1 mb-3 max-h-48 overflow-y-auto bg-white rounded-lg p-3 shadow-sm border border-orange-100">
            {orders.map((item, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center py-2 border-b border-orange-100 last:border-b-0 hover:bg-orange-50 px-2 rounded-lg transition-colors"
              >
                <div className="flex-1">
                  <span className="text-gray-900 font-medium text-sm">{item.name}</span>
                  <span className="text-orange-600 text-xs ml-2 font-bold bg-orange-100 px-1.5 py-0.5 rounded-full">× {item.quantity}</span>
                </div>
                <span className="text-gray-900 font-bold text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Bill Calculations */}
          <div className="space-y-2 bg-white rounded-lg p-3 shadow-sm border border-orange-100">
            <div className="flex justify-between text-gray-700 text-sm">
              <span className="font-medium">Subtotal</span>
              <span className="font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-xs">
              <span>{`Service Charge (${(SERVICE_CHARGE_RATE * 100).toFixed(1)}%)`}</span>
              <span className="font-semibold">₹{serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-xs">
              <span>{`CGST (${(CGST_RATE * 100).toFixed(1)}%)`}</span>
              <span className="font-semibold">₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-xs">
              <span>{`SGST (${(SGST_RATE * 100).toFixed(1)}%)`}</span>
              <span className="font-semibold">₹{sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t-2 border-orange-300">
              <span className="text-gray-900 font-bold text-base">Total Amount</span>
              <span className="text-orange-600 font-bold text-xl">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-4 bg-white">
          <h3 className="text-gray-900 mb-3 font-bold text-base flex items-center gap-2">
            <span className="w-1 h-4 bg-orange-500 rounded"></span>
            Select Payment Method
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 border-2 rounded-xl transition-all transform hover:scale-105 active:scale-95 ${
                paymentMethod === 'cash'
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-green-300 bg-white hover:shadow-md'
              }`}
              disabled={processing}
            >
              <Banknote className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'cash' ? 'text-green-600' : 'text-gray-400'}`} />
              <p className={`font-bold text-sm ${paymentMethod === 'cash' ? 'text-green-900' : 'text-gray-700'}`}>Cash</p>
              <p className={`text-xs mt-0.5 ${paymentMethod === 'cash' ? 'text-green-700' : 'text-gray-500'}`}>Pay with cash</p>
            </button>

            <button
              onClick={() => setPaymentMethod('card')}
              className={`p-4 border-2 rounded-xl transition-all transform hover:scale-105 active:scale-95 ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-md'
              }`}
              disabled={processing}
            >
              <CreditCard className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className={`font-bold text-sm ${paymentMethod === 'card' ? 'text-blue-900' : 'text-gray-700'}`}>Card</p>
              <p className={`text-xs mt-0.5 ${paymentMethod === 'card' ? 'text-blue-700' : 'text-gray-500'}`}>Credit/Debit card</p>
            </button>

            <button
              onClick={() => setPaymentMethod('upi')}
              className={`p-4 border-2 rounded-xl transition-all transform hover:scale-105 active:scale-95 ${
                paymentMethod === 'upi'
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-purple-300 bg-white hover:shadow-md'
              }`}
              disabled={processing}
            >
              <Smartphone className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'upi' ? 'text-purple-600' : 'text-gray-400'}`} />
              <p className={`font-bold text-sm ${paymentMethod === 'upi' ? 'text-purple-900' : 'text-gray-700'}`}>UPI</p>
              <p className={`text-xs mt-0.5 ${paymentMethod === 'upi' ? 'text-purple-700' : 'text-gray-500'}`}>GPay, PhonePe, etc.</p>
            </button>
          </div>

          {/* Payment Forms */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3 bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-300 shadow-sm animate-slide-up">
              <div>
                <label className="block text-gray-900 mb-1.5 font-bold text-sm">Cash Received (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min={total}
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder={`Minimum ₹${total.toFixed(2)}`}
                  className="w-full px-3 py-2.5 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-bold bg-white shadow-sm transition-all transform focus:scale-[1.02]"
                  disabled={processing}
                  autoFocus
                />
              </div>
              {cashReceived && parseFloat(cashReceived) > total && (
                <div className="bg-white border-2 border-green-400 rounded-lg p-3 shadow-md animate-scale-in">
                  <p className="text-green-900 text-sm">
                    💵 Change to return: <span className="font-bold text-lg text-green-600">₹{(parseFloat(cashReceived) - total).toFixed(2)}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="space-y-3 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-300 shadow-sm animate-slide-up">
              <div className="bg-blue-200 border-2 border-blue-400 rounded-lg p-2 mb-1">
                <p className="text-blue-900 text-xs font-semibold flex items-center gap-2">
                  🔒 Secure Payment - Swipe or insert card on terminal
                </p>
              </div>
              <div className="bg-white border-2 border-blue-300 rounded-lg p-6 text-center">
                <CreditCard className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <p className="text-blue-900 font-bold text-sm">Card Payment</p>
                <p className="text-blue-600 text-xs mt-1">Amount: <span className="font-bold text-lg">₹{total.toFixed(2)}</span></p>
                <p className="text-gray-500 text-xs mt-2">Please use the card terminal to process payment</p>
              </div>
            </div>
          )}

          {paymentMethod === 'upi' && (
            <div className="space-y-3 bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-300 shadow-sm animate-slide-up">
              <div className="bg-purple-200 border-2 border-purple-400 rounded-lg p-2 mb-1">
                <p className="text-purple-900 text-xs font-semibold flex items-center gap-2">
                  🔒 Secure UPI Payment - Scan QR to pay
                </p>
              </div>
              <div className="bg-white border-2 border-purple-300 rounded-xl p-4 text-center">
                <div className="inline-block p-3 bg-white border-2 border-gray-200 rounded-xl shadow-md mb-3">
                  <svg width="160" height="160" viewBox="0 0 160 160" className="mx-auto">
                    <rect width="160" height="160" fill="white" />
                    {/* QR code pattern */}
                    <rect x="10" y="10" width="40" height="40" fill="black" />
                    <rect x="15" y="15" width="30" height="30" fill="white" />
                    <rect x="20" y="20" width="20" height="20" fill="black" />
                    <rect x="110" y="10" width="40" height="40" fill="black" />
                    <rect x="115" y="15" width="30" height="30" fill="white" />
                    <rect x="120" y="20" width="20" height="20" fill="black" />
                    <rect x="10" y="110" width="40" height="40" fill="black" />
                    <rect x="15" y="115" width="30" height="30" fill="white" />
                    <rect x="20" y="120" width="20" height="20" fill="black" />
                    {/* Center pattern */}
                    <rect x="60" y="10" width="10" height="10" fill="black" />
                    <rect x="80" y="10" width="10" height="10" fill="black" />
                    <rect x="60" y="30" width="10" height="10" fill="black" />
                    <rect x="80" y="30" width="10" height="10" fill="black" />
                    <rect x="70" y="20" width="10" height="10" fill="black" />
                    <rect x="60" y="60" width="10" height="10" fill="black" />
                    <rect x="80" y="60" width="10" height="10" fill="black" />
                    <rect x="70" y="70" width="20" height="20" fill="black" />
                    <rect x="60" y="80" width="10" height="10" fill="black" />
                    <rect x="90" y="80" width="10" height="10" fill="black" />
                    <rect x="10" y="60" width="10" height="10" fill="black" />
                    <rect x="30" y="60" width="10" height="10" fill="black" />
                    <rect x="10" y="80" width="10" height="10" fill="black" />
                    <rect x="40" y="70" width="10" height="10" fill="black" />
                    <rect x="110" y="60" width="10" height="10" fill="black" />
                    <rect x="130" y="60" width="10" height="10" fill="black" />
                    <rect x="110" y="80" width="10" height="10" fill="black" />
                    <rect x="140" y="70" width="10" height="10" fill="black" />
                    <rect x="60" y="110" width="10" height="10" fill="black" />
                    <rect x="80" y="110" width="10" height="10" fill="black" />
                    <rect x="70" y="120" width="10" height="10" fill="black" />
                    <rect x="110" y="110" width="10" height="10" fill="black" />
                    <rect x="130" y="110" width="10" height="10" fill="black" />
                    <rect x="120" y="130" width="10" height="10" fill="black" />
                    <rect x="140" y="120" width="10" height="10" fill="black" />
                    <rect x="110" y="140" width="10" height="10" fill="black" />
                    <rect x="140" y="140" width="10" height="10" fill="black" />
                  </svg>
                </div>
                <p className="text-purple-900 font-bold text-sm">Scan to Pay</p>
                <p className="text-purple-600 text-xs mt-1">Amount: <span className="font-bold text-lg">₹{total.toFixed(2)}</span></p>
                <div className="flex justify-center gap-3 mt-3">
                  <span className="px-2 py-1 bg-purple-100 border border-purple-300 rounded-lg text-[10px] font-semibold text-purple-900">Google Pay</span>
                  <span className="px-2 py-1 bg-purple-100 border border-purple-300 rounded-lg text-[10px] font-semibold text-purple-900">PhonePe</span>
                  <span className="px-2 py-1 bg-purple-100 border border-purple-300 rounded-lg text-[10px] font-semibold text-purple-900">Paytm</span>
                  <span className="px-2 py-1 bg-purple-100 border border-purple-300 rounded-lg text-[10px] font-semibold text-purple-900">BHIM</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t-2 border-orange-100 bg-gradient-to-r from-gray-50 to-orange-50">
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-white hover:border-gray-400 transition-all font-bold transform hover:scale-105 active:scale-95 shadow-sm"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={!paymentMethod || processing}
              className={`flex-1 px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-lg transform hover:scale-105 active:scale-95 ${
                !paymentMethod || processing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Complete Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
