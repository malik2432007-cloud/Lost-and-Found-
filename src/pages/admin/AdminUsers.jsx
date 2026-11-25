import { useState, useEffect } from 'react';
import { Shield, User, Search, Ban, CheckCircle } from 'lucide-react';
import { getAllUsers, setUserRole, blockUser, unblockUser } from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';
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

  // Dialog targets
  const [roleTarget, setRoleTarget] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null); // { user, action: 'block' | 'unblock' }
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    load();
  }, []);

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Role toggle ────────────────────────────────────────────────────────────
  const handleRoleToggle = async () => {
    if (!roleTarget) return;
    setActionLoading(true);
    const newRole = roleTarget.role === 'admin' ? 'user' : 'admin';
    try {
      await setUserRole(roleTarget.id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === roleTarget.id ? { ...u, role: newRole } : u)));
      toast.success(`User role updated to ${newRole}.`);
      setRoleTarget(null);
    } catch {
      toast.error('Failed to update role.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Block / Unblock ────────────────────────────────────────────────────────
  const handleBlockAction = async () => {
    if (!blockTarget) return;
    setActionLoading(true);
    const { user, action } = blockTarget;
    try {
      if (action === 'block') {
        await blockUser(user.id);
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, blocked: true } : u)));
        toast.success(`Account for ${user.name || user.email} has been blocked.`);
      } else {
        await unblockUser(user.id);
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, blocked: false } : u)));
        toast.success(`Account for ${user.name || user.email} has been unblocked.`);
      }
      setBlockTarget(null);
    } catch {
      toast.error(`Failed to ${action} user.`);
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
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={User} title="No users found" description="Try adjusting your search query." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">User</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Joined</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => {
                  const isMe = u.id === currentUser?.uid;
                  const isBlocked = u.blocked === true;

                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${isBlocked ? 'bg-red-50/40' : 'hover:bg-gray-50'}`}
                    >
                      {/* Name */}
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isBlocked ? 'bg-red-100' : 'bg-blue-100'
                            }`}
                          >
                            <span
                              className={`text-sm font-semibold ${
                                isBlocked ? 'text-red-600' : 'text-blue-600'
                              }`}
                            >
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-sm text-gray-900">{u.name || 'Anonymous User'}</span>
                            {isMe && (
                              <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="table-cell text-xs text-gray-600">{u.email}</td>

                      {/* Role */}
                      <td className="table-cell">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === 'admin'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {u.role === 'admin' && <Shield className="w-3 h-3" />}
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="table-cell">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isBlocked
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {isBlocked ? (
                            <>
                              <Ban className="w-3 h-3" /> Blocked
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" /> Active
                            </>
                          )}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="table-cell text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="table-cell">
                        {isMe ? (
                          <span className="text-xs text-gray-400 italic">Current Admin</span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Role Toggle */}
                            <button
                              onClick={() => setRoleTarget(u)}
                              disabled={isBlocked}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title={isBlocked ? 'Cannot change role of blocked user' : ''}
                            >
                              {u.role === 'admin' ? 'Demote to User' : 'Make Admin'}
                            </button>

                            {/* Block / Unblock */}
                            {isBlocked ? (
                              <button
                                onClick={() => setBlockTarget({ user: u, action: 'unblock' })}
                                className="text-xs px-2.5 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 font-medium transition-colors"
                              >
                                Unblock
                              </button>
                            ) : (
                              <button
                                onClick={() => setBlockTarget({ user: u, action: 'block' })}
                                className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-medium transition-colors"
                              >
                                Block
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        onConfirm={handleRoleToggle}
        title={roleTarget?.role === 'admin' ? 'Remove Admin Role' : 'Grant Admin Role'}
        message={`Are you sure you want to ${
          roleTarget?.role === 'admin' ? 'remove admin privileges from' : 'grant admin privileges to'
        } ${roleTarget?.name || roleTarget?.email}?`}
        confirmLabel={roleTarget?.role === 'admin' ? 'Demote to User' : 'Make Admin'}
        confirmClassName={roleTarget?.role === 'admin' ? 'btn-danger' : 'btn-primary'}
        loading={actionLoading}
      />

      {/* Block / Unblock Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!blockTarget}
        onClose={() => setBlockTarget(null)}
        onConfirm={handleBlockAction}
        title={
          blockTarget?.action === 'block'
            ? `Block User: ${blockTarget?.user?.name || blockTarget?.user?.email}?`
            : `Unblock User: ${blockTarget?.user?.name || blockTarget?.user?.email}?`
        }
        message={
          blockTarget?.action === 'block'
            ? `Blocking this user will immediately sign them out and prevent them from accessing protected functionality. All their existing reports and claims are safely preserved in the database. You can unblock this account at any time.`
            : `Unblocking this user will restore their access to the platform without requiring them to recreate their account.`
        }
        confirmLabel={blockTarget?.action === 'block' ? 'Block Account' : 'Unblock Account'}
        confirmClassName={blockTarget?.action === 'block' ? 'btn-danger' : 'btn-primary'}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminUsers;
