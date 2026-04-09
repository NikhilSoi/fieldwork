'use client';

import { ROUND_ORDER, type RoundKey, type Round } from '@/lib/decisions';
import { BASE_KPIS, applyKPIDelta, formatKPI, isLowerBetter } from '@/lib/consequences';

interface ConsequenceChainProps {
  team: { name: string; color: string };
  decisions: { round: string; final_votes: any }[];
  scenarioDecisions: Record<RoundKey, Round>;
  scenario: string;
}

function parseDeltaDirection(delta: string): 'up' | 'down' | 'flat' {
  if (delta.startsWith('+') && delta !== '+0%') return 'up';
  if (delta.startsWith('-')) return 'down';
  return 'flat';
}

function deltaColor(delta: string, key: string): string {
  const dir = parseDeltaDirection(delta);
  if (dir === 'flat') return 'text-[#718096]';
  const positive = dir === 'up';
  const good = isLowerBetter(key) ? !positive : positive;
  return good ? 'text-[#3A9E82]' : 'text-[#E53E3E]';
}

function deltaBgColor(delta: string, key: string): string {
  const dir = parseDeltaDirection(delta);
  if (dir === 'flat') return 'bg-white';
  const positive = dir === 'up';
  const good = isLowerBetter(key) ? !positive : positive;
  return good ? 'bg-[#E8F5F1]' : 'bg-[#E53E3E]/5';
}

export default function ConsequenceChain({
  team,
  decisions,
  scenarioDecisions,
  scenario,
}: ConsequenceChainProps) {
  const base = BASE_KPIS[scenario];
  if (!base) {
    return (
      <div className="rounded-xl border border-[#D1D9D4] bg-white p-6 text-center text-[#718096]">
        No KPI data available for scenario.
      </div>
    );
  }

  const kpiNames = Object.keys(base);

  type Snapshot = {
    roundKey: RoundKey;
    hasDecision: boolean;
    deltas: Record<string, string>;
    kpis: Record<string, number>;
  };

  const snapshots: Snapshot[] = [];
  let running = { ...base };

  for (const roundKey of ROUND_ORDER) {
    const teamDecision = decisions.find((d) => d.round === roundKey);
    const roundData = scenarioDecisions[roundKey];
    const finalVotes: Record<number, number> = teamDecision?.final_votes ?? {};

    const allDeltas: Record<string, string> = {};
    const newKpis = { ...running };

    if (teamDecision && roundData) {
      // Collect kpiDeltas from each question's chosen option
      roundData.questions.forEach((q, qIdx) => {
        const chosenIdx = finalVotes[qIdx];
        if (chosenIdx == null) return;
        const option = q.options[chosenIdx];
        if (!option) return;

        for (const [key, delta] of Object.entries(option.consequence.kpiDeltas)) {
          // If multiple questions affect the same KPI, take the last one
          // (in practice they usually affect different KPIs)
          allDeltas[key] = delta;
        }
      });

      for (const key of kpiNames) {
        if (allDeltas[key]) {
          newKpis[key] = applyKPIDelta(running[key], allDeltas[key]);
        }
      }
    }

    snapshots.push({ roundKey, hasDecision: !!teamDecision, deltas: allDeltas, kpis: newKpis });
    running = newKpis;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
        <h3 className="text-lg font-bold text-[#0B1F35]">{team.name} — KPI Trajectory</h3>
      </div>

      <div className="overflow-x-auto">
        <div className="flex items-stretch gap-0 min-w-[640px]">
          {/* Base column */}
          <div className="flex-shrink-0 w-36 rounded-l-xl border border-[#D1D9D4] bg-white p-3">
            <p className="text-xs text-[#718096] mb-2 font-mono">Start</p>
            <div className="space-y-2">
              {kpiNames.map((k) => (
                <div key={k}>
                  <p className="text-[10px] text-[#718096] uppercase tracking-wide">{k}</p>
                  <p className="text-sm font-mono font-semibold text-[#0B1F35]">{formatKPI(k, base[k])}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Round columns */}
          {snapshots.map((snap, i) => {
            const isLast = i === snapshots.length - 1;
            return (
              <div key={snap.roundKey} className="flex items-stretch">
                <div className="flex items-center px-1">
                  <svg className="w-6 h-6 text-[#718096]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                <div className={`flex-shrink-0 w-44 border border-[#D1D9D4] bg-white p-3 ${isLast ? 'rounded-r-xl' : ''}`}>
                  <p className="text-xs text-[#718096] font-mono capitalize mb-2">{snap.roundKey}</p>

                  <div className="space-y-2">
                    {kpiNames.map((k) => {
                      const delta = snap.deltas[k];
                      return (
                        <div key={k}>
                          <p className="text-[10px] text-[#718096] uppercase tracking-wide">{k}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-mono font-semibold text-[#0B1F35]">
                              {formatKPI(k, snap.kpis[k])}
                            </span>
                            {delta && (
                              <span className={`text-[10px] font-mono px-1 py-px rounded ${deltaBgColor(delta, k)} ${deltaColor(delta, k)}`}>
                                {delta}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!snap.hasDecision && (
                    <p className="text-[10px] text-[#718096] mt-2 text-center">--</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cumulative summary */}
      <div className="rounded-xl border border-[#D1D9D4] bg-[#EEF2EF] p-4">
        <p className="text-xs text-[#718096] mb-2 font-mono">Cumulative Impact</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpiNames.map((k) => {
            const start = base[k];
            const end = running[k];
            const pctChange = ((end - start) / start) * 100;
            const sign = pctChange >= 0 ? '+' : '';
            const pctStr = `${sign}${pctChange.toFixed(1)}%`;
            const dir = parseDeltaDirection(pctStr);
            const positive = dir === 'up';
            const good = isLowerBetter(k) ? !positive : positive;

            return (
              <div key={k} className="text-center">
                <p className="text-[10px] text-[#718096] uppercase tracking-wide">{k}</p>
                <p className="text-sm font-mono font-semibold mt-0.5 text-[#0B1F35]">
                  {formatKPI(k, start)} &rarr; {formatKPI(k, end)}
                </p>
                <p className={`text-xs font-mono mt-0.5 ${dir === 'flat' ? 'text-[#718096]' : good ? 'text-[#3A9E82]' : 'text-[#E53E3E]'}`}>
                  {pctStr}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
