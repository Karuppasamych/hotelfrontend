import { useState, useEffect } from 'react';
import { CommonHeader } from '../../components/CommonHeader';
import { userApi, User } from '../utils/userApi';
import { Users, Plus, Edit2, Trash2, X, Eye, EyeOff, Shield, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'manager', label: 'Manager', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'stock_manager', label: 'Stock Manager', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'staff', label: 'Staff', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'kitchen_staff', label: 'Kitchen Staff', color: 'bg-orange-100 text-orange-800 border-orange-200' },
];

const getRoleBadge = (role: string) => {
  const r = ROLES.find(r => r.value === role) || { label: role, color: 'bg-gray-100 text-gray-800 border-gray-200' };
  return <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${r.color}`}>{r.label}</span>;
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('staff');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userApi.getAll();
      const data = (response.data as any)?.data || response.data;
      if (Array.isArray(data)) setUsers(data);
    } catch {
      toast.error('Failed to load users');
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const resetForm = () => {
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('staff');
    setShowPassword(false);
    setEditingUser(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) {
      toast.error('Name and username are required');
      return;
    }
    if (!editingUser && !formPassword.trim()) {
      toast.error('Password is required for new users');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        const updateData: any = { name: formName, role: formRole, is_active: editingUser.is_active };
        if (formPassword.trim()) updateData.password = formPassword;
        const response = await userApi.update(editingUser.id, updateData);
        if ((response as any).success !== false) {
          setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, name: formName, role: formRole } : u));
          toast.success('User updated successfully');
          resetForm();
        } else {
          toast.error('Failed to update user');
        }
      } else {
        const response = await userApi.create({ username: formUsername, password: formPassword, name: formName, role: formRole });
        if ((response as any).success !== false && (response as any).error !== 'Username already exists') {
          const newUser = (response.data as any)?.user;
          if (newUser) {
            setUsers(prev => [{ ...newUser, is_active: true, created_at: new Date().toISOString() }, ...prev]);
          }
          toast.success('User created successfully');
          resetForm();
        } else {
          toast.error((response as any).error || 'Failed to create user');
        }
      }
    } catch {
      toast.error('Error saving user');
    }
    setSaving(false);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPassword('');
    setFormRole(user.role);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await userApi.delete(deleteConfirm.id);
      setUsers(prev => prev.filter(u => u.id !== deleteConfirm.id));
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    }
    setDeleteConfirm(null);
  };

  const handleToggleActive = async (user: User) => {
    try {
      const response = await userApi.update(user.id, { name: user.name, role: user.role, is_active: !user.is_active });
      if ((response as any).success !== false) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
        toast.success(`User ${!user.is_active ? 'activated' : 'deactivated'}`);
      }
    } catch {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CommonHeader showStats={false} />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
              <p className="text-sm text-gray-500">Manage staff accounts and roles</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-bold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>
              <button onClick={resetForm} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username *</label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="Enter username"
                    className={`w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm ${editingUser ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    required
                    readOnly={!!editingUser}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm pr-10"
                      required={!editingUser}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm bg-white cursor-pointer"
                    required
                  >
                    {ROLES.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md font-bold text-sm flex items-center gap-2"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
                <button type="button" onClick={resetForm} className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">All Users ({users.length})</h3>
          </div>
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No users found</p>
              <p className="text-sm">Create your first user above</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map(user => (
                <div key={user.id} className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${!user.is_active ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${user.is_active ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gray-400'}`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                        {!user.is_active && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">INACTIVE</span>}
                      </div>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getRoleBadge(user.role)}
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`p-2 rounded-lg transition-colors ${user.is_active ? 'hover:bg-yellow-50 text-yellow-600' : 'hover:bg-green-50 text-green-600'}`}
                      title={user.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(user)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="p-6 border-b flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Delete User</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-2">Are you sure you want to delete this user?</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-bold text-gray-900">{deleteConfirm.name}</p>
                  <p className="text-sm text-gray-500">@{deleteConfirm.username} • {getRoleBadge(deleteConfirm.role)}</p>
                </div>
                <p className="text-sm text-red-500 mt-3">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 p-6 pt-0">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium">
                  Cancel
                </button>
                <button onClick={handleDelete} className="flex-1 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg font-medium">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
