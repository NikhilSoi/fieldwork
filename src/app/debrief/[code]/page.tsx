'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DECISIONS, ROUND_ORDER } from '@/lib/decisions';
import { BASE_KPIS, computeCumulativeKPIs, computeCompositeScore } from '@/lib/consequences';
import ScoreHero from '@/components/debrief/ScoreHero';
import DecisionChain from '@/components/debrief/DecisionChain';
import ConsequenceChain from '@/components/debrief/ConsequenceChain';
import NovaAnalysis from '@/components/debrief/NovaAnalysis';
import ClassPatterns from '@/components/debrief/ClassPatterns';

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

const SCENARIO_DISPLAY_MAP: Record<string, string> = {
  dtc: 'Direct-to-Consumer',
  saas: 'SaaS & Product Growth',
  market: 'Marketplace Economics',
  media: 'Media & Monetisation',
  ecom: 'Future of E-commerce',
};

const FACILITATION_NOTES: Record<string, { round: string; prompts: string[] }[]> = {
  dtc: [
    {
      round: 'Budget',
      prompts: [
        'The Benchmarks tab showed CAC 50% above category average AND checkout CVR 3x below benchmark. If you could only fix one, which would you prioritise first — and why?',
        'Teams that chose checkout optimisation saw CVR double. What data point in the Funnel tab made that the most defensible choice given what was available?',
        'If Lumé had 12 months of runway instead of 6, would the "right" budget allocation change? What does time horizon do to marketing strategy?',
      ],
    },
    {
      round: 'Diagnose',
      prompts: [
        'The Funnel tab had multiple gaps — add-to-cart at 14.2% vs 22% benchmark, and checkout CVR at 23% vs 65% benchmark. Which gap was more actionable, and what distinguishes "actionable" from "significant"?',
        'The payment failure rate was 11.2%. How visible was that data point? Did your team notice it, or was it buried in the checkout CVR aggregate?',
      ],
    },
    {
      round: 'RFM',
      prompts: [
        'At-Risk customers had AOV £94 and historical purchase frequency. Champions had AOV £108 but were already buying. What is the mathematical case for At-Risk over Champions?',
        'The concept of "incrementality" appeared in the consequence text. Why is £47k from At-Risk win-back more valuable than £8k from Champions, even though Champions spent more per order?',
      ],
    },
  ],
  saas: [
    {
      round: 'Budget',
      prompts: [
        'Trial→paid was 8% vs 22% benchmark. Why does fixing activation before scaling acquisition make mathematical sense? What happens to CAC payback when trial→paid doubles?',
        'Some teams chose sales expansion. At what company stage does adding SDRs make more sense than fixing the product funnel?',
      ],
    },
    {
      round: 'Diagnose',
      prompts: [
        'The funnel showed a 48pp drop from profile setup (84%) to first task (36%). Why is this more actionable than the team invite drop (36% → 14%)?',
        'Users who completed onboarding converted at 34% vs 3% for dropoffs — an 11.3x lift. How should this data point have informed every team\'s diagnosis?',
      ],
    },
    {
      round: 'RFM',
      prompts: [
        'At-Risk users represented 22% of users but the data showed 71% would churn within 60 days if unreached. What is the expected MRR impact of ignoring vs addressing this segment?',
        'Power users were expanding. Why is "they were staying anyway" a problem? What does the concept of additionality mean for CRM budget allocation?',
      ],
    },
  ],
  market: [
    {
      round: 'Budget',
      prompts: [
        'The buyer:seller ratio was 0.28 vs 0.6 benchmark. Why does adding more sellers when you already have 3.6x supply make the problem worse?',
        'Enterprise buyers had 4x GMV per hire. At what point does concentrating on fewer, higher-value buyers create its own risk?',
      ],
    },
    {
      round: 'Diagnose',
      prompts: [
        'Buyers browsed 12 profiles per hire vs a benchmark of 5. What does that signal about the information available on profiles?',
        'Time-to-hire was 8.4 days vs 3-day benchmark. The biggest delay was brief→first proposal (2.1 days vs 4-hour benchmark). What structural fix reduces that delay?',
      ],
    },
    {
      round: 'RFM',
      prompts: [
        'First-timers (28%) hired once but never returned. Repeat rate was 22% vs 45% benchmark. What is the compounding effect on GMV if you convert even 10% of first-timers to repeat?',
        'Loyalty discounts improve volume but erode take rate. When does discounting become self-defeating for a marketplace?',
      ],
    },
  ],
  media: [
    {
      round: 'Budget',
      prompts: [
        'Paid subscribers opened at 22% vs 42% for organic. Why does "cheaper per subscriber" from paid actually cost more when measured by engagement?',
        'Referral participation was 8% vs 25% benchmark. What does that gap represent in untapped organic growth?',
      ],
    },
    {
      round: 'Diagnose',
      prompts: [
        'Open rate was 42% (healthy) but CTOR was 7% (benchmark 18-22%). Why is "readers open but don\'t click" a content problem, not a design problem?',
        'Sponsor CTR was 0.8% vs 2% benchmark. Why does fixing CTOR fix sponsor CTR as a side-effect?',
      ],
    },
    {
      round: 'RFM',
      prompts: [
        'Loyal Openers (34% of list) generated 71% of sponsor clicks. What does that concentration mean for monetisation strategy?',
        'Ghost reactivation had a 2.1% success rate. At what point is list cleaning more valuable than reactivation? What metrics improve when you remove ghosts?',
      ],
    },
  ],
};

interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
}

interface Decision {
  id: string;
  team_id: string;
  round: string;
  result: string;
  score_earned: number;
  final_votes: any;
  [key: string]: any;
}

export default function DebriefPage() {
  const params = useParams();
  const code = params.code as string;

  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [sessionScenario, setSessionScenario] = useState('');

  const fetchData = useCallback(async () => {
    const { data: session } = await supabase
      .from('sessions')
      .select('id, scenario')
      .eq('code', code)
      .single();

    if (!session) {
      setLoading(false);
      return;
    }

    setSessionScenario(session.scenario);

    const { data: teamsData } = await supabase
      .from('teams')
      .select('id, name, color, score')
      .eq('session_id', session.id)
      .order('created_at');

    if (teamsData) setTeams(teamsData);

    const { data: decisionsData } = await supabase
      .from('decisions')
      .select('*')
      .eq('session_id', session.id)
      .order('round');

    if (decisionsData) setDecisions(decisionsData);

    setLoading(false);
  }, [code]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex items-center justify-center">
        <div className="animate-pulse-pip text-[#718096] text-sm">Loading debrief...</div>
      </div>
    );
  }

  const scenarioKey = SCENARIO_KEY_MAP[sessionScenario] || sessionScenario;
  const scenarioLabel = SCENARIO_DISPLAY_MAP[scenarioKey] || sessionScenario;
  const scenarioDecisions = DECISIONS[scenarioKey];
  const base = BASE_KPIS[scenarioKey] ?? {};
  const facilitation = FACILITATION_NOTES[scenarioKey] ?? [];

  // Compute KPI trajectories and rankings for each team
  const teamRankings = teams.map((team) => {
    const teamDecs = decisions.filter((d) => d.team_id === team.id);
    const completedRounds = ROUND_ORDER
      .filter((rk) => teamDecs.find((d) => d.round === rk))
      .map((rk) => ({
        round: rk,
        finalVotes: teamDecs.find((d) => d.round === rk)?.final_votes ?? {},
      }));

    const kpis = computeCumulativeKPIs(scenarioKey, completedRounds);
    const composite = computeCompositeScore(scenarioKey, kpis);

    return {
      name: team.name,
      color: team.color,
      kpis,
      baseKpis: { ...base },
      composite,
      rank: 0,
    };
  });

  // Sort by composite score (highest = best) and assign ranks
  teamRankings.sort((a, b) => b.composite - a.composite);
  teamRankings.forEach((t, i) => { t.rank = i + 1; });

  return (
    <div className="min-h-screen bg-[#F4F7F5] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[#718096] text-xs uppercase tracking-widest mb-2">Simulation Complete</p>
          <h1 className="text-4xl font-bold text-[#0B1F35] mb-2">Debrief</h1>
          <p className="text-[#4A5568] text-sm">{scenarioLabel} &middot; Session {code}</p>
        </div>

        {/* KPI Trajectory Leaderboard */}
        <div className="rounded-xl bg-white border border-[#D1D9D4] p-8 mb-8">
          <h2 className="text-sm font-semibold text-[#4A5568] uppercase tracking-wide mb-2 text-center">
            How each team&apos;s decisions shaped their outcomes
          </h2>
          <p className="text-xs text-[#718096] text-center mb-6">
            Ranked by overall KPI trajectory improvement
          </p>
          <ScoreHero teams={teamRankings} />
        </div>

        {/* Decision & Consequence Chain */}
        <div className="rounded-xl bg-white border border-[#D1D9D4] p-8 mb-8">
          <h2 className="text-sm font-semibold text-[#4A5568] uppercase tracking-wide mb-6">
            What each team chose — and what happened next
          </h2>
          {teams.length === 0 ? (
            <p className="text-[#718096] text-sm">No team data available.</p>
          ) : (
            <div className="space-y-8">
              {teams.map((team) => {
                const teamDecisions = decisions.filter((d) => d.team_id === team.id);
                return (
                  <DecisionChain
                    key={team.id}
                    team={{ name: team.name, color: team.color }}
                    decisions={teamDecisions}
                    scenarioDecisions={scenarioDecisions as any}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* KPI Trajectory Chain */}
        <div className="rounded-xl bg-white border border-[#D1D9D4] p-8 mb-8">
          <h2 className="text-sm font-semibold text-[#4A5568] uppercase tracking-wide mb-6">
            KPI Trajectory
          </h2>
          {teams.length === 0 ? (
            <p className="text-[#718096] text-sm">No team data available.</p>
          ) : (
            <div className="space-y-8">
              {teams.map((team) => {
                const teamDecisions = decisions.filter((d) => d.team_id === team.id);
                return (
                  <ConsequenceChain
                    key={team.id}
                    team={{ name: team.name, color: team.color }}
                    decisions={teamDecisions}
                    scenarioDecisions={scenarioDecisions as any}
                    scenario={scenarioKey}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Nova Analysis */}
        <div className="rounded-xl bg-white border border-[#D1D9D4] p-8 mb-8">
          <h2 className="text-sm font-semibold text-[#4A5568] uppercase tracking-wide mb-6">
            Nova Analysis
          </h2>
          {teams.length === 0 ? (
            <p className="text-[#718096] text-sm">No team data available.</p>
          ) : (
            <div className="space-y-8">
              {teams.map((team) => {
                const teamDecisions = decisions.filter((d) => d.team_id === team.id);
                return (
                  <NovaAnalysis
                    key={team.id}
                    team={{ name: team.name, color: team.color }}
                    decisions={teamDecisions}
                    scenario={scenarioKey}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Class Patterns */}
        <div className="rounded-xl bg-white border border-[#D1D9D4] p-8 mb-8">
          <ClassPatterns
            teams={teams}
            decisions={decisions}
            scenario={scenarioKey}
          />
        </div>

        {/* Facilitation Notes */}
        {facilitation.length > 0 && (
          <div className="rounded-xl bg-[#0B1F35] p-8 mb-8">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-6">
              Facilitation Notes
            </h2>
            <p className="text-xs text-white/40 mb-6">
              Discussion questions for the instructor — framed around the data, not around a &ldquo;correct&rdquo; answer.
            </p>
            <div className="space-y-6">
              {facilitation.map((f) => (
                <div key={f.round}>
                  <h3 className="text-sm font-semibold text-[#3A9E82] mb-3 capitalize">
                    {f.round} Round
                  </h3>
                  <ul className="space-y-2">
                    {f.prompts.map((p, i) => (
                      <li key={i} className="text-sm text-white/70 flex gap-2">
                        <span className="text-[#3A9E82] mt-0.5 shrink-0">?</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center mt-4 mb-8">
          <Link
            href="/"
            className="inline-block rounded-xl bg-[#0B1F35] hover:bg-[#0B1F35]/90 text-white font-semibold px-8 py-3 text-sm transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
