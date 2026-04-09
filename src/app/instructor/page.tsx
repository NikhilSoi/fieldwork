'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { DECISIONS, ROUND_ORDER } from '@/lib/decisions';
import LiveLeaderboard from '@/components/instructor/LiveLeaderboard';
import DecisionComparison from '@/components/instructor/DecisionComparison';
import ActivityFeed from '@/components/instructor/ActivityFeed';
import BroadcastBar from '@/components/instructor/BroadcastBar';

const TEAM_NAMES = ['The Pivots', 'Data Drivers', 'Growth Lab', 'Signal & Noise', 'The Catalysts', 'Deep Dive', 'Market Makers', 'The Validators'];
const TEAM_COLORS = ['#378ADD', '#1D9E75', '#D85A30', '#7F77DD', '#EC4899', '#F59E0B', '#06B6D4', '#84CC16'];

const SCENARIOS = {
  dtc: { name: 'Lum\u00e9', type: 'Direct-to-Consumer', desc: 'Premium skincare, 8mo post-launch', color: '#3A9E82' },
  saas: { name: 'Flowdesk', type: 'SaaS & Product Growth', desc: 'Productivity tool, 14mo live', color: '#14B8A6' },
  market: { name: 'Stackd', type: 'Marketplace Economics', desc: 'Freelance services, 10mo live', color: '#D85A30' },
  media: { name: 'The Brief', type: 'Media & Monetisation', desc: 'B2B marketing newsletter, 18mo', color: '#7F77DD' },
  ecom: { name: 'Spark', type: 'Future of E-commerce', desc: 'TikTok-native beauty, 2yr old', color: '#E5527D' },
} as const;

const ROUND_LABELS = ['Budget', 'Diagnose', 'RFM'];

type ScenarioKey = keyof typeof SCENARIOS;
type Phase = 'setup' | 'lobby' | 'dashboard';

interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
  round_idx: number;
  members: { id: string; name: string }[];
}

