import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, TrendingUp, AlertCircle, Package, ArrowRight,
  Clock, CheckCheck, Archive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserItems, getRecentItems } from '../firebase/firestoreService';
import ItemCard from '../components/ItemCard';
import ItemImage from '../components/ItemImage';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';

const Dashboard = () => {
  const { userProfile, currentUser } = useAuth();
  const [userReports, setUserReports] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Fetch user's personal reports and global recent reports independently
      const [myReports, latestAllItems] = await Promise.all([
        getUserItems(currentUser.uid).catch(err => {
          console.error('Error fetching user items for dashboard:', err);
          return [];
        }),
        getRecentItems(6).catch(err => {
          console.error('Error fetching recent items for dashboard:', err);
          return [];
        }),
      ]);

      setUserReports(myReports);
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

  // Separate active vs previous (claimed, returned, closed) reports
  const currentReports = userReports.filter(r => r.status === 'active');
  const previousReports = userReports.filter(r => r.status !== 'active');

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
          Here is a summary of your activity and recent campus reports
        </p>
      </div>

      {/* ─── SUMMARY SECTION: MY REPORTS ───────────────────────────────── */}
      <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">
              Summary of Your Activity
            </p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-extrabold text-gray-900">{userReports.length}</h2>
              <span className="text-sm font-semibold text-gray-700">My Reports</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Total reports submitted by your account
            </p>
          </div>
        </div>
        <Link
          to="/my-reports"
          className="btn-secondary text-xs flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          View in My Reports <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ─── CURRENT REPORTS (Active reports with thumbnails) ─────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> Current Reports
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Your currently active lost and found reports
            </p>
          </div>
          <Link
            to="/my-reports"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
          >
            Manage in My Reports ({currentReports.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {currentReports.length === 0 ? (
          <div className="card p-6 text-center border-dashed border-gray-200">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">No active reports right now</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              You do not have any active reports. Report an item if you lost or found something.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/report/lost" className="btn-danger text-xs">
                Report Lost Item
              </Link>
              <Link to="/report/found" className="btn-primary text-xs" style={{ background: '#16a34a' }}>
                Report Found Item
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentReports.map(item => (
              <div key={item.id} className="card p-4 flex gap-4 items-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-xs">
                  <ItemImage
                    src={item.imageUrl || item.image}
                    alt={item.title}
                    className="w-full h-full"
                    fit="cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">{item.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{item.category} • {formatDate(item.date)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={item.type} />
                    <StatusBadge status={item.status} />
                  </div>
                </div>
                <Link
                  to={`/item/${item.id}`}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg flex-shrink-0"
                  title="View Details"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── PREVIOUS REPORTS (Claimed, returned, closed reports) ─────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCheck className="w-5 h-5 text-green-600" /> Previous Reports
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Your resolved, claimed, returned, and closed reports
            </p>
          </div>
          <Link
            to="/my-reports"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
          >
            View All ({previousReports.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {previousReports.length === 0 ? (
          <div className="card p-6 text-center border-dashed border-gray-200">
            <Archive className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">No previous resolved reports</p>
            <p className="text-xs text-gray-400 mt-1">
              When an item you reported is claimed, returned, or closed, it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {previousReports.map(item => (
              <div key={item.id} className="card p-4 flex gap-4 items-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-xs">
                  <ItemImage
                    src={item.imageUrl || item.image}
                    alt={item.title}
                    className="w-full h-full"
                    fit="cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">{item.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Reported: {formatDate(item.date)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={item.status} />
                    <span className="text-[11px] text-gray-500 uppercase font-medium">{item.type}</span>
                  </div>
                </div>
                <Link
                  to={`/item/${item.id}`}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg flex-shrink-0"
                  title="View Details"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
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
