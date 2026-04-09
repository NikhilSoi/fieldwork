'use client';

import type { Option } from '@/lib/decisions';

interface Props {
  options: Option[];
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
}

export default function TileSelector({ options, selectedIdx, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt, idx) => {
        const isSelected = selectedIdx === idx;
        const shortDesc = opt.shortDescription
          ?? opt.consequence.description.split('. ')[0] + '.';

        return (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`flex flex-col text-left p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-[#3A9E82]/50 ${
              isSelected
                ? 'border-[#3A9E82] bg-[#E8F5F1]'
                : 'border-[#D1D9D4] bg-white'
            }`}
          >
            <span className="text-sm font-semibold text-[#0B1F35] mb-1">{opt.label}</span>
            <span className="text-xs text-[#718096] line-clamp-2">{shortDesc}</span>
          </button>
        );
      })}
    </div>
  );
}
