import React from 'react';
import {
  LayoutDashboard,
  Users2,
  UserCheck,
  Activity as ActivityIcon,
  History,
  Settings,
  Plus,
  ArrowLeft,
  ExternalLink,
  LogOut,
  Bot,
} from 'lucide-react';
import { SplitMateLogo } from '../common/SplitMateLogo';
import { useSplitMate } from '../../context/SplitMateContext';
import { NavigationPage } from '../../types';
import { Avatar } from '../common/Avatar';

interface SidebarProps {
  onOpenAddExpense: () => void;
  onOpenCreateGroup: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenAddExpense,
  onOpenCreateGroup,
}) => {
  const { currentPage, navigateTo, currentUser, groups, session, signOut } = useSplitMate();

  const navItems: { id: NavigationPage; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'assistant', label: 'SplitMate AI', icon: Bot, badge: 'Gemma 3' },
    { id: 'groups', label: 'My Groups', icon: Users2 },
    { id: 'friends', label: 'Friends', icon: UserCheck },
    { id: 'activity', label: 'Activity', icon: ActivityIcon },
    { id: 'history', label: 'Expense History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex w-64 bg-[#111316] border-r border-[#2B2F36] flex-col shrink-0 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#2B2F36] flex items-center justify-between">
        <SplitMateLogo size="sm" onClick={() => navigateTo('landing')} />
      </div>

      {/* Primary Action Button */}
      <div className="p-4 border-b border-[#2B2F36] space-y-2">
        <button
          onClick={onOpenAddExpense}
          className="w-full py-2.5 px-3 rounded-xl bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Expense</span>
        </button>

        <button
          onClick={onOpenCreateGroup}
          className="w-full py-2 px-3 rounded-xl bg-[#181B20] text-[#F5F5F5] hover:bg-[#202329] border border-[#2B2F36] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#8FAF9A]" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <span className="px-3 text-[10px] font-bold text-[#737984] uppercase tracking-wider block mb-1">
          Menu
        </span>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentPage === item.id ||
            (item.id === 'groups' && currentPage === 'group-details');

          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#181B20] text-[#8FAF9A] border border-[#2B2F36] shadow-xs'
                  : 'text-[#A0A5AE] hover:text-[#F5F5F5] hover:bg-[#181B20]/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Icon
                  className={`w-4 h-4 transition-colors shrink-0 ${
                    isActive ? 'text-[#8FAF9A]' : 'text-[#737984]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-[#8FAF9A]/20 text-[#8FAF9A] border border-[#8FAF9A]/30 tracking-wider">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Groups shortcut list */}
        {groups.length > 0 && (
          <div className="pt-4 mt-3 border-t border-[#2B2F36]">
            <div className="flex items-center justify-between px-3 mb-1.5">
              <span className="text-[10px] font-bold text-[#737984] uppercase tracking-wider">
                Active Groups ({groups.length})
              </span>
            </div>

            <div className="space-y-0.5">
              {groups.slice(0, 4).map((grp) => (
                <button
                  key={grp.id}
                  onClick={() => navigateTo('group-details', grp.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-[#A0A5AE] hover:text-[#F5F5F5] hover:bg-[#181B20] transition-colors truncate cursor-pointer text-left"
                >
                  <span className="text-sm shrink-0">{grp.icon || '🏷️'}</span>
                  <span className="truncate">{grp.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Return to Landing & User Profile Footer */}
      <div className="p-3 border-t border-[#2B2F36] space-y-2">
        <button
          onClick={() => navigateTo('landing')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-medium text-[#737984] hover:text-[#F5F5F5] hover:bg-[#181B20] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Landing Page
          </span>
          <ExternalLink className="w-3 h-3 text-[#737984]" />
        </button>

        <div className="flex items-center gap-1.5">
          <div
            onClick={() => navigateTo('settings')}
            className="flex-1 p-2 rounded-xl bg-[#181B20] border border-[#2B2F36] flex items-center gap-2.5 cursor-pointer hover:border-[#8FAF9A]/50 transition-colors min-w-0"
            title="Open Settings"
          >
            <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#F5F5F5] truncate">{currentUser.name}</p>
              <p className="text-[10px] text-[#737984] truncate">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            title="Sign out of SplitMate"
            className="p-2.5 rounded-xl bg-[#181B20] border border-[#2B2F36] hover:border-[#D99090]/60 hover:text-[#D99090] text-[#737984] transition-colors cursor-pointer shrink-0"
            aria-label="Sign out of SplitMate"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
