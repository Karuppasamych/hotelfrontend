import { useMemo, useState } from 'react';
import { Dish, Ingredient } from '../modules/RecipeCalculatory/mockData';
import { Package, CheckCircle2, AlertTriangle, XCircle, BarChart3, ShoppingCart } from 'lucide-react';
import { AgGridDataTable } from './AgGridDataTable';
import { purchaseListApi } from '../modules/utils/purchaseListApi';
import { ColDef } from 'ag-grid-community';
import { toast } from 'sonner';

interface InventoryPanelProps {
  selectedDishes: { dish: Dish; servings: number }[];
  inventory: Ingredient[];
}

interface InventoryStatusItem {
  id: string;
  name: string;
  unit: string;
  stock: number;
  required: number;
  status: 'sufficient' | 'low' | 'insufficient';
  shortage: number;
  coveragePercent: number;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ selectedDishes, inventory }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const inventoryStatus = useMemo<InventoryStatusItem[]>(() => {
    const requirements = new Map<string, number>();

    selectedDishes.forEach(({ dish, servings }) => {
      dish.ingredients.forEach((req) => {
        const perServing = req.amount / parseInt(dish.servings || '1');
        const totalRequired = perServing * servings;
        const inventoryItem = inventory.find(inv => String(inv.id) === String(req.ingredientId));

        if (inventoryItem) {
          let convertedRequired = totalRequired;
          const reqUnit = (req.unit || '').toLowerCase();
          const invUnit = inventoryItem.unit.toLowerCase();

          if (reqUnit === 'g' && invUnit === 'kg') convertedRequired = totalRequired / 1000;
          else if (reqUnit === 'kg' && invUnit === 'g') convertedRequired = totalRequired * 1000;
          else if (reqUnit === 'oz' && invUnit === 'g') convertedRequired = totalRequired * 28.3495;
          else if (reqUnit === 'g' && invUnit === 'oz') convertedRequired = totalRequired / 28.3495;
          else if (reqUnit === 'lb' && invUnit === 'kg') convertedRequired = totalRequired * 0.453592;
          else if (reqUnit === 'kg' && invUnit === 'lb') convertedRequired = totalRequired / 0.453592;
          else if (reqUnit === 'ml' && invUnit === 'l') convertedRequired = totalRequired / 1000;
          else if (reqUnit === 'l' && invUnit === 'ml') convertedRequired = totalRequired * 1000;
          else if (reqUnit === 'cup' && invUnit === 'ml') convertedRequired = totalRequired * 236.588;
          else if (reqUnit === 'ml' && invUnit === 'cup') convertedRequired = totalRequired / 236.588;

          const current = requirements.get(String(inventoryItem.id)) || 0;
          requirements.set(String(inventoryItem.id), current + convertedRequired);
        }
      });
    });

    return inventory.map((item) => {
      const required = requirements.get(String(item.id)) || 0;
      const available = parseFloat(String(item.stock));
      const shortage = required - available;

      let status: 'sufficient' | 'low' | 'insufficient' = 'sufficient';
      if (shortage > 0) status = 'insufficient';
      else if (available - required < available * 0.2 && required > 0) status = 'low';

      return {
        id: String(item.id),
        name: item.name,
        unit: item.unit,
        stock: available,
        required,
        status,
        shortage: shortage > 0 ? shortage : 0,
        coveragePercent: required > 0 ? Math.min(100, (available / required) * 100) : 100
      };
    }).filter(item => item.required > 0).sort((a, b) => {
      const priority = { insufficient: 0, low: 1, sufficient: 2 };
      return priority[a.status] - priority[b.status];
    });
  }, [selectedDishes, inventory]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAllShortage = () => {
    const shortageIds = inventoryStatus.filter(i => i.status === 'insufficient').map(i => i.id);
    const allSelected = shortageIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(shortageIds));
    }
  };

  const handleAddToPurchaseList = async () => {
    const items = inventoryStatus.filter(i => selectedIds.has(i.id));
    if (items.length === 0) {
      toast.error('Please select items to add');
      return;
    }
    setAdding(true);
    const today = new Date().toISOString().split('T')[0];
    let success = 0;
    for (const item of items) {
      try {
        await purchaseListApi.create({
          item_name: item.name,
          quantity: item.shortage > 0 ? item.shortage : item.required,
          unit: item.unit,
          date: today,
        });
        success++;
      } catch { /* continue */ }
    }
    if (success > 0) {
      toast.success(`${success} item(s) added to purchase list`);
      setSelectedIds(new Set());
    } else {
      toast.error('Failed to add items');
    }
    setAdding(false);
  };

  const hasShortages = inventoryStatus.some(i => i.status === 'insufficient');
  const selectedCount = Array.from(selectedIds).filter(id => inventoryStatus.find(i => i.id === id)).length;

  const columnDefs: ColDef[] = [
    {
      headerName: '',
      field: 'id',
      width: 40,
      maxWidth: 40,
      lockPosition: true,
      suppressMovable: true,
      sortable: false,
      filter: false,
      cellStyle: { padding: 0 },
      onCellClicked: (params: any) => {
        if (params.data.status !== 'sufficient') toggleSelect(params.data.id);
      },
      cellRenderer: (params: any) => {
        if (params.data.status === 'sufficient') return '';
        const isSelected = selectedIds.has(params.data.id);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', cursor: 'pointer' }}>
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              border: `2px solid ${isSelected ? '#22c55e' : '#d1d5db'}`,
              backgroundColor: isSelected ? '#22c55e' : '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>
        );
      },
    },
    {
      headerName: 'Item',
      field: 'name',
      flex: 2,
      minWidth: 80,
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => (
        <span className="font-semibold text-stone-700 text-xs">{params.value}</span>
      ),
    },
    {
      headerName: 'Req',
      field: 'required',
      flex: 1,
      minWidth: 70,
      sortable: true,
      filter: false,
      cellStyle: { textAlign: 'right' },
      cellRenderer: (params: any) => (
        <span className="font-mono font-bold text-stone-800 text-xs">
          {params.value.toFixed(1)} <span className="text-stone-400 font-normal">{params.data.unit}</span>
        </span>
      ),
    },
    {
      headerName: 'Avail',
      field: 'stock',
      flex: 1,
      minWidth: 70,
      sortable: true,
      filter: false,
      cellStyle: { textAlign: 'right' },
      cellRenderer: (params: any) => (
        <span className="font-mono text-stone-600 text-xs">
          {params.value.toFixed(1)} <span className="text-stone-400">{params.data.unit}</span>
        </span>
      ),
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 90,
      maxWidth: 100,
      sortable: true,
      filter: false,
      cellStyle: { textAlign: 'center' },
      cellRenderer: (params: any) => {
        if (params.value === 'sufficient') {
          return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> OK</span>;
        }
        if (params.value === 'low') {
          return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200"><AlertTriangle className="w-3 h-3" /> Low</span>;
        }
        return (
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200"><XCircle className="w-3 h-3" /> Short</span>
            <span className="text-[9px] text-rose-600 font-bold">-{params.data.shortage.toFixed(1)}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-orange-100 flex justify-between items-center bg-orange-50">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          <h2 className="font-bold text-stone-800 text-sm">Stock Availability</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasShortages && (
            <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> Action Required
            </span>
          )}
          {!hasShortages && inventoryStatus.length > 0 && (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Stock OK
            </span>
          )}
        </div>
      </div>

      {/* Action Bar */}
      {hasShortages && (
        <div className="px-4 py-2 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <button
            onClick={selectAllShortage}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 transition-colors"
          >
            {inventoryStatus.filter(i => i.status === 'insufficient').every(i => selectedIds.has(i.id))
              ? 'Deselect All' : 'Select All Shortage'}
          </button>
          {selectedCount > 0 && (
            <button
              onClick={handleAddToPurchaseList}
              disabled={adding}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
            >
              {adding ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShoppingCart className="w-3 h-3" />
              )}
              Purchase List ({selectedCount})
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {inventoryStatus.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-stone-400 p-8">
            <BarChart3 className="h-12 w-12 text-stone-200 mb-4" />
            <p className="font-medium text-stone-500">No active requirements</p>
            <p className="text-sm mt-1">Add items to the menu to run inventory checks.</p>
          </div>
        ) : (
          <div className="inventory-grid-compact h-full">
            <style>{`
              .inventory-grid-compact .ag-header-cell-text {
                font-size: 10px !important;
                font-weight: 700 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.3px !important;
              }
              .inventory-grid-compact .ag-header-row {
                font-size: 10px !important;
              }
              .inventory-grid-compact .ag-root-wrapper {
                overflow-x: hidden !important;
              }
              .inventory-grid-compact .ag-body-horizontal-scroll {
                display: none !important;
              }
            `}</style>
            <AgGridDataTable
              data={inventoryStatus}
              columnDefs={columnDefs}
              height="100%"
              pagination={true}
              paginationPageSize={5}
              rowHeight={40}
              headerHeight={32}
              emptyMessage="No inventory requirements"
              emptyIcon="📦"
            />
          </div>
        )}
      </div>
    </div>
  );
};
