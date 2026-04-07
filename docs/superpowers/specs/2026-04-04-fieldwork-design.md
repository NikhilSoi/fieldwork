# Fieldwork by VectorEd — Design Spec

**Date:** 2026-04-04
**Stack:** Next.js 14 (App Router), Supabase (Postgres + Realtime + Auth), Tailwind CSS, Chart.js, Vercel

## Overview

Fieldwork is a classroom simulation platform where an instructor creates a session, students join via a code, self-select into teams (max 6), and compete through marketing scenarios across 3 rounds. An AI copilot (Nova) provides Socratic guidance with limited queries. A spectator view shows a live leaderboard.

## User Types

| Role | Auth | Persistence |
|------|------|-------------|
| Instructor | Supabase Auth (email/password) | Full account, sees past sessions |
| Student | Ephemeral — session code + display name, signed JWT cookie | Rejoin via same code + name |
| Spectator | None — public URL `/spectate/[code]` | Stateless |

## Database Schema (Supabase Postgres)

### `instructors`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | FK to `auth.users.id` |
| email | VARCHAR | |
| display_name | VARCHAR | |
| created_at | TIMESTAMPTZ | |

### `sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| instructor_id | UUID (FK) | |
| code | VARCHAR(6) | Unique, uppercase alphanumeric |
| title | VARCHAR | |
| status | VARCHAR | `lobby` \| `active` \| `completed` |
| scenario_id | VARCHAR | `lume_dtc`, `flowdesk_saas`, `stackd_marketplace`, `the_brief_newsletter` |
| current_round | INT | 0 = lobby, 1-3 = active rounds |
| max_team_size | INT | Default 6 |
| nova_queries_per_round | INT | Instructor-configured |
| created_at | TIMESTAMPTZ | |

### `teams`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| session_id | UUID (FK) | |
| name | VARCHAR | Student-chosen or auto-generated |
| score | NUMERIC | Updated by consequence engine |
| created_at | TIMESTAMPTZ | |

### `students`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| session_id | UUID (FK) | |
| team_id | UUID (FK, nullable) | Null until team selected |
| display_name | VARCHAR | |
| is_connected | BOOLEAN | Presence tracking |
| joined_at | TIMESTAMPTZ | |

Unique constraint: `(session_id, display_name)`

### `votes`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| session_id | UUID (FK) | |
| team_id | UUID (FK) | |
| student_id | UUID (FK) | |
| round | INT | 1-3 |
| decision | JSONB | Budget allocation, funnel choice, or RFM segment |
| created_at | TIMESTAMPTZ | |

Unique constraint: `(student_id, session_id, round)`

### `team_decisions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| team_id | UUID (FK) | |
| session_id | UUID (FK) | |
| round | INT | 1-3 |
| decision | JSONB | Majority/plurality vote |
| was_split | BOOLEAN | True if no clear majority |
| committed_at | TIMESTAMPTZ | |

Unique constraint: `(team_id, session_id, round)`

### `round_kpis`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| team_id | UUID (FK) | |
| session_id | UUID (FK) | |
| round | INT | 0 = baseline, 1-3 = post-round |
| kpis | JSONB | Revenue, CAC, LTV, conversion rates, etc. |
| created_at | TIMESTAMPTZ | |

Unique constraint: `(team_id, session_id, round)`

### `nova_queries`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| team_id | UUID (FK) | |
| session_id | UUID (FK) | |
| student_id | UUID (FK) | Who asked |
| round | INT | |
| prompt | TEXT | Student's question |
| response | TEXT | Nova's Socratic response |
| created_at | TIMESTAMPTZ | |

## Auth Flow

### Instructor
1. Sign up / log in via Supabase Auth (email + password)
2. Lands on instructor dashboard with past sessions + "Create Session"
3. Create session: pick scenario, set title, max_team_size, nova_queries_per_round → generates 6-char code

### Student
1. Visit `/` → enter session code + display name
2. Server validates: code exists, session is `lobby` or `active`, name is unique in session
3. Creates `students` row, mints signed JWT cookie with `student_id` + `session_id`
4. Lands in lobby → sees teams, can join (up to max_team_size) or create new team
5. **Rejoin:** Same code + name → looks up existing row, reissues cookie

### Spectator
1. Navigate to `/spectate/[code]`
2. No auth — validates session code exists
3. Read-only live leaderboard via Supabase Realtime

## Row-Level Security (RLS)

