import React, { useState, useMemo } from 'react';
import {
  User,
  Shield,
  RotateCcw,
  Download,
  Trash2,
  Check,
  Palette,
  Sparkles,
  Info,
  Shuffle,
  LogOut
} from 'lucide-react';
import { useSplitMate } from '../../context/SplitMateContext';
import { SplitMateLogo } from '../common/SplitMateLogo';
import { Avatar } from '../common/Avatar';
import { ConfirmModal } from '../common/ConfirmModal';
import { AVATAR_OPTIONS } from '../../utils/avatars';

export const SettingsPage: React.FC = () => {
  const {
    currentUser,
    updateCurrentUser,
    resetToDemoData,
    clearAllData,
    groups,
    expenses,
    friends,
    settlements,
    showToast,
    signOut,
  } = useSplitMate();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [currency, setCurrency] = useState(currentUser.defaultCurrency || '₹');
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [avatarFilter, setAvatarFilter] = useState<'All' | 'Male' | 'Female'>('All');

  const displayedAvatars = useMemo(() => {
    if (avatarFilter === 'Male') return AVATAR_OPTIONS.filter((a) => a.gender === 'male');
    if (avatarFilter === 'Female') return AVATAR_OPTIONS.filter((a) => a.gender === 'female');
    return AVATAR_OPTIONS;
  }, [avatarFilter]);

  const handleRandomizeAvatar = () => {
    const pool = displayedAvatars.length > 0 ? displayedAvatars : AVATAR_OPTIONS;
    const candidates = pool.filter((a) => a.dataUri !== avatar);
    const selectionList = candidates.length > 0 ? candidates : pool;
    const randomChoice = selectionList[Math.floor(Math.random() * selectionList.length)];
    if (randomChoice) {
      setAvatar(randomChoice.dataUri);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({
      name: name.trim(),
      email: email.trim(),
      avatar: avatar.trim() || undefined,
      defaultCurrency: currency,
    });
  };

  const handleExportBackup = () => {
    const backupData = {
      currentUser,
      friends,
      groups,
      expenses,
      settlements,
      exportedAt: new Date().toISOString(),
    };

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `splitmate_backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('JSON backup exported successfully');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F5] tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#A0A5AE] mt-0.5">
          Manage your personal profile, local data persistence, and app preferences.
        </p>
      </div>

      {/* Profile Section */}
      <div className="p-6 rounded-2xl bg-[#181B20] border border-[#2B2F36] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
            <User className="w-4 h-4 text-[#8FAF9A]" />
            <span>User Profile</span>
          </h2>
          <button
            type="button"
            onClick={signOut}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#D99090] border border-[#2B2F36] hover:border-[#D99090]/50 hover:bg-[#D99090]/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Sign out of SplitMate"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-4 pb-2">
            <Avatar name={name || 'User'} src={avatar} size="lg" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#F5F5F5]">{name || 'Your Name'}</p>
              <p className="text-xs text-[#737984]">{email || 'your.email@example.com'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3.5 py-2 text-xs text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3.5 py-2 text-xs text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider mb-1">
                Currency Symbol
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#111316] border border-[#2B2F36] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-hidden focus:border-[#8FAF9A]"
              >
                <option value="₹">INR (₹)</option>
                <option value="$">USD ($)</option>
                <option value="€">EUR (€)</option>
                <option value="£">GBP (£)</option>
                <option value="AED">AED</option>
              </select>
            </div>
          </div>

          {/* Choose Your Avatar Section */}
          <div className="space-y-3 pt-2 border-t border-[#2B2F36]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#A0A5AE] uppercase tracking-wider">
                  Choose Your Avatar
                </label>
                <p className="text-[11px] text-[#737984]">
                  Select an illustrated persona for your SplitMate profile
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* Gender Filters */}
                <div className="flex items-center p-0.5 bg-[#111316] border border-[#2B2F36] rounded-lg text-xs">
                  {(['All', 'Male', 'Female'] as const).map((filterOption) => (
                    <button
                      key={filterOption}
                      type="button"
                      onClick={() => setAvatarFilter(filterOption)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                        avatarFilter === filterOption
                          ? 'bg-[#202329] text-[#8FAF9A] font-semibold shadow-xs'
                          : 'text-[#737984] hover:text-[#F5F5F5]'
                      }`}
                    >
                      {filterOption}
                    </button>
                  ))}
                </div>

                {/* Randomize Button */}
                <button
                  type="button"
                  onClick={handleRandomizeAvatar}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#111316] border border-[#2B2F36] text-[#A0A5AE] hover:text-[#8FAF9A] hover:border-[#8FAF9A]/50 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Select random avatar"
                >
                  <Shuffle className="w-3 h-3 text-[#8FAF9A]" />
                  <span>Randomize</span>
                </button>
              </div>
            </div>

            {/* Compact Responsive Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 p-3 bg-[#111316] border border-[#2B2F36] rounded-xl">
              {displayedAvatars.map((opt) => {
                const isSelected = avatar === opt.dataUri || avatar === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAvatar(opt.dataUri)}
                    className={`relative group flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#202329] border-2 border-[#8FAF9A] ring-2 ring-[#8FAF9A]/20'
                        : 'bg-[#181B20]/60 border border-[#2B2F36] hover:border-[#3B4049] hover:bg-[#202329]'
                    }`}
                    title={opt.name}
                  >
                    <img
                      src={opt.dataUri}
                      alt={opt.name}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                    <span className="text-[10px] text-[#A0A5AE] mt-1 font-medium truncate max-w-full">
                      {opt.name}
                    </span>

                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8FAF9A] text-[#0B0C0E] flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Update Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Management Section */}
      <div className="p-6 rounded-2xl bg-[#181B20] border border-[#2B2F36] shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#8FAF9A]" />
          <span>Local Data Management</span>
        </h2>
        <p className="text-xs text-[#A0A5AE]">
          SplitMate stores your groups, expenses, and settlements safely in your browser storage.
          You can create a JSON backup or restore original demo data anytime.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Backup */}
          <button
            onClick={handleExportBackup}
            className="p-3.5 rounded-xl bg-[#111316] border border-[#2B2F36] hover:border-[#8FAF9A]/60 transition-colors text-left group cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#8FAF9A] mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-[#F5F5F5]">Export Backup</p>
            <p className="text-[10px] text-[#737984] mt-0.5">Download full JSON data file</p>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={() => setIsConfirmResetOpen(true)}
            className="p-3.5 rounded-xl bg-[#111316] border border-[#2B2F36] hover:border-[#8FAF9A]/60 transition-colors text-left group cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#A0A5AE] mb-2 group-hover:rotate-45 transition-transform" />
            <p className="text-xs font-bold text-[#F5F5F5]">Reset Sample Data</p>
            <p className="text-[10px] text-[#737984] mt-0.5">Restore original sample records</p>
          </button>

          {/* Clear All */}
          <button
            onClick={() => setIsConfirmClearOpen(true)}
            className="p-3.5 rounded-xl bg-[#111316] border border-[#2B2F36] hover:border-[#D99090]/60 transition-colors text-left group cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-[#D99090] mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-[#D99090]">Clear All Data</p>
            <p className="text-[10px] text-[#737984] mt-0.5">Erase all records from storage</p>
          </button>
        </div>
      </div>

      {/* Brand & Design System Card */}
      <div className="p-6 rounded-2xl bg-[#181B20] border border-[#2B2F36] shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <SplitMateLogo size="md" showTagline={true} />
          <div className="text-right">
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#202329] border border-[#2B2F36] text-[#8FAF9A] font-semibold">
              Fintech v1.0.0
            </span>
          </div>
        </div>
        <p className="text-xs text-[#A0A5AE] mt-3 leading-relaxed">
          Theme: Charcoal #0B0C0E • Card #181B20 • Muted Sage #8FAF9A • Positive #82B99A •
          Negative #D99090. Accurate integer paise ledger calculations.
        </p>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={isConfirmResetOpen}
        title="Reset Sample Data"
        message="This will replace your current data with the initial SplitMate demonstration records. Are you sure?"
        confirmLabel="Reset"
        onCancel={() => setIsConfirmResetOpen(false)}
        onConfirm={() => {
          setIsConfirmResetOpen(false);
          resetToDemoData();
        }}
      />

      <ConfirmModal
        isOpen={isConfirmClearOpen}
        title="Clear All Local Data"
        message="This will completely remove all groups, friends, expenses, and settlements from your browser. This action cannot be undone."
        confirmLabel="Clear All Data"
        isDestructive={true}
        onCancel={() => setIsConfirmClearOpen(false)}
        onConfirm={() => {
          setIsConfirmClearOpen(false);
          clearAllData();
        }}
      />
    </div>
  );
};
