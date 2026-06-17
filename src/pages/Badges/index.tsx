import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, Flame, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useMeditationStore } from '../../store/useMeditationStore';
import { useBadgeStore } from '../../store/useBadgeStore';
import { generateCalendarData, getMoodEmoji, getMoodColor } from '../../utils/calculations';
import type { CalendarDay, ToastMessage } from '../../types';

interface BadgesProps {
  addToast: (message: Omit<ToastMessage, 'id'>) => void;
}

export default function Badges({ addToast }: BadgesProps) {
  const user = useUserStore(state => state.user);
  const sessions = useMeditationStore(state => state.sessions);
  const badges = useBadgeStore(state => state.badges);
  const initUser = useUserStore(state => state.initUser);
  const initData = useMeditationStore(state => state.initData);
  const initBadges = useBadgeStore(state => state.initBadges);
  const getUnlockedBadges = useBadgeStore(state => state.getUnlockedBadges);
  const getLockedBadges = useBadgeStore(state => state.getLockedBadges);

  const [currentDate, setCurrentDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  useEffect(() => {
    initUser();
    initData();
    initBadges();
  }, [initUser, initData, initBadges]);

  const calendarData = useMemo(() => {
    return generateCalendarData(sessions, currentDate.year, currentDate.month);
  }, [sessions, currentDate]);

  const unlockedBadges = getUnlockedBadges();
  const lockedBadges = getLockedBadges();

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-display font-bold gradient-text">打卡与勋章</h1>
        <p className="text-white/60 mt-1">记录你的每一次坚持，收集成长的勋章</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="text-3xl mb-2">🔥</div>
          <p className="text-2xl font-bold text-accent-400">{user.currentStreak}</p>
          <p className="text-white/60 text-sm">连续打卡</p>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-2xl font-bold text-primary-400">{user.longestStreak}</p>
          <p className="text-white/60 text-sm">最长连续</p>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl mb-2">🎖️</div>
          <p className="text-2xl font-bold text-purple-400">{unlockedBadges.length}</p>
          <p className="text-white/60 text-sm">已获勋章</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-semibold flex items-center gap-2">
            <Flame size={20} className="text-accent-400" />
            打卡日历
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-medium">
              {currentDate.year}年{currentDate.month}月
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center py-2 text-white/50 text-sm font-medium">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((day, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: day.inCurrentMonth ? 1.1 : 1 }}
              onClick={() => day.inCurrentMonth && setSelectedDay(day)}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center text-sm cursor-pointer
                transition-all relative
                ${!day.inCurrentMonth ? 'opacity-30' : ''}
                ${day.isToday ? 'ring-2 ring-primary-400' : ''}
                ${day.hasMeditation
                  ? 'bg-gradient-to-br from-secondary-500/30 to-secondary-600/30 border border-secondary-400/50'
                  : 'bg-white/5 hover:bg-white/10'
                }
              `}
            >
              <span className={day.isToday ? 'text-primary-400 font-bold' : ''}>
                {new Date(day.date).getDate()}
              </span>
              {day.hasMeditation && day.moodLevel && (
                <span className="text-xs mt-0.5">{getMoodEmoji(day.moodLevel)}</span>
              )}
            </motion.div>
          ))}
        </div>

        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{selectedDay.date}</p>
                {selectedDay.hasMeditation ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-white/70">
                      冥想时长: <span className="text-primary-400">{selectedDay.durationMinutes}分钟</span>
                    </p>
                    {selectedDay.moodLevel && (
                      <p className="text-white/70">
                        情绪: <span style={{ color: getMoodColor(selectedDay.moodLevel) }}>
                          {getMoodEmoji(selectedDay.moodLevel)} {selectedDay.moodLevel}/10
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-white/50 mt-2">当天没有冥想记录</p>
                )}
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h3 className="text-xl font-display font-semibold mb-6 flex items-center gap-2">
          <Award size={20} className="text-accent-400" />
          勋章墙
        </h3>

        {unlockedBadges.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-medium mb-4 text-accent-400">已获得 ({unlockedBadges.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {unlockedBadges.map(badge => (
                <motion.div
                  key={badge.id}
                  whileHover={{ y: -4, scale: 1.05 }}
                  className="bg-gradient-to-br from-accent-400/20 to-accent-500/20 border border-accent-400/30 rounded-xl p-4 text-center"
                >
                  <div className="text-4xl mb-2 badge-glow">{badge.icon}</div>
                  <p className="font-semibold text-sm">{badge.badgeName}</p>
                  <p className="text-white/50 text-xs mt-1">{badge.earnedDate}</p>
                  <p className="text-white/40 text-xs mt-2">{badge.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {lockedBadges.length > 0 && (
          <div>
            <h4 className="text-lg font-medium mb-4 text-white/50">待解锁 ({lockedBadges.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {lockedBadges.map(badge => (
                <div
                  key={badge.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 text-center opacity-60"
                >
                  <div className="text-4xl mb-2 grayscale flex items-center justify-center">
                    <span className="relative">
                      {badge.icon}
                      <Lock size={16} className="absolute -bottom-1 -right-1 text-white/50" />
                    </span>
                  </div>
                  <p className="font-medium text-sm text-white/70">{badge.badgeName}</p>
                  <p className="text-white/40 text-xs mt-2">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
