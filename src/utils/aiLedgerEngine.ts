import { Group, Expense, Settlement, Friend, User, ExpenseCategory } from '../types';
import {
  GroupSummaryData,
  PersonalSpendingData,
  DebtSummaryData,
  ExpenseQueryResultData,
  GroupOverviewItem,
  AIQueryIntent,
  CategoryBreakdown,
  MemberContributionShare,
  SimplifiedDebtItem,
  SettlementRecordItem,
} from '../types/assistant';
import {
  formatPaise,
  formatPaiseWithSign,
  calculateGroupMemberBalances,
  calculateSimplifiedDebts,
} from './calculations';

/**
 * Normalizes strings for robust fuzzy-search matching.
 */
function clean(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
}

/**
 * Filter down dataset strictly to groups the current user is authorized to access.
 * Prevents unauthorized data access across accounts.
 */
export function getAuthorizedGroups(groups: Group[], currentUserId: string): Group[] {
  return groups.filter(
    (g) => g.memberIds.includes(currentUserId) || g.createdBy === currentUserId
  );
}

/**
 * Helper to resolve member names deterministically from friends and currentUser.
 */
export function createMemberResolver(currentUser: User, friends: Friend[]) {
  const map = new Map<string, string>();
  map.set(currentUser.id, `${currentUser.name} (You)`);
  friends.forEach((f) => map.set(f.id, f.name));

  return (memberId: string): string => {
    if (map.has(memberId)) return map.get(memberId)!;
    if (memberId === currentUser.id) return `${currentUser.name} (You)`;
    const friend = friends.find((f) => f.id === memberId);
    if (friend) return friend.name;
    return `Member (${memberId.slice(0, 6)})`;
  };
}

/**
 * Intelligent group detection with ambiguity handling.
 */
export function detectGroupFromQuery(
  query: string,
  authorizedGroups: Group[]
): {
  matchedGroup: Group | null;
  ambiguousGroups: Group[];
  groupMentionedGeneric: boolean;
} {
  const qClean = clean(query);
  const words = qClean.split(/\s+/);

  // Exact or high-confidence substring match on group names or description
  const directMatches = authorizedGroups.filter((g) => {
    const nameClean = clean(g.name);
    return (
      qClean.includes(nameClean) ||
      nameClean.includes(qClean) ||
      words.some((w) => w.length >= 3 && nameClean.includes(w))
    );
  });

  if (directMatches.length === 1) {
    return { matchedGroup: directMatches[0], ambiguousGroups: [], groupMentionedGeneric: false };
  }

  // Category matching (e.g. "trip", "flatmates", "foodies", "shopping")
  const categoryMatches = authorizedGroups.filter((g) => {
    const catClean = clean(g.category);
    return qClean.includes(catClean) || (catClean === 'trip' && (qClean.includes('vacation') || qClean.includes('tour') || qClean.includes('holiday')));
  });

  if (categoryMatches.length === 1) {
    return { matchedGroup: categoryMatches[0], ambiguousGroups: [], groupMentionedGeneric: false };
  }

  // Check if generic "group" or "trip" was mentioned
  const groupMentionedGeneric =
    qClean.includes('group') ||
    qClean.includes('trip') ||
    qClean.includes('vacation') ||
    qClean.includes('flat') ||
    qClean.includes('our bill');

  const combinedAmbiguous = Array.from(new Set([...directMatches, ...categoryMatches]));

  return {
    matchedGroup: null,
    ambiguousGroups: combinedAmbiguous.length > 0 ? combinedAmbiguous : authorizedGroups,
    groupMentionedGeneric,
  };
}

/**
 * Computes complete verified summary for a single authorized group.
 */
