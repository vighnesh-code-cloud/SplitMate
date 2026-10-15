import { Expense, Settlement, Group, MemberBalance, DebtRelation } from '../types';

/**
 * Formats integer paise into a clean currency string.
 * Example: 150000 -> "₹1,500", 150050 -> "₹1,500.50"
 */
export function formatPaise(amountInPaise: number, currency: string = '₹'): string {
  const isNegative = amountInPaise < 0;
  const absPaise = Math.abs(amountInPaise);
  const rupees = Math.floor(absPaise / 100);
  const paise = absPaise % 100;

  // Format integer part with Indian number grouping
  const rupeesFormatted = new Intl.NumberFormat('en-IN').format(rupees);

  let formatted = paise > 0 
    ? `${rupeesFormatted}.${paise.toString().padStart(2, '0')}` 
    : rupeesFormatted;

  return `${isNegative ? '-' : ''}${currency}${formatted}`;
}

export function formatPaiseWithSign(amountInPaise: number, currency: string = '₹'): string {
  if (amountInPaise === 0) return `${currency}0`;
  const sign = amountInPaise > 0 ? '+' : '';
  return `${sign}${formatPaise(amountInPaise, currency)}`;
}

/**
 * Safely converts rupee decimal string or number to integer paise.
 */
export function parseRupeesToPaise(val: string | number): number {
  if (typeof val === 'number') {
    if (isNaN(val)) return 0;
    return Math.round(val * 100);
  }
  const cleaned = val.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Accurately divides an amount in paise equally among participant IDs,
 * ensuring the sum of all shares exactly equals totalPaise down to the single paise.
 */
export function calculateEqualSplit(
  totalPaise: number,
  participantIds: string[]
): Record<string, number> {
  const result: Record<string, number> = {};
  if (!participantIds.length || totalPaise <= 0) return result;

  const count = participantIds.length;
  const baseShare = Math.floor(totalPaise / count);
  let remainder = totalPaise % count;

  participantIds.forEach((id) => {
    // Distribute 1 extra paise to first 'remainder' participants
    const share = baseShare + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    result[id] = share;
  });

  return result;
}

/**
 * Calculates member balances for a specific group.
 * Positive netBalance: member is owed money (they overpaid)
 * Negative netBalance: member owes money (they underpaid)
 * Zero: settled up
 */
export function calculateGroupMemberBalances(
  group: Group,
  expenses: Expense[],
  settlements: Settlement[],
  getMemberName: (id: string) => string
): MemberBalance[] {
  const groupExpenses = expenses.filter((e) => e.groupId === group.id);
  const groupSettlements = settlements.filter((s) => s.groupId === group.id);

  const memberStats: Record<
    string,
    { totalPaid: number; totalShare: number; settlementPaid: number; settlementReceived: number }
  > = {};

  // Initialize for all group members
  group.memberIds.forEach((id) => {
    memberStats[id] = { totalPaid: 0, totalShare: 0, settlementPaid: 0, settlementReceived: 0 };
  });

  // Calculate expenses paid and shares
  groupExpenses.forEach((expense) => {
    if (memberStats[expense.paidBy]) {
      memberStats[expense.paidBy].totalPaid += expense.amountInPaise;
    } else {
      memberStats[expense.paidBy] = {
        totalPaid: expense.amountInPaise,
        totalShare: 0,
        settlementPaid: 0,
        settlementReceived: 0,
      };
    }

    Object.entries(expense.sharesInPaise).forEach(([memberId, share]) => {
      if (!memberStats[memberId]) {
        memberStats[memberId] = { totalPaid: 0, totalShare: 0, settlementPaid: 0, settlementReceived: 0 };
      }
      memberStats[memberId].totalShare += share;
    });
  });

  // Calculate settlements
  groupSettlements.forEach((settlement) => {
    if (memberStats[settlement.paidBy]) {
      memberStats[settlement.paidBy].settlementPaid += settlement.amountInPaise;
    }
    if (memberStats[settlement.paidTo]) {
      memberStats[settlement.paidTo].settlementReceived += settlement.amountInPaise;
    }
  });

  return Object.keys(memberStats).map((memberId) => {
    const stats = memberStats[memberId];
    // Net balance = (what you paid for expenses - what you owe for expenses) + (what you settled to others - what others settled to you)
    const netBalance =
      stats.totalPaid - stats.totalShare + stats.settlementPaid - stats.settlementReceived;

    return {
      memberId,
      name: getMemberName(memberId),
      totalPaidInPaise: stats.totalPaid,
      totalShareInPaise: stats.totalShare,
      netBalanceInPaise: netBalance,
    };
  });
}

/**
 * Calculates simplified debt relations ("Who owes whom") from member balances.
 * Uses greedy matching of debtors to creditors to minimize total transactions.
 */
export function calculateSimplifiedDebts(
  memberBalances: MemberBalance[],
  groupId?: string
): DebtRelation[] {
  const creditors: { memberId: string; name: string; amount: number }[] = [];
  const debtors: { memberId: string; name: string; amount: number }[] = [];

  memberBalances.forEach((b) => {
    if (b.netBalanceInPaise > 0) {
      creditors.push({ memberId: b.memberId, name: b.name, amount: b.netBalanceInPaise });
    } else if (b.netBalanceInPaise < 0) {
      debtors.push({ memberId: b.memberId, name: b.name, amount: Math.abs(b.netBalanceInPaise) });
    }
  });

  // Sort descending
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const debts: DebtRelation[] = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const settledAmount = Math.min(creditor.amount, debtor.amount);
    if (settledAmount > 0) {
      debts.push({
        fromMemberId: debtor.memberId,
        fromName: debtor.name,
        toMemberId: creditor.memberId,
        toName: creditor.name,
        amountInPaise: settledAmount,
        groupId,
      });
    }

    creditor.amount -= settledAmount;
    debtor.amount -= settledAmount;

    if (creditor.amount === 0) cIdx++;
    if (debtor.amount === 0) dIdx++;
  }

  return debts;
}

/**
 * Computes dashboard overview stats for the logged-in user across all active groups.
 */
export function calculateDashboardStats(
  currentUserId: string,
  groups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  getMemberName: (id: string) => string
) {
  let totalGroupSpendingInPaise = 0;
  let totalUserOwesInPaise = 0;
  let totalOwedToUserInPaise = 0;

  groups.forEach((group) => {
    const isMember = group.memberIds.includes(currentUserId);
    const groupExpenses = expenses.filter((e) => e.groupId === group.id);
    
    // Group spending
    const groupTotal = groupExpenses.reduce((sum, e) => sum + e.amountInPaise, 0);
    totalGroupSpendingInPaise += groupTotal;

    if (isMember) {
      const balances = calculateGroupMemberBalances(group, expenses, settlements, getMemberName);
      const userBalance = balances.find((b) => b.memberId === currentUserId);
      if (userBalance) {
        if (userBalance.netBalanceInPaise > 0) {
          totalOwedToUserInPaise += userBalance.netBalanceInPaise;
        } else if (userBalance.netBalanceInPaise < 0) {
          totalUserOwesInPaise += Math.abs(userBalance.netBalanceInPaise);
        }
      }
    }
  });

  const netBalanceInPaise = totalOwedToUserInPaise - totalUserOwesInPaise;

  return {
    totalGroupSpendingInPaise,
    totalUserOwesInPaise,
    totalOwedToUserInPaise,
    netBalanceInPaise,
    activeGroupsCount: groups.length,
  };
}
