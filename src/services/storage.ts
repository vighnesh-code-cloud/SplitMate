import { User, Friend, Group, Expense, Settlement, Activity } from '../types';

const STORAGE_KEY = 'splitmate_app_data_v1';

export interface SplitMateStorageData {
  currentUser: User;
  friends: Friend[];
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  activities: Activity[];
}

export const INITIAL_USER: User = {
  id: 'user_alex',
  name: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  defaultCurrency: '₹',
};

export const INITIAL_FRIENDS: Friend[] = [
  {
    id: 'friend_rohan',
    name: 'Rohan Verma',
    email: 'rohan.v@example.com',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-10T10:00:00.000Z',
  },
  {
    id: 'friend_priya',
    name: 'Priya Sharma',
    email: 'priya.s@example.com',
    phone: '+91 98223 11445',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-12T14:30:00.000Z',
  },
  {
    id: 'friend_sam',
    name: 'Sam Chen',
    email: 'sam.chen@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-15T09:15:00.000Z',
  },
  {
    id: 'friend_maya',
    name: 'Maya Patel',
    email: 'maya.p@example.com',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-09-20T16:45:00.000Z',
  },
];

export const INITIAL_GROUPS: Group[] = [
  {
    id: 'group_flatmates',
    name: 'Bangalore Flat 402',
    description: 'Shared flat rent, high-speed WiFi, groceries & maid utilities',
    category: 'Flatmates',
    currency: '₹',
    createdBy: 'user_alex',
    memberIds: ['user_alex', 'friend_rohan', 'friend_sam'],
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
    icon: '🏠',
  },
  {
    id: 'group_brunch',
    name: 'Weekend Foodies',
    description: 'Café hops, artisan dinners and Sunday brunches',
    category: 'Food',
    currency: '₹',
    createdBy: 'user_alex',
    memberIds: ['user_alex', 'friend_priya', 'friend_maya'],
    createdAt: '2026-10-05T15:00:00.000Z',
    updatedAt: '2026-10-11T18:00:00.000Z',
    icon: '☕',
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    groupId: 'group_flatmates',
    title: 'High-speed Fiber WiFi & Utilities',
    amountInPaise: 240000, // ₹2,400
    paidBy: 'user_alex',
    participantIds: ['user_alex', 'friend_rohan', 'friend_sam'],
    sharesInPaise: {
      user_alex: 80000, // ₹800
      friend_rohan: 80000,
      friend_sam: 80000,
    },
    splitMethod: 'equal',
    category: 'Bills',
    notes: 'Airtel Broadband monthly gigabit connection',
    date: '2026-10-02',
    createdAt: '2026-10-02T11:00:00.000Z',
    updatedAt: '2026-10-02T11:00:00.000Z',
  },
  {
    id: 'exp_2',
    groupId: 'group_flatmates',
    title: 'Gourmet Organic Groceries & Supplies',
    amountInPaise: 300000, // ₹3,000
    paidBy: 'friend_rohan',
    participantIds: ['user_alex', 'friend_rohan', 'friend_sam'],
    sharesInPaise: {
      user_alex: 100000, // ₹1,000
      friend_rohan: 100000,
      friend_sam: 100000,
    },
    splitMethod: 'equal',
    category: 'Shopping',
    notes: 'Nature Basket olive oil, vegetables and dairy',
    date: '2026-10-06',
    createdAt: '2026-10-06T17:30:00.000Z',
    updatedAt: '2026-10-06T17:30:00.000Z',
  },
  {
    id: 'exp_3',
    groupId: 'group_brunch',
    title: 'Artisan Roast & Avocado Toast',
    amountInPaise: 180000, // ₹1,800
    paidBy: 'user_alex',
    participantIds: ['user_alex', 'friend_priya', 'friend_maya'],
    sharesInPaise: {
      user_alex: 60000, // ₹600
      friend_priya: 60000,
      friend_maya: 60000,
    },
    splitMethod: 'equal',
    category: 'Food',
    notes: 'Araku Coffee & sourdough bakery',
    date: '2026-10-08',
    createdAt: '2026-10-08T13:45:00.000Z',
    updatedAt: '2026-10-08T13:45:00.000Z',
  },
];

export const INITIAL_SETTLEMENTS: Settlement[] = [
  {
    id: 'set_1',
    groupId: 'group_flatmates',
    paidBy: 'friend_rohan',
    paidTo: 'user_alex',
    amountInPaise: 20000, // ₹200
    date: '2026-10-09',
    paymentMethod: 'UPI',
    notes: 'Settled via Google Pay for WiFi offset',
    createdAt: '2026-10-09T14:00:00.000Z',
  },
];

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act_1',
    groupId: 'group_flatmates',
    actorId: 'friend_rohan',
    type: 'settlement_recorded',
    description: 'Rohan Verma recorded a settlement of ₹200 to Alex Rivera',
    amountInPaise: 20000,
    timestamp: '2026-10-09T14:00:00.000Z',
    relatedEntityId: 'set_1',
  },
  {
    id: 'act_2',
    groupId: 'group_brunch',
    actorId: 'user_alex',
    type: 'expense_added',
    description: 'Alex Rivera added "Artisan Roast & Avocado Toast" (₹1,800)',
    amountInPaise: 180000,
    timestamp: '2026-10-08T13:45:00.000Z',
    relatedEntityId: 'exp_3',
  },
  {
    id: 'act_3',
    groupId: 'group_flatmates',
    actorId: 'friend_rohan',
    type: 'expense_added',
    description: 'Rohan Verma added "Gourmet Organic Groceries & Supplies" (₹3,000)',
    amountInPaise: 300000,
    timestamp: '2026-10-06T17:30:00.000Z',
    relatedEntityId: 'exp_2',
  },
  {
    id: 'act_4',
    groupId: 'group_brunch',
    actorId: 'user_alex',
    type: 'group_created',
    description: 'Alex Rivera created the group "Weekend Foodies"',
    timestamp: '2026-10-05T15:00:00.000Z',
    relatedEntityId: 'group_brunch',
  },
  {
    id: 'act_5',
    groupId: 'group_flatmates',
    actorId: 'user_alex',
    type: 'group_created',
    description: 'Alex Rivera created the group "Bangalore Flat 402"',
    timestamp: '2026-10-01T10:00:00.000Z',
    relatedEntityId: 'group_flatmates',
  },
];

export function loadStoredData(): SplitMateStorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getFreshSeedData();
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.groups || !Array.isArray(parsed.groups)) {
      return getFreshSeedData();
    }
    return parsed;
  } catch {
    return getFreshSeedData();
  }
}

export function saveStoredData(data: SplitMateStorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function getFreshSeedData(): SplitMateStorageData {
  return {
    currentUser: { ...INITIAL_USER },
    friends: [...INITIAL_FRIENDS],
    groups: [...INITIAL_GROUPS],
    expenses: [...INITIAL_EXPENSES],
    settlements: [...INITIAL_SETTLEMENTS],
    activities: [...INITIAL_ACTIVITIES],
  };
}

export function clearStoredData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}
