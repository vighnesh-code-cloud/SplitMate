import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Users2,
  Mail,
  Phone,
  Trash2,
  Edit2,
  ArrowRight,
  ShieldCheck,
  Receipt,
  X,
  Check
} from 'lucide-react';
import { useSplitMate } from '../../context/SplitMateContext';
import { Friend, Group } from '../../types';
import {
  formatPaise,
  formatPaiseWithSign,
  calculateGroupMemberBalances,
} from '../../utils/calculations';
import { Avatar } from '../common/Avatar';
import { ConfirmModal } from '../common/ConfirmModal';

export const FriendsPage: React.FC = () => {
  const {
    friends,
    groups,
    expenses,
    settlements,
    currentUser,
    addFriend,
    updateFriend,
    removeFriend,
    addFriendToGroup,
    navigateTo,
    getMemberName,
  } = useSplitMate();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState<Friend | null>(null);

  // Add friend form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Edit friend state
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Add to group modal state
  const [friendToAddToGroup, setFriendToAddToGroup] = useState<Friend | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  // Filtered friends
  const filteredFriends = useMemo(() => {
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.email && f.email.toLowerCase().includes(search.toLowerCase())) ||
        (f.phone && f.phone.includes(search))
    );
  }, [friends, search]);

  // Compute stats between current user and this specific friend
  const getFriendStats = (friendId: string) => {
    let totalOwedToUser = 0;
    let totalUserOwes = 0;
    const sharedGroups: Group[] = [];
    const sharedExpenses: { title: string; date: string; amountInPaise: number }[] = [];

    groups.forEach((group) => {
      const hasUser = group.memberIds.includes(currentUser.id);
      const hasFriend = group.memberIds.includes(friendId);

      if (hasUser && hasFriend) {
        sharedGroups.push(group);

        const balances = calculateGroupMemberBalances(group, expenses, settlements, getMemberName);
        const userBal = balances.find((b) => b.memberId === currentUser.id);
        const friendBal = balances.find((b) => b.memberId === friendId);

        // Approximate net debt contribution
        if (userBal && friendBal) {
          if (userBal.netBalanceInPaise > 0 && friendBal.netBalanceInPaise < 0) {
            totalOwedToUser += Math.min(
              userBal.netBalanceInPaise,
              Math.abs(friendBal.netBalanceInPaise)
            );
          } else if (userBal.netBalanceInPaise < 0 && friendBal.netBalanceInPaise > 0) {
            totalUserOwes += Math.min(
              Math.abs(userBal.netBalanceInPaise),
              friendBal.netBalanceInPaise
            );
          }
        }

        // Shared expenses
        const gExpenses = expenses.filter(
          (e) =>
            e.groupId === group.id &&
            (e.paidBy === friendId || (e.sharesInPaise && e.sharesInPaise[friendId]))
        );
        gExpenses.forEach((exp) => {
          sharedExpenses.push({
            title: exp.title,
            date: exp.date,
            amountInPaise: exp.amountInPaise,
          });
        });
      }
    });

    const netPaise = totalOwedToUser - totalUserOwes;

    return {
      sharedGroups,
      totalOwedToUser,
      totalUserOwes,
      netPaise,
      sharedExpenses: sharedExpenses.slice(0, 3),
    };
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addFriend({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });

    setName('');
    setEmail('');
    setPhone('');
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFriend || !editName.trim()) return;

    updateFriend(editingFriend.id, {
      name: editName.trim(),
      email: editEmail.trim() || undefined,
      phone: editPhone.trim() || undefined,
    });

    setEditingFriend(null);
  };

  const handleAddToGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendToAddToGroup || !selectedGroupId) return;

    addFriendToGroup(friendToAddToGroup.id, selectedGroupId);
    setFriendToAddToGroup(null);
    setSelectedGroupId('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F5] tracking-tight">
            Friends
          </h1>
          <p className="text-xs sm:text-sm text-[#A0A5AE] mt-0.5">
            Manage your network, see shared balances, and add friends to groups.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] shadow-md flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Friend</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#737984]" />
        <input
          type="text"
          placeholder="Search friends by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#181B20] border border-[#2B2F36] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5F5F5] placeholder-[#737984] focus:outline-hidden focus:border-[#8FAF9A]"
        />
      </div>

      {/* Friends Cards Grid */}
      {filteredFriends.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#181B20] border border-[#2B2F36] text-center max-w-md mx-auto">
          <UserPlus className="w-10 h-10 text-[#737984] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#F5F5F5]">No friends found</h3>
          <p className="text-xs text-[#737984] mt-1 mb-4">
            Add friends to start sharing expenses and tracking balances together.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#8FAF9A] text-[#0B0C0E] text-xs font-bold rounded-xl"
          >
            Add a Friend
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFriends.map((friend) => {
            const stats = getFriendStats(friend.id);

            return (
              <div
                key={friend.id}
                className="p-5 rounded-2xl bg-[#181B20] border border-[#2B2F36] flex flex-col justify-between shadow-xs hover:border-[#8FAF9A]/50 transition-all"
              >
                <div>
                  {/* Top row with avatar, name & edit/delete */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={friend.name} src={friend.avatar} size="md" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#F5F5F5] truncate">{friend.name}</h3>
                        {friend.email && (
                          <p className="text-[11px] text-[#737984] truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#737984]" />
                            {friend.email}
                          </p>
                        )}
                        {friend.phone && (
                          <p className="text-[11px] text-[#737984] truncate flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#737984]" />
                            {friend.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingFriend(friend);
                          setEditName(friend.name);
                          setEditEmail(friend.email || '');
                          setEditPhone(friend.phone || '');
                        }}
                        className="p-1.5 text-[#737984] hover:text-[#F5F5F5] rounded-lg hover:bg-[#202329]"
                        title="Edit Friend"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setFriendToDelete(friend)}
                        className="p-1.5 text-[#737984] hover:text-[#D99090] rounded-lg hover:bg-[#3A1D1D]"
                        title="Remove Friend"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Shared Balance Summary */}
                  <div className="p-3 rounded-xl bg-[#111316] border border-[#2B2F36] mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#737984]">Direct Balance</span>
                      <span
                        className={`font-mono font-bold ${
                          stats.netPaise > 0
                            ? 'text-[#82B99A]'
                            : stats.netPaise < 0
                            ? 'text-[#D99090]'
                            : 'text-[#A0A5AE]'
                        }`}
                      >
                        {stats.netPaise === 0
                          ? 'Settled up'
                          : stats.netPaise > 0
                          ? `Owes you ${formatPaise(stats.netPaise)}`
                          : `You owe ${formatPaise(Math.abs(stats.netPaise))}`}
                      </span>
                    </div>
                  </div>

                  {/* Shared Groups */}
                  <div className="mb-3">
                    <span className="text-[10px] font-semibold text-[#737984] uppercase tracking-wider block mb-1">
                      Shared Groups ({stats.sharedGroups.length})
                    </span>
                    {stats.sharedGroups.length === 0 ? (
                      <span className="text-xs text-[#737984]">Not sharing any groups yet</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {stats.sharedGroups.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => navigateTo('group-details', g.id)}
                            className="text-[11px] px-2 py-0.5 rounded-lg bg-[#202329] border border-[#2B2F36] text-[#A0A5AE] hover:text-[#8FAF9A] hover:border-[#8FAF9A]/50 transition-colors"
                          >
                            {g.icon || '🏷️'} {g.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action: Add to Group */}
                <div className="pt-3 border-t border-[#202329] flex items-center justify-between">
                  <button
                    onClick={() => {
                      setFriendToAddToGroup(friend);
                      setSelectedGroupId('');
                    }}
                    className="text-xs font-semibold text-[#8FAF9A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Users2 className="w-3.5 h-3.5" />
                    <span>Add to Group</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add New Friend */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#181B20] border border-[#2B2F36] rounded-2xl p-5 shadow-2xl relative text-[#F5F5F5]">
            <h3 className="text-base font-bold text-[#F5F5F5] mb-1">Add Friend</h3>
            <p className="text-xs text-[#A0A5AE] mb-4">
              Enter friend details to start splitting bills and sharing groups.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#A0A5AE] mb-1">
                  Friend Name <span className="text-[#8FAF9A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:border-[#8FAF9A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A5AE] mb-1">
                  Email Address <span className="text-[#737984] font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. rohan@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:border-[#8FAF9A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A5AE] mb-1">
                  Phone Number <span className="text-[#737984] font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:border-[#8FAF9A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#A0A5AE] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] disabled:opacity-50"
                >
                  Save Friend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Friend */}
      {editingFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#181B20] border border-[#2B2F36] rounded-2xl p-5 shadow-2xl relative text-[#F5F5F5]">
            <h3 className="text-base font-bold text-[#F5F5F5] mb-3">Edit Friend</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#A0A5AE] mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:border-[#8FAF9A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A5AE] mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:border-[#8FAF9A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A5AE] mb-1">Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:border-[#8FAF9A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFriend(null)}
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

      {/* Modal: Add Friend to Group */}
      {friendToAddToGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#181B20] border border-[#2B2F36] rounded-2xl p-5 shadow-2xl relative text-[#F5F5F5]">
            <h3 className="text-base font-bold text-[#F5F5F5] mb-1">Add to Group</h3>
            <p className="text-xs text-[#A0A5AE] mb-4">
              Add <span className="text-[#F5F5F5] font-semibold">{friendToAddToGroup.name}</span> to an existing group.
            </p>

            <form onSubmit={handleAddToGroupSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1.5">
                  Select Target Group
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  required
                  className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:border-[#8FAF9A]"
                >
                  <option value="">-- Choose a group --</option>
                  {groups
                    .filter((g) => !g.memberIds.includes(friendToAddToGroup.id))
                    .map((g) => (
                      <option key={g.id} value={g.id} className="bg-[#181B20]">
                        {g.icon || '🏷️'} {g.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFriendToAddToGroup(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#A0A5AE] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedGroupId}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for removing friend */}
      <ConfirmModal
        isOpen={Boolean(friendToDelete)}
        title="Remove Friend"
        message={`Are you sure you want to remove ${friendToDelete?.name}? They will also be removed from any shared groups.`}
        confirmLabel="Remove"
        isDestructive={true}
        onCancel={() => setFriendToDelete(null)}
        onConfirm={() => {
          if (friendToDelete) {
            removeFriend(friendToDelete.id);
            setFriendToDelete(null);
          }
        }}
      />
    </div>
  );
};
