'use client';

import type { Option } from '@/lib/decisions';

interface Props {
  projectedOption: Option | null;
  actualOption: Option;
  matched: boolean;
}

export default function ConsequenceComparison({ projectedOption, actualOption, matched }: Props) {
  if (!projectedOption) return null;

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-white/40 font-medium mb-1">Your projection</p>
          <p className="text-sm font-semibold text-white">{projectedOption.label}</p>
        </div>
        <div>
          <p className="text-xs text-white/40 font-medium mb-1">What happened</p>
          <p className="text-sm font-semibold text-white">{actualOption.label}</p>
        </div>
      </div>

      {matched ? (
        <p className="text-sm font-medium text-[#3A9E82] rounded-2xl px-3 py-2" style={{ background: 'rgba(58,158,130,0.1)' }}>
          Your analysis pointed to the right constraint.
        </p>
      ) : (
        <p className="text-sm font-medium text-[#D97706] rounded-2xl px-3 py-2" style={{ background: 'rgba(217,119,6,0.1)' }}>
          Your individual analysis differed from the team&apos;s final call.
        </p>
      )}
    </div>
  );
}
