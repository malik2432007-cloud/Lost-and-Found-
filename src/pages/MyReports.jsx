import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Eye, FileText, AlertCircle, Package, CheckCircle, Clock, Archive, ChevronDown } from 'lucide-react';
import { getUserItems, updateItem, deleteItem } from '../firebase/firestoreService';
import { uploadItemImage } from '../firebase/storageService';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import ImageUpload from '../components/ImageUpload';
import ItemImage from '../components/ItemImage';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import { CATEGORIES } from '../utils/constants';
import { validateItemForm } from '../utils/validators';
import toast from 'react-hot-toast';

// ✅ All available statuses a reporter can set
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', desc: 'Still searching / available' },
  { value: 'claimed', label: 'Claimed', desc: 'Ownership verified' },
  { value: 'returned', label: 'Returned', desc: 'Item returned to owner' },
  { value: 'closed', label: 'Closed', desc: 'Report closed' },
];

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'lost', label: 'Lost' },
  { key: 'found', label: 'Found' },
  { key: 'active', label: 'Active' },
  { key: 'claimed', label: 'Claimed' },
  { key: 'returned', label: 'Returned' },
  { key: 'closed', label: 'Closed' },
];

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
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [statusChanging, setStatusChanging] = useState(null);

  const load = async () => {
    if (!currentUser) return;
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
      toast.success('Report deleted successfully.');
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
      title: item.title || '',
      category: item.category || '',
      description: item.description || '',
      location: item.location || '',
      date: item.date || '',
      brand: item.brand || '',
      color: item.color || '',
      additionalInfo: item.additionalInfo || '',
      status: item.status || 'active',
    });
    setEditImageUrl(item.imageUrl || '');
    setEditImageFile(null);
    setEditErrors({});
  };

  const handleEditSave = async () => {
    const isLocationRequired = false;
    const errors = validateItemForm(editForm, isLocationRequired);
    if (Object.keys(errors).length > 0) { setEditErrors(errors); return; }
    setEditLoading(true);
    try {
      let finalImageUrl = editImageUrl;
      if (editImageFile) {
        finalImageUrl = await uploadItemImage(editImageFile, editItem.id);
      }

      const updateData = {
        ...editForm,
        imageUrl: finalImageUrl || '',
      };

      await updateItem(editItem.id, updateData);
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...updateData } : i));
      toast.success('Report updated successfully!');
      setEditItem(null);
    } catch (err) {
      console.error('Edit save error:', err);
      toast.error('Failed to update report.');
    } finally {
      setEditLoading(false);
    }
  };

  // ✅ FIX: Quick status change from the table without opening the full edit modal
  const handleQuickStatusChange = async (item, newStatus) => {
    if (item.status === newStatus) return;
    setStatusChanging(item.id);
    try {
      await updateItem(item.id, { status: newStatus });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
      toast.success(`Status updated to "${newStatus}"`);
    } catch (err) {
      console.error('Status change error:', err);
      toast.error('Failed to update status.');
    } finally {
      setStatusChanging(null);
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
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 shadow-xs">
                          <ItemImage
                            src={item.imageUrl || item.image}
                            alt={item.title}
                            className="w-full h-full"
                            fit="cover"
                            showSpinner={false}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                          <p className="text-xs text-gray-400">{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell"><StatusBadge status={item.type} /></td>
                    <td className="table-cell">
                      {/* ✅ FIX: Inline status dropdown for quick status changes */}
                      <div className="relative">
                        <select
                          value={item.status}
                          onChange={e => handleQuickStatusChange(item, e.target.value)}
                          disabled={statusChanging === item.id}
                          className="text-xs pl-2 pr-6 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer appearance-none disabled:opacity-50"
                          title="Change status"
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1.5 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                    </td>
                    <td className="table-cell text-xs">{item.location && item.location !== 'Not specified' ? item.location : 'Location not provided'}</td>
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
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
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
                  placeholder="Item name"
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
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {editErrors.category && <p className="form-error">{editErrors.category}</p>}
              </div>
            </div>
            <div>
              <label className="form-label">Description <span className="text-red-500">*</span></label>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                className={`input-field resize-none ${editErrors.description ? 'input-error' : ''}`}
                placeholder="Describe the item..."
              />
              {editErrors.description && <p className="form-error">{editErrors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Location</label>
                <input
                  type="text"
                  placeholder="e.g. College Library, Room 204, Lucknow"
                  value={editForm.location || ''}
                  onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="form-label">Date <span className="text-red-500">*</span></label>
                <input
                  type="date" max={today}
                  value={editForm.date}
                  onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                  className={`input-field ${editErrors.date ? 'input-error' : ''}`}
                />
                {editErrors.date && <p className="form-error">{editErrors.date}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Brand</label>
                <input type="text" value={editForm.brand} onChange={e => setEditForm(f => ({ ...f, brand: e.target.value }))} className="input-field" placeholder="e.g. Samsung" />
              </div>
              <div>
                <label className="form-label">Color</label>
                <input type="text" value={editForm.color} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} className="input-field" placeholder="e.g. Black" />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="input-field">
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Item Photo</label>
              <ImageUpload
                currentUrl={editImageUrl}
                onFileSelect={(file) => {
                  setEditImageFile(file);
                }}
                onClear={() => {
                  setEditImageFile(null);
                  setEditImageUrl('');
                }}
              />
            </div>
            <div>
              <label className="form-label">Additional Details</label>
              <textarea
                rows={2}
                value={editForm.additionalInfo}
                onChange={e => setEditForm(f => ({ ...f, additionalInfo: e.target.value }))}
                className="input-field resize-none"
                placeholder="Any other helpful details..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
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
