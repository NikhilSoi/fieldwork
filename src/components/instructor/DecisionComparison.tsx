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
      <div className="rounded-xl border border-[#D1D9D4] bg-white p-6 text-center text-[#718096]">
        {teams.length === 0 ? 'No teams to compare.' : 'No questions for this round.'}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#D1D9D4] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[#D1D9D4]">
        <h3 className="text-sm font-semibold text-[#4A5568]">
          Decisions &mdash; <span className="capitalize">{round}</span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#718096] text-xs border-b border-[#D1D9D4]">
              <th className="text-left px-4 py-2 font-medium min-w-[180px]">Question</th>
              {teams.map((team) => (
                <th key={team.id} className="text-center px-4 py-2 font-medium min-w-[140px]">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />
                    {team.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {questions.map((q, qIdx) => (
              <tr key={qIdx} className="border-b border-[#D1D9D4]/50 last:border-0">
                <td className="px-4 py-3 text-[#4A5568]">{q.question}</td>
                {teams.map((team) => {
                  const dec = roundDecisions.find((d) => d.team_id === team.id);
                  const chosenIdx = dec?.final_votes?.[qIdx];

                  if (chosenIdx == null) {
                    return (
                      <td key={team.id} className="px-4 py-3 text-center text-[#718096] italic">
                        --
                      </td>
                    );
                  }

                  const optionLabel = q.options[chosenIdx]?.label || `Option ${chosenIdx + 1}`;

                  return (
                    <td key={team.id} className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-[#EEF2EF] text-[#0B1F35]">
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
