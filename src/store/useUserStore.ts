import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { getMembershipLevel, generateId, calculateStreak } from '../utils/calculations';
import { mockUser } from '../utils/mockData';

interface MembershipUpgradeResult {
  upgraded: boolean;
  oldLevel: string;
  newLevel: string;
  newLevelName: string;
}

interface UserStore {
  user: User | null;
  initUser: () => void;
  updateUser: (data: Partial<User>) => void;
  calculateMembershipLevel: () => void;
  checkStreakContinuity: (sessions: any[]) => { wasBroken: boolean; newStreak: number };
  addMeditationMinutes: (minutes: number) => MembershipUpgradeResult;
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
        const oldStreak = user?.currentStreak || 0;
        
        if (user && sessions.length > 0) {
          const { current, longest } = calculateStreak(sessions);
          const wasBroken = oldStreak > 0 && current < oldStreak && current === 1;
          
          set((state) => ({
            user: state.user 
              ? { 
                  ...state.user, 
                  currentStreak: current, 
                  longestStreak: Math.max(state.user.longestStreak, longest) 
                } 
              : null
          }));
          
          return { wasBroken, newStreak: current };
        }
        
        return { wasBroken: false, newStreak: 0 };
      },

      addMeditationMinutes: (minutes) => {
        const { user } = get();
        const oldLevel = user?.membershipLevel || '普通用户';
        
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
          
          const upgraded = oldLevel !== level.level && level.level !== '普通用户';
          return {
            upgraded,
            oldLevel,
            newLevel: level.level,
            newLevelName: level.name
          };
        }
        
        return {
          upgraded: false,
          oldLevel: oldLevel,
          newLevel: oldLevel,
          newLevelName: ''
        };
      }
    }),
    {
      name: 'user-storage'
    }
  )
);
