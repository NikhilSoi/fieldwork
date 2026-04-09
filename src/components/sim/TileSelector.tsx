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
            className="flex flex-col text-left p-4 rounded-2xl border-2 transition-all cursor-pointer"
            style={{
              background: isSelected ? 'rgba(58,158,130,0.15)' : 'rgba(255,255,255,0.04)',
              borderColor: isSelected ? '#3A9E82' : 'rgba(255,255,255,0.08)',
            }}
          >
            <span className="text-sm font-semibold text-white mb-1">{opt.label}</span>
            <span className="text-xs text-white/40 line-clamp-2">{shortDesc}</span>
          </button>
        );
      })}
    </div>
  );
}
