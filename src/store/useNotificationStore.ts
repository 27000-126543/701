import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification } from '../types';
import { generateId } from '../utils/calculations';
import { mockNotifications } from '../utils/mockData';

interface NotificationStore {
  notifications: Notification[];
  initNotifications: () => void;
  addNotification: (type: Notification['type'], title: string, message: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => number;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],

      initNotifications: () => {
        const { notifications } = get();
        if (notifications.length === 0) {
          set({ notifications: mockNotifications.map(n => ({ ...n, id: generateId() })) });
        }
      },

      addNotification: (type, title, message) => {
        const notification: Notification = {
          id: generateId(),
          userId: 'user_001',
          type,
          title,
          message,
          read: false,
          createdAt: new Date().toISOString()
        };

        set((state) => ({
          notifications: [notification, ...state.notifications]
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          )
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        }));
      },

      getUnreadCount: () => {
        return get().notifications.filter(n => !n.read).length;
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      }
    }),
    {
      name: 'notification-storage'
    }
  )
);
