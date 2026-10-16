import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users2,
  UserCheck,
  Activity as ActivityIcon,
  History,
  Plus,
  Menu,
  X,
  Settings,
  ArrowLeft,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { SplitMateLogo } from '../common/SplitMateLogo';
import { useSplitMate } from '../../context/SplitMateContext';
import { NavigationPage } from '../../types';
import { Avatar } from '../common/Avatar';

interface MobileNavProps {
  onOpenAddExpense: () => void;
  onOpenCreateGroup: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  onOpenAddExpense,
  onOpenCreateGroup,
}) => {
  const { currentPage, navigateTo, currentUser, signOut } = useSplitMate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainTabs: { id: NavigationPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'groups', label: 'Groups', icon: Users2 },
    { id: 'friends', label: 'Friends', icon: UserCheck },
    { id: 'activity', label: 'Activity', icon: ActivityIcon },
    { id: 'history', label: 'History', icon: History },
  ];

  const handleNav = (page: NavigationPage) => {
    setDrawerOpen(false);
    navigateTo(page);
  };

  return (
    <>
      {/* Top Mobile Bar */}
      <header className="lg:hidden sticky top-0 z-30 w-full bg-[#111316] border-b border-[#2B2F36] px-4 py-2.5 flex items-center justify-between">
        <SplitMateLogo size="sm" onClick={() => handleNav('landing')} />

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNav('assistant')}
            className="p-1.5 rounded-lg bg-[#202329] border border-[#2B2F36] text-[#8FAF9A] hover:bg-[#8FAF9A]/20 transition-colors"
            title="SplitMate AI Assistant"
            aria-label="SplitMate AI Assistant"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAddExpense}
            className="px-2.5 py-1.5 rounded-lg bg-[#8FAF9A] text-[#0B0C0E] text-xs font-bold flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Expense</span>
          </button>

          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg text-[#A0A5AE] hover:text-[#F5F5F5] hover:bg-[#181B20]"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Slide-out Drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-[#111316] border-r border-[#2B2F36] h-full flex flex-col p-5 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#2B2F36]">
              <SplitMateLogo size="sm" />
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-[#737984] hover:text-[#F5F5F5] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2 border-b border-[#2B2F36]">
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  onOpenCreateGroup();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#202329] border border-[#2B2F36] text-[#F5F5F5] text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 text-[#8FAF9A]" />
                <span>Create New Group</span>
              </button>
            </div>

            {/* Menu options */}
            <div className="flex-1 py-4 space-y-1">
              {mainTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentPage === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNav(tab.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#181B20] text-[#8FAF9A]'
                        : 'text-[#A0A5AE] hover:text-[#F5F5F5]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              <button
                onClick={() => handleNav('assistant')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  currentPage === 'assistant'
                    ? 'bg-[#181B20] text-[#8FAF9A]'
                    : 'text-[#A0A5AE] hover:text-[#F5F5F5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#8FAF9A]" />
                  <span>SplitMate AI</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#8FAF9A]/20 text-[#8FAF9A] border border-[#8FAF9A]/30">
                  AI
                </span>
              </button>

              <button
                onClick={() => handleNav('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  currentPage === 'settings'
                    ? 'bg-[#181B20] text-[#8FAF9A]'
                    : 'text-[#A0A5AE] hover:text-[#F5F5F5]'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => handleNav('landing')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#737984] hover:text-[#F5F5F5] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Homepage</span>
              </button>
            </div>

            {/* User Profile info & Sign Out */}
            <div className="pt-3 border-t border-[#2B2F36] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#F5F5F5] truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-[#737984] truncate">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  signOut();
                }}
                className="p-2 rounded-lg text-[#737984] hover:text-[#D99090] hover:bg-[#181B20] transition-colors shrink-0"
                title="Sign out of SplitMate"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#111316]/95 backdrop-blur-md border-t border-[#2B2F36] px-2 py-1.5 flex items-center justify-around safe-area-pb">
        {mainTabs.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentPage === item.id ||
            (item.id === 'groups' && currentPage === 'group-details');

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-[#8FAF9A]' : 'text-[#737984]'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#8FAF9A]' : 'text-[#737984]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
