# Fieldwork Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Fieldwork Next.js app with Supabase database schema, instructor auth, session management, student join/rejoin, team self-selection lobby, instructor control panel, and spectator leaderboard shell.

**Architecture:** Next.js 14 App Router with server components by default, client components only where interactivity is needed (forms, real-time). API routes handle all student writes using Supabase service role key with student JWT cookie validation. Supabase Realtime powers lobby presence and session state broadcasts.

**Tech Stack:** Next.js 14, Supabase (Postgres + Auth + Realtime), Tailwind CSS, TypeScript, jose (JWT signing/verification)

**Scope:** This plan covers the foundation. Simulation engine, data dashboard, voting, Nova AI, scoring, and debrief are separate plans pending scenario data.

---

## File Structure

```
fieldwork/
├── .env.local                          # Supabase keys, JWT secret
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── middleware.ts                        # Route protection
├── supabase/
│   └── migrations/
│       └── 001_schema.sql              # All tables, RLS, indexes
├── src/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts               # Server-side Supabase client (service role + auth)
│   │   │   └── client.ts               # Browser-side Supabase client (anon key)
│   │   ├── student-jwt.ts              # Sign/verify student JWT cookies
│   │   ├── session-code.ts             # Generate 6-char codes
│   │   └── types.ts                    # Shared TypeScript types for all tables
│   ├── app/
│   │   ├── layout.tsx                  # Root layout with Tailwind
│   │   ├── page.tsx                    # Student join form
│   │   ├── instructor/
│   │   │   ├── login/
│   │   │   │   └── page.tsx            # Login/signup form
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx            # Past sessions + create new
│   │   │   └── session/
│   │   │       └── [code]/
│   │   │           └── page.tsx        # Instructor control panel
│   │   ├── lobby/
│   │   │   └── [code]/
│   │   │       └── page.tsx            # Team selection lobby
│   │   ├── spectate/
│   │   │   └── [code]/
│   │   │       └── page.tsx            # Public leaderboard shell
│   │   └── api/
│   │       ├── session/
│   │       │   └── route.ts            # Session CRUD
│   │       ├── join/
│   │       │   └── route.ts            # Student join/rejoin
│   │       ├── team/
│   │       │   └── route.ts            # Create/join team
│   │       └── instructor/
│   │           └── round/
│   │               └── route.ts        # Advance round
│   └── components/
│       ├── TeamRoster.tsx              # Team members + join button
│       ├── Leaderboard.tsx             # Ranked teams (used in spectate + instructor)
│       └── InstructorControls.tsx      # Round advancement + broadcast
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.js`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.js`, `.env.local`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/nikhilsoi/FiledWork
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

Expected: Next.js 14 project scaffolded with App Router, TypeScript, Tailwind, src directory.

- [ ] **Step 2: Install Supabase and JWT dependencies**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr jose
```

Expected: Packages added to `package.json`.

- [ ] **Step 3: Create `.env.local`**

Create `.env.local` at project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STUDENT_JWT_SECRET=generate_a_random_64_char_hex_string
```

- [ ] **Step 4: Verify dev server starts**

Run:
```bash
npm run dev
```

Expected: Server starts on `http://localhost:3000`, default Next.js page renders.

- [ ] **Step 5: Commit**

```bash
git init
echo "node_modules/\n.next/\n.env.local" > .gitignore
git add -A
git commit -m "chore: scaffold Next.js 14 with Supabase and Tailwind"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Define all database types**

Create `src/lib/types.ts`:

```typescript
export type SessionStatus = 'lobby' | 'active' | 'completed';

export type ScenarioId =
  | 'lume_dtc'
  | 'flowdesk_saas'
  | 'stackd_marketplace'
  | 'the_brief_newsletter';

