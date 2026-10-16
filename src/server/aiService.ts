import { GoogleGenAI } from '@google/genai';
import {
  ChatRequestPayload,
  ChatResponsePayload,
  AIQueryIntent,
} from '../types/assistant';
import {
  getAuthorizedGroups,
  detectGroupFromQuery,
  buildGroupSummary,
  buildPersonalSpending,
  buildDebtSummary,
  queryExpenses,
  buildGroupsOverview,
} from '../utils/aiLedgerEngine';

/**
 * System prompt strictly anchoring model generation to verified ledger calculations.
 */
const SYSTEM_INSTRUCTION = `You are SplitMate AI Assistant, a senior financial intelligence assistant inside SplitMate.
Your purpose is to answer questions about group expenses, personal spending, who owes whom, and financial summaries.

CORE CONSTITUTION:
1. TRUTH & INTEGRITY: All financial figures, totals, and balances are pre-calculated by the application ledger. You MUST use the EXACT figures provided in the verified context data. NEVER guess, estimate, or hallucinate financial numbers or transactions.
2. DISTINGUISH METRICS:
   - "Paid": Out-of-pocket money a member paid for group expenses.
   - "Share": The member's consumed or assigned responsibility for expenses.
   - "Net Balance": The resulting settlement position (+ amount to receive, - amount owed).
3. CLARITY & TONE: Professional, friendly, fintech-grade, concise, and structured. Use markdown bolding, clear bullet points, and tables where helpful.
4. UNIDENTIFIED GROUP: If the user asks about a group or trip without identifying which one, ask a short, courteous clarification question with the available group options.
5. NO INVENTED DATA: If an expense or member is not in the records, state that clearly rather than inventing one.`;

/**
 * Process the chat request through retrieval, verification, and provider routing.
 */
