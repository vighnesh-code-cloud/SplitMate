import {
  executeGetAuthorizedGroups,
  executeGetGroupSummary,
  executeGetUserBalancesAndDebts,
  executeGetPersonalSpending,
  executeSearchExpenses,
  WorkspaceDataPayload,
} from '../utils/aiLedgerEngine';
import { AssistantStatus, AssistantChatResponse } from '../types/assistant';

const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b';

export const OLLAMA_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_authorized_groups',
      description: 'Retrieve the list of groups and trips the user is authorized to access, with total recorded spending and member names.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_group_summary',
      description: 'Retrieve a complete verified financial breakdown of a specific group or trip by name or ID. Returns total expenses, member contributions (what they paid), individual shares (what they owe), category breakdown, settlements, and net balances.',
      parameters: {
        type: 'object',
        properties: {
          group_name_or_id: {
            type: 'string',
            description: 'The exact or approximate name or ID of the group/trip (e.g. "Goa Trip", "Bangalore Flat 402").',
          },
        },
        required: ['group_name_or_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_user_balances_and_debts',
      description: 'Retrieve the current user\'s outstanding net balance, who they owe money to, and who owes them money across all groups or for a specific group/person.',
      parameters: {
        type: 'object',
        properties: {
          group_name_or_id: {
            type: 'string',
            description: 'Optional group name or ID to filter balances for a single group.',
          },
          other_member_name: {
            type: 'string',
            description: 'Optional name of a specific member/friend (e.g. "Rahul", "Priya") to check net balance with.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_personal_spending',
      description: 'Retrieve the authenticated user\'s personal spending totals, consumption share, and category breakdown for a specific time frame.',
      parameters: {
        type: 'object',
        properties: {
          time_frame: {
            type: 'string',
            enum: ['this_month', 'last_month', 'this_year', 'all_time'],
            description: 'Time window for spending calculations. Defaults to all_time if not specified.',
          },
          category: {
            type: 'string',
            description: 'Optional category name to filter spending by (e.g. "Food & Dining", "Travel").',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_expenses',
      description: 'Search expenses by description/title query, group, category, or payer name.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Keywords to search in expense titles and notes (e.g. "dinner", "flight", "groceries").',
          },
          group_name_or_id: {
            type: 'string',
            description: 'Optional group name or ID to search within.',
          },
          payer_name: {
            type: 'string',
            description: 'Optional name of person who paid.',
          },
          category: {
            type: 'string',
            description: 'Optional expense category.',
          },
        },
      },
    },
  },
];

export async function checkOllamaHealth(): Promise<AssistantStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        available: false,
        provider: 'ollama',
        model: OLLAMA_MODEL,
        baseUrl: OLLAMA_BASE_URL,
        error: `Ollama returned HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = (await res.json()) as { models?: Array<{ name: string }> };
    const modelNames = (data.models || []).map((m) => m.name);
    const hasRequestedModel = modelNames.some((n) =>
      n.toLowerCase().includes(OLLAMA_MODEL.toLowerCase().split(':')[0])
    );

    return {
      available: true,
      provider: 'ollama',
      model: OLLAMA_MODEL,
      baseUrl: OLLAMA_BASE_URL,
      installedModels: modelNames,
      error: hasRequestedModel
        ? undefined
        : `Model '${OLLAMA_MODEL}' was not found in installed models (${modelNames.join(', ') || 'none'}). Run: ollama run ${OLLAMA_MODEL}`,
    };
  } catch (err: any) {
    return {
      available: false,
      provider: 'ollama',
      model: OLLAMA_MODEL,
      baseUrl: OLLAMA_BASE_URL,
      error: `Could not connect to Ollama at ${OLLAMA_BASE_URL}. Ensure Ollama is running (e.g. 'ollama serve' or 'ollama run ${OLLAMA_MODEL}'). ${err?.message || ''}`.trim(),
    };
  }
}

function executeTool(
  toolName: string,
  toolArgs: any,
  workspaceData: WorkspaceDataPayload,
  userId: string
): any {
  switch (toolName) {
    case 'get_authorized_groups':
      return executeGetAuthorizedGroups(workspaceData, userId);
    case 'get_group_summary':
      return executeGetGroupSummary(
        workspaceData,
        userId,
        toolArgs?.group_name_or_id || ''
      );
    case 'get_user_balances_and_debts':
      return executeGetUserBalancesAndDebts(
        workspaceData,
        userId,
        toolArgs?.group_name_or_id,
        toolArgs?.other_member_name
      );
    case 'get_personal_spending':
      return executeGetPersonalSpending(
        workspaceData,
        userId,
        toolArgs?.time_frame,
        toolArgs?.category
      );
    case 'search_expenses':
      return executeSearchExpenses(
        workspaceData,
        userId,
        toolArgs?.query,
        toolArgs?.group_name_or_id,
        toolArgs?.payer_name,
        toolArgs?.category
      );
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

/**
 * Extracts tool calls from model content if Gemma outputs JSON or XML-style function calls in text.
 */
function extractToolCallFromText(content: string): { name: string; arguments: any } | null {
  if (!content) return null;

  // Check for json block
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  const textToParse = jsonMatch ? jsonMatch[1] : content;

  try {
    const parsed = JSON.parse(textToParse.trim());
    if (parsed.name && (parsed.arguments !== undefined || parsed.parameters !== undefined)) {
      return {
        name: parsed.name,
        arguments: parsed.arguments || parsed.parameters || {},
      };
    }
    if (parsed.tool && (parsed.arguments !== undefined || parsed.parameters !== undefined)) {
      return {
        name: parsed.tool,
        arguments: parsed.arguments || parsed.parameters || {},
      };
    }
    if (parsed.action === 'tool_call' && parsed.tool) {
      return {
        name: parsed.tool,
        arguments: parsed.parameters || parsed.arguments || {},
      };
    }
  } catch {
    // Check for inline tool invocation like tool:get_group_summary(...)
    const toolRegex = /(?:call|invoke|tool):\s*([a-zA-Z0-9_]+)\s*\(\s*(\{[\s\S]*?\})\s*\)/i;
    const match = content.match(toolRegex);
    if (match) {
      try {
        return {
          name: match[1],
          arguments: JSON.parse(match[2]),
        };
      } catch {
        // Ignore
      }
    }
  }

  return null;
}

export async function processAssistantChat(params: {
  messages: Array<{ role: 'user' | 'assistant' | 'system' | 'tool'; content: string }>;
  userId: string;
  workspaceData: WorkspaceDataPayload;
}): Promise<AssistantChatResponse> {
  const { messages, userId, workspaceData } = params;

  // Check Ollama status first
  const status = await checkOllamaHealth();
  if (!status.available) {
    throw new Error(
      status.error ||
        `Ollama AI service is currently unavailable at ${OLLAMA_BASE_URL}. Please ensure Ollama is running with '${OLLAMA_MODEL}'.`
    );
  }

  const currentUserName = workspaceData.currentUser?.name || 'User';
  const groupNames = workspaceData.groups
    .filter((g) => g.memberIds.includes(userId))
    .map((g) => g.name);

  const systemPrompt = `You are SplitMate Assistant, an intelligent expense companion powered by Gemma 3 4B.
You assist ${currentUserName} with their shared expenses, group summaries, balances, and debts in SplitMate.

CURRENT CONTEXT:
- Authenticated user: ${currentUserName} (ID: ${userId})
- User's authorized groups: ${groupNames.length > 0 ? groupNames.join(', ') : 'None yet'}
- Currency: ${workspaceData.currentUser?.defaultCurrency || '₹'}

CAPABILITIES AND BEHAVIOR:
1. GREETINGS & CASUAL TALK:
   When the user sends a greeting (e.g. "Hi", "Hello", "Good morning") or asks what you can do, respond warmly, conversationally, and concisely. Introduce what you can do (e.g. check balances, see who owes whom, summarize groups, break down personal spending) WITHOUT querying or summarizing expenses.

2. RETRIEVING FINANCIAL DATA VIA TOOLS:
   You have access to tools to query verified financial records. When a user asks about expenses, balances, trips, or spending, you MUST call the appropriate tool.
   AVAILABLE TOOLS:
   - get_authorized_groups(): Get list of all groups the user belongs to.
   - get_group_summary(group_name_or_id): Get full breakdown for a specific group/trip.
   - get_user_balances_and_debts(group_name_or_id?, other_member_name?): Get who owes user and who user owes.
   - get_personal_spending(time_frame?, category?): Get user's personal spending share and totals.
   - search_expenses(query?, group_name_or_id?, payer_name?, category?): Search expenses.

3. STRICT ACCURACY RULES:
   - NEVER make up or fabricate figures, dates, or balances.
   - Always report the exact numbers computed by the tools.
   - When explaining group expenses, clearly distinguish what a member paid up front from their consumption share, and what they still owe or are owed.
   - If a user asks about a specific person or group that is ambiguous or not specified, ask a polite clarification question instead of guessing.

4. TONE:
   Helpful, clear, professional yet friendly. Use formatting like bullet points or bold text to highlight key amounts and names.`;

  // Prepare messages array for Ollama
  const ollamaMessages: Array<{ role: string; content: string; tool_calls?: any[] }> = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  const toolsUsed: string[] = [];
  let suggestedActions: AssistantChatResponse['suggestedActions'] = undefined;

  // Tool loop (max 4 turns)
  for (let turn = 0; turn < 4; turn++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const ollamaPayload: any = {
      model: OLLAMA_MODEL,
      messages: ollamaMessages,
      tools: OLLAMA_TOOLS,
      stream: false,
      options: {
        temperature: 0.2,
      },
    };

    let chatRes: Response;
    try {
      chatRes = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ollamaPayload),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      throw new Error(`Failed to communicate with Gemma 3 4B on Ollama: ${fetchErr?.message || 'Connection lost'}`);
    }
    clearTimeout(timeoutId);

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      throw new Error(`Ollama chat error (HTTP ${chatRes.status}): ${errText || chatRes.statusText}`);
    }

    const resJson = await chatRes.json();
    const msg = resJson.message;

    if (!msg) {
      throw new Error('Received empty response from Gemma 3 4B.');
    }

    // Check for native tool_calls
    const nativeToolCalls = msg.tool_calls;
    if (Array.isArray(nativeToolCalls) && nativeToolCalls.length > 0) {
      // Append assistant message with tool calls
      ollamaMessages.push(msg);

      for (const tc of nativeToolCalls) {
        const fnName = tc.function?.name;
        let fnArgs = tc.function?.arguments;
        if (typeof fnArgs === 'string') {
          try {
            fnArgs = JSON.parse(fnArgs);
          } catch {
            fnArgs = {};
          }
        }

        toolsUsed.push(fnName);
        const result = executeTool(fnName, fnArgs, workspaceData, userId);

        if (fnName === 'get_user_balances_and_debts' || fnName === 'get_group_summary') {
          suggestedActions = [
            { label: 'Settle Up Now', type: 'settle_up' },
          ];
        }

        ollamaMessages.push({
          role: 'tool',
          content: JSON.stringify(result),
        });
      }
      // Continue to next turn so Gemma can formulate response with tool output
      continue;
    }

    // Check if Gemma outputted a text-based tool call
    const textToolCall = extractToolCallFromText(msg.content);
    if (textToolCall) {
      toolsUsed.push(textToolCall.name);
      const result = executeTool(textToolCall.name, textToolCall.arguments, workspaceData, userId);

      if (textToolCall.name === 'get_user_balances_and_debts' || textToolCall.name === 'get_group_summary') {
        suggestedActions = [
          { label: 'Settle Up Now', type: 'settle_up' },
        ];
      }

      ollamaMessages.push(msg);
      ollamaMessages.push({
        role: 'tool',
        content: JSON.stringify(result),
      });
      continue;
    }

    // Final response from Gemma
    let finalContent = msg.content || '';

    // If final content discusses debt balances or owing, suggest Settle Up action
    if (
      !suggestedActions &&
      (finalContent.toLowerCase().includes('owe') ||
        finalContent.toLowerCase().includes('settle') ||
        finalContent.toLowerCase().includes('balance'))
    ) {
      suggestedActions = [{ label: 'Settle Up Now', type: 'settle_up' }];
    }

    return {
      reply: finalContent,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
      suggestedActions,
    };
  }

  throw new Error('Gemma 3 4B exceeded tool turn limit without completing response.');
}
