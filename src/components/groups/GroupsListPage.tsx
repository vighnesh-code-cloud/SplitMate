import React, { useState, useMemo } from 'react';
import { Plus, Users2, Search, ArrowRight, DollarSign } from 'lucide-react';
import { useSplitMate } from '../../context/SplitMateContext';
import { formatPaise, formatPaiseWithSign, calculateGroupMemberBalances } from '../../utils/calculations';
import { Avatar } from '../common/Avatar';
import { GroupCategory } from '../../types';

interface GroupsListPageProps {
  onOpenCreateGroup: () => void;
  onOpenAddExpense: () => void;
}

export const GroupsListPage: React.FC<GroupsListPageProps> = ({
  onOpenCreateGroup,
  onOpenAddExpense,
}) => {
  const { groups, expenses, settlements, currentUser, navigateTo, getMemberName, getMember } =
    useSplitMate();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchesSearch =
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.description && g.description.toLowerCase().includes(search.toLowerCase()));
      const matchesCat = selectedCategory === 'All' || g.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [groups, search, selectedCategory]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F5] tracking-tight">
            My Groups
          </h1>
          <p className="text-xs sm:text-sm text-[#A0A5AE] mt-0.5">
            Organize trips, housemates, dinners, and events with isolated ledgers.
          </p>
        </div>

        <button
          onClick={onOpenCreateGroup}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] shadow-md flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#737984]" />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181B20] border border-[#2B2F36] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5F5F5] placeholder-[#737984] focus:outline-hidden focus:border-[#8FAF9A]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['All', 'Trip', 'Flatmates', 'Food', 'Shopping', 'Event', 'Other'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#202329] border border-[#8FAF9A] text-[#F5F5F5]'
                  : 'bg-[#181B20] border border-[#2B2F36] text-[#A0A5AE] hover:border-[#3B4049]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#181B20] border border-[#2B2F36] text-center max-w-md mx-auto">
          <Users2 className="w-10 h-10 text-[#737984] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#F5F5F5]">No groups found</h3>
          <p className="text-xs text-[#737984] mt-1 mb-4">
            Try adjusting your search query or create a new group.
          </p>
          <button
            onClick={onOpenCreateGroup}
            className="px-4 py-2 bg-[#8FAF9A] text-[#0B0C0E] text-xs font-bold rounded-xl"
          >
            Create New Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => {
            const groupExpenses = expenses.filter((e) => e.groupId === group.id);
            const totalSpending = groupExpenses.reduce((s, e) => s + e.amountInPaise, 0);

            const balances = calculateGroupMemberBalances(group, expenses, settlements, getMemberName);
            const userBal = balances.find((b) => b.memberId === currentUser.id);
            const userNet = userBal ? userBal.netBalanceInPaise : 0;

            return (
              <div
                key={group.id}
                onClick={() => navigateTo('group-details', group.id)}
                className="p-5 rounded-2xl bg-[#181B20] border border-[#2B2F36] hover:border-[#8FAF9A]/60 transition-all cursor-pointer flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0 p-2 bg-[#202329] border border-[#2B2F36] rounded-xl">
                        {group.icon || '🏷️'}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#F5F5F5] group-hover:text-[#8FAF9A] transition-colors truncate">
                          {group.name}
                        </h3>
                        <span className="text-[11px] text-[#737984]">
                          {group.category} • {group.memberIds.length} members
                        </span>
                      </div>
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-xs text-[#A0A5AE] line-clamp-2 mb-3">
                      {group.description}
                    </p>
                  )}

                  {/* Members */}
                  <div className="flex items-center -space-x-1.5 mb-4">
                    {group.memberIds.slice(0, 5).map((mId) => {
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
                    {group.memberIds.length > 5 && (
                      <span className="w-6 h-6 rounded-full bg-[#202329] border-2 border-[#181B20] text-[9px] font-bold text-[#A0A5AE] flex items-center justify-center">
                        +{group.memberIds.length - 5}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#202329] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#737984] block">Group Spending</span>
                    <span className="font-mono font-bold text-[#F5F5F5]">
                      {formatPaise(totalSpending)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#737984] block">Your Position</span>
                    <span
                      className={`font-mono font-bold ${
                        userNet > 0
                          ? 'text-[#82B99A]'
                          : userNet < 0
                          ? 'text-[#D99090]'
                          : 'text-[#A0A5AE]'
                      }`}
                    >
                      {userNet === 0 ? 'Settled' : formatPaiseWithSign(userNet)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
