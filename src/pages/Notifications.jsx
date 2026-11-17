import { Bell, CheckCheck, Trash2 } from 'lucide-react';
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

const Notifications = () => {
  const { notifications, loading, markRead, markAllRead } = useNotifications();
  const unread = notifications.filter(n => !n.read);

  if (loading) return <LoadingSpinner fullPage text="Loading notifications..." />;

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread.length} unread notifications</p>
        </div>
        {unread.length > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm">
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="You'll receive notifications when someone claims your item or when your claim is reviewed." />
      ) : (
        <div className="card overflow-hidden">
          {notifications.map((notif, i) => (
            <div
              key={notif.id}
              onClick={() => markRead(notif.id)}
              className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                i < notifications.length - 1 ? 'border-b border-gray-100' : ''
              } ${!notif.read ? 'bg-blue-50/30' : ''}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {!notif.read && <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${TYPE_COLORS[notif.type] || TYPE_COLORS.info}`}>
                    {(notif.type || 'INFO').toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">{formatRelativeTime(notif.createdAt)}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
