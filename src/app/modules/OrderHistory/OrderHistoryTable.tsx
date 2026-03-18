import { Eye, Printer, ChevronDown, ChevronUp, UtensilsCrossed, ShoppingBag, CreditCard, Smartphone, Banknote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

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

interface OrderHistoryTableProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onPrintOrder: (order: Order) => void;
}

export function OrderHistoryTable({ orders, onViewOrder, onPrintOrder }: OrderHistoryTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calculate pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = orders.slice(startIndex, endIndex);

  // Reset to page 1 when orders change
  useState(() => {
    setCurrentPage(1);
  });

  const toggleRowExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedRows(new Set()); // Reset expanded rows when changing pages
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
    setExpandedRows(new Set());
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const getStatusColor = (status: Order['orderStatus']) => {
    return status === 'Paid' 
      ? 'bg-green-50 text-green-700 border border-green-200' 
      : 'bg-red-50 text-red-700 border border-red-200';
  };

  const getPaymentModeIcon = (mode: Order['paymentMode']) => {
    const icons: Record<string, JSX.Element> = {
      Cash: <Banknote className="w-4 h-4" />,
      UPI: <Smartphone className="w-4 h-4" />,
      Card: <CreditCard className="w-4 h-4" />,
    };
    return icons[mode] || <CreditCard className="w-4 h-4" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-800 text-white">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b-2 border-slate-700">
              Order Details
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b-2 border-slate-700">
              Date & Time
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b-2 border-slate-700">
              Type
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b-2 border-slate-700">
              Items Ordered
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider border-b-2 border-slate-700">
              Qty
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider border-b-2 border-slate-700">
              Amount
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider border-b-2 border-slate-700">
              Payment
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider border-b-2 border-slate-700">
              Status
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider border-b-2 border-slate-700">
              View
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider border-b-2 border-slate-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {paginatedOrders.map((order, index) => {
            const isExpanded = expandedRows.has(order.id);
            const hasMoreItems = order.items.length > 2;
            const actualIndex = startIndex + index;

            return (
              <tr
                key={order.id}
                className="transition-all duration-200 cursor-pointer border-b border-gray-100 hover:bg-slate-50 hover:shadow-sm"
                onClick={() => onViewOrder(order)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-9 h-9 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 font-semibold text-sm">
                      #{actualIndex + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{order.orderId}</p>
                      <p className="text-xs text-gray-500">{order.billId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    {new Date(order.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(order.date).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.orderType === 'dine-in' ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      Dine-in
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Takeaway
                    </span>
                  )}
                </td>
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="max-w-xs">
                    {(isExpanded ? order.items : order.items.slice(0, 2)).map((item, idx) => (
                      <div key={item.id} className="text-sm text-gray-700 truncate mb-0.5" title={item.name}>
                        <span className="text-gray-400">•</span> {item.name} <span className="text-gray-400 text-xs">×{item.quantity}</span>
                      </div>
                    ))}
                    {hasMoreItems && (
                      <button
                        onClick={() => toggleRowExpansion(order.id)}
                        className="text-xs text-blue-600 font-medium mt-1 inline-flex items-center gap-1 hover:text-blue-700 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            +{order.items.length - 2} more
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-sm border border-slate-200">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-base font-bold text-gray-900">
                    ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                    {getPaymentModeIcon(order.paymentMode)}
                    {order.paymentMode}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold ${getStatusColor(
                      order.orderStatus
                    )}`}
                  >
                    {order.orderStatus === 'Paid' ? 'Paid' : 'Cancelled'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onViewOrder(order)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onPrintOrder(order)}
                    className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all duration-200 inline-flex items-center gap-2 text-xs font-medium shadow-sm hover:shadow-md"
                    title="Print Bill"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {orders.length > 0 && (
        <div className="bg-slate-50 border-t border-gray-200 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Items per page selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-gray-700 font-medium"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, orders.length)} of {orders.length} orders
              </span>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              {/* Previous button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-all ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:scale-105 active:scale-95'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  
                  const pageNumber = page as number;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`min-w-[2.5rem] px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 ${
                        currentPage === pageNumber
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              {/* Next button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-all ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:scale-105 active:scale-95'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
