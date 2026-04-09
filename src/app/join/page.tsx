'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const SCENARIO_LABELS: Record<string, string> = {
  dtc: 'Direct-to-Consumer',
  saas: 'SaaS & Product Growth',
  market: 'Marketplace Economics',
  media: 'Media & Monetisation',
  ecom: 'Future of E-commerce',
};

const SCENARIO_COLORS: Record<string, string> = {
  dtc: '#D85A30',
  saas: '#378ADD',
  market: '#3A9E82',
  media: '#D97706',
  ecom: '#E5527D',
};

interface SessionInfo {
  id: string;
  code: string;
  scenario: string;
  instructor_name: string | null;
  course_name: string | null;
  team_size: number;
}

interface MemberInfo {
  name: string;
}

interface TeamInfo {
  id: string;
  name: string;
  color: string;
  memberCount: number;
  members: MemberInfo[];
}

const STEP_LABELS = ['Code', 'Details', 'Team'] as const;

function ProgressBar({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10" aria-label="Progress">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[#3A9E82] text-white'
                    : isCurrent
                    ? 'text-white shadow-md'
                    : 'border-2 border-white/[0.08] text-white/40'
                }`}
                style={
                  isCurrent
                    ? {
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }
                    : undefined
                }
              >
                {isCompleted ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs mt-2 transition-colors ${
                  isCompleted
                    ? 'text-[#3A9E82]'
                    : isCurrent
                    ? 'text-white font-medium'
                    : 'text-white/40'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`w-16 h-[2px] mx-2 mb-5 transition-colors duration-300 ${
                  stepNum < currentStep ? 'bg-[#3A9E82]' : 'bg-white/[0.08]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const handleValidateCode = async () => {
    if (code.trim().length !== 6) {
      setError('Code must be 6 characters');
      return;
    }
    setLoading(true);
    setError('');

    const upperCode = code.trim().toUpperCase();

    const { data: sessionData } = await supabase
      .from('sessions')
      .select('id, code, scenario, instructor_name, course_name, team_size')
      .eq('code', upperCode)
      .single();

    if (!sessionData) {
      setError('Session not found. Check your code and try again.');
      setLoading(false);
      return;
    }

    setSession(sessionData);
    setStep(2);
    setLoading(false);
  };

  const handleContinueToTeams = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!session) return;

    setLoading(true);
    setError('');

    // 2 parallel queries instead of N+1 sequential
    const [teamsRes, membersRes] = await Promise.all([
      supabase.from('teams').select('id, name, color').eq('session_id', session.id).order('created_at'),
      supabase.from('members').select('team_id, name').eq('session_id', session.id),
    ]);

    const teamsData = teamsRes.data;
    if (!teamsData || teamsData.length === 0) {
      setError('No teams found for this session.');
      setLoading(false);
      return;
    }

    const membersByTeam: Record<string, MemberInfo[]> = {};
    for (const m of membersRes.data ?? []) {
      if (!membersByTeam[m.team_id]) membersByTeam[m.team_id] = [];
      membersByTeam[m.team_id].push({ name: m.name });
    }

    setTeams(teamsData.map((t) => ({
      ...t,
      memberCount: membersByTeam[t.id]?.length ?? 0,
      members: membersByTeam[t.id] ?? [],
    })));
    setStep(3);
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!name.trim() || !session || !selectedTeamId) return;
    setLoading(true);
    setError('');

    const { error: insertError } = await supabase
      .from('members')
      .insert({
        team_id: selectedTeamId,
        session_id: session.id,
        name: name.trim(),
      });

    if (insertError) {
      console.error('Join insert error:', insertError);
      setError(`Failed to join: ${insertError.message || 'Unknown error'}. Please try again.`);
      setLoading(false);
      return;
    }

    // Fetch actual member index AFTER insert to avoid stale data
    const { data: currentMembers } = await supabase
      .from('members')
      .select('name')
      .eq('team_id', selectedTeamId)
      .order('created_at');

    const memberIdx = currentMembers
      ? currentMembers.findIndex((m) => m.name === name.trim())
      : 0;

    router.push(`/session/${session.code}?team=${selectedTeamId}&member=${memberIdx >= 0 ? memberIdx : 0}`);
  };

  const scenarioLabel = session
    ? SCENARIO_LABELS[session.scenario] ?? session.scenario
    : '';
  const scenarioColor = session
    ? SCENARIO_COLORS[session.scenario] ?? '#3A9E82'
    : '#3A9E82';
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: 'linear-gradient(135deg, #0B1F35 0%, #0d2a45 100%)' }}
    >
      <div className="w-full max-w-lg animate-fade-in">
        <ProgressBar currentStep={step} />

        {/* Step 1 — Enter Code */}
        {step === 1 && (
          <section className="animate-fade-in-scale">
            <Link
              href="/"
              className="text-white/60 hover:text-white text-sm mb-6 inline-flex items-center gap-1.5 transition-colors"
              aria-label="Back to home"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </Link>

            <h1 className="font-display text-3xl font-bold text-white mb-2">
              Join a session
            </h1>
            <p className="text-white/60 text-sm mb-8">
              Enter the 6-digit code from your instructor
            </p>

            {error && (
              <div role="alert" className="rounded-2xl bg-[#E53E3E]/10 border border-[#E53E3E]/20 text-[#E53E3E] text-sm px-4 py-3 mb-5">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="session-code" className="block text-sm text-white/60 mb-1.5">
                  Session Code
                </label>
                <input
                  id="session-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="ABC123"
                  maxLength={6}
                  aria-label="6-digit session code"
                  className="w-full font-mono-data text-3xl tracking-[0.4em] text-center rounded-2xl px-6 py-5 text-white placeholder-white/30 focus:outline-none focus:border-[#3A9E82] focus:ring-1 focus:ring-[#3A9E82]/30 transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleValidateCode();
                  }}
                />
              </div>
              <button
                onClick={handleValidateCode}
                disabled={loading || code.trim().length !== 6}
                className="w-full rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 text-sm transition-all hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #3A9E82, #2D8A6E)',
                  boxShadow: '0 4px 16px rgba(58,158,130,0.3)',
                }}
              >
                {loading ? 'Checking...' : 'Continue \u2192'}
              </button>
            </div>
          </section>
        )}

        {/* Step 2 — Your Details */}
        {step === 2 && session && (
          <section className="animate-fade-in-scale">
            {/* Session info card */}
            <div
              className="rounded-2xl p-4 mb-8"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-white/[0.08]"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: scenarioColor }} />
                    <span style={{ color: scenarioColor }}>{scenarioLabel}</span>
                  </span>
                  {session.instructor_name && (
                    <span className="text-xs text-white/60">{session.instructor_name}</span>
                  )}
                  {session.course_name && (
                    <span className="text-xs text-white/40">{session.course_name}</span>
                  )}
                </div>
                <button
                  onClick={() => { setStep(1); setError(''); setSelectedTeamId(null); }}
                  className="text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  Change
                </button>
              </div>
              <div className="font-mono-data text-sm text-white">{session.code}</div>
            </div>

            {error && (
              <div role="alert" className="rounded-2xl bg-[#E53E3E]/10 border border-[#E53E3E]/20 text-[#E53E3E] text-sm px-4 py-3 mb-5">
                {error}
              </div>
            )}

            <h1 className="font-display text-3xl font-bold text-white mb-2">
              What&apos;s your name?
            </h1>
            <p className="text-white/60 text-sm mb-8">
              This is how your team will see you
            </p>

            <div className="space-y-5">
              <div>
                <label htmlFor="student-name" className="block text-sm text-white/60 mb-1.5">
                  Your Name
                </label>
                <input
                  id="student-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  aria-label="Your name"
                  className="w-full rounded-2xl px-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#3A9E82] focus:ring-1 focus:ring-[#3A9E82]/30 transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleContinueToTeams();
                  }}
                />
              </div>
              <button
                onClick={handleContinueToTeams}
                disabled={loading || !name.trim()}
                className="w-full rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 text-sm transition-all hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #3A9E82, #2D8A6E)',
                  boxShadow: '0 4px 16px rgba(58,158,130,0.3)',
                }}
              >
                {loading ? 'Loading teams...' : 'Continue \u2192'}
              </button>
            </div>
          </section>
        )}

        {/* Step 3 — Pick Your Team */}
        {step === 3 && session && (
          <section className="animate-fade-in-scale">
            <h1 className="font-display text-3xl font-bold text-white mb-2">
              Choose your team
            </h1>
            <p className="text-white/60 text-sm mb-8">
              Pick a team to join for this session
            </p>

            {error && (
              <div role="alert" className="rounded-2xl bg-[#E53E3E]/10 border border-[#E53E3E]/20 text-[#E53E3E] text-sm px-4 py-3 mb-5">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-6">
              {teams.map((t) => {
                const maxSize = session.team_size ?? 4;
                const isFull = t.memberCount >= maxSize;
                const isSelected = selectedTeamId === t.id;
                const slotsRemaining = maxSize - t.memberCount;

                return (
                  <button
                    key={t.id}
                    onClick={() => !isFull && setSelectedTeamId(t.id)}
                    disabled={isFull}
                    aria-label={`${t.name}${isFull ? ', full' : ''}`}
                    className={`relative rounded-2xl text-left p-4 transition-all duration-200 ${
                      isFull
                        ? 'opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'ring-1 ring-[#3A9E82]'
                        : 'hover:ring-1 hover:ring-[#3A9E82]/40'
                    }`}
                    style={{
                      background: isSelected
                        ? 'rgba(58,158,130,0.15)'
                        : 'rgba(255,255,255,0.04)',
                      border: isSelected
                        ? '1px solid rgba(58,158,130,0.4)'
                        : '1px solid rgba(255,255,255,0.08)',
                      borderLeftWidth: '3px',
                      borderLeftColor: isFull ? 'rgba(255,255,255,0.08)' : t.color,
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-white truncate">{t.name}</span>
                      {isFull && (
                        <span className="text-[10px] font-semibold text-[#E53E3E] uppercase tracking-wider">
                          Full
                        </span>
                      )}
                    </div>

                    {/* Member avatars */}
                    <div className="flex items-center gap-1 mb-2.5 flex-wrap">
                      {t.members.map((m, mi) => (
                        <div
                          key={mi}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                          style={{ backgroundColor: `${t.color}20`, color: t.color }}
                          title={m.name}
                        >
                          {getInitials(m.name)}
                        </div>
                      ))}
                      {Array.from({ length: slotsRemaining > 0 ? slotsRemaining : 0 }).map((_, si) => (
                        <div key={`empty-${si}`} className="w-7 h-7 rounded-full border-2 border-dashed border-white/[0.08] shrink-0" />
                      ))}
                    </div>

                    <div className="text-xs text-white/40">
                      {t.memberCount} / {maxSize} members
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Join CTA */}
            <button
              onClick={handleJoin}
              disabled={loading || !selectedTeamId}
              className={`w-full rounded-2xl font-semibold py-3.5 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                selectedTeamId
                  ? 'text-white hover:-translate-y-0.5'
                  : 'text-white/40 cursor-not-allowed'
              }`}
              style={
                selectedTeamId
                  ? {
                      background: 'linear-gradient(135deg, #3A9E82, #2D8A6E)',
                      boxShadow: '0 4px 16px rgba(58,158,130,0.3)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }
              }
            >
              {loading
                ? 'Joining...'
                : selectedTeam
                ? `Join ${selectedTeam.name} \u2192`
                : 'Select a team'}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
