import { ExpenseCategory, PaymentMethod } from './index';

export type AssistantRole = 'user' | 'assistant' | 'system';

export type AIQueryIntent =
  | 'SUMMARIZE_GROUP'
  | 'PERSONAL_SPENDING'
  | 'WHO_OWES_WHOM'
  | 'EXPENSE_QUERY'
  | 'LIST_GROUPS'
  | 'CLARIFICATION_NEEDED'
  | 'GENERAL_HELP';

export interface MemberContributionShare {
  memberId: string;
  name: string;
  avatar?: string;
  paidInPaise: number;
  formattedPaid: string;
  shareInPaise: number;
  formattedShare: string;
  netBalanceInPaise: number;
  formattedNetBalance: string;
  status: 'owes' | 'owed' | 'settled';
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  amountInPaise: number;
  formattedAmount: string;
  percentage: number;
  count: number;
}

export interface SimplifiedDebtItem {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amountInPaise: number;
  formattedAmount: string;
  groupId?: string;
  groupName?: string;
}

export interface SettlementRecordItem {
  id: string;
  payerName: string;
  receiverName: string;
  amountInPaise: number;
  formattedAmount: string;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface GroupSummaryData {
  groupId: string;
  groupName: string;
  category: string;
  currency: string;
  totalExpensesCount: number;
  totalSpendInPaise: number;
  formattedTotalSpend: string;
  members: MemberContributionShare[];
  categories: CategoryBreakdown[];
  settlements: SettlementRecordItem[];
  simplifiedDebts: SimplifiedDebtItem[];
  observations: string[];
  currentUserPaidInPaise: number;
  currentUserShareInPaise: number;
  currentUserNetBalanceInPaise: number;
}

export interface PersonalSpendingData {
  userId: string;
  userName: string;
  currency: string;
  totalPaidOutInPaise: number;
  formattedTotalPaidOut: string;
  totalShareConsumedInPaise: number;
  formattedTotalShareConsumed: string;
  netBalanceInPaise: number;
  formattedNetBalance: string;
  groupBreakdowns: {
    groupId: string;
    groupName: string;
    paidInPaise: number;
    formattedPaid: string;
    shareInPaise: number;
    formattedShare: string;
    netBalanceInPaise: number;
    formattedNetBalance: string;
  }[];
  categoryBreakdowns: CategoryBreakdown[];
  debtsOwedToUser: SimplifiedDebtItem[];
  debtsUserOwes: SimplifiedDebtItem[];
  recentUserExpenses: {
    id: string;
    title: string;
    amountInPaise: number;
    formattedAmount: string;
    groupName: string;
    date: string;
    category: ExpenseCategory;
    role: 'paid' | 'participant';
  }[];
}

export interface DebtSummaryData {
  currency: string;
  totalDebtsCount: number;
  totalOutstandingInPaise: number;
  formattedTotalOutstanding: string;
  debts: SimplifiedDebtItem[];
  userDebts: {
    userOwes: SimplifiedDebtItem[];
    owedToUser: SimplifiedDebtItem[];
  };
}

export interface ExpenseQueryResultData {
  count: number;
  totalInPaise: number;
  formattedTotal: string;
  currency: string;
  expenses: {
    id: string;
    groupId: string;
    groupName: string;
    title: string;
    amountInPaise: number;
    formattedAmount: string;
    paidByName: string;
    date: string;
    category: ExpenseCategory;
    notes?: string;
  }[];
}

export interface GroupOverviewItem {
  id: string;
  name: string;
  category: string;
  icon?: string;
  memberCount: number;
  totalSpendInPaise: number;
  formattedTotalSpend: string;
  userNetBalanceInPaise: number;
  formattedUserNetBalance: string;
}

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  timestamp: string;
  intent?: AIQueryIntent;
  data?: {
    groupSummary?: GroupSummaryData;
    personalSpending?: PersonalSpendingData;
    debtSummary?: DebtSummaryData;
    expenseQuery?: ExpenseQueryResultData;
    groupsOverview?: GroupOverviewItem[];
  };
  clarificationOptions?: {
    label: string;
    actionPrompt: string;
    groupId?: string;
  }[];
  provider?: 'gemini' | 'ollama' | 'local_verified';
  modelName?: string;
}

export interface ChatRequestPayload {
  message: string;
  history?: { role: AssistantRole; content: string }[];
  currentUserId: string;
  selectedGroupId?: string | null;
  // Context snapshot from client (ensuring instant, synchronized data)
  clientData: {
    currentUser: {
      id: string;
      name: string;
      email: string;
      defaultCurrency: string;
    };
    groups: any[];
    expenses: any[];
    settlements: any[];
    friends: any[];
  };
}

export interface ChatResponsePayload {
  message: string;
  intent: AIQueryIntent;
  provider: 'gemini' | 'ollama' | 'local_verified';
  modelName: string;
  data?: AssistantMessage['data'];
  clarificationOptions?: AssistantMessage['clarificationOptions'];
}
