import { useState, useEffect } from 'react';
import { CommonHeader } from '../../components/CommonHeader';
import { adminApi, AdminSettings, CustomCharge } from '../utils/adminApi';
import { Settings, Save, Percent, RefreshCw, Shield, LayoutDashboard, Package, ChefHat, Calculator, Receipt, ShoppingCart, History, UtensilsCrossed, Users, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'admin', label: 'Admin', color: 'from-red-500 to-rose-600' },
  { value: 'manager', label: 'Manager', color: 'from-purple-500 to-indigo-600' },
  { value: 'stock_manager', label: 'Stock Manager', color: 'from-blue-500 to-cyan-600' },
  { value: 'staff', label: 'Staff', color: 'from-green-500 to-emerald-600' },
  { value: 'kitchen_staff', label: 'Kitchen Staff', color: 'from-orange-500 to-amber-600' },
];

const MENUS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'recipes', label: 'Recipes', icon: ChefHat },
  { key: 'calculator', label: 'Calculator', icon: Calculator },
  { key: 'billing', label: 'Billing', icon: Receipt },
  { key: 'purchases', label: 'Purchases', icon: ShoppingCart },
  { key: 'orders', label: 'Order History', icon: History },
  { key: 'kitchen', label: 'Kitchen', icon: UtensilsCrossed },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'admin', label: 'Admin', icon: Settings },
];

const DEFAULT_ACCESS: Record<string, string[]> = {
  admin: ['dashboard', 'inventory', 'recipes', 'calculator', 'billing', 'purchases', 'orders', 'kitchen', 'users', 'admin'],
  manager: ['dashboard', 'inventory', 'recipes', 'calculator', 'billing', 'purchases', 'orders', 'kitchen'],
  stock_manager: ['inventory', 'purchases'],
  staff: ['billing', 'orders', 'kitchen'],
  kitchen_staff: ['recipes', 'calculator', 'kitchen'],
};

const COLORS = ['from-teal-50 to-cyan-50 border-teal-200', 'from-pink-50 to-rose-50 border-pink-200', 'from-violet-50 to-purple-50 border-violet-200', 'from-lime-50 to-green-50 border-lime-200', 'from-sky-50 to-blue-50 border-sky-200'];

