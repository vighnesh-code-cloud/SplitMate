import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../context/SplitMateContext';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
              isSuccess
                ? 'bg-[#181B20]/95 border-[#2E453C] text-[#F5F5F5]'
                : isError
                ? 'bg-[#181B20]/95 border-[#522828] text-[#F5F5F5]'
                : 'bg-[#181B20]/95 border-[#2B2F36] text-[#F5F5F5]'
            }`}
          >
            <div className="flex items-center gap-3">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#82B99A] shrink-0" />}
              {isError && <AlertCircle className="w-5 h-5 text-[#D99090] shrink-0" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-[#8FAF9A] shrink-0" />}
              <span className="text-sm font-medium leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-[#737984] hover:text-[#F5F5F5] ml-2 p-1 transition-colors rounded-lg"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
