import { ColDef } from 'ag-grid-community';
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '../types';

export const createInventoryColumnDefs = (
  onEdit: (item: InventoryItem) => void,
  onDelete: (id: string) => void
): ColDef[] => {
  
  const getStockStatus = (current: number | string, minimum: number | string) => {
    const currentNum = typeof current === 'string' ? parseFloat(current) : current;
    const minimumNum = typeof minimum === 'string' ? parseFloat(minimum) : minimum;
    if (currentNum === 0) return 'out';
    if (currentNum <= minimumNum) return 'low';
    return 'good';
  };

  const StatusCellRenderer = (params: any) => {
    const status = getStockStatus(params.data.quantity_available, params.data.minimum_stock);
    const statusConfig = {
      out: { label: 'Out of Stock', class: 'bg-red-100 text-red-800' },
      low: { label: 'Low Stock', class: 'bg-yellow-100 text-yellow-800' },
      good: { label: 'In Stock', class: 'bg-green-100 text-green-800' }
    };
    
    return (
      <span className={`inline-block px-2.5 py-1 text-xs rounded-full font-semibold ${statusConfig[status].class}`}>
        {statusConfig[status].label}
      </span>
    );
  };

  const ActionsCellRenderer = (params: any) => {
    return (
      <div className="flex gap-2 justify-center h-full items-center">
        <button
          onClick={() => onEdit(params.data)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
          title="Edit"
        >
          <Pencil className="size-4" />
        </button>
        <button
          onClick={() => onDelete(params.data.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
          title="Delete"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    );
  };

  const ItemNameCellRenderer = (params: any) => {
    const status = getStockStatus(params.data.quantity_available, params.data.minimum_stock);
    return (
      <div className="flex items-center gap-2">
        {(status === 'low' || status === 'out') && (
          <AlertTriangle className="size-4 text-yellow-500 flex-shrink-0" />
        )}
        <span className="text-gray-900 font-medium">{params.value}</span>
      </div>
    );
  };

  const CategoryCellRenderer = (params: any) => {
    return (
      <span className="inline-block px-2.5 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
        {params.value}
      </span>
    );
  };

  const PriceCellRenderer = (params: any) => {
    const price = typeof params.value === 'string' ? parseFloat(params.value) : params.value;
    return <span className="text-gray-900 font-medium">₹{(price || 0).toFixed(2)}</span>;
  };

  const TotalValueCellRenderer = (params: any) => {
    const quantity = typeof params.data.quantity_available === 'string' ? parseFloat(params.data.quantity_available) : params.data.quantity_available;
    const price = typeof params.data.price === 'string' ? parseFloat(params.data.price) : params.data.price;
    const total = (quantity || 0) * (price || 0);
    return <span className="text-green-600 font-bold">₹{total.toFixed(2)}</span>;
  };

  const ProductCodeCellRenderer = (params: any) => {
    return <span className="font-mono text-sm text-blue-600 font-semibold">{params.value}</span>;
  };

  return [
    {
      headerName: 'Product Code',
      field: 'product_code',
      width: 140,
      pinned: 'left',
      cellRenderer: ProductCodeCellRenderer,
      sortable: true,
      filter: true
    },
    {
      headerName: 'Item Name',
      field: 'name',
      width: 200,
      cellRenderer: ItemNameCellRenderer,
      sortable: true,
      filter: true
    },
    {
      headerName: 'Category',
      field: 'category',
      width: 120,
      cellRenderer: CategoryCellRenderer,
      sortable: true,
      filter: true
    },
    {
      headerName: 'Available Stock',
      field: 'quantity_available',
      width: 140,
      type: 'numericColumn',
      cellStyle: { textAlign: 'center' },
      sortable: true,
      filter: 'agNumberColumnFilter'
    },
    {
      headerName: 'Unit',
      field: 'unit',
      width: 80,
      cellStyle: { textAlign: 'center' },
      sortable: true,
      filter: true
    },
    {
      headerName: 'Price/Unit',
      field: 'price',
      width: 120,
      type: 'numericColumn',
      cellRenderer: PriceCellRenderer,
      cellStyle: { textAlign: 'right' },
      sortable: true,
      filter: 'agNumberColumnFilter'
    },
    {
      headerName: 'Total Value',
      width: 130,
      cellRenderer: TotalValueCellRenderer,
      cellStyle: { textAlign: 'right' },
      sortable: true,
      comparator: (valueA, valueB, nodeA, nodeB) => {
        const quantityA = typeof nodeA.data.quantity_available === 'string' ? parseFloat(nodeA.data.quantity_available) : nodeA.data.quantity_available;
        const priceA = typeof nodeA.data.price === 'string' ? parseFloat(nodeA.data.price) : nodeA.data.price;
        const quantityB = typeof nodeB.data.quantity_available === 'string' ? parseFloat(nodeB.data.quantity_available) : nodeB.data.quantity_available;
        const priceB = typeof nodeB.data.price === 'string' ? parseFloat(nodeB.data.price) : nodeB.data.price;
        const totalA = (quantityA || 0) * (priceA || 0);
        const totalB = (quantityB || 0) * (priceB || 0);
        return totalA - totalB;
      }
    },
    {
      headerName: 'Min. Stock',
      field: 'minimum_stock',
      width: 110,
      type: 'numericColumn',
      cellStyle: { textAlign: 'right' },
      sortable: true,
      filter: 'agNumberColumnFilter'
    },
    {
      headerName: 'Status',
      width: 130,
      cellRenderer: StatusCellRenderer,
      cellStyle: { textAlign: 'center' },
      sortable: true,
      comparator: (valueA, valueB, nodeA, nodeB) => {
        const statusA = getStockStatus(nodeA.data.quantity_available, nodeA.data.minimum_stock);
        const statusB = getStockStatus(nodeB.data.quantity_available, nodeB.data.minimum_stock);
        const statusOrder = { out: 0, low: 1, good: 2 };
        return statusOrder[statusA] - statusOrder[statusB];
      }
    },
    {
      headerName: 'Actions',
      width: 120,
      cellRenderer: ActionsCellRenderer,
      cellStyle: { textAlign: 'center' },
      sortable: false,
      filter: false,
      pinned: 'right'
    }
  ];
};