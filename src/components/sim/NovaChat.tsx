'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  author?: string;
  isAutoFire?: boolean;
}

interface NovaChatProps {
  scenario: string;
  round: string;
  tabData: string;
  roundBrief: string;
  votes: any;
  decisions: any;
  activeMember: string;
  teamId: string;
  scenarioName: string;
  scenarioData: Record<string, any>;
  questions: { question: string }[];
}

const ROUND_DATA_MAP: Record<string, [string, string]> = {
  budget: ['pl', 'channels'],
  diagnose: ['funnel', 'benchmarks'],
  rfm: ['rfm', 'cohorts'],
};

export default function NovaChat({
  scenario,
  round,
  tabData,
  roundBrief,
  votes,
  decisions,
  activeMember,
  teamId: _teamId,
  scenarioName,
  scenarioData,
  questions,
}: NovaChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevVotesRef = useRef<string>('');
  const autoFiredRounds = useRef<Set<string>>(new Set());

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* ── Auto-fire on round change ── */
  useEffect(() => {
    if (!round || !scenarioData || !questions?.length) return;
    if (autoFiredRounds.current.has(round)) return;
    if (streaming) return;

    autoFiredRounds.current.add(round);

    const [tab1Key, tab2Key] = ROUND_DATA_MAP[round] ?? ['pl', 'channels'];
    const summary1 = scenarioData[tab1Key]?.dataSummary ?? '';
    const summary2 = scenarioData[tab2Key]?.dataSummary ?? '';

    const autoFireContext = [
      `Scenario: ${scenarioName} (${scenario})`,
      `Round: ${round}`,
      '',
      `Brief: ${roundBrief}`,
      '',
      `Question 1: ${questions[0]?.question ?? ''}`,
      `Question 2: ${questions[1]?.question ?? ''}`,
      '',
      'Key data signals:',
      summary1,
      summary2,
    ].join('\n');

    sendAutoFire(autoFireContext);
  }, [round]);

  /* ── Auto-fire sender ── */
  const sendAutoFire = async (autoFireContext: string) => {
    setStreaming(true);

    try {
      const res = await fetch('/api/nova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          round,
          isAutoFire: true,
          autoFireContext,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Failed to get response from Nova');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMsg: Message = {
        role: 'assistant',
        content: '',
        author: 'Nova',
        isAutoFire: true,
      };
      setMessages([assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: assistantContent,
          };
          return next;
        });
      }
    } catch (_err) {
      setMessages([
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          author: 'Nova',
          isAutoFire: true,
        },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  /* Auto-trigger Nova on split vote detection */
  useEffect(() => {
    if (!votes || streaming) return;

    const votesStr = JSON.stringify(votes);
    if (votesStr === prevVotesRef.current) return;
    prevVotesRef.current = votesStr;

    const votesByQuestion: Record<number, Set<number>> = {};
    if (typeof votes === 'object') {
      Object.entries(votes).forEach(([key, optIdx]) => {
        const parts = String(key).split('-');
        const qIdx = Number(parts[0]);
        if (!votesByQuestion[qIdx]) votesByQuestion[qIdx] = new Set();
        votesByQuestion[qIdx].add(optIdx as number);
      });
    }

    const hasSplit = Object.values(votesByQuestion).some((s) => s.size > 1);
    const hasUserMessages = messages.some((m) => m.role === 'user');
    if (hasSplit && !hasUserMessages) {
      sendMessage(
        'The team has a split vote. Can you help us think through the options?',
        true
      );
    }
  }, [votes]);

  const sendMessage = async (text: string, isAuto = false) => {
    if (streaming) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      author: isAuto ? 'System' : activeMember,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch('/api/nova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          round,
          dataTab: tabData,
          tabData,
          roundBrief,
          votes,
          decisions,
          activeMember,
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Failed to get response from Nova');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMsg: Message = {
        role: 'assistant',
        content: '',
        author: 'Nova',
      };
      setMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: assistantContent,
          };
          return next;
        });
      }
    } catch (_err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          author: 'Nova',
        },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="w-2 h-2 rounded-full bg-[#3A9E82] animate-pulse" />
        <span className="text-sm font-medium text-white">Nova</span>
        <span className="text-xs text-white/40">AI Assistant</span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
        style={{ minHeight: 200, maxHeight: 400 }}
      >
        {messages.length === 0 && (
          <div className="text-white/40 text-sm text-center mt-8">
            Ask Nova about the data, strategy, or your team&apos;s decision.
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <span className="text-[10px] text-white/30 mb-1">
              {msg.author ?? (msg.role === 'assistant' ? 'Nova' : activeMember)}
            </span>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white'
                  : 'text-white/80'
              }`}
              style={
                msg.role === 'user'
                  ? { background: 'rgba(58,158,130,0.15)', border: '1px solid rgba(58,158,130,0.3)' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {msg.content}
              {streaming && msg.role === 'assistant' && i === messages.length - 1 && (
                <span className="inline-flex ml-1">
                  <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce ml-0.5" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce ml-0.5" style={{ animationDelay: '300ms' }} />
                </span>
              )}
            </div>
            {msg.isAutoFire && msg.role === 'assistant' && (
              <span className="text-[9px] text-white/20 mt-1 italic">Nova opened this round</span>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 px-4 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Nova a question..."
          disabled={streaming}
          className="flex-1 rounded-2xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="px-4 py-2 text-white text-sm font-medium rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #3A9E82, #2D8A6E)', boxShadow: '0 4px 16px rgba(58,158,130,0.3)' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
