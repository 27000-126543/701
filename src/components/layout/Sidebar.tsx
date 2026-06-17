import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Timer,
  CalendarRange,
  BarChart3,
  Award,
  Crown,
  Users,
  Bell,
  Settings
} from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/meditation', icon: Timer, label: '冥想' },
  { path: '/plan', icon: CalendarRange, label: '计划' },
  { path: '/statistics', icon: BarChart3, label: '统计' },
  { path: '/badges', icon: Award, label: '勋章' },
  { path: '/membership', icon: Crown, label: '会员' },
  { path: '/community', icon: Users, label: '社区' }
];

interface SidebarProps {
  onNotificationClick?: () => void;
}

export default function Sidebar({ onNotificationClick }: SidebarProps) {
  const location = useLocation();
  const unreadCount = useNotificationStore(state => state.getUnreadCount());

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 glass-card rounded-none border-r border-white/10 z-40"
    >
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-display font-bold gradient-text text-shadow-glow">
          静心
        </h1>
        <p className="text-sm text-white/50 mt-1">冥想与正念练习</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/20 text-white border border-primary-400/30 glow-border'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon
                    size={20}
                    className={`transition-all duration-300 ${
                      isActive ? 'text-primary-400' : 'group-hover:text-primary-400'
                    }`}
                  />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 rounded-full bg-primary-400 animate-pulse"
                    />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <button 
          onClick={onNotificationClick}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 relative"
        >
          <Bell size={20} />
          <span className="font-medium">通知</span>
          {unreadCount > 0 && (
            <span className="ml-auto bg-danger-400 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300">
          <Settings size={20} />
          <span className="font-medium">设置</span>
        </button>
      </div>
    </motion.aside>
  );
}
