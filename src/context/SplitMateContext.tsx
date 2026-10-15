import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import {
  User,
  Friend,
  Group,
  Expense,
  Settlement,
  Activity,
  NavigationPage,
} from '../types';
import {
  loadStoredData,
  saveStoredData,
  getFreshSeedData,
  clearStoredData,
} from '../services/storage';
import {
  supabase,
  isSupabaseConfigured,
  signInWithGoogleOAuth,
  signOutSupabase,
} from '../services/supabase';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface SplitMateContextType {
  currentUser: User;
  friends: Friend[];
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  activities: Activity[];
  currentPage: NavigationPage;
  selectedGroupId: string | null;
  toasts: ToastMessage[];

  // Supabase Authentication state
  session: Session | null;
  authLoading: boolean;
  isAuthenticating: boolean;
  isSupabaseConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;

  // Navigation
  navigateTo: (page: NavigationPage, groupId?: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Member helpers
  getMember: (memberId: string) => { id: string; name: string; avatar?: string; email?: string } | undefined;
  getMemberName: (memberId: string) => string;

  // Group actions
  createGroup: (data: {
    name: string;
    description?: string;
    category: Group['category'];
    currency: string;
    memberIds: string[];
    icon?: string;
  }) => Group;
  updateGroup: (groupId: string, data: Partial<Group>) => void;
  deleteGroup: (groupId: string) => void;
  addMemberToGroup: (groupId: string, memberId: string) => void;
  removeMemberFromGroup: (groupId: string, memberId: string) => void;

  // Friend actions
  addFriend: (data: { name: string; email?: string; phone?: string; avatar?: string }) => Friend;
  updateFriend: (friendId: string, data: Partial<Friend>) => void;
  removeFriend: (friendId: string) => void;
  addFriendToGroup: (friendId: string, groupId: string) => void;

  // Expense actions
  addExpense: (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Expense;
  updateExpense: (expenseId: string, data: Partial<Expense>) => void;
  deleteExpense: (expenseId: string) => void;

  // Settlement actions
  addSettlement: (data: Omit<Settlement, 'id' | 'createdAt'>) => Settlement;
  deleteSettlement: (settlementId: string) => void;

  // Activity actions
  deleteActivity: (activityId: string) => void;

  // User & Settings actions
  updateCurrentUser: (data: Partial<User>) => void;
  resetToDemoData: () => void;
  clearAllData: () => void;
}

const SplitMateContext = createContext<SplitMateContextType | undefined>(undefined);

export const SplitMateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState(() => loadStoredData());
  const [currentPage, setCurrentPage] = useState<NavigationPage>('landing');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Supabase Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Persist to localStorage whenever state data changes
  useEffect(() => {
    saveStoredData(data);
  }, [data]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleUserSession = useCallback((newSession: Session) => {
    setSession(newSession);
    const authUser = newSession.user;
    if (!authUser) return;

    const googleName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split('@')[0] ||
      '';
    const googleEmail = authUser.email || '';
    const googleAvatar =
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      '';

    setData((prev) => {
      // Preserve custom avatar if user has already chosen one from the illustrated avatar picker
      const isCustomAvatar =
        prev.currentUser.avatar &&
        (prev.currentUser.avatar.startsWith('data:image/svg+xml') ||
          prev.currentUser.avatar.startsWith('data:'));

      const updatedAvatar = isCustomAvatar
        ? prev.currentUser.avatar
        : (googleAvatar || prev.currentUser.avatar);

      return {
        ...prev,
        currentUser: {
          ...prev.currentUser,
          name: googleName || prev.currentUser.name,
          email: googleEmail || prev.currentUser.email,
          avatar: updatedAvatar,
        },
      };
    });

    // If currently on landing page, transition directly to dashboard
    setCurrentPage((prev) => (prev === 'landing' ? 'dashboard' : prev));
  }, []);

  // Supabase Session initialization and listener
  useEffect(() => {
    // Check URL parameters for OAuth errors
    try {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const searchParams = new URLSearchParams(window.location.search);
      const authError =
        hashParams.get('error_description') ||
        searchParams.get('error_description') ||
        hashParams.get('error') ||
        searchParams.get('error');

      if (authError) {
        showToast(decodeURIComponent(authError).replace(/\+/g, ' '), 'error');
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (e) {
      console.error('Error parsing OAuth parameters:', e);
    }

    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    let isMounted = true;

    // Get current session
    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession }, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error('Error fetching Supabase session:', error);
        }
        if (currentSession) {
          handleUserSession(currentSession);
        }
        setAuthLoading(false);
      })
      .catch((err) => {
        console.error('Supabase getSession error:', err);
        if (isMounted) setAuthLoading(false);
      });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;
      if (newSession) {
        handleUserSession(newSession);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setCurrentPage('landing');
      }
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [handleUserSession, showToast]);

  const signInWithGoogle = useCallback(async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);

    try {
      if (!isSupabaseConfigured) {
        showToast(
          'Supabase environment variables (VITE_SUPABASE_URL & VITE_SUPABASE_PUBLISHABLE_KEY) are not configured. Entering SplitMate in local mode.',
          'info'
        );
        setIsAuthenticating(false);
        setCurrentPage('dashboard');
        return;
      }

      const { error } = await signInWithGoogleOAuth();
      if (error) {
        showToast(error.message || 'Google sign-in could not be completed', 'error');
      }
    } catch (err: any) {
      console.error('Google sign-in exception:', err);
      showToast(err?.message || 'Unexpected error signing in with Google', 'error');
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, showToast]);

  const signOut = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        await signOutSupabase();
      }
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setSession(null);
      setCurrentPage('landing');
      showToast('Signed out of SplitMate', 'info');
    }
  }, [showToast]);

  const navigateTo = useCallback(
    (page: NavigationPage, groupId?: string) => {
      // If Supabase is configured and visitor is unauthenticated, protect non-landing pages
      if (page !== 'landing' && !session && isSupabaseConfigured) {
        showToast('Please sign in with Google to access SplitMate workspace', 'info');
        setCurrentPage('landing');
        return;
      }
      if (groupId) {
        setSelectedGroupId(groupId);
      }
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [session, showToast]
  );

  const getMember = useCallback(
    (memberId: string) => {
      if (memberId === data.currentUser.id) {
        return {
          id: data.currentUser.id,
          name: data.currentUser.name + ' (You)',
          avatar: data.currentUser.avatar,
          email: data.currentUser.email,
        };
      }
      const friend = data.friends.find((f) => f.id === memberId);
      if (friend) {
        return {
          id: friend.id,
          name: friend.name,
          avatar: friend.avatar,
          email: friend.email,
        };
      }
      return { id: memberId, name: 'Unknown Member' };
    },
    [data.currentUser, data.friends]
  );

  const getMemberName = useCallback(
    (memberId: string) => {
      if (memberId === data.currentUser.id) {
        return `${data.currentUser.name} (You)`;
      }
      const friend = data.friends.find((f) => f.id === memberId);
      return friend ? friend.name : 'Unknown';
    },
    [data.currentUser, data.friends]
  );

  // Group Management
  const createGroup = useCallback(
    (groupData: {
      name: string;
      description?: string;
      category: Group['category'];
      currency: string;
      memberIds: string[];
      icon?: string;
    }): Group => {
      const newId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // Always include current user in members
      const uniqueMembers = Array.from(new Set([data.currentUser.id, ...groupData.memberIds]));

      const newGroup: Group = {
        id: newId,
        name: groupData.name.trim(),
        description: groupData.description?.trim(),
        category: groupData.category,
        currency: groupData.currency || '₹',
        createdBy: data.currentUser.id,
        memberIds: uniqueMembers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        icon: groupData.icon || '🏷️',
      };

      const newActivity: Activity = {
        id: `act_${Date.now()}`,
        groupId: newId,
        actorId: data.currentUser.id,
        type: 'group_created',
        description: `${data.currentUser.name} created group "${newGroup.name}" with ${uniqueMembers.length} members`,
        timestamp: new Date().toISOString(),
        relatedEntityId: newId,
      };

      setData((prev) => ({
        ...prev,
        groups: [newGroup, ...prev.groups],
        activities: [newActivity, ...prev.activities],
      }));

      showToast(`Group "${newGroup.name}" created successfully!`);
      return newGroup;
    },
    [data.currentUser, showToast]
  );

  const updateGroup = useCallback(
    (groupId: string, updates: Partial<Group>) => {
      setData((prev) => {
        const existing = prev.groups.find((g) => g.id === groupId);
        if (!existing) return prev;

        const updated = {
          ...existing,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        const newActivity: Activity = {
          id: `act_${Date.now()}`,
          groupId,
          actorId: prev.currentUser.id,
          type: 'group_updated',
          description: `${prev.currentUser.name} updated group details for "${updated.name}"`,
          timestamp: new Date().toISOString(),
          relatedEntityId: groupId,
        };

        return {
          ...prev,
          groups: prev.groups.map((g) => (g.id === groupId ? updated : g)),
          activities: [newActivity, ...prev.activities],
        };
      });

      showToast('Group updated successfully');
    },
    [showToast]
  );

  const deleteGroup = useCallback(
    (groupId: string) => {
      const groupToDelete = data.groups.find((g) => g.id === groupId);
      const groupName = groupToDelete ? groupToDelete.name : 'Group';

      const newActivity: Activity = {
        id: `act_${Date.now()}`,
        actorId: data.currentUser.id,
        type: 'group_deleted',
        description: `${data.currentUser.name} deleted group "${groupName}"`,
        timestamp: new Date().toISOString(),
        relatedEntityId: groupId,
      };

      setData((prev) => ({
        ...prev,
        groups: prev.groups.filter((g) => g.id !== groupId),
        expenses: prev.expenses.filter((e) => e.groupId !== groupId),
        settlements: prev.settlements.filter((s) => s.groupId !== groupId),
        activities: [newActivity, ...prev.activities],
      }));

      showToast(`Group "${groupName}" deleted`, 'info');
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
        setCurrentPage('groups');
      }
    },
    [data.groups, data.currentUser, selectedGroupId, showToast]
  );

  const addMemberToGroup = useCallback(
    (groupId: string, memberId: string) => {
      setData((prev) => {
        const group = prev.groups.find((g) => g.id === groupId);
        if (!group || group.memberIds.includes(memberId)) return prev;

        const updatedGroup = {
          ...group,
          memberIds: [...group.memberIds, memberId],
          updatedAt: new Date().toISOString(),
        };

        const friend = prev.friends.find((f) => f.id === memberId);
        const memberName = friend ? friend.name : 'New member';

        const newActivity: Activity = {
          id: `act_${Date.now()}`,
          groupId,
          actorId: prev.currentUser.id,
          type: 'member_added',
          description: `${memberName} was added to "${group.name}"`,
          timestamp: new Date().toISOString(),
          relatedEntityId: memberId,
        };

        return {
          ...prev,
          groups: prev.groups.map((g) => (g.id === groupId ? updatedGroup : g)),
          activities: [newActivity, ...prev.activities],
        };
      });

      showToast('Member added to group');
    },
    [showToast]
  );

  const removeMemberFromGroup = useCallback(
    (groupId: string, memberId: string) => {
      if (memberId === data.currentUser.id) {
        showToast('You cannot remove yourself from your group', 'error');
        return;
      }

      setData((prev) => {
        const group = prev.groups.find((g) => g.id === groupId);
        if (!group) return prev;

        const updatedGroup = {
          ...group,
          memberIds: group.memberIds.filter((id) => id !== memberId),
          updatedAt: new Date().toISOString(),
        };

        const friend = prev.friends.find((f) => f.id === memberId);
        const memberName = friend ? friend.name : 'Member';

        const newActivity: Activity = {
          id: `act_${Date.now()}`,
          groupId,
          actorId: prev.currentUser.id,
          type: 'member_removed',
          description: `${memberName} was removed from "${group.name}"`,
          timestamp: new Date().toISOString(),
          relatedEntityId: memberId,
        };

        return {
          ...prev,
          groups: prev.groups.map((g) => (g.id === groupId ? updatedGroup : g)),
          activities: [newActivity, ...prev.activities],
        };
      });

      showToast('Member removed from group');
    },
    [data.currentUser, showToast]
  );

  // Friend actions
  const addFriend = useCallback(
    (friendData: { name: string; email?: string; phone?: string; avatar?: string }): Friend => {
      const newId = `friend_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newFriend: Friend = {
        id: newId,
        name: friendData.name.trim(),
        email: friendData.email?.trim(),
        phone: friendData.phone?.trim(),
        avatar:
          friendData.avatar ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            friendData.name
          )}&backgroundColor=1f2937&textColor=8faf9a`,
        createdAt: new Date().toISOString(),
      };

      const newActivity: Activity = {
        id: `act_${Date.now()}`,
        actorId: data.currentUser.id,
        type: 'friend_added',
        description: `Added "${newFriend.name}" as a friend`,
        timestamp: new Date().toISOString(),
        relatedEntityId: newId,
      };

      setData((prev) => ({
        ...prev,
        friends: [newFriend, ...prev.friends],
        activities: [newActivity, ...prev.activities],
      }));

      showToast(`Added ${newFriend.name} to friends`);
      return newFriend;
    },
    [data.currentUser, showToast]
  );

  const updateFriend = useCallback(
    (friendId: string, updates: Partial<Friend>) => {
      setData((prev) => ({
        ...prev,
        friends: prev.friends.map((f) => (f.id === friendId ? { ...f, ...updates } : f)),
      }));
      showToast('Friend details updated');
    },
    [showToast]
  );

  const removeFriend = useCallback(
    (friendId: string) => {
      const friend = data.friends.find((f) => f.id === friendId);
      const friendName = friend ? friend.name : 'Friend';

      const newActivity: Activity = {
        id: `act_${Date.now()}`,
        actorId: data.currentUser.id,
        type: 'friend_removed',
        description: `Removed "${friendName}" from friends list`,
        timestamp: new Date().toISOString(),
        relatedEntityId: friendId,
      };

      setData((prev) => ({
        ...prev,
        friends: prev.friends.filter((f) => f.id !== friendId),
        groups: prev.groups.map((g) => ({
          ...g,
          memberIds: g.memberIds.filter((id) => id !== friendId),
        })),
        activities: [newActivity, ...prev.activities],
      }));

      showToast(`Removed ${friendName} from friends`, 'info');
    },
    [data.friends, data.currentUser, showToast]
  );

  const addFriendToGroup = useCallback(
    (friendId: string, groupId: string) => {
      addMemberToGroup(groupId, friendId);
    },
    [addMemberToGroup]
  );

  // Expense actions
  const addExpense = useCallback(
    (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Expense => {
      const newId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newExpense: Expense = {
        ...expenseData,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const group = data.groups.find((g) => g.id === expenseData.groupId);
      const payerName = getMemberName(expenseData.paidBy);
      const formattedAmount = (expenseData.amountInPaise / 100).toLocaleString('en-IN');

      const newActivity: Activity = {
        id: `act_${Date.now()}`,
        groupId: expenseData.groupId,
        actorId: expenseData.paidBy,
        type: 'expense_added',
        description: `${payerName} added "${expenseData.title}" (₹${formattedAmount})${
          group ? ` in ${group.name}` : ''
        }`,
        amountInPaise: expenseData.amountInPaise,
        timestamp: new Date().toISOString(),
        relatedEntityId: newId,
      };

      setData((prev) => ({
        ...prev,
        expenses: [newExpense, ...prev.expenses],
        activities: [newActivity, ...prev.activities],
      }));

      showToast(`Added expense "${newExpense.title}"`);
      return newExpense;
    },
    [data.groups, getMemberName, showToast]
  );

  const updateExpense = useCallback(
    (expenseId: string, updates: Partial<Expense>) => {
      setData((prev) => {
        const existing = prev.expenses.find((e) => e.id === expenseId);
        if (!existing) return prev;

        const updatedExpense: Expense = {
          ...existing,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        const newActivity: Activity = {
          id: `act_${Date.now()}`,
          groupId: updatedExpense.groupId,
          actorId: prev.currentUser.id,
          type: 'expense_updated',
          description: `${prev.currentUser.name} updated expense "${updatedExpense.title}"`,
          amountInPaise: updatedExpense.amountInPaise,
          timestamp: new Date().toISOString(),
          relatedEntityId: expenseId,
        };

        return {
          ...prev,
          expenses: prev.expenses.map((e) => (e.id === expenseId ? updatedExpense : e)),
          activities: [newActivity, ...prev.activities],
        };
      });

      showToast('Expense updated successfully');
    },
    [showToast]
  );

  const deleteExpense = useCallback(
    (expenseId: string) => {
      const expenseToDelete = data.expenses.find((e) => e.id === expenseId);
      if (!expenseToDelete) return;

      const formattedAmount = (expenseToDelete.amountInPaise / 100).toLocaleString('en-IN');
      const newActivity: Activity = {
        id: `act_${Date.now()}`,
        groupId: expenseToDelete.groupId,
        actorId: data.currentUser.id,
        type: 'expense_deleted',
        description: `${data.currentUser.name} deleted expense "${expenseToDelete.title}" (₹${formattedAmount})`,
        amountInPaise: expenseToDelete.amountInPaise,
        timestamp: new Date().toISOString(),
        relatedEntityId: expenseId,
      };

      setData((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== expenseId),
        activities: [newActivity, ...prev.activities],
      }));

      showToast(`Expense "${expenseToDelete.title}" deleted`, 'info');
    },
    [data.expenses, data.currentUser, showToast]
  );

  // Settlement actions
  const addSettlement = useCallback(
    (settlementData: Omit<Settlement, 'id' | 'createdAt'>): Settlement => {
      const newId = `set_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newSettlement: Settlement = {
        ...settlementData,
        id: newId,
        createdAt: new Date().toISOString(),
      };

      const payerName = getMemberName(settlementData.paidBy);
      const receiverName = getMemberName(settlementData.paidTo);
      const group = data.groups.find((g) => g.id === settlementData.groupId);
      const formattedAmount = (settlementData.amountInPaise / 100).toLocaleString('en-IN');

      const newActivity: Activity = {
        id: `act_${Date.now()}`,
        groupId: settlementData.groupId,
        actorId: settlementData.paidBy,
        type: 'settlement_recorded',
        description: `${payerName} recorded settlement of ₹${formattedAmount} to ${receiverName}${
          group ? ` in ${group.name}` : ''
        }`,
        amountInPaise: settlementData.amountInPaise,
        timestamp: new Date().toISOString(),
        relatedEntityId: newId,
      };

      setData((prev) => ({
        ...prev,
        settlements: [newSettlement, ...prev.settlements],
        activities: [newActivity, ...prev.activities],
      }));

      showToast(`Settlement of ₹${formattedAmount} recorded successfully!`);
      return newSettlement;
    },
    [data.groups, getMemberName, showToast]
  );

  const deleteSettlement = useCallback(
    (settlementId: string) => {
      setData((prev) => ({
        ...prev,
        settlements: prev.settlements.filter((s) => s.id !== settlementId),
      }));
      showToast('Settlement record removed', 'info');
    },
    [showToast]
  );

  const deleteActivity = useCallback(
    (activityId: string) => {
      setData((prev) => ({
        ...prev,
        activities: prev.activities.filter((a) => a.id !== activityId),
      }));
      showToast('Activity record removed', 'info');
    },
    [showToast]
  );

  // User & Settings actions
  const updateCurrentUser = useCallback(
    (updates: Partial<User>) => {
      setData((prev) => ({
        ...prev,
        currentUser: { ...prev.currentUser, ...updates },
      }));
      showToast('Profile updated');
    },
    [showToast]
  );

  const resetToDemoData = useCallback(() => {
    const fresh = getFreshSeedData();
    setData(fresh);
    showToast('Reset to original sample data');
  }, [showToast]);

  const clearAllData = useCallback(() => {
    clearStoredData();
    setData({
      currentUser: { ...data.currentUser },
      friends: [],
      groups: [],
      expenses: [],
      settlements: [],
      activities: [],
    });
    showToast('All local data cleared', 'info');
  }, [data.currentUser, showToast]);

  return (
    <SplitMateContext.Provider
      value={{
        currentUser: data.currentUser,
        friends: data.friends,
        groups: data.groups,
        expenses: data.expenses,
        settlements: data.settlements,
        activities: data.activities,
        currentPage,
        selectedGroupId,
        toasts,
        session,
        authLoading,
        isAuthenticating,
        isSupabaseConfigured,
        signInWithGoogle,
        signOut,
        navigateTo,
        showToast,
        removeToast,
        getMember,
        getMemberName,
        createGroup,
        updateGroup,
        deleteGroup,
        addMemberToGroup,
        removeMemberFromGroup,
        addFriend,
        updateFriend,
        removeFriend,
        addFriendToGroup,
        addExpense,
        updateExpense,
        deleteExpense,
        addSettlement,
        deleteSettlement,
        deleteActivity,
        updateCurrentUser,
        resetToDemoData,
        clearAllData,
      }}
    >
      {children}
    </SplitMateContext.Provider>
  );
};

export const useSplitMate = (): SplitMateContextType => {
  const context = useContext(SplitMateContext);
  if (!context) {
    throw new Error('useSplitMate must be used within a SplitMateProvider');
  }
  return context;
};