interface FeedEvent {
  type: string;
  team: string;
  message: string;
  time: Date;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function InstructorPage() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [loading, setLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Setup state
  const [instructorName, setInstructorName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [scenario, setScenario] = useState<ScenarioKey>('dtc');
  const [activeRounds, setActiveRounds] = useState<number[]>([0, 1, 2]);
  const [numTeams, setNumTeams] = useState(4);
  const [membersPerTeam, setMembersPerTeam] = useState(4);
  const [roundDuration, setRoundDuration] = useState<number | null>(null);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState('');
  const [sessionCreated, setSessionCreated] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sessionStatus, setSessionStatus] = useState('lobby');

  // Dashboard state
  const [decisions, setDecisions] = useState<any[]>([]);
  const [events, setEvents] = useState<FeedEvent[]>([]);

  const fetchTeamsWithMembers = useCallback(async (sessId: string) => {
    const { data: teamsData } = await supabase
      .from('teams')
      .select('id, name, color, score, round_idx')
      .eq('session_id', sessId)
      .order('created_at');

    if (!teamsData) return;

    const teamsWithMembers: Team[] = [];
    for (const t of teamsData) {
      const { data: membersData } = await supabase
        .from('members')
        .select('id, name')
        .eq('team_id', t.id)
        .order('created_at');
      teamsWithMembers.push({
        ...t,
        score: t.score ?? 0,
        round_idx: t.round_idx ?? 0,
        members: membersData || [],
      });
    }
    setTeams(teamsWithMembers);
  }, []);

  const fetchDecisions = useCallback(async (sessId: string) => {
    const { data } = await supabase
      .from('decisions')
      .select('*')
      .eq('session_id', sessId)
      .order('created_at');

    if (data) setDecisions(data);
  }, []);

  // Real-time subscription for lobby
  useEffect(() => {
    if (phase !== 'lobby' || !sessionId) return;

    fetchTeamsWithMembers(sessionId);

    const channel = supabase
      .channel(`instructor-lobby-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        () => {
          fetchTeamsWithMembers(sessionId);
          setEvents((prev) => [
            ...prev,
            { type: 'join', team: '', message: 'A student joined the session', time: new Date() },
          ]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [phase, sessionId, fetchTeamsWithMembers]);

  // Real-time subscription for dashboard
  useEffect(() => {
    if (phase !== 'dashboard' || !sessionId) return;

    fetchTeamsWithMembers(sessionId);
    fetchDecisions(sessionId);

    const channel = supabase
      .channel(`instructor-dashboard-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'decisions' },
        () => { fetchDecisions(sessionId); fetchTeamsWithMembers(sessionId); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => { fetchDecisions(sessionId); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        () => { fetchTeamsWithMembers(sessionId); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        () => { fetchTeamsWithMembers(sessionId); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sessionId, fetchTeamsWithMembers, fetchDecisions]);

  const toggleRound = (idx: number) => {
    setActiveRounds((prev) =>
      prev.includes(idx) ? prev.filter((r) => r !== idx) : [...prev, idx].sort()
    );
  };

  const handleCreateSession = async () => {
    if (!instructorName.trim() || !courseName.trim()) return;
    setLoading(true);

    const code = generateCode();

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        code,
        scenario,
        active_rounds: activeRounds,
        team_size: membersPerTeam,
        status: 'lobby',
        instructor_name: instructorName.trim(),
        course_name: courseName.trim(),
        round_duration_minutes: roundDuration,
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      console.error('Failed to create session:', sessionError);
      setLoading(false);
      return;
    }

    const teamsToInsert = TEAM_NAMES.slice(0, numTeams).map((name, i) => ({
      session_id: session.id,
      name,
      color: TEAM_COLORS[i],
      score: 0,
      round_idx: 0,
    }));

    await supabase.from('teams').insert(teamsToInsert);

    setSessionId(session.id);
    setSessionCode(code);
    setSessionCreated(true);
    setLoading(false);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(sessionCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Fallback: silently fail
    }
  };

  const handleOpenDashboard = () => {
    setPhase('lobby');
  };

  const handleStartSimulation = async () => {
    if (!sessionId) return;
    setLoading(true);

    await supabase
      .from('sessions')
      .update({ status: 'active' })
      .eq('id', sessionId);

    setSessionStatus('active');
    setPhase('dashboard');
    setLoading(false);
  };

  // Derived values
  const currentRoundIdx = teams.length > 0
    ? Math.max(...teams.map((t) => t.round_idx ?? 0))
    : 0;
  const currentRoundKey = ROUND_ORDER[currentRoundIdx] || ROUND_ORDER[0];
  const scenarioDecisions = DECISIONS[scenario];
  const currentRoundQuestions = scenarioDecisions?.[currentRoundKey]?.questions || [];
  const scenarioInfo = SCENARIOS[scenario];
  const allTeamsHaveMembers = teams.length > 0 && teams.every((t) => t.members.length > 0);

  // ===== PHASE 1: SETUP =====
  if (phase === 'setup') {
    return (
      <main
        className="min-h-screen text-white flex"
        style={{ background: 'linear-gradient(135deg, #0B1F35 0%, #0d2a45 100%)' }}
        role="main"
        aria-label="Instructor session setup"
      >
        {/* Left Panel */}
        <section className="w-full lg:w-1/2 px-6 py-10 lg:px-16 lg:py-14 overflow-y-auto">
          <div className="max-w-lg mx-auto animate-fade-in">
            <Link
              href="/"
              className="text-white/60 hover:text-white text-sm mb-8 inline-flex items-center gap-1.5 transition-colors"
              aria-label="Back to home"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </Link>

            <h1 className="font-display text-3xl font-bold mb-1.5">New session</h1>
            <p className="text-white/40 text-sm mb-10">Configure your Fieldwork simulation</p>

            <div className="space-y-6">
              {/* Instructor Name */}
              <div>
                <label htmlFor="instructor-name" className="text-sm text-white/60 mb-1.5 block">
                  Instructor name
                </label>
                <input
                  id="instructor-name"
                  type="text"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  placeholder="Prof. Smith"
                  aria-required="true"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>

              {/* Course Name */}
              <div>
                <label htmlFor="course-name" className="text-sm text-white/60 mb-1.5 block">
                  Course name
                </label>
                <input
                  id="course-name"
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Marketing Analytics 301"
                  aria-required="true"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>

              {/* Scenario Selector */}
              <fieldset>
                <legend className="text-sm text-white/60 mb-3 block">Scenario</legend>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Select scenario">
                  {(Object.entries(SCENARIOS) as [ScenarioKey, typeof SCENARIOS[ScenarioKey]][]).map(([key, s]) => {
                    const isSelected = scenario === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${s.name} - ${s.type}`}
                        onClick={() => setScenario(key)}
                        className={`relative text-left rounded-xl p-4 transition-colors ${
                          isSelected
                            ? 'border border-[#3A9E82] bg-[#3A9E82]/10'
                            : 'border border-white/[0.08] hover:border-[#3A9E82]/50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="8" r="8" fill="#3A9E82" />
                              <path d="M5 8L7 10L11 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                        <p className="font-semibold text-sm text-white mb-1">{s.name}</p>
                        <span
                          className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium inline-block mb-1.5"
                          style={{ backgroundColor: `${s.color}20`, color: s.color }}
                        >
                          {s.type}
                        </span>
                        <p className="text-xs text-white/40">{s.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Round Toggles */}
              <fieldset>
                <legend className="text-sm text-white/60 mb-3 block">Rounds</legend>
                <div className="flex gap-2" role="group" aria-label="Select active rounds">
                  {ROUND_LABELS.map((label, idx) => {
                    const isActive = activeRounds.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleRound(idx)}
                        aria-pressed={isActive}
                        className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#3A9E82]/10 border-[#3A9E82] text-[#3A9E82]'
                            : 'border-white/[0.08] text-white/40 hover:border-[#3A9E82]/50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Number of Teams */}
              <fieldset>
                <legend className="text-sm text-white/60 mb-3 block">Number of teams</legend>
                <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Number of teams">
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => {
                    const isActive = numTeams === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setNumTeams(n)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors min-w-[44px] ${
                          isActive
                            ? 'bg-[#3A9E82]/10 border-[#3A9E82] text-[#3A9E82]'
                            : 'border-white/[0.08] text-white/40 hover:border-[#3A9E82]/50'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Members per Team */}
              <fieldset>
                <legend className="text-sm text-white/60 mb-3 block">Members per team</legend>
                <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Members per team">
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => {
                    const isActive = membersPerTeam === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setMembersPerTeam(n)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors min-w-[44px] ${
                          isActive
                            ? 'bg-[#3A9E82]/10 border-[#3A9E82] text-[#3A9E82]'
                            : 'border-white/[0.08] text-white/40 hover:border-[#3A9E82]/50'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Time per Round */}
              <fieldset>
                <legend className="text-sm text-white/60 mb-3 block">Time per round</legend>
                <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Time per round">
                  {([null, 10, 15, 20, 30] as (number | null)[]).map((mins) => {
                    const isActive = roundDuration === mins;
                    const label = mins === null ? 'No timer' : `${mins} min`;
                    return (
                      <button
                        key={String(mins)}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setRoundDuration(mins)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#3A9E82]/10 border-[#3A9E82] text-[#3A9E82]'
                            : 'border-white/[0.08] text-white/40 hover:border-[#3A9E82]/50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* CTA */}
              <button
                onClick={handleCreateSession}
                disabled={loading || !instructorName.trim() || !courseName.trim() || activeRounds.length === 0}
                aria-label="Generate session"
                className="disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold w-full py-3.5 rounded-xl transition-colors text-sm mt-2 hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #3A9E82, #2D8A6E)', boxShadow: '0 4px 16px rgba(58,158,130,0.3)' }}
              >
                {loading ? 'Generating...' : 'Generate session \u2192'}
              </button>
            </div>
          </div>
        </section>

        {/* Right Panel */}
        <aside
          className="hidden lg:flex w-1/2 border-l border-white/[0.08] items-center justify-center relative overflow-hidden"
          aria-label="Session preview panel"
        >
          {!sessionCreated ? (
            /* Placeholder grid background */
            <div className="flex flex-col items-center justify-center w-full h-full relative">
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
                aria-hidden="true"
              />
              <p className="text-white/40 text-sm font-medium relative z-10">Session preview</p>
            </div>
          ) : (
            /* Session created preview */
            <div className="flex flex-col items-center justify-center gap-8 animate-fade-in-scale px-10">
              {/* Session Code */}
              <div className="text-center">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Session code</p>
                <p className="font-mono-data text-5xl tracking-[0.3em] text-[#3A9E82] font-bold">
                  {sessionCode}
                </p>
              </div>

              {/* QR Placeholder + Copy */}
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  aria-label="QR code placeholder"
                >
                  <span className="text-white/40 text-xs font-medium">QR</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  aria-label="Copy session code"
                  className="rounded-lg border border-white/[0.08] hover:border-[#3A9E82]/50 px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  {codeCopied ? 'Copied!' : 'Copy code'}
                </button>
              </div>

              {/* Team Preview */}
              <div className="flex items-center gap-3" aria-label="Team preview">
                {TEAM_NAMES.slice(0, numTeams).map((name, i) => (
                  <div key={name} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{ backgroundColor: `${TEAM_COLORS[i]}33`, color: TEAM_COLORS[i] }}
                      aria-hidden="true"
                    >
                      {name[0]}
                    </div>
                    <span className="text-[10px] text-white/40 max-w-[60px] truncate">{name}</span>
                  </div>
                ))}
              </div>

              {/* Open Dashboard Link */}
              <button
                onClick={handleOpenDashboard}
                className="text-[#3A9E82] hover:text-[#2D8A6E] text-sm font-medium transition-colors"
                aria-label="Open dashboard"
              >
                Open dashboard &rarr;
              </button>
            </div>
          )}
        </aside>

        {/* Mobile: after session created, show a bottom sheet */}
        {sessionCreated && (
          <div
            className="lg:hidden fixed inset-x-0 bottom-0 p-6 animate-fade-in z-50"
            style={{ background: 'rgba(11,31,53,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-center text-white/40 text-xs uppercase tracking-widest mb-2">Session code</p>
            <p className="font-mono-data text-3xl tracking-[0.3em] text-[#3A9E82] font-bold text-center mb-4">
              {sessionCode}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCopyCode}
                className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm text-white/60 hover:text-white transition-colors"
                aria-label="Copy session code"
              >
                {codeCopied ? 'Copied!' : 'Copy code'}
              </button>
              <button
                onClick={handleOpenDashboard}
                className="flex-1 rounded-xl py-2.5 text-sm text-white font-semibold transition-colors hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #3A9E82, #2D8A6E)', boxShadow: '0 4px 16px rgba(58,158,130,0.3)' }}
                aria-label="Open dashboard"
              >
                Open dashboard &rarr;
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  // ===== PHASE 2: LOBBY =====
  if (phase === 'lobby') {
    return (
      <main
        className="min-h-screen text-white flex flex-col"
        style={{ background: 'linear-gradient(135deg, #0B1F35 0%, #0d2a45 100%)' }}
        role="main"
        aria-label="Session lobby"
      >
        {/* Top Bar */}
        <header
          className="px-6 py-4"
          style={{ background: 'rgba(11,31,53,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="font-mono-data text-xl tracking-[0.2em] text-[#3A9E82] font-bold">
                {sessionCode}
              </p>
              <span
                className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: `${scenarioInfo.color}20`, color: scenarioInfo.color }}
              >
                {scenarioInfo.type}
              </span>
            </div>
            <div className="flex items-center gap-5">
              <span className="text-sm text-white/60">
                {instructorName} &middot; {courseName}
              </span>
              <div className="flex items-center gap-1.5" aria-label="Session is live">
                <span className="w-2 h-2 rounded-full bg-[#3A9E82] animate-pulse" aria-hidden="true" />
                <span className="text-xs text-[#3A9E82] font-medium">Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Team Cards */}
        <section className="flex-1 px-6 py-10" aria-label="Teams">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {teams.map((team) => {
                const hasMembers = team.members.length > 0;
                const maxSlots = membersPerTeam;
                const emptySlots = Math.max(0, maxSlots - team.members.length);

                return (
                  <article
                    key={team.id}
                    className="rounded-2xl p-5 relative overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px' }}
                    aria-label={`Team ${team.name}`}
                  >
                    {/* Colored left border */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[3px]"
                      style={{ backgroundColor: team.color }}
                      aria-hidden="true"
                    />

                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm text-white">{team.name}</h3>
                      {hasMembers ? (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#3A9E82]/15 text-[#3A9E82] font-medium">
                          Ready
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] text-white/40 font-medium">
                          Waiting
                        </span>
                      )}
                    </div>

                    {/* Member Avatars */}
                    <div className="flex items-center gap-2 mb-3">
                      {team.members.map((m) => (
                        <div
                          key={m.id}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                          style={{ backgroundColor: `${team.color}33`, color: team.color }}
                          title={m.name}
                          aria-label={m.name}
                        >
                          {m.name[0]?.toUpperCase()}
                        </div>
                      ))}
                      {/* Empty slots */}
                      {Array.from({ length: emptySlots }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="w-8 h-8 rounded-full border-2 border-dashed border-white/[0.08]"
                          aria-hidden="true"
                        />
                      ))}
                    </div>

                    <p className="text-xs text-white/40">
                      {team.members.length} / {maxSlots} joined
                    </p>
                  </article>
                );
              })}
            </div>

            {/* Start Button */}
            <div className="flex justify-center">
              <button
                onClick={handleStartSimulation}
                disabled={loading || !allTeamsHaveMembers}
                aria-label="Start simulation"
                className={`rounded-xl font-semibold px-12 py-3.5 text-sm transition-colors ${
                  allTeamsHaveMembers
                    ? 'text-white hover:brightness-110'
                    : 'border border-white/[0.08] text-white/40 cursor-not-allowed'
                }`}
                style={allTeamsHaveMembers ? { background: 'linear-gradient(135deg, #3A9E82, #2D8A6E)', boxShadow: '0 4px 16px rgba(58,158,130,0.3)' } : { background: 'rgba(255,255,255,0.04)' }}
              >
                {loading ? 'Starting...' : 'Start simulation \u2192'}
              </button>
            </div>
            {!allTeamsHaveMembers && (
              <p className="text-center text-xs text-white/40 mt-3">
                Waiting for at least 1 member per team
              </p>
            )}
          </div>
        </section>
      </main>
    );
  }

  // ===== PHASE 3: DASHBOARD =====
  return (
    <main
      className="min-h-screen text-white flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0B1F35 0%, #0d2a45 100%)' }}
      role="main"
      aria-label="Instructor dashboard"
    >
      {/* Top Bar */}
      <header
        className="px-6 py-4"
        style={{ background: 'rgba(11,31,53,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-bold text-white">Instructor Dashboard</h1>
            <p className="text-white/40 text-xs mt-0.5">
              <span className="font-mono-data text-white/60">{sessionCode}</span>
              {' '}&middot; {scenarioInfo.name} ({scenarioInfo.type})
              {' '}&middot; {instructorName}
            </p>
          </div>
          <Link
            href={`/debrief/${sessionCode}`}
            className="rounded-xl border border-white/[0.08] hover:border-[#E53E3E]/50 text-white/60 hover:text-[#E53E3E] px-5 py-2 text-sm font-medium transition-colors"
            aria-label="End session and go to debrief"
          >
            End &amp; Debrief &rarr;
          </Link>
        </div>
      </header>

      {/* 3-Column Grid */}
      <section className="flex-1 px-6 py-6 overflow-y-auto" aria-label="Dashboard panels">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <LiveLeaderboard teams={teams} decisions={decisions} />
            <DecisionComparison
              teams={teams}
              decisions={decisions}
              round={currentRoundKey}
              questions={currentRoundQuestions as any}
            />
            <ActivityFeed events={events} />
          </div>
        </div>
      </section>

      {/* Broadcast Bar */}
      {sessionId && (
        <footer
          className="border-t border-white/[0.06]"
          aria-label="Broadcast controls"
        >
          <div className="max-w-7xl mx-auto">
            <BroadcastBar sessionId={sessionId} />
          </div>
        </footer>
      )}
    </main>
  );
}
