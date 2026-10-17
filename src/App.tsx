import React, { useState } from 'react';
import { SplitMateProvider, useSplitMate } from './context/SplitMateContext';
import { LandingPage } from './components/landing/LandingPage';
import { Sidebar } from './components/navigation/Sidebar';
import { MobileNav } from './components/navigation/MobileNav';
import { Dashboard } from './components/dashboard/Dashboard';
import { GroupDetailsPage } from './components/groups/GroupDetailsPage';
import { GroupsListPage } from './components/groups/GroupsListPage';
import { FriendsPage } from './components/friends/FriendsPage';
import { ActivityPage } from './components/activity/ActivityPage';
import { ExpenseHistoryPage } from './components/history/ExpenseHistoryPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { AssistantPage } from './components/assistant/AssistantPage';
import { CreateGroupModal } from './components/groups/CreateGroupModal';
import { AddExpenseModal } from './components/expenses/AddExpenseModal';
import { SettleUpModal } from './components/settlements/SettleUpModal';
import { ExpenseDetailModal } from './components/expenses/ExpenseDetailModal';
import { ConfirmModal } from './components/common/ConfirmModal';
import { ToastContainer } from './components/common/Toast';
import { SplitMateLogo } from './components/common/SplitMateLogo';
import { Bot } from 'lucide-react';
import { Expense } from './types';

