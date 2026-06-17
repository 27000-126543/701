export interface User {
  id: string;
  name: string;
  avatar: string;
  totalMeditationMinutes: number;
  currentStreak: number;
  longestStreak: number;
  membershipLevel: '普通用户' | '初学' | '进阶' | '达人';
  createdAt: string;
  lastMeditationDate?: string;
}

export interface MeditationPlan {
  id: string;
  userId: string;
  dailyGoalMinutes: number;
  startDate: string;
  isActive: boolean;
  completionRate: number;
  recommendedMinutes: number;
  createdAt: string;
}

export type StressSource = '工作' | '学习' | '人际' | '家庭' | '健康' | '其他' | null;
export type PracticeTag = '放松' | '专注' | '助眠' | '减压' | '晨间' | '睡前' | '午休' | '通勤';

export interface MeditationSession {
  id: string;
  userId: string;
  planId: string;
  durationMinutes: number;
  audioType: 'built-in' | 'custom';
  audioName: string;
  audioUrl?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  moodLevel?: number;
  note?: string;
  stressSource?: StressSource;
  tags?: PracticeTag[];
}

export interface Badge {
  id: string;
  userId: string;
  badgeType: 'streak_7' | 'streak_30' | 'total_100' | 'total_500' | 'first_meditation' | 'total_1000';
  badgeName: string;
  description: string;
  icon: string;
  earnedDate?: string;
  unlocked: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  sessionId?: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  hotScore: number;
  liked: boolean;
  createdAt: string;
  comments: Comment[];
  isHot?: boolean;
}

export interface MembershipLevelConfig {
  level: string;
  name: string;
  requiredMinutes: number;
  benefits: string[];
  color: string;
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalMinutes: number;
  totalSessions: number;
  checkInRate: number;
  averageMood: number;
  moodTrend: { date: string; mood: number }[];
  badgesEarned: Badge[];
  dailyBreakdown: { date: string; minutes: number }[];
}

export interface Notification {
  id: string;
  userId: string;
  type: 'badge' | 'membership' | 'encouragement' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AudioConfig {
  type: 'built-in' | 'custom';
  name: string;
  url: string;
}

export interface BuiltInAudio {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
}

export type MoodEmoji = '😢' | '😞' | '😔' | '😐' | '🙂' | '😊' | '😄' | '😁' | '🤗' | '✨';

export interface CalendarDay {
  date: string;
  hasMeditation: boolean;
  durationMinutes: number;
  sessionCount: number;
  avgMood?: number;
  sessions?: MeditationSession[];
  intensity: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  inCurrentMonth: boolean;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}
