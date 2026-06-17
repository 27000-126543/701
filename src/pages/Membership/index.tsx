import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, ChevronRight, Sparkles, BookOpen, Star, Zap } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { getMembershipLevel, formatDuration } from '../../utils/calculations';
import type { ToastMessage, MembershipLevelConfig } from '../../types';

interface MembershipProps {
  addToast: (message: Omit<ToastMessage, 'id'>) => void;
}

export default function Membership({ addToast }: MembershipProps) {
  const user = useUserStore(state => state.user);
  const initUser = useUserStore(state => state.initUser);

  useEffect(() => {
    initUser();
  }, [initUser]);

  const currentLevel = useMemo(() => {
    if (!user) return null;
    return getMembershipLevel(user.totalMeditationMinutes);
  }, [user]);

  const nextLevel = useMemo(() => {
    if (!currentLevel) return null;
    const allLevels: MembershipLevelConfig[] = [
      { level: '普通用户', name: '普通用户', requiredMinutes: 0, benefits: ['基础冥想功能', '情绪记录', '社区浏览'], color: '#64748b' },
      { level: '初学', name: '初学会员', requiredMinutes: 300, benefits: ['基础课程免费', '解锁全部勋章', '完整PDF报告导出'], color: '#34d399' },
      { level: '进阶', name: '进阶会员', requiredMinutes: 1000, benefits: ['高级课程免费', '专属勋章', '社区内容推荐', '月度深度报告'], color: '#8b5cf6' },
      { level: '达人', name: '达人会员', requiredMinutes: 5000, benefits: ['全部高级课程免费', '专属勋章标识', '优先推荐社区内容', '一对一冥想指导', '定制化冥想计划'], color: '#fbbf24' }
    ];
    
    const currentIndex = allLevels.findIndex(l => l.level === currentLevel.level);
    if (currentIndex >= 0 && currentIndex < allLevels.length - 1) {
      return allLevels[currentIndex + 1];
    }
    return null;
  }, [currentLevel]);

  const allLevels = useMemo((): MembershipLevelConfig[] => [
    { level: '达人', name: '达人会员', requiredMinutes: 5000, benefits: ['全部高级课程免费', '专属勋章标识', '优先推荐社区内容', '一对一冥想指导', '定制化冥想计划'], color: '#fbbf24' },
    { level: '进阶', name: '进阶会员', requiredMinutes: 1000, benefits: ['高级课程免费', '专属勋章', '社区内容推荐', '月度深度报告'], color: '#8b5cf6' },
    { level: '初学', name: '初学会员', requiredMinutes: 300, benefits: ['基础课程免费', '解锁全部勋章', '完整PDF报告导出'], color: '#34d399' },
    { level: '普通用户', name: '普通用户', requiredMinutes: 0, benefits: ['基础冥想功能', '情绪记录', '社区浏览'], color: '#64748b' }
  ], []);

  const levelIcons: Record<string, string> = {
    '普通用户': '🌱',
    '初学': '🌿',
    '进阶': '🌳',
    '达人': '👑'
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

  if (!user || !currentLevel) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const progressToNext = nextLevel
    ? ((user.totalMeditationMinutes - currentLevel.requiredMinutes) / (nextLevel.requiredMinutes - currentLevel.requiredMinutes)) * 100
    : 100;

  const minutesToNext = nextLevel
    ? nextLevel.requiredMinutes - user.totalMeditationMinutes
    : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-display font-bold gradient-text">会员中心</h1>
        <p className="text-white/60 mt-1">你的每一次冥想都在助力成长</p>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20">
          <div
            className="w-full h-full rounded-full blur-3xl"
            style={{ background: currentLevel.color }}
          />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/60 mb-2">当前会员等级</p>
              <div className="flex items-center gap-3">
                <span className="text-5xl">{levelIcons[currentLevel.level]}</span>
                <div>
                  <h2 className="text-3xl font-bold" style={{ color: currentLevel.color }}>
                    {currentLevel.name}
                  </h2>
                  <p className="text-white/60 mt-1">
                    累计冥想 {formatDuration(user.totalMeditationMinutes)}
                  </p>
                </div>
              </div>
            </div>
            <div
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: `${currentLevel.color}30`, color: currentLevel.color }}
            >
              <Crown size={16} className="inline mr-1" />
              {currentLevel.level}
            </div>
          </div>

          {nextLevel && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/70">
                  距离 <span style={{ color: nextLevel.color }}>{nextLevel.name}</span> 还需
                </p>
                <p className="font-semibold" style={{ color: nextLevel.color }}>
                  {formatDuration(minutesToNext)}
                </p>
              </div>
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, progressToNext)}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ 
                    background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})` 
                  }}
                />
              </div>
              <p className="text-right text-white/50 text-sm mt-2">
                已完成 {progressToNext.toFixed(1)}%
              </p>
            </div>
          )}

          {!nextLevel && (
            <div className="mt-8 p-4 bg-accent-500/20 border border-accent-400/30 rounded-xl text-center">
              <Sparkles size={32} className="mx-auto text-accent-400 mb-2" />
              <p className="text-accent-400 font-semibold">恭喜你已达到最高等级！</p>
              <p className="text-white/60 text-sm mt-1">你是真正的冥想达人 ✨</p>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h3 className="text-xl font-display font-semibold mb-6 flex items-center gap-2">
          <Star size={20} className="text-accent-400" />
          当前等级权益
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {currentLevel.benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${currentLevel.color}30` }}
              >
                <Check size={16} style={{ color: currentLevel.color }} />
              </div>
              <span>{benefit}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h3 className="text-xl font-display font-semibold mb-6 flex items-center gap-2">
          <Zap size={20} className="text-primary-400" />
          会员等级体系
        </h3>
        <div className="space-y-4">
          {allLevels.map((level, index) => {
            const isUnlocked = user.totalMeditationMinutes >= level.requiredMinutes;
            const isCurrent = currentLevel.level === level.level;
            
            return (
              <motion.div
                key={level.level}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  relative p-4 rounded-xl border transition-all
                  ${isCurrent 
                    ? 'border-primary-400/50 bg-primary-500/10' 
                    : isUnlocked
                    ? 'border-white/20 bg-white/5'
                    : 'border-white/10 bg-white/5 opacity-50'
                  }
                `}
              >
                {isCurrent && (
                  <div className="absolute -top-2 -right-2 px-3 py-1 bg-primary-500 rounded-full text-xs font-medium">
                    当前
                  </div>
                )}
                
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ 
                      background: isUnlocked ? `${level.color}30` : 'rgba(255,255,255,0.05)',
                      filter: isUnlocked ? 'none' : 'grayscale(100%)'
                    }}
                  >
                    {levelIcons[level.level]}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold" style={{ color: isUnlocked ? level.color : undefined }}>
                        {level.name}
                      </h4>
                      {isUnlocked && <Check size={16} className="text-secondary-400" />}
                    </div>
                    <p className="text-white/50 text-sm mt-1">
                      累计冥想 {formatDuration(level.requiredMinutes)} 可升级
                    </p>
                  </div>
                  
                  <ChevronRight size={20} className="text-white/30" />
                </div>
                
                {isUnlocked && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-white/60 text-sm mb-2">权益：</p>
                    <div className="flex flex-wrap gap-2">
                      {level.benefits.slice(0, 3).map((benefit, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs rounded-full"
                          style={{ background: `${level.color}20`, color: level.color }}
                        >
                          {benefit}
                        </span>
                      ))}
                      {level.benefits.length > 3 && (
                        <span className="px-2 py-1 text-xs rounded-full bg-white/10 text-white/50">
                          +{level.benefits.length - 3}项
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h3 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
          <BookOpen size={20} className="text-secondary-400" />
          精品课程推荐
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: '正念冥想入门', duration: '10分钟', level: '初学', icon: '🧘' },
            { title: '深度放松练习', duration: '20分钟', level: '进阶', icon: '🌙' },
            { title: '情绪管理训练', duration: '15分钟', level: '达人', icon: '💫' }
          ].map((course, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -4 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <div className="text-3xl mb-3">{course.icon}</div>
              <h4 className="font-semibold mb-2">{course.title}</h4>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span>⏱ {course.duration}</span>
                <span>•</span>
                <span style={{ 
                  color: course.level === '初学' ? '#34d399' : 
                         course.level === '进阶' ? '#8b5cf6' : '#fbbf24' 
                }}>
                  {course.level}
                </span>
              </div>
              <button className="w-full mt-4 py-2 rounded-lg bg-primary-500/20 text-primary-400 text-sm font-medium hover:bg-primary-500/30 transition-colors">
                开始学习
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
