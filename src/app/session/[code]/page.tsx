'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SCENARIOS } from '@/lib/scenarios';
import { DECISIONS, ROUND_ORDER } from '@/lib/decisions';
import { computeCumulativeKPIs } from '@/lib/consequences';
import { applyDeltasToTabData } from '@/lib/kpi-engine';
import { PRIMARY_SIGNALS } from '@/lib/primary-signals';
import DataDashboard from '@/components/sim/DataDashboard';
import TeamPanel from '@/components/sim/TeamPanel';
import NovaChat from '@/components/sim/NovaChat';
import RoundNav from '@/components/sim/RoundNav';
import RoundTimer from '@/components/sim/RoundTimer';
import type { RoundKey } from '@/lib/decisions';

/* ── Display name → scenario key map ── */
const SCENARIO_KEY_MAP: Record<string, string> = {
  'DTC Skincare': 'dtc',
  'B2C SaaS': 'saas',
  'Two-sided Marketplace': 'market',
  'Newsletter Media': 'media',
  'Direct-to-Consumer': 'dtc',
  'SaaS & Product Growth': 'saas',
  'Marketplace Economics': 'market',
  'Media & Monetisation': 'media',
  'Future of E-commerce': 'ecom',
};

function buildTabData(tabs: Record<string, any>) {
  return {
    'P&L': tabs.pl,
    'Funnel': tabs.funnel,
    'Channels': tabs.channels,
    'Cohorts': tabs.cohorts,
    'RFM': tabs.rfm,
    'Benchmarks': tabs.benchmarks,
  };
}

interface Session {
  id: string;
  code: string;
  scenario: string;
  active_rounds: number[];
  status: string;
  team_size: number;
  round_duration_minutes: number | null;
}

interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
  round_idx: number;
}

interface Member {
  id: string;
  name: string;
}

type RoundResult = 'completed' | 'good' | 'bad' | null;
type VoteMap = Record<string, number>;

