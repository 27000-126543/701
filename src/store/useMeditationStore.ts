import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MeditationSession, MeditationPlan, AudioConfig } from '../types';
import { generateId, calculateRecommendedMinutes, calculateCompletionRate } from '../utils/calculations';
import { validateDuration, validateMoodLevel } from '../utils/validators';
import { mockPlan, generateMockSessions } from '../utils/mockData';

interface MeditationStore {
  sessions: MeditationSession[];
  plans: MeditationPlan[];
  currentSession: MeditationSession | null;
  initData: () => void;
  startSession: (duration: number, audio: AudioConfig) => { success: boolean; message?: string };
  endSession: (moodLevel: number, actualMinutes?: number) => { success: boolean; message?: string; session?: MeditationSession };
  createPlan: (dailyGoal: number) => { success: boolean; message?: string };
  updatePlan: (planId: string, data: Partial<MeditationPlan>) => void;
  calculateRecommendedMinutes: () => number;
  getTodaySessions: () => MeditationSession[];
  getSessionsByDateRange: (startDate: string, endDate: string) => MeditationSession[];
}

export const useMeditationStore = create<MeditationStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      plans: [],
      currentSession: null,

      initData: () => {
        const { sessions, plans } = get();
        if (sessions.length === 0) {
          set({ sessions: generateMockSessions() });
        }
        if (plans.length === 0) {
          set({ plans: [{ ...mockPlan, id: generateId() }] });
        }
      },

      startSession: (duration, audio) => {
        const validation = validateDuration(duration);
        if (!validation.valid) {
          return { success: false, message: validation.message };
        }

        const now = new Date();
        const session: MeditationSession = {
          id: generateId(),
          userId: 'user_001',
          planId: get().plans[0]?.id || generateId(),
          durationMinutes: duration,
          audioType: audio.type,
          audioName: audio.name,
          audioUrl: audio.url,
          sessionDate: now.toISOString().split('T')[0],
          startTime: now.toTimeString().split(' ')[0],
          endTime: '',
          completed: false
        };

        set({ currentSession: session });
        return { success: true };
      },

      endSession: (moodLevel, actualMinutes) => {
        const validation = validateMoodLevel(moodLevel);
        if (!validation.valid) {
          return { success: false, message: validation.message };
        }

        const { currentSession } = get();
        if (!currentSession) {
          return { success: false, message: '没有进行中的冥想' };
        }

        const finalDuration = actualMinutes !== undefined && actualMinutes > 0
          ? Math.round(actualMinutes)
          : currentSession.durationMinutes;

        const now = new Date();
        const completedSession: MeditationSession = {
          ...currentSession,
          durationMinutes: finalDuration,
          endTime: now.toTimeString().split(' ')[0],
          completed: true,
          moodLevel
        };

        set((state) => ({
          sessions: [completedSession, ...state.sessions],
          currentSession: null
        }));

        return { success: true, session: completedSession };
      },

      createPlan: (dailyGoal) => {
        const validation = validateDuration(dailyGoal);
        if (!validation.valid) {
          return { success: false, message: validation.message };
        }

        const plan: MeditationPlan = {
          id: generateId(),
          userId: 'user_001',
          dailyGoalMinutes: dailyGoal,
          startDate: new Date().toISOString().split('T')[0],
          isActive: true,
          completionRate: 0,
          recommendedMinutes: dailyGoal,
          createdAt: new Date().toISOString().split('T')[0]
        };

        set((state) => ({
          plans: state.plans.map(p => ({ ...p, isActive: false })).concat(plan)
        }));

        return { success: true };
      },

      updatePlan: (planId, data) => {
        set((state) => ({
          plans: state.plans.map(p => 
            p.id === planId ? { ...p, ...data } : p
          )
        }));
      },

      calculateRecommendedMinutes: () => {
        const { plans, sessions } = get();
        const activePlan = plans.find(p => p.isActive);
        
        if (!activePlan) {
          return 15;
        }

        const completionRate = calculateCompletionRate(sessions, activePlan.dailyGoalMinutes);
        const userStore = (window as any).__userStore;
        const currentStreak = userStore?.getState?.()?.user?.currentStreak || 0;

        const recommended = calculateRecommendedMinutes(
          activePlan.dailyGoalMinutes,
          completionRate,
          currentStreak
        );

        set((state) => ({
          plans: state.plans.map(p => 
            p.id === activePlan.id 
              ? { ...p, completionRate, recommendedMinutes: recommended } 
              : p
          )
        }));

        return recommended;
      },

      getTodaySessions: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().sessions.filter(s => s.sessionDate === today && s.completed);
      },

      getSessionsByDateRange: (startDate, endDate) => {
        return get().sessions.filter(s => 
          s.sessionDate >= startDate && s.sessionDate <= endDate && s.completed
        );
      }
    }),
    {
      name: 'meditation-storage'
    }
  )
);
