'use client';

interface Team {
  id: string;
  name: string;
  color: string;
}

interface Decision {
  team_id: string;
  round: string;
  final_votes?: Record<number, number>;
}

interface QuestionData {
  question: string;
  options: { label: string }[];
}

interface DecisionComparisonProps {
  teams: Team[];
  decisions: Decision[];
  round: string;
  questions: QuestionData[];
}

export default function DecisionComparison({
  teams,
  decisions,
  round,
  questions,
}: DecisionComparisonProps) {
  const roundDecisions = decisions.filter((d) => d.round === round);

  if (teams.length === 0 || questions.length === 0) {
    return (
      <div
        className="rounded-2xl p-6 text-center text-white/40"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px' }}
      >
        {teams.length === 0 ? 'No teams to compare.' : 'No questions for this round.'}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px' }}
    >
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white/60">
          Decisions &mdash; <span className="capitalize">{round}</span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/50 text-xs border-b border-white/[0.06]">
              <th className="text-left px-4 py-2 font-medium min-w-[180px]">Question</th>
              {teams.map((team) => (
                <th key={team.id} className="text-center px-4 py-2 font-medium min-w-[140px]">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />
                    <span className="text-white/50">{team.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {questions.map((q, qIdx) => (
              <tr key={qIdx} className="border-b border-white/[0.06] last:border-0">
                <td className="px-4 py-3 text-white/60">{q.question}</td>
                {teams.map((team) => {
                  const dec = roundDecisions.find((d) => d.team_id === team.id);
                  const chosenIdx = dec?.final_votes?.[qIdx];

                  if (chosenIdx == null) {
                    return (
                      <td key={team.id} className="px-4 py-3 text-center text-white/40 italic">
                        --
                      </td>
                    );
                  }

                  const optionLabel = q.options[chosenIdx]?.label || `Option ${chosenIdx + 1}`;

                  return (
                    <td key={team.id} className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-white/[0.04] text-white">
                        {optionLabel}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
