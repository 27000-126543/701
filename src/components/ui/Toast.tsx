import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import type { ToastMessage, ToastType } from '../../types';

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info
};

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const Icon = icons[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const bgClass = {
    success: 'bg-gradient-to-r from-secondary-500 to-secondary-600',
    error: 'bg-gradient-to-r from-danger-400 to-danger-500',
    info: 'bg-gradient-to-r from-primary-500 to-primary-600'
  }[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`${bgClass} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md`}
    >
      <Icon size={24} className="flex-shrink-0" />
      <p className="flex-1 font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 hover:bg-white/20 rounded-full transition-colors"
      >
        <X size={18} />
      </button>
    </motion.div>
  );
}
