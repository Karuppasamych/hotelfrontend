import { useState, useEffect, useMemo } from 'react';
import { CommonHeader } from '../../components/CommonHeader';
import { AgGridDataTable } from '../../components/AgGridDataTable';
import { purchaseListApi } from '../utils/purchaseListApi';
import { ColDef } from 'ag-grid-community';
import { Trash2, ShoppingCart, Calendar, Filter, CheckCircle2, Tag, Printer, Plus, Search, Check, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryApi } from '../utils/inventoryApi';

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
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showAddItem, setShowAddItem] = useState(false);
  const [nameSearch, setNameSearch] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [showDropdown, setShowDropdown] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string; unit: string; stock: number }[]>([]);
  const [adding, setAdding] = useState(false);
  const [editItem, setEditItem] = useState<PurchaseItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editUnit, setEditUnit] = useState('kg');
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = appliedDate
        ? await purchaseListApi.getByDate(appliedDate)
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

  useEffect(() => { fetchItems(); }, [appliedDate]);

  // Fetch inventory for search dropdown
  useEffect(() => {
    inventoryApi.getAll().then(res => {
      if (res.success && res.data) {
        setInventoryItems(res.data.map(i => ({ id: String(i.id), name: i.name, unit: i.unit, stock: parseFloat(String(i.quantity_available)) || 0 })));
      }
    }).catch(() => {});
  }, []);

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

  const handlePrintSelected = () => {
    const idsToPrint = selectedIds.size > 0 ? selectedIds : new Set(filteredItems.map(i => i.id));
    const printItems = items.filter(i => idsToPrint.has(i.id));
    if (printItems.length === 0) {
      toast.error('No items to print');
      return;
    }

    const dateStr = filterDate
      ? new Date(filterDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const totalQty = printItems.reduce((s, i) => s + parseFloat(String(i.quantity)), 0);

    const html = `
      <html>
      <head>
        <title>Purchase List</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1a1a1a; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; }
          .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
          .header p { font-size: 13px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #374151; border-bottom: 2px solid #d1d5db; }
          td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
          tr:nth-child(even) { background: #f9fafb; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .bold { font-weight: 700; }
          .status-pending { color: #b45309; background: #fef3c7; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
          .status-purchased { color: #15803d; background: #dcfce7; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
          .footer { margin-top: 20px; padding-top: 12px; border-top: 2px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Madurai Pandiyan Hotel</h1>
          <p>Purchase List — ${dateStr}</p>
          <p style="margin-top:4px;">${printItems.length} item(s)</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item Name</th>
              <th>Category</th>
              <th class="text-right">To Buy</th>
              <th class="text-right">In Stock</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${printItems.map((item, idx) => `
              <tr>
                <td class="bold">${idx + 1}</td>
                <td class="bold">${item.item_name}</td>
                <td>${item.category || 'Uncategorized'}</td>
                <td class="text-right bold">${parseFloat(String(item.quantity)).toFixed(2)} ${item.unit}</td>
                <td class="text-right">${parseFloat(String(item.in_stock)).toFixed(2)} ${item.unit}</td>
                <td class="text-center"><span class="${item.status === 'purchased' ? 'status-purchased' : 'status-pending'}">${item.status === 'purchased' ? 'Purchased' : 'Pending'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <span>Total Items: ${printItems.length}</span>
          <span>Printed: ${new Date().toLocaleString('en-IN')}</span>
        </div>
        <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  const filteredInventoryItems = useMemo(() => {
    if (!nameSearch.trim()) return inventoryItems;
    return inventoryItems.filter(i => i.name.toLowerCase().includes(nameSearch.toLowerCase()));
  }, [nameSearch, inventoryItems]);

  const handleSelectInventoryItem = (item: { id: string; name: string; unit: string; stock: number }) => {
    setNewItemName(item.name);
    setNewItemUnit(item.unit);
    setNameSearch(item.name);
    setShowDropdown(false);
  };

  const handleNameInputChange = (value: string) => {
    setNameSearch(value);
    setNewItemName(value);
    setShowDropdown(true);
  };

  const handleAddPurchaseItem = async () => {
    if (!newItemName.trim() || !newItemQty) {
      toast.error('Please enter item name and quantity');
      return;
    }
    setAdding(true);
    try {
      const response = await purchaseListApi.create({
        item_name: newItemName.trim(),
        quantity: parseFloat(newItemQty),
        unit: newItemUnit,
        date: appliedDate || new Date().toISOString().split('T')[0],
      });
      if ((response as any).success !== false) {
        toast.success(`"${newItemName.trim()}" added to purchase list`);
        setNewItemName('');
        setNewItemQty('');
        setNewItemUnit('kg');
        setNameSearch('');
        setShowAddItem(false);
        fetchItems();
      } else {
        toast.error('Failed to add item');
      }
    } catch {
      toast.error('Error adding item');
    }
    setAdding(false);
  };

  const openEditModal = (item: PurchaseItem) => {
    setEditItem(item);
    setEditName(item.item_name);
    setEditQty(String(item.quantity));
    setEditUnit(item.unit);
  };

  const handleUpdateItem = async () => {
    if (!editItem || !editName.trim() || !editQty) {
      toast.error('Please fill all fields');
      return;
    }
    setSaving(true);
    try {
      const response = await purchaseListApi.update(editItem.id, {
        item_name: editName.trim(),
        quantity: parseFloat(editQty),
        unit: editUnit,
      });
      if ((response as any).success !== false) {
        toast.success('Item updated');
        setEditItem(null);
        fetchItems();
      } else {
        toast.error('Failed to update item');
      }
    } catch {
      toast.error('Error updating item');
    }
    setSaving(false);
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
      width: 120,
      cellRenderer: (params: any) => (
        <div className="flex gap-1 justify-center h-full items-center">
          {params.data.status === 'pending' && (
            <button
              onClick={() => openEditModal(params.data)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
              title="Edit"
            >
              <Pencil className="size-4" />
            </button>
          )}
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
            <button
              onClick={() => setShowAddItem(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
            <button
              onClick={handlePrintSelected}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
            >
              <Printer className="h-4 w-4" />
              {selectedIds.size > 0 ? `Print Selected (${selectedIds.size})` : 'Print All'}
            </button>
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
              defaultValue={filterDate}
              onBlur={(e) => {
                const val = e.target.value;
                setFilterDate(val);
                setAppliedDate(val);
              }}
              ref={(el) => { if (el) el.value = filterDate; }}
              className="px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {filterDate && (
              <button onClick={() => { setFilterDate(''); setAppliedDate(''); }} className="text-xs text-stone-500 hover:text-stone-700 underline">
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

        {/* Add Item Section */}
        {showAddItem && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-orange-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-orange-600" />
                <h3 className="font-bold text-stone-800 text-sm">Add Purchase Item</h3>
              </div>
              <button onClick={() => { setShowAddItem(false); setNameSearch(''); setNewItemName(''); setNewItemQty(''); setNewItemUnit('kg'); setShowDropdown(false); }}
                className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search inventory or type new item..."
                  value={nameSearch}
                  onChange={(e) => handleNameInputChange(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  autoFocus
                />
                {showDropdown && nameSearch.trim() && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-stone-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredInventoryItems.length > 0 ? (
                      filteredInventoryItems.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={() => handleSelectInventoryItem(item)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 flex justify-between items-center border-b border-stone-100 last:border-0"
                        >
                          <span className="font-medium text-stone-800">{item.name}</span>
                          <span className="text-xs text-stone-400">{item.stock.toFixed(1)} {item.unit}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-stone-500">
                        No match — <span className="font-semibold text-orange-600">"{nameSearch}"</span> will be added as new
                      </div>
                    )}
                  </div>
                )}
              </div>
              <input
                type="number"
                placeholder="Qty"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                className="w-24 px-3 py-2.5 text-sm border-2 border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-center font-bold"
              />
              <select
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="w-24 px-3 py-2.5 text-sm border-2 border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="pcs">pcs</option>
                <option value="box">box</option>
              </select>
              <button
                onClick={handleAddPurchaseItem}
                disabled={!newItemName.trim() || !newItemQty || adding}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {adding ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                Add
              </button>
            </div>
          </div>
        )}

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

        {/* Edit Item Modal */}
        {editItem && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Pencil className="w-5 h-5" /> Edit Purchase Item</h3>
                <button onClick={() => setEditItem(null)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Item Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantity</label>
                    <input type="number" step="any" min="0" value={editQty} onChange={(e) => setEditQty(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unit</label>
                    <select value={editUnit} onChange={(e) => setEditUnit(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm bg-white">
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                      <option value="pcs">pcs</option>
                      <option value="box">box</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setEditItem(null)}
                  className="flex-1 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium">
                  Cancel
                </button>
                <button onClick={handleUpdateItem} disabled={saving}
                  className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-lg font-bold flex items-center justify-center gap-2 transition-all">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Update Item'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
