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
import { TrendingUp, BarChart3, Calendar, Download, Award, Clock, Target, Smile } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useMeditationStore } from '../../store/useMeditationStore';
import { useBadgeStore } from '../../store/useBadgeStore';
import { generateMonthlyReportData, generateMonthlyReportPDF } from '../../utils/pdfGenerator';
import { formatDuration, getMoodEmoji } from '../../utils/calculations';
import type { MonthlyReport, ToastMessage } from '../../types';

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
          每日明细
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white/60 font-medium">日期</th>
                <th className="text-left py-3 px-4 text-white/60 font-medium">冥想时长</th>
                <th className="text-left py-3 px-4 text-white/60 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {report.dailyBreakdown.map((day, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4">{day.date}</td>
                  <td className="py-3 px-4">{day.minutes > 0 ? `${day.minutes}分钟` : '-'}</td>
                  <td className="py-3 px-4">
                    {day.minutes > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary-500/20 text-secondary-400 rounded-full text-xs">
                        ✓ 已打卡
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-white/40 rounded-full text-xs">
                        未打卡
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
