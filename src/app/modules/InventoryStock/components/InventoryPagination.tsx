// import { ChevronLeft, ChevronRight } from 'lucide-react';

// interface InventoryPaginationProps {
//   currentPage: number;
//   totalPages: number;
//   itemsPerPage: number;
//   onPageChange: (page: number) => void;
//   onItemsPerPageChange: (itemsPerPage: number) => void;
// }

// export function InventoryPagination({
//   currentPage,
//   totalPages,
//   itemsPerPage,
//   onPageChange,
//   onItemsPerPageChange
// }: InventoryPaginationProps) {
//   return (
//     <div className="bg-white rounded-lg shadow-md mt-4 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
//       <div className="flex items-center gap-3">
//         <button
//           onClick={() => onPageChange(currentPage - 1)}
//           disabled={currentPage === 1}
//           className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
//         >
//           <ChevronLeft className="size-5 text-gray-300" />
//           Previous
//         </button>
//         <span className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md">
//           Page {currentPage} of {totalPages}
//         </span>
//         <button
//           onClick={() => onPageChange(currentPage + 1)}
//           disabled={currentPage === totalPages}
//           className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
//         >
//           Next
//           <ChevronRight className="size-5 text-gray-300" />
//         </button>
//       </div>
//       <div className="flex items-center gap-2">
//         <label className="text-gray-700 font-medium">Items per page:</label>
//         <select
//           value={itemsPerPage}
//           onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
//           className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//         >
//           <option value={10}>10</option>
//           <option value={20}>20</option>
//           <option value={50}>50</option>
//           <option value={100}>100</option>
//         </select>
//       </div>
//     </div>
//   );
// }