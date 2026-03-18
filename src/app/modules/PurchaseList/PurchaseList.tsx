import { useState, useEffect } from 'react';
import { CommonHeader } from '../../components/CommonHeader';
import { AgGridDataTable } from '../../components/AgGridDataTable';
import { purchaseListApi } from '../utils/purchaseListApi';
import { ColDef } from 'ag-grid-community';
import { Trash2, ShoppingCart, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseItem {
  id: number;
  item_name: string;
  quantity: number;
  unit: string;
  in_stock: number;
  required: number;
  inventory_id: number | null;
  date: string;
  status: 'pending' | 'purchased';
  created_at: string;
}

export default function PurchaseList() {
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = filterDate
        ? await purchaseListApi.getByDate(filterDate)
        : await purchaseListApi.getAll();
      const data = (response.data as any)?.data || response.data;
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load purchase list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filterDate]);

  const handleDelete = async (id: number) => {
    try {
      await purchaseListApi.delete(id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Item removed from purchase list');
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const filteredItems = items.filter(item => {
    if (filterStatus === 'All') return true;
    return item.status === filterStatus.toLowerCase();
  });

  const StatusCellRenderer = (params: any) => {
    const status = params.value;
    return (
      <span className={`inline-block px-2.5 py-1 text-xs rounded-full font-semibold ${
        status === 'purchased' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
      }`}>
        {status === 'purchased' ? 'Purchased' : 'Pending'}
      </span>
    );
  };

  const RequiredCellRenderer = (params: any) => {
    const qty = parseFloat(params.data.quantity);
    const inStock = parseFloat(params.data.in_stock);
    if (qty <= inStock) {
      return <span className="text-emerald-600 font-semibold text-xs">Sufficient</span>;
    }
    return <span className="text-rose-600 font-bold">{qty.toFixed(2)} <span className="text-xs font-normal text-stone-400">{params.data.unit}</span></span>;
  };

  const DateCellRenderer = (params: any) => {
    const date = new Date(params.value);
    return <span className="text-stone-700 font-medium">{date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>;
  };

  const ActionsCellRenderer = (params: any) => {
    return (
      <div className="flex gap-2 justify-center h-full items-center">
        <button
          onClick={() => handleDelete(params.data.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
          title="Delete"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    );
  };

  const InStockCellRenderer = (params: any) => {
    const val = parseFloat(params.value);
    return <span className="text-stone-700 font-medium">{val.toFixed(2)} <span className="text-xs font-normal text-stone-400">{params.data.unit}</span></span>;
  };

  const ToBuyCellRenderer = (params: any) => {
    const val = parseFloat(params.value);
    return <span className="text-blue-600 font-bold">{val.toFixed(2)} <span className="text-xs font-normal text-stone-400">{params.data.unit}</span></span>;
  };

  const columnDefs: ColDef[] = [
    {
      headerName: 'Item Name',
      field: 'item_name',
      flex: 2,
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => (
        <span className="text-stone-900 font-medium">{params.value}</span>
      )
    },
    {
      headerName: 'To Buy',
      field: 'quantity',
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: ToBuyCellRenderer,
      cellStyle: { textAlign: 'right' }
    },
    {
      headerName: 'In Stock',
      field: 'in_stock',
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: InStockCellRenderer,
      cellStyle: { textAlign: 'right' }
    },
    {
      headerName: 'Required',
      field: 'required',
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: RequiredCellRenderer,
      cellStyle: { textAlign: 'right' }
    },
    {
      headerName: 'Date',
      field: 'date',
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: DateCellRenderer,
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 130,
      sortable: true,
      filter: false,
      cellRenderer: StatusCellRenderer,
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: 'Actions',
      width: 100,
      cellRenderer: ActionsCellRenderer,
      cellStyle: { textAlign: 'center' },
      sortable: false,
      filter: false
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading purchase list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <CommonHeader showStats={false} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2.5 rounded-xl border border-emerald-200 shadow-sm">
              <ShoppingCart className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-800 tracking-tight">Purchase List</h2>
              <p className="text-sm text-stone-500 font-medium">Track items to purchase for kitchen operations</p>
            </div>
          </div>
          <span className="bg-white text-stone-600 text-sm font-bold px-4 py-2 rounded-full border border-stone-200 shadow-sm">
            {filteredItems.length} Items
          </span>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-stone-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-stone-500 hover:text-stone-700 underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-stone-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="All">All Status</option>
              <option value="pending">Pending</option>
              <option value="purchased">Purchased</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden p-4">
          <AgGridDataTable
            data={filteredItems}
            columnDefs={columnDefs}
            emptyMessage="No purchase items found."
            emptyIcon="🛒"
            height="500px"
            paginationPageSize={10}
          />
        </div>
      </div>
    </div>
  );
}
