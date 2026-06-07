import { useState, useEffect } from 'react';
import { CommonHeader } from '../../components/CommonHeader';
import { managerTodoApi, ManagerTodoItem, ConsolidatedTodoItem } from '../utils/managerTodoApi';
import { MoveStockDialog } from '../../components/MoveStockDialog';
import { ClipboardCheck, Calendar, ArrowRightLeft, Package, CheckCircle2, Trash2, RotateCcw, Eye, List, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagerTodo() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<ManagerTodoItem[]>([]);
  const [consolidated, setConsolidated] = useState<ConsolidatedTodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'consolidated' | 'dishwise'>('consolidated');
  const [movingId, setMovingId] = useState<number | null>(null);
  const [bulkMoving, setBulkMoving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<ManagerTodoItem | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, consolidatedRes] = await Promise.all([
        managerTodoApi.getByDate(date),
        managerTodoApi.getConsolidatedByDate(date),
      ]);
      const itemsData = (itemsRes.data as any)?.data || itemsRes.data;
      const consData = (consolidatedRes.data as any)?.data || consolidatedRes.data;
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setConsolidated(Array.isArray(consData) ? consData : []);
      setSelectedIds(new Set());
    } catch {
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [date]);

  const handleMoveToInventory = async (item: ManagerTodoItem) => {
    setMoveTarget(item);
    setMoveDialogOpen(true);
  };

  const confirmMoveToInventory = async (toAvailable: number, toPrepared: number) => {
    if (!moveTarget) return;
    setMovingId(moveTarget.id);
    try {
      const res = await managerTodoApi.moveToInventory(moveTarget.id, toAvailable, toPrepared);
      if (res.success) {
        toast.success((res.data as any)?.message || 'Moved to inventory');
        fetchData();
      } else {
        toast.error((res as any).error || 'Failed to move');
      }
    } catch {
      toast.error('Error moving to inventory');
    }
    setMovingId(null);
    setMoveDialogOpen(false);
    setMoveTarget(null);
  };

  const handleBulkMove = async () => {
    if (selectedIds.size > 0) {
      // Move only selected
      setBulkMoving(true);
      try {
        const res = await managerTodoApi.bulkMoveSelectedToInventory(Array.from(selectedIds));
        if (res.success) {
          toast.success((res.data as any)?.message || `${selectedIds.size} item(s) moved`);
          fetchData();
        } else {
          toast.error('Failed to move items');
        }
      } catch {
        toast.error('Error moving items');
      }
      setBulkMoving(false);
    } else {
      // Move all
      if (!confirm('Move all remaining items back to inventory?')) return;
      setBulkMoving(true);
      try {
        const res = await managerTodoApi.bulkMoveToInventory(date);
        if (res.success) {
          toast.success((res.data as any)?.message || 'All items moved');
          fetchData();
        } else {
          toast.error('Failed to move items');
        }
      } catch {
        toast.error('Error moving items');
      }
      setBulkMoving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await managerTodoApi.delete(id);
      toast.success('Item removed');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleUpdateTotal = async (id: number) => {
    const newTotal = parseFloat(editValue);
    if (isNaN(newTotal) || newTotal < 0) {
      toast.error('Please enter a valid number');
      return;
    }
    try {
      const res = await managerTodoApi.updateTotalQuantity(id, newTotal);
      if (res.success) {
        toast.success((res.data as any)?.message || 'Total updated');
        setEditingId(null);
        setEditValue('');
        fetchData();
      } else {
        toast.error((res as any).error || 'Failed to update');
      }
    } catch {
      toast.error('Error updating total');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const movableIds = activeItems.filter(i => parseFloat(String(i.remaining_quantity)) > 0).map(i => i.id);
    const allSelected = movableIds.length > 0 && movableIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(movableIds));
    }
  };

  const activeItems = items.filter(i => i.status === 'active');
  const hasRemaining = activeItems.some(i => parseFloat(String(i.remaining_quantity)) > 0);

  // Group by dish for dish-wise view
  const dishGroups = activeItems.reduce((acc, item) => {
    const dish = item.dish_name || 'Unassigned';
    if (!acc[dish]) acc[dish] = [];
    acc[dish].push(item);
    return acc;
  }, {} as Record<string, ManagerTodoItem[]>);

  const getProgressColor = (used: number, total: number) => {
    const pct = total > 0 ? (used / total) * 100 : 0;
    if (pct >= 100) return 'bg-green-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const Checkbox = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
    <div onClick={onClick} className="cursor-pointer flex items-center justify-center">
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked ? 'border-teal-500 bg-teal-500' : 'border-gray-300 bg-white hover:border-teal-400'}`}>
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <CommonHeader showStats={false} />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Manager ToDo</h1>
              <p className="text-sm text-gray-500">Daily ingredient prep tracking & management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasRemaining && (
              <button
                onClick={handleBulkMove}
                disabled={bulkMoving}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold rounded-xl shadow-md text-sm transition-all"
              >
                {bulkMoving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                {selectedIds.size > 0 ? `Move Selected (${selectedIds.size}) to Inventory` : 'Move All to Inventory'}
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('consolidated')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'consolidated' ? 'bg-white shadow-sm text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              Consolidated
            </button>
            <button
              onClick={() => setView('dishwise')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'dishwise' ? 'bg-white shadow-sm text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List className="w-3.5 h-3.5 inline mr-1" />
              Dish-wise
            </button>
          </div>
          {activeItems.filter(i => parseFloat(String(i.remaining_quantity)) > 0).length > 0 && (
            <button onClick={toggleSelectAll} className="text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors">
              {activeItems.filter(i => parseFloat(String(i.remaining_quantity)) > 0).every(i => selectedIds.has(i.id)) ? 'Deselect All' : 'Select All'}
            </button>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full font-bold border border-blue-200">
              {activeItems.length} Active
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-bold border border-green-200">
              {items.filter(i => i.status === 'completed').length} Completed
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full font-bold border border-purple-200">
              {items.filter(i => i.status === 'moved').length} Moved
            </span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-gray-200 shadow-sm">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No items for this date</h3>
            <p className="text-sm text-gray-400">Items will appear here when dishes are confirmed in the Calculator</p>
          </div>
        ) : view === 'consolidated' ? (
          /* Consolidated View */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Consolidated Ingredients
              </h2>
              <p className="text-teal-100 text-xs mt-1">All ingredients combined across dishes</p>
            </div>
            <div className="divide-y divide-gray-100">
              {consolidated.map((item, idx) => {
                const total = parseFloat(String(item.total_quantity));
                const used = parseFloat(String(item.used_quantity));
                const remaining = parseFloat(String(item.remaining_quantity));
                const pct = total > 0 ? (used / total) * 100 : 0;
                // Find matching active item IDs for this ingredient
                const matchingIds = activeItems.filter(i => i.ingredient_name === item.ingredient_name && parseFloat(String(i.remaining_quantity)) > 0).map(i => i.id);
                const isSelected = matchingIds.length > 0 && matchingIds.every(id => selectedIds.has(id));
                const canSelect = remaining > 0 && matchingIds.length > 0;

                return (
                  <div key={idx} className={`px-6 py-4 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-teal-50/50' : ''}`}>
                    <div className="flex items-center gap-4">
                      {canSelect && (
                        <Checkbox
                          checked={isSelected}
                          onClick={() => {
                            setSelectedIds(prev => {
                              const next = new Set(prev);
                              if (isSelected) {
                                matchingIds.forEach(id => next.delete(id));
                              } else {
                                matchingIds.forEach(id => next.add(id));
                              }
                              return next;
                            });
                          }}
                        />
                      )}
                      {!canSelect && <div className="w-5" />}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-800">{item.ingredient_name}</p>
                            <p className="text-xs text-gray-500">Used in: {item.dishes || '-'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-800">
                              {used.toFixed(1)} / {editingId === matchingIds[0] && matchingIds.length > 0 ? (
                                <span className="inline-flex items-center gap-1">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateTotal(matchingIds[0])}
                                    className="w-20 px-1.5 py-0.5 text-xs border border-teal-400 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-center font-bold"
                                    autoFocus
                                  />
                                  <button onClick={() => handleUpdateTotal(matchingIds[0])} className="p-0.5 text-green-600 hover:bg-green-50 rounded">
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => { setEditingId(null); setEditValue(''); }} className="p-0.5 text-gray-400 hover:bg-gray-100 rounded">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1">
                                  {total.toFixed(1)}
                                  {canSelect && matchingIds.length === 1 && (
                                    <button onClick={() => { setEditingId(matchingIds[0]); setEditValue(String(total)); }} className="p-0.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors">
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  )}
                                </span>
                              )} <span className="text-gray-400 font-normal">{item.unit}</span>
                            </p>
                            <p className={`text-xs font-bold ${remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                              {remaining > 0 ? `${remaining.toFixed(1)} ${item.unit} remaining` : 'Fully used'}
                            </p>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${getProgressColor(used, total)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Dish-wise View */
          <div className="space-y-6">
            {Object.entries(dishGroups).map(([dish, dishItems]) => (
              <div key={dish} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 flex items-center justify-between">
                  <h3 className="font-bold text-white">{dish}</h3>
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">{dishItems.length} ingredients</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {dishItems.map(item => {
                    const total = parseFloat(String(item.total_quantity));
                    const used = parseFloat(String(item.used_quantity));
                    const remaining = parseFloat(String(item.remaining_quantity));
                    const canSelect = remaining > 0 && item.status === 'active';

                    return (
                      <div key={item.id} className={`px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${selectedIds.has(item.id) ? 'bg-teal-50/50' : ''}`}>
                        {canSelect && (
                          <Checkbox checked={selectedIds.has(item.id)} onClick={() => toggleSelect(item.id)} />
                        )}
                        {!canSelect && <div className="w-5" />}
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 text-sm">{item.ingredient_name}</p>
                          <p className="text-xs text-gray-500">
                            Used: {used.toFixed(1)} / Total: {editingId === item.id ? (
                              <span className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateTotal(item.id)}
                                  className="w-20 px-1.5 py-0.5 text-xs border border-teal-400 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-center font-bold"
                                  autoFocus
                                />
                                <button onClick={() => handleUpdateTotal(item.id)} className="p-0.5 text-green-600 hover:bg-green-50 rounded">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { setEditingId(null); setEditValue(''); }} className="p-0.5 text-gray-400 hover:bg-gray-100 rounded">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                {total.toFixed(1)}
                                {item.status === 'active' && (
                                  <button onClick={() => { setEditingId(item.id); setEditValue(String(total)); }} className="p-0.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors">
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                )}
                              </span>
                            )} {item.unit}
                            {remaining > 0 && <span className="text-amber-600 font-bold ml-2">({remaining.toFixed(1)} left)</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {remaining > 0 && item.status === 'active' && (
                            <button
                              onClick={() => handleMoveToInventory(item)}
                              disabled={movingId === item.id}
                              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            >
                              {movingId === item.id ? <div className="w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /> : <ArrowRightLeft className="w-3 h-3" />}
                              Move
                            </button>
                          )}
                          {item.status === 'completed' && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          )}
                          {item.status === 'moved' && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" /> Moved
                            </span>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <MoveStockDialog
        isOpen={moveDialogOpen}
        onClose={() => { setMoveDialogOpen(false); setMoveTarget(null); }}
        onConfirm={confirmMoveToInventory}
        itemName={moveTarget?.ingredient_name || ''}
        remainingQuantity={parseFloat(String(moveTarget?.remaining_quantity || 0))}
        unit={moveTarget?.unit || ''}
      />
    </div>
  );
}
