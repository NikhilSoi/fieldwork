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
  if (dir === 'flat') return 'text-white/40';
  const positive = dir === 'up';
  const good = isLowerBetter(key) ? !positive : positive;
  return good ? 'text-[#3A9E82]' : 'text-[#E53E3E]';
}

function deltaBgColor(delta: string, key: string): string {
  const dir = parseDeltaDirection(delta);
  if (dir === 'flat') return 'bg-white/[0.04]';
  const positive = dir === 'up';
  const good = isLowerBetter(key) ? !positive : positive;
  return good ? 'bg-[#3A9E82]/15' : 'bg-[#E53E3E]/15';
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
      <div className="rounded-2xl p-6 text-center text-white/40" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px' }}>
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
        <h3 className="text-lg font-bold text-white">{team.name} — KPI Trajectory</h3>
      </div>

      <div className="overflow-x-auto">
        <div className="flex items-stretch gap-0 min-w-[640px]">
          {/* Base column */}
          <div className="flex-shrink-0 w-36 rounded-l-2xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs text-white/40 mb-2 font-mono">Start</p>
            <div className="space-y-2">
              {kpiNames.map((k) => (
                <div key={k}>
                  <p className="text-[10px] text-white/40 uppercase tracking-wide">{k}</p>
                  <p className="text-sm font-mono font-semibold text-white">{formatKPI(k, base[k])}</p>
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
                  <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                <div
                  className={`flex-shrink-0 w-44 p-3 ${isLast ? 'rounded-r-2xl' : ''}`}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <p className="text-xs text-white/40 font-mono capitalize mb-2">{snap.roundKey}</p>

                  <div className="space-y-2">
                    {kpiNames.map((k) => {
                      const delta = snap.deltas[k];
                      return (
                        <div key={k}>
                          <p className="text-[10px] text-white/40 uppercase tracking-wide">{k}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-mono font-semibold text-white">
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
                    <p className="text-[10px] text-white/40 mt-2 text-center">--</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cumulative summary */}
      <div className="rounded-2xl bg-white/[0.04] p-4" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
        <p className="text-xs text-white/40 mb-2 font-mono">Cumulative Impact</p>
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
                <p className="text-[10px] text-white/40 uppercase tracking-wide">{k}</p>
                <p className="text-sm font-mono font-semibold mt-0.5 text-white">
                  {formatKPI(k, start)} &rarr; {formatKPI(k, end)}
                </p>
                <p className={`text-xs font-mono mt-0.5 ${dir === 'flat' ? 'text-white/40' : good ? 'text-[#3A9E82]' : 'text-[#E53E3E]'}`}>
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
