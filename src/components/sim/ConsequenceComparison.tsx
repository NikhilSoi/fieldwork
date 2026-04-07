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
    <div className="rounded-lg border border-[#D1D9D4] bg-white p-4">
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-[#718096] font-medium mb-1">Your projection</p>
          <p className="text-sm font-semibold text-[#0B1F35]">{projectedOption.label}</p>
        </div>
        <div>
          <p className="text-xs text-[#718096] font-medium mb-1">What happened</p>
          <p className="text-sm font-semibold text-[#0B1F35]">{actualOption.label}</p>
        </div>
      </div>

      {matched ? (
        <p className="text-sm font-medium text-[#3A9E82] bg-[#E8F5F1] rounded-md px-3 py-2">
          Your analysis pointed to the right constraint.
        </p>
      ) : (
        <p className="text-sm font-medium text-[#D97706] bg-[#FFF8E1] rounded-md px-3 py-2">
          Your individual analysis differed from the team&apos;s final call.
        </p>
      )}
    </div>
  );
}