export interface Instructor {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface Session {
  id: string;
  instructor_id: string;
  code: string;
  title: string;
  status: SessionStatus;
  scenario_id: ScenarioId;
  current_round: number;
  max_team_size: number;
  nova_queries_per_round: number;
  created_at: string;
}

export interface Team {
  id: string;
  session_id: string;
  name: string;
  score: number;
  created_at: string;
}

export interface Student {
  id: string;
  session_id: string;
  team_id: string | null;
  display_name: string;
  is_connected: boolean;
  joined_at: string;
}

export interface Vote {
  id: string;
  session_id: string;
  team_id: string;
  student_id: string;
  round: number;
  decision: Record<string, unknown>;
  created_at: string;
}

export interface TeamDecision {
  id: string;
  team_id: string;
  session_id: string;
  round: number;
  decision: Record<string, unknown>;
  was_split: boolean;
  committed_at: string;
}

export interface RoundKpis {
  id: string;
  team_id: string;
  session_id: string;
  round: number;
  kpis: Record<string, number>;
  created_at: string;
}

export interface NovaQuery {
  id: string;
  team_id: string;
  session_id: string;
  student_id: string;
  round: number;
  prompt: string;
  response: string;
  created_at: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add TypeScript types for all database tables"
```

---

### Task 3: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`

- [ ] **Step 1: Create server-side Supabase clients**

Create `src/lib/supabase/server.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Service role client — bypasses RLS, used for student writes
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Auth client — respects RLS, used for instructor operations
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

- [ ] **Step 2: Create browser-side Supabase client**

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add Supabase server and browser client helpers"
```

---

### Task 4: Database Schema Migration

**Files:**
- Create: `supabase/migrations/001_schema.sql`

- [ ] **Step 1: Write the full schema SQL**

Create `supabase/migrations/001_schema.sql`:

```sql
-- Instructors (linked to Supabase Auth)
create table public.instructors (
  id uuid primary key references auth.users(id) on delete cascade,
  email varchar not null,
  display_name varchar not null,
  created_at timestamptz not null default now()
);

-- Sessions
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.instructors(id) on delete cascade,
  code varchar(6) not null unique,
  title varchar not null,
  status varchar not null default 'lobby' check (status in ('lobby', 'active', 'completed')),
  scenario_id varchar not null check (scenario_id in ('lume_dtc', 'flowdesk_saas', 'stackd_marketplace', 'the_brief_newsletter')),
  current_round int not null default 0 check (current_round >= 0 and current_round <= 3),
  max_team_size int not null default 6 check (max_team_size >= 2 and max_team_size <= 10),
  nova_queries_per_round int not null default 3 check (nova_queries_per_round >= 0),
  created_at timestamptz not null default now()
);

-- Teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  name varchar not null,
  score numeric not null default 0,
  created_at timestamptz not null default now()
);

-- Students (ephemeral, no auth)
create table public.students (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  display_name varchar not null,
  is_connected boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (session_id, display_name)
);

-- Votes
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  round int not null check (round >= 1 and round <= 3),
  decision jsonb not null,
  created_at timestamptz not null default now(),
  unique (student_id, session_id, round)
);

-- Team Decisions (committed majority vote)
create table public.team_decisions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  round int not null check (round >= 1 and round <= 3),
  decision jsonb not null,
  was_split boolean not null default false,
  committed_at timestamptz not null default now(),
  unique (team_id, session_id, round)
);

-- Round KPIs
create table public.round_kpis (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  round int not null check (round >= 0 and round <= 3),
  kpis jsonb not null,
  created_at timestamptz not null default now(),
  unique (team_id, session_id, round)
);

-- Nova AI Queries
create table public.nova_queries (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  round int not null check (round >= 1 and round <= 3),
  prompt text not null,
  response text not null,
  created_at timestamptz not null default now()
);

-- Indexes for common queries
create index idx_sessions_code on public.sessions(code);
create index idx_sessions_instructor on public.sessions(instructor_id);
create index idx_students_session on public.students(session_id);
create index idx_students_team on public.students(team_id);
create index idx_teams_session on public.teams(session_id);
create index idx_votes_team_round on public.votes(team_id, round);
create index idx_team_decisions_session_round on public.team_decisions(session_id, round);
create index idx_round_kpis_team_session on public.round_kpis(team_id, session_id);
create index idx_nova_queries_team_round on public.nova_queries(team_id, round);

-- Row Level Security
alter table public.instructors enable row level security;
alter table public.sessions enable row level security;
alter table public.teams enable row level security;
alter table public.students enable row level security;
alter table public.votes enable row level security;
alter table public.team_decisions enable row level security;
alter table public.round_kpis enable row level security;
alter table public.nova_queries enable row level security;

-- Instructor policies (authenticated via Supabase Auth)
create policy "Instructors read own" on public.instructors
  for select using (auth.uid() = id);
create policy "Instructors update own" on public.instructors
  for update using (auth.uid() = id);

-- Session policies
create policy "Instructors read own sessions" on public.sessions
  for select using (auth.uid() = instructor_id);
create policy "Instructors insert sessions" on public.sessions
  for insert with check (auth.uid() = instructor_id);
create policy "Instructors update own sessions" on public.sessions
  for update using (auth.uid() = instructor_id);

-- Public read for sessions by code (students/spectators use service role, but this allows anon lookups)
create policy "Anyone can read session by code" on public.sessions
  for select using (true);

-- Teams: readable by anyone (for lobby), writable via service role only
create policy "Anyone can read teams" on public.teams
  for select using (true);

-- Students: readable by anyone in session, writable via service role
create policy "Anyone can read students" on public.students
  for select using (true);

-- Team decisions: readable by anyone (for competitor view + spectate)
create policy "Anyone can read team decisions" on public.team_decisions
  for select using (true);

-- Round KPIs: readable by anyone (for leaderboard)
create policy "Anyone can read round kpis" on public.round_kpis
  for select using (true);

-- Votes: readable by team members (enforced at API level, RLS allows session read)
create policy "Anyone can read votes" on public.votes
  for select using (true);

-- Nova queries: readable by team (enforced at API level)
create policy "Anyone can read nova queries" on public.nova_queries
  for select using (true);

-- Enable realtime for key tables
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.teams;
alter publication supabase_realtime add table public.students;
alter publication supabase_realtime add table public.team_decisions;
alter publication supabase_realtime add table public.round_kpis;
```

- [ ] **Step 2: Apply migration to Supabase**

Run the SQL in the Supabase SQL Editor (Dashboard > SQL Editor > paste and run), or if using Supabase CLI:

```bash
npx supabase db push
```

Expected: All 8 tables created with constraints, indexes, RLS policies, and realtime enabled.

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema with RLS and realtime"
```

---

### Task 5: Student JWT Helper

**Files:**
- Create: `src/lib/student-jwt.ts`

- [ ] **Step 1: Create JWT sign/verify utilities**

Create `src/lib/student-jwt.ts`:

```typescript
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'fieldwork_student';

function getSecret() {
  const secret = process.env.STUDENT_JWT_SECRET;
  if (!secret) throw new Error('STUDENT_JWT_SECRET not set');
  return new TextEncoder().encode(secret);
}

export interface StudentJwtPayload {
  student_id: string;
  session_id: string;
}

export async function signStudentJwt(payload: StudentJwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
}

export async function verifyStudentJwt(token: string): Promise<StudentJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      student_id: payload.student_id as string,
      session_id: payload.session_id as string,
    };
  } catch {
    return null;
  }
}

