import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#181B20] border border-[#2B2F36] rounded-2xl p-6 shadow-2xl relative text-[#F5F5F5] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-[#737984] hover:text-[#F5F5F5] p-1.5 rounded-lg hover:bg-[#202329] transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isDestructive ? 'bg-[#3A1D1D] text-[#D99090]' : 'bg-[#202329] text-[#8FAF9A]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F5F5F5]">{title}</h3>
            <p className="text-sm text-[#A0A5AE] mt-1.5 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#2B2F36]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[#A0A5AE] hover:text-[#F5F5F5] hover:bg-[#202329] transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-all cursor-pointer ${
              isDestructive
                ? 'bg-[#A83232] hover:bg-[#C23B3B]'
                : 'bg-[#2E453C] hover:bg-[#3B594D] text-[#82B99A]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
