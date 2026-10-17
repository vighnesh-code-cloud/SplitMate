import { Group, Expense, Settlement, Friend, User } from '../types';
import {
  calculateGroupMemberBalances,
  calculateSimplifiedDebts,
  formatPaise,
} from './calculations';

export interface WorkspaceDataPayload {
  currentUser: User;
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  friends: Friend[];
}

export function executeGetAuthorizedGroups(
  data: WorkspaceDataPayload,
  currentUserId: string
) {
  const authorizedGroups = data.groups.filter((g) =>
    g.memberIds.includes(currentUserId)
  );

  return {
    success: true,
    count: authorizedGroups.length,
    groups: authorizedGroups.map((g) => {
      const groupExpenses = data.expenses.filter((e) => e.groupId === g.id);
      const totalSpendPaise = groupExpenses.reduce(
        (sum, e) => sum + e.amountInPaise,
        0
      );
      const memberNames = g.memberIds.map((mId) => {
        if (mId === data.currentUser.id) return `${data.currentUser.name} (You)`;
        const f = data.friends.find((fr) => fr.id === mId);
        return f ? f.name : mId;
      });

      return {
        id: g.id,
        name: g.name,
        category: g.category,
        currency: g.currency,
        totalExpensesCount: groupExpenses.length,
        totalSpendingFormatted: formatPaise(totalSpendPaise, g.currency),
        membersCount: g.memberIds.length,
        memberNames,
      };
    }),
  };
}

export function executeGetGroupSummary(
  data: WorkspaceDataPayload,
  currentUserId: string,
  groupNameOrId: string
) {
  const term = (groupNameOrId || '').trim().toLowerCase();
  // Find group by id or name
  const group = data.groups.find(
    (g) =>
      g.id.toLowerCase() === term ||
      g.name.toLowerCase().includes(term) ||
      term.includes(g.name.toLowerCase())
  );

  if (!group) {
    const available = data.groups
      .filter((g) => g.memberIds.includes(currentUserId))
      .map((g) => g.name);
    return {
      success: false,
      error: `Group '${groupNameOrId}' not found. Available authorized groups: ${available.join(', ')}`,
      availableGroups: available,
    };
  }

  // Check authorization
  if (!group.memberIds.includes(currentUserId)) {
    return {
      success: false,
      error: `You are not authorized to access group '${group.name}'.`,
    };
  }

  const getMemberName = (id: string) => {
    if (id === data.currentUser.id) return `${data.currentUser.name} (You)`;
    const f = data.friends.find((fr) => fr.id === id);
    return f ? f.name : id;
  };

  const groupExpenses = data.expenses.filter((e) => e.groupId === group.id);
  const groupSettlements = data.settlements.filter((s) => s.groupId === group.id);

  const totalPaise = groupExpenses.reduce((sum, e) => sum + e.amountInPaise, 0);

  // Category breakdown
  const categoryBreakdown: Record<string, { totalPaise: number; count: number }> = {};
  groupExpenses.forEach((exp) => {
    const cat = exp.category || 'Other';
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { totalPaise: 0, count: 0 };
    }
    categoryBreakdown[cat].totalPaise += exp.amountInPaise;
    categoryBreakdown[cat].count += 1;
  });

  const categories = Object.entries(categoryBreakdown).map(([category, stats]) => ({
    category,
    count: stats.count,
    totalFormatted: formatPaise(stats.totalPaise, group.currency),
    percentageOfTotal: totalPaise > 0 ? Math.round((stats.totalPaise / totalPaise) * 100) : 0,
  }));

  // Member balances
  const balances = calculateGroupMemberBalances(
    group,
    data.expenses,
    data.settlements,
    getMemberName
  );

  const simplifiedDebts = calculateSimplifiedDebts(balances, group.id);

  const memberBreakdown = balances.map((b) => {
    const isCurrentUser = b.memberId === currentUserId;
    let statusText = 'Settled up';
    if (b.netBalanceInPaise > 0) {
      statusText = `Should receive ${formatPaise(b.netBalanceInPaise, group.currency)}`;
    } else if (b.netBalanceInPaise < 0) {
      statusText = `Owes ${formatPaise(Math.abs(b.netBalanceInPaise), group.currency)}`;
    }

    return {
      memberId: b.memberId,
      name: b.name,
      isCurrentUser,
      totalPaid: formatPaise(b.totalPaidInPaise, group.currency),
      totalShare: formatPaise(b.totalShareInPaise, group.currency),
      netBalancePaise: b.netBalanceInPaise,
      netBalanceFormatted: formatPaise(b.netBalanceInPaise, group.currency),
      status: statusText,
    };
  });

  const recentExpenses = [...groupExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((e) => ({
      title: e.title,
      amount: formatPaise(e.amountInPaise, group.currency),
      paidBy: getMemberName(e.paidBy),
      date: e.date,
      category: e.category,
    }));

  return {
    success: true,
    groupId: group.id,
    groupName: group.name,
    category: group.category,
    currency: group.currency,
    totalExpensesCount: groupExpenses.length,
    totalRecordedExpenses: formatPaise(totalPaise, group.currency),
    totalSettlementsCount: groupSettlements.length,
    categories,
    members: memberBreakdown,
    outstandingDebts: simplifiedDebts.map((d) => ({
      from: d.fromName,
      to: d.toName,
      amount: formatPaise(d.amountInPaise, group.currency),
    })),
    recentExpenses,
  };
}

