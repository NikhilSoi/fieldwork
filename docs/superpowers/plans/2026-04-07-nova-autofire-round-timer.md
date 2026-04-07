# Nova Auto-Fire + Round Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Nova automatically challenge students at the start of each round, and add an instructor-configured countdown timer to the simulation.

**Architecture:** Feature 1 adds an auto-fire `useEffect` in NovaChat that triggers once per round, calling the Nova API with a dedicated Socratic system prompt and round-specific data summaries. Feature 2 adds a `round_duration_minutes` column to the sessions table, a dropdown in InstructorSetup, and a new `RoundTimer` component rendered in the session header that resets via React `key` prop on round change.

**Tech Stack:** Next.js 14, React 18, Supabase, Anthropic Claude API, Tailwind CSS

---

### Task 1: Update Nova API route to support auto-fire mode

**Files:**
- Modify: `src/app/api/nova/route.ts`

- [ ] **Step 1: Add auto-fire system prompt and branching logic**

Replace the entire content of `src/app/api/nova/route.ts` with:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are Nova, AI copilot inside Fieldwork by VectorEd — a marketing analytics simulation for business school students. You are Socratic, sharp, direct. There is no single correct answer. Your role is to help students think with the data — not toward a predetermined conclusion. Challenge choices that ignore clear data signals. Acknowledge choices that are data-supported even if they lead to suboptimal outcomes. Ask questions that reveal what the student was looking at and what they were ignoring. Cite specific data points from the tabData you are given. Address the active member by name when provided. When there is a split vote, ask the dissenting member to defend their position using specific numbers from the dashboard. When there is unanimous agreement, challenge them to articulate what data would need to be true for a different option to be the stronger call. Keep every response under 60 words.`;

const AUTOFIRE_SYSTEM_PROMPT = `You are Nova, an AI copilot inside a marketing analytics simulation called Fieldwork. A team of students is about to make a strategic decision. Your job is to fire the first shot — a single provocative Socratic challenge that makes them want to open the data tabs before they vote.