export function buildGroupSummary(
  group: Group,
  expenses: Expense[],
  settlements: Settlement[],
  friends: Friend[],
  currentUser: User
): GroupSummaryData {
  const getMemberName = createMemberResolver(currentUser, friends);
  const currency = group.currency || currentUser.defaultCurrency || '₹';

  const groupExpenses = expenses.filter((e) => e.groupId === group.id);
  const groupSettlements = settlements.filter((s) => s.groupId === group.id);

  // Total spend
  const totalSpendInPaise = groupExpenses.reduce((sum, e) => sum + e.amountInPaise, 0);

  // Balances
  const memberBalances = calculateGroupMemberBalances(
    group,
    groupExpenses,
    groupSettlements,
    getMemberName
  );

  // Member contributions vs shares vs net
  const members: MemberContributionShare[] = memberBalances.map((b) => {
    let status: 'owes' | 'owed' | 'settled' = 'settled';
    if (b.netBalanceInPaise > 0) status = 'owed';
    else if (b.netBalanceInPaise < 0) status = 'owes';

    const friend = friends.find((f) => f.id === b.memberId);
    const avatar = b.memberId === currentUser.id ? currentUser.avatar : friend?.avatar;

    return {
      memberId: b.memberId,
      name: b.name,
      avatar,
      paidInPaise: b.totalPaidInPaise,
      formattedPaid: formatPaise(b.totalPaidInPaise, currency),
      shareInPaise: b.totalShareInPaise,
      formattedShare: formatPaise(b.totalShareInPaise, currency),
      netBalanceInPaise: b.netBalanceInPaise,
      formattedNetBalance: formatPaiseWithSign(b.netBalanceInPaise, currency),
      status,
    };
  });

  // Category breakdown
  const categoryMap = new Map<ExpenseCategory, { total: number; count: number }>();
  groupExpenses.forEach((e) => {
    const existing = categoryMap.get(e.category) || { total: 0, count: 0 };
    categoryMap.set(e.category, {
      total: existing.total + e.amountInPaise,
      count: existing.count + 1,
    });
  });

  const categories: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([cat, data]) => ({
      category: cat,
      amountInPaise: data.total,
      formattedAmount: formatPaise(data.total, currency),
      percentage: totalSpendInPaise > 0 ? Math.round((data.total / totalSpendInPaise) * 100) : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amountInPaise - a.amountInPaise);

  // Settlements
  const settlementsList: SettlementRecordItem[] = groupSettlements.map((s) => ({
    id: s.id,
    payerName: getMemberName(s.paidBy),
    receiverName: getMemberName(s.paidTo),
    amountInPaise: s.amountInPaise,
    formattedAmount: formatPaise(s.amountInPaise, currency),
    date: s.date,
    paymentMethod: s.paymentMethod,
    notes: s.notes,
  }));

  // Simplified debts
  const debts = calculateSimplifiedDebts(memberBalances, group.id).map((d) => ({
    fromMemberId: d.fromMemberId,
    fromName: d.fromName,
    toMemberId: d.toMemberId,
    toName: d.toName,
    amountInPaise: d.amountInPaise,
    formattedAmount: formatPaise(d.amountInPaise, currency),
    groupId: group.id,
    groupName: group.name,
  }));

  // Observations
  const observations: string[] = [];
  if (groupExpenses.length === 0) {
    observations.push('No expenses have been recorded yet in this group.');
  } else {
    // Highest single expense
    const maxExpense = [...groupExpenses].sort((a, b) => b.amountInPaise - a.amountInPaise)[0];
    if (maxExpense) {
      observations.push(
        `Largest expense: "${maxExpense.title}" at ${formatPaise(maxExpense.amountInPaise, currency)} paid by ${getMemberName(maxExpense.paidBy)}.`
      );
    }

    // Top spending category
    if (categories.length > 0) {
      observations.push(
        `Top spending category: ${categories[0].category} accounts for ${categories[0].percentage}% of total expenses (${categories[0].formattedAmount}).`
      );
    }

    // Spender observation
    const sortedSpenders = [...members].sort((a, b) => b.paidInPaise - a.paidInPaise);
    if (sortedSpenders.length > 0 && sortedSpenders[0].paidInPaise > 0) {
      observations.push(
        `${sortedSpenders[0].name} made the highest out-of-pocket contribution (${sortedSpenders[0].formattedPaid}).`
      );
    }

    // Settlement state
    const unsettledMembers = members.filter((m) => m.status !== 'settled');
    if (unsettledMembers.length === 0) {
      observations.push('All group members are currently fully settled up! 🎉');
    } else {
      observations.push(
        `${debts.length} pending settlement ${debts.length === 1 ? 'transaction' : 'transactions'} needed to balance all accounts.`
      );
    }
  }

  const currentUserMember = members.find((m) => m.memberId === currentUser.id);

  return {
    groupId: group.id,
    groupName: group.name,
    category: group.category,
    currency,
    totalExpensesCount: groupExpenses.length,
    totalSpendInPaise,
    formattedTotalSpend: formatPaise(totalSpendInPaise, currency),
    members,
    categories,
    settlements: settlementsList,
    simplifiedDebts: debts,
    observations,
    currentUserPaidInPaise: currentUserMember?.paidInPaise || 0,
    currentUserShareInPaise: currentUserMember?.shareInPaise || 0,
    currentUserNetBalanceInPaise: currentUserMember?.netBalanceInPaise || 0,
  };
}

/**
 * Computes personal spending analysis for the current user across authorized groups.
 */
export function buildPersonalSpending(
  currentUserId: string,
  authorizedGroups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  friends: Friend[],
  currentUser: User
): PersonalSpendingData {
  const getMemberName = createMemberResolver(currentUser, friends);
  const currency = currentUser.defaultCurrency || '₹';

  let totalPaidOutInPaise = 0;
  let totalShareConsumedInPaise = 0;

  const groupBreakdowns: PersonalSpendingData['groupBreakdowns'] = [];
  const debtsOwedToUser: SimplifiedDebtItem[] = [];
  const debtsUserOwes: SimplifiedDebtItem[] = [];

  const categoryTotals = new Map<ExpenseCategory, { total: number; count: number }>();
  const recentUserExpenses: PersonalSpendingData['recentUserExpenses'] = [];

  authorizedGroups.forEach((group) => {
    const groupExpenses = expenses.filter((e) => e.groupId === group.id);
    const groupSettlements = settlements.filter((s) => s.groupId === group.id);

    const balances = calculateGroupMemberBalances(group, groupExpenses, groupSettlements, getMemberName);
    const userBalance = balances.find((b) => b.memberId === currentUserId);

    const groupPaid = userBalance?.totalPaidInPaise || 0;
    const groupShare = userBalance?.totalShareInPaise || 0;
    const groupNet = userBalance?.netBalanceInPaise || 0;

    totalPaidOutInPaise += groupPaid;
    totalShareConsumedInPaise += groupShare;

    groupBreakdowns.push({
      groupId: group.id,
      groupName: group.name,
      paidInPaise: groupPaid,
      formattedPaid: formatPaise(groupPaid, currency),
      shareInPaise: groupShare,
      formattedShare: formatPaise(groupShare, currency),
      netBalanceInPaise: groupNet,
      formattedNetBalance: formatPaiseWithSign(groupNet, currency),
    });

    // Debts for this group
    const debts = calculateSimplifiedDebts(balances, group.id);
    debts.forEach((d) => {
      const debtItem: SimplifiedDebtItem = {
        fromMemberId: d.fromMemberId,
        fromName: d.fromName,
        toMemberId: d.toMemberId,
        toName: d.toName,
        amountInPaise: d.amountInPaise,
        formattedAmount: formatPaise(d.amountInPaise, currency),
        groupId: group.id,
        groupName: group.name,
      };

      if (d.toMemberId === currentUserId) {
        debtsOwedToUser.push(debtItem);
      } else if (d.fromMemberId === currentUserId) {
        debtsUserOwes.push(debtItem);
      }
    });

    // Expenses where user is involved
    groupExpenses.forEach((exp) => {
      const isPayer = exp.paidBy === currentUserId;
      const userShare = exp.sharesInPaise[currentUserId] || 0;

      if (isPayer || userShare > 0) {
        if (userShare > 0) {
          const currentCat = categoryTotals.get(exp.category) || { total: 0, count: 0 };
          categoryTotals.set(exp.category, {
            total: currentCat.total + userShare,
            count: currentCat.count + 1,
          });
        }

        recentUserExpenses.push({
          id: exp.id,
          title: exp.title,
          amountInPaise: exp.amountInPaise,
          formattedAmount: formatPaise(exp.amountInPaise, currency),
          groupName: group.name,
          date: exp.date,
          category: exp.category,
          role: isPayer ? 'paid' : 'participant',
        });
      }
    });
  });

  const categories: CategoryBreakdown[] = Array.from(categoryTotals.entries())
    .map(([cat, data]) => ({
      category: cat,
      amountInPaise: data.total,
      formattedAmount: formatPaise(data.total, currency),
      percentage:
        totalShareConsumedInPaise > 0
          ? Math.round((data.total / totalShareConsumedInPaise) * 100)
          : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amountInPaise - a.amountInPaise);

  const netBalanceInPaise = totalPaidOutInPaise - totalShareConsumedInPaise;

  return {
    userId: currentUserId,
    userName: currentUser.name,
    currency,
    totalPaidOutInPaise,
    formattedTotalPaidOut: formatPaise(totalPaidOutInPaise, currency),
    totalShareConsumedInPaise,
    formattedTotalShareConsumed: formatPaise(totalShareConsumedInPaise, currency),
    netBalanceInPaise,
    formattedNetBalance: formatPaiseWithSign(netBalanceInPaise, currency),
    groupBreakdowns,
    categoryBreakdowns: categories,
    debtsOwedToUser,
    debtsUserOwes,
    recentUserExpenses: recentUserExpenses.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
  };
}

/**
 * Computes all who-owes-whom simplified debt relations.
 */
export function buildDebtSummary(
  currentUserId: string,
  authorizedGroups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  friends: Friend[],
  currentUser: User,
  specificGroupId?: string
): DebtSummaryData {
  const getMemberName = createMemberResolver(currentUser, friends);
  const currency = currentUser.defaultCurrency || '₹';

  const targetGroups = specificGroupId
    ? authorizedGroups.filter((g) => g.id === specificGroupId)
    : authorizedGroups;

  const allDebts: SimplifiedDebtItem[] = [];
  const userOwes: SimplifiedDebtItem[] = [];
  const owedToUser: SimplifiedDebtItem[] = [];

  let totalOutstandingInPaise = 0;

  targetGroups.forEach((group) => {
    const groupExpenses = expenses.filter((e) => e.groupId === group.id);
    const groupSettlements = settlements.filter((s) => s.groupId === group.id);

    const balances = calculateGroupMemberBalances(group, groupExpenses, groupSettlements, getMemberName);
    const debts = calculateSimplifiedDebts(balances, group.id);

    debts.forEach((d) => {
      totalOutstandingInPaise += d.amountInPaise;

      const item: SimplifiedDebtItem = {
        fromMemberId: d.fromMemberId,
        fromName: d.fromName,
        toMemberId: d.toMemberId,
        toName: d.toName,
        amountInPaise: d.amountInPaise,
        formattedAmount: formatPaise(d.amountInPaise, currency),
        groupId: group.id,
        groupName: group.name,
      };

      allDebts.push(item);

      if (d.fromMemberId === currentUserId) {
        userOwes.push(item);
      } else if (d.toMemberId === currentUserId) {
        owedToUser.push(item);
      }
    });
  });

  return {
    currency,
    totalDebtsCount: allDebts.length,
    totalOutstandingInPaise,
    formattedTotalOutstanding: formatPaise(totalOutstandingInPaise, currency),
    debts: allDebts,
    userDebts: {
      userOwes,
      owedToUser,
    },
  };
}

/**
 * Search and filter expenses according to specific criteria.
 */
export function queryExpenses(
  authorizedGroups: Group[],
  expenses: Expense[],
  friends: Friend[],
  currentUser: User,
  query: string
): ExpenseQueryResultData {
  const getMemberName = createMemberResolver(currentUser, friends);
  const currency = currentUser.defaultCurrency || '₹';
  const qClean = clean(query);

  const groupIds = new Set(authorizedGroups.map((g) => g.id));
  const authorizedExpenses = expenses.filter((e) => groupIds.has(e.groupId));

  // Determine category filter if present
  const categoriesList: ExpenseCategory[] = [
    'Food',
    'Travel',
    'Accommodation',
    'Shopping',
    'Bills',
    'Entertainment',
    'Other',
  ];
  const matchedCategory = categoriesList.find((cat) => qClean.includes(cat.toLowerCase()));

  // Determine member filter
  const allMembers = [currentUser, ...friends];
  const matchedMember = allMembers.find((m) => clean(m.name).split(' ').some((part) => part.length >= 3 && qClean.includes(part)));

  const filtered = authorizedExpenses.filter((e) => {
    if (matchedCategory && e.category !== matchedCategory) return false;
    if (matchedMember && e.paidBy !== matchedMember.id && !e.participantIds.includes(matchedMember.id)) {
      return false;
    }
    if (!matchedCategory && !matchedMember) {
      const titleClean = clean(e.title);
      const notesClean = clean(e.notes || '');
      return (
        titleClean.includes(qClean) ||
        notesClean.includes(qClean) ||
        qClean.split(' ').some((word) => word.length >= 4 && titleClean.includes(word))
      );
    }
    return true;
  });

  const totalInPaise = filtered.reduce((sum, e) => sum + e.amountInPaise, 0);
  const groupMap = new Map(authorizedGroups.map((g) => [g.id, g.name]));

  return {
    count: filtered.length,
    totalInPaise,
    formattedTotal: formatPaise(totalInPaise, currency),
    currency,
    expenses: filtered.map((e) => ({
      id: e.id,
      groupId: e.groupId,
      groupName: groupMap.get(e.groupId) || 'Group',
      title: e.title,
      amountInPaise: e.amountInPaise,
      formattedAmount: formatPaise(e.amountInPaise, currency),
      paidByName: getMemberName(e.paidBy),
      date: e.date,
      category: e.category,
      notes: e.notes,
    })),
  };
}

/**
 * Overview of all authorized groups for broad queries.
 */
export function buildGroupsOverview(
  authorizedGroups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  friends: Friend[],
  currentUser: User
): GroupOverviewItem[] {
  const getMemberName = createMemberResolver(currentUser, friends);
  const currency = currentUser.defaultCurrency || '₹';

  return authorizedGroups.map((group) => {
    const groupExpenses = expenses.filter((e) => e.groupId === group.id);
    const groupSettlements = settlements.filter((s) => s.groupId === group.id);
    const totalSpendInPaise = groupExpenses.reduce((sum, e) => sum + e.amountInPaise, 0);

    const balances = calculateGroupMemberBalances(group, groupExpenses, groupSettlements, getMemberName);
    const userBalance = balances.find((b) => b.memberId === currentUser.id);
    const netBalance = userBalance?.netBalanceInPaise || 0;

    return {
      id: group.id,
      name: group.name,
      category: group.category,
      icon: group.icon,
      memberCount: group.memberIds.length,
      totalSpendInPaise,
      formattedTotalSpend: formatPaise(totalSpendInPaise, currency),
      userNetBalanceInPaise: netBalance,
      formattedUserNetBalance: formatPaiseWithSign(netBalance, currency),
    };
  });
}
