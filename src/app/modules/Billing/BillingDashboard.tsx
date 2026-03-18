import { useState } from 'react';
import { BillingForm } from './BillingForm';
import { OrderSummary } from './OrderSummary';
import { Receipt } from './Receipt';
import { PaymentModal } from './PaymentModal';
import { CommonHeader } from '@/app/components/CommonHeader';
import { billingApi } from '../utils/billingApi';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface OrderItem extends MenuItem {
  quantity: number;
}

export interface PaymentDetails {
  method: 'cash' | 'card' | 'upi';
  transactionId?: string;
  amountPaid: number;
}

export interface DraftOrder {
  id: string;
  orders: OrderItem[];
  mobileNumber: string;
  customerName: string;
  orderType: 'dine-in' | 'parcel';
  tableNumber: string;
  numberOfPersons: string;
  timestamp: Date;
}

export function BillingDashboard() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'parcel'>('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [numberOfPersons, setNumberOfPersons] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [currentBillNumber, setCurrentBillNumber] = useState('');
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);

  const addItemsToBill = (items: { name: string; price: number; quantity: number; code?: string }[]) => {
    const newItems: OrderItem[] = items.map(item => ({
      id: Date.now().toString() + Math.random(),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      category: 'General'
    }));
    setOrders(prev => [...prev, ...newItems]);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setOrders(prev => prev.filter(o => o.id !== id));
    } else {
      setOrders(prev => prev.map(o => 
        o.id === id ? { ...o, quantity } : o
      ));
    }
  };

  const removeItem = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const clearOrder = () => {
    setOrders([]);
    setShowReceipt(false);
    setShowPayment(false);
    setMobileNumber('');
    setCustomerName('');
    setTableNumber('');
    setNumberOfPersons('');
    setPaymentDetails(null);
  };

  const handleCheckout = () => {
    if (orders.length === 0) {
      alert('Please add items to the bill');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.length !== 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentComplete = async (payment: PaymentDetails) => {
    const response = await billingApi.create({
      customerName: customerName || 'Customer',
      mobileNumber,
      orderType,
      tableNumber: tableNumber || undefined,
      numberOfPersons: numberOfPersons || undefined,
      orders: orders.map(o => ({ name: o.name, price: o.price, quantity: o.quantity })),
      paymentMethod: payment.method,
      transactionId: payment.transactionId,
      amountPaid: payment.amountPaid,
    });

    if (response.success && response.data) {
      setPaymentDetails(payment);
      setCurrentBillNumber(response.data.billNumber);
      setShowPayment(false);
      setShowReceipt(true);
    } else {
      alert('Failed to save bill: ' + (response.error || 'Unknown error'));
    }
  };

  const saveDraft = () => {
    if (orders.length === 0) {
      alert('Cannot save empty order as draft');
      return;
    }

    const draft: DraftOrder = {
      id: Date.now().toString() + Math.random(),
      orders: [...orders],
      mobileNumber,
      customerName,
      orderType,
      tableNumber,
      numberOfPersons,
      timestamp: new Date()
    };

    setDraftOrders(prev => [...prev, draft]);
    
    // Clear current order
    setOrders([]);
    setMobileNumber('');
    setCustomerName('');
    setOrderType('dine-in');
    setTableNumber('');
    setNumberOfPersons('');
    
    alert('Order saved as draft successfully!');
  };

  const loadDraft = (draftId: string) => {
    const draft = draftOrders.find(d => d.id === draftId);
    if (!draft) return;

    // If current order has items, confirm before loading
    if (orders.length > 0) {
      const confirm = window.confirm('Current order will be replaced. Do you want to continue?');
      if (!confirm) return;
    }

    setOrders([...draft.orders]);
    setMobileNumber(draft.mobileNumber);
    setCustomerName(draft.customerName || '');
    setOrderType(draft.orderType);
    setTableNumber(draft.tableNumber);
    setNumberOfPersons(draft.numberOfPersons);
    
    // Remove draft from list
    setDraftOrders(prev => prev.filter(d => d.id !== draftId));
  };

  const deleteDraft = (draftId: string) => {
    const confirm = window.confirm('Are you sure you want to delete this draft?');
    if (confirm) {
      setDraftOrders(prev => prev.filter(d => d.id !== draftId));
    }
  };

  if (showReceipt && paymentDetails) {
    return (
      <Receipt 
        orders={orders} 
        customerName={customerName || 'Customer'}
        mobileNumber={mobileNumber}
        orderType={orderType}
        tableNumber={tableNumber}
        numberOfPersons={numberOfPersons}
        paymentDetails={paymentDetails}
        billNumber={currentBillNumber}
        onNewOrder={clearOrder}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <CommonHeader showStats={false} />
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Billing Form */}
          <div className="lg:col-span-2">
            <BillingForm 
              onAddItems={addItemsToBill}
              mobileNumber={mobileNumber}
              customerName={customerName}
              orderType={orderType}
              tableNumber={tableNumber}
              numberOfPersons={numberOfPersons}
              onMobileNumberChange={setMobileNumber}
              onCustomerNameChange={setCustomerName}
              onOrderTypeChange={setOrderType}
              onTableNumberChange={setTableNumber}
              onNumberOfPersonsChange={setNumberOfPersons}
              draftOrders={draftOrders}
              onLoadDraft={loadDraft}
              onDeleteDraft={deleteDraft}
            />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <OrderSummary
                orders={orders}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onClearOrder={clearOrder}
                onCheckout={handleCheckout}
                onSaveDraft={saveDraft}
              />
            </div>
          </div>

          {/* Payment Modal */}
          {showPayment && (
            <PaymentModal
              orders={orders}
              onComplete={handlePaymentComplete}
              onCancel={() => setShowPayment(false)}
            />
          )}

        </div>
      </div>
    </div>
  );
}
