import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Eye, FileText, AlertCircle, Package, CheckCircle, Clock } from 'lucide-react';
import { getUserItems, updateItem, deleteItem } from '../firebase/firestoreService';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import { CATEGORIES, LOCATIONS, ITEM_STATUSES } from '../utils/constants';
import { validateItemForm } from '../utils/validators';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'lost', label: 'Lost' },
  { key: 'found', label: 'Found' },
  { key: 'active', label: 'Active' },
  { key: 'claimed', label: 'Claimed' },
  { key: 'returned', label: 'Returned' },
];

const STATUS_OPTIONS = ['active', 'claimed', 'returned'];

const MyReports = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getUserItems(currentUser.uid);
      setItems(data);
    } catch {
      toast.error('Failed to load your reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [currentUser]);

  const filtered = items.filter(item => {
    if (tab === 'all') return true;
    if (tab === 'lost' || tab === 'found') return item.type === tab;
    return item.status === tab;
  });

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteItem(deleteTarget.id);
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
      toast.success('Report deleted.');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete report.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setEditForm({
      title: item.title, category: item.category, description: item.description,
      location: item.location, date: item.date, brand: item.brand || '',
      color: item.color || '', additionalInfo: item.additionalInfo || '',
      status: item.status,
    });
    setEditErrors({});
  };

  const handleEditSave = async () => {
    const errors = validateItemForm(editForm);
    if (Object.keys(errors).length > 0) { setEditErrors(errors); return; }
    setEditLoading(true);
    try {
      await updateItem(editItem.id, editForm);
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...editForm } : i));
      toast.success('Report updated!');
      setEditItem(null);
    } catch {
      toast.error('Failed to update report.');
    } finally {
      setEditLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) return <LoadingSpinner fullPage text="Loading your reports..." />;

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">My Reports</h1>
          <p className="page-subtitle">{items.length} total report{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/report/lost" className="btn-danger text-sm">Report Lost</Link>
          <Link to="/report/found" className="btn-primary text-sm" style={{ background: '#16a34a' }}>Report Found</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-gray-400">
              ({items.filter(i => {
                if (t.key === 'all') return true;
                if (t.key === 'lost' || t.key === 'found') return i.type === t.key;
                return i.status === t.key;
              }).length})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports here"
          description="You haven't submitted any reports in this category yet."
          action={<Link to="/report/lost" className="btn-primary text-sm">Report an Item</Link>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Item</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Location</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400 m-auto mt-2.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                          <p className="text-xs text-gray-400">{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell"><StatusBadge status={item.type} /></td>
                    <td className="table-cell"><StatusBadge status={item.status} /></td>
                    <td className="table-cell text-xs">{item.location}</td>
                    <td className="table-cell text-xs">{formatDate(item.date)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/item/${item.id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {item.status === 'active' && (
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Report"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Report" size="lg">
        {editItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Item Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className={`input-field ${editErrors.title ? 'input-error' : ''}`}
                />
                {editErrors.title && <p className="form-error">{editErrors.title}</p>}
              </div>
              <div>
                <label className="form-label">Category <span className="text-red-500">*</span></label>
                <select
                  value={editForm.category}
                  onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                  className={`input-field ${editErrors.category ? 'input-error' : ''}`}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Description <span className="text-red-500">*</span></label>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                className={`input-field resize-none ${editErrors.description ? 'input-error' : ''}`}
              />
              {editErrors.description && <p className="form-error">{editErrors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Location <span className="text-red-500">*</span></label>
                <select
                  value={editForm.location}
                  onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                  className={`input-field ${editErrors.location ? 'input-error' : ''}`}
                >
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Date <span className="text-red-500">*</span></label>
                <input
                  type="date" max={today}
                  value={editForm.date}
                  onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                  className={`input-field ${editErrors.date ? 'input-error' : ''}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Brand</label>
                <input type="text" value={editForm.brand} onChange={e => setEditForm(f => ({ ...f, brand: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="form-label">Color</label>
                <input type="text" value={editForm.color} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="input-field">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditItem(null)} className="btn-secondary" disabled={editLoading}>Cancel</button>
              <button onClick={handleEditSave} className="btn-primary" disabled={editLoading}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyReports;