export function executeGetUserBalancesAndDebts(
  data: WorkspaceDataPayload,
  currentUserId: string,
  groupNameOrId?: string,
  otherMemberName?: string
) {
  const getMemberName = (id: string) => {
    if (id === data.currentUser.id) return `${data.currentUser.name} (You)`;
    const f = data.friends.find((fr) => fr.id === id);
    return f ? f.name : id;
  };

  const targetGroups = groupNameOrId
    ? data.groups.filter(
        (g) =>
          g.memberIds.includes(currentUserId) &&
          (g.id.toLowerCase() === groupNameOrId.toLowerCase() ||
            g.name.toLowerCase().includes(groupNameOrId.toLowerCase()))
      )
    : data.groups.filter((g) => g.memberIds.includes(currentUserId));

  let totalOwedToUserPaise = 0;
  let totalUserOwesPaise = 0;
  const debtsUserOwes: Array<{
    toPerson: string;
    group: string;
    amount: string;
    amountInPaise: number;
  }> = [];
  const debtsOwedToUser: Array<{
    fromPerson: string;
    group: string;
    amount: string;
    amountInPaise: number;
  }> = [];

  targetGroups.forEach((group) => {
    const balances = calculateGroupMemberBalances(
      group,
      data.expenses,
      data.settlements,
      getMemberName
    );
    const debts = calculateSimplifiedDebts(balances, group.id);

    debts.forEach((debt) => {
      if (debt.fromMemberId === currentUserId) {
        totalUserOwesPaise += debt.amountInPaise;
        debtsUserOwes.push({
          toPerson: debt.toName,
          group: group.name,
          amount: formatPaise(debt.amountInPaise, group.currency),
          amountInPaise: debt.amountInPaise,
        });
      } else if (debt.toMemberId === currentUserId) {
        totalOwedToUserPaise += debt.amountInPaise;
        debtsOwedToUser.push({
          fromPerson: debt.fromName,
          group: group.name,
          amount: formatPaise(debt.amountInPaise, group.currency),
          amountInPaise: debt.amountInPaise,
        });
      }
    });
  });

  // If filtered by specific person
  if (otherMemberName) {
    const pTerm = otherMemberName.trim().toLowerCase();
    const specificOwedByUser = debtsUserOwes.filter((d) =>
      d.toPerson.toLowerCase().includes(pTerm)
    );
    const specificOwedToUser = debtsOwedToUser.filter((d) =>
      d.fromPerson.toLowerCase().includes(pTerm)
    );

    const netOwedByUser = specificOwedByUser.reduce((s, d) => s + d.amountInPaise, 0);
    const netOwedToUser = specificOwedToUser.reduce((s, d) => s + d.amountInPaise, 0);
    const netDiff = netOwedToUser - netOwedByUser;

    return {
      success: true,
      filteredForPerson: otherMemberName,
      userOwesThem: specificOwedByUser,
      theyOweUser: specificOwedToUser,
      netDifferencePaise: netDiff,
      summary:
        netDiff > 0
          ? `${otherMemberName} owes you a net total of ${formatPaise(netDiff, '₹')}`
          : netDiff < 0
          ? `You owe ${otherMemberName} a net total of ${formatPaise(Math.abs(netDiff), '₹')}`
          : `You and ${otherMemberName} are completely settled up!`,
    };
  }

  const netBalancePaise = totalOwedToUserPaise - totalUserOwesPaise;

  return {
    success: true,
    totalOwedToUser: formatPaise(totalOwedToUserPaise, '₹'),
    totalUserOwes: formatPaise(totalUserOwesPaise, '₹'),
    netOverallBalance: formatPaise(netBalancePaise, '₹'),
    netStatus:
      netBalancePaise > 0
        ? `You are owed a total of ${formatPaise(netBalancePaise, '₹')} overall.`
        : netBalancePaise < 0
        ? `You owe a total of ${formatPaise(Math.abs(netBalancePaise), '₹')} overall.`
        : 'All your balances are completely settled up!',
    peopleYouOwe: debtsUserOwes,
    peopleWhoOweYou: debtsOwedToUser,
  };
}

