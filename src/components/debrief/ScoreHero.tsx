'use client';

import { formatKPI, isLowerBetter } from '@/lib/consequences';

interface TeamKPIs {
  name: string;
  color: string;
  rank: number;
  kpis: Record<string, number>;
  baseKpis: Record<string, number>;
}

interface ScoreHeroProps {
  teams: TeamKPIs[];
}

export default function ScoreHero({ teams }: ScoreHeroProps) {
  if (teams.length === 0) {
    return (
      <div className="rounded-2xl p-12 text-center text-white/40" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px' }}>
        No teams to display.
      </div>
    );
  }

  const sorted = [...teams].sort((a, b) => a.rank - b.rank);
  const kpiKeys = sorted[0] ? Object.keys(sorted[0].baseKpis) : [];

  return (
    <div className="space-y-6">
      {sorted.map((team, i) => {
        const isFirst = i === 0;
        return (
          <div
            key={team.name}
            className="rounded-2xl p-5"
            style={{
              background: isFirst ? 'rgba(58,158,130,0.10)' : 'rgba(255,255,255,0.04)',
              border: isFirst ? '1px solid rgba(58,158,130,0.3)' : '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: team.color }}
              >
                {team.rank}
              </span>
              <span className="font-bold text-lg text-white">{team.name}</span>
              {isFirst && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#3A9E82]/20 text-[#3A9E82]">
                  Strongest trajectory
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {kpiKeys.map((key) => {
                const start = team.baseKpis[key];
                const end = team.kpis[key];
                const pctChange = ((end - start) / start) * 100;
                const sign = pctChange >= 0 ? '+' : '';
                const pctStr = `${sign}${pctChange.toFixed(1)}%`;
                const lowerBetter = isLowerBetter(key);
                const isGood = lowerBetter ? pctChange < 0 : pctChange > 0;

                return (
                  <div key={key} className="text-center">
                    <p className="text-[10px] text-white/40 uppercase tracking-wide mb-1">{key}</p>
                    <p className="text-sm font-mono font-semibold text-white">
                      {formatKPI(key, start)} &rarr; {formatKPI(key, end)}
                    </p>
                    <p className={`text-xs font-mono mt-0.5 ${isGood ? 'text-[#3A9E82]' : pctChange === 0 ? 'text-white/40' : 'text-[#E53E3E]'}`}>
                      {pctStr}
                    </p>
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
