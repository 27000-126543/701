import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { getMembershipLevel, generateId, calculateStreak } from '../utils/calculations';
import { mockUser } from '../utils/mockData';

interface UserStore {
  user: User | null;
  initUser: () => void;
  updateUser: (data: Partial<User>) => void;
  calculateMembershipLevel: () => void;
  checkStreakContinuity: (sessions: any[]) => void;
  addMeditationMinutes: (minutes: number) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,

      initUser: () => {
        const { user } = get();
        if (!user) {
          set({ user: { ...mockUser, id: generateId() } });
        }
      },

      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null
        }));
      },

      calculateMembershipLevel: () => {
        const { user } = get();
        if (user) {
          const level = getMembershipLevel(user.totalMeditationMinutes);
          set((state) => ({
            user: state.user 
              ? { ...state.user, membershipLevel: level.level as any } 
              : null
          }));
        }
      },

      checkStreakContinuity: (sessions) => {
        const { user } = get();
        if (user && sessions.length > 0) {
          const { current, longest } = calculateStreak(sessions);
          set((state) => ({
            user: state.user 
              ? { 
                  ...state.user, 
                  currentStreak: current, 
                  longestStreak: Math.max(state.user.longestStreak, longest) 
                } 
              : null
          }));
        }
      },

      addMeditationMinutes: (minutes) => {
        const { user } = get();
        if (user) {
          const newTotal = user.totalMeditationMinutes + minutes;
          const level = getMembershipLevel(newTotal);
          const today = new Date().toISOString().split('T')[0];
          
          set((state) => ({
            user: state.user 
              ? { 
                  ...state.user, 
                  totalMeditationMinutes: newTotal,
                  membershipLevel: level.level as any,
                  lastMeditationDate: today
                } 
              : null
          }));
        }
      }
    }),
    {
      name: 'user-storage'
    }
  )
);
