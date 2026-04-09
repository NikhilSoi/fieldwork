'use client';

import { DECISIONS, ROUND_ORDER } from '@/lib/decisions';

type Props = {
  teams: { id: string; name: string; color: string }[];
  decisions: { team_id: string; round: string; final_votes: any }[];
  scenario: string;
};

export default function ClassPatterns({ teams, decisions, scenario }: Props) {
  const scenarioDecisions = DECISIONS[scenario];
  if (!scenarioDecisions) return null;

  const totalTeamsWithDecisions = new Set(decisions.map((d) => d.team_id)).size;

  const roundPatterns: {
    round: string;
    questions: {
      question: string;
      optionCounts: { label: string; count: number; pct: number }[];
    }[];
  }[] = [];

  for (const roundKey of ROUND_ORDER) {
    const roundData = scenarioDecisions[roundKey];
    if (!roundData) continue;

    const roundDecisions = decisions.filter((d) => d.round === roundKey);

    const questions = roundData.questions.map((q, qIdx) => {
      const optionCounts = q.options.map((opt, optIdx) => {
        let count = 0;
        for (const d of roundDecisions) {
          const votes = d.final_votes;
          if (votes && votes[qIdx] === optIdx) {
            count++;
          }
        }
        return {
          label: opt.label,
          count,
          pct: roundDecisions.length > 0 ? Math.round((count / roundDecisions.length) * 100) : 0,
        };
      });

      return { question: q.question, optionCounts };
    });

    roundPatterns.push({ round: roundKey, questions });
  }

  // Generate discussion prompts
  const prompts: string[] = [];

  // Find the most popular choice and ask about alternatives
  for (const rp of roundPatterns) {
    for (const q of rp.questions) {
      const sorted = [...q.optionCounts].sort((a, b) => b.count - a.count);
      if (sorted[0] && sorted[0].count > 0) {
        const popular = sorted[0];
        const alt = sorted.find((s) => s.count > 0 && s.label !== popular.label);
        if (popular.pct >= 50) {
          prompts.push(
            `${popular.pct}% of teams chose "${popular.label}" for "${q.question}". What data points made this the most defensible choice?`
          );
        }
        if (alt && alt.count > 0) {
          prompts.push(
            `${alt.count} team${alt.count !== 1 ? 's' : ''} chose "${alt.label}" instead. What would have needed to be true in the data for that to be the stronger call?`
          );
          break; // One alt prompt per round is enough
        }
      }
    }
  }

  prompts.push(
    "Compare your team's decision chain to another team's. Where did your paths diverge, and what data were you each looking at?"
  );

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Class Patterns</h3>
      {totalTeamsWithDecisions > 0 && (
        <p className="text-sm text-white/40">
          Based on {totalTeamsWithDecisions} team{totalTeamsWithDecisions !== 1 ? 's' : ''} that completed the simulation
        </p>
      )}

      <div className="space-y-4">
        {roundPatterns.map((rp) => (
          <div key={rp.round} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px' }}>
            <h4 className="text-sm font-medium text-white/60 uppercase tracking-wide mb-3 capitalize">
              {rp.round}
            </h4>
            <div className="space-y-4">
              {rp.questions.map((q, qi) => (
                <div key={qi}>
                  <p className="text-sm text-white font-medium mb-2">{q.question}</p>
                  <div className="space-y-1.5">
                    {q.optionCounts.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-3">
                        <div className="flex-1 text-xs text-white/60 truncate">{opt.label}</div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-24 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${opt.pct}%`,
                                backgroundColor: opt.count > 0 ? '#3A9E82' : 'rgba(255,255,255,0.2)',
                              }}
                            />
                          </div>
                          <span className="text-xs text-white/40 w-14 text-right">
                            {opt.count > 0 ? `${opt.count} team${opt.count !== 1 ? 's' : ''}` : '--'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Discussion Prompts */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px' }}>
        <h4 className="text-sm font-medium text-white/60 uppercase tracking-wide mb-3">
          Discussion Prompts
        </h4>
        <ul className="space-y-2">
          {prompts.map((p, i) => (
            <li key={i} className="text-sm text-white flex gap-2">
              <span className="text-[#3A9E82] mt-0.5 shrink-0">?</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
