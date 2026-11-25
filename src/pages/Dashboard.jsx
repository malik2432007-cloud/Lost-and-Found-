import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, TrendingUp, AlertCircle, Package, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRecentItems } from '../firebase/firestoreService';
import ItemCard from '../components/ItemCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { userProfile, currentUser } = useAuth();
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const latestAllItems = await getRecentItems(6).catch(err => {
        console.error('Error fetching recent items for dashboard:', err);
        return [];
      });
      setRecentItems(latestAllItems);
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const QUICK_ACTIONS = [
    { to: '/report/lost', label: 'Report Lost Item', icon: AlertCircle, color: 'btn-danger', desc: 'Lost something on campus? File a report.' },
    { to: '/report/found', label: 'Report Found Item', icon: Package, color: 'btn-primary', desc: 'Found an item? Help it reach its owner.' },
    { to: '/search', label: 'Browse Items', icon: TrendingUp, color: 'btn-secondary', desc: 'Browse all lost & found items on campus.' },
    { to: '/my-reports', label: 'My Reports', icon: FileText, color: 'btn-secondary', desc: 'Manage your existing reports & statuses.' },
  ];

  if (loading) return <LoadingSpinner fullPage text="Loading dashboard..." />;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title text-2xl font-bold text-gray-900">
          Welcome back, {userProfile?.name?.split(' ')[0] || 'User'} 👋
        </h1>
        <p className="page-subtitle text-sm text-gray-500 mt-1">
          Quickly report items, search campus belongings, or browse recent updates
        </p>
      </div>

      {/* Quick Actions */}
      <div className="section-card">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className={`${a.color} flex-col items-start h-auto py-3 px-4 text-left shadow-sm`}
            >
              <div className="flex items-center gap-2 w-full">
                <a.icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-sm">{a.label}</span>
              </div>
              <p className="text-xs opacity-80 mt-1 font-normal leading-relaxed">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── RECENT CAMPUS REPORTS (Global feed) ─────────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" /> Recent Campus Reports
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Latest lost and found items reported across campus
            </p>
          </div>
          <Link
            to="/search"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
          >
            Browse All Items <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="card p-8 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">No reports submitted yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Be the first to report a lost or found item to help the campus community.
            </p>
            <Link to="/report/lost" className="btn-primary text-xs">
              Report an Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
