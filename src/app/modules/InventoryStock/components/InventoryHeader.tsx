// import { UtensilsCrossed, CheckCircle, LogOut } from 'lucide-react';
// import backgroundImage from '../../../../assets/pandianHotel.jpeg';

// interface InventoryHeaderProps {
//   successMessage: string | null;
// }

// export function InventoryHeader({ successMessage }: InventoryHeaderProps) {
//   return (
//     <div className="relative overflow-hidden">
//       <div className="absolute inset-0">
//         <img 
//           src={backgroundImage}
//           alt="Traditional Indian biryani platters"
//           className="w-full h-full object-cover"
//         />
//         <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-gray-800/45 to-gray-900/50"></div>
//       </div>

//       <div className="relative max-w-7xl mx-auto p-6">
//         {successMessage && (
//           <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
//             <CheckCircle className="size-5" />
//             <span className="font-medium">{successMessage}</span>
//           </div>
//         )}

//         <div className="mb-8">
//           <div className="flex items-center justify-between mb-2">
//             <div className="flex items-center gap-3">
//               <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
//                 <UtensilsCrossed className="size-8 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-3xl font-bold text-white drop-shadow-lg">Madurai Pandian Hotel</h1>
//                 <p className="text-orange-200 font-medium">Food Inventory Management System</p>
//               </div>
//             </div>
//             <button
//               onClick={() => {
//                 if (confirm('Are you sure you want to log out?')) {
//                   // Add logout logic here
//                 }
//               }}
//               className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-red-500/30 text-sm font-medium"
//             >
//               <LogOut className="size-4" />
//               Log Out
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }