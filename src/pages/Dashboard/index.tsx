import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Flame, Target, Clock, TrendingUp, Award, Crown, ArrowRight, Heart, MessageCircle, TrendingUp as TrendingUpIcon } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useMeditationStore } from '../../store/useMeditationStore';
import { useBadgeStore } from '../../store/useBadgeStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useCommunityStore } from '../../store/useCommunityStore';
import { formatDuration, getMembershipLevel, calculateStreak } from '../../utils/calculations';
import type { ToastMessage } from '../../types';

interface DashboardProps {
  addToast: (message: Omit<ToastMessage, 'id'>) => void;
}

export default function Dashboard({ addToast }: DashboardProps) {
  const navigate = useNavigate();
  const user = useUserStore(state => state.user);
  const initUser = useUserStore(state => state.initUser);
  const initData = useMeditationStore(state => state.initData);
  const initBadges = useBadgeStore(state => state.initBadges);
  const sessions = useMeditationStore(state => state.sessions);
  const plans = useMeditationStore(state => state.plans);
  const calculateRecommendedMinutes = useMeditationStore(state => state.calculateRecommendedMinutes);
  const getTodaySessions = useMeditationStore(state => state.getTodaySessions);
  const getUnlockedBadges = useBadgeStore(state => state.getUnlockedBadges);
  const validateAndFixBadges = useBadgeStore(state => state.validateAndFixBadges);
  const cleanUpInvalidBadgeNotifications = useNotificationStore(state => state.cleanUpInvalidBadgeNotifications);
  const updateUser = useUserStore(state => state.updateUser);

  const [recommendedMinutes, setRecommendedMinutes] = useState(15);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const posts = useCommunityStore(state => state.posts);
  const initPosts = useCommunityStore(state => state.initPosts);
  const likePost = useCommunityStore(state => state.likePost);
  const getHotPosts = useCommunityStore(state => state.getHotPosts);
  const recalculateHotScores = useCommunityStore(state => state.recalculateHotScores);

  useEffect(() => {
    initUser();
    initData();
    initBadges();
    initPosts();
    recalculateHotScores();
    
    (window as any).__userStore = useUserStore;
  }, [initUser, initData, initBadges, initPosts, recalculateHotScores]);

  const hotPosts = useMemo(() => {
    return getHotPosts().slice(0, 3);
  }, [posts, getHotPosts]);

  useEffect(() => {
    const activePlan = plans.find(p => p.isActive);
    setRecommendedMinutes(activePlan?.recommendedMinutes || 15);
    
    const todaySessions = getTodaySessions();
    const total = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    setTodayMinutes(total);
  }, [sessions, plans, getTodaySessions]);

  useEffect(() => {
    if (plans.length > 0) {
      calculateRecommendedMinutes();
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      const { current: currentStreak, longest: longestStreak } = calculateStreak(sessions);
      const totalMinutes = sessions.filter(s => s.completed).reduce((sum, s) => sum + s.durationMinutes, 0);

      if (user && (user.currentStreak !== currentStreak || user.longestStreak !== longestStreak || user.totalMeditationMinutes !== totalMinutes)) {
        updateUser({
          currentStreak,
          longestStreak: Math.max(user.longestStreak, longestStreak),
          totalMeditationMinutes: totalMinutes
        });
      }

      const revokedBadges = validateAndFixBadges(totalMinutes, currentStreak, sessions.filter(s => s.completed).length);
      const removedNotifications = cleanUpInvalidBadgeNotifications(currentStreak, totalMinutes, sessions.filter(s => s.completed).length);
      
      const messages: string[] = [];
      if (revokedBadges.length > 0) messages.push(`更新勋章：${revokedBadges.join('、')}`);
      if (removedNotifications > 0) messages.push(`清理 ${removedNotifications} 条旧通知`);
      if (messages.length > 0) {
        addToast({ type: 'info', message: messages.join('，') });
      }
    }
  }, [sessions, user, validateAndFixBadges, cleanUpInvalidBadgeNotifications, updateUser, addToast]);

  const activePlan = plans.find(p => p.isActive);
  const membershipLevel = user ? getMembershipLevel(user.totalMeditationMinutes) : null;
  const unlockedBadges = getUnlockedBadges();

  const handleStartMeditation = () => {
    navigate('/meditation', { state: { duration: recommendedMinutes } });
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
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">
            你好，{user.name}
          </h1>
          <p className="text-white/60 mt-1">今天也要好好爱自己 ✨</p>
        </div>
        <div className="flex items-center gap-3">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-12 h-12 rounded-full border-2 border-primary-400/50"
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="今日目标"
          value={`${activePlan?.dailyGoalMinutes || 20}分钟`}
          color="from-primary-500 to-primary-600"
        />
        <StatCard
          icon={Clock}
          label="已完成"
          value={`${todayMinutes}分钟`}
          color="from-secondary-500 to-secondary-600"
          subValue={activePlan ? `${Math.min(100, Math.round((todayMinutes / activePlan.dailyGoalMinutes) * 100))}%` : undefined}
        />
        <StatCard
          icon={Flame}
          label="连续打卡"
          value={`${user.currentStreak}天`}
          color="from-accent-400 to-accent-500"
          subValue={`最长 ${user.longestStreak} 天`}
        />
        <StatCard
          icon={TrendingUp}
          label="累计冥想"
          value={formatDuration(user.totalMeditationMinutes)}
          color="from-purple-500 to-purple-600"
        />
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card glass-card-hover p-8 text-center">
        <div className="mb-6">
          <p className="text-white/60 mb-2">今日推荐冥想时长</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-6xl font-display font-bold gradient-text">
              {recommendedMinutes}
            </span>
            <span className="text-2xl text-white/60">分钟</span>
          </div>
          <p className="text-white/50 text-sm mt-2">
            根据你的历史完成率智能推荐
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartMeditation}
          className="btn-primary inline-flex items-center gap-2 text-lg px-10 py-4 animate-pulse-glow"
        >
          <Play size={24} fill="currentColor" />
          开始冥想
        </motion.button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-semibold flex items-center gap-2">
              <Award size={20} className="text-accent-400" />
              最近成就
            </h3>
            <button
              onClick={() => navigate('/badges')}
              className="text-primary-400 text-sm flex items-center gap-1 hover:text-primary-300"
            >
              查看全部 <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {unlockedBadges.slice(0, 4).map(badge => (
              <div
                key={badge.id}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-400/20 to-accent-500/20 border border-accent-400/30 flex items-center justify-center text-2xl badge-glow"
                title={badge.badgeName}
              >
                {badge.icon}
              </div>
            ))}
            {unlockedBadges.length === 0 && (
              <p className="text-white/50 text-sm">还没有获得勋章，开始冥想吧！</p>
            )}
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-semibold flex items-center gap-2">
              <Crown size={20} className="text-accent-400" />
              会员等级
            </h3>
            <button
              onClick={() => navigate('/membership')}
              className="text-primary-400 text-sm flex items-center gap-1 hover:text-primary-300"
            >
              查看权益 <ArrowRight size={16} />
            </button>
          </div>
          
          {membershipLevel && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: `linear-gradient(135deg, ${membershipLevel.color}40, ${membershipLevel.color}20)` }}
                >
                  👑
                </div>
                <div>
                  <p className="font-semibold" style={{ color: membershipLevel.color }}>
                    {membershipLevel.name}
                  </p>
                  <p className="text-white/50 text-sm">
                    累计 {formatDuration(user.totalMeditationMinutes)}
                  </p>
                </div>
              </div>
              
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (user.totalMeditationMinutes / membershipLevel.requiredMinutes) * 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${membershipLevel.color}, ${membershipLevel.color}80)` }}
                />
              </div>
              <p className="text-white/50 text-xs mt-2 text-right">
                下一等级还需 {formatDuration(Math.max(0, membershipLevel.requiredMinutes - user.totalMeditationMinutes))}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h3 className="text-xl font-display font-semibold mb-4">最近记录</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {sessions.slice(0, 5).map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                  <span className="text-lg">🧘</span>
                </div>
                <div>
                  <p className="font-medium">{session.audioName}</p>
                  <p className="text-white/50 text-sm">{session.sessionDate} · {session.startTime}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary-400">{session.durationMinutes}分钟</p>
                {session.moodLevel && (
                  <p className="text-lg">{getMoodEmoji(session.moodLevel)}</p>
                )}
              </div>
            </motion.div>
          ))}
          {sessions.length === 0 && (
            <p className="text-white/50 text-center py-8">还没有冥想记录</p>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-display font-semibold flex items-center gap-2">
            <TrendingUpIcon size={20} className="text-accent-400" />
            社区热门心得
          </h3>
          <button
            onClick={() => navigate('/community')}
            className="text-primary-400 text-sm flex items-center gap-1 hover:text-primary-300"
          >
            查看更多 <ArrowRight size={16} />
          </button>
        </div>
        
        <div className="space-y-3">
          {hotPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => navigate('/community')}
            >
              <div className="flex items-start gap-3">
                <img
                  src={post.userAvatar}
                  alt={post.userName}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{post.userName}</p>
                    {post.isHot && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-accent-500/20 text-accent-400">
                        🔥 热门
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 text-sm line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        likePost(post.id);
                      }}
                      className={`flex items-center gap-1 text-xs ${post.liked ? 'text-red-400' : 'text-white/50'} hover:text-red-400 transition-colors`}
                    >
                      <Heart size={14} fill={post.liked ? 'currentColor' : 'none'} />
                      <span>{post.likesCount}</span>
                    </button>
                    <span className="flex items-center gap-1 text-xs text-white/50">
                      <MessageCircle size={14} />
                      <span>{post.commentsCount}</span>
                    </span>
                    <span className="text-xs text-white/40 ml-auto">
                      {getTimeAgo(post.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {hotPosts.length === 0 && (
            <p className="text-white/50 text-center py-8">暂无热门心得</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  subValue
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
  subValue?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card p-4"
    >
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-white/60 text-sm mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {subValue && (
        <p className="text-white/50 text-xs mt-1">{subValue}</p>
      )}
    </motion.div>
  );
}

function getMoodEmoji(level: number): string {
  const emojis = ['😢', '😞', '😔', '😐', '🙂', '😊', '😄', '😁', '🤗', '✨'];
  return emojis[Math.max(0, Math.min(9, level - 1))];
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}
