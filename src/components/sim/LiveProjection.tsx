'use client';

import type { Option } from '@/lib/decisions';
import { isLowerBetter } from '@/lib/consequences';

interface Props {
  options: Option[];
  allocations: number[];
  totalBudget: number;
  threshold: number;
}

export default function LiveProjection({ options, allocations, totalBudget, threshold }: Props) {
  const maxAlloc = Math.max(...allocations);
  const maxIdx = allocations.indexOf(maxAlloc);
  const maxFraction = totalBudget > 0 ? maxAlloc / totalBudget : 0;

  const hasWinner = maxFraction >= threshold;
  const projectedOption = hasWinner ? options[maxIdx] : null;

  return (
    <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-2">
        Based on your current allocation...
      </p>

      {projectedOption ? (
        <>
          <p className="text-sm font-semibold text-white mb-1">
            &rarr; {projectedOption.label}
          </p>
          <p className="text-sm text-white/60 mb-2">
            Likely outcome: {projectedOption.consequence.title}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(projectedOption.consequence.kpiDeltas).slice(0, 2).map(([key, delta]) => {
              const isPositive = delta.startsWith('+') && !delta.includes('+0');
              const isNegative = delta.startsWith('-');
              const lowerIsBetter = isLowerBetter(key);
              const isGood = lowerIsBetter ? isNegative : isPositive;
              return (
                <span
                  key={key}
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isGood ? 'bg-[#3A9E82]/15 text-[#3A9E82]' : 'bg-[#E53E3E]/15 text-[#E53E3E]'
                  }`}
                >
                  {key} {delta}
                </span>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-sm text-[#D97706] font-medium">
          Budget is spread across options — no clear focus above {Math.round(threshold * 100)}%
        </p>
      )}

      <p className="text-[10px] text-white/20 mt-2 italic">
        This updates as you allocate. Lock in to confirm.
      </p>
    </div>
  );
}
