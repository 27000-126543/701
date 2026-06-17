import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarRange, Target, TrendingUp, Clock, Plus, Check, Edit2, X } from 'lucide-react';
import { useMeditationStore } from '../../store/useMeditationStore';
import { useUserStore } from '../../store/useUserStore';
import { formatDuration, formatDate, calculateCompletionRate } from '../../utils/calculations';
import { validateDuration } from '../../utils/validators';
import type { ToastMessage } from '../../types';

interface PlanProps {
  addToast: (message: Omit<ToastMessage, 'id'>) => void;
}

export default function Plan({ addToast }: PlanProps) {
  const plans = useMeditationStore(state => state.plans);
  const sessions = useMeditationStore(state => state.sessions);
  const createPlan = useMeditationStore(state => state.createPlan);
  const calculateRecommendedMinutes = useMeditationStore(state => state.calculateRecommendedMinutes);
  const initData = useMeditationStore(state => state.initData);
  const user = useUserStore(state => state.user);
  const initUser = useUserStore(state => state.initUser);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(20);
  const [recommendedMinutes, setRecommendedMinutes] = useState(15);
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    initUser();
    initData();
  }, [initUser, initData]);

  useEffect(() => {
    const activePlan = plans.find(p => p.isActive);
    if (activePlan) {
      setRecommendedMinutes(activePlan.recommendedMinutes || 15);
      const rate = calculateCompletionRate(sessions, activePlan.dailyGoalMinutes);
      setCompletionRate(rate);
    }
  }, [plans, sessions]);

  useEffect(() => {
    if (plans.length > 0) {
      calculateRecommendedMinutes();
    }
  }, []);

  const activePlan = plans.find(p => p.isActive);

  const handleCreatePlan = () => {
    const validation = validateDuration(dailyGoal);
    if (!validation.valid) {
      addToast({ type: 'error', message: validation.message || '创建失败' });
      return;
    }

    const result = createPlan(dailyGoal);
    if (result.success) {
      addToast({ type: 'success', message: '冥想计划创建成功！' });
      setShowCreateForm(false);
    } else {
      addToast({ type: 'error', message: result.message || '创建失败' });
    }
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
            冥想计划
          </h1>
          <p className="text-white/60 mt-1">制定目标，养成习惯</p>
        </div>
        {!showCreateForm && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            新建计划
          </motion.button>
        )}
      </motion.div>

      {showCreateForm && (
        <motion.div
          variants={itemVariants}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-semibold">创建冥想计划</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white/70 mb-2">每日目标时长（分钟）</label>
              <div className="flex gap-3 mb-4">
                {[10, 15, 20, 30, 45, 60].map(min => (
                  <motion.button
                    key={min}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDailyGoal(min)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      dailyGoal === min
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {min}
                  </motion.button>
                ))}
              </div>
              <div>
                <label className="block text-white/50 text-sm mb-2">自定义时长（5-120分钟）</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={dailyGoal}
                  onChange={e => setDailyGoal(Math.max(5, Math.min(120, parseInt(e.target.value) || 5)))}
                  className="input-field text-center text-xl font-bold"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass-card p-4 bg-primary-500/10 border-primary-400/30">
                <p className="text-white/60 text-sm mb-1">智能推荐时长</p>
                <p className="text-3xl font-bold gradient-text">{recommendedMinutes} 分钟</p>
                <p className="text-white/50 text-xs mt-1">根据历史完成率计算</p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreatePlan}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Check size={20} />
                创建计划
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {activePlan && (
        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-semibold flex items-center gap-2">
              <Target size={24} className="text-primary-400" />
              当前计划
            </h3>
            <span className="px-3 py-1 rounded-full bg-secondary-500/20 text-secondary-400 text-sm font-medium">
              进行中
            </span>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={Target}
              label="每日目标"
              value={`${activePlan.dailyGoalMinutes}分钟`}
              color="from-primary-500 to-primary-600"
            />
            <StatCard
              icon={TrendingUp}
              label="完成率"
              value={`${(completionRate * 100).toFixed(1)}%`}
              color="from-secondary-500 to-secondary-600"
            />
            <StatCard
              icon={Clock}
              label="推荐时长"
              value={`${activePlan.recommendedMinutes}分钟`}
              color="from-purple-500 to-purple-600"
            />
            <StatCard
              icon={CalendarRange}
              label="开始日期"
              value={formatDate(activePlan.startDate)}
              color="from-accent-400 to-accent-500"
            />
          </div>

          <div className="glass-card p-4 bg-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/70">本月完成进度</span>
              <span className="font-semibold">{(completionRate * 100).toFixed(1)}%</span>
            </div>
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-500 to-secondary-400"
              />
            </div>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h3 className="text-xl font-display font-semibold mb-6">历史记录</h3>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sessions.slice(0, 20).map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center text-2xl">
                  🧘
                </div>
                <div>
                  <p className="font-medium">{session.audioName}</p>
                  <p className="text-white/50 text-sm">
                    {formatDate(session.sessionDate)} · {session.startTime}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary-400">{formatDuration(session.durationMinutes)}</p>
                {session.moodLevel && (
                  <p className="text-lg">{getMoodEmoji(session.moodLevel)}</p>
                )}
              </div>
            </motion.div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-white/50">还没有冥想记录，开始你的第一次冥想吧！</p>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h3 className="text-xl font-display font-semibold mb-4">智能建议</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-card p-4 bg-secondary-500/10 border-secondary-400/30">
            <p className="text-secondary-400 font-medium mb-2">💡 建议</p>
            <p className="text-white/80 text-sm">
              {completionRate >= 0.8
                ? '你的完成率很高！可以尝试增加每日目标时长，挑战自己。'
                : completionRate >= 0.5
                ? '继续保持！试着将冥想时间固定在每天同一时段，更容易坚持。'
                : '最近完成率较低，可以从较短的时长开始，逐步建立习惯。'}
            </p>
          </div>
          
          <div className="glass-card p-4 bg-primary-500/10 border-primary-400/30">
            <p className="text-primary-400 font-medium mb-2">🎯 今日推荐</p>
            <p className="text-white/80 text-sm">
              系统根据你的历史数据，推荐今日冥想时长为 <span className="font-bold text-primary-300">{recommendedMinutes}分钟</span>。
              {user && user.currentStreak > 0 && (
                <span className="block mt-1">你已经连续打卡 {user.currentStreak} 天，继续加油！</span>
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-card p-4"
    >
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-2`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-white/60 text-xs mb-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </motion.div>
  );
}

function getMoodEmoji(level: number): string {
  const emojis = ['😢', '😞', '😔', '😐', '🙂', '😊', '😄', '😁', '🤗', '✨'];
  return emojis[Math.max(0, Math.min(9, level - 1))];
}
