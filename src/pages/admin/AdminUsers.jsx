import { useState, useEffect } from 'react';
import { Shield, User, Trash2, Search } from 'lucide-react';
import { getAllUsers, setUserRole } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleTarget, setRoleTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch {
        toast.error('Failed to load users.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleToggle = async () => {
    if (!roleTarget) return;
    setActionLoading(true);
    const newRole = roleTarget.role === 'admin' ? 'user' : 'admin';
    try {
      await setUserRole(roleTarget.id, newRole);
      setUsers(prev => prev.map(u => u.id === roleTarget.id ? { ...u, role: newRole } : u));
      toast.success(`User role updated to ${newRole}.`);
      setRoleTarget(null);
    } catch {
      toast.error('Failed to update role.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Loading users..." />;

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">{users.length} registered users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={User} title="No users found" description="Try adjusting your search." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">User</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Joined</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-blue-600">
                            {u.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span className="font-medium text-sm text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-xs">{u.email}</td>
                    <td className="table-cell text-xs">{u.phone || '—'}</td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role === 'admin' && <Shield className="w-3 h-3" />}
                        {u.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="table-cell text-xs">{formatDate(u.createdAt)}</td>
                    <td className="table-cell">
                      {u.id !== currentUser?.uid ? (
                        <button
                          onClick={() => setRoleTarget(u)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                        >
                          {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">You</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        onConfirm={handleRoleToggle}
        title={roleTarget?.role === 'admin' ? 'Remove Admin Role' : 'Grant Admin Role'}
        message={`Are you sure you want to ${roleTarget?.role === 'admin' ? 'remove admin privileges from' : 'grant admin privileges to'} ${roleTarget?.name}?`}
        confirmLabel={roleTarget?.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
        confirmClassName={roleTarget?.role === 'admin' ? 'btn-danger' : 'btn-primary'}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminUsers;
