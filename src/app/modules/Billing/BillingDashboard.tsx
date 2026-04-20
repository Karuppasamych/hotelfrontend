import { useState, useEffect, useRef } from 'react';
import { BillingForm } from './BillingForm';
import { OrderSummary } from './OrderSummary';
import { Receipt } from './Receipt';
import { PaymentModal } from './PaymentModal';
import { CommonHeader } from '@/app/components/CommonHeader';
import { billingApi } from '../utils/billingApi';
import { draftApi } from '../utils/draftApi';
import { adminApi } from '../utils/adminApi';
import { toast } from 'sonner';

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
  const ordersRef = useRef<OrderItem[]>([]);

  // Keep ref in sync with orders state
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);
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

  // Fetch drafts from database on mount
  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const response = await draftApi.getAll();
        const data = (response.data as any)?.data || response.data;
        if (Array.isArray(data)) setDraftOrders(data);
      } catch { /* ignore */ }
    };
    fetchDrafts();
  }, []);
  const [sentToKitchen, setSentToKitchen] = useState(false);
  const [currentSavedOrderId, setCurrentSavedOrderId] = useState<string | null>(null);
  const [billingSettings, setBillingSettings] = useState({ serviceChargeEnabled: true, serviceChargePercent: 5, cgstPercent: 2.5, sgstPercent: 2.5, customCharges: [] as { id: string; name: string; percent: number; enabled: boolean }[] });

  // Fetch billing settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await adminApi.getSettings();
        const data = (response.data as any)?.data || response.data;
        if (data) {
          let customCharges: any[] = [];
          if (data.custom_charges) {
            try { customCharges = JSON.parse(data.custom_charges); } catch {}
          }
          setBillingSettings({
            serviceChargeEnabled: data.service_charge_enabled === 'true',
            serviceChargePercent: parseFloat(data.service_charge_percent) || 5,
            cgstPercent: parseFloat(data.cgst_percent) || 2.5,
            sgstPercent: parseFloat(data.sgst_percent) || 2.5,
            customCharges,
          });
        }
      } catch { /* use defaults */ }
    };
    fetchSettings();
  }, []);

  const addItemsToBill = (items: { name: string; price: number; quantity: number; code?: string }[]) => {
    setOrders(prev => {
      const updated = [...prev];
      for (const item of items) {
        const existing = updated.find(o => o.name === item.name);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          updated.push({
            id: Date.now().toString() + Math.random(),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: 'General'
          });
        }
      }
      return updated;
    });
    setSentToKitchen(true);
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
    setSentToKitchen(false);
    setCurrentSavedOrderId(null);
  };

  const handleCheckout = () => {
    if (orders.length === 0) {
      toast.error('Please add items to the bill');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (orderType === 'dine-in' && !tableNumber.trim()) {
      toast.error('Please enter a table number for dine-in orders');
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
      // Delete saved order from database if it was loaded
      if (currentSavedOrderId) {
        try {
          await draftApi.delete(parseInt(currentSavedOrderId));
          setDraftOrders(prev => prev.filter(d => d.id !== currentSavedOrderId));
        } catch { /* ignore */ }
        setCurrentSavedOrderId(null);
      }
      setPaymentDetails(payment);
      setCurrentBillNumber(response.data.billNumber);
      setShowPayment(false);
      setShowReceipt(true);
    } else {
      toast.error('Failed to save bill: ' + (response.error || 'Unknown error'));
    }
  };

  const saveDraft = async (itemsFromKitchen?: { name: string; price: number; quantity: number; category: string }[]) => {
    const itemsToSave = itemsFromKitchen || orders.map(o => ({ name: o.name, price: o.price, quantity: o.quantity, category: o.category }));
    if (itemsToSave.length === 0) {
      toast.error('Cannot save empty order');
      return;
    }
    try {
      const orderData = {
        mobile_number: mobileNumber,
        customer_name: customerName,
        order_type: orderType,
        table_number: tableNumber,
        number_of_persons: numberOfPersons,
        items: itemsToSave,
      };

      let response;
      const numericId = Number(currentSavedOrderId);
      if (currentSavedOrderId && !isNaN(numericId)) {
        response = await draftApi.update(numericId, orderData);
      } else {
        response = await draftApi.create(orderData);
      }

      if (response.success) {
        if (currentSavedOrderId && !isNaN(numericId)) {
          // Update: re-add to draft list with updated data
          const updatedDraft: DraftOrder = {
            id: currentSavedOrderId,
            orders: itemsToSave.map(i => ({ id: Date.now().toString() + Math.random(), name: i.name, price: i.price, quantity: i.quantity, category: i.category })),
            mobileNumber,
            customerName,
            orderType,
            tableNumber,
            numberOfPersons,
            timestamp: new Date()
          };
          setDraftOrders(prev => {
            const exists = prev.find(d => d.id === currentSavedOrderId);
            if (exists) {
              return prev.map(d => d.id === currentSavedOrderId ? updatedDraft : d);
            }
            return [...prev, updatedDraft];
          });
          toast.success('Order updated successfully!');
        } else {
          const newId = String((response.data as any)?.data?.id || (response.data as any)?.id || Date.now());
          setCurrentSavedOrderId(newId);
          const newDraft: DraftOrder = {
            id: newId,
            orders: itemsToSave.map(i => ({ id: Date.now().toString() + Math.random(), name: i.name, price: i.price, quantity: i.quantity, category: i.category })),
            mobileNumber,
            customerName,
            orderType,
            tableNumber,
            numberOfPersons,
            timestamp: new Date()
          };
          setDraftOrders(prev => [...prev, newDraft]);
          toast.success('Order saved successfully!');
        }
        // Only clear order if user explicitly saved (not from kitchen auto-save)
        if (!itemsFromKitchen) {
          setOrders([]);
          setMobileNumber('');
          setCustomerName('');
          setOrderType('dine-in');
          setTableNumber('');
          setNumberOfPersons('');
          setSentToKitchen(false);
          setCurrentSavedOrderId(null);
        }
      } else {
        toast.error('Failed to save order: ' + (response.error || ''));
      }
    } catch (err) {
      console.error('Error saving order:', err);
      toast.error('Error saving order');
    }
  };

  const loadDraft = async (draftId: string) => {
    const draft = draftOrders.find(d => d.id === draftId);
    if (!draft) return;

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
    setSentToKitchen(true);
    setCurrentSavedOrderId(null);

    // Delete from database and remove from list
    try {
      await draftApi.delete(parseInt(draftId));
    } catch { /* ignore */ }
    setDraftOrders(prev => prev.filter(d => d.id !== draftId));
  };

  const deleteDraft = async (draftId: string) => {
    const confirm = window.confirm('Are you sure you want to delete this saved order?');
    if (confirm) {
      try {
        await draftApi.delete(parseInt(draftId));
        setDraftOrders(prev => prev.filter(d => d.id !== draftId));
        toast.success('Saved order deleted');
      } catch {
        toast.error('Failed to delete saved order');
      }
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
              onSaveDraft={saveDraft}
              onDraftCreated={(draft) => {
                setDraftOrders(prev => [...prev, draft]);
                setCurrentSavedOrderId(draft.id);
              }}
              billingSettings={billingSettings}
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
                tableNumber={tableNumber}
                orderType={orderType}
                sentToKitchen={sentToKitchen}
                onItemCancelled={() => {
                  setSentToKitchen(true);
                  // Auto-update saved order after cancellation
                  const savedId = Number(currentSavedOrderId);
                  if (currentSavedOrderId && !isNaN(savedId)) {
                    setTimeout(async () => {
                      const latestOrders = ordersRef.current;
                      if (latestOrders.length > 0) {
                        try {
                          await draftApi.update(savedId, {
                            mobile_number: mobileNumber,
                            customer_name: customerName,
                            order_type: orderType,
                            table_number: tableNumber,
                            number_of_persons: numberOfPersons,
                            items: latestOrders.map(o => ({ name: o.name, price: o.price, quantity: o.quantity, category: o.category })),
                          });
                        } catch { /* silent */ }
                      }
                    }, 100);
                  }
                }}
                billingSettings={billingSettings}
              />
            </div>
          </div>

          {/* Payment Modal */}
          {showPayment && (
            <PaymentModal
              orders={orders}
              onComplete={handlePaymentComplete}
              onCancel={() => setShowPayment(false)}
              billingSettings={billingSettings}
            />
          )}

        </div>
      </div>
    </div>
  );
}
