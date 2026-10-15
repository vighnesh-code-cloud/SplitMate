import React, { useMemo } from 'react';
import {
  Plus,
  Users2,
  UserPlus,
  Activity as ActivityIcon,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Receipt,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useSplitMate } from '../../context/SplitMateContext';
import {
  formatPaise,
  formatPaiseWithSign,
  calculateDashboardStats,
  calculateGroupMemberBalances,
  calculateSimplifiedDebts,
} from '../../utils/calculations';
import { Avatar } from '../common/Avatar';
import { Group } from '../../types';

interface DashboardProps {
  onOpenAddExpense: () => void;
  onOpenCreateGroup: () => void;
  onOpenSettleUp: (groupId?: string, payerId?: string, receiverId?: string, amount?: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenAddExpense,
  onOpenCreateGroup,
  onOpenSettleUp,
}) => {
  const {
    currentUser,
    groups,
    expenses,
    settlements,
    navigateTo,
    getMemberName,
    getMember,
  } = useSplitMate();

  // Compute overall stats across all groups
  const stats = useMemo(() => {
    return calculateDashboardStats(
      currentUser.id,
      groups,
      expenses,
      settlements,
      getMemberName
    );
  }, [currentUser.id, groups, expenses, settlements, getMemberName]);

  // Aggregate pending debts involving current user
  const userPendingDebts = useMemo(() => {
    const list: {
      groupId: string;
      groupName: string;
      isOwedToUser: boolean;
      otherMemberId: string;
      otherMemberName: string;
      amountInPaise: number;
    }[] = [];

    groups.forEach((group) => {
      const balances = calculateGroupMemberBalances(group, expenses, settlements, getMemberName);
      const debts = calculateSimplifiedDebts(balances, group.id);

      debts.forEach((debt) => {
        if (debt.toMemberId === currentUser.id) {
          // Someone owes current user
          list.push({
            groupId: group.id,
            groupName: group.name,
            isOwedToUser: true,
            otherMemberId: debt.fromMemberId,
            otherMemberName: debt.fromName,
            amountInPaise: debt.amountInPaise,
          });
        } else if (debt.fromMemberId === currentUser.id) {
          // Current user owes someone
          list.push({
            groupId: group.id,
            groupName: group.name,
            isOwedToUser: false,
            otherMemberId: debt.toMemberId,
            otherMemberName: debt.toName,
            amountInPaise: debt.amountInPaise,
          });
        }
      });
    });

    return list;
  }, [groups, expenses, settlements, currentUser.id, getMemberName]);

  // Recent transactions sorted by date
  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [expenses]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Top Welcome Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
            Welcome back, {currentUser.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#A0A5AE] mt-0.5">
            Here is your financial balance across all active groups today.
          </p>
        </div>

        {/* Quick Action Button Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenAddExpense}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>

          <button
            onClick={onOpenCreateGroup}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#181B20] border border-[#2B2F36] text-[#F5F5F5] hover:bg-[#202329] hover:border-[#8FAF9A]/50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Users2 className="w-3.5 h-3.5 text-[#8FAF9A]" />
            <span className="hidden sm:inline">Create Group</span>
            <span className="sm:hidden">Group</span>
          </button>

          <button
            onClick={() => navigateTo('friends')}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#181B20] border border-[#2B2F36] text-[#A0A5AE] hover:text-[#F5F5F5] hover:bg-[#202329] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Friends"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Friends</span>
          </button>
        </div>
      </div>

      {/* 4 Required Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Group Expenses */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#181B20] border border-[#2B2F36] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A0A5AE] mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Total Spending
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#202329] flex items-center justify-center text-[#8FAF9A]">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#F5F5F5] font-mono tracking-tight">
              {formatPaise(stats.totalGroupSpendingInPaise)}
            </div>
            <p className="text-[11px] text-[#737984] mt-1">Across all your groups</p>
          </div>
        </div>

        {/* Metric 2: You are Owed (Positive) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#181B20] border border-[#2B2F36] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A0A5AE] mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#82B99A]">
              You Are Owed
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#1F292B] border border-[#2E453C] flex items-center justify-center text-[#82B99A]">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#82B99A] font-mono tracking-tight">
              {formatPaise(stats.totalOwedToUserInPaise)}
            </div>
            <p className="text-[11px] text-[#737984] mt-1">To be collected by you</p>
          </div>
        </div>

        {/* Metric 3: You Owe (Negative) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#181B20] border border-[#2B2F36] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A0A5AE] mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D99090]">
              You Owe
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#2D1F1F] border border-[#4A2D2D] flex items-center justify-center text-[#D99090]">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#D99090] font-mono tracking-tight">
              {formatPaise(stats.totalUserOwesInPaise)}
            </div>
            <p className="text-[11px] text-[#737984] mt-1">Pending payments to friends</p>
          </div>
        </div>

        {/* Metric 4: Active Groups */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#181B20] border border-[#2B2F36] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A0A5AE] mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Active Groups
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#202329] flex items-center justify-center text-[#8FAF9A]">
              <Users2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#F5F5F5] font-mono tracking-tight">
              {stats.activeGroupsCount}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
              <span className="text-[#8FAF9A] font-medium">
                Net: {formatPaiseWithSign(stats.netBalanceInPaise)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Balances & Settlements Notice if any */}
      {userPendingDebts.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#181B20] border border-[#2B2F36] shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#8FAF9A]" />
              <h2 className="text-sm font-bold text-[#F5F5F5]">Pending Settlements</h2>
            </div>
            <span className="text-xs text-[#737984]">
              {userPendingDebts.length} unresolved balance{userPendingDebts.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {userPendingDebts.map((item, idx) => (
              <div
                key={`${item.groupId}_${item.otherMemberId}_${idx}`}
                className="p-3 rounded-xl bg-[#111316] border border-[#2B2F36] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={item.otherMemberName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#F5F5F5] truncate">
                      {item.isOwedToUser ? (
                        <>
                          <span className="text-[#82B99A]">{item.otherMemberName}</span> owes you
                        </>
                      ) : (
                        <>
                          You owe <span className="text-[#D99090]">{item.otherMemberName}</span>
                        </>
                      )}
                    </p>
                    <p className="text-[11px] text-[#737984] truncate">{item.groupName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={`font-mono text-xs font-bold ${
                      item.isOwedToUser ? 'text-[#82B99A]' : 'text-[#D99090]'
                    }`}
                  >
                    {formatPaise(item.amountInPaise)}
                  </span>

                  <button
                    onClick={() => {
                      if (item.isOwedToUser) {
                        onOpenSettleUp(
                          item.groupId,
                          item.otherMemberId,
                          currentUser.id,
                          item.amountInPaise
                        );
                      } else {
                        onOpenSettleUp(
                          item.groupId,
                          currentUser.id,
                          item.otherMemberId,
                          item.amountInPaise
                        );
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#202329] border border-[#2B2F36] text-[#F5F5F5] hover:border-[#8FAF9A] hover:text-[#8FAF9A] transition-colors cursor-pointer"
                  >
                    Settle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: My Groups & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Groups (2 cols) */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#F5F5F5]">My Groups</h2>
            <button
              onClick={() => navigateTo('groups')}
              className="text-xs font-semibold text-[#8FAF9A] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all ({groups.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#181B20] border border-[#2B2F36] text-center">
              <Users2 className="w-8 h-8 text-[#737984] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#F5F5F5]">No groups created yet</p>
              <p className="text-xs text-[#737984] mt-1 max-w-sm mx-auto">
                Create your first group for a trip, flatmates, or dinners to start splitting bills.
              </p>
              <button
                onClick={onOpenCreateGroup}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Group</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {groups.map((group) => {
                const groupExpenses = expenses.filter((e) => e.groupId === group.id);
                const totalSpent = groupExpenses.reduce((s, e) => s + e.amountInPaise, 0);

                const balances = calculateGroupMemberBalances(
                  group,
                  expenses,
                  settlements,
                  getMemberName
                );
                const userBal = balances.find((b) => b.memberId === currentUser.id);
                const userNetPaise = userBal ? userBal.netBalanceInPaise : 0;

                return (
                  <div
                    key={group.id}
                    onClick={() => navigateTo('group-details', group.id)}
                    className="p-4 rounded-2xl bg-[#181B20] border border-[#2B2F36] hover:border-[#8FAF9A]/50 transition-all cursor-pointer flex flex-col justify-between group/card shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl shrink-0 p-1 bg-[#202329] border border-[#2B2F36] rounded-xl">
                            {group.icon || '🏷️'}
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-[#F5F5F5] group-hover/card:text-[#8FAF9A] transition-colors truncate">
                              {group.name}
                            </h3>
                            <span className="text-[11px] text-[#737984]">
                              {group.category} • {group.memberIds.length} members
                            </span>
                          </div>
                        </div>
                      </div>

                      {group.description && (
                        <p className="text-xs text-[#A0A5AE] line-clamp-1 mb-3">
                          {group.description}
                        </p>
                      )}

                      {/* Member avatars list */}
                      <div className="flex items-center -space-x-1.5 mb-3.5">
                        {group.memberIds.slice(0, 4).map((mId) => {
                          const m = getMember(mId);
                          return (
                            <Avatar
                              key={mId}
                              name={m?.name || 'Member'}
                              src={m?.avatar}
                              size="xs"
                              className="border-2 border-[#181B20]"
                            />
                          );
                        })}
                        {group.memberIds.length > 4 && (
                          <span className="w-6 h-6 rounded-full bg-[#202329] border-2 border-[#181B20] text-[9px] font-bold text-[#A0A5AE] flex items-center justify-center">
                            +{group.memberIds.length - 4}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#202329] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-[#737984] block">Group Total</span>
                        <span className="font-mono font-semibold text-[#F5F5F5]">
                          {formatPaise(totalSpent)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#737984] block">Your Balance</span>
                        <span
                          className={`font-mono font-bold ${
                            userNetPaise > 0
                              ? 'text-[#82B99A]'
                              : userNetPaise < 0
                              ? 'text-[#D99090]'
                              : 'text-[#A0A5AE]'
                          }`}
                        >
                          {userNetPaise === 0
                            ? 'Settled'
                            : formatPaiseWithSign(userNetPaise)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Activity & Expenses (1 col) */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#F5F5F5]">Recent Expenses</h2>
            <button
              onClick={() => navigateTo('history')}
              className="text-xs font-semibold text-[#8FAF9A] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#181B20] border border-[#2B2F36] space-y-3 shadow-xs">
            {recentExpenses.length === 0 ? (
              <p className="text-xs text-[#737984] text-center py-6">
                No recent expenses recorded yet.
              </p>
            ) : (
              recentExpenses.map((exp) => {
                const group = groups.find((g) => g.id === exp.groupId);
                const isPayer = exp.paidBy === currentUser.id;
                const payerName = isPayer ? 'You' : getMemberName(exp.paidBy);
                const userShare = exp.sharesInPaise[currentUser.id] || 0;

                // What is the personal impact for the user?
                // If user is payer: lent = total - userShare
                // If user is not payer: owes = userShare
                let impactText = 'Not involved';
                let impactClass = 'text-[#737984]';

                if (isPayer) {
                  const lent = exp.amountInPaise - userShare;
                  impactText = lent > 0 ? `You lent ${formatPaise(lent)}` : 'You paid';
                  impactClass = 'text-[#82B99A]';
                } else if (userShare > 0) {
                  impactText = `You owe ${formatPaise(userShare)}`;
                  impactClass = 'text-[#D99090]';
                }

                return (
                  <div
                    key={exp.id}
                    onClick={() => navigateTo('group-details', exp.groupId)}
                    className="p-2.5 rounded-xl bg-[#111316] border border-[#2B2F36] hover:border-[#8FAF9A]/50 transition-colors cursor-pointer flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#F5F5F5] truncate">{exp.title}</p>
                      <p className="text-[10px] text-[#737984] truncate">
                        {group?.name || 'Group'} • Paid by {payerName}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-bold text-[#F5F5F5]">
                        {formatPaise(exp.amountInPaise)}
                      </p>
                      <p className={`text-[10px] font-medium ${impactClass}`}>{impactText}</p>
                    </div>
                  </div>
                );
              })
            )}

            <button
              onClick={() => navigateTo('activity')}
              className="w-full py-2 rounded-xl text-xs font-semibold text-[#A0A5AE] hover:text-[#F5F5F5] bg-[#111316] border border-[#2B2F36] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ActivityIcon className="w-3.5 h-3.5 text-[#8FAF9A]" />
              <span>View Full Activity Feed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
