import React from 'react';
import { X, Calendar, User, Tag, Trash2, Edit3, Split, FileText } from 'lucide-react';
import { useSplitMate } from '../../context/SplitMateContext';
import { Expense } from '../../types';
import { formatPaise } from '../../utils/calculations';
import { Avatar } from '../common/Avatar';

interface ExpenseDetailModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  expense,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { groups, getMember } = useSplitMate();

  if (!isOpen || !expense) return null;

  const group = groups.find((g) => g.id === expense.groupId);
  const payer = getMember(expense.paidBy);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="w-full max-w-md bg-[#181B20] border border-[#2B2F36] rounded-2xl shadow-2xl relative text-[#F5F5F5] overflow-hidden my-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Amount Banner */}
        <div className="p-6 border-b border-[#2B2F36] bg-[#14171C]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#202329] border border-[#2B2F36] text-[#8FAF9A] font-medium flex items-center gap-1.5">
              <Tag className="w-3 h-3" />
              {expense.category}
            </span>
            <button
              onClick={onClose}
              className="text-[#737984] hover:text-[#F5F5F5] p-1.5 rounded-lg hover:bg-[#202329] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl font-bold text-[#F5F5F5] tracking-tight">{expense.title}</h2>
          <div className="mt-2 text-2xl font-black text-[#8FAF9A]">
            {formatPaise(expense.amountInPaise)}
          </div>
          <p className="text-xs text-[#A0A5AE] mt-1">
            In group <span className="text-[#F5F5F5] font-semibold">{group?.name || 'Group'}</span>
          </p>
        </div>

        {/* Content details */}
        <div className="p-6 space-y-4">
          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#111316] border border-[#2B2F36] rounded-xl text-xs">
            <div>
              <span className="text-[#737984] block mb-1">Paid by</span>
              <div className="flex items-center gap-2">
                <Avatar name={payer?.name || 'Payer'} src={payer?.avatar} size="xs" />
                <span className="font-semibold text-[#F5F5F5] truncate">{payer?.name}</span>
              </div>
            </div>

            <div>
              <span className="text-[#737984] block mb-1">Date</span>
              <div className="flex items-center gap-1.5 text-[#F5F5F5] font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#8FAF9A]" />
                <span>{new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {expense.notes && (
            <div className="p-3 bg-[#111316] border border-[#2B2F36] rounded-xl text-xs text-[#A0A5AE]">
              <div className="flex items-center gap-1.5 text-[#737984] mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Notes</span>
              </div>
              <p className="text-[#F5F5F5]">{expense.notes}</p>
            </div>
          )}

          {/* Shares split breakdown */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#A0A5AE] mb-2 uppercase tracking-wider">
              <span>Split Breakdown ({expense.splitMethod})</span>
              <span>{expense.participantIds.length} members</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {expense.participantIds.map((pid) => {
                const member = getMember(pid);
                const sharePaise = expense.sharesInPaise[pid] || 0;
                const isPayer = pid === expense.paidBy;

                return (
                  <div
                    key={pid}
                    className="flex items-center justify-between p-2.5 bg-[#111316] border border-[#2B2F36] rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={member?.name || 'Member'} src={member?.avatar} size="xs" />
                      <div className="min-w-0">
                        <span className="font-medium text-[#F5F5F5] block truncate">
                          {member?.name}
                        </span>
                        {isPayer && (
                          <span className="text-[10px] text-[#8FAF9A] font-semibold">Payer</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-semibold text-[#F5F5F5]">
                        {formatPaise(sharePaise)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions: Edit & Delete */}
        <div className="px-6 py-4 bg-[#14171C] border-t border-[#2B2F36] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onDelete(expense.id);
              onClose();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#D99090] hover:bg-[#3A1D1D] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#A0A5AE] hover:text-[#F5F5F5] hover:bg-[#202329] transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onEdit(expense);
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#202329] border border-[#2B2F36] text-[#F5F5F5] hover:border-[#8FAF9A] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#8FAF9A]" />
              Edit Expense
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
