import {
  AssistantMessage,
  AssistantStatus,
  AssistantChatRequest,
  AssistantChatResponse,
} from '../types/assistant';

export async function fetchAssistantStatus(): Promise<AssistantStatus> {
  try {
    const res = await fetch('/api/assistant/status');
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      available: false,
      provider: 'ollama',
      model: 'gemma3:4b',
      baseUrl: 'http://127.0.0.1:11434',
      error: err?.message || 'Could not connect to SplitMate backend server',
    };
  }
}

export async function sendChatMessage(
  messages: Array<{ role: 'user' | 'assistant' | 'system' | 'tool'; content: string }>,
  userId: string,
  workspaceData: AssistantChatRequest['workspaceData']
): Promise<AssistantChatResponse> {
  const payload: AssistantChatRequest = {
    messages,
    userId,
    workspaceData,
  };

  const res = await fetch('/api/assistant/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody.error || `Failed to communicate with Gemma 3 4B (HTTP ${res.status})`
    );
  }

  const data = (await res.json()) as AssistantChatResponse;
  return data;
}
