import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useCRM();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-16 md:bottom-5 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
            case 'warning':
              return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
            case 'error':
              return <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />;
            default:
              return <Info className="w-5 h-5 text-[#547BDE] flex-shrink-0" />;
          }
        };

        const getBorderColor = () => {
          switch (toast.type) {
            case 'success':
              return 'border-emerald-500/40';
            case 'warning':
              return 'border-amber-500/40';
            case 'error':
              return 'border-rose-500/40';
            default:
              return 'border-[#547BDE]/40';
          }
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-white shadow-2xl border ${getBorderColor()} animate-in slide-in-from-right-5 fade-in duration-200`}
          >
            {getIcon()}
            <div className="flex-1 pr-1">
              <p className="text-xs font-bold leading-snug">{toast.title}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-300 mt-0.5 leading-tight">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
