'use client';

import { ROUND_ORDER, type RoundKey, type Round } from '@/lib/decisions';
import { isLowerBetter } from '@/lib/consequences';

interface DecisionChainProps {
  team: { name: string; color: string };
  decisions: { round: string; final_votes: any }[];
  scenarioDecisions: Record<RoundKey, Round>;
}

export default function DecisionChain({
  team,
  decisions,
  scenarioDecisions,
}: DecisionChainProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
        <h3 className="text-lg font-bold text-white">{team.name}</h3>
      </div>

      {ROUND_ORDER.map((roundKey, ri) => {
        const round: Round | undefined = scenarioDecisions[roundKey];
        if (!round) return null;

        const teamDecision = decisions.find((d) => d.round === roundKey);
        const finalVotes: Record<string, number> = teamDecision?.final_votes ?? {};

        return (
          <div key={roundKey} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px' }}>
            <div className="px-4 py-3 border-b border-white/[0.08] bg-white/[0.04]">
              <span className="text-xs text-white/40 font-mono">Round {ri + 1}</span>
              <h4 className="font-semibold text-sm mt-0.5 capitalize text-white">{roundKey}</h4>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {round.questions.map((q, qIdx) => {
                const chosenIdx = finalVotes[qIdx] as number | undefined;
                const chosen = chosenIdx != null ? q.options[chosenIdx] : null;

                return (
                  <div key={qIdx} className="px-4 py-4">
                    <p className="text-sm text-white/60 mb-2">{q.question}</p>

                    {chosen ? (
                      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3">
                        <p className="text-sm font-medium text-white mb-1">
                          Chose: {chosen.label}
                        </p>
                        <p className="text-sm font-semibold text-white mb-1">
                          {chosen.consequence.title}
                        </p>
                        <p className="text-xs text-white/60 mb-2">
                          {chosen.consequence.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(chosen.consequence.kpiDeltas).map(([key, delta]) => {
                            const isPos = delta.startsWith('+') && !delta.includes('+0');
                            const isNeg = delta.startsWith('-');
                            const lowerBetter = isLowerBetter(key);
                            const isGood = lowerBetter ? isNeg : isPos;
                            return (
                              <span
                                key={key}
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                  isGood ? 'bg-[#3A9E82]/15 text-[#3A9E82]' : 'bg-[#E53E3E]/15 text-[#E53E3E]'
                                }`}
                              >
                                {key} {delta}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-white/40">No decision recorded</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
