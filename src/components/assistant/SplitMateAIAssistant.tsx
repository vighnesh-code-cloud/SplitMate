import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Bot,
  User as UserIcon,
  HelpCircle,
  TrendingUp,
  Receipt,
  Scale,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';
import { useSplitMate } from '../../context/SplitMateContext';
import { AssistantMessage, ChatRequestPayload } from '../../types/assistant';
import {
  loadStoredChatMessages,
  saveStoredChatMessages,
  sendAssistantMessage,
} from '../../services/assistantService';
import { Avatar } from '../common/Avatar';
import { Group } from '../../types';

interface SplitMateAIAssistantProps {
  initialGroupId?: string | null;
  onOpenSettleUp?: (groupId?: string, payerId?: string, receiverId?: string, amount?: number) => void;
  className?: string;
  isCompact?: boolean;
}

export const SplitMateAIAssistant: React.FC<SplitMateAIAssistantProps> = ({
  initialGroupId = null,
  onOpenSettleUp,
  className = '',
  isCompact = false,
}) => {
  const {
    currentUser,
    groups,
    expenses,
    settlements,
    friends,
    navigateTo,
    showToast,
  } = useSplitMate();

  const [messages, setMessages] = useState<AssistantMessage[]>(() => loadStoredChatMessages());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId);
  const [providerStatus, setProviderStatus] = useState<string>('Gemini 3.8 Flash / Gemma');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter groups strictly to authorized groups for current user
  const authorizedGroups = groups.filter(
    (g) => g.memberIds.includes(currentUser.id) || g.createdBy === currentUser.id
  );

  // Sync selected group if prop changes
  useEffect(() => {
    if (initialGroupId !== undefined) {
      setSelectedGroupId(initialGroupId);
    }
  }, [initialGroupId]);

  // Persist messages
  useEffect(() => {
    saveStoredChatMessages(messages);
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Check health and provider on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.geminiConfigured) {
          setProviderStatus('Gemini 3.8 Flash');
        } else if (data.ollamaConfigured) {
          setProviderStatus('Gemma (Ollama)');
        } else {
          setProviderStatus('Verified Ledger Engine');
        }
      })
      .catch(() => {
        setProviderStatus('Verified Ledger Engine');
      });
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setInput('');

    const userMsg: AssistantMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const payload: ChatRequestPayload = {
        message: query,
        currentUserId: currentUser.id,
        selectedGroupId: selectedGroupId || undefined,
        history: messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        clientData: {
          currentUser: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            defaultCurrency: currentUser.defaultCurrency || '₹',
          },
          groups: authorizedGroups,
          expenses,
          settlements,
          friends,
        },
      };

      const res = await sendAssistantMessage(payload);

      const assistantMsg: AssistantMessage = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: res.message,
        timestamp: new Date().toISOString(),
        intent: res.intent,
        data: res.data,
        clarificationOptions: res.clarificationOptions,
        provider: res.provider,
        modelName: res.modelName,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Error in AI Assistant conversation:', err);
      const errorMsg: AssistantMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error retrieving or computing the financial records. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem('splitmate_ai_assistant_chat_v1');
    showToast('Chat history cleared', 'info');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Response copied to clipboard', 'success');
  };

  const selectedGroupObj = authorizedGroups.find((g) => g.id === selectedGroupId);

  const samplePrompts = [
    ...(selectedGroupObj
      ? [`Summarize ${selectedGroupObj.name}`, `Who owes whom in ${selectedGroupObj.name}?`]
      : authorizedGroups.length > 0
      ? [`Summarize ${authorizedGroups[0].name}`]
      : []),
    'How much have I spent on expenses?',
    'Who owes whom right now?',
    'Give me an overview of all my groups',
  ];

  return (
    <div
      className={`flex flex-col bg-[#111316] border border-[#2B2F36] rounded-2xl shadow-2xl overflow-hidden ${className} ${
        isCompact ? 'h-[540px]' : 'h-[calc(100vh-140px)] min-h-[580px]'
      }`}
    >
      {/* Header */}
      <div className="px-4 sm:px-6 py-3.5 bg-[#181B20] border-b border-[#2B2F36] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#202329] border border-[#8FAF9A]/30 flex items-center justify-center text-[#8FAF9A] shrink-0 shadow-xs relative">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#8FAF9A] rounded-full ring-2 ring-[#181B20]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#F5F5F5] truncate">
                SplitMate AI Assistant
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#202329] border border-[#2B2F36] text-[#8FAF9A]">
                {providerStatus}
              </span>
            </div>
            <p className="text-[11px] text-[#A0A5AE] truncate">
              Intelligent group ledger summaries, spending breakdowns & balance tracking
            </p>
          </div>
        </div>

        {/* Group Filter & Clear actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(e.target.value || null)}
              className="bg-[#111316] border border-[#2B2F36] text-[#A0A5AE] hover:text-[#F5F5F5] text-xs rounded-xl px-2.5 py-1.5 focus:outline-hidden focus:border-[#8FAF9A] transition-colors cursor-pointer max-w-[150px] sm:max-w-[200px] truncate"
              title="Filter context by group"
            >
              <option value="">🌐 All Groups & Trips</option>
              {authorizedGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.icon || '🏷️'} {g.name}
                </option>
              ))}
            </select>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              title="Clear conversation"
              className="p-1.5 rounded-xl bg-[#111316] border border-[#2B2F36] text-[#737984] hover:text-[#D99090] hover:border-[#D99090]/50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 selection:bg-[#8FAF9A]/20">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#181B20] border border-[#2B2F36] flex items-center justify-center text-[#8FAF9A] mb-4 shadow-lg shadow-[#8FAF9A]/5">
              <Bot className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-[#F5F5F5]">
              Hello {currentUser.name.split(' ')[0]}! Ask me anything about your finances.
            </h3>
            <p className="text-xs text-[#A0A5AE] mt-1.5 max-w-md leading-relaxed">
              I can summarize any group or trip, calculate your personal spending, tell you exactly who owes whom, and inspect recorded expenses with complete ledger accuracy.
            </p>

            {/* Quick Starter Chips */}
            <div className="mt-6 w-full space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#737984]">
                Suggested questions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-2.5 rounded-xl bg-[#181B20] border border-[#2B2F36] hover:border-[#8FAF9A]/60 hover:bg-[#202329] text-xs text-[#F5F5F5] font-medium transition-all text-left flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate">{prompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#737984] group-hover:text-[#8FAF9A] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-in fade-in duration-150 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-[#181B20] border border-[#8FAF9A]/40 flex items-center justify-center text-[#8FAF9A] shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 shadow-xs relative group ${
                  msg.role === 'user'
                    ? 'bg-[#202329] text-[#F5F5F5] border border-[#2B2F36] rounded-tr-xs'
                    : 'bg-[#181B20] text-[#F5F5F5] border border-[#2B2F36] rounded-tl-xs'
                }`}
              >
                {/* Header row for assistant message */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-[#2B2F36]/60 text-[11px] text-[#737984]">
                    <span className="flex items-center gap-1.5 font-medium text-[#8FAF9A]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{msg.modelName || 'SplitMate AI'}</span>
                    </span>

                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="text-[#737984] hover:text-[#F5F5F5] p-1 rounded transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-[#82B99A]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {/* Main text content with Markdown rendering */}
                <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-[#F5F5F5] font-sans">
                  {msg.content}
                </div>

                {/* Rich Data Cards: Group Summary */}
                {msg.data?.groupSummary && (
                  <div className="mt-4 pt-4 border-t border-[#2B2F36] space-y-3.5">
                    {/* Simplified Debts in summary */}
                    {msg.data.groupSummary.simplifiedDebts.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-[#111316] border border-[#2B2F36] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#8FAF9A] uppercase tracking-wider flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5" />
                            <span>Actionable Settlements</span>
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {msg.data.groupSummary.simplifiedDebts.map((debt, dIdx) => (
                            <div
                              key={dIdx}
                              className="flex items-center justify-between p-2 rounded-lg bg-[#181B20] text-xs"
                            >
                              <span className="text-[#A0A5AE]">
                                <strong className="text-[#F5F5F5]">{debt.fromName}</strong> owes{' '}
                                <strong className="text-[#F5F5F5]">{debt.toName}</strong>:
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#82B99A]">
                                  {debt.formattedAmount}
                                </span>
                                {onOpenSettleUp && (
                                  <button
                                    onClick={() =>
                                      onOpenSettleUp(
                                        debt.groupId,
                                        debt.fromMemberId,
                                        debt.toMemberId,
                                        debt.amountInPaise
                                      )
                                    }
                                    className="px-2 py-1 rounded bg-[#8FAF9A]/15 hover:bg-[#8FAF9A]/30 text-[#8FAF9A] font-semibold text-[10px] transition-colors cursor-pointer"
                                  >
                                    Settle
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Clarification prompt chips */}
                {msg.clarificationOptions && msg.clarificationOptions.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-[#2B2F36] space-y-2">
                    <p className="text-[11px] font-medium text-[#A0A5AE]">
                      Select a group to proceed:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.clarificationOptions.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() => {
                            if (opt.groupId) setSelectedGroupId(opt.groupId);
                            handleSendMessage(opt.actionPrompt);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#202329] hover:bg-[#8FAF9A]/20 border border-[#2B2F36] hover:border-[#8FAF9A]/50 text-xs font-semibold text-[#8FAF9A] transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{opt.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 shrink-0 mt-0.5">
                  <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex gap-3 animate-in fade-in duration-150">
            <div className="w-8 h-8 rounded-xl bg-[#181B20] border border-[#8FAF9A]/40 flex items-center justify-center text-[#8FAF9A] shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-xs bg-[#181B20] border border-[#2B2F36] flex items-center gap-2.5 text-xs text-[#8FAF9A]">
              <div className="w-2 h-2 rounded-full bg-[#8FAF9A] animate-ping" />
              <span>Analyzing authorized ledger and calculating exact balances...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input & Quick Chips */}
      <div className="p-3 sm:p-4 bg-[#181B20] border-t border-[#2B2F36] space-y-2 shrink-0">
        {/* Quick action chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          <span className="text-[#737984] font-medium shrink-0 flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-[#8FAF9A]" />
            Quick:
          </span>
          <button
            type="button"
            onClick={() => handleSendMessage('Who owes whom right now?')}
            className="px-2.5 py-1 rounded-lg bg-[#111316] border border-[#2B2F36] text-[#A0A5AE] hover:text-[#F5F5F5] hover:border-[#8FAF9A]/40 transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            ⚖️ Who owes whom?
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('What is my personal spending breakdown?')}
            className="px-2.5 py-1 rounded-lg bg-[#111316] border border-[#2B2F36] text-[#A0A5AE] hover:text-[#F5F5F5] hover:border-[#8FAF9A]/40 transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            💰 My personal spending
          </button>
          {selectedGroupObj && (
            <button
              type="button"
              onClick={() => handleSendMessage(`Summarize ${selectedGroupObj.name}`)}
              className="px-2.5 py-1 rounded-lg bg-[#111316] border border-[#2B2F36] text-[#8FAF9A] hover:border-[#8FAF9A]/60 transition-colors whitespace-nowrap cursor-pointer shrink-0"
            >
              📊 Summarize {selectedGroupObj.name}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSendMessage('Give me an overview of all my groups')}
            className="px-2.5 py-1 rounded-lg bg-[#111316] border border-[#2B2F36] text-[#A0A5AE] hover:text-[#F5F5F5] hover:border-[#8FAF9A]/40 transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            🌐 All groups overview
          </button>
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedGroupObj
                ? `Ask anything about ${selectedGroupObj.name} or your overall spending...`
                : 'Ask about group summaries, spending, who owes whom, or specific expenses...'
            }
            disabled={isLoading}
            className="flex-1 bg-[#111316] border border-[#2B2F36] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#F5F5F5] placeholder-[#737984] focus:outline-hidden focus:border-[#8FAF9A] disabled:opacity-50 transition-colors"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-[#8FAF9A] hover:bg-[#82B99A] disabled:opacity-40 disabled:hover:bg-[#8FAF9A] text-[#0B0C0E] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>
      </div>
    </div>
  );
};
