export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  toolCalls?: Array<{
    id?: string;
    function: {
      name: string;
      arguments: Record<string, any> | string;
    };
  }>;
  suggestedActions?: Array<{
    label: string;
    type: 'settle_up' | 'view_group' | 'view_expense';
    data?: Record<string, any>;
  }>;
}

export interface AssistantStatus {
  available: boolean;
  provider: 'ollama';
  model: string;
  baseUrl: string;
  installedModels?: string[];
  error?: string;
}

export interface AssistantChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
  }>;
  userId: string;
  workspaceData: {
    currentUser: { id: string; name: string; defaultCurrency?: string };
    groups: any[];
    expenses: any[];
    settlements: any[];
    friends: any[];
  };
}

export interface AssistantChatResponse {
  reply: string;
  toolsUsed?: string[];
  suggestedActions?: Array<{
    label: string;
    type: 'settle_up' | 'view_group' | 'view_expense';
    data?: Record<string, any>;
  }>;
  error?: string;
}
