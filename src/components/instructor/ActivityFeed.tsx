'use client';

import { useEffect, useRef } from 'react';

interface FeedEvent {
  type: string;
  team: string;
  message: string;
  time: Date;
}

interface ActivityFeedProps {
  events: FeedEvent[];
}

const TEAM_COLOR_MAP: Record<string, string> = {
  'The Pivots': '#378ADD',
  'Data Drivers': '#1D9E75',
  'Growth Lab': '#D85A30',
  'Signal & Noise': '#7F77DD',
};

function formatTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function eventIcon(type: string): string {
  switch (type) {
    case 'vote':
      return '\u2713';
    case 'lock':
      return '\u26BF';
    case 'join':
      return '+';
    default:
      return '\u2022';
  }
}

export default function ActivityFeed({ events }: ActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-[#D1D9D4] bg-white p-6 text-center text-[#718096]">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#D1D9D4] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[#D1D9D4]">
        <h3 className="text-sm font-semibold text-[#4A5568]">Activity Feed</h3>
      </div>

      <div
        ref={scrollRef}
        className="max-h-80 overflow-y-auto p-2 space-y-1"
      >
        {events.map((event, i) => {
          const color = TEAM_COLOR_MAP[event.team] || '#666';
          return (
            <div
              key={i}
              className="flex items-start gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#EEF2EF] transition-colors animate-fade-in"
            >
              <span className="text-[10px] text-[#718096] font-mono mt-0.5 flex-shrink-0 w-16">
                {formatTime(event.time)}
              </span>
              <span
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-[#718096] flex-shrink-0 w-4 text-center mt-0.5">
                {eventIcon(event.type)}
              </span>
              <span className="text-sm text-[#4A5568]">{event.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