export async function setStudentCookie(payload: StudentJwtPayload) {
  const token = await signStudentJwt(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function getStudentFromCookie(): Promise<StudentJwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyStudentJwt(token);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/student-jwt.ts
git commit -m "feat: add student JWT cookie sign/verify helpers"
```

---

### Task 6: Session Code Generator

**Files:**
- Create: `src/lib/session-code.ts`

- [ ] **Step 1: Create session code utility**

Create `src/lib/session-code.ts`:

```typescript
import { createServiceClient } from '@/lib/supabase/server';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion

export function generateCode(length = 6): string {
  let code = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    code += CHARS[array[i] % CHARS.length];
  }
  return code;
}

export async function generateUniqueCode(): Promise<string> {
  const supabase = createServiceClient();
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const { data } = await supabase
      .from('sessions')
      .select('id')
      .eq('code', code)
      .single();
    if (!data) return code;
  }
  throw new Error('Failed to generate unique session code after 10 attempts');
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/session-code.ts
git commit -m "feat: add session code generator with uniqueness check"
```

---

### Task 7: Middleware (Route Protection)

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create Next.js middleware**

Create `middleware.ts` at project root:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Instructor routes — check Supabase Auth
  if (pathname.startsWith('/instructor/dashboard') || pathname.startsWith('/instructor/session')) {
    const response = NextResponse.next();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/instructor/login', request.url));
    }
    return response;
  }

  // Student routes — check student JWT cookie
  if (pathname.startsWith('/lobby/') || pathname.startsWith('/play/') || pathname.startsWith('/debrief/')) {
    const studentToken = request.cookies.get('fieldwork_student')?.value;
    if (!studentToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // JWT verification happens at the API/page level (jose needs async, middleware can check existence)
    return NextResponse.next();
  }

  // Spectate + home — no auth
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/instructor/dashboard/:path*',
    '/instructor/session/:path*',
    '/lobby/:path*',
    '/play/:path*',
    '/debrief/:path*',
  ],
};
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add route protection middleware for instructor and student routes"
```

---

### Task 8: Instructor Auth — Login Page

**Files:**
- Create: `src/app/instructor/login/page.tsx`

- [ ] **Step 1: Create instructor login/signup page**

Create `src/app/instructor/login/page.tsx`:

```tsx
'use client';

import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function InstructorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        // Create instructor profile
        const res = await fetch('/api/session', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_instructor',
            display_name: displayName || email.split('@')[0],
          }),
        });
        if (!res.ok) {
          setError('Failed to create instructor profile');
          setLoading(false);
          return;
        }
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
    }

    router.push('/instructor/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isSignUp ? 'Create Instructor Account' : 'Instructor Login'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Professor Smith"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="instructor@university.edu"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
          className="mt-4 w-full text-center text-sm text-blue-600 hover:underline"
        >
          {isSignUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify login page renders**

Run: `npm run dev`, navigate to `http://localhost:3000/instructor/login`.
Expected: Login form renders with email, password fields, and sign up toggle.

- [ ] **Step 3: Commit**

```bash
git add src/app/instructor/login/
git commit -m "feat: add instructor login/signup page"
```

---

### Task 9: Session API Route

**Files:**
- Create: `src/app/api/session/route.ts`

- [ ] **Step 1: Create session API route**

Create `src/app/api/session/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createAuthClient } from '@/lib/supabase/server';
import { generateUniqueCode } from '@/lib/session-code';

// POST — create a new session (instructor only)
export async function POST(request: NextRequest) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, scenario_id, max_team_size, nova_queries_per_round } = body;

  if (!title || !scenario_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const validScenarios = ['lume_dtc', 'flowdesk_saas', 'stackd_marketplace', 'the_brief_newsletter'];
  if (!validScenarios.includes(scenario_id)) {
    return NextResponse.json({ error: 'Invalid scenario' }, { status: 400 });
  }

  const code = await generateUniqueCode();
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from('sessions')
    .insert({
      instructor_id: user.id,
      code,
      title,
      scenario_id,
      max_team_size: max_team_size || 6,
      nova_queries_per_round: nova_queries_per_round ?? 3,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// GET — list instructor's sessions
export async function GET() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from('sessions')
    .select('*')
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT — create instructor profile (called after sign-up)
export async function PUT(request: NextRequest) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  if (body.action === 'create_instructor') {
    const serviceClient = createServiceClient();
    const { error } = await serviceClient
      .from('instructors')
      .upsert({
        id: user.id,
        email: user.email!,
        display_name: body.display_name || user.email!.split('@')[0],
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/session/
git commit -m "feat: add session CRUD API route for instructors"
```

---

### Task 10: Student Join/Rejoin API Route

**Files:**
- Create: `src/app/api/join/route.ts`

- [ ] **Step 1: Create student join API route**

Create `src/app/api/join/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { setStudentCookie } from '@/lib/student-jwt';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code, display_name } = body;

  if (!code || !display_name) {
    return NextResponse.json({ error: 'Session code and display name are required' }, { status: 400 });
  }

  const trimmedName = display_name.trim();
  if (trimmedName.length < 1 || trimmedName.length > 50) {
    return NextResponse.json({ error: 'Display name must be 1-50 characters' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Find the session
  const { data: session } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('code', code.toUpperCase())
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.status === 'completed') {
    return NextResponse.json({ error: 'Session has ended' }, { status: 400 });
  }

  // Check for existing student (rejoin)
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id, session_id, team_id')
    .eq('session_id', session.id)
    .eq('display_name', trimmedName)
    .single();

  if (existingStudent) {
    // Rejoin — update connection status, reissue cookie
    await supabase
      .from('students')
      .update({ is_connected: true })
      .eq('id', existingStudent.id);

    await setStudentCookie({
      student_id: existingStudent.id,
      session_id: session.id,
    });

    return NextResponse.json({
      student_id: existingStudent.id,
      session_id: session.id,
      team_id: existingStudent.team_id,
      rejoined: true,
    });
  }

  // New student — create
  const { data: newStudent, error } = await supabase
    .from('students')
    .insert({
      session_id: session.id,
      display_name: trimmedName,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Name already taken in this session' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await setStudentCookie({
    student_id: newStudent.id,
    session_id: session.id,
  });

  return NextResponse.json({
    student_id: newStudent.id,
    session_id: session.id,
    team_id: null,
    rejoined: false,
  }, { status: 201 });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/join/
git commit -m "feat: add student join/rejoin API route with JWT cookie"
```

---

### Task 11: Team API Route

**Files:**
- Create: `src/app/api/team/route.ts`

- [ ] **Step 1: Create team create/join API route**

Create `src/app/api/team/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getStudentFromCookie } from '@/lib/student-jwt';

// POST — create a new team or join an existing one
export async function POST(request: NextRequest) {
  const student = await getStudentFromCookie();
  if (!student) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { action, team_id, team_name } = body;
  const supabase = createServiceClient();

  // Get session info for max_team_size
  const { data: session } = await supabase
    .from('sessions')
    .select('id, max_team_size, status')
    .eq('id', student.session_id)
    .single();

  if (!session || session.status === 'completed') {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }

  if (action === 'create') {
    if (!team_name || team_name.trim().length < 1) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Check for duplicate team name in session
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('session_id', student.session_id)
      .eq('name', team_name.trim())
      .single();

    if (existingTeam) {
      return NextResponse.json({ error: 'Team name already taken' }, { status: 409 });
    }

    // Create team
    const { data: newTeam, error: teamError } = await supabase
      .from('teams')
      .insert({
        session_id: student.session_id,
        name: team_name.trim(),
      })
      .select('id')
      .single();

    if (teamError) {
      return NextResponse.json({ error: teamError.message }, { status: 500 });
    }

    // Assign student to the new team
    const { error: updateError } = await supabase
      .from('students')
      .update({ team_id: newTeam.id })
      .eq('id', student.student_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ team_id: newTeam.id }, { status: 201 });
  }

  if (action === 'join') {
    if (!team_id) {
      return NextResponse.json({ error: 'team_id is required' }, { status: 400 });
    }

    // Check team exists and belongs to session
    const { data: team } = await supabase
      .from('teams')
      .select('id, session_id')
      .eq('id', team_id)
      .eq('session_id', student.session_id)
      .single();

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check team size
    const { count } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', team_id);

    if (count !== null && count >= session.max_team_size) {
      return NextResponse.json({ error: 'Team is full' }, { status: 400 });
    }

    // Assign student
    const { error: updateError } = await supabase
      .from('students')
      .update({ team_id })
      .eq('id', student.student_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ team_id });
  }

  return NextResponse.json({ error: 'Invalid action. Use "create" or "join"' }, { status: 400 });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/team/
git commit -m "feat: add team create/join API route with size enforcement"
```

---

### Task 12: Instructor Round Advancement API

**Files:**
- Create: `src/app/api/instructor/round/route.ts`

- [ ] **Step 1: Create round advancement route**

Create `src/app/api/instructor/round/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createAuthClient } from '@/lib/supabase/server';

// POST — advance session to next round
export async function POST(request: NextRequest) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { session_id } = body;

  if (!session_id) {
    return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Verify session belongs to this instructor
  const { data: session } = await serviceClient
    .from('sessions')
    .select('id, instructor_id, status, current_round')
    .eq('id', session_id)
    .single();

  if (!session || session.instructor_id !== user.id) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.status === 'completed') {
    return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
  }

  let newRound = session.current_round + 1;
  let newStatus = session.status;

  if (session.status === 'lobby') {
    // Start the session
    newRound = 1;
    newStatus = 'active';
  } else if (newRound > 3) {
    // Complete the session
    newRound = 3;
    newStatus = 'completed';
  }

  const { data: updated, error } = await serviceClient
    .from('sessions')
    .update({
      current_round: newRound,
      status: newStatus,
    })
    .eq('id', session_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/instructor/round/
git commit -m "feat: add instructor round advancement API route"
```

---

### Task 13: Student Join Page (Home)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace default home page with student join form**

Replace `src/app/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code.toUpperCase().trim(),
        display_name: displayName.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    // If student already has a team, go to lobby (they can see their team)
    router.push(`/lobby/${code.toUpperCase().trim()}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-center mb-2">Fieldwork</h1>
        <p className="text-gray-500 text-center mb-6">by VectorEd</p>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Session Code
            </label>
            <input
              id="code"
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest uppercase"
              placeholder="ABC123"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              required
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your name"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Join Session'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/instructor/login" className="text-sm text-gray-500 hover:text-gray-700">
            Instructor login
          </a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify home page renders**

Run: `npm run dev`, navigate to `http://localhost:3000`.
Expected: Join form with session code and name fields.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add student join page with session code entry"
```

---

### Task 14: Team Roster Component

**Files:**
- Create: `src/components/TeamRoster.tsx`

- [ ] **Step 1: Create TeamRoster component**

Create `src/components/TeamRoster.tsx`:

```tsx
'use client';

import { Team, Student } from '@/lib/types';

interface TeamRosterProps {
  team: Team;
  members: Student[];
  maxSize: number;
  currentStudentId: string | null;
  onJoin: (teamId: string) => void;
  joining: boolean;
}

export default function TeamRoster({
  team,
  members,
  maxSize,
  currentStudentId,
  onJoin,
  joining,
}: TeamRosterProps) {
  const isFull = members.length >= maxSize;
  const isOnTeam = members.some((m) => m.id === currentStudentId);
  const currentStudentHasTeam = currentStudentId !== null;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{team.name}</h3>
        <span className="text-sm text-gray-500">
          {members.length}/{maxSize}
        </span>
      </div>

      <ul className="space-y-1 mb-3">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                member.is_connected ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <span className={member.id === currentStudentId ? 'font-medium' : ''}>
              {member.display_name}
              {member.id === currentStudentId && ' (you)'}
            </span>
          </li>
        ))}
        {members.length === 0 && (
          <li className="text-sm text-gray-400">No members yet</li>
        )}
      </ul>

      {!isOnTeam && !isFull && (
        <button
          onClick={() => onJoin(team.id)}
          disabled={joining}
          className="w-full py-2 px-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {joining ? 'Joining...' : 'Join Team'}
        </button>
      )}
      {isFull && !isOnTeam && (
        <p className="text-sm text-gray-400 text-center">Team full</p>
      )}
      {isOnTeam && (
        <p className="text-sm text-green-600 text-center font-medium">Your team</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TeamRoster.tsx
git commit -m "feat: add TeamRoster component with join button and presence"
```

---

### Task 15: Student Lobby Page

**Files:**
- Create: `src/app/lobby/[code]/page.tsx`

- [ ] **Step 1: Create lobby page with team selection and real-time updates**

Create `src/app/lobby/[code]/page.tsx`:

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Team, Student, Session } from '@/lib/types';
import TeamRoster from '@/components/TeamRoster';

export default function LobbyPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [session, setSession] = useState<Session | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code)
      .single();

    if (!sessionData) {
      setError('Session not found');
      return;
    }
    setSession(sessionData);

    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .eq('session_id', sessionData.id)
      .order('created_at');

    setTeams(teamsData || []);

    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .eq('session_id', sessionData.id);

    setStudents(studentsData || []);
  }, [code, supabase]);

  // Get current student ID from cookie
  useEffect(() => {
    async function checkStudent() {
      const res = await fetch('/api/join');
      if (res.ok) {
        const data = await res.json();
        setCurrentStudentId(data.student_id);
      }
    }
    checkStudent();
  }, []);

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`session:${code}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `code=eq.${code}` },
        (payload) => {
          const updated = payload.new as Session;
          setSession(updated);
          // If round started, redirect to play
          if (updated.current_round >= 1 && updated.status === 'active') {
            router.push(`/play/${code}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, fetchData, router, supabase]);

  async function handleJoinTeam(teamId: string) {
    setJoining(true);
    setError('');
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', team_id: teamId }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
    }
    setJoining(false);
    fetchData();
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setJoining(true);
    setError('');
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', team_name: newTeamName.trim() }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
    }
    setNewTeamName('');
    setJoining(false);
    fetchData();
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{error || 'Loading...'}</p>
      </div>
    );
  }

  const unassigned = students.filter((s) => !s.team_id);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <p className="text-gray-500">
            Session code: <span className="font-mono font-bold">{session.code}</span>
            {' '}&middot; Waiting for instructor to start...
          </p>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {/* Create team form */}
        <form onSubmit={handleCreateTeam} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="New team name"
            maxLength={30}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={joining || !newTeamName.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Create Team
          </button>
        </form>

        {/* Teams grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {teams.map((team) => (
            <TeamRoster
              key={team.id}
              team={team}
              members={students.filter((s) => s.team_id === team.id)}
              maxSize={session.max_team_size}
              currentStudentId={currentStudentId}
              onJoin={handleJoinTeam}
              joining={joining}
            />
          ))}
        </div>

        {teams.length === 0 && (
          <p className="text-gray-400 text-center">No teams yet. Create one above!</p>
        )}

        {/* Unassigned students */}
        {unassigned.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Waiting to join a team ({unassigned.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {unassigned.map((s) => (
                <span key={s.id} className="px-2 py-1 bg-yellow-100 rounded text-sm">
                  {s.display_name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add GET handler to join route for student identity check**

Add to `src/app/api/join/route.ts`:

```typescript
// GET — check current student identity from cookie
export async function GET(request: NextRequest) {
  const { getStudentFromCookie } = await import('@/lib/student-jwt');
  const student = await getStudentFromCookie();
  if (!student) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json(student);
}
```

Add `NextRequest` to the import if not already present (it is — from the POST handler).

- [ ] **Step 3: Commit**

```bash
git add src/app/lobby/ src/app/api/join/
git commit -m "feat: add student lobby page with team selection and realtime"
```

---

### Task 16: Instructor Dashboard Page

**Files:**
- Create: `src/app/instructor/dashboard/page.tsx`

- [ ] **Step 1: Create instructor dashboard**

Create `src/app/instructor/dashboard/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session, ScenarioId } from '@/lib/types';

const SCENARIOS: { id: ScenarioId; label: string }[] = [
  { id: 'lume_dtc', label: 'Lumé DTC' },
  { id: 'flowdesk_saas', label: 'Flowdesk SaaS' },
  { id: 'stackd_marketplace', label: 'Stackd Marketplace' },
  { id: 'the_brief_newsletter', label: 'The Brief Newsletter' },
];

export default function InstructorDashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [scenarioId, setScenarioId] = useState<ScenarioId>('lume_dtc');
  const [maxTeamSize, setMaxTeamSize] = useState(6);
  const [novaQueries, setNovaQueries] = useState(3);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    const res = await fetch('/api/session');
    if (res.ok) {
      const data = await res.json();
      setSessions(data);
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');

    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        scenario_id: scenarioId,
        max_team_size: maxTeamSize,
        nova_queries_per_round: novaQueries,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      setCreating(false);
      return;
    }

    const session = await res.json();
    router.push(`/instructor/session/${session.code}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            {showCreate ? 'Cancel' : 'Create Session'}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow-md mb-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Session Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Marketing Analytics - Week 5"
              />
            </div>

            <div>
              <label htmlFor="scenario" className="block text-sm font-medium text-gray-700 mb-1">
                Scenario
              </label>
              <select
                id="scenario"
                value={scenarioId}
                onChange={(e) => setScenarioId(e.target.value as ScenarioId)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="teamSize" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Team Size
                </label>
                <input
                  id="teamSize"
                  type="number"
                  min={2}
                  max={10}
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="novaQueries" className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Queries per Round
                </label>
                <input
                  id="novaQueries"
                  type="number"
                  min={0}
                  max={20}
                  value={novaQueries}
                  onChange={(e) => setNovaQueries(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Session'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-gray-500">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No sessions yet. Create one to get started.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => router.push(`/instructor/session/${session.code}`)}
                className="w-full text-left p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{session.title}</h3>
                    <p className="text-sm text-gray-500">
                      Code: <span className="font-mono">{session.code}</span>
                      {' '}&middot; {SCENARIOS.find((s) => s.id === session.scenario_id)?.label}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    session.status === 'lobby' ? 'bg-yellow-100 text-yellow-800' :
                    session.status === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status === 'active' ? `Round ${session.current_round}` : session.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/instructor/dashboard/
git commit -m "feat: add instructor dashboard with session list and create form"
```

---

### Task 17: Instructor Session Control Panel

**Files:**
- Create: `src/app/instructor/session/[code]/page.tsx`, `src/components/InstructorControls.tsx`, `src/components/Leaderboard.tsx`

- [ ] **Step 1: Create Leaderboard component**

Create `src/components/Leaderboard.tsx`:

```tsx
import { Team } from '@/lib/types';

interface LeaderboardProps {
  teams: Team[];
}

export default function Leaderboard({ teams }: LeaderboardProps) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold">Leaderboard</h2>
      </div>
      {sorted.length === 0 ? (
        <p className="p-4 text-gray-400 text-sm">No teams yet</p>
      ) : (
        <ul>
          {sorted.map((team, i) => (
            <li
              key={team.id}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400 w-6 text-right">
                  {i + 1}
                </span>
                <span className="font-medium">{team.name}</span>
              </div>
              <span className="font-mono font-medium">{team.score}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create InstructorControls component**

Create `src/components/InstructorControls.tsx`:

```tsx
'use client';

import { Session } from '@/lib/types';

interface InstructorControlsProps {
  session: Session;
  onAdvanceRound: () => void;
  advancing: boolean;
}

export default function InstructorControls({
  session,
  onAdvanceRound,
  advancing,
}: InstructorControlsProps) {
  function getButtonLabel() {
    if (session.status === 'completed') return 'Session Complete';
    if (session.status === 'lobby') return 'Start Round 1';
    if (session.current_round >= 3) return 'End Session';
    return `Start Round ${session.current_round + 1}`;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="font-semibold mb-3">Session Controls</h2>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <p className="text-sm text-gray-500">Status</p>
          <p className="font-medium capitalize">{session.status}</p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500">Round</p>
          <p className="font-medium">
            {session.current_round === 0 ? 'Lobby' : `${session.current_round} / 3`}
          </p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500">Code</p>
          <p className="font-mono font-medium">{session.code}</p>
        </div>
      </div>

      <button
        onClick={onAdvanceRound}
        disabled={advancing || session.status === 'completed'}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {advancing ? 'Advancing...' : getButtonLabel()}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create instructor session page**

Create `src/app/instructor/session/[code]/page.tsx`:

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Session, Team, Student } from '@/lib/types';
import InstructorControls from '@/components/InstructorControls';
import Leaderboard from '@/components/Leaderboard';
import TeamRoster from '@/components/TeamRoster';

export default function InstructorSessionPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const supabase = createBrowserSupabaseClient();

  const [session, setSession] = useState<Session | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code)
      .single();

    if (!sessionData) {
      setError('Session not found');
      return;
    }
    setSession(sessionData);

    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .eq('session_id', sessionData.id)
      .order('created_at');
    setTeams(teamsData || []);

    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .eq('session_id', sessionData.id);
    setStudents(studentsData || []);
  }, [code, supabase]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`instructor:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `code=eq.${code}` }, (payload) => {
        setSession(payload.new as Session);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, fetchData, supabase]);

  async function handleAdvanceRound() {
    if (!session) return;
    setAdvancing(true);
    const res = await fetch('/api/instructor/round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: session.id }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
    } else {
      const updated = await res.json();
      setSession(updated);
    }
    setAdvancing(false);
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{error || 'Loading...'}</p>
      </div>
    );
  }

  const totalStudents = students.length;
  const assignedStudents = students.filter((s) => s.team_id).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <p className="text-gray-500">
            {totalStudents} students joined &middot; {assignedStudents} on teams &middot; {teams.length} teams
          </p>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <InstructorControls
              session={session}
              onAdvanceRound={handleAdvanceRound}
              advancing={advancing}
            />

            {/* Teams grid */}
            <div>
              <h2 className="font-semibold mb-3">Teams</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((team) => (
                  <TeamRoster
                    key={team.id}
                    team={team}
                    members={students.filter((s) => s.team_id === team.id)}
                    maxSize={session.max_team_size}
                    currentStudentId={null}
                    onJoin={() => {}}
                    joining={false}
                  />
                ))}
              </div>
              {teams.length === 0 && (
                <p className="text-gray-400">No teams created yet</p>
              )}
            </div>
          </div>

          <div>
            <Leaderboard teams={teams} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/instructor/session/ src/components/InstructorControls.tsx src/components/Leaderboard.tsx
git commit -m "feat: add instructor session control panel with leaderboard and team view"
```

---

### Task 18: Spectator Leaderboard Page

**Files:**
- Create: `src/app/spectate/[code]/page.tsx`

- [ ] **Step 1: Create spectator page**

Create `src/app/spectate/[code]/page.tsx`:

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Session, Team } from '@/lib/types';
import Leaderboard from '@/components/Leaderboard';

export default function SpectatePage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const supabase = createBrowserSupabaseClient();

  const [session, setSession] = useState<Session | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code)
      .single();

    if (!sessionData) {
      setError('Session not found');
      return;
    }
    setSession(sessionData);

    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .eq('session_id', sessionData.id)
      .order('score', { ascending: false });
    setTeams(teamsData || []);
  }, [code, supabase]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`leaderboard:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `code=eq.${code}` }, (payload) => {
        setSession(payload.new as Session);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, fetchData, supabase]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{session.title}</h1>
          <p className="text-gray-400 mt-1">
            {session.status === 'lobby' ? 'Waiting to start...' :
             session.status === 'completed' ? 'Session complete' :
             `Round ${session.current_round} of 3`}
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-semibold text-lg">Leaderboard</h2>
          </div>
          {teams.length === 0 ? (
            <p className="p-6 text-gray-500 text-center">No teams yet</p>
          ) : (
            <ul>
              {teams.map((team, i) => (
                <li
                  key={team.id}
                  className="flex items-center justify-between px-6 py-4 border-b border-gray-700 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl font-bold ${
                      i === 0 ? 'text-yellow-400' :
                      i === 1 ? 'text-gray-300' :
                      i === 2 ? 'text-amber-600' :
                      'text-gray-500'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="font-medium text-lg">{team.name}</span>
                  </div>
                  <span className="font-mono text-xl font-bold">{team.score}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/spectate/
git commit -m "feat: add spectator leaderboard page with realtime updates"
```