export async function processAssistantChat(
  payload: ChatRequestPayload
): Promise<ChatResponsePayload> {
  const { message, currentUserId, selectedGroupId, clientData } = payload;
  const groups = clientData.groups || [];
  const expenses = clientData.expenses || [];
  const settlements = clientData.settlements || [];
  const friends = clientData.friends || [];
  const currentUser = clientData.currentUser || {
    id: currentUserId,
    name: 'You',
    email: '',
    defaultCurrency: '₹',
  };

  // 1. Enforce row-level security & authorization
  const authorizedGroups = getAuthorizedGroups(groups, currentUserId);

  if (authorizedGroups.length === 0) {
    return {
      message:
        "You don't have any active groups yet. Create a group or join one to start tracking and analyzing shared expenses with SplitMate!",
      intent: 'GENERAL_HELP',
      provider: 'local_verified',
      modelName: 'SplitMate Ledger Engine',
    };
  }

  const qLower = message.toLowerCase();

  // 2. Identify Intent
  let intent: AIQueryIntent = 'GENERAL_HELP';
  let targetGroup = selectedGroupId
    ? authorizedGroups.find((g) => g.id === selectedGroupId) || null
    : null;

  const groupDetection = detectGroupFromQuery(message, authorizedGroups);

  if (groupDetection.matchedGroup) {
    targetGroup = groupDetection.matchedGroup;
  }

  // Detect specific query categories
  const isPersonalSpending =
    qLower.includes('my spend') ||
    qLower.includes('i spent') ||
    qLower.includes('how much have i') ||
    qLower.includes('my share') ||
    qLower.includes('my expense') ||
    qLower.includes('spent by me');

  const isWhoOwesWhom =
    qLower.includes('who owes') ||
    qLower.includes('who owe') ||
    qLower.includes('balances') ||
    qLower.includes('settle up') ||
    qLower.includes('outstanding') ||
    qLower.includes('debt') ||
    qLower.includes('do i owe') ||
    qLower.includes('owes me');

  const isAllGroupsQuery =
    qLower.includes('all group') ||
    qLower.includes('all my group') ||
    qLower.includes('overview of group') ||
    qLower.includes('list my group') ||
    qLower.includes('what group');

  const isSummarize =
    qLower.includes('summar') ||
    qLower.includes('breakdown') ||
    qLower.includes('total spend') ||
    qLower.includes('status of') ||
    qLower.includes('tell me about');

  const isExpenseSearch =
    qLower.includes('food') ||
    qLower.includes('travel') ||
    qLower.includes('shopping') ||
    qLower.includes('bill') ||
    qLower.includes('what did') ||
    qLower.includes('find expense') ||
    qLower.includes('recent expense') ||
    qLower.includes('wifi') ||
    qLower.includes('grocery');

  // Classification logic
  if (isAllGroupsQuery) {
    intent = 'LIST_GROUPS';
  } else if (targetGroup && (isSummarize || isWhoOwesWhom || qLower.includes(targetGroup.name.toLowerCase()))) {
    intent = isWhoOwesWhom ? 'WHO_OWES_WHOM' : 'SUMMARIZE_GROUP';
  } else if (!targetGroup && groupDetection.groupMentionedGeneric && authorizedGroups.length > 1) {
    intent = 'CLARIFICATION_NEEDED';
  } else if (isPersonalSpending) {
    intent = 'PERSONAL_SPENDING';
  } else if (isWhoOwesWhom) {
    intent = 'WHO_OWES_WHOM';
  } else if (isSummarize && authorizedGroups.length === 1) {
    targetGroup = authorizedGroups[0];
    intent = 'SUMMARIZE_GROUP';
  } else if (isExpenseSearch) {
    intent = 'EXPENSE_QUERY';
  } else if (authorizedGroups.length === 1 && !isPersonalSpending) {
    targetGroup = authorizedGroups[0];
    intent = 'SUMMARIZE_GROUP';
  }

  // 3. Execute exact ledger calculations based on intent
  let verifiedDataPayload: any = {};
  let structuredContextForLLM = '';
  let naturalFallbackResponse = '';
  let clarificationOptions: ChatResponsePayload['clarificationOptions'];

  if (intent === 'CLARIFICATION_NEEDED') {
    clarificationOptions = groupDetection.ambiguousGroups.map((g) => ({
      label: `${g.name} (${g.category})`,
      actionPrompt: `Summarize ${g.name}`,
      groupId: g.id,
    }));

    naturalFallbackResponse = `Which group or trip would you like me to inspect? You have access to:\n\n${authorizedGroups
      .map((g) => `• **${g.name}** (${g.category})`)
      .join('\n')}\n\nSelect one below or mention it in your reply.`;

    return {
      message: naturalFallbackResponse,
      intent,
      provider: 'local_verified',
      modelName: 'SplitMate Rule Engine',
      clarificationOptions,
    };
  }

  if (intent === 'SUMMARIZE_GROUP' && targetGroup) {
    const summary = buildGroupSummary(targetGroup, expenses, settlements, friends, currentUser);
    verifiedDataPayload = { groupSummary: summary };

    structuredContextForLLM = `
VERIFIED LEDGER DATA FOR GROUP: "${summary.groupName}" (${summary.category}):
- Total Recorded Group Expenses: ${summary.formattedTotalSpend} (${summary.totalExpensesCount} expenses)
- Currency: ${summary.currency}

MEMBER CONTRIBUTIONS & BALANCES:
${summary.members
  .map(
    (m) =>
      `• ${m.name}:
    - Paid Out of Pocket: ${m.formattedPaid}
    - Consumed Share: ${m.formattedShare}
    - Net Balance: ${m.formattedNetBalance} (${m.status === 'owed' ? 'Owed to member' : m.status === 'owes' ? 'Member owes group' : 'Settled'})`
  )
  .join('\n')}

EXPENSE CATEGORIES:
${summary.categories.map((c) => `• ${c.category}: ${c.formattedAmount} (${c.percentage}%, ${c.count} items)`).join('\n')}

RECORDED SETTLEMENTS:
${
  summary.settlements.length > 0
    ? summary.settlements
        .map((s) => `• ${s.date}: ${s.payerName} settled ${s.formattedAmount} to ${s.receiverName} via ${s.paymentMethod}`)
        .join('\n')
    : '• None recorded yet'
}

SIMPLIFIED WHO OWES WHOM:
${
  summary.simplifiedDebts.length > 0
    ? summary.simplifiedDebts.map((d) => `• ${d.fromName} owes ${d.toName} ${d.formattedAmount}`).join('\n')
    : '• Everyone is fully settled up!'
}

OBSERVATIONS:
${summary.observations.map((o) => `• ${o}`).join('\n')}
`;

    naturalFallbackResponse = `### Summary for **${summary.groupName}** (${summary.category})

**Total Recorded Expenses:** ${summary.formattedTotalSpend} across ${summary.totalExpensesCount} expenses.

#### Member Breakdown
| Member | Paid Out | Consumed Share | Net Balance |
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
${summary.observations.map((o) => `• ${o}`).join('\n')}`;
  } else if (intent === 'PERSONAL_SPENDING') {
    const personal = buildPersonalSpending(
      currentUserId,
      authorizedGroups,
      expenses,
      settlements,
      friends,
      currentUser
    );
    verifiedDataPayload = { personalSpending: personal };

    structuredContextForLLM = `
VERIFIED PERSONAL SPENDING SUMMARY FOR ${personal.userName}:
- Total Paid Out of Pocket: ${personal.formattedTotalPaidOut}
- Total Consumed Share: ${personal.formattedTotalShareConsumed}
- Net Standing: ${personal.formattedNetBalance} (${personal.netBalanceInPaise >= 0 ? 'User is overall owed money' : 'User overall owes money'})

BREAKDOWN BY GROUP:
${personal.groupBreakdowns
  .map(
    (g) =>
      `• ${g.groupName}: Paid ${g.formattedPaid}, Share ${g.formattedShare}, Net ${g.formattedNetBalance}`
  )
  .join('\n')}

TOP CATEGORIES:
${personal.categoryBreakdowns.map((c) => `• ${c.category}: ${c.formattedAmount} (${c.percentage}%)`).join('\n')}

DEBTS INVOLVING USER:
- Others owe user: ${
      personal.debtsOwedToUser.length > 0
        ? personal.debtsOwedToUser.map((d) => `${d.fromName} owes you ${d.formattedAmount} in ${d.groupName}`).join('; ')
        : 'None'
    }
- User owes others: ${
      personal.debtsUserOwes.length > 0
        ? personal.debtsUserOwes.map((d) => `You owe ${d.toName} ${d.formattedAmount} in ${d.groupName}`).join('; ')
        : 'None'
    }
`;

    naturalFallbackResponse = `### Your Personal Spending Overview

• **Total Paid Out of Pocket:** ${personal.formattedTotalPaidOut}
• **Actual Consumed Share:** ${personal.formattedTotalShareConsumed}
• **Overall Net Balance:** **${personal.formattedNetBalance}** (${
      personal.netBalanceInPaise >= 0 ? 'You are owed this amount across your groups' : 'You currently owe this amount'
    })

#### Spending by Group
${personal.groupBreakdowns
  .map(
    (g) =>
      `• **${g.groupName}**: You paid ${g.formattedPaid} • Your share is ${g.formattedShare} (${g.formattedNetBalance})`
  )
  .join('\n')}

${
  personal.categoryBreakdowns.length > 0
    ? `#### Category Distribution\n${personal.categoryBreakdowns
        .map((c) => `• **${c.category}**: ${c.formattedAmount} (${c.percentage}%)`)
        .join('\n')}`
    : ''
}

#### Outstanding Balances for You
${
  personal.debtsOwedToUser.length > 0
    ? `• **Owed to you:** ${personal.debtsOwedToUser.map((d) => `${d.fromName} (${d.formattedAmount})`).join(', ')}`
    : '• No one currently owes you money.'
}
${
  personal.debtsUserOwes.length > 0
    ? `• **You owe:** ${personal.debtsUserOwes.map((d) => `${d.toName} (${d.formattedAmount})`).join(', ')}`
    : '• You do not owe anyone.'
}`;
  } else if (intent === 'WHO_OWES_WHOM') {
    const debtData = buildDebtSummary(
      currentUserId,
      authorizedGroups,
      expenses,
      settlements,
      friends,
      currentUser,
      targetGroup?.id
    );
    verifiedDataPayload = { debtSummary: debtData };

    structuredContextForLLM = `
VERIFIED OUTSTANDING SETTLEMENTS & BALANCES${targetGroup ? ` FOR "${targetGroup.name}"` : ' ACROSS ALL GROUPS'}:
- Total Pending Transactions: ${debtData.totalDebtsCount}
- Total Outstanding Amount: ${debtData.formattedTotalOutstanding}

TRANSACTIONS NEEDED TO SETTLE UP:
${
  debtData.debts.length > 0
    ? debtData.debts.map((d) => `• ${d.fromName} owes ${d.toName} ${d.formattedAmount} (${d.groupName || 'Group'})`).join('\n')
    : '• Zero outstanding balances! All accounts settled.'
}

USER DIRECT DEBTS:
- You owe: ${debtData.userDebts.userOwes.map((d) => `${d.toName} (${d.formattedAmount})`).join(', ') || 'None'}
- Owed to you: ${debtData.userDebts.owedToUser.map((d) => `${d.fromName} (${d.formattedAmount})`).join(', ') || 'None'}
`;

    naturalFallbackResponse = `### Who Owes Whom${targetGroup ? ` in **${targetGroup.name}**` : ''}

${
  debtData.debts.length === 0
    ? '🎉 **All settled up!** There are no outstanding debts.'
    : `Total outstanding across ${debtData.totalDebtsCount} ${debtData.totalDebtsCount === 1 ? 'transaction' : 'transactions'}: **${debtData.formattedTotalOutstanding}**\n\n` +
      debtData.debts
        .map(
          (d) =>
            `• **${d.fromName}** ➔ **${d.toName}**: ${d.formattedAmount} ${
              !targetGroup && d.groupName ? `*(${d.groupName})*` : ''
            }`
        )
        .join('\n')
}`;
  } else if (intent === 'EXPENSE_QUERY') {
    const expResults = queryExpenses(authorizedGroups, expenses, friends, currentUser, message);
    verifiedDataPayload = { expenseQuery: expResults };

    structuredContextForLLM = `
VERIFIED MATCHING EXPENSES (Found ${expResults.count} matches, Total: ${expResults.formattedTotal}):
${
  expResults.expenses.length > 0
    ? expResults.expenses
        .slice(0, 10)
        .map(
          (e) =>
            `• ${e.date}: "${e.title}" - ${e.formattedAmount} (Paid by: ${e.paidByName}, Category: ${e.category}, Group: ${e.groupName})`
        )
        .join('\n')
    : '• No matching expenses found.'
}
`;

    naturalFallbackResponse = `### Matching Recorded Expenses

Found **${expResults.count}** matching ${expResults.count === 1 ? 'expense' : 'expenses'} totaling **${expResults.formattedTotal}**:

${
  expResults.expenses.length > 0
    ? expResults.expenses
        .map(
          (e) =>
            `• **${e.title}**: ${e.formattedAmount} • Paid by ${e.paidByName} on ${e.date} (${e.category} • *${e.groupName}*)`
        )
        .join('\n')
    : 'No expenses matched your search criteria.'
}`;
  } else if (intent === 'LIST_GROUPS') {
    const overview = buildGroupsOverview(authorizedGroups, expenses, settlements, friends, currentUser);
    verifiedDataPayload = { groupsOverview: overview };

    structuredContextForLLM = `
AUTHORIZED GROUPS OVERVIEW (${overview.length} groups):
${overview
  .map(
    (g) =>
      `• "${g.name}" (${g.category}): ${g.memberCount} members, Total Spending: ${g.formattedTotalSpend}, Your Balance: ${g.formattedUserNetBalance}`
  )
  .join('\n')}
`;

    naturalFallbackResponse = `### Your SplitMate Groups Overview

You have access to **${overview.length}** active ${overview.length === 1 ? 'group' : 'groups'}:

${overview
  .map(
    (g) =>
      `• **${g.name}** (${g.category})\n  - Total Group Spend: ${g.formattedTotalSpend}\n  - Your Balance: **${g.formattedUserNetBalance}** (${g.memberCount} members)`
  )
  .join('\n\n')}`;
  } else {
    // General help or guidance
    structuredContextForLLM = `
AVAILABLE USER GROUPS:
${authorizedGroups.map((g) => `• ${g.name} (${g.category})`).join(', ')}
`;
    naturalFallbackResponse = `I can help you analyze your SplitMate expenses and group settlements. Here are some things you can ask:

• **"Summarize ${authorizedGroups[0]?.name || 'my group'}"** — Complete breakdown of paid amounts, individual shares, and net balances.
• **"How much have I spent?"** — Your personal spending breakdown across categories and groups.
• **"Who owes whom?"** — Outstanding simplified debt relations and settlement options.
• **"Show food expenses"** — Search by category, member, or keyword.
• **"Overview of all my groups"** — High-level summary of your authorized spaces.`;
  }

  // 4. Provider-Independent AI Generation
  const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();

  // Route: Ollama / Gemma
  if (provider === 'ollama' || provider === 'gemma') {
    try {
      const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const ollamaModel = process.env.OLLAMA_MODEL || 'gemma2';

      const promptText = `${SYSTEM_INSTRUCTION}

${structuredContextForLLM}

USER QUESTION: "${message}"

Answer the user's question clearly and accurately using the verified data above:`;

      const ollamaRes = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: promptText,
          stream: false,
        }),
      });

      if (ollamaRes.ok) {
        const ollamaData = await ollamaRes.json();
        if (ollamaData?.response) {
          return {
            message: ollamaData.response.trim(),
            intent,
            provider: 'ollama',
            modelName: `Gemma (${ollamaModel})`,
            data: verifiedDataPayload,
            clarificationOptions,
          };
        }
      }
    } catch (ollamaErr) {
      console.warn('Ollama endpoint call failed, attempting Gemini or local fallback:', ollamaErr);
    }
  }

  // Route: Google Gemini API via @google/genai SDK
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const promptContent = `USER QUESTION: "${message}"

${structuredContextForLLM}

Provide an accurate, concise, natural language response based on this verified data:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptContent,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2,
        },
      });

      if (response && response.text) {
        return {
          message: response.text.trim(),
          intent,
          provider: 'gemini',
          modelName: 'Gemini 3.8 Flash',
          data: verifiedDataPayload,
          clarificationOptions,
        };
      }
    } catch (geminiErr) {
      console.warn('Gemini API call failed, falling back to verified deterministic ledger engine:', geminiErr);
    }
  }

  // Route: Verified Deterministic Engine Fallback (guaranteed 100% uptime with exact figures)
  return {
    message: naturalFallbackResponse,
    intent,
    provider: 'local_verified',
    modelName: 'SplitMate Verified Ledger Engine',
    data: verifiedDataPayload,
    clarificationOptions,
  };
}
