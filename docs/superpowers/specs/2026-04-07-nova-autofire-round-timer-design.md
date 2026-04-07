# Nova Auto-Fire + Round Timer — Design Spec

## Overview

Two features for the Fieldwork simulation:
1. Nova automatically sends a provocative opening challenge at the start of each round
2. Instructor-configured countdown timer visible during simulation rounds

---

## Feature 1: Nova Auto-Fire

### Behaviour

When a round loads, Nova automatically sends a single Socratic challenge message before any student has voted. The message references specific data from the scenario and creates tension that drives students to open the data tabs.

- Fires once per round, not on re-renders or tab switches
- Uses a dedicated system prompt (different from the normal Nova prompt)
- Appears as a normal Nova assistant message with a subtle "Nova opened this round" indicator
- Panel stays always-visible (current layout); auto-scrolls to show the new message

### Data Routing

Each round gets context from the two most relevant data tabs:

| Round | Tab 1 | Tab 2 |
|-------|-------|-------|
| budget (round 0) | `pl.dataSummary` | `channels.dataSummary` |
| diagnose (round 1) | `funnel.dataSummary` | `benchmarks.dataSummary` |
| rfm (round 2) | `rfm.dataSummary` | `cohorts.dataSummary` |

### Auto-Fire System Prompt

```
You are Nova, an AI copilot inside a marketing analytics simulation called Fieldwork. A team of students is about to make a strategic decision. Your job is to fire the first shot — a single provocative Socratic challenge that makes them want to open the data tabs before they vote.

Rules:
- Never give the answer or hint at which option is correct
- Reference specific numbers from the data provided
- Ask ONE sharp question that creates productive tension
- Address the team directly, not an individual
- Keep it under 50 words
- Do not use bullet points
- Sound like a sharp senior analyst, not a chatbot
```

### Auto-Fire Context Payload

The auto-fire API call sends:

```
Scenario: {scenarioName} ({scenarioKey})
Round: {roundName}

Brief: {roundBrief}

Question 1: {questions[0].question}
Question 2: {questions[1].question}

Key data signals:
{dataSummary1}
{dataSummary2}
```

### Changes

#### NovaChat.tsx

- Add `autoFireRef = useRef<Set<string>>(new Set())` — tracks which round keys have already auto-fired
- New props: `scenarioName: string`, `scenarioData: Record<string, any>`, `questions: { question: string }[]`
- Add `useEffect` watching `round` prop:
  - If `autoFireRef.current.has(round)`, skip
  - Otherwise, add to set and call `sendAutoFire()`
- `sendAutoFire()` builds the context payload from the data routing table, calls the API with `isAutoFire: true`
- Auto-fire messages marked with `isAutoFire: true` on the Message type
- Render auto-fire messages with a subtle label: small grey text "Nova opened this round" below the message bubble

#### API route (api/nova/route.ts)

- Accept `isAutoFire` boolean in request body
- When `isAutoFire` is true:
  - Use the auto-fire system prompt instead of the default system prompt
  - The context message is the auto-fire payload (scenario + round + brief + questions + data summaries)
  - No conversation history needed (it's the first message)
- When `isAutoFire` is false: existing behaviour unchanged

#### Session page (session/[code]/page.tsx)

- Pass new props to NovaChat:
  - `scenarioName`: `scenario?.name` (the display name from SCENARIOS)
  - `scenarioData`: `scenario?.tabs` (the full tabs object from lib/scenarios)
  - `questions`: `currentRound?.questions ?? []`

---

## Feature 2: Round Timer

### Part A — Instructor Setup

#### InstructorSetup.tsx

- Add state: `roundDuration: number | null`, default `null`
- Add dropdown below the rounds checkboxes:
  - Label: "Time per round"
  - Options: No timer (null) | 10 min | 15 min | 20 min | 30 min
- Include `round_duration_minutes: roundDuration` in the Supabase insert

#### Supabase Migration

```sql
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS round_duration_minutes integer;
```

Run manually or via Supabase dashboard before deployment.

### Part B — Timer Display

#### New component: RoundTimer.tsx

Location: `src/components/sim/RoundTimer.tsx`

Props:
```typescript
interface RoundTimerProps {
  durationMinutes: number;
}
```

Behaviour:
- `useState(durationMinutes * 60)` for seconds remaining
- `useEffect` with `setInterval(1000)` that decrements. Clears interval at 0.
- Displays `MM:SS` format

Colour thresholds (based on percentage of total time remaining):
| Condition | Colour | Extra |
|-----------|--------|-------|
| > 50% remaining | `#718096` (grey) | — |
| 25%–50% remaining | `#D97706` (amber) | — |
| < 25% remaining | `#DC2626` (red) | — |
| < 60 seconds | `#DC2626` (red) | `animate-pulse` CSS class |

Returns `null` if called with falsy `durationMinutes`.

### Part C — Timer Reset

The timer resets automatically between rounds by using React's `key` prop:

```tsx
<RoundTimer key={`timer-${currentRoundIdx}`} durationMinutes={session.round_duration_minutes} />
```

When `currentRoundIdx` changes, React unmounts the old timer and mounts a new one, resetting the countdown.

### Session Page Integration

- Fetch `round_duration_minutes` from the session record (already included in the session query)
- Place `<RoundTimer>` in the header bar, immediately after the round badge span
- Only render if `session.round_duration_minutes` is truthy

---

## Files Changed

| File | Feature | Change |
|------|---------|--------|
| `src/components/sim/NovaChat.tsx` | F1 | Auto-fire ref, useEffect, new props, message label |
| `src/app/api/nova/route.ts` | F1 | Auto-fire system prompt, isAutoFire flag handling |
| `src/app/session/[code]/page.tsx` | F1+F2 | Pass new NovaChat props, add RoundTimer, fetch round_duration_minutes |
| `src/components/sim/RoundTimer.tsx` | F2 | New component — countdown timer |
| `src/components/lobby/InstructorSetup.tsx` | F2 | Round duration dropdown, include in session insert |

## Scope Boundaries

- Timer is purely client-side visual pressure — no server-side enforcement, no auto-locking
- Auto-fire uses the same `/api/nova` endpoint with a flag, not a separate endpoint
- No changes to the instructor dashboard or debrief pages
- Both features work across all 5 scenarios and all 3 rounds
