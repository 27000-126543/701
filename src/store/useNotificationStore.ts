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
  cleanUpInvalidBadgeNotifications: (currentStreak: number, totalMinutes: number, sessionsCount: number) => number;
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
      },

      cleanUpInvalidBadgeNotifications: (currentStreak, totalMinutes, sessionsCount) => {
        const { notifications } = get();
        let removedCount = 0;

        const validBadgeTypes: Record<string, boolean> = {
          'first_meditation': sessionsCount >= 1,
          'streak_7': currentStreak >= 7,
          'streak_30': currentStreak >= 30,
          'total_100': totalMinutes >= 100,
          'total_500': totalMinutes >= 500,
          'total_1000': totalMinutes >= 1000
        };

        const badgeKeywords: Record<string, string[]> = {
          'first_meditation': ['初心者', '第一次', '首次'],
          'streak_7': ['坚持不懈', '7天', '连续7', '7 天'],
          'streak_30': ['月度达人', '30天', '连续30', '30 天'],
          'total_100': ['冥想入门', '100分钟', '100 分钟'],
          'total_500': ['冥想达人', '500分钟', '500 分钟'],
          'total_1000': ['冥想大师', '1000分钟', '1000 分钟']
        };

        const filtered = notifications.filter(n => {
          if (n.type !== 'badge') return true;
          
          let matched = false;
          let matchedType = '';
          
          for (const [badgeType, keywords] of Object.entries(badgeKeywords)) {
            if (keywords.some(kw => n.title.includes(kw) || n.message.includes(kw))) {
              matched = true;
              matchedType = badgeType;
              break;
            }
          }

          if (matched && !validBadgeTypes[matchedType]) {
            removedCount++;
            return false;
          }
          
          return true;
        });

        if (removedCount > 0) {
          set({ notifications: filtered });
        }

        return removedCount;
      }
    }),
    {
      name: 'notification-storage'
    }
  )
);
