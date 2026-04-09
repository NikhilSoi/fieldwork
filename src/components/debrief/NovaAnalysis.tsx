'use client';

import { DECISIONS, ROUND_ORDER } from '@/lib/decisions';

const SCENARIO_LABELS: Record<string, string> = {
  dtc: 'Direct-to-Consumer',
  saas: 'SaaS & Product Growth',
  market: 'Marketplace Economics',
  media: 'Media & Monetisation',
  ecom: 'Future of E-commerce',
};

interface NovaAnalysisProps {
  team: { name: string; color: string };
  decisions: { round: string; final_votes: any }[];
  scenario: string;
}

export default function NovaAnalysis({ team, decisions, scenario }: NovaAnalysisProps) {
  const scenarioDecisions = DECISIONS[scenario];
  if (!scenarioDecisions || decisions.length === 0) {
    return (
      <div className="rounded-xl border border-[#D1D9D4] bg-white p-6 text-center text-[#718096]">
        No decisions to analyze.
      </div>
    );
  }

  const label = SCENARIO_LABELS[scenario] || scenario;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
        <h3 className="text-lg font-bold text-[#0B1F35]">{team.name} — Nova Analysis</h3>
      </div>

      {ROUND_ORDER.map((roundKey) => {
        const dec = decisions.find((d) => d.round === roundKey);
        if (!dec) return null;

        const roundData = scenarioDecisions[roundKey];
        const finalVotes: Record<number, number> = dec.final_votes ?? {};

        return (
          <div key={roundKey} className="rounded-xl border border-[#D1D9D4] bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#3A9E82]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#3A9E82]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <p className="text-xs text-[#718096] font-mono capitalize">{roundKey} Round</p>
            </div>

            {roundData.questions.map((q, qIdx) => {
              const chosenIdx = finalVotes[qIdx];
              const chosen = chosenIdx != null ? q.options[chosenIdx] : null;
              if (!chosen) return null;

              return (
                <div key={qIdx} className="mb-3 last:mb-0">
                  <p className="text-sm font-medium text-[#0B1F35] mb-1">
                    {chosen.consequence.title}
                  </p>
                  <p className="text-sm text-[#4A5568] italic leading-relaxed">
                    In the {roundKey} round of the {label} scenario, {team.name} chose &ldquo;{chosen.label}&rdquo;.{' '}
                    {chosen.consequence.description}
                  </p>
                </div>
              );
            })}

            <p className="text-[10px] text-[#718096] mt-3">
              Powered by Nova
            </p>
          </div>
        );
      })}
    </div>
  );
}
