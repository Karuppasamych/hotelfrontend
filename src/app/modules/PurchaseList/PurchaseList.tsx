import { useState, useEffect, useMemo } from 'react';
import { CommonHeader } from '../../components/CommonHeader';
import { AgGridDataTable } from '../../components/AgGridDataTable';
import { purchaseListApi } from '../utils/purchaseListApi';
import { ColDef } from 'ag-grid-community';
import { Trash2, ShoppingCart, Calendar, Filter, CheckCircle2, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseItem {
  id: number;
  item_name: string;
  quantity: number;
  unit: string;
  in_stock: number;
  required: number;
  inventory_id: number | null;
  category: string;
  date: string;
  status: 'pending' | 'purchased';
  created_at: string;
}

export default function PurchaseList() {
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = filterDate
        ? await purchaseListApi.getByDate(filterDate)
        : await purchaseListApi.getAll();
      const data = (response.data as any)?.data || response.data;
      setItems(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
    } catch {
      toast.error('Failed to load purchase list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [filterDate]);

  const handleDelete = async (id: number) => {
    try {
      await purchaseListApi.delete(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      toast.success('Item removed');
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleBulkPurchase = async () => {
    if (selectedIds.size === 0) return;
    try {
      const response = await purchaseListApi.updateStatus(Array.from(selectedIds));
      if ((response as any).success !== false) {
        setItems(prev => prev.map(i => selectedIds.has(i.id) ? { ...i, status: 'purchased' as const } : i));
        toast.success(`${selectedIds.size} item(s) marked as purchased`);
        setSelectedIds(new Set());
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category || 'Uncategorized'));
    return ['All', ...Array.from(cats).sort()];
  }, [items]);

  const filteredItems = items.filter(item => {
    const matchStatus = filterStatus === 'All' || item.status === filterStatus.toLowerCase();
    const matchCategory = filterCategory === 'All' || (item.category || 'Uncategorized') === filterCategory;
    return matchStatus && matchCategory;
  });

  const pendingSelected = Array.from(selectedIds).filter(id => {
    const item = items.find(i => i.id === id);
    return item && item.status === 'pending';
  });

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    const pendingIds = filteredItems.filter(i => i.status === 'pending').map(i => i.id);
    const allSelected = pendingIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  };


  const columnDefs: ColDef[] = [
    {
      headerName: '',
      field: 'id',
      width: 60,
      pinned: 'left',
      lockPosition: true,
      suppressMovable: true,
      sortable: false,
      filter: false,
      headerComponent: () => {
        const pendingIds = filteredItems.filter(i => i.status === 'pending').map(i => i.id);
        const allSelected = pendingIds.length > 0 && pendingIds.every(id => selectedIds.has(id));
        return (
          <div onClick={toggleSelectAll} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', cursor: 'pointer' }}>
            <div style={{
              width: 20, height: 20, borderRadius: 6, border: `2px solid ${allSelected ? '#22c55e' : '#d1d5db'}`,
              backgroundColor: allSelected ? '#22c55e' : '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }}>
              {allSelected && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>
        );
      },
      onCellClicked: (params: any) => {
        if (params.data.status !== 'purchased') {
          toggleSelect(params.data.id);
        }
      },
      cellRenderer: (params: any) => {
        if (params.data.status === 'purchased') return null;
        const isSelected = selectedIds.has(params.data.id);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', cursor: 'pointer' }}>
            <div style={{
              width: 20, height: 20, borderRadius: 6, border: `2px solid ${isSelected ? '#22c55e' : '#d1d5db'}`,
              backgroundColor: isSelected ? '#22c55e' : '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }}>
              {isSelected && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>
        );
      },
      cellStyle: { padding: 0 }
    },
    {
      headerName: 'Item Name',
      field: 'item_name',
      flex: 2,
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => (
        <span className={`font-medium ${params.data.status === 'purchased' ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
          {params.value}
        </span>
      )
    },
    {
      headerName: 'Category',
      field: 'category',
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => (
        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold">
          {params.value || 'Uncategorized'}
        </span>
      )
    },
    {
      headerName: 'To Buy',
      field: 'quantity',
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => (
        <span className="text-blue-600 font-bold">
          {parseFloat(params.value).toFixed(2)} <span className="text-xs font-normal text-stone-400">{params.data.unit}</span>
        </span>
      ),
      cellStyle: { textAlign: 'right' }
    },
    {
      headerName: 'In Stock',
      field: 'in_stock',
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => (
        <span className="text-stone-700 font-medium">
          {parseFloat(params.value).toFixed(2)} <span className="text-xs font-normal text-stone-400">{params.data.unit}</span>
        </span>
      ),
      cellStyle: { textAlign: 'right' }
    },
    {
      headerName: 'Date',
      field: 'date',
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => (
        <span className="text-stone-700 font-medium">
          {new Date(params.value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      ),
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 130,
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => (
        <span className={`inline-block px-2.5 py-1 text-xs rounded-full font-semibold ${
          params.value === 'purchased' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {params.value === 'purchased' ? 'Purchased' : 'Pending'}
        </span>
      ),
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: 'Actions',
      width: 100,
      cellRenderer: (params: any) => (
        <div className="flex gap-2 justify-center h-full items-center">
          <button
            onClick={() => handleDelete(params.data.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
            title="Delete"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
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
          <div className="flex items-center gap-3">
            {pendingSelected.length > 0 && (
              <button
                onClick={handleBulkPurchase}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark as Purchased ({pendingSelected.length})
              </button>
            )}
            <span className="bg-white text-stone-600 text-sm font-bold px-4 py-2 rounded-full border border-stone-200 shadow-sm">
              {filteredItems.length} Items
            </span>
          </div>
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
              <button onClick={() => setFilterDate('')} className="text-xs text-stone-500 hover:text-stone-700 underline">
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
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-stone-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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
