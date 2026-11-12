import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { toast, ToastItem } from '../services/toastService';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((item) => {
          let bgClass = 'bg-slate-900 text-white border-slate-700';
          let IconComponent = Info;
          let iconColor = 'text-cyan-400';

          if (item.type === 'success') {
            bgClass = 'bg-emerald-950 text-emerald-100 border-emerald-600/60';
            IconComponent = CheckCircle2;
            iconColor = 'text-emerald-400';
          } else if (item.type === 'error') {
            bgClass = 'bg-rose-950 text-rose-100 border-rose-600/60';
            IconComponent = AlertCircle;
            iconColor = 'text-rose-400';
          } else if (item.type === 'warning') {
            bgClass = 'bg-amber-950 text-amber-100 border-amber-600/60';
            IconComponent = AlertTriangle;
            iconColor = 'text-amber-400';
          } else if (item.type === 'info') {
            bgClass = 'bg-sky-950 text-sky-100 border-sky-600/60';
            IconComponent = Info;
            iconColor = 'text-cyan-400';
          }

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`pointer-events-auto p-3.5 rounded-2xl border shadow-xl flex items-start gap-3 backdrop-blur-md ${bgClass}`}
            >
              <div className="shrink-0 mt-0.5">
                <IconComponent className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="flex-1 text-xs font-semibold leading-relaxed">
                {item.message}
              </div>
              <button
                type="button"
                onClick={() => toast.dismiss(item.id)}
                className="shrink-0 text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                title="Fermer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
