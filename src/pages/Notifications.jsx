import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { formatRelativeTime } from '../utils/formatters';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

const TYPE_COLORS = {
  claim: 'bg-yellow-100 text-yellow-700',
  status: 'bg-blue-100 text-blue-700',
  match: 'bg-purple-100 text-purple-700',
  info: 'bg-gray-100 text-gray-600',
};

const TYPE_LABELS = {
  claim: 'Claim',
  status: 'Status Update',
  match: 'Match Found',
  info: 'Info',
};

const Notifications = () => {
  const { notifications, loading, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const unread = notifications.filter(n => !n.read);

  const handleNotificationClick = (notif) => {
    if (!notif.read) markRead(notif.id);
    const target = notif.itemId || notif.reportId;
    if (target) {
      navigate(`/item/${target}`);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Loading notifications..." />;

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unread.length > 0
              ? `${unread.length} unread notification${unread.length !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unread.length > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm">
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You'll receive notifications when someone claims your item, when your claim is reviewed, or when item status changes."
        />
      ) : (
        <div className="card overflow-hidden">
          {notifications.map((notif, i) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                i < notifications.length - 1 ? 'border-b border-gray-100' : ''
              } ${!notif.read ? 'bg-blue-50/40' : ''}`}
            >
              {/* Unread dot */}
              <div className="flex-shrink-0 mt-1.5 w-2.5">
                {!notif.read && <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${TYPE_COLORS[notif.type] || TYPE_COLORS.info}`}>
                    {TYPE_LABELS[notif.type] || (notif.type || 'INFO').toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">{formatRelativeTime(notif.createdAt)}</span>
                  {!notif.read && (
                    <span className="text-xs font-medium text-blue-600 ml-auto">New</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>

                {/* ✅ FIX: Link to related item if itemId is available */}
                {notif.itemId && (
                  <Link
                    to={`/item/${notif.itemId}`}
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Item{notif.itemTitle ? `: "${notif.itemTitle}"` : ''}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
