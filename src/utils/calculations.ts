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

function getIntensity(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 60) return 3;
  return 4;
}

export interface HabitInsights {
  timeSlotDistribution: { slot: string; count: number; label: string }[];
  mostFrequentSlot: string;
  avgMoodChange: number;
  mostInterruptedWeekday: { day: string; count: number } | null;
  weekdayBreakdown: { day: string; count: number; totalMinutes: number }[];
}

export function getHabitInsights(sessions: MeditationSession[], days: number = 30): HabitInsights {
  const today = new Date();
  const cutoff = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  
  const recentSessions = sessions.filter(s => s.completed && s.sessionDate >= cutoffStr);
  
  const timeSlots = [
    { key: 'early', start: 5, end: 8, label: '清晨 (5-8)' },
    { key: 'morning', start: 8, end: 12, label: '上午 (8-12)' },
    { key: 'afternoon', start: 12, end: 18, label: '下午 (12-18)' },
    { key: 'evening', start: 18, end: 22, label: '晚间 (18-22)' },
    { key: 'night', start: 22, end: 26, label: '深夜 (22-2)' }
  ];

  const slotCounts: Record<string, number> = {};
  timeSlots.forEach(s => slotCounts[s.key] = 0);

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekdayCounts: Record<string, number> = {};
  const weekdayMinutes: Record<string, number> = {};
  weekdays.forEach(d => {
    weekdayCounts[d] = 0;
    weekdayMinutes[d] = 0;
  });

  const sortedSessions = [...recentSessions].sort((a, b) => 
    new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
  );

  const dailyMoods: Record<string, number[]> = {};
  let firstMood = 0;
  let lastMood = 0;
  let moodCount = 0;

  recentSessions.forEach(session => {
    if (session.startTime) {
      const hour = parseInt(session.startTime.split(':')[0], 10);
      for (const slot of timeSlots) {
        if (hour >= slot.start && hour < slot.end) {
          slotCounts[slot.key]++;
          break;
        }
      }
    }

    const date = new Date(session.sessionDate);
    const weekday = weekdays[date.getDay()];
    weekdayCounts[weekday]++;
    weekdayMinutes[weekday] += session.durationMinutes;

    if (session.moodLevel) {
      if (!dailyMoods[session.sessionDate]) {
        dailyMoods[session.sessionDate] = [];
      }
      dailyMoods[session.sessionDate].push(session.moodLevel);
      moodCount++;
    }
  });

  const moodDates = Object.keys(dailyMoods).sort();
  if (moodDates.length >= 2) {
    firstMood = dailyMoods[moodDates[0]].reduce((a, b) => a + b, 0) / dailyMoods[moodDates[0]].length;
    lastMood = dailyMoods[moodDates[moodDates.length - 1]].reduce((a, b) => a + b, 0) / dailyMoods[moodDates[moodDates.length - 1]].length;
  }

  const timeSlotDistribution = timeSlots.map(s => ({
    slot: s.key,
    count: slotCounts[s.key],
    label: s.label
  }));

  const mostFrequent = timeSlotDistribution.reduce((max, cur) => cur.count > max.count ? cur : max, timeSlotDistribution[0]);

  const checkedInDates = new Set<string>();
  recentSessions.forEach(s => checkedInDates.add(s.sessionDate));

  const weekdayCheckInDays: Record<string, number> = {};
  weekdays.forEach(d => { weekdayCheckInDays[d] = 0; });
  checkedInDates.forEach(dateStr => {
    const d = new Date(dateStr);
    const day = weekdays[d.getDay()];
    weekdayCheckInDays[day]++;
  });

  const allDays = new Set<string>();
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    allDays.add(weekdays[d.getDay()]);
  }

  let mostInterrupted: { day: string; count: number } | null = null;
  weekdays.forEach(day => {
    const expectedWeeks = Math.ceil(days / 7);
    const interrupted = Math.max(0, expectedWeeks - weekdayCheckInDays[day]);
    if (interrupted > 0 && (!mostInterrupted || interrupted > mostInterrupted.count)) {
      mostInterrupted = { day, count: interrupted };
    }
  });

  const weekdayBreakdown = weekdays.map(day => ({
    day,
    count: weekdayCheckInDays[day],
    totalMinutes: weekdayMinutes[day]
  }));

  return {
    timeSlotDistribution,
    mostFrequentSlot: mostFrequent.count > 0 ? mostFrequent.label : '暂无数据',
    avgMoodChange: moodCount >= 2 ? Number((lastMood - firstMood).toFixed(1)) : 0,
    mostInterruptedWeekday: mostInterrupted,
    weekdayBreakdown
  };
}

export function generateCalendarData(
  sessions: MeditationSession[],
  year: number,
  month: number
): CalendarDay[] {
  const completedSessions = sessions.filter(s => s.completed);
  const sessionMap = new Map<string, { duration: number; moods: number[]; sessions: MeditationSession[] }>();
  
  completedSessions.forEach(session => {
    const existing = sessionMap.get(session.sessionDate);
    if (existing) {
      existing.duration += session.durationMinutes;
      if (session.moodLevel) existing.moods.push(session.moodLevel);
      existing.sessions.push(session);
    } else {
      sessionMap.set(session.sessionDate, {
        duration: session.durationMinutes,
        moods: session.moodLevel ? [session.moodLevel] : [],
        sessions: [session]
      });
    }
  });
  
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  
  const calendarDays: CalendarDay[] = [];
  const today = new Date().toISOString().split('T')[0];

  function buildDay(dateStr: string, inCurrentMonth: boolean): CalendarDay {
    const data = sessionMap.get(dateStr);
    const hasMeditation = !!data;
    const durationMinutes = data?.duration || 0;
    const avgMood = data && data.moods.length > 0 
      ? data.moods.reduce((a, b) => a + b, 0) / data.moods.length 
      : undefined;
    
    return {
      date: dateStr,
      hasMeditation,
      durationMinutes,
      sessionCount: data?.sessions.length || 0,
      avgMood,
      sessions: data?.sessions,
      intensity: getIntensity(durationMinutes),
      isToday: dateStr === today,
      inCurrentMonth
    };
  }
  
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const date = new Date(year, month - 2, day);
    const dateStr = date.toISOString().split('T')[0];
    calendarDays.push(buildDay(dateStr, false));
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = date.toISOString().split('T')[0];
    calendarDays.push(buildDay(dateStr, true));
  }
  
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    calendarDays.push(buildDay(dateStr, false));
  }
  
  return calendarDays;
}
