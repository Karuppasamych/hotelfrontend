import { X, CreditCard, Calendar, User, UtensilsCrossed, Clock, Hash, Printer } from 'lucide-react';
import { Order } from './OrderHistoryTable';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
}

const CGST_RATE = 0.025;
const SGST_RATE = 0.025;
const SERVICE_CHARGE_RATE = 0.05;

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  if (!order) return null;

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
  const cgst = subtotal * CGST_RATE;
  const sgst = subtotal * SGST_RATE;

  const handlePrintBill = () => {
    const dateStr = new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = new Date(order.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const html = `
      <html>
      <head>
        <title>Bill - ${order.billId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1a1a1a; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 12px; margin-bottom: 12px; }
          .header h1 { font-size: 18px; font-weight: 700; }
          .header p { font-size: 11px; color: #555; margin-top: 2px; }
          .info { font-size: 11px; margin-bottom: 10px; }
          .info div { display: flex; justify-content: space-between; padding: 2px 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th { font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #333; padding: 6px 4px; text-align: left; }
          th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: right; }
          td { font-size: 12px; padding: 5px 4px; border-bottom: 1px dotted #ccc; }
          td:nth-child(3), td:nth-child(4), td:nth-child(5) { text-align: right; }
          .totals { border-top: 2px dashed #333; padding-top: 8px; margin-top: 4px; font-size: 12px; }
          .totals div { display: flex; justify-content: space-between; padding: 3px 0; }
          .totals .grand { font-size: 16px; font-weight: 700; border-top: 2px solid #333; padding-top: 8px; margin-top: 6px; }
          .footer { text-align: center; margin-top: 16px; border-top: 2px dashed #333; padding-top: 10px; font-size: 10px; color: #777; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Madurai Pandiyan Hotel</h1>
          <p>Tax Invoice / Bill of Supply</p>
          <p style="margin-top:6px; font-weight:700; font-size:13px;">${order.billId}</p>
        </div>
        <div class="info">
          <div><span>Date:</span><span>${dateStr}</span></div>
          <div><span>Time:</span><span>${timeStr}</span></div>
          <div><span>Order:</span><span>${order.orderId}</span></div>
          <div><span>Type:</span><span>${order.orderType === 'dine-in' ? 'Dine-In' + (order.tableNumber ? ' (Table ' + order.tableNumber + ')' : '') : 'Takeaway'}</span></div>
          <div><span>Payment:</span><span>${order.paymentMode}</span></div>
          <div><span>Status:</span><span>${order.orderStatus}</span></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>
            ${order.items.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>\u20b9${item.price.toFixed(2)}</td>
                <td>\u20b9${(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <div><span>Subtotal</span><span>\u20b9${subtotal.toFixed(2)}</span></div>
          <div><span>Service Charge (5%)</span><span>\u20b9${serviceCharge.toFixed(2)}</span></div>
          <div><span>CGST (2.5%)</span><span>\u20b9${cgst.toFixed(2)}</span></div>
          <div><span>SGST (2.5%)</span><span>\u20b9${sgst.toFixed(2)}</span></div>
          <div class="grand"><span>Grand Total</span><span>\u20b9${order.totalAmount.toFixed(2)}</span></div>
        </div>
        <div class="footer">
          <p>Thank you for dining with us!</p>
          <p style="margin-top:4px;">Printed: ${new Date().toLocaleString('en-IN')}</p>
        </div>
        <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=450,height=650');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const getStatusColor = (status: Order['orderStatus']) => {
    return status === 'Paid'
      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-green-500'
      : 'bg-gradient-to-r from-red-400 to-rose-500 text-white border-red-500';
  };

  const getPaymentModeIcon = (mode: Order['paymentMode']) => {
    const icons: Record<string, string> = {
      Cash: '💵',
      UPI: '📱',
      Card: '💳',
    };
    return icons[mode] || '💰';
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-8 py-6 flex items-center justify-between shadow-lg z-10">
          <div>
            <h2 className="text-2xl font-bold">
              Order Details
            </h2>
            <p className="text-orange-100 mt-1 text-sm">
              Bill ID: {order.billId} • Order ID: {order.orderId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 hover:rotate-90 rounded-full p-2 transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Info Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-blue-700">Date</p>
              </div>
              <p className="font-bold text-gray-900 text-sm">
                {new Date(order.date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-purple-700">Time</p>
              </div>
              <p className="font-bold text-gray-900 text-sm">
                {new Date(order.date).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                  <UtensilsCrossed className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-green-700">Type</p>
              </div>
              <p className="font-bold text-gray-900 text-sm">
                {order.orderType === 'dine-in' ? `🪑 Table ${order.tableNumber}` : '🥡 Takeaway'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200 shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-md">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-orange-700">Payment</p>
              </div>
              <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span className="text-lg">{getPaymentModeIcon(order.paymentMode)}</span>
                {order.paymentMode}
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200 shadow-md col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                  <Hash className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-yellow-700">Status</p>
              </div>
              <span
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold shadow-lg ${getStatusColor(
                  order.orderStatus
                )}`}
              >
                {order.orderStatus === 'Paid' ? '✓ Paid' : '✗ Cancelled'}
              </span>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center text-white text-sm">
                🍽️
              </span>
              Order Items
            </h3>
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="transition-colors duration-200 hover:bg-orange-50"
                    >
                      <td className="px-6 py-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {idx + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg font-bold shadow-md">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                        ₹{(item.quantity * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-orange-50 to-amber-50">
                  <tr className="border-t-4 border-orange-300">
                    <td colSpan={4} className="px-6 py-5 text-right">
                      <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                        ₹{order.totalAmount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200 px-8 py-5 flex justify-end gap-4 shadow-lg">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200 font-semibold shadow-md"
          >
            Close
          </button>
          <button
            onClick={handlePrintBill}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 font-semibold shadow-lg flex items-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Print Bill
          </button>
        </div>
      </div>
    </div>
  );
}
