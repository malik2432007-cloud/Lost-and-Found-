import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2, Eye, Package, X, MapPin, Calendar, Tag } from 'lucide-react';
import { getAllItems, deleteItem } from '../../firebase/firestoreService';
import { deleteItemImage } from '../../firebase/storageService';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import ItemImage from '../../components/ItemImage';
import { formatDate } from '../../utils/formatters';
import { CATEGORIES } from '../../utils/constants';
import toast from 'react-hot-toast';

const AdminItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');     // 'lost' | 'found' | ''
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'active' | 'claimed' | 'returned' | ''

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllItems();
      setItems(data || []);
    } catch {
      toast.error('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side filtering
  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.title?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.brand?.toLowerCase().includes(q);

    const matchesType = !typeFilter || item.type === typeFilter;
    const matchesCat = !catFilter || item.category === catFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;

    return matchesSearch && matchesType && matchesCat && matchesStatus;
  });

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setCatFilter('');
    setStatusFilter('');
  };

  const hasFilters = Boolean(search || typeFilter || catFilter || statusFilter);

  // ── Delete Report ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      // 1. Delete Firestore report document
      await deleteItem(deleteTarget.id);

      // 2. Clean up corresponding Firebase Storage image if it is stored in cloud
      if (deleteTarget.imageUrl) {
        await deleteItemImage(deleteTarget.imageUrl);
      }

      // 3. Update state immediately to reflect deletion
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.title}" has been permanently deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete report. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Loading reports..." />;

  return (
    <div>
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Manage Items</h1>
          <p className="page-subtitle">
            {items.length} total report{items.length !== 1 ? 's' : ''} across campus
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search title, location, desc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          {/* Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Types (Lost & Found)</option>
            <option value="lost">Lost Reports</option>
            <option value="found">Found Reports</option>
          </select>

          {/* Category */}
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="claimed">Claimed</option>
            <option value="returned">Returned</option>
          </select>
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">
              Showing {filtered.length} matching report{filtered.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No reports match your filters"
          description={
            hasFilters
              ? 'Try adjusting your search criteria or clearing active filters.'
              : 'There are currently no reports in the system.'
          }
          action={
            hasFilters && (
              <button onClick={clearFilters} className="btn-secondary text-sm">
                Clear All Filters
              </button>
            )
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Report</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Location</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    {/* Item Image + Details */}
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <ItemImage
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-12 h-12 rounded-lg border border-gray-100 flex-shrink-0"
                        />
                        <div className="min-w-0 max-w-[200px]">
                          <p className="font-medium text-gray-900 text-sm truncate">{item.title}</p>
                          <p className="text-xs text-gray-400 truncate">
                            Owner: {item.userId ? `${item.userId.slice(0, 8)}...` : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="table-cell">
                      <StatusBadge status={item.type} />
                    </td>

                    {/* Status Badge */}
                    <td className="table-cell">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Category */}
                    <td className="table-cell text-xs text-gray-600 font-medium">
                      {item.category}
                    </td>

                    {/* Location */}
                    <td className="table-cell text-xs text-gray-600 max-w-[140px] truncate">
                      {item.location && item.location !== 'Not specified' ? item.location : 'Location not provided'}
                    </td>

                    {/* Date */}
                    <td className="table-cell text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(item.date || item.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/item/${item.id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Report"
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

          <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-500 bg-gray-50/50">
            Showing {filtered.length} of {items.length} total reports
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Report"
        message={
          deleteTarget
            ? `Permanently delete "${deleteTarget.title}" (${deleteTarget.type?.toUpperCase()} report in ${
                deleteTarget.category
              })? ${
                deleteTarget.imageUrl
                  ? 'Its associated uploaded photo will also be safely removed.'
                  : ''
              } This operation cannot be undone.`
            : ''
        }
        confirmLabel="Delete Permanently"
        confirmClassName="btn-danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default AdminItems;
