'use client';

import { DECISIONS, ROUND_ORDER } from '@/lib/decisions';
import { isLowerBetter } from '@/lib/consequences';

interface DecisionRecord {
  round: string;
  final_votes: Record<number, number>;
}

interface Props {
  scenario: string;
  pastDecisions: DecisionRecord[];
}

export default function DecisionsSoFarTab({ scenario, pastDecisions }: Props) {
  const scenarioDecisions = DECISIONS[scenario];
  if (!scenarioDecisions || pastDecisions.length === 0) {
    return <p className="text-sm text-white/40 p-4">No decisions made yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {ROUND_ORDER.map((roundKey) => {
        const decision = pastDecisions.find((d) => d.round === roundKey);
        if (!decision) return null;
        const roundData = scenarioDecisions[roundKey];
        if (!roundData) return null;

        return (
          <div key={roundKey} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-semibold text-white capitalize mb-3">
              {roundKey} round
            </h3>

            {roundData.questions.map((q, qIdx) => {
              const chosenIdx = decision.final_votes[qIdx] ?? 0;
              const chosen = q.options[chosenIdx];
              if (!chosen) return null;

              return (
                <div key={qIdx} className="mb-3 last:mb-0">
                  <p className="text-xs text-white/40 mb-1">Q{qIdx + 1}. {q.question}</p>
                  <p className="text-sm font-medium text-white mb-1">
                    Chose: {chosen.label}
                  </p>
                  <p className="text-sm text-white/60 mb-2 italic">
                    {chosen.consequence.title}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(chosen.consequence.kpiDeltas).map(([key, delta]) => {
                      const isPositive = delta.startsWith('+') && !delta.includes('+0');
                      const isNegative = delta.startsWith('-');
                      const lowerIsBetter = isLowerBetter(key);
                      const isGood = lowerIsBetter ? isNegative : isPositive;
                      return (
                        <span
                          key={key}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isGood
                              ? 'bg-[#3A9E82]/15 text-[#3A9E82]'
                              : isNegative || isPositive
                              ? 'bg-[#E53E3E]/15 text-[#E53E3E]'
                              : 'bg-white/[0.06] text-white/40'
                          }`}
                        >
                          {key} {delta}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
