import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Package, AlertCircle, CheckCircle,
  ClipboardList, TrendingUp, ArrowRight
} from 'lucide-react';
import { getStats, getRecentItems } from '../../firebase/firestoreService';
import ItemCard from '../../components/ItemCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, items] = await Promise.all([getStats(), getRecentItems(6)]);
        setStats(s);
        setRecentItems(items);
      } catch {
        toast.error('Failed to load admin stats.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner fullPage text="Loading admin dashboard..." />;

  const STAT_CARDS = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'bg-blue-100 text-blue-600', to: '/admin/users' },
    { label: 'Lost Reports', value: stats?.totalLost ?? 0, icon: AlertCircle, color: 'bg-red-100 text-red-600', to: '/admin/items' },
    { label: 'Found Reports', value: stats?.totalFound ?? 0, icon: Package, color: 'bg-green-100 text-green-600', to: '/admin/items' },
    { label: 'Active Items', value: stats?.activeItems ?? 0, icon: TrendingUp, color: 'bg-yellow-100 text-yellow-600', to: '/admin/items' },
    { label: 'Claimed Items', value: stats?.claimedItems ?? 0, icon: ClipboardList, color: 'bg-purple-100 text-purple-600', to: '/admin/claims' },
    { label: 'Returned Items', value: stats?.returnedItems ?? 0, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600', to: '/admin/items' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Overview</h1>
        <p className="page-subtitle">Platform statistics and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map((s) => (
          <Link key={s.label} to={s.to} className="stat-card hover:shadow-md transition-shadow">
            <div className={`stat-icon ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-value">{s.value}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="section-card">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/admin/users" className="btn-secondary text-sm"><Users className="w-4 h-4" /> Manage Users</Link>
          <Link to="/admin/items" className="btn-secondary text-sm"><Package className="w-4 h-4" /> Manage Items</Link>
          <Link to="/search" className="btn-primary text-sm"><TrendingUp className="w-4 h-4" /> Browse All</Link>
        </div>
      </div>

      {/* Recent Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Reports</h2>
          <Link to="/admin/items" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentItems.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
