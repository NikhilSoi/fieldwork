'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import type { Option } from '@/lib/decisions';

interface Props {
  options: Option[];
  onRankingChange: (ranking: number[]) => void;
}

export default function HypothesisRanking({ options, onRankingChange }: Props) {
  const [ranking, setRanking] = useState<number[]>(options.map((_, i) => i));

  useEffect(() => {
    onRankingChange(ranking);
  }, [ranking, onRankingChange]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const next = [...ranking];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setRanking(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-[#718096] font-medium uppercase tracking-wider mb-1">
        Drag to rank from most likely to least likely
      </p>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="hypotheses">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-2">
              {ranking.map((optIdx, position) => (
                <Draggable key={optIdx} draggableId={String(optIdx)} index={position}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-all ${
                        snapshot.isDragging
                          ? 'bg-[#E8F5F1] border-[#3A9E82] shadow-lg'
                          : 'bg-white border-[#D1D9D4] hover:border-[#3A9E82]/50'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        position === 0 ? 'bg-[#3A9E82] text-white' : 'bg-[#EEF2EF] text-[#718096]'
                      }`}>
                        {position + 1}
                      </span>
                      <span className="text-[#0B1F35] font-medium">{options[optIdx].label}</span>
                      <svg className="ml-auto w-4 h-4 text-[#A8B8B0] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
