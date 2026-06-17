import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ParticleBackground from './components/layout/ParticleBackground';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import Toast from './components/ui/Toast';
import NotificationCenter from './components/ui/NotificationCenter';
import Dashboard from './pages/Dashboard';
import Meditation from './pages/Meditation';
import Plan from './pages/Plan';
import Statistics from './pages/Statistics';
import Badges from './pages/Badges';
import Membership from './pages/Membership';
import Community from './pages/Community';
import type { ToastMessage } from './types';
import { generateId } from './utils/calculations';
import { useNotificationStore } from './store/useNotificationStore';
import { useMeditationStore } from './store/useMeditationStore';
import { useUserStore } from './store/useUserStore';

export default function App() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const initNotifications = useNotificationStore(state => state.initNotifications);
  const addNotification = useNotificationStore(state => state.addNotification);
  const notifications = useNotificationStore(state => state.notifications);
  const initData = useMeditationStore(state => state.initData);
  const getTodaySessions = useMeditationStore(state => state.getTodaySessions);
  const plans = useMeditationStore(state => state.plans);
  const initUser = useUserStore(state => state.initUser);

  useEffect(() => {
    initUser();
    initData();
    initNotifications();
  }, [initUser, initData, initNotifications]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = getTodaySessions();
    const activePlan = plans.find(p => p.isActive);
    
    const hasReminderToday = notifications.some(
      n => n.type === 'reminder' && n.createdAt.startsWith(today)
    );

    if (activePlan && todaySessions.length === 0 && !hasReminderToday) {
      const hour = new Date().getHours();
      let message = '';
      
      if (hour < 12) {
        message = `早上好！今天的${activePlan.dailyGoalMinutes}分钟冥想还没完成，早起冥想能让你一整天都神清气爽。`;
      } else if (hour < 18) {
        message = `下午好！别忘了今天的${activePlan.dailyGoalMinutes}分钟冥想，抽点时间给自己，放松一下。`;
      } else {
        message = `晚上好！今天的${activePlan.dailyGoalMinutes}分钟冥想还没完成，睡前冥想能帮助你更好地入睡。`;
      }

      addNotification(
        'reminder',
        '🧘 今日冥想提醒',
        message
      );
    }
  }, [notifications, plans, getTodaySessions, addNotification]);

  const addToast = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = generateId();
    setToasts(prev => [...prev, { ...message, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleNotification = useCallback(() => {
    setNotificationOpen(prev => !prev);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
        <ParticleBackground />
        
        <Sidebar onNotificationClick={toggleNotification} />
        <BottomNav onNotificationClick={toggleNotification} />
        
        <main className="lg:ml-64 pt-6 pb-24 lg:pb-6 px-4 lg:px-8 min-h-screen relative z-10">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard addToast={addToast} />} />
              <Route path="/meditation" element={<Meditation addToast={addToast} />} />
              <Route path="/plan" element={<Plan addToast={addToast} />} />
              <Route path="/statistics" element={<Statistics addToast={addToast} />} />
              <Route path="/badges" element={<Badges addToast={addToast} />} />
              <Route path="/membership" element={<Membership addToast={addToast} />} />
              <Route path="/community" element={<Community addToast={addToast} />} />
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                  <div className="text-8xl mb-6">🧘</div>
                  <h2 className="text-2xl font-bold mb-2">页面未找到</h2>
                  <p className="text-white/60">你要找的页面不存在或已被移除</p>
                </div>
              } />
            </Routes>
          </div>
        </main>
        
        <Toast toasts={toasts} onRemove={removeToast} />
        <NotificationCenter isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />
      </div>
    </Router>
  );
}
