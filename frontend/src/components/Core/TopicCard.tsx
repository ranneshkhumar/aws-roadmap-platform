'use client';

import React from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TopicData } from '@/services/api';

interface TopicCardProps {
  topic: TopicData;
  onEdit: (topic: TopicData) => void;
  onDelete: (topic: TopicData) => void;
}

const levelColorMap: Record<string, string> = {
  BEGINNER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INTERMEDIATE: 'bg-amber-50 text-amber-700 border-amber-200',
  ADVANCED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function TopicCard({ topic, onEdit, onDelete }: TopicCardProps) {
  const beginnerCount = topic.modules.filter((m) => m.level === 'BEGINNER').length;
  const intermediateCount = topic.modules.filter((m) => m.level === 'INTERMEDIATE').length;
  const advancedCount = topic.modules.filter((m) => m.level === 'ADVANCED').length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Link href={`/core/topics/${topic.id}/roadmap`} className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-slate-900 font-heading tracking-tight truncate group-hover:text-indigo-600 transition-colors">
              {topic.name}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-semibold">
              {topic.description || 'No description provided.'}
            </p>
          </Link>
          <button
            onClick={() => onEdit(topic)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0 ml-2"
          >
            <Icons.Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(topic)}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors flex-shrink-0"
          >
            <Icons.Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-heading">
            {topic.modules.length} Modules
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {beginnerCount > 0 && (
            <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-md border font-heading", levelColorMap['BEGINNER'])}>
              {beginnerCount} Beginner
            </span>
          )}
          {intermediateCount > 0 && (
            <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-md border font-heading", levelColorMap['INTERMEDIATE'])}>
              {intermediateCount} Intermediate
            </span>
          )}
          {advancedCount > 0 && (
            <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-md border font-heading", levelColorMap['ADVANCED'])}>
              {advancedCount} Advanced
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50 flex items-center justify-between">
        <Link
          href={`/core/topics/${topic.id}/roadmap`}
          className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 font-heading"
        >
          Open Builder
          <Icons.ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
