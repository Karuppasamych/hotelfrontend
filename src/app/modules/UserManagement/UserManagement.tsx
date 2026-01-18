import { CommonHeader } from '../../components/CommonHeader';

export default function UserManagement() {
  return (
    <div className="min-h-screen bg-gray-100">
      <CommonHeader showStats={false} />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">User Management</h2>
          <p className="text-gray-600">Manage staff and user accounts.</p>
        </div>
      </div>
    </div>
  );
}