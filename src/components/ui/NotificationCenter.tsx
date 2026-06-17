import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCheck, Trash2, Award, Crown, Heart, AlertCircle } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import type { Notification } from '../../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const notifications = useNotificationStore(state => state.notifications);
  const markAsRead = useNotificationStore(state => state.markAsRead);
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead);
  const removeNotification = useNotificationStore(state => state.removeNotification);
  const clearAll = useNotificationStore(state => state.clearAll);
  const getUnreadCount = useNotificationStore(state => state.getUnreadCount);

  const unreadCount = getUnreadCount();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'badge':
        return <Award size={20} className="text-accent-400" />;
      case 'membership':
        return <Crown size={20} className="text-yellow-400" />;
      case 'encouragement':
        return <Heart size={20} className="text-pink-400" />;
      case 'reminder':
        return <AlertCircle size={20} className="text-primary-400" />;
      default:
        return <Bell size={20} className="text-white/60" />;
    }
  };

  const getTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'badge': return '勋章';
      case 'membership': return '会员';
      case 'encouragement': return '鼓励';
      case 'reminder': return '提醒';
      default: return '通知';
    }
  };

  const getTimeAgo = (dateStr: string): string => {
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
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-md h-full glass-card rounded-none border-l border-white/10 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <Bell size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold">通知中心</h3>
                  <p className="text-white/50 text-sm">
                    {unreadCount > 0 ? `${unreadCount} 条未读` : '暂无未读消息'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {notifications.length > 0 && (
              <div className="px-4 py-2 border-b border-white/5 flex items-center justify-end gap-2">
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary-500/10 transition-colors"
                >
                  <CheckCheck size={14} />
                  全部已读
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs text-danger-400 hover:text-danger-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-danger-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                  清空
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/40">
                  <Bell size={48} className="mb-4 opacity-30" />
                  <p>暂无通知消息</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      notification.read
                        ? 'bg-white/5 hover:bg-white/10'
                        : 'bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        notification.read ? 'bg-white/10' : 'bg-white/15'
                      }`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            notification.read ? 'bg-white/10 text-white/50' : 'bg-primary-500/20 text-primary-300'
                          }`}>
                            {getTypeLabel(notification.type)}
                          </span>
                          <span className="text-xs text-white/40 ml-auto">
                            {getTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        <h4 className={`font-medium mb-1 ${
                          notification.read ? 'text-white/70' : 'text-white'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm ${
                          notification.read ? 'text-white/50' : 'text-white/70'
                        }`}>
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary-400 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
