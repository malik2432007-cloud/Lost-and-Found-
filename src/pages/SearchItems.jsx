import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, SortDesc, SortAsc } from 'lucide-react';
import { getAllItems } from '../firebase/firestoreService';
import ItemCard from '../components/ItemCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { CATEGORIES, LOCATIONS, ITEM_STATUSES } from '../utils/constants';

const PAGE_SIZE = 12;

const SearchItems = () => {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: '', category: '', location: '', status: '', sort: 'newest' });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAllItems();
        setItems(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const applyFilters = useCallback(() => {
    let result = [...items];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q) ||
        i.brand?.toLowerCase().includes(q)
      );
    }
    if (filters.type) result = result.filter(i => i.type === filters.type);
    if (filters.category) result = result.filter(i => i.category === filters.category);
    if (filters.location) result = result.filter(i => i.location === filters.location);
    if (filters.status) result = result.filter(i => i.status === filters.status);
    if (filters.sort === 'oldest') result.reverse();
    setFiltered(result);
    setPage(1);
  }, [items, search, filters]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const clearFilters = () => {
    setSearch('');
    setFilters({ type: '', category: '', location: '', status: '', sort: 'newest' });
  };

  const hasActiveFilters = search || filters.type || filters.category || filters.location || filters.status;
  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const SelectFilter = ({ id, label, value, options, placeholder }) => (
    <div>
      <label htmlFor={id} className="form-label">{label}</label>
      <select
        id={id}
        value={value}
        onChange={e => setFilters(f => ({ ...f, [id]: e.target.value }))}
        className="input-field text-sm"
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Items</h1>
        <p className="text-gray-500 text-sm mt-1">
          {loading ? 'Loading...' : `${filtered.length} item${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, category, location, brand..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary gap-2 ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}`}
        >
          <Filter className="w-4 h-4" /> Filters
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-500" />}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="btn-secondary text-red-500 border-red-200 hover:bg-red-50">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <SelectFilter id="type" label="Type" value={filters.type} placeholder="All Types"
            options={[{ value: 'lost', label: 'Lost' }, { value: 'found', label: 'Found' }]} />
          <SelectFilter id="category" label="Category" value={filters.category} placeholder="All Categories" options={CATEGORIES} />
          <SelectFilter id="location" label="Location" value={filters.location} placeholder="All Locations" options={LOCATIONS} />
          <SelectFilter id="status" label="Status" value={filters.status} placeholder="All Statuses"
            options={Object.entries(ITEM_STATUSES).map(([k, v]) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))} />
          <div>
            <label className="form-label">Sort By</label>
            <select
              value={filters.sort}
              onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
              className="input-field text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner fullPage text="Loading items..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No items found"
          description="Try adjusting your search or filters."
          action={hasActiveFilters && (
            <button onClick={clearFilters} className="btn-secondary text-sm">
              <X className="w-4 h-4" /> Clear Filters
            </button>
          )}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map(item => <ItemCard key={item.id} item={item} />)}
          </div>
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={() => setPage(p => p + 1)}
                className="btn-secondary px-8"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchItems;
