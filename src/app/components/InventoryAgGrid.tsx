// import { AgGridReact } from 'ag-grid-react';
// import { ColDef, GridReadyEvent } from 'ag-grid-community';
// import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
// import { InventoryItem } from '../types';
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-alpine.css';

// interface InventoryAgGridProps {
//   items: InventoryItem[];
//   onEdit: (item: InventoryItem) => void;
//   onDelete: (id: string) => void;
// }

// export function InventoryAgGrid({ items, onEdit, onDelete }: InventoryAgGridProps) {
//   const getStockStatus = (current: number, minimum: number) => {
//     if (current === 0) return 'out';
//     if (current <= minimum) return 'low';
//     return 'good';
//   };

//   const StatusCellRenderer = (params: any) => {
//     const status = getStockStatus(params.data.quantity, params.data.minimumStock);
//     const statusConfig = {
//       out: { label: 'Out of Stock', class: 'bg-red-100 text-red-800' },
//       low: { label: 'Low Stock', class: 'bg-yellow-100 text-yellow-800' },
//       good: { label: 'In Stock', class: 'bg-green-100 text-green-800' }
//     };
    
//     return (
//       <span className={`inline-block px-2.5 py-1 text-xs rounded-full font-semibold ${statusConfig[status].class}`}>
//         {statusConfig[status].label}
//       </span>
//     );
//   };

//   const ActionsCellRenderer = (params: any) => {
//     return (
//       <div className="flex gap-2 justify-center h-full items-center">
//         <button
//           onClick={() => onEdit(params.data)}
//           className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
//           title="Edit"
//         >
//           <Pencil className="size-4" />
//         </button>
//         <button
//           onClick={() => onDelete(params.data.id)}
//           className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
//           title="Delete"
//         >
//           <Trash2 className="size-4" />
//         </button>
//       </div>
//     );
//   };

//   const ItemNameCellRenderer = (params: any) => {
//     const status = getStockStatus(params.data.quantity, params.data.minimumStock);
//     return (
//       <div className="flex items-center gap-2">
//         {(status === 'low' || status === 'out') && (
//           <AlertTriangle className="size-4 text-yellow-500 flex-shrink-0" />
//         )}
//         <span className="text-gray-900 font-medium">{params.value}</span>
//       </div>
//     );
//   };

//   const CategoryCellRenderer = (params: any) => {
//     return (
//       <span className="inline-block px-2.5 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
//         {params.value}
//       </span>
//     );
//   };

//   const PriceCellRenderer = (params: any) => {
//     return <span className="text-gray-900 font-medium">₹{params.value.toFixed(2)}</span>;
//   };

//   const TotalValueCellRenderer = (params: any) => {
//     const total = params.data.quantity * params.data.price;
//     return <span className="text-green-600 font-bold">₹{total.toFixed(2)}</span>;
//   };

//   const ProductCodeCellRenderer = (params: any) => {
//     return <span className="font-mono text-sm text-blue-600 font-semibold">{params.value}</span>;
//   };

//   const columnDefs: ColDef[] = [
//     {
//       headerName: 'Product Code',
//       field: 'productCode',
//       width: 140,
//       pinned: 'left',
//       cellRenderer: ProductCodeCellRenderer,
//       sortable: true,
//       filter: true
//     },
//     {
//       headerName: 'Item Name',
//       field: 'name',
//       width: 200,
//       cellRenderer: ItemNameCellRenderer,
//       sortable: true,
//       filter: true
//     },
//     {
//       headerName: 'Category',
//       field: 'category',
//       width: 120,
//       cellRenderer: CategoryCellRenderer,
//       sortable: true,
//       filter: true
//     },
//     {
//       headerName: 'Available Stock',
//       field: 'quantity',
//       width: 140,
//       type: 'numericColumn',
//       cellStyle: { textAlign: 'center' },
//       sortable: true,
//       filter: 'agNumberColumnFilter'
//     },
//     {
//       headerName: 'Unit',
//       field: 'unit',
//       width: 80,
//       cellStyle: { textAlign: 'center' },
//       sortable: true,
//       filter: true
//     },
//     {
//       headerName: 'Price/Unit',
//       field: 'price',
//       width: 120,
//       type: 'numericColumn',
//       cellRenderer: PriceCellRenderer,
//       cellStyle: { textAlign: 'right' },
//       sortable: true,
//       filter: 'agNumberColumnFilter'
//     },
//     {
//       headerName: 'Total Value',
//       width: 130,
//       cellRenderer: TotalValueCellRenderer,
//       cellStyle: { textAlign: 'right' },
//       sortable: true,
//       comparator: (valueA, valueB, nodeA, nodeB) => {
//         const totalA = nodeA.data.quantity * nodeA.data.price;
//         const totalB = nodeB.data.quantity * nodeB.data.price;
//         return totalA - totalB;
//       }
//     },
//     {
//       headerName: 'Min. Stock',
//       field: 'minimumStock',
//       width: 110,
//       type: 'numericColumn',
//       cellStyle: { textAlign: 'right' },
//       sortable: true,
//       filter: 'agNumberColumnFilter'
//     },
//     {
//       headerName: 'Status',
//       width: 130,
//       cellRenderer: StatusCellRenderer,
//       cellStyle: { textAlign: 'center' },
//       sortable: true,
//       comparator: (valueA, valueB, nodeA, nodeB) => {
//         const statusA = getStockStatus(nodeA.data.quantity, nodeA.data.minimumStock);
//         const statusB = getStockStatus(nodeB.data.quantity, nodeB.data.minimumStock);
//         const statusOrder = { out: 0, low: 1, good: 2 };
//         return statusOrder[statusA] - statusOrder[statusB];
//       }
//     },
//     {
//       headerName: 'Actions',
//       width: 120,
//       cellRenderer: ActionsCellRenderer,
//       cellStyle: { textAlign: 'center' },
//       sortable: false,
//       filter: false,
//       pinned: 'right'
//     }
//   ];

//   const defaultColDef = {
//     resizable: true,
//     sortable: true,
//     filter: true,
//     floatingFilter: true
//   };

//   const onGridReady = (params: GridReadyEvent) => {
//     params.api.sizeColumnsToFit();
//   };

//   if (items.length === 0) {
//     return (
//       <div className="text-center py-12 text-gray-500">
//         <div className="mx-auto mb-4 w-12 h-12 text-gray-400">📦</div>
//         <p>No items in inventory. Add your first item to get started.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
//       <AgGridReact
//         rowData={items}
//         columnDefs={columnDefs}
//         defaultColDef={defaultColDef}
//         onGridReady={onGridReady}
//         pagination={true}
//         paginationPageSize={20}
//         rowSelection="multiple"
//         suppressRowClickSelection={true}
//         animateRows={true}
//         rowHeight={50}
//         headerHeight={45}
//         getRowStyle={(params) => {
//           if (params?.node?.rowIndex != null && params.node.rowIndex % 2 === 0) {
//             return { backgroundColor: '#ffffff' };
//           } else {
//             return { backgroundColor: '#f9fafb' };
//           }
//         }}
//       />
//     </div>
//   );
// }