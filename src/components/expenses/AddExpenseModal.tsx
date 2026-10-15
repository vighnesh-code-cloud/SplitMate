import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, AlertCircle, Percent, DollarSign, Split, Users } from 'lucide-react';
import { useSplitMate } from '../../context/SplitMateContext';
import { Expense, ExpenseCategory, SplitMethod, Group } from '../../types';
import {
  formatPaise,
  parseRupeesToPaise,
  calculateEqualSplit,
} from '../../utils/calculations';
import { Avatar } from '../common/Avatar';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: string; // Preselected group ID
  expenseToEdit?: Expense | null;
}

const CATEGORIES: { label: ExpenseCategory; icon: string }[] = [
  { label: 'Food', icon: '🍽️' },
  { label: 'Travel', icon: '🚕' },
  { label: 'Accommodation', icon: '🏨' },
  { label: 'Shopping', icon: '🛍️' },
  { label: 'Bills', icon: '⚡' },
  { label: 'Entertainment', icon: '🎬' },
  { label: 'Other', icon: '📝' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  groupId: initialGroupId,
  expenseToEdit,
}) => {
  const { groups, currentUser, addExpense, updateExpense, getMemberName, getMember } =
    useSplitMate();

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    initialGroupId || (groups[0] ? groups[0].id : '')
  );

  const currentGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || groups[0];
  }, [groups, selectedGroupId]);

  const [title, setTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [paidBy, setPaidBy] = useState<string>(currentUser.id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [notes, setNotes] = useState('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  
  // Custom split values: mapped by memberId
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [unequalShares, setUnequalShares] = useState<Record<string, string>>({});

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form when modal opens or group/expense changes
  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setSelectedGroupId(expenseToEdit.groupId);
        setTitle(expenseToEdit.title);
        setAmountInput((expenseToEdit.amountInPaise / 100).toString());
        setPaidBy(expenseToEdit.paidBy);
        setDate(expenseToEdit.date);
        setCategory(expenseToEdit.category);
        setNotes(expenseToEdit.notes || '');
        setSplitMethod(expenseToEdit.splitMethod);
        setSelectedParticipants(expenseToEdit.participantIds);

        const exact: Record<string, string> = {};
        const pcts: Record<string, string> = {};
        const unequal: Record<string, string> = {};

        expenseToEdit.participantIds.forEach((pid) => {
          const sharePaise = expenseToEdit.sharesInPaise[pid] || 0;
          exact[pid] = (sharePaise / 100).toString();
          pcts[pid] = (
            (sharePaise / expenseToEdit.amountInPaise) *
            100
          ).toFixed(1);
          unequal[pid] = (sharePaise / 100).toString();
        });

        setExactAmounts(exact);
        setPercentages(pcts);
        setUnequalShares(unequal);
      } else {
        const activeGroup = initialGroupId
          ? groups.find((g) => g.id === initialGroupId) || groups[0]
          : groups[0];
        
        if (activeGroup) {
          setSelectedGroupId(activeGroup.id);
          setSelectedParticipants([...activeGroup.memberIds]);
        }
        setTitle('');
        setAmountInput('');
        setPaidBy(currentUser.id);
        setDate(new Date().toISOString().split('T')[0]);
        setCategory('Food');
        setNotes('');
        setSplitMethod('equal');
        setExactAmounts({});
        setPercentages({});
        setUnequalShares({});
      }
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialGroupId, expenseToEdit, groups, currentUser.id]);

  // When group changes and not editing, update members
  const handleGroupChange = (newGroupId: string) => {
    setSelectedGroupId(newGroupId);
    const g = groups.find((grp) => grp.id === newGroupId);
    if (g) {
      setSelectedParticipants([...g.memberIds]);
      if (!g.memberIds.includes(paidBy)) {
        setPaidBy(g.memberIds[0] || currentUser.id);
      }
    }
  };

  const totalPaise = useMemo(() => {
    return parseRupeesToPaise(amountInput);
  }, [amountInput]);

  // Toggle participant inclusion
  const toggleParticipant = (memberId: string) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(memberId)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter((id) => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  // Compute calculated shares based on split method
  const calculatedShares = useMemo<Record<string, number>>(() => {
    if (!totalPaise || totalPaise <= 0 || !selectedParticipants.length) {
      return {};
    }

    if (splitMethod === 'equal') {
      return calculateEqualSplit(totalPaise, selectedParticipants);
    }

    if (splitMethod === 'exact') {
      const shares: Record<string, number> = {};
      selectedParticipants.forEach((pid) => {
        shares[pid] = parseRupeesToPaise(exactAmounts[pid] || 0);
      });
      return shares;
    }

    if (splitMethod === 'percentage') {
      const shares: Record<string, number> = {};
      let distributedPaise = 0;
      selectedParticipants.forEach((pid, idx) => {
        const pct = parseFloat(percentages[pid] || '0');
        if (idx === selectedParticipants.length - 1) {
          // Last participant gets exact remaining to guarantee total
          shares[pid] = Math.max(0, totalPaise - distributedPaise);
        } else {
          const share = Math.round((totalPaise * pct) / 100);
          shares[pid] = share;
          distributedPaise += share;
        }
      });
      return shares;
    }

    if (splitMethod === 'unequal') {
      const shares: Record<string, number> = {};
      selectedParticipants.forEach((pid) => {
        shares[pid] = parseRupeesToPaise(unequalShares[pid] || 0);
      });
      return shares;
    }

    return {};
  }, [totalPaise, splitMethod, selectedParticipants, exactAmounts, percentages, unequalShares]);

  // Validation
  const splitValidation = useMemo(() => {
    if (totalPaise <= 0) return { isValid: false, message: 'Enter a valid amount' };
    if (!selectedParticipants.length) return { isValid: false, message: 'Select at least one participant' };

    const sumAllocated = Object.values(calculatedShares).reduce((a, b) => a + b, 0);

    if (splitMethod === 'exact' || splitMethod === 'unequal') {
      const diff = totalPaise - sumAllocated;
      if (Math.abs(diff) > 2) {
        return {
          isValid: false,
          message: `Allocated shares (${formatPaise(sumAllocated)}) must equal total (${formatPaise(totalPaise)}). Diff: ${formatPaise(diff)}`,
        };
      }
    }

    if (splitMethod === 'percentage') {
      const totalPct = selectedParticipants.reduce(
        (sum, pid) => sum + (parseFloat(percentages[pid] || '0') || 0),
        0
      );
      if (Math.abs(totalPct - 100) > 0.1) {
        return {
          isValid: false,
          message: `Percentages must total 100% (currently ${totalPct.toFixed(1)}%)`,
        };
      }
    }

    return { isValid: true, message: '' };
  }, [totalPaise, selectedParticipants, splitMethod, calculatedShares, percentages]);

  if (!isOpen || !currentGroup) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an expense title');
      return;
    }

    if (totalPaise <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (!splitValidation.isValid) {
      setError(splitValidation.message);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (expenseToEdit) {
        updateExpense(expenseToEdit.id, {
          groupId: selectedGroupId,
          title: title.trim(),
          amountInPaise: totalPaise,
          paidBy,
          participantIds: selectedParticipants,
          sharesInPaise: calculatedShares,
          splitMethod,
          category,
          notes: notes.trim() || undefined,
          date,
        });
      } else {
        addExpense({
          groupId: selectedGroupId,
          title: title.trim(),
          amountInPaise: totalPaise,
          paidBy,
          participantIds: selectedParticipants,
          sharesInPaise: calculatedShares,
          splitMethod,
          category,
          notes: notes.trim() || undefined,
          date,
        });
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save expense');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="w-full max-w-lg bg-[#181B20] border border-[#2B2F36] rounded-2xl shadow-2xl relative text-[#F5F5F5] overflow-hidden my-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2B2F36] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#202329] border border-[#2B2F36] flex items-center justify-center text-sm">
              ₹
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F5F5F5]">
                {expenseToEdit ? 'Edit Expense' : 'Add Expense'}
              </h2>
              <p className="text-xs text-[#A0A5AE]">
                {currentGroup.name} • {currentGroup.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#737984] hover:text-[#F5F5F5] p-1.5 rounded-lg hover:bg-[#202329] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-[#3A1D1D] border border-[#522828] rounded-xl text-xs text-[#D99090] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Group Selector if multiple */}
          {groups.length > 1 && !expenseToEdit && (
            <div>
              <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1">
                Select Group
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id} className="bg-[#181B20]">
                    {g.icon || '🏷️'} {g.name} ({g.memberIds.length} members)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title & Amount row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1">
                Expense Title <span className="text-[#8FAF9A]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dinner, Villa Booking, Groceries"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3.5 py-2.5 text-sm text-[#F5F5F5] placeholder-[#737984] focus:outline-hidden focus:border-[#8FAF9A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1">
                Amount (₹) <span className="text-[#8FAF9A]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-[#8FAF9A] font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="1500"
                  value={amountInput}
                  onChange={(e) => {
                    setAmountInput(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl pl-7 pr-3 py-2.5 text-sm font-semibold text-[#F5F5F5] placeholder-[#737984] focus:outline-hidden focus:border-[#8FAF9A]"
                />
              </div>
            </div>
          </div>

          {/* Paid by & Date row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1">
                Paid By
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
              >
                {currentGroup.memberIds.map((mId) => (
                  <option key={mId} value={mId} className="bg-[#181B20]">
                    {getMemberName(mId)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
              />
            </div>
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.label}
                  onClick={() => setCategory(cat.label)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all cursor-pointer ${
                    category === cat.label
                      ? 'bg-[#202329] border-[#8FAF9A] text-[#F5F5F5]'
                      : 'bg-[#111316] border-[#2B2F36] text-[#A0A5AE] hover:border-[#3B4049]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Split Method Tabs */}
          <div className="pt-2 border-t border-[#2B2F36]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider">
                Split Method
              </label>
              <span className="text-[11px] text-[#737984]">
                {selectedParticipants.length} of {currentGroup.memberIds.length} included
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 p-1 bg-[#111316] border border-[#2B2F36] rounded-xl mb-3">
              {[
                { id: 'equal', label: 'Equal', icon: Split },
                { id: 'unequal', label: 'Unequal', icon: Users },
                { id: 'percentage', label: '% Pct', icon: Percent },
                { id: 'exact', label: 'Exact ₹', icon: DollarSign },
              ].map((m) => {
                const Icon = m.icon;
                const active = splitMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSplitMethod(m.id as SplitMethod)}
                    className={`py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      active
                        ? 'bg-[#202329] text-[#8FAF9A] shadow-xs font-semibold'
                        : 'text-[#A0A5AE] hover:text-[#F5F5F5]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Participants list & shares preview */}
            <div className="space-y-2 bg-[#111316] border border-[#2B2F36] rounded-xl p-3">
              <div className="flex items-center justify-between text-[11px] text-[#A0A5AE] pb-1 border-b border-[#202329]">
                <span>Participant</span>
                <span>Calculated Share</span>
              </div>

              {currentGroup.memberIds.map((mId) => {
                const isChecked = selectedParticipants.includes(mId);
                const member = getMember(mId);
                const sharePaise = calculatedShares[mId] || 0;

                return (
                  <div
                    key={mId}
                    className="flex items-center justify-between py-1.5 gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleParticipant(mId)}
                        className="rounded border-[#2B2F36] text-[#8FAF9A] focus:ring-0 focus:ring-offset-0 bg-[#181B20] w-4 h-4 cursor-pointer"
                      />
                      <Avatar name={member?.name || 'Member'} src={member?.avatar} size="xs" />
                      <span className={`truncate ${isChecked ? 'text-[#F5F5F5]' : 'text-[#737984]'}`}>
                        {member?.name}
                      </span>
                    </div>

                    {/* Input or Live calculation */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {splitMethod === 'percentage' && isChecked && (
                        <div className="relative w-16">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="%"
                            value={percentages[mId] || ''}
                            onChange={(e) =>
                              setPercentages((prev) => ({ ...prev, [mId]: e.target.value }))
                            }
                            className="w-full bg-[#181B20] border border-[#2B2F36] rounded-md px-1.5 py-1 text-right text-xs text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
                          />
                          <span className="absolute right-1.5 top-1 text-[10px] text-[#737984] pointer-events-none">%</span>
                        </div>
                      )}

                      {(splitMethod === 'exact' || splitMethod === 'unequal') && isChecked && (
                        <div className="relative w-20">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="₹"
                            value={
                              splitMethod === 'exact'
                                ? exactAmounts[mId] || ''
                                : unequalShares[mId] || ''
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (splitMethod === 'exact') {
                                setExactAmounts((prev) => ({ ...prev, [mId]: val }));
                              } else {
                                setUnequalShares((prev) => ({ ...prev, [mId]: val }));
                              }
                            }}
                            className="w-full bg-[#181B20] border border-[#2B2F36] rounded-md px-1.5 py-1 text-right text-xs text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
                          />
                        </div>
                      )}

                      <span className={`font-mono text-xs font-semibold ${isChecked ? 'text-[#82B99A]' : 'text-[#737984]'}`}>
                        {isChecked ? formatPaise(sharePaise) : '₹0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Split validation warning if unequal or percentage doesn't match */}
            {!splitValidation.isValid && (
              <p className="mt-1.5 text-[11px] text-[#D99090]">{splitValidation.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1">
              Notes <span className="text-[#737984] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Receipt #1042 or details"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] placeholder-[#737984] focus:outline-hidden focus:border-[#8FAF9A]"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A0A5AE] hover:text-[#F5F5F5] hover:bg-[#202329] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || totalPaise <= 0 || !splitValidation.isValid}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              {isSubmitting ? 'Saving...' : expenseToEdit ? 'Save Changes' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
