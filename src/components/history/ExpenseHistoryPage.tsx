import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Filter,
  Receipt,
  Calendar,
  ArrowUpDown,
  Tag,
  ShieldCheck,
  ChevronRight,
  Trash2,
  Edit2,
  FileSpreadsheet
} from 'lucide-react';
import { useSplitMate } from '../../context/SplitMateContext';
import { Expense, Settlement, ExpenseCategory } from '../../types';
import { formatPaise } from '../../utils/calculations';
import { Avatar } from '../common/Avatar';

interface ExpenseHistoryPageProps {
  onInspectExpense: (expense: Expense) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpenseHistoryPage: React.FC<ExpenseHistoryPageProps> = ({
  onInspectExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const { expenses, settlements, groups, currentUser, getMemberName, getMember, showToast } =
    useSplitMate();

  const [search, setSearch] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [transactionType, setTransactionType] = useState<'all' | 'expenses' | 'settlements'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'amount-high' | 'amount-low'>('newest');

  // Combined records for historical ledger
  const unifiedRecords = useMemo(() => {
    const list: (
      | { type: 'expense'; data: Expense }
      | { type: 'settlement'; data: Settlement }
    )[] = [];

    if (transactionType === 'all' || transactionType === 'expenses') {
      expenses.forEach((e) => list.push({ type: 'expense', data: e }));
    }

    if (transactionType === 'all' || transactionType === 'settlements') {
      settlements.forEach((s) => list.push({ type: 'settlement', data: s }));
    }

    // Filter
    return list
      .filter((item) => {
        const matchesGroup =
          selectedGroupId === 'All' || item.data.groupId === selectedGroupId;

        if (!matchesGroup) return false;

        if (item.type === 'expense') {
          const exp = item.data;
          const matchesCat =
            selectedCategory === 'All' || exp.category === selectedCategory;
          const matchesSearch =
            exp.title.toLowerCase().includes(search.toLowerCase()) ||
            (exp.notes && exp.notes.toLowerCase().includes(search.toLowerCase())) ||
            getMemberName(exp.paidBy).toLowerCase().includes(search.toLowerCase());

          return matchesCat && matchesSearch;
        } else {
          // settlement
          if (selectedCategory !== 'All') return false; // settlements have no expense category
          const set = item.data;
          const payerName = getMemberName(set.paidBy).toLowerCase();
          const receiverName = getMemberName(set.paidTo).toLowerCase();
          const matchesSearch =
            payerName.includes(search.toLowerCase()) ||
            receiverName.includes(search.toLowerCase()) ||
            (set.notes && set.notes.toLowerCase().includes(search.toLowerCase())) ||
            'settlement'.includes(search.toLowerCase());

          return matchesSearch;
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a.data.date).getTime();
        const dateB = new Date(b.data.date).getTime();

        if (sortOrder === 'newest') return dateB - dateA;
        if (sortOrder === 'oldest') return dateA - dateB;
        if (sortOrder === 'amount-high') return b.data.amountInPaise - a.data.amountInPaise;
        if (sortOrder === 'amount-low') return a.data.amountInPaise - b.data.amountInPaise;
        return dateB - dateA;
      });
  }, [
    expenses,
    settlements,
    transactionType,
    selectedGroupId,
    selectedCategory,
    search,
    sortOrder,
    getMemberName,
  ]);

  // Export CSV
  const handleExportCSV = () => {
    if (!unifiedRecords.length) {
      showToast('No records to export', 'info');
      return;
    }

    const headers = [
      'Type',
      'Date',
      'Title / Description',
      'Group',
      'Payer / From',
      'Receiver / Participants',
      'Category / Method',
      'Amount (INR)',
      'Notes',
    ];

    const rows = unifiedRecords.map((item) => {
      const grp = groups.find((g) => g.id === item.data.groupId);
      const groupName = grp ? grp.name : 'Unknown Group';
      const rupees = (item.data.amountInPaise / 100).toFixed(2);

      if (item.type === 'expense') {
        const exp = item.data;
        const payer = getMemberName(exp.paidBy);
        const participantNames = exp.participantIds.map((p) => getMemberName(p)).join('; ');
        return [
          'Expense',
          exp.date,
          `"${exp.title.replace(/"/g, '""')}"`,
          `"${groupName.replace(/"/g, '""')}"`,
          `"${payer.replace(/"/g, '""')}"`,
          `"${participantNames.replace(/"/g, '""')}"`,
          exp.category,
          rupees,
          `"${(exp.notes || '').replace(/"/g, '""')}"`,
        ];
      } else {
        const set = item.data;
        const payer = getMemberName(set.paidBy);
        const receiver = getMemberName(set.paidTo);
        return [
          'Settlement',
          set.date,
          `"Settlement to ${receiver}"`,
          `"${groupName.replace(/"/g, '""')}"`,
          `"${payer.replace(/"/g, '""')}"`,
          `"${receiver.replace(/"/g, '""')}"`,
          set.paymentMethod,
          rupees,
          `"${(set.notes || '').replace(/"/g, '""')}"`,
        ];
      }
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `splitmate_expenses_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exported CSV successfully!');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F5] tracking-tight">
            Expense History
          </h1>
          <p className="text-xs sm:text-sm text-[#A0A5AE] mt-0.5">
            Complete audited ledger of past group expenses, settlements, and member shares.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#181B20] border border-[#2B2F36] text-[#F5F5F5] hover:bg-[#202329] hover:border-[#8FAF9A]/50 transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#8FAF9A]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#181B20] border border-[#2B2F36] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#737984]" />
            <input
              type="text"
              placeholder="Search by title, notes, payer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5F5F5] placeholder-[#737984] focus:outline-hidden focus:border-[#8FAF9A]"
            />
          </div>

          {/* Group Filter */}
          <div>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
            >
              <option value="All">All Groups ({groups.length})</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id} className="bg-[#181B20]">
                  {g.icon || '🏷️'} {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
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

          {/* Sort Order */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
            >
              <option value="newest">Sort: Newest first</option>
              <option value="oldest">Sort: Oldest first</option>
              <option value="amount-high">Amount: High to low</option>
              <option value="amount-low">Amount: Low to high</option>
            </select>
          </div>
        </div>

        {/* Transaction Type Tabs */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-[#202329]">
          <span className="text-[11px] font-semibold text-[#737984] mr-2">Filter type:</span>
          {(['all', 'expenses', 'settlements'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTransactionType(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                transactionType === t
                  ? 'bg-[#202329] text-[#8FAF9A] border border-[#2B2F36]'
                  : 'text-[#737984] hover:text-[#F5F5F5]'
              }`}
            >
              {t}
            </button>
          ))}
          <span className="ml-auto text-xs text-[#737984]">
            {unifiedRecords.length} records found
          </span>
        </div>
      </div>

      {/* Ledger Records List */}
      {unifiedRecords.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#181B20] border border-[#2B2F36] text-center max-w-md mx-auto">
          <Receipt className="w-10 h-10 text-[#737984] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#F5F5F5]">No transactions found</h3>
          <p className="text-xs text-[#737984] mt-1">
            Try adjusting your search criteria or filters above.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {unifiedRecords.map((item) => {
            const isExpense = item.type === 'expense';
            const grp = groups.find((g) => g.id === item.data.groupId);

            if (isExpense) {
              const exp = item.data as Expense;
              const payer = getMember(exp.paidBy);
              const isPayer = exp.paidBy === currentUser.id;
              const userShare = exp.sharesInPaise[currentUser.id] || 0;

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
                  key={`exp_${exp.id}`}
                  onClick={() => onInspectExpense(exp)}
                  className="p-3.5 sm:p-4 rounded-xl bg-[#181B20] border border-[#2B2F36] hover:border-[#8FAF9A]/60 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
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
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-bold text-[#F5F5F5] truncate">
                          {exp.title}
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#111316] border border-[#2B2F36] text-[#8FAF9A] font-medium hidden sm:inline-block">
                          {exp.category}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#737984] truncate mt-0.5">
                        {grp?.name || 'Group'} • Paid by{' '}
                        <span className="text-[#A0A5AE] font-semibold">{payer?.name}</span> •{' '}
                        {new Date(exp.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-mono font-black text-[#F5F5F5]">
                        {formatPaise(exp.amountInPaise)}
                      </p>
                      <p className={`text-[11px] font-semibold ${impactClass}`}>{impactText}</p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#737984]" />
                  </div>
                </div>
              );
            } else {
              // Settlement record
              const set = item.data as Settlement;
              const payer = getMember(set.paidBy);
              const receiver = getMember(set.paidTo);

              return (
                <div
                  key={`set_${set.id}`}
                  className="p-3.5 sm:p-4 rounded-xl bg-[#181B20] border border-[#2B2F36] flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#1F292B] border border-[#2E453C] flex items-center justify-center text-[#82B99A] shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#F5F5F5] truncate">
                        Settlement: {payer?.name} → {receiver?.name}
                      </p>

                      <p className="text-[11px] text-[#737984] truncate mt-0.5">
                        {grp?.name || 'Group'} • via {set.paymentMethod} •{' '}
                        {new Date(set.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {set.notes && ` (${set.notes})`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-mono font-bold text-[#82B99A]">
                      {formatPaise(set.amountInPaise)}
                    </span>
                    <p className="text-[10px] text-[#737984]">Settled</p>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
};