---

### Task 19: Placeholder Pages for Play and Debrief

**Files:**
- Create: `src/app/play/[code]/page.tsx`, `src/app/debrief/[code]/page.tsx`

- [ ] **Step 1: Create play page placeholder**

Create `src/app/play/[code]/page.tsx`:

```tsx
export default function PlayPage({ params }: { params: { code: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Game View</h1>
        <p className="text-gray-500">Session: {params.code.toUpperCase()}</p>
        <p className="text-gray-400 mt-4">Data dashboard, voting, and Nova copilot coming in the next plan.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create debrief page placeholder**

Create `src/app/debrief/[code]/page.tsx`:

```tsx
export default function DebriefPage({ params }: { params: { code: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Debrief</h1>
        <p className="text-gray-500">Session: {params.code.toUpperCase()}</p>
        <p className="text-gray-400 mt-4">Scores, decision chain, and Nova analysis coming in the next plan.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/play/ src/app/debrief/
git commit -m "feat: add placeholder pages for play and debrief views"
```

---

### Task 20: Verify Full Flow

- [ ] **Step 1: Start dev server and verify all routes**

Run: `npm run dev`

Verify these routes load without errors:
- `http://localhost:3000` — Student join form
- `http://localhost:3000/instructor/login` — Login form
- `http://localhost:3000/spectate/TEST01` — Spectator page (shows "Session not found")

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: No type errors.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: verify full foundation flow compiles cleanly"
```

---

## Future Plans (Pending Scenario Data)

These will be separate implementation plans:

1. **Simulation Engine Plan** — Scenario data models, round options, consequence engine, KPI computation
2. **Game View Plan** — Data dashboard (6 Chart.js tabs), voting panel, vote→decision pipeline
3. **Nova AI Plan** — `/api/nova` route, Anthropic integration, Socratic prompt, query limiting
4. **Debrief Plan** — Scoring, decision chain visualization, Nova post-game analysis, class patterns