export default function SessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const teamId = searchParams.get('team');
  const memberIdx = Number(searchParams.get('member') ?? 0);

  /* ── Core state ── */
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  /* ── Round & decision state ── */
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([null, null, null]);
  const [votes, setVotes] = useState<VoteMap>({});
  const [pastDecisions, setPastDecisions] = useState<any[]>([]);

  /* ── UI state ── */
  const [activeTabName, setActiveTabName] = useState('P&L');
  const [activeMemberIdx, setActiveMemberIdx] = useState(memberIdx);

  const initialLoadDone = useRef(false);

  /* ── Derived scenario data ── */
  const scenarioKey = session ? (SCENARIO_KEY_MAP[session.scenario] ?? session.scenario) : '';
  const scenario = scenarioKey ? SCENARIOS[scenarioKey] : null;
  const decisionData = scenarioKey ? DECISIONS[scenarioKey] : null;

  const activeRoundOrder = session
    ? ROUND_ORDER.filter((_, idx) => session.active_rounds.includes(idx))
    : ROUND_ORDER;
  const activeRoundLabels = activeRoundOrder.map(
    (k) => k.charAt(0).toUpperCase() + k.slice(1)
  );

  const roundKey = activeRoundOrder[currentRoundIdx] ?? 'budget';
  const currentRound = decisionData?.[roundKey as keyof typeof decisionData] ?? null;
  const baseTabData = scenario ? buildTabData(scenario.tabs) : undefined;

  /* ── Compute cumulative KPI state from completed rounds ── */
  const completedRounds = pastDecisions
    .filter((d: any) => d.round && d.final_votes)
    .map((d: any) => ({ round: d.round as RoundKey, finalVotes: d.final_votes }));

  const currentKPIs = scenarioKey ? computeCumulativeKPIs(scenarioKey, completedRounds) : {};

  const prevRounds = completedRounds.slice(0, -1);
  const previousKPIs = prevRounds.length > 0 && scenarioKey
    ? computeCumulativeKPIs(scenarioKey, prevRounds)
    : null;

  /* Apply deltas to base tab data */
  const adjustedTabData = scenario && completedRounds.length > 0
    ? buildTabData(applyDeltasToTabData(scenarioKey, scenario.tabs, currentKPIs, previousKPIs))
    : baseTabData;

  /* Primary signal for current round */
  const primarySignal = scenarioKey ? PRIMARY_SIGNALS[scenarioKey]?.[roundKey] ?? null : null;

  /* Prepend previous consequence to round brief (Round 2+) */
  const modifiedBrief = (() => {
    if (currentRoundIdx === 0 || !currentRound) return currentRound?.brief ?? '';

    const prevRoundKey = activeRoundOrder[currentRoundIdx - 1];
    const prevDecision = pastDecisions.find((d: any) => d.round === prevRoundKey);
    if (!prevDecision || !decisionData) return currentRound.brief;

    const prevRoundData = decisionData[prevRoundKey as keyof typeof decisionData];
    if (!prevRoundData) return currentRound.brief;

    const q1ChosenIdx = prevDecision.final_votes?.[0] ?? 0;
    const q1Consequence = prevRoundData.questions[0]?.options[q1ChosenIdx]?.consequence;
    if (!q1Consequence) return currentRound.brief;

    return `${q1Consequence.title}. ${currentRound.brief}`;
  })();

  /* ── Fetch session data ── */
  const fetchSessionData = useCallback(async () => {
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('id, code, scenario, active_rounds, status, team_size, round_duration_minutes')
      .eq('code', code)
      .single();

    if (!sessionData) {
      setLoading(false);
      return;
    }
    setSession(sessionData);

    // Fetch teams, members, decisions, and votes ALL in parallel
    const resolvedKey = ROUND_ORDER[currentRoundIdx] ?? 'budget';
    const [teamsRes, membersRes, decisionsRes, votesRes] = await Promise.all([
      supabase
        .from('teams')
        .select('id, name, color, score, round_idx')
        .eq('session_id', sessionData.id)
        .order('created_at'),
      teamId
        ? supabase.from('members').select('id, name').eq('team_id', teamId).order('created_at')
        : Promise.resolve({ data: null }),
      supabase
        .from('decisions')
        .select('*')
        .eq('session_id', sessionData.id)
        .eq('team_id', teamId ?? '')
        .order('created_at'),
      teamId
        ? supabase.from('votes').select('question_idx, member_idx, option_idx').eq('team_id', teamId).eq('session_id', sessionData.id).eq('round', resolvedKey)
        : Promise.resolve({ data: null }),
    ]);

    const teamsData = teamsRes.data;
    if (teamsData && teamId) {
      const myTeam = teamsData.find((t) => t.id === teamId);
      if (myTeam) setTeam(myTeam);
    }

    if (membersRes.data) setMembers(membersRes.data);

    if (votesRes.data) {
      const voteMap: VoteMap = {};
      votesRes.data.forEach((v: any) => {
        voteMap[`${v.question_idx}-${v.member_idx}`] = v.option_idx;
      });
      setVotes(voteMap);
    }

    const decisionsData = decisionsRes.data;

    if (decisionsData) {
      setPastDecisions(decisionsData);

      const localActiveRounds = ROUND_ORDER.filter((_, idx) =>
        (sessionData.active_rounds as number[]).includes(idx)
      );
      const results: RoundResult[] = localActiveRounds.map(() => null);
      let lastCompletedIdx = -1;

      localActiveRounds.forEach((rk, idx) => {
        const dec = decisionsData.find((d: any) => d.round === rk);
        if (dec) {
          results[idx] = dec.result as RoundResult;
          lastCompletedIdx = idx;
        }
      });

      setRoundResults(results);

      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        const allDone = results.every((r) => r !== null);
        if (allDone) {
          setCurrentRoundIdx(localActiveRounds.length - 1);
        } else if (lastCompletedIdx >= 0) {
          const nextUncompleted = results.findIndex((r) => r === null);
          if (nextUncompleted !== -1) {
            setCurrentRoundIdx(nextUncompleted);
          }
        }
      }
    }

    setLoading(false);
  }, [code, teamId, currentRoundIdx]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  /* ── Realtime subscriptions (debounced to avoid cascading refetches) ── */
  useEffect(() => {
    if (!session?.id) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => { fetchSessionData(); }, 300);
    };

    const channel = supabase
      .channel(`session-${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'decisions' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, debouncedFetch)
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [session?.id, teamId, fetchSessionData]);

  /* ── Advance to next round ── */
  const handleAdvanceRound = useCallback(async () => {
    const nextIdx = currentRoundIdx + 1;
    if (nextIdx >= activeRoundOrder.length) return;

    if (teamId) {
      await supabase
        .from('teams')
        .update({ round_idx: nextIdx })
        .eq('id', teamId);
    }

    setCurrentRoundIdx(nextIdx);
    setVotes({});

    await fetchSessionData();
  }, [currentRoundIdx, teamId, fetchSessionData]);

  /* ── Active tab tracking for dataSummary ── */
  const currentTabSummary = (() => {
    if (!scenario) return '';
    const tabKeyMap: Record<string, string> = {
      'P&L': 'pl', 'Funnel': 'funnel', 'Channels': 'channels',
      'Cohorts': 'cohorts', 'RFM': 'rfm', 'Benchmarks': 'benchmarks',
    };
    const key = tabKeyMap[activeTabName] ?? 'pl';
    return scenario.tabs[key]?.dataSummary ?? '';
  })();

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex items-center justify-center">
        <div className="font-display text-lg text-[#718096] animate-pulse">
          Loading simulation...
        </div>
      </div>
    );
  }

  /* ── Not found state ── */
  if (!session) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex items-center justify-center">
        <div className="card p-8 text-center space-y-4">
          <p className="text-[#0B1F35] font-display text-lg">Session not found</p>
          <Link
            href="/"
            className="inline-block text-[#3A9E82] hover:text-[#2D8A6E] text-sm transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-[#0B1F35] animate-fade-in">

      {/* ── Top Bar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/80 backdrop-blur-xl border-b border-[#D1D9D4] flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2.5 min-w-0">
          {team && (
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: team.color }}
            />
          )}
          <span className="font-semibold text-sm truncate text-[#0B1F35]">
            {team?.name || 'Spectator'}
          </span>
          <span className="text-[#718096]">&middot;</span>
          <span className="text-[#4A5568] text-sm truncate">
            {scenario?.name ?? session.scenario}
          </span>
          <span className="bg-[#E8F5F1] text-[#3A9E82] text-xs px-2.5 py-0.5 rounded-full font-medium capitalize flex-shrink-0">
            {activeRoundLabels[currentRoundIdx]}
          </span>
          {session.round_duration_minutes && (
            <RoundTimer
              key={`timer-${currentRoundIdx}`}
              durationMinutes={session.round_duration_minutes}
            />
          )}
        </div>

        <div className="hidden md:block font-mono-data text-xs text-[#718096] tracking-widest">
          {code}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-[#4A5568] hidden sm:inline">
            {members[activeMemberIdx]?.name ?? `Member ${activeMemberIdx + 1}`}
          </span>
          {session.status === 'active' && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3A9E82] animate-pulse-pip" />
              <span className="text-xs text-[#3A9E82]">Live</span>
            </span>
          )}
        </div>
      </header>

      <div className="h-14" />

      {/* ── Main Content ── */}
      <main className="px-4 lg:px-6 py-4 flex flex-col lg:flex-row gap-4" style={{ minHeight: 'calc(100vh - 3.5rem - 3.5rem)' }}>

        {/* Left Column — Data Dashboard */}
        <div className="w-full lg:w-[65%] min-w-0">
          <DataDashboard
            scenario={scenarioKey}
            round={roundKey}
            roundIdx={currentRoundIdx}
            tabData={adjustedTabData}
            onTabChange={(tabKey) => {
              const reverseMap: Record<string, string> = {
                pl: 'P&L', funnel: 'Funnel', channels: 'Channels',
                cohorts: 'Cohorts', rfm: 'RFM', benchmarks: 'Benchmarks',
              };
              setActiveTabName(reverseMap[tabKey] ?? tabKey);
            }}
            pastDecisions={pastDecisions}
            primarySignal={primarySignal}
          />
        </div>

        {/* Right Column — TeamPanel + NovaChat */}
        <div className="w-full lg:w-[35%] flex flex-col gap-4 min-w-0">

          {/* Team Panel */}
          {teamId && currentRound && (
            <div className="card p-4">
              <TeamPanel
                teamId={teamId}
                sessionId={session.id}
                round={roundKey}
                roundIdx={currentRoundIdx}
                totalRounds={activeRoundOrder.length}
                roundLabels={activeRoundLabels}
                members={members}
                teamSize={session.team_size ?? 4}
                activeMemberIdx={activeMemberIdx}
                onMemberSwitch={setActiveMemberIdx}
                questions={currentRound.questions}
                onAdvanceRound={handleAdvanceRound}
                sessionCode={code}
                scenarioKey={scenarioKey}
                roundBrief={modifiedBrief}
              />
            </div>
          )}

          {/* Nova Chat */}
          <div className="card p-4 flex-1 flex flex-col min-h-[320px]">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#D1D9D4]">
              <span className="w-2 h-2 rounded-full bg-[#3A9E82] animate-pulse" />
              <span className="font-semibold text-sm text-[#0B1F35]">Nova</span>
              <span className="text-xs text-[#718096]">AI copilot</span>
            </div>
            <div className="flex-1 min-h-0">
              <NovaChat
                scenario={scenarioKey}
                round={roundKey}
                tabData={currentTabSummary}
                roundBrief={modifiedBrief}
                votes={votes}
                decisions={pastDecisions}
                activeMember={members[activeMemberIdx]?.name ?? `Member ${activeMemberIdx + 1}`}
                teamId={teamId ?? ''}
                scenarioName={scenario?.name ?? ''}
                scenarioData={scenario?.tabs ?? {}}
                questions={currentRound?.questions ?? []}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ── Bottom Bar ── */}
      <footer className="sticky bottom-0 z-40 bg-white/80 backdrop-blur-xl border-t border-[#D1D9D4] px-6 py-3 flex items-center justify-between">
        <div>
          <RoundNav
            rounds={activeRoundLabels}
            currentRound={currentRoundIdx}
            results={roundResults}
            onRoundSelect={(idx) => {
              if (roundResults[idx] !== null || idx === currentRoundIdx) {
                setCurrentRoundIdx(idx);
              }
            }}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-[#718096] uppercase tracking-wider">Round</span>
          <span className="font-mono-data text-sm font-bold text-[#0B1F35]">
            {currentRoundIdx + 1} / {activeRoundOrder.length}
          </span>
        </div>
      </footer>
    </div>
  );
}
