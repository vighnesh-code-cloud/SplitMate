import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  X,
} from 'lucide-react';
import { useSplitMate } from '../../context/SplitMateContext';
import { AssistantMessage, AssistantStatus } from '../../types/assistant';
import { fetchAssistantStatus, sendChatMessage } from '../../services/assistantService';

interface AssistantPageProps {
  onOpenSettleUp?: (groupId?: string, payerId?: string, receiverId?: string, amount?: number) => void;
}

const SAMPLE_PROMPTS = [
  'Who owes whom across all my groups?',
  'How much did I spend this month?',
  'Who do I need to pay right now?',
  'Give me a summary of Bangalore Flat 402',
  'Show my highest expenses recently',
];

export const AssistantPage: React.FC<AssistantPageProps> = ({ onOpenSettleUp }) => {
  const { currentUser, groups, expenses, settlements, friends, navigateTo } = useSplitMate();

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome_msg',
      role: 'assistant',
      content: `Hi ${currentUser.name}! 👋 I'm your SplitMate assistant powered by Gemma 3 4B.

I can help you analyze your shared expenses, check balances, see who owes whom, and give you complete group breakdowns. What would you like to know?`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const checkStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetchAssistantStatus();
      setStatus(res);
    } catch {
      setStatus({
        available: false,
        provider: 'ollama',
        model: 'gemma3:4b',
        baseUrl: 'http://127.0.0.1:11434',
        error: 'Failed to query assistant backend endpoint',
      });
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setInput('');
    setChatError(null);

    const userMsg: AssistantMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const historyForApi = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const workspaceData = {
        currentUser,
        groups,
        expenses,
        settlements,
        friends,
      };

      const response = await sendChatMessage(historyForApi, currentUser.id, workspaceData);

      const assistantMsg: AssistantMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
        suggestedActions: response.suggestedActions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg = err?.message || 'Gemma 3 4B via Ollama is unavailable.';
      setChatError(errMsg);
      // Re-check status in background to update badge
      checkStatus();
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: `Hi ${currentUser.name}! 👋 I'm ready with your updated expense data. What would you like to check?`,
        timestamp: new Date().toISOString(),
      },
    ]);
    setChatError(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] lg:h-[calc(100vh-64px)] max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-[#111316] border border-[#2B2F36] rounded-2xl p-4 sm:p-5 mb-4 shrink-0 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#8FAF9A]/15 border border-[#8FAF9A]/30 flex items-center justify-center text-[#8FAF9A] shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#F5F5F5] tracking-tight">
                SplitMate Assistant
              </h1>
              <span className="text-xs font-medium text-[#8FAF9A] bg-[#8FAF9A]/10 border border-[#8FAF9A]/20 px-2 py-0.5 rounded-md">
                Gemma 3 4B
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Natural-language financial questions verified by deterministic ledger arithmetic
            </p>
          </div>
        </div>

        {/* Status & Diagnostic actions */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setShowConfigModal(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition-colors cursor-pointer ${
              status?.available && !status?.error
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/40'
                : 'bg-amber-950/30 border-amber-800/40 text-amber-400 hover:bg-amber-900/40'
            }`}
          >
            {statusLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : status?.available && !status?.error ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>
              {statusLoading
                ? 'Checking Ollama...'
                : status?.available && !status?.error
                ? 'Ollama Connected'
                : 'Ollama Offline'}
            </span>
          </button>

          <button
            onClick={handleResetChat}
            className="p-2 rounded-lg bg-[#181B20] hover:bg-[#202329] border border-[#2B2F36] text-neutral-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-[#111316] border border-[#2B2F36] rounded-2xl overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-[#8FAF9A]/20 border border-[#8FAF9A]/30 flex items-center justify-center text-[#8FAF9A] shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#202329] border border-[#2B2F36] text-[#F5F5F5]'
                    : 'bg-[#181B20] border border-[#2B2F36] text-neutral-200'
                }`}
              >
                {/* Content with whitespace formatting */}
                <div className="whitespace-pre-wrap space-y-2">
                  {msg.content}
                </div>

                {/* Suggested Actions if returned by assistant */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-[#2B2F36] flex flex-wrap gap-2">
                    {msg.suggestedActions.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (act.type === 'settle_up' && onOpenSettleUp) {
                            onOpenSettleUp();
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#8FAF9A] hover:bg-[#82B99A] text-[#0B0C0E] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{act.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-[10px] text-neutral-500 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex gap-3 max-w-2xl mr-auto justify-start">
            <div className="w-8 h-8 rounded-lg bg-[#8FAF9A]/20 border border-[#8FAF9A]/30 flex items-center justify-center text-[#8FAF9A] shrink-0 mt-0.5">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-[#181B20] border border-[#2B2F36] rounded-2xl p-4 text-sm text-neutral-300 flex items-center gap-2.5">
              <div className="w-4 h-4 border-2 border-[#8FAF9A] border-t-transparent rounded-full animate-spin" />
              <span>Gemma 3 4B is analyzing your request...</span>
            </div>
          </div>
        )}

        {/* Explicit Error Banner if Gemma is unavailable */}
        {chatError && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-sm flex flex-col gap-2.5">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">Gemma 3 4B AI Service Unavailable</p>
                <p className="text-xs text-amber-200/80 mt-1">{chatError}</p>
              </div>
            </div>
            <div className="pl-7 text-xs text-neutral-400 flex flex-wrap items-center gap-2">
              <span>Make sure Ollama is running locally:</span>
              <code className="bg-[#0B0C0E] px-2 py-1 rounded text-[#8FAF9A] font-mono text-[11px]">
                ollama run gemma3:4b
              </code>
              <button
                onClick={() => handleSend()}
                className="ml-auto px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts row */}
      <div className="py-2.5 px-1 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-xs text-neutral-500 whitespace-nowrap shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#8FAF9A]" />
          <span>Suggestions:</span>
        </span>
        {SAMPLE_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-2.5 py-1 rounded-full bg-[#181B20] hover:bg-[#202329] border border-[#2B2F36] hover:border-[#8FAF9A]/40 text-neutral-300 hover:text-white text-xs whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-1 flex items-center gap-2 bg-[#111316] border border-[#2B2F36] rounded-2xl p-2 shrink-0 focus-within:border-[#8FAF9A]/50 transition-colors"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Gemma about balances, who owes whom, or trips..."
          disabled={loading}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-[#F5F5F5] placeholder-neutral-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-[#8FAF9A] text-[#0B0C0E] hover:bg-[#82B99A] disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-all cursor-pointer shadow-sm shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Connection / Troubleshooting Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111316] border border-[#2B2F36] rounded-2xl max-w-lg w-full p-6 text-neutral-200 relative shadow-2xl">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#202329] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#8FAF9A]/15 border border-[#8FAF9A]/30 flex items-center justify-center text-[#8FAF9A]">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Gemma 3 4B Ollama Status</h3>
                <p className="text-xs text-neutral-400">Local AI connection configuration</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-neutral-300">
              <div className="p-3 rounded-xl bg-[#181B20] border border-[#2B2F36] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Endpoint:</span>
                  <span className="font-mono text-neutral-200">{status?.baseUrl || 'http://127.0.0.1:11434'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Model:</span>
                  <span className="font-mono text-[#8FAF9A] font-semibold">{status?.model || 'gemma3:4b'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Status:</span>
                  <span className={`font-semibold ${status?.available ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {status?.available ? 'Online & Ready' : 'Service Unavailable'}
                  </span>
                </div>
              </div>

              {status?.error && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200">
                  <p className="font-semibold text-amber-300 mb-1">Issue Detected:</p>
                  <p className="text-[11px] leading-relaxed">{status.error}</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#181B20] border border-[#2B2F36] space-y-2">
                <p className="font-semibold text-white">How to run Gemma 3 4B locally:</p>
                <ol className="list-decimal pl-4 space-y-1.5 text-neutral-400">
                  <li>Install Ollama from <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-[#8FAF9A] hover:underline">ollama.com</a></li>
                  <li>In your terminal, pull and start the Gemma 3 4B model:
                    <div className="mt-1 p-2 rounded bg-[#0B0C0E] font-mono text-xs text-[#8FAF9A] select-all">
                      ollama run gemma3:4b
                    </div>
                  </li>
                  <li>Click &quot;Re-check Connection&quot; below to connect.</li>
                </ol>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => {
                  checkStatus();
                }}
                className="px-4 py-2 rounded-xl bg-[#8FAF9A] hover:bg-[#82B99A] text-[#0B0C0E] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-check Connection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
