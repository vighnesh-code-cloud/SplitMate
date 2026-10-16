import React from 'react';
import { Sparkles, ArrowLeft, ShieldCheck, Scale, Wallet, Receipt } from 'lucide-react';
import { useSplitMate } from '../../context/SplitMateContext';
import { SplitMateAIAssistant } from './SplitMateAIAssistant';
import { calculateDashboardStats, formatPaise, formatPaiseWithSign } from '../../utils/calculations';

interface AssistantPageProps {
  onOpenSettleUp?: (groupId?: string, payerId?: string, receiverId?: string, amount?: number) => void;
}

export const AssistantPage: React.FC<AssistantPageProps> = ({ onOpenSettleUp }) => {
  const {
    currentUser,
    groups,
    expenses,
    settlements,
    selectedGroupId,
    navigateTo,
    getMemberName,
  } = useSplitMate();

  const stats = calculateDashboardStats(
    currentUser.id,
    groups,
    expenses,
    settlements,
    getMemberName
  );

  const selectedGroup = selectedGroupId ? groups.find((g) => g.id === selectedGroupId) : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Top Header & Context Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigateTo('dashboard')}
              className="text-xs text-[#737984] hover:text-[#F5F5F5] flex items-center gap-1 transition-colors mr-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#202329] border border-[#2B2F36] text-[#8FAF9A]">
              ✨ Unified AI Intelligence
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F5] tracking-tight flex items-center gap-2.5">
            <span>SplitMate AI Assistant</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#A0A5AE] mt-0.5">
            Natural language financial intelligence powered by exact ledger arithmetic and zero-hallucination verification.
          </p>
        </div>

        {/* Quick financial indicator pill */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#181B20] border border-[#2B2F36] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#202329] flex items-center justify-center text-[#8FAF9A]">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#737984]">Net Balance</p>
              <p
                className={`text-xs font-bold ${
                  stats.netBalanceInPaise > 0
                    ? 'text-[#82B99A]'
                    : stats.netBalanceInPaise < 0
                    ? 'text-[#D99090]'
                    : 'text-[#F5F5F5]'
                }`}
              >
                {formatPaiseWithSign(stats.netBalanceInPaise, currentUser.defaultCurrency)}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#181B20] border border-[#2B2F36] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#202329] flex items-center justify-center text-[#A0A5AE]">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#737984]">Active Groups</p>
              <p className="text-xs font-bold text-[#F5F5F5]">
                {stats.activeGroupsCount} {stats.activeGroupsCount === 1 ? 'Group' : 'Groups'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Unified AI Assistant Chat Component */}
      <SplitMateAIAssistant
        initialGroupId={selectedGroupId}
        onOpenSettleUp={onOpenSettleUp}
        className="w-full"
      />
    </div>
  );
};
