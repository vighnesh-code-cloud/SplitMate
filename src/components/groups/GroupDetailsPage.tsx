import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  ShieldCheck,
  Users,
  Settings as SettingsIcon,
  Trash2,
  Calendar,
  Receipt,
  Tag,
  DollarSign,
  UserPlus,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  Edit2
} from 'lucide-react';
import { useSplitMate } from '../../context/SplitMateContext';
import { Group, Expense, MemberBalance } from '../../types';
import {
  formatPaise,
  formatPaiseWithSign,
  calculateGroupMemberBalances,
  calculateSimplifiedDebts,
} from '../../utils/calculations';
import { Avatar } from '../common/Avatar';
import { ConfirmModal } from '../common/ConfirmModal';

interface GroupDetailsPageProps {
  groupId: string;
  onOpenAddExpense: (groupId: string) => void;
  onOpenSettleUp: (groupId: string, payerId?: string, receiverId?: string, amount?: number) => void;
  onInspectExpense: (expense: Expense) => void;
}

export const GroupDetailsPage: React.FC<GroupDetailsPageProps> = ({
  groupId,
  onOpenAddExpense,
  onOpenSettleUp,
  onInspectExpense,
}) => {
  const {
    groups,
    expenses,
    settlements,
    activities,
    friends,
    currentUser,
    navigateTo,
    getMember,
    getMemberName,
    updateGroup,
    deleteGroup,
    addMemberToGroup,
    removeMemberFromGroup,
  } = useSplitMate();

  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settlements' | 'activity'>('expenses');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals & form state inside Group Details
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedFriendToAdd, setSelectedFriendToAdd] = useState('');
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const group = useMemo(() => groups.find((g) => g.id === groupId), [groups, groupId]);

  // If group not found, return fallback
  if (!group) {
    return (
      <div className="p-8 text-center bg-[#181B20] border border-[#2B2F36] rounded-2xl max-w-lg mx-auto">
        <p className="text-sm font-semibold text-[#F5F5F5]">Group not found</p>
        <button
          onClick={() => navigateTo('groups')}
          className="mt-3 px-4 py-2 bg-[#8FAF9A] text-[#0B0C0E] rounded-xl text-xs font-bold"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  // Filter group expenses & settlements
  const groupExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.groupId === groupId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, groupId]);

  const groupSettlements = useMemo(() => {
    return settlements
      .filter((s) => s.groupId === groupId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [settlements, groupId]);

  const groupActivities = useMemo(() => {
    return activities.filter((a) => a.groupId === groupId);
  }, [activities, groupId]);

  // Financial calculations
  const totalGroupSpending = useMemo(() => {
    return groupExpenses.reduce((sum, e) => sum + e.amountInPaise, 0);
  }, [groupExpenses]);

  const memberBalances = useMemo(() => {
    return calculateGroupMemberBalances(group, expenses, settlements, getMemberName);
  }, [group, expenses, settlements, getMemberName]);

  const simplifiedDebts = useMemo(() => {
    return calculateSimplifiedDebts(memberBalances, group.id);
  }, [memberBalances, group.id]);

  const userBalance = useMemo(() => {
    return memberBalances.find((b) => b.memberId === currentUser.id);
  }, [memberBalances, currentUser.id]);

  // Candidates for adding as members (friends not yet in this group)
  const availableFriendsToAdd = useMemo(() => {
    return friends.filter((f) => !group.memberIds.includes(f.id));
  }, [friends, group.memberIds]);

  const filteredExpenses = useMemo(() => {
    return groupExpenses.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(expenseSearch.toLowerCase()));
      const matchesCat = categoryFilter === 'All' || e.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [groupExpenses, expenseSearch, categoryFilter]);

  const handleSaveEditGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updateGroup(group.id, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });
    setIsEditGroupOpen(false);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriendToAdd) return;
    addMemberToGroup(group.id, selectedFriendToAdd);
    setSelectedFriendToAdd('');
    setIsAddMemberOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateTo('groups')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A0A5AE] hover:text-[#F5F5F5] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Groups</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditName(group.name);
              setEditDescription(group.description || '');
              setIsEditGroupOpen(true);
            }}
            className="p-2 rounded-xl bg-[#181B20] border border-[#2B2F36] text-[#A0A5AE] hover:text-[#F5F5F5] hover:border-[#8FAF9A]/50 transition-colors cursor-pointer"
            title="Edit Group"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsConfirmDeleteOpen(true)}
            className="p-2 rounded-xl bg-[#181B20] border border-[#2B2F36] text-[#D99090] hover:bg-[#3A1D1D] transition-colors cursor-pointer"
            title="Delete Group"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Group Hero Card */}
      <div className="p-6 rounded-2xl bg-[#181B20] border border-[#2B2F36] shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#202329] border border-[#2B2F36] flex items-center justify-center text-3xl shrink-0">
              {group.icon || '🏷️'}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#F5F5F5] tracking-tight">
                  {group.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#202329] border border-[#2B2F36] text-[#8FAF9A] font-semibold">
                  {group.category}
                </span>
              </div>

              {group.description && (
                <p className="text-xs text-[#A0A5AE] mt-1 max-w-xl">{group.description}</p>
              )}

              {/* Members chip row */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs text-[#737984]">
                  {group.memberIds.length} members:
                </span>
                <div className="flex items-center -space-x-1">
                  {group.memberIds.map((mId) => {
                    const m = getMember(mId);
                    return (
                      <Avatar
                        key={mId}
                        name={m?.name || 'Member'}
                        src={m?.avatar}
                        size="xs"
                        className="border border-[#181B20]"
                      />
                    );
                  })}
                </div>
                <button
                  onClick={() => setIsAddMemberOpen(true)}
                  className="text-xs font-semibold text-[#8FAF9A] hover:underline flex items-center gap-1 ml-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>
            </div>
          </div>

          {/* Group Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0">
            <button
              onClick={() => onOpenSettleUp(group.id)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#202329] border border-[#2B2F36] text-[#F5F5F5] hover:border-[#8FAF9A] hover:text-[#8FAF9A] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-[#8FAF9A]" />
              <span>Settle Up</span>
            </button>

            <button
              onClick={() => onOpenAddExpense(group.id)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Balance Status Banner */}
        <div className="mt-6 pt-5 border-t border-[#2B2F36] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#111316] border border-[#2B2F36]">
            <span className="text-[10px] text-[#737984] uppercase tracking-wider block">
              Total Group Spending
            </span>
            <span className="text-base font-mono font-black text-[#F5F5F5] mt-0.5 block">
              {formatPaise(totalGroupSpending)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#111316] border border-[#2B2F36]">
            <span className="text-[10px] text-[#737984] uppercase tracking-wider block">
              Your Share in Group
            </span>
            <span className="text-base font-mono font-bold text-[#A0A5AE] mt-0.5 block">
              {userBalance ? formatPaise(userBalance.totalShareInPaise) : '₹0'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#111316] border border-[#2B2F36]">
            <span className="text-[10px] text-[#737984] uppercase tracking-wider block">
              Your Net Position
            </span>
            <span
              className={`text-base font-mono font-black mt-0.5 block ${
                userBalance && userBalance.netBalanceInPaise > 0
                  ? 'text-[#82B99A]'
                  : userBalance && userBalance.netBalanceInPaise < 0
                  ? 'text-[#D99090]'
                  : 'text-[#A0A5AE]'
              }`}
            >
              {userBalance
                ? userBalance.netBalanceInPaise === 0
                  ? 'All settled up'
                  : formatPaiseWithSign(userBalance.netBalanceInPaise)
                : '₹0'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-[#2B2F36] pb-1">
        {[
          { id: 'expenses', label: `Expenses (${groupExpenses.length})`, icon: Receipt },
          { id: 'balances', label: 'Balances & Debts', icon: DollarSign },
          { id: 'settlements', label: `Settlements (${groupSettlements.length})`, icon: ShieldCheck },
          { id: 'activity', label: 'Activity', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#181B20] text-[#8FAF9A] border border-[#2B2F36]'
                  : 'text-[#737984] hover:text-[#F5F5F5]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Expenses List */}
      {activeTab === 'expenses' && (
        <div className="space-y-3">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#737984]" />
              <input
                type="text"
                placeholder="Search group expenses..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="w-full bg-[#181B20] border border-[#2B2F36] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F5F5F5] placeholder-[#737984] focus:outline-hidden focus:border-[#8FAF9A]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#181B20] border border-[#2B2F36] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-hidden"
              >
                <option value="All">All Categories</option>
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Accommodation">Accommodation</option>
                <option value="Shopping">Shopping</option>
                <option value="Bills">Bills</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#181B20] border border-[#2B2F36] text-center">
              <Receipt className="w-8 h-8 text-[#737984] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#F5F5F5]">No expenses logged yet</p>
              <p className="text-xs text-[#737984] mt-1 max-w-sm mx-auto">
                Add an expense to start tracking who paid and who owes money in this group.
              </p>
              <button
                onClick={() => onOpenAddExpense(group.id)}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Expense</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredExpenses.map((exp) => {
                const payer = getMember(exp.paidBy);
                const isPayer = exp.paidBy === currentUser.id;
                const userShare = exp.sharesInPaise[currentUser.id] || 0;

                let impactLabel = 'Not involved';
                let impactStyle = 'text-[#737984]';

                if (isPayer) {
                  const lent = exp.amountInPaise - userShare;
                  impactLabel = lent > 0 ? `You lent ${formatPaise(lent)}` : 'You paid';
                  impactStyle = 'text-[#82B99A]';
                } else if (userShare > 0) {
                  impactLabel = `You owe ${formatPaise(userShare)}`;
                  impactStyle = 'text-[#D99090]';
                }

                return (
                  <div
                    key={exp.id}
                    onClick={() => onInspectExpense(exp)}
                    className="p-3.5 rounded-xl bg-[#181B20] border border-[#2B2F36] hover:border-[#8FAF9A]/60 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#202329] border border-[#2B2F36] flex items-center justify-center text-sm shrink-0">
                        {exp.category === 'Food'
                          ? '🍽️'
                          : exp.category === 'Travel'
                          ? '🚕'
                          : exp.category === 'Accommodation'
                          ? '🏨'
                          : exp.category === 'Shopping'
                          ? '🛍️'
                          : exp.category === 'Bills'
                          ? '⚡'
                          : exp.category === 'Entertainment'
                          ? '🎬'
                          : '📝'}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-[#F5F5F5] truncate">
                          {exp.title}
                        </p>
                        <p className="text-[11px] text-[#737984] truncate">
                          Paid by{' '}
                          <span className="text-[#A0A5AE] font-semibold">{payer?.name}</span> •{' '}
                          {new Date(exp.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          • {exp.participantIds.length} members
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs sm:text-sm font-mono font-black text-[#F5F5F5]">
                        {formatPaise(exp.amountInPaise)}
                      </p>
                      <p className={`text-[11px] font-semibold ${impactStyle}`}>{impactLabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Balances & Simplified Debts */}
      {activeTab === 'balances' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Individual Member Balances */}
          <div className="p-5 rounded-2xl bg-[#181B20] border border-[#2B2F36] space-y-4">
            <h3 className="text-sm font-bold text-[#F5F5F5]">Member Balances</h3>

            <div className="space-y-2.5">
              {memberBalances.map((mb) => {
                const member = getMember(mb.memberId);
                const isCurrentUser = mb.memberId === currentUser.id;

                return (
                  <div
                    key={mb.memberId}
                    className="p-3 rounded-xl bg-[#111316] border border-[#2B2F36] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={member?.name || 'Member'} src={member?.avatar} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#F5F5F5] truncate">
                          {member?.name} {isCurrentUser && '(You)'}
                        </p>
                        <p className="text-[10px] text-[#737984]">
                          Paid {formatPaise(mb.totalPaidInPaise)} • Share{' '}
                          {formatPaise(mb.totalShareInPaise)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-mono font-bold ${
                          mb.netBalanceInPaise > 0
                            ? 'text-[#82B99A]'
                            : mb.netBalanceInPaise < 0
                            ? 'text-[#D99090]'
                            : 'text-[#A0A5AE]'
                        }`}
                      >
                        {mb.netBalanceInPaise === 0
                          ? 'Settled'
                          : formatPaiseWithSign(mb.netBalanceInPaise)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simplified Debt Routing ("Who Owes Whom") */}
          <div className="p-5 rounded-2xl bg-[#181B20] border border-[#2B2F36] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F5F5F5]">Who Owes Whom</h3>
              <span className="text-[11px] text-[#737984]">Simplified Graph</span>
            </div>

            {simplifiedDebts.length === 0 ? (
              <div className="p-8 text-center bg-[#111316] rounded-xl border border-[#2B2F36]">
                <CheckCircle2 className="w-8 h-8 text-[#82B99A] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#F5F5F5]">Everyone is all settled up!</p>
                <p className="text-[11px] text-[#737984] mt-0.5">
                  No debts currently outstanding in this group.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {simplifiedDebts.map((debt, idx) => {
                  const fromM = getMember(debt.fromMemberId);
                  const toM = getMember(debt.toMemberId);
                  const isCurrentInvolved =
                    debt.fromMemberId === currentUser.id || debt.toMemberId === currentUser.id;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isCurrentInvolved
                          ? 'bg-[#14171C] border-[#8FAF9A]/50'
                          : 'bg-[#111316] border-[#2B2F36]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={fromM?.name || 'Member'} size="xs" />
                        <span className="text-xs font-semibold text-[#F5F5F5] truncate">
                          {fromM?.name}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#737984] shrink-0" />
                        <Avatar name={toM?.name || 'Member'} size="xs" />
                        <span className="text-xs font-semibold text-[#F5F5F5] truncate">
                          {toM?.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-xs font-mono font-bold text-[#82B99A]">
                          {formatPaise(debt.amountInPaise)}
                        </span>
                        <button
                          onClick={() =>
                            onOpenSettleUp(
                              group.id,
                              debt.fromMemberId,
                              debt.toMemberId,
                              debt.amountInPaise
                            )
                          }
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#202329] border border-[#2B2F36] text-[#F5F5F5] hover:border-[#8FAF9A] hover:text-[#8FAF9A] transition-colors cursor-pointer"
                        >
                          Settle
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Settlements History */}
      {activeTab === 'settlements' && (
        <div className="space-y-3">
          {groupSettlements.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#181B20] border border-[#2B2F36] text-center">
              <ShieldCheck className="w-8 h-8 text-[#737984] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#F5F5F5]">No settlements recorded yet</p>
              <p className="text-xs text-[#737984] mt-1">
                When friends pay each other back, record it here to clear debts.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {groupSettlements.map((settlement) => {
                const payer = getMember(settlement.paidBy);
                const receiver = getMember(settlement.paidTo);

                return (
                  <div
                    key={settlement.id}
                    className="p-3.5 rounded-xl bg-[#181B20] border border-[#2B2F36] flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#1F292B] border border-[#2E453C] flex items-center justify-center text-[#82B99A] shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-[#F5F5F5] truncate">
                          <span className="font-bold">{payer?.name}</span> paid{' '}
                          <span className="font-bold">{receiver?.name}</span>
                        </p>
                        <p className="text-[11px] text-[#737984]">
                          {new Date(settlement.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          • via {settlement.paymentMethod}
                          {settlement.notes && ` (${settlement.notes})`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-mono font-bold text-[#82B99A]">
                        {formatPaise(settlement.amountInPaise)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Group Activity */}
      {activeTab === 'activity' && (
        <div className="space-y-2.5">
          {groupActivities.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#181B20] border border-[#2B2F36] text-center">
              <Sparkles className="w-8 h-8 text-[#737984] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#F5F5F5]">No activity logged yet</p>
            </div>
          ) : (
            groupActivities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl bg-[#181B20] border border-[#2B2F36] flex items-start gap-3 shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-[#202329] border border-[#2B2F36] flex items-center justify-center text-[#8FAF9A] shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#F5F5F5]">{act.description}</p>
                  <p className="text-[10px] text-[#737984] mt-0.5">
                    {new Date(act.timestamp).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Add Member to Group */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#181B20] border border-[#2B2F36] rounded-2xl p-5 shadow-2xl relative text-[#F5F5F5]">
            <h3 className="text-base font-bold text-[#F5F5F5] mb-1">Add Member to Group</h3>
            <p className="text-xs text-[#A0A5AE] mb-4">
              Choose an existing friend to add to "{group.name}".
            </p>

            <form onSubmit={handleAddMember} className="space-y-4">
              {availableFriendsToAdd.length === 0 ? (
                <div className="text-center py-4 text-xs text-[#737984]">
                  All your friends are already in this group. You can add more friends in the Friends
                  tab.
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1.5">
                    Select Friend
                  </label>
                  <select
                    value={selectedFriendToAdd}
                    onChange={(e) => setSelectedFriendToAdd(e.target.value)}
                    required
                    className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:border-[#8FAF9A]"
                  >
                    <option value="">-- Choose friend --</option>
                    {availableFriendsToAdd.map((f) => (
                      <option key={f.id} value={f.id} className="bg-[#181B20]">
                        {f.name} {f.email ? `(${f.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#A0A5AE] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFriendToAdd}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] disabled:opacity-50"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Group Details */}
      {isEditGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#181B20] border border-[#2B2F36] rounded-2xl p-5 shadow-2xl relative text-[#F5F5F5]">
            <h3 className="text-base font-bold text-[#F5F5F5] mb-3">Edit Group</h3>
            <form onSubmit={handleSaveEditGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#A0A5AE] mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:border-[#8FAF9A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A5AE] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:border-[#8FAF9A] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditGroupOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#A0A5AE] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Group */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Delete Group"
        message={`Are you sure you want to delete "${group.name}"? All associated expenses and settlement records for this group will be permanently removed.`}
        confirmLabel="Delete Group"
        isDestructive={true}
        onCancel={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => {
          setIsConfirmDeleteOpen(false);
          deleteGroup(group.id);
        }}
      />
    </div>
  );
};
