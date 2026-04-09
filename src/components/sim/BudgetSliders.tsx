'use client';

import { useState } from 'react';
import type { Option } from '@/lib/decisions';

interface Props {
  options: Option[];
  totalBudget: number;
  currency: string;
  onAllocationChange: (allocations: number[]) => void;
}

export default function BudgetSliders({ options, totalBudget, currency, onAllocationChange }: Props) {
  const count = options.length;
  const even = Math.floor(totalBudget / count);
  const [allocations, setAllocations] = useState<number[]>(
    options.map((_, i) => i === 0 ? totalBudget - even * (count - 1) : even)
  );

  const total = allocations.reduce((a, b) => a + b, 0);
  const isOver = total > totalBudget;

  const handleSlider = (idx: number, value: number) => {
    setAllocations((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  // Only notify parent when user releases the slider
  const handleRelease = () => {
    onAllocationChange(allocations);
  };

  const step = Math.round(totalBudget / 100);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider">
          Allocate {currency}{totalBudget.toLocaleString()} budget
        </p>
      </div>

      {options.map((opt, idx) => (
        <div key={idx} className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white truncate mr-2">{opt.label}</span>
            <span className="text-sm font-mono text-white font-semibold whitespace-nowrap">
              {currency}{allocations[idx].toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={totalBudget}
            step={step}
            value={allocations[idx]}
            onChange={(e) => handleSlider(idx, Number(e.target.value))}
            onMouseUp={handleRelease}
            onTouchEnd={handleRelease}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#3A9E82]"
            style={{
              background: `linear-gradient(to right, #3A9E82 0%, #4DC4A0 ${(allocations[idx] / totalBudget) * 100}%, rgba(255,255,255,0.1) ${(allocations[idx] / totalBudget) * 100}%, rgba(255,255,255,0.1) 100%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-white/30 mt-1">
            <span>{currency}0</span>
            <span>{currency}{totalBudget.toLocaleString()}</span>
          </div>
        </div>
      ))}

      <div className={`rounded-2xl px-4 py-2.5 text-sm font-semibold text-center ${
        isOver ? 'bg-[#E53E3E]/10 text-[#E53E3E] border border-[#E53E3E]/30' :
        total === totalBudget ? 'bg-[#3A9E82]/10 text-[#3A9E82] border border-[#3A9E82]/30' :
        'text-white/60 border border-white/[0.08]'
      }`} style={!isOver && total !== totalBudget ? { background: 'rgba(255,255,255,0.04)' } : {}}>
        {currency}{total.toLocaleString()} allocated of {currency}{totalBudget.toLocaleString()}
        {isOver && ' — over budget!'}
      </div>
    </div>
  );
}
