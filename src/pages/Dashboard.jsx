import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, Search, FileText, TrendingUp,
  AlertCircle, CheckCircle, Package, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserStats, getRecentItems } from '../firebase/firestoreService';
import ItemCard from '../components/ItemCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const Dashboard = () => {
  const { userProfile, currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, items] = await Promise.all([
          getUserStats(currentUser.uid),
          getRecentItems(6),
        ]);
        setStats(s);
        setRecentItems(items);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) load();
  }, [currentUser]);

  const STAT_CARDS = [
    { label: 'Total Reports', value: stats?.total ?? '-', icon: FileText, color: 'bg-blue-100 text-blue-600' },
    { label: 'Lost Reports', value: stats?.lost ?? '-', icon: AlertCircle, color: 'bg-red-100 text-red-600' },
    { label: 'Found Reports', value: stats?.found ?? '-', icon: Package, color: 'bg-green-100 text-green-600' },
    { label: 'Returned Items', value: stats?.returned ?? '-', icon: CheckCircle, color: 'bg-indigo-100 text-indigo-600' },
  ];

  const QUICK_ACTIONS = [
    { to: '/report/lost', label: 'Report Lost Item', icon: AlertCircle, color: 'btn-danger' },
    { to: '/report/found', label: 'Report Found Item', icon: Package, color: 'btn-primary' },
    { to: '/search', label: 'Search Items', icon: Search, color: 'btn-secondary' },
    { to: '/my-reports', label: 'My Reports', icon: FileText, color: 'btn-secondary' },
  ];

  if (loading) return <LoadingSpinner fullPage text="Loading dashboard..." />;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          Welcome back, {userProfile?.name?.split(' ')[0] || 'User'} 👋
        </h1>
        <p className="page-subtitle">Here's a summary of your activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="stat-value">{s.value}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="section-card">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.to} to={a.to} className={`${a.color} text-sm`}>
              <a.icon className="w-4 h-4" />
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Reports</h2>
          <Link to="/search" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View all <TrendingUp className="w-4 h-4" />
          </Link>
        </div>
        {recentItems.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No reports yet"
            description="Be the first to report a lost or found item."
            action={<Link to="/report/lost" className="btn-primary text-sm">Report an Item</Link>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentItems.map(item => <ItemCard key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
