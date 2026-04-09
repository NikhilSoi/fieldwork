'use client';

interface RoundNavProps {
  rounds: string[];
  currentRound: number;
  results: (string | null)[];
  onRoundSelect: (idx: number) => void;
}

export default function RoundNav({
  rounds,
  currentRound,
  results,
  onRoundSelect,
}: RoundNavProps) {
  return (
    <div className="flex items-center gap-1 w-full overflow-x-auto py-2">
      {rounds.map((label, idx) => {
        const isCurrent = idx === currentRound;
        const isCompleted = results[idx] !== null && results[idx] !== undefined;
        const isFuture = idx > currentRound;

        return (
          <div key={idx} className="flex items-center">
            {idx > 0 && (
              <div className={`h-0.5 w-6 ${idx <= currentRound ? 'bg-white/20' : 'bg-white/[0.06]'}`} />
            )}

            <button
              onClick={() => {
                if (isCompleted || isCurrent) onRoundSelect(idx);
              }}
              disabled={isFuture}
              className={`relative flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold transition-all shrink-0 ${
                isFuture
                  ? 'text-white/30 cursor-not-allowed'
                  : isCompleted
                  ? 'cursor-pointer hover:scale-110'
                  : isCurrent
                  ? 'cursor-pointer'
                  : ''
              }`}
              style={{
                backgroundColor: isCompleted
                  ? 'rgba(58,158,130,0.15)'
                  : isCurrent
                  ? 'rgba(58,158,130,0.1)'
                  : isFuture
                  ? 'rgba(255,255,255,0.04)'
                  : undefined,
                border: isCurrent
                  ? '2px solid #3A9E82'
                  : isCompleted
                  ? '2px solid rgba(58,158,130,0.5)'
                  : '2px solid transparent',
                color: isCompleted
                  ? '#3A9E82'
                  : isCurrent
                  ? '#3A9E82'
                  : undefined,
              }}
              title={label}
            >
              {isCompleted ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                idx + 1
              )}

              {isCurrent && (
                <span className="absolute inset-0 rounded-full border-2 border-[#3A9E82] animate-ping opacity-30" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
