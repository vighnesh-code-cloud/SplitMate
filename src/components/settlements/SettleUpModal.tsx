import React, { useState, useEffect } from 'react';
import { X, Check, ArrowRight, ShieldCheck, Wallet, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSplitMate } from '../../context/SplitMateContext';
import { PaymentMethod } from '../../types';
import { formatPaise, parseRupeesToPaise } from '../../utils/calculations';
import { Avatar } from '../common/Avatar';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: string;
  defaultPayerId?: string;
  defaultReceiverId?: string;
  defaultAmountInPaise?: number;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'UPI', label: 'UPI / GPay / PhonePe', icon: '📱' },
  { id: 'Cash', label: 'Cash in hand', icon: '💵' },
  { id: 'Bank Transfer', label: 'Bank Transfer (IMPS/NEFT)', icon: '🏛️' },
  { id: 'Other', label: 'Other / Custom', icon: '✨' },
];

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  isOpen,
  onClose,
  groupId: initialGroupId,
  defaultPayerId,
  defaultReceiverId,
  defaultAmountInPaise,
}) => {
  const { groups, currentUser, addSettlement, getMember, getMemberName } = useSplitMate();

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    initialGroupId || (groups[0] ? groups[0].id : '')
  );

  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  const [payerId, setPayerId] = useState<string>(defaultPayerId || currentUser.id);
  const [receiverId, setReceiverId] = useState<string>(defaultReceiverId || '');
  const [amountInput, setAmountInput] = useState<string>(
    defaultAmountInPaise ? (defaultAmountInPaise / 100).toString() : ''
  );
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update receiver options when group or payer changes
  useEffect(() => {
    if (activeGroup) {
      if (!receiverId || receiverId === payerId) {
        const potentialReceiver = activeGroup.memberIds.find((id) => id !== payerId);
        if (potentialReceiver) setReceiverId(potentialReceiver);
      }
    }
  }, [activeGroup, payerId, receiverId]);

  useEffect(() => {
    if (isOpen) {
      if (initialGroupId) setSelectedGroupId(initialGroupId);
      if (defaultPayerId) setPayerId(defaultPayerId);
      if (defaultReceiverId) setReceiverId(defaultReceiverId);
      if (defaultAmountInPaise) setAmountInput((defaultAmountInPaise / 100).toString());
      setDate(new Date().toISOString().split('T')[0]);
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialGroupId, defaultPayerId, defaultReceiverId, defaultAmountInPaise]);

  if (!isOpen || !activeGroup) return null;

  const totalPaise = parseRupeesToPaise(amountInput);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!payerId || !receiverId) {
      setError('Please select both payer and receiver');
      return;
    }

    if (payerId === receiverId) {
      setError('Payer and receiver cannot be the same member');
      return;
    }

    if (totalPaise <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      addSettlement({
        groupId: selectedGroupId,
        paidBy: payerId,
        paidTo: receiverId,
        amountInPaise: totalPaise,
        date,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      // Subtle celebration confetti
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#8FAF9A', '#82B99A', '#F5F5F5'],
          disableForReducedMotion: true,
        });
      } catch {
        // Safe fallback if blocked
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to record settlement');
      setIsSubmitting(false);
    }
  };

  const payerMember = getMember(payerId);
  const receiverMember = getMember(receiverId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="w-full max-w-md bg-[#181B20] border border-[#2B2F36] rounded-2xl shadow-2xl relative text-[#F5F5F5] overflow-hidden my-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2B2F36] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2E453C] border border-[#3B594D] text-[#82B99A] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F5F5F5]">Record Settlement</h2>
              <p className="text-xs text-[#A0A5AE]">{activeGroup.name}</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-[#3A1D1D] border border-[#522828] rounded-xl text-xs text-[#D99090]">
              {error}
            </div>
          )}

          {/* Group Selector if multiple groups */}
          {groups.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1">
                Group
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id} className="bg-[#181B20]">
                    {g.icon || '🏷️'} {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Transfer Visual Direction */}
          <div className="p-3.5 bg-[#111316] border border-[#2B2F36] rounded-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <label className="block text-[11px] font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1">
                  Payer (Paid)
                </label>
                <select
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  className="w-full bg-[#181B20] border border-[#2B2F36] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:border-[#8FAF9A]"
                >
                  {activeGroup.memberIds.map((mId) => (
                    <option key={mId} value={mId} className="bg-[#181B20]">
                      {getMemberName(mId)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 text-[#8FAF9A]">
                <ArrowRight className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-[11px] font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1">
                  Recipient (Received)
                </label>
                <select
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  className="w-full bg-[#181B20] border border-[#2B2F36] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:border-[#8FAF9A]"
                >
                  {activeGroup.memberIds
                    .filter((mId) => mId !== payerId)
                    .map((mId) => (
                      <option key={mId} value={mId} className="bg-[#181B20]">
                        {getMemberName(mId)}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Settlement Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider">
                Settlement Amount (₹) <span className="text-[#8FAF9A]">*</span>
              </label>
              {defaultAmountInPaise && (
                <button
                  type="button"
                  onClick={() => setAmountInput((defaultAmountInPaise / 100).toString())}
                  className="text-[11px] text-[#8FAF9A] hover:underline cursor-pointer"
                >
                  Fill full amount ({formatPaise(defaultAmountInPaise)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm text-[#82B99A] font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="500"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl pl-8 pr-3 py-2.5 text-base font-semibold text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === pm.id
                      ? 'bg-[#202329] border-[#8FAF9A] text-[#F5F5F5]'
                      : 'bg-[#111316] border-[#2B2F36] text-[#A0A5AE] hover:border-[#3B4049]'
                  }`}
                >
                  <span className="text-base">{pm.icon}</span>
                  <span className="truncate">{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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

            <div>
              <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1">
                Reference / Note
              </label>
              <input
                type="text"
                placeholder="e.g. UPI Ref / GPay"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#111316] border border-[#2B2F36] text-[11px] text-[#A0A5AE]">
            <p>
              💡 Recording a settlement balances accounts inside SplitMate. Actual fund transfer takes place via your preferred banking or UPI app.
            </p>
          </div>

          {/* Submit */}
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
              disabled={isSubmitting || totalPaise <= 0 || !payerId || !receiverId}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              {isSubmitting ? 'Recording...' : `Confirm Settlement (${formatPaise(totalPaise)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
