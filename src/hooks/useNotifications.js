import { useState, useEffect } from 'react';
import { subscribeToNotifications, markNotificationRead, markAllNotificationsRead } from '../firebase/firestoreService';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToNotifications(currentUser.uid, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = async (id) => {
    await markNotificationRead(id);
  };

  const markAllRead = async () => {
    if (currentUser) await markAllNotificationsRead(currentUser.uid);
  };

  return { notifications, unreadCount, loading, markRead, markAllRead };
};