function SplitMateApp() {
  const {
    currentPage,
    selectedGroupId,
    toasts,
    removeToast,
    navigateTo,
    deleteExpense,
    authLoading,
  } = useSplitMate();

  // Modal states
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseModalGroupId, setExpenseModalGroupId] = useState<string | undefined>();
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Settle up modal state
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [settleUpGroupId, setSettleUpGroupId] = useState<string | undefined>();
  const [settleUpPayerId, setSettleUpPayerId] = useState<string | undefined>();
  const [settleUpReceiverId, setSettleUpReceiverId] = useState<string | undefined>();
  const [settleUpAmount, setSettleUpAmount] = useState<number | undefined>();

  // Expense detail & delete confirmation modal
  const [inspectingExpense, setInspectingExpense] = useState<Expense | null>(null);
  const [expenseIdToDelete, setExpenseIdToDelete] = useState<string | null>(null);

  // Handlers
  const handleOpenAddExpense = (groupId?: string) => {
    setExpenseModalGroupId(groupId || selectedGroupId || undefined);
    setExpenseToEdit(null);
    setIsAddExpenseOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setExpenseModalGroupId(expense.groupId);
    setIsAddExpenseOpen(true);
  };

  const handleOpenSettleUp = (
    groupId?: string,
    payerId?: string,
    receiverId?: string,
    amount?: number
  ) => {
    setSettleUpGroupId(groupId || selectedGroupId || undefined);
    setSettleUpPayerId(payerId);
    setSettleUpReceiverId(receiverId);
    setSettleUpAmount(amount);
    setIsSettleUpOpen(true);
  };

  const handleDeleteExpenseConfirm = (expenseId: string) => {
    setExpenseIdToDelete(expenseId);
  };

  // Loading screen while verifying Supabase session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0C0E] flex flex-col items-center justify-center text-[#F5F5F5] select-none">
        <SplitMateLogo size="lg" showWordmark={true} />
        <div className="mt-6 flex items-center gap-2.5 text-xs text-[#8FAF9A] font-medium">
          <div className="w-4 h-4 border-2 border-[#8FAF9A] border-t-transparent rounded-full animate-spin" />
          <span>Verifying secure session...</span>
        </div>
      </div>
    );
  }

  // If on Landing Page, render the full landing experience
  if (currentPage === 'landing') {
    return (
      <>
        <LandingPage />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  // Workspace Layout for dashboard, groups, friends, activity, history, settings
  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#F5F5F5] flex flex-col lg:flex-row antialiased selection:bg-[#8FAF9A]/20 selection:text-[#8FAF9A]">
      {/* Desktop Persistent Sidebar */}
      <Sidebar
        onOpenAddExpense={() => handleOpenAddExpense()}
        onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
      />

      {/* Mobile Top Navigation & Drawer */}
      <MobileNav
        onOpenAddExpense={() => handleOpenAddExpense()}
        onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto min-h-[calc(100vh-60px)] lg:min-h-screen">
        {currentPage === 'dashboard' && (
          <Dashboard
            onOpenAddExpense={() => handleOpenAddExpense()}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            onOpenSettleUp={handleOpenSettleUp}
          />
        )}

        {currentPage === 'groups' && (
          <GroupsListPage
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            onOpenAddExpense={() => handleOpenAddExpense()}
          />
        )}

        {currentPage === 'group-details' && selectedGroupId && (
          <GroupDetailsPage
            groupId={selectedGroupId}
            onOpenAddExpense={handleOpenAddExpense}
            onOpenSettleUp={handleOpenSettleUp}
            onInspectExpense={(exp) => setInspectingExpense(exp)}
          />
        )}

        {currentPage === 'friends' && <FriendsPage />}

        {currentPage === 'activity' && <ActivityPage />}

        {currentPage === 'history' && (
          <ExpenseHistoryPage
            onInspectExpense={(exp) => setInspectingExpense(exp)}
            onEditExpense={handleOpenEditExpense}
            onDeleteExpense={handleDeleteExpenseConfirm}
          />
        )}

        {currentPage === 'settings' && <SettingsPage />}

        {currentPage === 'assistant' && (
          <AssistantPage onOpenSettleUp={handleOpenSettleUp} />
        )}
      </main>

      {/* Global Modals */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onSuccessNavigate={(newGroupId) => navigateTo('group-details', newGroupId)}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setExpenseToEdit(null);
        }}
        groupId={expenseModalGroupId}
        expenseToEdit={expenseToEdit}
      />

      <SettleUpModal
        isOpen={isSettleUpOpen}
        onClose={() => setIsSettleUpOpen(false)}
        groupId={settleUpGroupId}
        defaultPayerId={settleUpPayerId}
        defaultReceiverId={settleUpReceiverId}
        defaultAmountInPaise={settleUpAmount}
      />

      <ExpenseDetailModal
        expense={inspectingExpense}
        isOpen={Boolean(inspectingExpense)}
        onClose={() => setInspectingExpense(null)}
        onEdit={(exp) => {
          setInspectingExpense(null);
          handleOpenEditExpense(exp);
        }}
        onDelete={(expId) => {
          setInspectingExpense(null);
          handleDeleteExpenseConfirm(expId);
        }}
      />

      {/* Delete Expense Confirmation */}
      <ConfirmModal
        isOpen={Boolean(expenseIdToDelete)}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? All member balances will be recalculated and an audit entry will be logged."
        confirmLabel="Delete"
        isDestructive={true}
        onCancel={() => setExpenseIdToDelete(null)}
        onConfirm={() => {
          if (expenseIdToDelete) {
            deleteExpense(expenseIdToDelete);
            setExpenseIdToDelete(null);
          }
        }}
      />



      {/* Floating SplitMate AI Quick Trigger */}
      {currentPage !== 'assistant' && (
        <button
          onClick={() => navigateTo('assistant')}
          className="fixed bottom-20 lg:bottom-6 right-5 z-40 px-3.5 py-2.5 rounded-full bg-[#181B20] hover:bg-[#202329] border border-[#8FAF9A]/40 text-[#8FAF9A] text-xs font-bold shadow-xl flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer backdrop-blur-md"
          aria-label="Open SplitMate AI Assistant"
        >
          <Bot className="w-4 h-4 text-[#8FAF9A]" />
          <span className="hidden sm:inline text-white">SplitMate AI</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#8FAF9A]/20 text-[#8FAF9A] font-black">
            Gemma 3
          </span>
        </button>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <SplitMateProvider>
      <SplitMateApp />
    </SplitMateProvider>
  );
}