Rules:
- Never give the answer or hint at which option is correct
- Reference specific numbers from the data provided
- Ask ONE sharp question that creates productive tension
- Address the team directly, not an individual
- Keep it under 50 words
- Do not use bullet points
- Sound like a sharp senior analyst, not a chatbot`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      scenario,
      round,
      dataTab,
      tabData,
      roundBrief,
      votes,
      decisions,
      activeMember,
      messages,
      isAutoFire,
      autoFireContext,
    } = body;

    let systemPrompt: string;
    let anthropicMessages: { role: 'user' | 'assistant'; content: string }[];

    if (isAutoFire && autoFireContext) {
      systemPrompt = AUTOFIRE_SYSTEM_PROMPT;
      anthropicMessages = [
        {
          role: 'user' as const,
          content: autoFireContext,
        },
      ];
    } else {
      systemPrompt = SYSTEM_PROMPT;
      const contextMessage = [
        `Scenario: ${scenario}`,
        `Round: ${round}`,
        `Active data tab: ${dataTab}`,
        `Tab data: ${tabData}`,
        `Round brief: ${roundBrief}`,
        votes ? `Current votes: ${JSON.stringify(votes)}` : '',
        decisions ? `Prior decisions: ${JSON.stringify(decisions)}` : '',
        activeMember ? `Active member: ${activeMember}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      anthropicMessages = [
        {
          role: 'user' as const,
          content: `[Context for this round]\n${contextMessage}`,
        },
        ...(messages || []).map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ];
    }

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    console.error('Nova API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

- [ ] **Step 2: Verify the file saved correctly**

Run: `head -20 src/app/api/nova/route.ts`
Expected: See the import and both system prompt constants.

---

### Task 2: Update NovaChat with auto-fire logic

**Files:**
- Modify: `src/components/sim/NovaChat.tsx`

- [ ] **Step 1: Replace the full NovaChat component**

Replace the entire content of `src/components/sim/NovaChat.tsx` with:

```typescript
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
    // Only auto-send split message if no user-initiated messages yet (auto-fire messages don't count as blocking)
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
    <div className="flex flex-col h-full bg-white rounded-lg border border-[#D1D9D4]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#D1D9D4]">
        <div className="w-2 h-2 rounded-full bg-[#3A9E82] animate-pulse" />
        <span className="text-sm font-medium text-[#0B1F35]">Nova</span>
        <span className="text-xs text-[#718096]">AI Assistant</span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
        style={{ minHeight: 200, maxHeight: 400 }}
      >
        {messages.length === 0 && (
          <div className="text-[#718096] text-sm text-center mt-8">
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
            <span className="text-[10px] text-[#718096] mb-1">
              {msg.author ?? (msg.role === 'assistant' ? 'Nova' : activeMember)}
            </span>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#E8F5F1] text-[#0B1F35] border border-[#3A9E82]/20'
                  : 'bg-[#EEF2EF] text-[#0B1F35] border border-[#D1D9D4]'
              }`}
            >
              {msg.content}
              {streaming && msg.role === 'assistant' && i === messages.length - 1 && (
                <span className="inline-flex ml-1">
                  <span className="w-1 h-1 rounded-full bg-[#718096] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-[#718096] animate-bounce ml-0.5" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-[#718096] animate-bounce ml-0.5" style={{ animationDelay: '300ms' }} />
                </span>
              )}
            </div>
            {msg.isAutoFire && msg.role === 'assistant' && (
              <span className="text-[9px] text-[#718096]/70 mt-1 italic">Nova opened this round</span>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 px-4 py-3 border-t border-[#D1D9D4]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Nova a question..."
          disabled={streaming}
          className="flex-1 bg-[#F4F7F5] border border-[#D1D9D4] rounded-lg px-3 py-2 text-sm text-[#0B1F35] placeholder-[#718096] focus:outline-none focus:border-[#3A9E82] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="px-4 py-2 bg-[#3A9E82] text-white text-sm font-medium rounded-lg hover:bg-[#2D8A6E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify the file saved correctly**

Run: `grep -n 'autoFiredRounds\|isAutoFire\|ROUND_DATA_MAP\|sendAutoFire\|scenarioName\|scenarioData' src/components/sim/NovaChat.tsx | head -20`
Expected: Lines showing the new auto-fire ref, data map, props, and function.

---

### Task 3: Pass new props from session page to NovaChat

**Files:**
- Modify: `src/app/session/[code]/page.tsx`

- [ ] **Step 1: Update the Session interface to include round_duration_minutes**

In `src/app/session/[code]/page.tsx`, find the `Session` interface (around line 42) and add the new field:

```typescript
interface Session {
  id: string;
  code: string;
  scenario: string;
  active_rounds: number[];
  status: string;
  team_size: number;
  round_duration_minutes: number | null;
}
```

- [ ] **Step 2: Update the session query to include round_duration_minutes**

Find the session select query (around line 105):

```typescript
      .select('id, code, scenario, active_rounds, status, team_size')
```

Replace with:

```typescript
      .select('id, code, scenario, active_rounds, status, team_size, round_duration_minutes')
```

- [ ] **Step 3: Update NovaChat props**

Find the NovaChat JSX (around line 375) and replace:

```tsx
              <NovaChat
                scenario={scenarioKey}
                round={roundKey}
                tabData={currentTabSummary}
                roundBrief={currentRound?.brief ?? ''}
                votes={votes}
                decisions={pastDecisions}
                activeMember={members[activeMemberIdx]?.name ?? `Member ${activeMemberIdx + 1}`}
                teamId={teamId ?? ''}
              />
```

With:

```tsx
              <NovaChat
                scenario={scenarioKey}
                round={roundKey}
                tabData={currentTabSummary}
                roundBrief={currentRound?.brief ?? ''}
                votes={votes}
                decisions={pastDecisions}
                activeMember={members[activeMemberIdx]?.name ?? `Member ${activeMemberIdx + 1}`}
                teamId={teamId ?? ''}
                scenarioName={scenario?.name ?? ''}
                scenarioData={scenario?.tabs ?? {}}
                questions={currentRound?.questions ?? []}
              />
```

- [ ] **Step 4: Verify the changes**

Run: `grep -n 'scenarioName\|scenarioData\|questions=' src/app/session/[code]/page.tsx`
Expected: Lines showing all three new props being passed to NovaChat.

---

### Task 4: Create RoundTimer component

**Files:**
- Create: `src/components/sim/RoundTimer.tsx`

- [ ] **Step 1: Create the RoundTimer component**

Create `src/components/sim/RoundTimer.tsx` with:

```typescript
'use client';

import { useState, useEffect } from 'react';

interface RoundTimerProps {
  durationMinutes: number;
}

export default function RoundTimer({ durationMinutes }: RoundTimerProps) {
  const totalSeconds = durationMinutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining <= 0]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const pct = remaining / totalSeconds;
  let color: string;
  let pulse = false;

  if (remaining < 60) {
    color = '#DC2626';
    pulse = true;
  } else if (pct < 0.25) {
    color = '#DC2626';
  } else if (pct < 0.5) {
    color = '#D97706';
  } else {
    color = '#718096';
  }

  return (
    <span
      className={`font-mono-data text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${pulse ? 'animate-pulse' : ''}`}
      style={{ color, backgroundColor: `${color}15` }}
    >
      {display}
    </span>
  );
}
```

- [ ] **Step 2: Verify the file exists**

Run: `head -10 src/components/sim/RoundTimer.tsx`
Expected: See the 'use client' directive and imports.

---

### Task 5: Add timer to session header

**Files:**
- Modify: `src/app/session/[code]/page.tsx`

- [ ] **Step 1: Add RoundTimer import**

Find the imports at the top of `src/app/session/[code]/page.tsx` (around line 9-12) and add after the existing component imports:

```typescript
import RoundTimer from '@/components/sim/RoundTimer';
```

- [ ] **Step 2: Add timer to header bar**

Find the round badge in the header (around line 307):

```tsx
          <span className="bg-[#E8F5F1] text-[#3A9E82] text-xs px-2.5 py-0.5 rounded-full font-medium capitalize flex-shrink-0">
            {ROUND_LABELS[currentRoundIdx]}
          </span>
```

Add the timer immediately after (keeping the existing badge):

```tsx
          <span className="bg-[#E8F5F1] text-[#3A9E82] text-xs px-2.5 py-0.5 rounded-full font-medium capitalize flex-shrink-0">
            {ROUND_LABELS[currentRoundIdx]}
          </span>
          {session.round_duration_minutes && (
            <RoundTimer
              key={`timer-${currentRoundIdx}`}
              durationMinutes={session.round_duration_minutes}
            />
          )}
```

- [ ] **Step 3: Verify the changes**

Run: `grep -n 'RoundTimer' src/app/session/[code]/page.tsx`
Expected: Import line and usage line with key prop.

---

### Task 6: Add round duration to InstructorSetup

**Files:**
- Modify: `src/components/lobby/InstructorSetup.tsx`

- [ ] **Step 1: Add roundDuration state**

Find the state declarations (around line 37, after `activeRounds`):

```typescript
  const [activeRounds, setActiveRounds] = useState<number[]>([0, 1, 2]);
```

Add after it:

```typescript
  const [roundDuration, setRoundDuration] = useState<number | null>(null);
```

- [ ] **Step 2: Add round_duration_minutes to the Supabase insert**

Find the session insert object (around line 65):

```typescript
        .insert({
          code,
          scenario,
          active_rounds: activeRounds,
          team_size: teamSize,
          status: 'lobby',
          instructor_name: instructorName.trim(),
          course_name: courseName.trim(),
        })
```

Replace with:

```typescript
        .insert({
          code,
          scenario,
          active_rounds: activeRounds,
          team_size: teamSize,
          status: 'lobby',
          instructor_name: instructorName.trim(),
          course_name: courseName.trim(),
          round_duration_minutes: roundDuration,
        })
```

- [ ] **Step 3: Add the Time per round dropdown UI**

Find the Active Rounds section closing `</div>` (around line 203). Add the following immediately after the Active Rounds `</div>` and before the `{/* Error */}` comment:

```tsx
        {/* Time per Round */}
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Time per Round</label>
          <select
            value={roundDuration ?? ''}
            onChange={(e) => setRoundDuration(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors appearance-none"
          >
            <option value="" className="bg-[#1a1a1a]">No timer</option>
            <option value="10" className="bg-[#1a1a1a]">10 minutes</option>
            <option value="15" className="bg-[#1a1a1a]">15 minutes</option>
            <option value="20" className="bg-[#1a1a1a]">20 minutes</option>
            <option value="30" className="bg-[#1a1a1a]">30 minutes</option>
          </select>
        </div>
```

- [ ] **Step 4: Verify the changes**

Run: `grep -n 'roundDuration\|round_duration' src/components/lobby/InstructorSetup.tsx`
Expected: Lines showing state, insert field, and select onChange.

---

### Task 7: Add Supabase column

- [ ] **Step 1: Add the column via Supabase SQL**

Run this SQL in the Supabase dashboard SQL editor (or via the CLI):

```sql
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS round_duration_minutes integer;
```

This is a non-breaking migration — existing sessions will have `null` for this column, which means "no timer".

---

### Task 8: Build, verify, and deploy

- [ ] **Step 1: Build the project**

Run: `npm run build`
Expected: Build succeeds with no type errors (pre-existing warnings are OK).

- [ ] **Step 2: Deploy to production**

Run: `npx vercel --prod --yes`
Expected: Deployment completes with READY status.
