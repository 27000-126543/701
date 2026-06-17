import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Timer,
  BarChart3,
  Award,
  Users,
  Bell
} from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/meditation', icon: Timer, label: '冥想' },
  { path: '/statistics', icon: BarChart3, label: '统计' },
  { path: '/badges', icon: Award, label: '勋章' },
  { path: '/community', icon: Users, label: '社区' }
];

interface BottomNavProps {
  onNotificationClick?: () => void;
}

export default function BottomNav({ onNotificationClick }: BottomNavProps) {
  const location = useLocation();
  const unreadCount = useNotificationStore(state => state.getUnreadCount());

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="lg:hidden fixed bottom-0 left-0 right-0 glass-card rounded-none border-t border-white/10 z-50 safe-area-bottom"
    >
      <div className="flex justify-around items-center px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item flex-1 ${isActive ? 'active' : ''}`}
            >
              <Icon
                size={22}
                className={isActive ? 'text-primary-400' : ''}
              />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottomActiveIndicator"
                  className="absolute -top-1 w-1 h-1 rounded-full bg-primary-400"
                />
              )}
            </NavLink>
          );
        })}
        <button
          onClick={onNotificationClick}
          className="nav-item flex-1 relative"
        >
          <Bell size={22} />
          <span className="text-xs font-medium">通知</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-4 bg-danger-400 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </motion.nav>
  );
}
