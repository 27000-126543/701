import type { MembershipLevelConfig, MeditationSession, CalendarDay } from '../types';

export function calculateRecommendedMinutes(
  dailyGoal: number,
  completionRate: number,
  currentStreak: number
): number {
  let base = dailyGoal;
  
  if (completionRate >= 0.9) {
    base = Math.floor(dailyGoal * 1.2);
  } else if (completionRate >= 0.7) {
    base = dailyGoal;
  } else if (completionRate >= 0.5) {
    base = Math.floor(dailyGoal * 0.8);
  } else {
    base = Math.floor(dailyGoal * 0.5);
  }
  
  if (currentStreak >= 7) {
    base = Math.floor(base * 1.1);
  }
  
  return Math.max(5, base);
}

export function calculateHotScore(
  likes: number,
  comments: number,
  createdAt: Date
): number {
  const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const gravity = 1.8;
  
  return (likes * 2 + comments * 3) / Math.pow(hoursAgo + 2, gravity);
}

export function getMembershipLevel(totalMinutes: number): MembershipLevelConfig {
  const membershipLevels: MembershipLevelConfig[] = [
    {
      level: '达人',
      name: '达人会员',
      requiredMinutes: 5000,
      benefits: ['全部高级课程免费', '专属勋章标识', '优先推荐社区内容', '一对一冥想指导', '定制化冥想计划'],
      color: '#fbbf24'
    },
    {
      level: '进阶',
      name: '进阶会员',
      requiredMinutes: 1000,
      benefits: ['高级课程免费', '专属勋章', '社区内容推荐', '月度深度报告'],
      color: '#8b5cf6'
    },
    {
      level: '初学',
      name: '初学会员',
      requiredMinutes: 300,
      benefits: ['基础课程免费', '解锁全部勋章', '完整PDF报告导出'],
      color: '#34d399'
    },
    {
      level: '普通用户',
      name: '普通用户',
      requiredMinutes: 0,
      benefits: ['基础冥想功能', '情绪记录', '社区浏览'],
      color: '#64748b'
    }
  ];
  
  for (const level of membershipLevels) {
    if (totalMinutes >= level.requiredMinutes) {
      return level;
    }
  }
  
  return membershipLevels[membershipLevels.length - 1];
}

export function calculateCompletionRate(
  sessions: MeditationSession[],
  dailyGoal: number,
  days: number = 30
): number {
  const today = new Date();
  let completedDays = 0;
  
  for (let i = 0; i < days; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    const daySessions = sessions.filter(s => s.sessionDate === dateStr && s.completed);
    const totalMinutes = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    
    if (totalMinutes >= dailyGoal) {
      completedDays++;
    }
  }
  
  return completedDays / days;
}

export function calculateStreak(sessions: MeditationSession[]): { current: number; longest: number } {
  if (sessions.length === 0) return { current: 0, longest: 0 };
  
  const completedDates = new Set(
    sessions
      .filter(s => s.completed)
      .map(s => s.sessionDate)
  );

  function getDateStr(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  const today = new Date();
  const todayStr = getDateStr(today);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const startDay = completedDates.has(todayStr) ? 0 : 1;
  let countingCurrent = true;

  for (let i = startDay; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = getDateStr(checkDate);
    
    if (completedDates.has(dateStr)) {
      tempStreak++;
      if (countingCurrent) {
        currentStreak = tempStreak;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      if (countingCurrent) {
        countingCurrent = false;
      }
      tempStreak = 0;
    }
  }
  
  return { current: currentStreak, longest: longestStreak };
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}小时${mins}分钟`;
  }
  return `${mins}分钟`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatTime(timeStr: string): string {
  return timeStr.substring(0, 5);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function getMoodEmoji(level: number): string {
  const emojis = ['😢', '😞', '😔', '😐', '🙂', '😊', '😄', '😁', '🤗', '✨'];
  return emojis[Math.max(0, Math.min(9, level - 1))];
}

export function getMoodColor(level: number): string {
  if (level >= 8) return '#34d399';
  if (level >= 6) return '#60a5fa';
  if (level >= 4) return '#fbbf24';
  return '#f87171';
}

export function generateCalendarData(
  sessions: MeditationSession[],
  year: number,
  month: number
): CalendarDay[] {
  const completedSessions = sessions.filter(s => s.completed);
  const sessionMap = new Map<string, { duration: number; mood: number }>();
  
  completedSessions.forEach(session => {
    const existing = sessionMap.get(session.sessionDate);
    const duration = (existing?.duration || 0) + session.durationMinutes;
    const mood = session.moodLevel || existing?.mood || 0;
    sessionMap.set(session.sessionDate, { duration, mood });
  });
  
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  
  const calendarDays: CalendarDay[] = [];
  const today = new Date().toISOString().split('T')[0];
  
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const date = new Date(year, month - 2, day);
    const dateStr = date.toISOString().split('T')[0];
    const sessionData = sessionMap.get(dateStr);
    
    calendarDays.push({
      date: dateStr,
      hasMeditation: !!sessionData,
      durationMinutes: sessionData?.duration || 0,
      moodLevel: sessionData?.mood,
      isToday: dateStr === today,
      inCurrentMonth: false
    });
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = date.toISOString().split('T')[0];
    const sessionData = sessionMap.get(dateStr);
    
    calendarDays.push({
      date: dateStr,
      hasMeditation: !!sessionData,
      durationMinutes: sessionData?.duration || 0,
      moodLevel: sessionData?.mood,
      isToday: dateStr === today,
      inCurrentMonth: true
    });
  }
  
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    const sessionData = sessionMap.get(dateStr);
    
    calendarDays.push({
      date: dateStr,
      hasMeditation: !!sessionData,
      durationMinutes: sessionData?.duration || 0,
      moodLevel: sessionData?.mood,
      isToday: dateStr === today,
      inCurrentMonth: false
    });
  }
  
  return calendarDays;
}
