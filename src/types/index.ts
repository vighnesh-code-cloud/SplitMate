export type GroupCategory = 'Trip' | 'Flatmates' | 'Food' | 'Shopping' | 'Event' | 'Other';

export type ExpenseCategory = 'Food' | 'Travel' | 'Accommodation' | 'Shopping' | 'Bills' | 'Entertainment' | 'Other';

export type SplitMethod = 'equal' | 'unequal' | 'percentage' | 'exact';

export type PaymentMethod = 'UPI' | 'Cash' | 'Bank Transfer' | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  defaultCurrency: string;
}

export interface Friend {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  category: GroupCategory;
  currency: string;
  createdBy: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
  icon?: string;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amountInPaise: number; // Integer in paise (1 INR = 100 paise)
  paidBy: string; // Member ID
  participantIds: string[]; // Member IDs
  sharesInPaise: Record<string, number>; // Member ID -> share in paise
  splitMethod: SplitMethod;
  category: ExpenseCategory;
  notes?: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  paidBy: string; // Payer memberId
  paidTo: string; // Receiver memberId
  amountInPaise: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export type ActivityType =
  | 'group_created'
  | 'group_updated'
  | 'group_deleted'
  | 'friend_added'
  | 'friend_removed'
  | 'member_added'
  | 'member_removed'
  | 'expense_added'
  | 'expense_updated'
  | 'expense_deleted'
  | 'settlement_recorded';

export interface Activity {
  id: string;
  groupId?: string;
  actorId: string;
  type: ActivityType;
  description: string;
  amountInPaise?: number;
  timestamp: string;
  relatedEntityId?: string;
}

export interface MemberBalance {
  memberId: string;
  name: string;
  totalPaidInPaise: number;
  totalShareInPaise: number;
  netBalanceInPaise: number; // > 0: should receive; < 0: owes money
}

export interface DebtRelation {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amountInPaise: number;
  groupId?: string;
}

export type NavigationPage =
  | 'landing'
  | 'dashboard'
  | 'groups'
  | 'group-details'
  | 'friends'
  | 'activity'
  | 'history'
  | 'settings'
  | 'assistant';

export * from './assistant';
