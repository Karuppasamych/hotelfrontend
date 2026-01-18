// import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
// import { InventoryItem } from '../types';

// interface InventoryTableProps {
//   items: InventoryItem[];
//   onEdit: (item: InventoryItem) => void;
//   onDelete: (id: string) => void;
// }

// export function InventoryTable({ items, onEdit, onDelete }: InventoryTableProps) {
//   const getStockStatus = (current: number, minimum: number) => {
//     if (current === 0) return 'out';
//     if (current <= minimum) return 'low';
//     return 'good';
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'out':
//         return 'bg-red-100 text-red-800';
//       case 'low':
//         return 'bg-yellow-100 text-yellow-800';
//       default:
//         return 'bg-green-100 text-green-800';
//     }
//   };

//   const getStatusLabel = (status: string) => {
//     switch (status) {
//       case 'out':
//         return 'Out of Stock';
//       case 'low':
//         return 'Low Stock';
//       default:
//         return 'In Stock';
//     }
//   };

//   if (items.length === 0) {
//     return (
//       <div className="text-center py-12 text-gray-500">
//         <Package2 className="mx-auto mb-4 size-12 text-gray-400" />
//         <p>No items in inventory. Add your first item to get started.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="overflow-hidden">
//       <table className="w-full table-auto">
//         <thead className="bg-gradient-to-r from-blue-600 to-blue-700 sticky top-0">
//           <tr>
//             <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
//               Product Code
//             </th>
//             <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
//               Item Name
//             </th>
//             <th className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
//               Category
//             </th>
//             <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
//               Available Stock
//             </th>
//             <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
//               Unit
//             </th>
//             <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
//               Price/Unit
//             </th>
//             <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
//               Total Value
//             </th>
//             <th className="px-3 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
//               Min. Stock
//             </th>
//             <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
//               Status
//             </th>
//             <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
//               Actions
//             </th>
//           </tr>
//         </thead>
//         <tbody className="bg-white divide-y divide-gray-200">
//           {items.map((item, index) => {
//             const status = getStockStatus(item.quantity, item.minimumStock);
//             return (
//               <tr key={item.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
//                 <td className="px-4 py-3 whitespace-nowrap text-left">
//                   <span className="font-mono text-sm text-blue-600 font-semibold">{item.productCode}</span>
//                 </td>
//                 <td className="px-4 py-3 whitespace-nowrap text-left">
//                   <div className="flex items-center gap-2">
//                     {status === 'low' || status === 'out' ? (
//                       <AlertTriangle className="size-4 text-yellow-500 flex-shrink-0" />
//                     ) : null}
//                     <span className="text-gray-900 font-medium">{item.name}</span>
//                   </div>
//                 </td>
//                 <td className="px-3 py-3 whitespace-nowrap text-left">
//                   <span className="inline-block px-2.5 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
//                     {item.category}
//                   </span>
//                 </td>
//                 <td className="px-3 py-3 whitespace-nowrap text-center">
//                   <span className="text-gray-900 font-semibold">{item.quantity}</span>
//                 </td>
//                 <td className="px-3 py-3 whitespace-nowrap text-center">
//                   <span className="text-gray-600 text-sm">{item.unit}</span>
//                 </td>
//                 <td className="px-4 py-3 whitespace-nowrap text-right">
//                   <span className="text-gray-900 font-medium">₹{item.price.toFixed(2)}</span>
//                 </td>
//                 <td className="px-4 py-3 whitespace-nowrap text-right">
//                   <span className="text-green-600 font-bold">₹{(item.quantity * item.price).toFixed(2)}</span>
//                 </td>
//                 <td className="px-3 py-3 whitespace-nowrap text-right">
//                   <span className="text-gray-600">{item.minimumStock}</span>
//                 </td>
//                 <td className="px-4 py-3 whitespace-nowrap text-center">
//                   <span
//                     className={`inline-block px-2.5 py-1 text-xs rounded-full font-semibold ${getStatusColor(
//                       status
//                     )}`}
//                   >
//                     {getStatusLabel(status)}
//                   </span>
//                 </td>
//                 <td className="px-4 py-3 whitespace-nowrap text-center">
//                   <div className="flex gap-2 justify-center">
//                     <button
//                       onClick={() => onEdit(item)}
//                       className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
//                       title="Edit"
//                     >
//                       <Pencil className="size-4" />
//                     </button>
//                     <button
//                       onClick={() => onDelete(item.id)}
//                       className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
//                       title="Delete"
//                     >
//                       <Trash2 className="size-4" />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function Package2({ className }: { className?: string }) {
//   return (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       className={className}
//     >
//       <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
//       <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
//       <path d="M12 3v6" />
//     </svg>
//   );
// }