| Table | Read | Write |
|-------|------|-------|
| instructors | Own row only | Own row only |
| sessions | Instructor: own; Students: their session | Instructor: own |
| teams | Anyone in session | Server only (service role) |
| students | Anyone in session | Own row (team selection) |
| votes | Team members after commit | Own vote only |
| team_decisions | Session participants + spectators | Server only |
| round_kpis | Session participants + spectators | Server only |
| nova_queries | Own team only | Team members (up to limit) |

Since students don't use Supabase Auth, student writes go through API routes using the **service role key**, validating the student JWT cookie server-side.

## Real-time & Session Lifecycle

### Supabase Realtime Channels
- **`session:{code}`** — Lobby presence, team rosters, session status changes, instructor broadcasts
- **`team:{team_id}`** — Vote submissions (teammates see each other's votes), split detection, Nova query updates
- **`leaderboard:{code}`** — Score updates after round commits (spectator + instructor views)

### Session State Machine
```
lobby → round_1 → round_2 → round_3 → completed
```
- Instructor controls all transitions
- `sessions.current_round` update triggers Realtime broadcast
- Students can only vote for the current round

### Vote → Decision Pipeline
1. Student submits vote → `votes` row inserted
2. Server checks all votes for `(team_id, round)`
3. Majority (>50%) → `team_decisions` created, `was_split = false`
4. All voted, no majority → plurality wins, `was_split = true`. If tied → team re-votes or instructor breaks tie
5. On commit → consequence engine: previous `round_kpis` + decision → new `round_kpis`

### Competitor View
After a team commits, they can see other committed teams' decisions for the same round. Uncommitted teams stay hidden.

## Application Structure

### Routes
```
/                              Student join (code + name)
/instructor/login              Supabase Auth login
/instructor/dashboard          Past sessions, create new
/instructor/session/[code]     Control panel (lobby, rounds, leaderboard, feed, broadcast)

/lobby/[code]                  Student lobby (team selection)
/play/[code]                   Game view (dashboard tabs, voting, Nova)
/debrief/[code]                Post-game results

/spectate/[code]               Public leaderboard

/api/nova                      POST — Anthropic API, validates query limit
/api/session                   Session CRUD
/api/vote                      Vote submission + majority detection
/api/consequence               Consequence engine
```

### Middleware
- `/instructor/*` → Supabase Auth check, redirect to login
- `/lobby/*`, `/play/*`, `/debrief/*` → Student cookie check, redirect to `/`
- `/spectate/*` → No auth

### Key Components
- **DataDashboard** — 6 tabs: P&L, Funnel, Channels, Cohorts, RFM, Benchmarks (Chart.js)
- **VotingPanel** — Round brief, options, teammate votes, commit status
- **NovaCopilot** — Chat panel, remaining queries count, Socratic responses
- **TeamRoster** — Members, connection status
- **Leaderboard** — Ranked teams, animated score updates
- **InstructorControls** — Round advance, activity feed, broadcast input

## Nova AI Copilot

- `POST /api/nova` validates student cookie, checks query count against `nova_queries_per_round`
- Prompt context: scenario data, active dashboard tab data, team vote history, round brief, prior Nova exchanges
- System prompt: Socratic only — ask probing questions, challenge assumptions, point to overlooked data. Never give answers.
- Stores prompt + response in `nova_queries`
- Returns response + remaining query count

## Scoring System

- Each scenario defines KPIs with weights (e.g., revenue growth 30%, CAC efficiency 25%, LTV:CAC 20%, conversion 15%, retention 10%)
- Decisions produce KPI outcomes via consequence engine
- After Round 3: final score = weighted sum of normalized KPI performance
- Each KPI scored 0-100 based on distance from scenario-defined optimal
- Total possible: 100 points
- Leaderboard ranks by total score; tiebreaker is Round 3 KPI performance

## Debrief Screen

- Final score + rank
- Round-by-round decision chain with consequences ("You chose X → CAC +15%")
- Comparison to other teams' paths
- Nova post-game analysis: final API call summarizing strategic arc, turning points, alternatives
- Class patterns: most common decisions, biggest divergences

## Scenarios (data provided separately)

4 scenarios, 3 rounds each:
1. **Lume DTC** — Direct-to-consumer brand
2. **Flowdesk SaaS** — B2B SaaS platform
3. **Stackd Marketplace** — Two-sided marketplace
4. **The Brief Newsletter** — Media/newsletter business

Round types across all scenarios:
- Round 1: Budget allocation
- Round 2: Funnel diagnosis
- Round 3: RFM segmentation
