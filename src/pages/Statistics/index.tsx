import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { TrendingUp, BarChart3, Calendar, Download, Award, Clock, Target, Smile, Lightbulb, Clock3, AlertTriangle } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useMeditationStore } from '../../store/useMeditationStore';
import { useBadgeStore } from '../../store/useBadgeStore';
import { generateMonthlyReportData, generateMonthlyReportPDF } from '../../utils/pdfGenerator';
import { formatDuration, getMoodEmoji, getHabitInsights, generateCalendarData, getMoodColor } from '../../utils/calculations';
import type { MonthlyReport, ToastMessage, CalendarDay, MeditationSession } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StatisticsProps {
  addToast: (message: Omit<ToastMessage, 'id'>) => void;
}

export default function Statistics({ addToast }: StatisticsProps) {
  const user = useUserStore(state => state.user);
  const sessions = useMeditationStore(state => state.sessions);
  const badges = useBadgeStore(state => state.badges);
  const initUser = useUserStore(state => state.initUser);
  const initData = useMeditationStore(state => state.initData);
  const initBadges = useBadgeStore(state => state.initBadges);

  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedInsightDay, setSelectedInsightDay] = useState<CalendarDay | null>(null);
  const [expandedDailyDate, setExpandedDailyDate] = useState<string | null>(null);

  useEffect(() => {
    initUser();
    initData();
    initBadges();
  }, [initUser, initData, initBadges]);

  useEffect(() => {
    if (sessions.length > 0 && badges.length > 0 && user) {
      const reportData = generateMonthlyReportData(
        sessions,
        badges,
        user,
        selectedMonth.year,
        selectedMonth.month
      );
      setReport(reportData);
    }
  }, [sessions, badges, user, selectedMonth]);

  const moodChartData = useMemo(() => {
    if (!report || report.moodTrend.length === 0) return null;
    
    return {
      labels: report.moodTrend.map(m => m.date.slice(5)),
      datasets: [
        {
          label: '情绪等级',
          data: report.moodTrend.map(m => m.mood),
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(139, 92, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    };
  }, [report]);

  const dailyChartData = useMemo(() => {
    if (!report) return null;
    
    return {
      labels: report.dailyBreakdown.map(d => d.date.slice(8)),
      datasets: [
        {
          label: '冥想时长（分钟）',
          data: report.dailyBreakdown.map(d => d.minutes),
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    };
  }, [report]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(99, 102, 241, 0.5)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)'
        },
        min: 0
      }
    }
  };

  const habitInsights = useMemo(() => getHabitInsights(sessions, 30), [sessions]);

  const last30DaysData = useMemo(() => {
    const today = new Date();
    const days: CalendarDay[] = [];
    const allCalendar = generateCalendarData(sessions, today.getFullYear(), today.getMonth() + 1);
    const lastMonth = today.getMonth() === 0 ? 12 : today.getMonth();
    const lastMonthYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
    const lastMonthCalendar = generateCalendarData(sessions, lastMonthYear, lastMonth);
    const combined = [...lastMonthCalendar, ...allCalendar];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const found = combined.find(d => d.date === dateStr);
      if (found) days.push(found);
    }
    return days;
  }, [sessions]);

  const moodChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: 1,
        max: 10,
        ticks: {
          ...chartOptions.scales.y.ticks,
          stepSize: 1
        }
      }
    }
  };

  const handleExportPDF = () => {
    if (!report || !user) return;
    
    setIsExporting(true);
    try {
      generateMonthlyReportPDF(report, user, () => {
        addToast({ type: 'success', message: '月度报告导出成功！' });
      });
    } catch (error) {
      addToast({ type: 'error', message: '导出失败，请重试' });
    } finally {
      setIsExporting(false);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}月`
  }));

  const years = Array.from({ length: 3 }, (_, i) => ({
    value: new Date().getFullYear() - i,
    label: `${new Date().getFullYear() - i}年`
  }));

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

  if (!user || !report) {
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
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">数据统计</h1>
          <p className="text-white/60 mt-1">查看你的冥想进度和情绪变化</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth.year}
              onChange={(e) => setSelectedMonth(prev => ({ ...prev, year: Number(e.target.value) }))}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {years.map(y => (
                <option key={y.value} value={y.value} className="bg-slate-800">{y.label}</option>
              ))}
            </select>
            <select
              value={selectedMonth.month}
              onChange={(e) => setSelectedMonth(prev => ({ ...prev, month: Number(e.target.value) }))}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {months.map(m => (
                <option key={m.value} value={m.value} className="bg-slate-800">{m.label}</option>
              ))}
            </select>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportPDF}
            disabled={isExporting}
            className="btn-primary inline-flex items-center gap-2"
          >
            {isExporting ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Download size={18} />
            )}
            导出PDF
          </motion.button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="总冥想时长"
          value={formatDuration(report.totalMinutes)}
          color="from-primary-500 to-primary-600"
        />
        <StatCard
          icon={Target}
          label="打卡率"
          value={`${(report.checkInRate * 100).toFixed(1)}%`}
          color="from-secondary-500 to-secondary-600"
        />
        <StatCard
          icon={BarChart3}
          label="冥想次数"
          value={`${report.totalSessions}次`}
          color="from-accent-400 to-accent-500"
        />
        <StatCard
          icon={Smile}
          label="平均情绪"
          value={`${report.averageMood.toFixed(1)} ${getMoodEmoji(Math.round(report.averageMood))}`}
          color="from-purple-500 to-purple-600"
        />
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h3 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
          <Lightbulb size={20} className="text-yellow-400" />
          习惯洞察 · 最近 30 天
        </h3>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-600/10 border border-primary-400/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock3 size={18} className="text-primary-400" />
              <span className="text-white/70 text-sm">最常冥想时段</span>
            </div>
            {habitInsights.mostFrequentSlot ? (
              <p className="text-2xl font-bold text-primary-400">{habitInsights.mostFrequentSlot}</p>
            ) : (
              <p className="text-white/40 text-sm">暂无数据</p>
            )}
            {habitInsights.timeSlotDistribution.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {habitInsights.timeSlotDistribution
                  .filter(s => s.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 3)
                  .map(slot => (
                    <div key={slot.slot} className="flex items-center justify-between text-xs">
                      <span className="text-white/60">{slot.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div 
                            className="h-full bg-primary-400 rounded-full transition-all"
                            style={{ 
                              width: `${Math.max(10, (slot.count / Math.max(...habitInsights.timeSlotDistribution.map(s => s.count))) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-white/80 w-6 text-right">{slot.count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-400/20">
            <div className="flex items-center gap-2 mb-2">
              <Smile size={18} className="text-purple-400" />
              <span className="text-white/70 text-sm">平均情绪变化</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: habitInsights.avgMoodChange > 0 ? '#34d399' : habitInsights.avgMoodChange < 0 ? '#f87171' : '#a78bfa' }}>
              {habitInsights.avgMoodChange > 0 ? '+' : ''}{habitInsights.avgMoodChange.toFixed(1)}
            </p>
            <p className="text-xs text-white/50 mt-1">
              {habitInsights.avgMoodChange > 0 ? '整体情绪在提升 📈' : habitInsights.avgMoodChange < 0 ? '可能需要多关注自己 🤍' : '情绪保持稳定'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-accent-400/10 to-accent-500/10 border border-accent-400/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-accent-400" />
              <span className="text-white/70 text-sm">中断最多星期几</span>
            </div>
            {habitInsights.mostInterruptedWeekday ? (
              <>
                <p className="text-2xl font-bold text-accent-400">{habitInsights.mostInterruptedWeekday.day}</p>
                <p className="text-xs text-white/50 mt-1">中断了 {habitInsights.mostInterruptedWeekday.count} 次</p>
              </>
            ) : (
              <p className="text-white/40 text-sm">数据不足</p>
            )}
            {habitInsights.weekdayBreakdown.length > 0 && (
              <div className="mt-3 grid grid-cols-7 gap-1">
                {habitInsights.weekdayBreakdown.map(w => (
                  <div key={w.day} className="text-center" title={`${w.totalMinutes} 分钟 / ${w.count} 次`}>
                    <div 
                      className={`w-full aspect-square rounded flex items-center justify-center text-[10px] font-medium ${
                        w.count > 0 ? 'bg-accent-400/30 text-accent-300' : 'bg-white/5 text-white/30'
                      }`}
                    >
                      {w.count || '-'}
                    </div>
                    <p className="text-[10px] text-white/40 mt-0.5">{w.day.replace('星期', '')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-white/70">最近 30 天冥想热力图 · 点击查看当日详情</p>
            <div className="flex items-center gap-1.5 text-[10px] text-white/50">
              <span>少</span>
              <div className="w-3 h-3 rounded bg-white/[0.03]" />
              <div className="w-3 h-3 rounded bg-primary-500/10" />
              <div className="w-3 h-3 rounded bg-primary-500/20" />
              <div className="w-3 h-3 rounded bg-primary-500/30" />
              <div className="w-3 h-3 rounded bg-primary-500/40" />
              <span>多</span>
            </div>
          </div>
          <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-30 gap-1">
            {last30DaysData.map((day) => (
              <motion.div
                key={day.date}
                whileHover={{ scale: 1.2, y: -2 }}
                onClick={() => day.hasMeditation && setSelectedInsightDay(day)}
                className={`
                  aspect-square rounded-md cursor-pointer transition-colors
                  ${day.intensity === 0 ? 'bg-white/[0.03]' : ''}
                  ${day.intensity === 1 ? 'bg-primary-500/10' : ''}
                  ${day.intensity === 2 ? 'bg-primary-500/20' : ''}
                  ${day.intensity === 3 ? 'bg-primary-500/30' : ''}
                  ${day.intensity >= 4 ? 'bg-primary-500/40' : ''}
                  ${day.hasMeditation ? 'hover:bg-primary-500/60' : ''}
                `}
                title={`${day.date}${day.hasMeditation ? ` · ${day.durationMinutes}分钟` : ''}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-white/30">
            <span>{last30DaysData[0]?.date.slice(5) || ''}</span>
            <span>今天</span>
          </div>
        </div>

        {selectedInsightDay && selectedInsightDay.sessions && selectedInsightDay.sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 pt-5 border-t border-white/10"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-primary-400" />
                {selectedInsightDay.date} · 共 {selectedInsightDay.sessionCount} 次 · {selectedInsightDay.durationMinutes} 分钟
              </h4>
              <button
                onClick={() => setSelectedInsightDay(null)}
                className="text-white/50 hover:text-white text-sm px-2 py-1 rounded bg-white/5 hover:bg-white/10"
              >
                收起
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {selectedInsightDay.sessions.map(session => (
                <SessionDetailCard key={session.id} session={session} />
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-purple-400" />
            情绪变化趋势
          </h3>
          {moodChartData && report.moodTrend.length > 0 ? (
            <div className="h-64">
              <Line data={moodChartData} options={moodChartOptions} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-white/50">
              本月暂无情绪记录
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary-400" />
            每日冥想时长
          </h3>
          <div className="h-64">
            <Bar data={dailyChartData!} options={chartOptions} />
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h3 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
          <Award size={20} className="text-accent-400" />
          本月获得勋章
        </h3>
        {report.badgesEarned.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {report.badgesEarned.map(badge => (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-accent-400/20 to-accent-500/20 border border-accent-400/30 rounded-xl p-4 text-center"
              >
                <div className="text-4xl mb-2 badge-glow">{badge.icon}</div>
                <p className="font-semibold text-sm">{badge.badgeName}</p>
                <p className="text-white/50 text-xs mt-1">{badge.earnedDate}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-white/50 text-center py-8">本月还没有获得勋章，继续努力吧！</p>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-6">
        <h3 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-secondary-400" />
          每日明细 · {report.year}年{report.month}月
        </h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {report.dailyBreakdown.map((day) => (
            <div key={day.date} className="rounded-lg overflow-hidden">
              <div
                onClick={() => day.sessions && day.sessions.length > 0 && setExpandedDailyDate(expandedDailyDate === day.date ? null : day.date)}
                className={`flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors ${
                  day.sessions && day.sessions.length > 0 ? 'cursor-pointer' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    day.minutes > 0 ? 'bg-secondary-500/20 text-secondary-400' : 'bg-white/5 text-white/30'
                  }`}>
                    {new Date(day.date).getDate()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{day.date}</p>
                    <p className="text-xs text-white/50">
                      {day.minutes > 0 ? `${day.minutes}分钟 · ${day.sessions?.length || 0}次` : '未打卡'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {day.minutes > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary-500/20 text-secondary-400 rounded-full text-xs">
                      ✓ 已打卡
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-white/40 rounded-full text-xs">
                      未打卡
                    </span>
                  )}
                  {day.sessions && day.sessions.length > 0 && (
                    <div className={`transition-transform duration-200 ${expandedDailyDate === day.date ? 'rotate-180' : ''}`}>
                      <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              {day.sessions && day.sessions.length > 0 && expandedDailyDate === day.date && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3 pb-3"
                >
                  <div className="space-y-2 pt-2">
                    {day.sessions.map(session => (
                      <SessionDetailCard key={session.id} session={session} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          ))}
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
      whileHover={{ y: -4 }}
      className="glass-card p-4"
    >
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-white/60 text-sm mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </motion.div>
  );
}

function SessionDetailCard({ session }: { session: MeditationSession }) {
  return (
    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-500/20 flex items-center justify-center">
            🧘
          </div>
          <div>
            <p className="font-medium text-sm">{session.audioName}</p>
            <p className="text-xs text-white/50">{session.startTime} - {session.endTime}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-primary-400 font-semibold">{session.durationMinutes} 分钟</p>
          {session.moodLevel && (
            <p className="text-xs mt-0.5" style={{ color: getMoodColor(session.moodLevel) }}>
              {getMoodEmoji(session.moodLevel)} {session.moodLevel}/10
            </p>
          )}
        </div>
      </div>
      {(session.stressSource || (session.tags && session.tags.length > 0) || session.note) && (
        <div className="mt-2 pt-2 border-t border-white/5 space-y-1.5">
          {session.stressSource && (
            <p className="text-xs text-white/60">
              <span className="text-white/40">压力来源: </span>
              <span className="text-accent-400">{session.stressSource}</span>
            </p>
          )}
          {session.tags && session.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {session.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-300 border border-primary-500/20">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {session.note && (
            <p className="text-xs text-white/60 italic bg-white/[0.02] rounded p-2">
              "{session.note}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
