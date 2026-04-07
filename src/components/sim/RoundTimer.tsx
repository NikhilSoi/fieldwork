'use client';

import { useState, useEffect } from 'react';

interface RoundTimerProps {
  durationMinutes: number;
}

export default function RoundTimer({ durationMinutes }: RoundTimerProps) {
  const totalSeconds = durationMinutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining <= 0]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const pct = remaining / totalSeconds;
  let color: string;
  let pulse = false;

  if (remaining < 60) {
    color = '#DC2626';
    pulse = true;
  } else if (pct < 0.25) {
    color = '#DC2626';
  } else if (pct < 0.5) {
    color = '#D97706';
  } else {
    color = '#718096';
  }

  return (
    <span
      className={`font-mono-data text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${pulse ? 'animate-pulse' : ''}`}
      style={{ color, backgroundColor: `${color}15` }}
    >
      {display}
    </span>
  );
}
