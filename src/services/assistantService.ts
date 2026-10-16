import { AssistantMessage, ChatRequestPayload, ChatResponsePayload } from '../types/assistant';
import {
  getAuthorizedGroups,
  buildGroupSummary,
  buildPersonalSpending,
  buildDebtSummary,
  queryExpenses,
  buildGroupsOverview,
  detectGroupFromQuery,
} from '../utils/aiLedgerEngine';

const CHAT_STORAGE_KEY = 'splitmate_ai_assistant_chat_v1';

/**
 * Loads stored chat conversation from localStorage.
 */
export function loadStoredChatMessages(): AssistantMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading stored chat messages:', e);
    return [];
  }
}

/**
 * Saves chat messages to localStorage.
 */
export function saveStoredChatMessages(messages: AssistantMessage[]): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error('Error saving chat messages:', e);
  }
}

/**
 * Client-side fallback that executes when server network endpoint is unreachable.
 * Computes exact arithmetic and verified summaries with zero hallucinations.
 */
function localClientFallback(payload: ChatRequestPayload): ChatResponsePayload {
  const { message, currentUserId, selectedGroupId, clientData } = payload;
  const authorizedGroups = getAuthorizedGroups(clientData.groups, currentUserId);

  if (authorizedGroups.length === 0) {
    return {
      message:
        "You do not have any active groups yet. Create or join a group to start tracking and analyzing shared expenses with SplitMate!",
      intent: 'GENERAL_HELP',
      provider: 'local_verified',
      modelName: 'SplitMate Local Ledger',
    };
  }

  const qLower = message.toLowerCase();
  let targetGroup = selectedGroupId
    ? authorizedGroups.find((g) => g.id === selectedGroupId) || null
    : null;

  const groupDetection = detectGroupFromQuery(message, authorizedGroups);
  if (groupDetection.matchedGroup) {
    targetGroup = groupDetection.matchedGroup;
  }

  if (
    !targetGroup &&
    groupDetection.groupMentionedGeneric &&
    authorizedGroups.length > 1
  ) {
    return {
      message: `Which group would you like me to inspect?\n\n${authorizedGroups
        .map((g) => `• **${g.name}** (${g.category})`)
        .join('\n')}\n\nPlease click an option below or mention it in your message.`,
      intent: 'CLARIFICATION_NEEDED',
      provider: 'local_verified',
      modelName: 'SplitMate Local Ledger',
      clarificationOptions: groupDetection.ambiguousGroups.map((g) => ({
        label: `${g.name} (${g.category})`,
        actionPrompt: `Summarize ${g.name}`,
        groupId: g.id,
      })),
    };
  }

  if (
    qLower.includes('my spend') ||
    qLower.includes('i spent') ||
    qLower.includes('how much have i') ||
    qLower.includes('personal spending')
  ) {
    const personal = buildPersonalSpending(
      currentUserId,
      authorizedGroups,
      clientData.expenses,
      clientData.settlements,
      clientData.friends,
      clientData.currentUser as any
    );

    return {
      message: `### Your Personal Spending Breakdown

• **Total Paid Out of Pocket:** ${personal.formattedTotalPaidOut}
• **Actual Consumed Share:** ${personal.formattedTotalShareConsumed}
• **Net Financial Position:** **${personal.formattedNetBalance}** (${
        personal.netBalanceInPaise >= 0
          ? 'You are owed this amount across your groups'
          : 'You currently owe this amount'
      })

#### Spending by Group
${personal.groupBreakdowns
  .map(
    (g) =>
      `• **${g.groupName}**: You paid ${g.formattedPaid} • Your share is ${g.formattedShare} (${g.formattedNetBalance})`
  )
  .join('\n')}

#### Outstanding Settlements for You
${
  personal.debtsOwedToUser.length > 0
    ? `• **Owed to you:** ${personal.debtsOwedToUser.map((d) => `${d.fromName} (${d.formattedAmount})`).join(', ')}`
    : '• No one currently owes you money.'
}
${
  personal.debtsUserOwes.length > 0
    ? `• **You owe:** ${personal.debtsUserOwes.map((d) => `${d.toName} (${d.formattedAmount})`).join(', ')}`
    : '• You do not owe anyone.'
}`,
      intent: 'PERSONAL_SPENDING',
      provider: 'local_verified',
      modelName: 'SplitMate Local Ledger',
      data: { personalSpending: personal },
    };
  }

  if (
    qLower.includes('who owes') ||
    qLower.includes('who owe') ||
    qLower.includes('balance') ||
    qLower.includes('debt')
  ) {
    const debtSummary = buildDebtSummary(
      currentUserId,
      authorizedGroups,
      clientData.expenses,
      clientData.settlements,
      clientData.friends,
      clientData.currentUser as any,
      targetGroup?.id
    );

    return {
      message: `### Who Owes Whom${targetGroup ? ` in **${targetGroup.name}**` : ''}

${
  debtSummary.debts.length === 0
    ? '🎉 **All settled up!** There are no outstanding debts.'
    : `Total outstanding: **${debtSummary.formattedTotalOutstanding}** across ${debtSummary.totalDebtsCount} transactions:\n\n` +
      debtSummary.debts
        .map(
          (d) =>
            `• **${d.fromName}** owes **${d.toName}** ${d.formattedAmount} ${
              !targetGroup && d.groupName ? `*(${d.groupName})*` : ''
            }`
        )
        .join('\n')
}`,
      intent: 'WHO_OWES_WHOM',
      provider: 'local_verified',
      modelName: 'SplitMate Local Ledger',
      data: { debtSummary },
    };
  }

  if (targetGroup) {
    const summary = buildGroupSummary(
      targetGroup,
      clientData.expenses,
      clientData.settlements,
      clientData.friends,
      clientData.currentUser as any
    );

    return {
      message: `### Complete Summary for **${summary.groupName}** (${summary.category})

**Total Recorded Expenses:** ${summary.formattedTotalSpend} across ${summary.totalExpensesCount} expenses.

#### Member Contributions vs Shares
| Member | Amount Paid | Consumed Share | Net Balance |
| :--- | :--- | :--- | :--- |
${summary.members
  .map(
    (m) =>
      `| ${m.name} | ${m.formattedPaid} | ${m.formattedShare} | **${m.formattedNetBalance}** |`
  )
  .join('\n')}

#### Who Owes Whom
${
  summary.simplifiedDebts.length > 0
    ? summary.simplifiedDebts.map((d) => `• **${d.fromName}** owes **${d.toName}** ${d.formattedAmount}`).join('\n')
    : '• *All balances are settled!*'
}

#### Key Observations
${summary.observations.map((o) => `• ${o}`).join('\n')}`,
      intent: 'SUMMARIZE_GROUP',
      provider: 'local_verified',
      modelName: 'SplitMate Local Ledger',
      data: { groupSummary: summary },
    };
  }

  const overview = buildGroupsOverview(
    authorizedGroups,
    clientData.expenses,
    clientData.settlements,
    clientData.friends,
    clientData.currentUser as any
  );

  return {
    message: `### Your Authorized Groups Overview

You have access to **${overview.length}** active ${overview.length === 1 ? 'group' : 'groups'}:

${overview
  .map(
    (g) =>
      `• **${g.name}** (${g.category})\n  - Total Spend: ${g.formattedTotalSpend}\n  - Your Balance: **${g.formattedUserNetBalance}** (${g.memberCount} members)`
  )
  .join('\n\n')}`,
    intent: 'LIST_GROUPS',
    provider: 'local_verified',
    modelName: 'SplitMate Local Ledger',
    data: { groupsOverview: overview },
  };
}

/**
 * Sends chat message to SplitMate AI Assistant backend.
 * Tries server endpoint first, falls back to local ledger calculations if needed.
 */
export async function sendAssistantMessage(
  payload: ChatRequestPayload
): Promise<ChatResponsePayload> {
  try {
    const response = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend assistant request failed, falling back to local ledger calculations:', err);
  }

  // Graceful deterministic fallback
  return localClientFallback(payload);
}
