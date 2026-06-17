import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MonthlyReport, User } from '../types';
import { formatDuration, formatDate, getMoodEmoji } from './calculations';

export function generateMonthlyReportPDF(
  report: MonthlyReport,
  user: User,
  onComplete?: () => void
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('静心冥想月度报告', pageWidth / 2, 25, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`用户: ${user.name}`, 20, 55);
  doc.text(`报告月份: ${report.year}年${report.month}月`, 20, 65);
  doc.text(`生成日期: ${formatDate(new Date().toISOString().split('T')[0])}`, 20, 75);
  
  const summaryY = 95;
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(20, summaryY - 10, 80, 35, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('总冥想时长', 60, summaryY, { align: 'center' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDuration(report.totalMinutes), 60, summaryY + 12, { align: 'center' });
  
  doc.setFillColor(52, 211, 153);
  doc.roundedRect(110, summaryY - 10, 80, 35, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('打卡率', 150, summaryY, { align: 'center' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${(report.checkInRate * 100).toFixed(1)}%`, 150, summaryY + 12, { align: 'center' });
  
  doc.setFillColor(251, 191, 36);
  doc.roundedRect(20, summaryY + 35, 80, 35, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('冥想次数', 60, summaryY + 45, { align: 'center' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${report.totalSessions}次`, 60, summaryY + 57, { align: 'center' });
  
  doc.setFillColor(139, 92, 246);
  doc.roundedRect(110, summaryY + 35, 80, 35, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('平均情绪', 150, summaryY + 45, { align: 'center' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${report.averageMood.toFixed(1)} ${getMoodEmoji(Math.round(report.averageMood))}`, 150, summaryY + 57, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('每日冥想时长', 20, summaryY + 95);
  
  const tableData = report.dailyBreakdown.slice(0, 15).map(item => [
    item.date,
    `${item.minutes}分钟`
  ]);
  
  autoTable(doc, {
    head: [['日期', '冥想时长']],
    body: tableData,
    startY: summaryY + 100,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });
  
  if (report.badgesEarned.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    if (finalY > 250) {
      doc.addPage();
    }
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('本月获得勋章', 20, (doc as any).lastAutoTable.finalY + 20);
    
    const badgeData = report.badgesEarned.map(badge => [
      badge.icon,
      badge.badgeName,
      badge.description,
      badge.earnedDate || ''
    ]);
    
    autoTable(doc, {
      head: [['图标', '勋章名称', '描述', '获得日期']],
      body: badgeData,
      startY: (doc as any).lastAutoTable.finalY + 25,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [251, 191, 36], textColor: 255 },
      alternateRowStyles: { fillColor: [254, 252, 232] }
    });
  }
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('静心冥想APP - 让每一次呼吸都有意义', pageWidth / 2, 280, { align: 'center' });
  
  doc.save(`静心冥想报告_${report.year}_${report.month}.pdf`);
  
  if (onComplete) {
    onComplete();
  }
}

export function generateMonthlyReportData(
  sessions: any[],
  badges: any[],
  user: User,
  year: number,
  month: number
): MonthlyReport {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const daysInMonth = monthEnd.getDate();
  
  const monthSessions = sessions.filter(s => {
    const sessionDate = new Date(s.sessionDate);
    return sessionDate.getFullYear() === year && (sessionDate.getMonth() + 1) === month && s.completed;
  });
  
  const totalMinutes = monthSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalSessions = monthSessions.length;
  
  let checkedInDays = 0;
  const dailyBreakdown = [];
  const moodTrend = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daySessions = monthSessions.filter(s => s.sessionDate === dateStr);
    const dayMinutes = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    
    dailyBreakdown.push({
      date: dateStr,
      minutes: dayMinutes
    });
    
    if (dayMinutes > 0) {
      checkedInDays++;
      const avgMood = daySessions.reduce((sum, s) => sum + (s.moodLevel || 0), 0) / daySessions.length;
      if (avgMood > 0) {
        moodTrend.push({
          date: dateStr,
          mood: Math.round(avgMood)
        });
      }
    }
  }
  
  const checkInRate = checkedInDays / daysInMonth;
  const averageMood = moodTrend.length > 0 
    ? moodTrend.reduce((sum, m) => sum + m.mood, 0) / moodTrend.length 
    : 0;
  
  const badgesEarned = badges.filter(b => {
    if (!b.unlocked || !b.earnedDate) return false;
    const earnedDate = new Date(b.earnedDate);
    return earnedDate.getFullYear() === year && (earnedDate.getMonth() + 1) === month;
  });
  
  return {
    year,
    month,
    totalMinutes,
    totalSessions,
    checkInRate,
    averageMood,
    moodTrend,
    badgesEarned,
    dailyBreakdown
  };
}
