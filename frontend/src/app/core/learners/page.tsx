'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { learnersService, type LearnerSummary } from '@/services/api';
import { getAuthSession } from '@/lib/authHelper';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function LearnersDirectoryPage() {
  const session = getAuthSession();
  const isCrew = session.role === 'crew';
  const [learners, setLearners] = useState<LearnerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [roleFilter, setRoleFilter] = useState<'all' | 'CREW' | 'ENTHUSIAST'>('all');
  const [moduleFilterType, setModuleFilterType] = useState<'all' | 'above' | 'below'>('all');
  const [moduleFilterValue, setModuleFilterValue] = useState<number>(3);

  useEffect(() => {
    const fetchLearners = async () => {
      try {
        setLoading(true);
        const data = await learnersService.getLearners();
        setLearners(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load learners');
      } finally {
        setLoading(false);
      }
    };
    fetchLearners();
  }, []);

  const filteredLearners = learners.filter((learner) => {
    const matchesSearch =
      learner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learner.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === 'all' || learner.role === roleFilter;

    let matchesModules = true;
    if (moduleFilterType === 'above') {
      matchesModules = learner.completedModulesCount >= moduleFilterValue;
    } else if (moduleFilterType === 'below') {
      matchesModules = learner.completedModulesCount <= moduleFilterValue;
    }

    return matchesSearch && matchesRole && matchesModules;
  });

  const totalModulesCount =
    learners.length > 0 ? learners[0].totalModulesCount : 0;

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-800 overflow-hidden font-sans">

      {/* HEADER */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 select-none">
        <div className="flex items-center gap-6 h-full text-xs font-bold">
          {!isCrew && (
            <Link
              href="/core/topics"
              className="transition-all duration-150 h-full flex items-center px-1 border-b-2 text-slate-400 border-transparent hover:text-slate-700"
            >
              Roadmap Builder
            </Link>
          )}
          <Link
            href="/core/learners"
            className="transition-all duration-150 h-full flex items-center px-1 border-b-2 text-indigo-650 font-extrabold border-indigo-600"
          >
            Learners Directory
          </Link>
        </div>

        <div className="relative w-72 flex-shrink-0">
          <input
            type="text"
            placeholder="Search learner name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-850 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
          />
          <Icons.Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-450" />
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* FILTERS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block font-heading mr-1">
                Role Filter:
              </span>
              {[
                { id: 'all', label: 'All Learners', color: 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100' },
                { id: 'CREW', label: 'Crew Members', color: 'border-amber-100 text-amber-700 bg-amber-50/50 hover:bg-amber-50' },
                { id: 'ENTHUSIAST', label: 'Learners', color: 'border-indigo-100 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50' },
              ].map((tab) => {
                const active = roleFilter === tab.id;
                const count =
                  tab.id === 'all'
                    ? learners.length
                    : learners.filter((l) => l.role === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setRoleFilter(tab.id as any)}
                    className={cn(
                      "px-3 py-1.5 border rounded-xl text-xs font-black transition-all flex items-center gap-2 font-heading shadow-xs",
                      active
                        ? tab.id === 'all'
                          ? "bg-slate-900 border-slate-900 text-white"
                          : tab.id === 'CREW'
                            ? "bg-amber-600 border-amber-600 text-white"
                            : "bg-indigo-600 border-indigo-600 text-white"
                        : tab.color
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-[9px] font-bold border",
                      active
                        ? "bg-white/20 border-white/10 text-white"
                        : "bg-white border-slate-200 text-slate-500"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-slate-450 font-extrabold text-[10px] uppercase tracking-wider block font-heading">
                Module Completion:
              </span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={moduleFilterType}
                    onChange={(e) => setModuleFilterType(e.target.value as 'all' | 'above' | 'below')}
                    className="bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-800 font-extrabold focus:bg-white focus:outline-none cursor-pointer appearance-none"
                  >
                    <option value="all">Any count completed</option>
                    <option value="above">Completed modules &gt;=</option>
                    <option value="below">Completed modules &lt;=</option>
                  </select>
                  <Icons.ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>

                {moduleFilterType !== 'all' && (
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={moduleFilterValue}
                    onChange={(e) => setModuleFilterValue(Number(e.target.value))}
                    className="w-14 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 text-center font-extrabold focus:bg-white focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Total Learners', value: learners.length, icon: Icons.Users, color: 'text-indigo-650 bg-white border-slate-200 shadow-sm' },
            { label: 'Total Modules', value: totalModulesCount, icon: Icons.Layers, color: 'text-emerald-600 bg-white border-slate-200 shadow-sm' },
          ].map((stat, idx) => (
            <div key={idx} className={cn("border rounded-2xl p-4 flex items-center justify-between", stat.color)}>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-450 block tracking-wider font-heading">
                  {stat.label}
                </span>
                <span className="text-xl font-black text-slate-850 block">
                  {stat.value}
                </span>
              </div>
              <stat.icon className="w-8 h-8 opacity-45" />
            </div>
          ))}
        </div>

        {/* TABLE */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-450 bg-slate-50/50">
                  <th className="py-4 px-6">Learner Account</th>
                  <th className="py-4 px-6 text-center">XP</th>
                  <th className="py-4 px-6">Current Topic</th>
                  <th className="py-4 px-6 text-center">Current Level</th>
                  <th className="py-4 px-6 text-center">Current Module</th>
                  <th className="py-4 px-6 text-center">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 text-xs italic">
                      Loading learners...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-rose-400 text-xs italic">
                      {error}
                    </td>
                  </tr>
                ) : filteredLearners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 text-xs italic">
                      No matching learners found.
                    </td>
                  </tr>
                ) : (
                  filteredLearners.map((learner) => {
                    const isCrew = learner.role === 'CREW';
                    const isComplete = learner.isPlatformComplete;

                    const rowBg = isComplete
                      ? "bg-emerald-50/60 hover:bg-emerald-50"
                      : isCrew
                        ? "bg-amber-50/40 hover:bg-amber-50/70"
                        : "hover:bg-slate-50";

                    const avatarBg = isComplete
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : isCrew
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-indigo-50 text-indigo-650 border-indigo-100";

                    const nameColor = isComplete
                      ? "text-emerald-800"
                      : "text-slate-800";

                    return (
                      <tr
                        key={learner.id}
                        className={cn("transition-colors", rowBg)}
                      >
                        {/* Name, Email & Badge */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3.5">
                            <div className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border flex-shrink-0",
                              avatarBg
                            )}>
                              {getInitials(learner.name)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-extrabold transition-colors",
                                  nameColor
                                )}>
                                  {learner.name}
                                </span>
                                {isCrew && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black bg-amber-100 text-amber-700 border border-amber-200 uppercase leading-none">
                                    Crew
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-400 text-[10px] block mt-0.5 font-bold">
                                {learner.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* XP */}
                        <td className="py-4 px-6 text-center">
                          <span className="text-amber-600 font-black">
                            {learner.xp}
                          </span>
                        </td>

                        {/* Current Topic */}
                        <td className="py-4 px-6">
                          <span className="text-slate-600 font-semibold">
                            {learner.currentTopic ?? '—'}
                          </span>
                        </td>

                        {/* Current Level */}
                        <td className="py-4 px-6 text-center">
                          {learner.currentLevel ? (
                            <span className={cn(
                              "px-2.5 py-1 rounded-xl text-[9px] font-black border uppercase tracking-wider whitespace-nowrap",
                              learner.currentLevel === 'BEGINNER'
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : learner.currentLevel === 'INTERMEDIATE'
                                  ? "bg-cyan-50 text-cyan-600 border-cyan-100"
                                  : "bg-indigo-50 text-indigo-650 border-indigo-100"
                            )}>
                              {learner.currentLevel}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[9px] font-bold">—</span>
                          )}
                        </td>

                        {/* Current Module */}
                        <td className="py-4 px-6 text-center">
                          <span className="text-slate-600 font-semibold">
                            {learner.currentModuleName ?? (isComplete ? 'Completed' : '—')}
                          </span>
                          {learner.currentModuleOrder !== null && (
                            <span className="text-slate-400 text-[9px] block mt-0.5 font-bold">
                              #{learner.currentModuleOrder + 1}
                            </span>
                          )}
                        </td>

                        {/* Progress */}
                        <td className="py-4 px-6 text-center">
                          <span className={cn(
                            "font-black",
                            isComplete ? "text-emerald-600" : "text-slate-600"
                          )}>
                            {learner.completedModulesCount} / {learner.totalModulesCount}
                          </span>
                          {isComplete && (
                            <span className="ml-1.5 inline-flex items-center text-[8px] font-black text-emerald-600 bg-emerald-100 border border-emerald-200 rounded-md px-1.5 py-0.5 uppercase">
                              Complete
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
