import { CheckCircle, Printer, ArrowLeft } from 'lucide-react';
import { OrderItem } from './BillingDashboard';
// import logo from "figma:asset/178234bb5634a14c1577b392be2aaca76a316e0c.png";

interface ReceiptProps {
  orders: OrderItem[];
  customerName: string;
  mobileNumber: string;
  orderType: 'dine-in' | 'parcel';
  tableNumber?: string;
  numberOfPersons?: string;
  paymentDetails: { method: string; transactionId?: string; amountPaid?: number };
  billNumber: string;
  onNewOrder: () => void;
}

const CGST_RATE = 0.025; // 2.5% CGST
const SGST_RATE = 0.025; // 2.5% SGST
const SERVICE_CHARGE_RATE = 0.05; // 5% Service Charge

export function Receipt({ orders, customerName, mobileNumber, orderType, tableNumber, numberOfPersons, paymentDetails, billNumber, onNewOrder }: ReceiptProps) {
  const subtotal = orders.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
  const cgst = subtotal * CGST_RATE;
  const sgst = subtotal * SGST_RATE;
  const total = subtotal + serviceCharge + cgst + sgst;
  const now = new Date();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-md border-l-4 border-green-500 p-4 mb-6 flex items-center gap-4 animate-fade-in">
          <div className="flex-shrink-0">
            <div className="bg-green-500 rounded-full p-2">
              <CheckCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-gray-900 font-bold text-lg">Payment Successful!</h1>
            <p className="text-gray-600 text-sm">Bill generated successfully</p>
          </div>
        </div>

        {/* Receipt */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6 border-2 border-slate-200" id="receipt">
          <div className="text-center mb-8 border-b-2 border-indigo-500 pb-6">
            {/* <img src={logo} alt="Hotel Logo" className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-indigo-500 shadow-md" /> */}
            <h2 className="text-slate-900 mb-1 font-bold text-xl">மதுரை பாண்டியன் ஹோட்டல்</h2>
            <h3 className="text-slate-900 mb-3 text-lg">Madurai Pandiyan Hotel</h3>
            <p className="text-slate-600">Authentic South Indian Cuisine</p>
            <p className="text-slate-600">Madurai, Tamil Nadu - 600090</p>
            <p className="text-slate-600">Phone: +91 452 1234 5678</p>
            <p className="text-slate-600">GSTIN: 33XXXXX1234X1ZX</p>
          </div>

          <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="grid grid-cols-2 gap-4 text-slate-700">
              <div>
                <p className="font-medium">Bill No: <span className="text-slate-900 font-bold">{billNumber}</span></p>
                <p className="font-medium">Customer: <span className="text-slate-900">{customerName}</span></p>
                <p className="font-medium">Mobile: <span className="text-slate-900">+91 {mobileNumber}</span></p>
                {tableNumber && (
                  <p className="font-medium">Table No: <span className="text-slate-900">{tableNumber}</span></p>
                )}
                {numberOfPersons && (
                  <p className="font-medium">No. of Persons: <span className="text-slate-900">{numberOfPersons}</span></p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium">Date: {now.toLocaleDateString('en-IN')}</p>
                <p className="font-medium">Time: {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="font-medium">
                  Order Type: <span className={`capitalize px-2 py-1 rounded ${orderType === 'dine-in' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {orderType === 'dine-in' ? '🍽️ Dine-In' : '📦 Parcel'}
                  </span>
                </p>
                <p className="font-medium">Payment: <span className="text-slate-900 capitalize">{paymentDetails.method}</span></p>
                {paymentDetails.transactionId && (
                  <p className="text-xs">TXN: {paymentDetails.transactionId}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t-2 border-b-2 border-slate-300 py-4 mb-6">
            <div className="grid grid-cols-12 gap-4 mb-3 text-slate-700 pb-2 border-b border-slate-200 font-bold">
              <div className="col-span-5">Item</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Rate</div>
              <div className="col-span-3 text-right">Amount</div>
            </div>

            <div className="space-y-2">
              {orders.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-4 text-slate-900 py-1">
                  <div className="col-span-5">{item.name}</div>
                  <div className="col-span-2 text-center font-bold">{item.quantity}</div>
                  <div className="col-span-2 text-right">₹{item.price.toFixed(2)}</div>
                  <div className="col-span-3 text-right font-bold">₹{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 mb-6 bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between text-slate-700">
              <span>Subtotal</span>
              <span className="font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Service Charge @ 5%</span>
              <span>₹{serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>CGST @ 2.5%</span>
              <span>₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>SGST @ 2.5%</span>
              <span>₹{sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-900 pt-3 border-t-2 border-indigo-500 text-xl">
              <span className="font-bold">Grand Total</span>
              <span className="font-bold text-indigo-600">₹{total.toFixed(2)}</span>
            </div>
            {paymentDetails.method === 'cash' && paymentDetails.amountPaid != null && paymentDetails.amountPaid > total && (
              <>
                <div className="flex justify-between text-slate-700 pt-2 border-t">
                  <span>Cash Received</span>
                  <span className="font-bold">₹{paymentDetails.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span className="font-bold">Change Returned</span>
                  <span className="font-bold">₹{(paymentDetails.amountPaid - total).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center border-t-2 border-slate-200 pt-6">
            <p className="text-slate-900 mb-2 text-lg font-bold">நன்றி! வணக்கம்!</p>
            <p className="text-slate-700 mb-2 font-medium">Thank you for dining with us!</p>
            <p className="text-slate-600">Please visit us again</p>
            <p className="text-slate-500 mt-4 text-sm">This is a computer generated bill</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onNewOrder}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            New Order
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-lg font-medium"
          >
            <Printer className="w-5 h-5" />
            Print Bill
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          /* Hide everything except receipt */
          body * {
            visibility: hidden;
          }
          #receipt, #receipt * {
            visibility: visible;
          }
          #receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            margin: 0;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          /* Reset backgrounds for clean print */
          #receipt .bg-indigo-50,
          #receipt .bg-slate-50 {
            background-color: #f8f8f8 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Ensure text is black for readability */
          #receipt p, #receipt span, #receipt div, #receipt h2, #receipt h3 {
            color: #000 !important;
          }
          #receipt .text-indigo-600 {
            color: #000 !important;
            font-weight: bold !important;
          }
          #receipt .text-green-700 {
            color: #000 !important;
          }

          /* Order type badge */
          #receipt .bg-blue-100,
          #receipt .bg-green-100 {
            background-color: transparent !important;
            border: 1px solid #000 !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Borders */
          #receipt .border-indigo-500 {
            border-color: #000 !important;
          }
          #receipt .border-indigo-200 {
            border-color: #ccc !important;
          }

          /* Page settings */
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
        }
      `}</style>
    </div>
  );
}