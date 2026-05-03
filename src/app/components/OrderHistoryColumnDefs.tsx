import { ColDef } from 'ag-grid-community';
import { Eye, Printer, UtensilsCrossed, ShoppingBag, CreditCard, Smartphone, Banknote } from 'lucide-react';
import { Order } from './OrderHistory';

export const createOrderHistoryColumnDefs = (
  onViewOrder: (order: Order) => void,
  onPrintOrder: (order: Order) => void
): ColDef[] => {

  const OrderDetailsCellRenderer = (params: any) => {
    const order: Order = params.data;
    const rowNum = (params.node?.rowIndex ?? 0) + 1;
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 font-semibold text-xs">
          #{rowNum}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900">{order.orderId}</p>
          <p className="text-xs text-gray-500">{order.billId}</p>
        </div>
      </div>
    );
  };

  const DateTimeCellRenderer = (params: any) => {
    const date = new Date(params.value);
    return (
      <div className="leading-tight">
        <div className="text-sm text-gray-900 font-medium">
          {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
        <div className="text-xs text-gray-500">
          {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>
      </div>
    );
  };

  const OrderTypeCellRenderer = (params: any) => {
    return params.value === 'dine-in' ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <UtensilsCrossed className="w-3.5 h-3.5" />
        Dine-in
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
        <ShoppingBag className="w-3.5 h-3.5" />
        Takeaway
      </span>
    );
  };

  const ItemsCellRenderer = (params: any) => {
    const items: Order['items'] = params.value || [];
    const display = items.slice(0, 2);
    const remaining = items.length - 2;
    return (
      <div className="leading-tight">
        {display.map((item, idx) => (
          <div key={idx} className="text-sm text-gray-700 truncate">
            <span className="text-gray-400">•</span> {item.name} <span className="text-gray-400 text-xs">×{item.quantity}</span>
          </div>
        ))}
        {remaining > 0 && (
          <span className="text-xs text-blue-600 font-medium">+{remaining} more</span>
        )}
      </div>
    );
  };

  const QtyCellRenderer = (params: any) => {
    const items: Order['items'] = params.data.items || [];
    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    return (
      <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold text-sm border border-slate-200">
        {total}
      </span>
    );
  };

  const AmountCellRenderer = (params: any) => {
    const amount = typeof params.value === 'string' ? parseFloat(params.value) : params.value;
    return (
      <span className="text-base font-bold text-gray-900">
        ₹{(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    );
  };

  const PaymentCellRenderer = (params: any) => {
    const icons: Record<string, JSX.Element> = {
      Cash: <Banknote className="w-3.5 h-3.5" />,
      UPI: <Smartphone className="w-3.5 h-3.5" />,
      Card: <CreditCard className="w-3.5 h-3.5" />,
    };
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
        {icons[params.value] || <CreditCard className="w-3.5 h-3.5" />}
        {params.value}
      </span>
    );
  };

  const StatusCellRenderer = (params: any) => {
    const isPaid = params.value === 'Paid';
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
        isPaid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
      }`}>
        {isPaid ? 'Paid' : 'Cancelled'}
      </span>
    );
  };

  const ActionsCellRenderer = (params: any) => {
    return (
      <div className="flex gap-2 justify-center h-full items-center">
        <button
          onClick={() => onViewOrder(params.data)}
          className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-110 transition-all shadow-sm"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPrintOrder(params.data)}
          className="px-2 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 hover:scale-105 transition-all inline-flex items-center gap-1 text-xs font-medium shadow-sm"
          title="Print Bill"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
      </div>
    );
  };

  return [
    {
      headerName: 'Order Details',
      field: 'orderId',
      width: 170,
      pinned: 'left',
      cellRenderer: OrderDetailsCellRenderer,
      sortable: true,
      filter: false,
    },
    {
      headerName: 'Date & Time',
      field: 'date',
      width: 150,
      cellRenderer: DateTimeCellRenderer,
      sortable: true,
      sort: 'desc',
      filter: false,
    },
    {
      headerName: 'Type',
      field: 'orderType',
      width: 130,
      cellRenderer: OrderTypeCellRenderer,
      sortable: true,
      filter: false,
    },
    {
      headerName: 'Items Ordered',
      field: 'items',
      flex: 1,
      minWidth: 200,
      cellRenderer: ItemsCellRenderer,
      sortable: false,
      filter: false,
    },
    {
      headerName: 'Qty',
      width: 90,
      cellRenderer: QtyCellRenderer,
      cellStyle: { textAlign: 'center' },
      sortable: true,
      filter: false,
      comparator: (_a: any, _b: any, nodeA: any, nodeB: any) => {
        const qtyA = (nodeA.data.items || []).reduce((s: number, i: any) => s + i.quantity, 0);
        const qtyB = (nodeB.data.items || []).reduce((s: number, i: any) => s + i.quantity, 0);
        return qtyA - qtyB;
      },
    },
    {
      headerName: 'Amount',
      field: 'totalAmount',
      width: 140,
      cellRenderer: AmountCellRenderer,
      cellStyle: { textAlign: 'right' },
      sortable: true,
      filter: false,
    },
    {
      headerName: 'Payment',
      field: 'paymentMode',
      width: 120,
      cellRenderer: PaymentCellRenderer,
      cellStyle: { textAlign: 'center' },
      sortable: true,
      filter: false,
    },
    {
      headerName: 'Status',
      field: 'orderStatus',
      width: 120,
      cellRenderer: StatusCellRenderer,
      cellStyle: { textAlign: 'center' },
      sortable: true,
      filter: false,
    },
    {
      headerName: 'Initiated By',
      field: 'initiatedBy',
      width: 130,
      cellRenderer: (params: any) => {
        if (!params.value) return <span className="text-gray-400 text-xs">-</span>;
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {params.value}
          </span>
        );
      },
      cellStyle: { textAlign: 'center' },
      sortable: true,
      filter: false,
    },
    {
      headerName: 'Actions',
      width: 150,
      cellRenderer: ActionsCellRenderer,
      cellStyle: { textAlign: 'center' },
      sortable: false,
      filter: false,
      pinned: 'right',
    },
  ];
};
