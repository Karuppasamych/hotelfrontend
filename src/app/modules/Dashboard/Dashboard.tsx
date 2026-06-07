import { useState, useEffect } from 'react';
import { CommonHeader } from '../../components/CommonHeader';
import { draftApi } from '../utils/draftApi';
import { adminApi } from '../utils/adminApi';
import { LayoutGrid, Users, Clock } from 'lucide-react';

interface OccupiedTable {
  tableNumber: string;
  customerName: string;
  numberOfPersons: string;
  orderCount: number;
  timestamp: string;
}

export default function Dashboard() {
  const [totalTables, setTotalTables] = useState(20);
  const [occupiedTables, setOccupiedTables] = useState<OccupiedTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [draftsRes, settingsRes] = await Promise.all([
        draftApi.getAll(),
        adminApi.getSettings(),
      ]);

      // Get total tables from settings
      const settings = (settingsRes.data as any)?.data || settingsRes.data;
      if (settings?.total_tables) {
        setTotalTables(parseInt(settings.total_tables) || 20);
      }

      // Get occupied tables from saved orders (dine-in with table number)
      const drafts = (draftsRes.data as any)?.data || draftsRes.data;
      const draftsArray = Array.isArray(drafts) ? drafts : [];
      const occupied: OccupiedTable[] = draftsArray
        .filter((d: any) => {
          const type = (d.orderType || d.order_type || '').toLowerCase();
          const table = d.tableNumber || d.table_number || '';
          return type === 'dine-in' && table;
        })
        .map((d: any) => ({
          tableNumber: String(d.tableNumber || d.table_number).trim(),
          customerName: d.customerName || d.customer_name || 'Customer',
          numberOfPersons: d.numberOfPersons || d.number_of_persons || '-',
          orderCount: d.orders?.length || 0,
          timestamp: d.timestamp || d.created_at || '',
        }));
      setOccupiedTables(occupied);
    } catch { /* silent */ }
    setLoading(false);
  };

  // Normalize table numbers for matching (handle "5", "05", "T5", "Table 5", etc.)
  const normalizeTableNum = (val: string) => {
    const trimmed = val.trim();
    const num = parseInt(trimmed, 10);
    if (!isNaN(num)) return String(num);
    // Strip common prefixes like "T", "Table", "table-" etc.
    const extracted = trimmed.replace(/^(table|tbl|t)[-\s]*/i, '');
    const extractedNum = parseInt(extracted, 10);
    return !isNaN(extractedNum) ? String(extractedNum) : trimmed;
  };

  const occupiedTableNumbers = new Set(occupiedTables.map(t => normalizeTableNum(t.tableNumber)));
  const availableCount = totalTables - occupiedTableNumbers.size;

  const getTableInfo = (tableNum: string) => {
    return occupiedTables.find(t => normalizeTableNum(t.tableNumber) === tableNum);
  };

  const getTimeSince = (timestamp: string) => {
    if (!timestamp) return '';
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <CommonHeader showStats={false} />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <CommonHeader showStats={false} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <LayoutGrid className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Tables</p>
              <p className="text-2xl font-bold text-gray-800">{totalTables}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <LayoutGrid className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Available</p>
              <p className="text-2xl font-bold text-green-600">{availableCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Occupied</p>
              <p className="text-2xl font-bold text-red-600">{occupiedTableNumbers.size}</p>
            </div>
          </div>
        </div>

        {/* Table Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-gray-600" />
            Table Layout
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: totalTables }, (_, i) => {
              const tableNum = String(i + 1);
              const isOccupied = occupiedTableNumbers.has(tableNum);
              const info = getTableInfo(tableNum);

              return (
                <div
                  key={tableNum}
                  className={`relative rounded-xl border-2 p-4 transition-all ${
                    isOccupied
                      ? 'border-red-300 bg-red-50 shadow-md'
                      : 'border-green-300 bg-green-50 hover:shadow-md'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm ${
                      isOccupied ? 'bg-red-500' : 'bg-green-500'
                    }`}>
                      {tableNum}
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isOccupied
                        ? 'bg-red-200 text-red-800'
                        : 'bg-green-200 text-green-800'
                    }`}>
                      {isOccupied ? 'Occupied' : 'Available'}
                    </span>
                  </div>
                  {isOccupied && info && (
                    <div className="mt-2 pt-2 border-t border-red-200 text-center">
                      <p className="text-xs font-medium text-gray-700 truncate">{info.customerName}</p>
                      <div className="flex items-center justify-center gap-2 mt-1 text-[10px] text-gray-500">
                        <span className="flex items-center gap-0.5">
                          <Users className="w-3 h-3" /> {info.numberOfPersons}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {getTimeSince(info.timestamp)}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{info.orderCount} item(s)</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
