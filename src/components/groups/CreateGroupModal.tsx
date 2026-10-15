import React, { useState } from 'react';
import { X, Users, ArrowRight, ArrowLeft, Check, Plus, Search, Tag, FileText } from 'lucide-react';
import { useSplitMate } from '../../context/SplitMateContext';
import { GroupCategory } from '../../types';
import { Avatar } from '../common/Avatar';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNavigate?: (groupId: string) => void;
}

const CATEGORIES: { label: GroupCategory; icon: string }[] = [
  { label: 'Trip', icon: '✈️' },
  { label: 'Flatmates', icon: '🏠' },
  { label: 'Food', icon: '☕' },
  { label: 'Shopping', icon: '🛍️' },
  { label: 'Event', icon: '🎉' },
  { label: 'Other', icon: '🏷️' },
];

const CURRENCIES = [
  { symbol: '₹', name: 'INR (₹)' },
  { symbol: '$', name: 'USD ($)' },
  { symbol: '€', name: 'EUR (€)' },
  { symbol: '£', name: 'GBP (£)' },
  { symbol: 'AED', name: 'AED' },
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccessNavigate,
}) => {
  const { friends, addFriend, createGroup, currentUser, navigateTo } = useSplitMate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GroupCategory>('Trip');
  const [currency, setCurrency] = useState('₹');
  const [selectedIcon, setSelectedIcon] = useState('✈️');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  
  // Friend search & quick add state
  const [friendSearch, setFriendSearch] = useState('');
  const [isAddingNewFriend, setIsAddingNewFriend] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setName('');
    setDescription('');
    setCategory('Trip');
    setCurrency('₹');
    setSelectedIcon('✈️');
    setSelectedFriendIds([]);
    setFriendSearch('');
    setIsAddingNewFriend(false);
    setNewFriendName('');
    setNewFriendEmail('');
    setIsSubmitting(false);
    setError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleCategorySelect = (cat: GroupCategory, icon: string) => {
    setCategory(cat);
    setSelectedIcon(icon);
  };

  const toggleFriend = (id: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateNewFriendInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;

    const created = addFriend({
      name: newFriendName.trim(),
      email: newFriendEmail.trim() || undefined,
    });

    setSelectedFriendIds((prev) => [...prev, created.id]);
    setNewFriendName('');
    setNewFriendEmail('');
    setIsAddingNewFriend(false);
  };

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(friendSearch.toLowerCase()) ||
    (f.email && f.email.toLowerCase().includes(friendSearch.toLowerCase()))
  );

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please provide a group name');
      setStep(1);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const newGroup = createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        currency,
        memberIds: selectedFriendIds,
        icon: selectedIcon,
      });

      handleReset();
      onClose();

      if (onSuccessNavigate) {
        onSuccessNavigate(newGroup.id);
      } else {
        navigateTo('group-details', newGroup.id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to create group. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="w-full max-w-lg bg-[#181B20] border border-[#2B2F36] rounded-2xl shadow-2xl relative text-[#F5F5F5] overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Step Progress */}
        <div className="px-6 py-5 border-b border-[#2B2F36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#202329] border border-[#2B2F36] flex items-center justify-center text-lg">
              {selectedIcon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F5]">Create New Group</h2>
              <p className="text-xs text-[#A0A5AE]">Step {step} of 3</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-[#737984] hover:text-[#F5F5F5] p-1.5 rounded-lg hover:bg-[#202329] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-3 gap-1 px-6 pt-3">
          <div className={`h-1 rounded-full ${step >= 1 ? 'bg-[#8FAF9A]' : 'bg-[#2B2F36]'}`} />
          <div className={`h-1 rounded-full ${step >= 2 ? 'bg-[#8FAF9A]' : 'bg-[#2B2F36]'}`} />
          <div className={`h-1 rounded-full ${step >= 3 ? 'bg-[#8FAF9A]' : 'bg-[#2B2F36]'}`} />
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-[#3A1D1D] border border-[#522828] rounded-xl text-xs text-[#D99090]">
              {error}
            </div>
          )}

          {/* STEP 1: Details */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1.5">
                  Group Name <span className="text-[#8FAF9A]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Goa Trip, Flat 402, Friday Dinners"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  autoFocus
                  className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] placeholder-[#737984] focus:outline-hidden focus:border-[#8FAF9A] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => handleCategorySelect(cat.label, cat.icon)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        category === cat.label
                          ? 'bg-[#202329] border-[#8FAF9A] text-[#F5F5F5] shadow-xs'
                          : 'bg-[#111316] border-[#2B2F36] text-[#A0A5AE] hover:border-[#3B4049]'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1.5">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-sm text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.symbol} value={c.symbol} className="bg-[#181B20]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1.5">
                    Group Icon
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={selectedIcon}
                    onChange={(e) => setSelectedIcon(e.target.value || '🏷️')}
                    className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-sm text-center text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1.5">
                  Description <span className="text-[#737984] font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="What is this group for? E.g., Beach villa expenses and transport"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-4 py-2 text-sm text-[#F5F5F5] placeholder-[#737984] focus:outline-hidden focus:border-[#8FAF9A] transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Add Friends */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#F5F5F5]">Select Group Members</p>
                  <p className="text-xs text-[#A0A5AE]">
                    You ({currentUser.name}) are included automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingNewFriend(!isAddingNewFriend)}
                  className="text-xs font-semibold text-[#8FAF9A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isAddingNewFriend ? 'Cancel' : 'New Friend'}
                </button>
              </div>

              {/* Inline Add New Friend Form */}
              {isAddingNewFriend && (
                <form
                  onSubmit={handleCreateNewFriendInline}
                  className="p-3 bg-[#111316] border border-[#8FAF9A]/40 rounded-xl space-y-2 animate-in fade-in duration-150"
                >
                  <p className="text-xs font-semibold text-[#8FAF9A]">Add Friend to SplitMate</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Friend's Name *"
                      required
                      value={newFriendName}
                      onChange={(e) => setNewFriendName(e.target.value)}
                      className="bg-[#181B20] border border-[#2B2F36] rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5] focus:border-[#8FAF9A] focus:outline-hidden"
                    />
                    <input
                      type="email"
                      placeholder="Email or phone (optional)"
                      value={newFriendEmail}
                      onChange={(e) => setNewFriendEmail(e.target.value)}
                      className="bg-[#181B20] border border-[#2B2F36] rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5] focus:border-[#8FAF9A] focus:outline-hidden"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newFriendName.trim()}
                      className="px-3 py-1 bg-[#8FAF9A] text-[#0B0C0E] font-semibold text-xs rounded-lg hover:bg-[#82B99A] disabled:opacity-50 transition-colors"
                    >
                      Save & Select
                    </button>
                  </div>
                </form>
              )}

              {/* Selected Member Chips */}
              {selectedFriendIds.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-[#A0A5AE] uppercase tracking-wider block mb-1.5">
                    Selected ({selectedFriendIds.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFriendIds.map((fId) => {
                      const friend = friends.find((f) => f.id === fId);
                      if (!friend) return null;
                      return (
                        <span
                          key={fId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#202329] border border-[#2B2F36] text-xs text-[#F5F5F5]"
                        >
                          <Avatar name={friend.name} src={friend.avatar} size="xs" />
                          <span>{friend.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleFriend(fId)}
                            className="text-[#737984] hover:text-[#D99090] ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search Friends */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#737984]" />
                <input
                  type="text"
                  placeholder="Search existing friends..."
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5F5F5] placeholder-[#737984] focus:outline-hidden focus:border-[#8FAF9A]"
                />
              </div>

              {/* Friends list */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {filteredFriends.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#737984]">
                    No friends found. Click "New Friend" above to add someone.
                  </div>
                ) : (
                  filteredFriends.map((friend) => {
                    const isSelected = selectedFriendIds.includes(friend.id);
                    return (
                      <div
                        key={friend.id}
                        onClick={() => toggleFriend(friend.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#202329] border-[#8FAF9A]/60'
                            : 'bg-[#111316] border-[#2B2F36] hover:border-[#3B4049]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={friend.name} src={friend.avatar} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#F5F5F5] truncate">{friend.name}</p>
                            {friend.email && (
                              <p className="text-[11px] text-[#737984] truncate">{friend.email}</p>
                            )}
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-[#8FAF9A] border-[#8FAF9A] text-[#0B0C0E]'
                              : 'border-[#3B4049]'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Review & Confirm */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-[#111316] border border-[#2B2F36] rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#202329] border border-[#2B2F36] flex items-center justify-center text-2xl">
                    {selectedIcon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#F5F5F5]">{name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#202329] border border-[#2B2F36] text-[#8FAF9A]">
                        {category}
                      </span>
                      <span className="text-xs text-[#737984]">Currency: {currency}</span>
                    </div>
                  </div>
                </div>

                {description && (
                  <p className="text-xs text-[#A0A5AE] border-t border-[#2B2F36] pt-2 italic">
                    "{description}"
                  </p>
                )}

                <div className="border-t border-[#2B2F36] pt-3">
                  <p className="text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-2">
                    Members ({selectedFriendIds.length + 1}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#202329] border border-[#2B2F36] text-xs text-[#F5F5F5]">
                      <Avatar name={currentUser.name} src={currentUser.avatar} size="xs" />
                      <span>{currentUser.name} (Creator)</span>
                    </span>
                    {selectedFriendIds.map((fId) => {
                      const friend = friends.find((f) => f.id === fId);
                      if (!friend) return null;
                      return (
                        <span
                          key={fId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181B20] border border-[#2B2F36] text-xs text-[#A0A5AE]"
                        >
                          <Avatar name={friend.name} src={friend.avatar} size="xs" />
                          <span>{friend.name}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="px-6 py-4 bg-[#14171C] border-t border-[#2B2F36] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#A0A5AE] hover:text-[#F5F5F5] hover:bg-[#202329] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#737984] hover:text-[#F5F5F5] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !name.trim()) {
                  setError('Please enter a group name');
                  return;
                }
                setError('');
                setStep((s) => (s + 1) as 1 | 2 | 3);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