export default function Admin() {
  const [settings, setSettings] = useState<AdminSettings>({
    service_charge_enabled: 'true',
    service_charge_percent: '5',
    cgst_percent: '2.5',
    sgst_percent: '2.5',
  });
  const [customCharges, setCustomCharges] = useState<CustomCharge[]>([]);
  const [roleAccess, setRoleAccess] = useState<Record<string, string[]>>(DEFAULT_ACCESS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'billing' | 'access'>('billing');
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [newChargeName, setNewChargeName] = useState('');
  const [newChargePercent, setNewChargePercent] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getSettings();
      const data = (response.data as any)?.data || response.data;
      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
        if (data.role_menu_access) {
          try { setRoleAccess(JSON.parse(data.role_menu_access)); } catch {}
        }
        if (data.custom_charges) {
          try { setCustomCharges(JSON.parse(data.custom_charges)); } catch {}
        }
      }
    } catch { toast.error('Failed to load settings'); }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSaveBilling = async () => {
    setSaving(true);
    try {
      const saveData = { ...settings, custom_charges: JSON.stringify(customCharges) };
      const response = await adminApi.updateSettings(saveData);
      if ((response as any).success !== false) toast.success('Billing settings saved!');
      else toast.error('Failed to save settings');
    } catch { toast.error('Error saving settings'); }
    setSaving(false);
  };

  const handleSaveAccess = async () => {
    setSavingAccess(true);
    try {
      const response = await adminApi.updateSettings({ role_menu_access: JSON.stringify(roleAccess) } as any);
      if ((response as any).success !== false) toast.success('Menu access saved!');
      else toast.error('Failed to save access settings');
    } catch { toast.error('Error saving access settings'); }
    setSavingAccess(false);
  };

  const toggleMenuAccess = (role: string, menu: string) => {
    if (role === 'admin' && (menu === 'users' || menu === 'admin')) return;
    setRoleAccess(prev => {
      const current = prev[role] || [];
      const updated = current.includes(menu) ? current.filter(m => m !== menu) : [...current, menu];
      return { ...prev, [role]: updated };
    });
  };

  const addCustomCharge = () => {
    if (!newChargeName.trim() || !newChargePercent) {
      toast.error('Please enter name and percentage');
      return;
    }
    const newCharge: CustomCharge = {
      id: Date.now().toString(),
      name: newChargeName.trim(),
      percent: parseFloat(newChargePercent),
      enabled: true,
    };
    setCustomCharges(prev => [...prev, newCharge]);
    setNewChargeName('');
    setNewChargePercent('');
    setShowAddCharge(false);
  };

  const toggleCustomCharge = (id: string) => {
    setCustomCharges(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  const updateCustomChargePercent = (id: string, percent: string) => {
    setCustomCharges(prev => prev.map(c => c.id === id ? { ...c, percent: parseFloat(percent) || 0 } : c));
  };

  const removeCustomCharge = (id: string) => {
    setCustomCharges(prev => prev.filter(c => c.id !== id));
  };

  const serviceChargeEnabled = settings.service_charge_enabled === 'true';

  // Preview calculation
  const previewSubtotal = 1000;
  const previewServiceCharge = serviceChargeEnabled ? previewSubtotal * parseFloat(settings.service_charge_percent || '0') / 100 : 0;
  const previewCgst = previewSubtotal * parseFloat(settings.cgst_percent || '0') / 100;
  const previewSgst = previewSubtotal * parseFloat(settings.sgst_percent || '0') / 100;
  const previewCustomTotal = customCharges.filter(c => c.enabled).reduce((sum, c) => sum + previewSubtotal * c.percent / 100, 0);
  const previewTotal = previewSubtotal + previewServiceCharge + previewCgst + previewSgst + previewCustomTotal;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CommonHeader showStats={false} />
        <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 text-gray-400 animate-spin" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CommonHeader showStats={false} />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Settings</h1>
            <p className="text-sm text-gray-500">Configure billing and access control</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('billing')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'billing' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 border-2 border-gray-200'}`}>
            <Percent className="w-4 h-4 inline mr-2" />Billing Charges
          </button>
          <button onClick={() => setActiveTab('access')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'access' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 border-2 border-gray-200'}`}>
            <Shield className="w-4 h-4 inline mr-2" />Menu Access
          </button>
        </div>

        {activeTab === 'billing' && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Percent className="w-5 h-5" /> Billing Charges Configuration</h2>
              <button onClick={() => setShowAddCharge(true)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-all">
                <Plus className="w-4 h-4" /> Add Custom Charge
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Service Charge */}
              <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800 text-base">Service Charge</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Applied to subtotal before taxes</p>
                  </div>
                  <button onClick={() => setSettings(prev => ({ ...prev, service_charge_enabled: prev.service_charge_enabled === 'true' ? 'false' : 'true' }))}
                    className={`relative w-14 h-7 rounded-full transition-colors ${serviceChargeEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${serviceChargeEnabled ? 'left-[30px]' : 'left-0.5'}`} />
                  </button>
                </div>
                {serviceChargeEnabled && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 w-24">Percentage</label>
                    <div className="relative flex-1 max-w-[200px]">
                      <input type="number" step="0.1" min="0" max="100" value={settings.service_charge_percent}
                        onChange={(e) => setSettings(prev => ({ ...prev, service_charge_percent: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-orange-300 rounded-lg focus:outline-none focus:border-orange-500 text-lg font-bold text-center" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                    </div>
                  </div>
                )}
                {!serviceChargeEnabled && <p className="text-sm text-orange-600 font-medium">Service charge is disabled</p>}
              </div>

              {/* CGST */}
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <h3 className="font-bold text-gray-800 text-base mb-1">CGST (Central GST)</h3>
                <p className="text-xs text-gray-500 mb-4">Central Goods and Services Tax</p>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 w-24">Percentage</label>
                  <div className="relative flex-1 max-w-[200px]">
                    <input type="number" step="0.1" min="0" max="100" value={settings.cgst_percent}
                      onChange={(e) => setSettings(prev => ({ ...prev, cgst_percent: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg font-bold text-center" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* SGST */}
              <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <h3 className="font-bold text-gray-800 text-base mb-1">SGST (State GST)</h3>
                <p className="text-xs text-gray-500 mb-4">State Goods and Services Tax</p>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 w-24">Percentage</label>
                  <div className="relative flex-1 max-w-[200px]">
                    <input type="number" step="0.1" min="0" max="100" value={settings.sgst_percent}
                      onChange={(e) => setSettings(prev => ({ ...prev, sgst_percent: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-500 text-lg font-bold text-center" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* Custom Charges */}
              {customCharges.map((charge, idx) => (
                <div key={charge.id} className={`p-5 bg-gradient-to-r ${COLORS[idx % COLORS.length]} rounded-xl border-2`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-800 text-base">{charge.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Custom charge</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleCustomCharge(charge.id)}
                        className={`relative w-14 h-7 rounded-full transition-colors ${charge.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${charge.enabled ? 'left-[30px]' : 'left-0.5'}`} />
                      </button>
                      <button onClick={() => removeCustomCharge(charge.id)} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  {charge.enabled && (
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700 w-24">Percentage</label>
                      <div className="relative flex-1 max-w-[200px]">
                        <input type="number" step="0.1" min="0" max="100" value={charge.percent}
                          onChange={(e) => updateCustomChargePercent(charge.id, e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-lg font-bold text-center" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                      </div>
                    </div>
                  )}
                  {!charge.enabled && <p className="text-sm text-gray-500 font-medium">{charge.name} is disabled</p>}
                </div>
              ))}

              {/* Add Custom Charge Modal */}
              {showAddCharge && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2"><Plus className="w-5 h-5" /> New Custom Charge</h3>
                      <button onClick={() => { setShowAddCharge(false); setNewChargeName(''); setNewChargePercent(''); }}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all"><X className="w-4 h-4 text-white" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Charge Name *</label>
                        <input type="text" value={newChargeName} onChange={(e) => setNewChargeName(e.target.value)}
                          placeholder="e.g., Delivery Charge, Packing Charge"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm" autoFocus />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Percentage *</label>
                        <div className="relative">
                          <input type="number" step="0.1" min="0" max="100" value={newChargePercent} onChange={(e) => setNewChargePercent(e.target.value)}
                            placeholder="0" className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-lg font-bold text-center" />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 px-6 pb-6">
                      <button onClick={() => { setShowAddCharge(false); setNewChargeName(''); setNewChargePercent(''); }}
                        className="flex-1 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium">Cancel</button>
                      <button onClick={addCustomCharge}
                        className="flex-1 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-lg font-bold flex items-center justify-center gap-2 transition-all">
                        <Plus className="w-4 h-4" /> Add Charge
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="p-5 bg-gray-50 rounded-xl border-2 border-gray-200">
                <h3 className="font-bold text-gray-800 text-sm mb-3">Preview (on ₹1000 subtotal)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-bold">₹1,000.00</span></div>
                  {serviceChargeEnabled && (
                    <div className="flex justify-between text-gray-600"><span>Service Charge ({settings.service_charge_percent}%)</span><span className="font-medium">₹{previewServiceCharge.toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between text-gray-600"><span>CGST ({settings.cgst_percent}%)</span><span className="font-medium">₹{previewCgst.toFixed(2)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>SGST ({settings.sgst_percent}%)</span><span className="font-medium">₹{previewSgst.toFixed(2)}</span></div>
                  {customCharges.filter(c => c.enabled).map(c => (
                    <div key={c.id} className="flex justify-between text-gray-600">
                      <span>{c.name} ({c.percent}%)</span>
                      <span className="font-medium">₹{(previewSubtotal * c.percent / 100).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-gray-900 pt-2 border-t-2 border-gray-300 font-bold">
                    <span>Total</span><span>₹{previewTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={handleSaveBilling} disabled={saving}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg font-bold text-base flex items-center justify-center gap-2">
                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? 'Saving...' : 'Save Billing Settings'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Shield className="w-5 h-5" /> Role-Based Menu Access</h2>
              <p className="text-purple-100 text-xs mt-1">Configure which menus each role can access</p>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-sm font-bold text-gray-700 pb-3 pr-4 w-40">Menu</th>
                      {ROLES.map(role => (
                        <th key={role.value} className="text-center pb-3 px-2">
                          <span className={`inline-block px-3 py-1 bg-gradient-to-r ${role.color} text-white text-xs font-bold rounded-full`}>{role.label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MENUS.map(menu => {
                      const Icon = menu.icon;
                      return (
                        <tr key={menu.key} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="py-3 pr-4"><div className="flex items-center gap-2"><Icon className="w-4 h-4 text-gray-500" /><span className="text-sm font-medium text-gray-800">{menu.label}</span></div></td>
                          {ROLES.map(role => {
                            const hasAccess = (roleAccess[role.value] || []).includes(menu.key);
                            const isLocked = role.value === 'admin' && (menu.key === 'users' || menu.key === 'admin');
                            return (
                              <td key={role.value} className="text-center py-3 px-2">
                                <button onClick={() => toggleMenuAccess(role.value, menu.key)} disabled={isLocked}
                                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all mx-auto ${isLocked ? 'border-green-500 bg-green-500 cursor-not-allowed opacity-70' : hasAccess ? 'border-green-500 bg-green-500 hover:bg-green-600 cursor-pointer' : 'border-gray-300 bg-gray-100 hover:border-gray-400 cursor-pointer'}`}>
                                  {(hasAccess || isLocked) && (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-4">🔒 Admin always has access to Users and Admin pages</p>
            </div>
            <div className="px-6 pb-6">
              <button onClick={handleSaveAccess} disabled={savingAccess}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg font-bold text-base flex items-center justify-center gap-2">
                {savingAccess ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                {savingAccess ? 'Saving...' : 'Save Menu Access'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
