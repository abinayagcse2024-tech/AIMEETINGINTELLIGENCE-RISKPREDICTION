import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.notifications.getAll(false, page, 10);
      if (res.data) {
        setNotifications(res.data);
        setTotalPages(res.total_pages);
        setTotalItems(res.total);
        // Note: this only counts unread on current page. For accurate unread count across all, 
        // we might need a separate endpoint, but for now we just count the paginated ones.
        setUnreadCount(res.data.filter(n => !n.read).length);
      } else {
        setNotifications(res);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, [user, page]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const triggerDemoAlerts = async () => {
    try {
      await api.notifications.triggerDemo();
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to trigger demo notifications', err);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isOpen,
      setIsOpen,
      markAsRead,
      markAllAsRead,
      triggerDemoAlerts,
      page,
      setPage,
      totalPages,
      totalItems
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