export function executeGetPersonalSpending(
  data: WorkspaceDataPayload,
  currentUserId: string,
  timeFrame?: 'this_month' | 'last_month' | 'this_year' | 'all_time',
  category?: string
) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Authorized expenses (expenses in groups the user belongs to)
  const userGroupIds = new Set(
    data.groups.filter((g) => g.memberIds.includes(currentUserId)).map((g) => g.id)
  );

  const relevantExpenses = data.expenses.filter((exp) => {
    if (!userGroupIds.has(exp.groupId)) return false;

    // Must involve user (either paid by user or user had a share)
    const userInvolved = exp.paidBy === currentUserId || (exp.sharesInPaise && exp.sharesInPaise[currentUserId] > 0);
    if (!userInvolved) return false;

    // Category filter
    if (category && exp.category.toLowerCase() !== category.toLowerCase()) {
      return false;
    }

    // Date filter
    const expDate = new Date(exp.date);
    if (timeFrame === 'this_month') {
      return (
        expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth
      );
    }
    if (timeFrame === 'last_month') {
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
      return (
        expDate.getFullYear() === lastMonthDate.getFullYear() &&
        expDate.getMonth() === lastMonthDate.getMonth()
      );
    }
    if (timeFrame === 'this_year') {
      return expDate.getFullYear() === currentYear;
    }
    return true; // all_time
  });

  // Calculate user's share (actual personal cost) vs what user paid up front
  let totalUserSharePaise = 0;
  let totalUserPaidPaise = 0;
  const categoryBreakdown: Record<string, number> = {};

  relevantExpenses.forEach((exp) => {
    const userShare = exp.sharesInPaise?.[currentUserId] || 0;
    totalUserSharePaise += userShare;

    if (exp.paidBy === currentUserId) {
      totalUserPaidPaise += exp.amountInPaise;
    }

    const cat = exp.category || 'Other';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + userShare;
  });

  const categories = Object.entries(categoryBreakdown).map(([cat, sharePaise]) => ({
    category: cat,
    userShareFormatted: formatPaise(sharePaise, '₹'),
    percentage:
      totalUserSharePaise > 0
        ? Math.round((sharePaise / totalUserSharePaise) * 100)
        : 0,
  }));

  return {
    success: true,
    timeFrame: timeFrame || 'all_time',
    categoryFilter: category || 'all',
    expensesCount: relevantExpenses.length,
    userActualSpendingShare: formatPaise(totalUserSharePaise, '₹'),
    totalAmountUserPaidUpfront: formatPaise(totalUserPaidPaise, '₹'),
    explanation: `Your actual consumption share is ${formatPaise(totalUserSharePaise, '₹')}. You paid ${formatPaise(totalUserPaidPaise, '₹')} at checkout across these expenses.`,
    categoryBreakdown: categories,
    sampleExpenses: relevantExpenses.slice(0, 5).map((e) => ({
      title: e.title,
      totalAmount: formatPaise(e.amountInPaise, '₹'),
      yourShare: formatPaise(e.sharesInPaise?.[currentUserId] || 0, '₹'),
      paidByYou: e.paidBy === currentUserId,
      date: e.date,
      category: e.category,
    })),
  };
}

export function executeSearchExpenses(
  data: WorkspaceDataPayload,
  currentUserId: string,
  query?: string,
  groupNameOrId?: string,
  payerName?: string,
  category?: string
) {
  const userGroupIds = new Set(
    data.groups.filter((g) => g.memberIds.includes(currentUserId)).map((g) => g.id)
  );

  const getMemberName = (id: string) => {
    if (id === data.currentUser.id) return data.currentUser.name;
    const f = data.friends.find((fr) => fr.id === id);
    return f ? f.name : id;
  };

  const getGroupName = (id: string) => {
    const g = data.groups.find((grp) => grp.id === id);
    return g ? g.name : id;
  };

  const results = data.expenses.filter((exp) => {
    if (!userGroupIds.has(exp.groupId)) return false;

    if (query && !exp.title.toLowerCase().includes(query.toLowerCase()) && !exp.notes?.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }

    if (groupNameOrId) {
      const gName = getGroupName(exp.groupId).toLowerCase();
      if (!gName.includes(groupNameOrId.toLowerCase()) && exp.groupId !== groupNameOrId) {
        return false;
      }
    }

    if (payerName) {
      const pName = getMemberName(exp.paidBy).toLowerCase();
      if (!pName.includes(payerName.toLowerCase())) {
        return false;
      }
    }

    if (category && exp.category.toLowerCase() !== category.toLowerCase()) {
      return false;
    }

    return true;
  });

  return {
    success: true,
    totalFound: results.length,
    expenses: results.slice(0, 10).map((e) => ({
      id: e.id,
      title: e.title,
      group: getGroupName(e.groupId),
      amount: formatPaise(e.amountInPaise, '₹'),
      paidBy: getMemberName(e.paidBy),
      date: e.date,
      category: e.category,
      yourShare: formatPaise(e.sharesInPaise?.[currentUserId] || 0, '₹'),
    })),
  };
}
