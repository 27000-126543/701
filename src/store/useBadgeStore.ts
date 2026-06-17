import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Badge, Notification } from '../types';
import { generateId } from '../utils/calculations';
import { mockBadges } from '../utils/mockData';

interface BadgeStore {
  badges: Badge[];
  initBadges: () => void;
  checkBadgeUnlock: (totalMinutes: number, currentStreak: number, sessionsCount: number) => Badge[];
  unlockBadge: (badgeType: string, addNotification?: (n: Notification) => void) => Badge | null;
  getUnlockedBadges: () => Badge[];
  getLockedBadges: () => Badge[];
}

export const useBadgeStore = create<BadgeStore>()(
  persist(
    (set, get) => ({
      badges: [],

      initBadges: () => {
        const { badges } = get();
        if (badges.length === 0) {
          set({ badges: mockBadges.map(b => ({ ...b, id: generateId() })) });
        }
      },

      checkBadgeUnlock: (totalMinutes, currentStreak, sessionsCount) => {
        const { badges } = get();
        const newlyUnlocked: Badge[] = [];

        const checkConditions: Record<string, boolean> = {
          'first_meditation': sessionsCount >= 1,
          'streak_7': currentStreak >= 7,
          'streak_30': currentStreak >= 30,
          'total_100': totalMinutes >= 100,
          'total_500': totalMinutes >= 500,
          'total_1000': totalMinutes >= 1000
        };

        badges.forEach(badge => {
          if (!badge.unlocked && checkConditions[badge.badgeType]) {
            newlyUnlocked.push(badge);
          }
        });

        return newlyUnlocked;
      },

      unlockBadge: (badgeType, addNotification) => {
        const { badges } = get();
        const badge = badges.find(b => b.badgeType === badgeType && !b.unlocked);
        
        if (badge) {
          const today = new Date().toISOString().split('T')[0];
          const updatedBadge = { ...badge, unlocked: true, earnedDate: today };
          
          set((state) => ({
            badges: state.badges.map(b => 
              b.id === badge.id ? updatedBadge : b
            )
          }));

          if (addNotification) {
            addNotification({
              id: generateId(),
              userId: 'user_001',
              type: 'badge',
              title: '🎉 获得新勋章',
              message: `恭喜你获得「${badge.badgeName}」勋章！${badge.description}`,
              read: false,
              createdAt: new Date().toISOString()
            });
          }

          return updatedBadge;
        }
        return null;
      },

      getUnlockedBadges: () => {
        return get().badges.filter(b => b.unlocked);
      },

      getLockedBadges: () => {
        return get().badges.filter(b => !b.unlocked);
      }
    }),
    {
      name: 'badge-storage'
    }
  )
);
