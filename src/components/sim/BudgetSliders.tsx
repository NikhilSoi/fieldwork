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
        <p className="text-xs text-[#718096] font-medium uppercase tracking-wider">
          Allocate {currency}{totalBudget.toLocaleString()} budget
        </p>
      </div>

      {options.map((opt, idx) => (
        <div key={idx} className="bg-white rounded-lg border border-[#D1D9D4] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#0B1F35] truncate mr-2">{opt.label}</span>
            <span className="text-sm font-mono text-[#0B1F35] font-semibold whitespace-nowrap">
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
              background: `linear-gradient(to right, #3A9E82 0%, #3A9E82 ${(allocations[idx] / totalBudget) * 100}%, #EEF2EF ${(allocations[idx] / totalBudget) * 100}%, #EEF2EF 100%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-[#A8B8B0] mt-1">
            <span>{currency}0</span>
            <span>{currency}{totalBudget.toLocaleString()}</span>
          </div>
        </div>
      ))}

      <div className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-center ${
        isOver ? 'bg-[#E53E3E]/10 text-[#E53E3E] border border-[#E53E3E]/30' :
        total === totalBudget ? 'bg-[#E8F5F1] text-[#3A9E82] border border-[#3A9E82]/30' :
        'bg-[#EEF2EF] text-[#4A5568] border border-[#D1D9D4]'
      }`}>
        {currency}{total.toLocaleString()} allocated of {currency}{totalBudget.toLocaleString()}
        {isOver && ' — over budget!'}
      </div>
    </div>
  );
}
