'use client';

interface ConsequenceBarProps {
  result: 'good' | 'bad';
  outcome: { title: string; rows: string[] };
  kpiDeltas: { [key: string]: string };
}

export default function ConsequenceBar({
  result,
  outcome,
  kpiDeltas,
}: ConsequenceBarProps) {
  const isGood = result === 'good';

  return (
    <div
      className="w-full rounded-lg border p-5 animate-fadeIn"
      style={{
        backgroundColor: isGood ? '#E8F5F1' : 'rgba(229,62,62,0.05)',
        borderColor: isGood ? 'rgba(58,158,130,0.3)' : 'rgba(229,62,62,0.3)',
        animation: 'fadeIn 0.5s ease-out',
      }}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            isGood
              ? 'bg-[#3A9E82]/20 text-[#3A9E82]'
              : 'bg-[#E53E3E]/20 text-[#E53E3E]'
          }`}
        >
          {isGood ? 'Good Outcome' : 'Bad Outcome'}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[#0B1F35] font-semibold text-base mb-3">{outcome.title}</h3>

      {/* Bullet rows */}
      {outcome.rows.length > 0 && (
        <ul className="flex flex-col gap-1.5 mb-4">
          {outcome.rows.map((row, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#4A5568]">
              <span
                className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                  isGood ? 'bg-[#3A9E82]' : 'bg-[#E53E3E]'
                }`}
              />
              {row}
            </li>
          ))}
        </ul>
      )}

      {/* KPI delta pills */}
      {Object.keys(kpiDeltas).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(kpiDeltas).map(([key, delta]) => {
            const isPositive =
              delta.startsWith('+') || delta.toLowerCase().includes('increase');
            const isNegative =
              delta.startsWith('-') || delta.toLowerCase().includes('decrease');

            return (
              <span
                key={key}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                  isPositive
                    ? 'bg-[#E8F5F1] text-[#3A9E82] border-[#3A9E82]/20'
                    : isNegative
                    ? 'bg-[#E53E3E]/5 text-[#E53E3E] border-[#E53E3E]/20'
                    : 'bg-[#EEF2EF] text-[#718096] border-[#D1D9D4]'
                }`}
              >
                <span className="text-[#718096]">{key}:</span>
                {delta}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
