import { useState, useEffect, useRef } from 'react';
import { BillingForm } from './BillingForm';
import { OrderSummary } from './OrderSummary';
import { Receipt } from './Receipt';
import { PaymentModal } from './PaymentModal';
import { CommonHeader } from '@/app/components/CommonHeader';
import { billingApi } from '../utils/billingApi';
import { draftApi } from '../utils/draftApi';
import { kitchenApi } from '../utils/kitchenApi';
import { adminApi } from '../utils/adminApi';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface OrderItem extends MenuItem {
  quantity: number;
  taxApplicable?: boolean;
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
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const ordersRef = useRef<OrderItem[]>([]);

  // Keep orders ref in sync with state
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
  const [clubPrompt, setClubPrompt] = useState<DraftOrder | null>(null);

  // Fetch drafts from database on mount — show all in list
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
  const savedOrderIdRef = useRef<string | null>(null);
  useEffect(() => {
    savedOrderIdRef.current = currentSavedOrderId;
  }, [currentSavedOrderId]);
  const [billingSettings, setBillingSettings] = useState({ serviceChargeEnabled: true, serviceChargePercent: 5, serviceChargeParcelExempt: true, cgstPercent: 2.5, sgstPercent: 2.5, customCharges: [] as { id: string; name: string; percent: number; enabled: boolean }[] });

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
            serviceChargeParcelExempt: data.service_charge_parcel_exempt !== 'false',
            cgstPercent: parseFloat(data.cgst_percent) || 2.5,
            sgstPercent: parseFloat(data.sgst_percent) || 2.5,
            customCharges,
          });
        }
      } catch { /* use defaults */ }
    };
    fetchSettings();
  }, []);

  // Detect saved orders from same customer with different order type
  useEffect(() => {
    if (mobileNumber.length === 10 && draftOrders.length > 0) {
      const match = draftOrders.find(
        d => d.mobileNumber === mobileNumber && d.orderType !== orderType && d.id !== currentSavedOrderId
      );
      if (match) {
        setClubPrompt(match);
      } else {
        setClubPrompt(null);
      }
    } else {
      setClubPrompt(null);
    }
  }, [mobileNumber, orderType, draftOrders, currentSavedOrderId]);

  const handleClubOrders = async () => {
    if (!clubPrompt) return;
    // Merge items from the saved order into current order
    const itemsToMerge = clubPrompt.orders;
    setOrders(prev => {
      const updated = [...prev];
      for (const item of itemsToMerge) {
        const existing = updated.find(o => o.name === item.name);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          updated.push({ ...item, id: Date.now().toString() + Math.random() });
        }
      }
      return updated;
    });
    // Delete the clubbed saved order from DB and list
    try {
      await draftApi.delete(parseInt(clubPrompt.id));
    } catch { /* ignore */ }
    setDraftOrders(prev => prev.filter(d => d.id !== clubPrompt.id));
    setSentToKitchen(true);
    toast.success(`Clubbed ${clubPrompt.orderType} order (${itemsToMerge.length} items) with current ${orderType} order`);
    setClubPrompt(null);
  };

  const addItemsToBill = (items: { name: string; price: number; quantity: number; code?: string; taxApplicable?: boolean }[]) => {
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
            category: 'General',
            taxApplicable: item.taxApplicable !== false,
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
      orders: orders.map(o => ({ name: o.name, price: o.price, quantity: o.quantity, taxApplicable: o.taxApplicable !== false })),
      paymentMethod: payment.method,
      transactionId: payment.transactionId,
      amountPaid: payment.amountPaid,
      initiatedBy: user?.name || user?.username || 'Unknown',
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
    const itemsToSave = itemsFromKitchen || orders.map(o => ({ name: o.name, price: o.price, quantity: o.quantity, category: o.category, taxApplicable: o.taxApplicable !== false }));
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
      const confirm = window.confirm('Current order will be saved and replaced. Continue?');
      if (!confirm) return;

      // Save current active order back to saved orders list if it has items
      if (currentSavedOrderId) {
        // Update existing draft in DB with current items
        try {
          await draftApi.update(Number(currentSavedOrderId), {
            mobile_number: mobileNumber,
            customer_name: customerName,
            order_type: orderType,
            table_number: tableNumber,
            number_of_persons: numberOfPersons,
            items: orders.map(o => ({ name: o.name, price: o.price, quantity: o.quantity, category: o.category, taxApplicable: o.taxApplicable !== false })),
          });
          // Add back to list if not already there
          setDraftOrders(prev => {
            const exists = prev.find(d => d.id === currentSavedOrderId);
            if (exists) {
              return prev.map(d => d.id === currentSavedOrderId ? {
                ...d, orders: [...orders], mobileNumber, customerName, orderType, tableNumber, numberOfPersons, timestamp: new Date()
              } : d);
            }
            return [...prev, { id: currentSavedOrderId!, orders: [...orders], mobileNumber, customerName, orderType, tableNumber, numberOfPersons, timestamp: new Date() }];
          });
        } catch { /* ignore */ }
      } else {
        // Create new draft for current items
        try {
          const res = await draftApi.create({
            mobile_number: mobileNumber,
            customer_name: customerName,
            order_type: orderType,
            table_number: tableNumber,
            number_of_persons: numberOfPersons,
            items: orders.map(o => ({ name: o.name, price: o.price, quantity: o.quantity, category: o.category, taxApplicable: o.taxApplicable !== false })),
          });
          if (res.success) {
            const newId = String((res.data as any)?.data?.id || (res.data as any)?.id || Date.now());
            setDraftOrders(prev => [...prev, { id: newId, orders: [...orders], mobileNumber, customerName, orderType, tableNumber, numberOfPersons, timestamp: new Date() }]);
          }
        } catch { /* ignore */ }
      }
    }

    // Load selected draft into current order
    setOrders([...draft.orders]);
    setMobileNumber(draft.mobileNumber);
    setCustomerName(draft.customerName || '');
    setOrderType(draft.orderType);
    setTableNumber(draft.tableNumber);
    setNumberOfPersons(draft.numberOfPersons);
    setSentToKitchen(true);
    setCurrentSavedOrderId(draftId);

    // Remove loaded draft from list (it's now the active order)
    setDraftOrders(prev => prev.filter(d => d.id !== draftId));
  };

  const deleteDraft = async (draftId: string) => {
    const confirm = window.confirm('Are you sure you want to delete this saved order?');
    if (confirm) {
      try {
        // Find the draft to get mobile number
        const draft = draftOrders.find(d => d.id === draftId);
        
        await draftApi.delete(parseInt(draftId));
        
        // Also delete pending kitchen order for this mobile number
        if (draft?.mobileNumber) {
          try {
            await kitchenApi.deletePendingByMobile(draft.mobileNumber);
          } catch { /* ignore */ }
        }
        
        setDraftOrders(prev => prev.filter(d => d.id !== draftId));
        toast.success('Saved order and pending kitchen order deleted');
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
        billingSettings={billingSettings}
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
                  setTimeout(async () => {
                    const latestOrders = ordersRef.current;
                    const savedId = savedOrderIdRef.current;
                    if (latestOrders.length === 0) return;
                    try {
                      if (savedId && !isNaN(Number(savedId))) {
                        await draftApi.update(Number(savedId), {
                          mobile_number: mobileNumber,
                          customer_name: customerName,
                          order_type: orderType,
                          table_number: tableNumber,
                          number_of_persons: numberOfPersons,
                          items: latestOrders.map(o => ({ name: o.name, price: o.price, quantity: o.quantity, category: o.category, taxApplicable: o.taxApplicable !== false })),
                        });
                      } else {
                        const res = await draftApi.create({
                          mobile_number: mobileNumber,
                          customer_name: customerName,
                          order_type: orderType,
                          table_number: tableNumber,
                          number_of_persons: numberOfPersons,
                          items: latestOrders.map(o => ({ name: o.name, price: o.price, quantity: o.quantity, category: o.category, taxApplicable: o.taxApplicable !== false })),
                        });
                        if (res.success) {
                          const newId = String((res.data as any)?.data?.id || (res.data as any)?.id || '');
                          if (newId) setCurrentSavedOrderId(newId);
                        }
                      }
                    } catch { /* silent */ }
                  }, 200);
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
              orderType={orderType}
              billingSettings={billingSettings}
            />
          )}

          {/* Club Orders Prompt */}
          {clubPrompt && (
            <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom">
              <div className="bg-white rounded-xl shadow-2xl border-2 border-orange-300 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <span className="text-lg">🔗</span>
                    <span className="font-bold text-sm">Club Orders?</span>
                  </div>
                  <button onClick={() => setClubPrompt(null)} className="p-1 hover:bg-white/20 rounded-lg transition-all">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 mb-2">
                    Customer <span className="font-bold">{clubPrompt.mobileNumber}</span> has a 
                    <span className="font-bold text-orange-600"> {clubPrompt.orderType === 'dine-in' ? 'Dine-In' : 'Parcel'}</span> order 
                    with <span className="font-bold">{clubPrompt.orders.length} item(s)</span>.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-2 mb-3 max-h-24 overflow-y-auto">
                    {clubPrompt.orders.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-gray-600 py-0.5">
                        <span>{item.name} ×{item.quantity}</span>
                        <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setClubPrompt(null)}
                      className="flex-1 px-3 py-2 border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium text-xs"
                    >
                      Keep Separate
                    </button>
                    <button
                      onClick={handleClubOrders}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 font-bold text-xs shadow-md"
                    >
                      🔗 Club Orders
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
