import React from 'react';
import { Ticket } from '../types';
import { AlertCircle, PlayCircle, ShieldAlert, CheckCircle2, Inbox } from 'lucide-react';

interface StatsGridProps {
  tickets: Ticket[];
  statusFilter?: string;
  setStatusFilter?: (val: string) => void;
  priorityFilter?: string;
  setPriorityFilter?: (val: string) => void;
  setTypeFilter?: (val: string) => void;
  setSelectedTag?: (val: string | null) => void;
  setSearchTerm?: (val: string) => void;
}

export default function StatsGrid({
  tickets,
  statusFilter = 'All',
  setStatusFilter,
  priorityFilter = 'All',
  setPriorityFilter,
  setTypeFilter,
  setSelectedTag,
  setSearchTerm,
}: StatsGridProps) {
  const total = tickets.length;
  const p0Count = tickets.filter(t => t.priority === 'P0' && t.status !== 'Done').length;
  const activeCount = tickets.filter(t => t.status === 'In Progress').length;
  const blockedCount = tickets.filter(t => t.status === 'Blocked').length;
  const doneCount = tickets.filter(t => t.status === 'Done').length;

  const isFilterActive = 
    statusFilter !== 'All' || 
    priorityFilter !== 'All';

  // Determine active states for each metric card
  const isTotalActive = !isFilterActive;
  const isP0Active = priorityFilter === 'P0';
  const isProgressActive = statusFilter === 'In Progress';
  const isBlockedActive = statusFilter === 'Blocked';
  const isDoneActive = statusFilter === 'Done';

  const clearAllFilters = () => {
    if (setStatusFilter) setStatusFilter('All');
    if (setPriorityFilter) setPriorityFilter('All');
    if (setTypeFilter) setTypeFilter('All');
    if (setSelectedTag) setSelectedTag(null);
    if (setSearchTerm) setSearchTerm('');
  };

  const handleCardClick = (id: string) => {
    if (!setStatusFilter || !setPriorityFilter) return;

    switch (id) {
      case 'stat-total':
        clearAllFilters();
        break;
      case 'stat-p0':
        if (isP0Active) {
          setPriorityFilter('All');
        } else {
          setPriorityFilter('P0');
          setStatusFilter('All'); // Show all statuses for P0
        }
        break;
      case 'stat-progress':
        if (isProgressActive) {
          setStatusFilter('All');
        } else {
          setStatusFilter('In Progress');
          setPriorityFilter('All'); // Show all priority in Progress
        }
        break;
      case 'stat-blocked':
        if (isBlockedActive) {
          setStatusFilter('All');
        } else {
          setStatusFilter('Blocked');
          setPriorityFilter('All');
        }
        break;
      case 'stat-done':
        if (isDoneActive) {
          setStatusFilter('All');
        } else {
          setStatusFilter('Done');
          setPriorityFilter('All');
        }
        break;
    }
  };

  const stats = [
    {
      id: 'stat-total',
      label: 'Queue Size',
      value: total,
      isActive: isTotalActive,
      icon: Inbox,
      color: 'text-slate-700 dark:text-slate-300',
      bgColor: isTotalActive
        ? 'bg-slate-50 dark:bg-slate-900 border-slate-350 dark:border-slate-700 ring-2 ring-slate-400/10'
        : 'bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-900 opacity-80',
    },
    {
      id: 'stat-p0',
      label: 'P0 Critical',
      value: p0Count,
      isActive: isP0Active,
      icon: ShieldAlert,
      color: p0Count > 0 ? 'text-rose-650 dark:text-rose-400 font-bold' : 'text-slate-400 dark:text-slate-505',
      bgColor: isP0Active
        ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
        : p0Count > 0
        ? 'bg-rose-50/10 dark:bg-rose-950/5 border-rose-250 dark:border-rose-950/30'
        : 'bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-900 opacity-80',
    },
    {
      id: 'stat-progress',
      label: 'In Progress',
      value: activeCount,
      isActive: isProgressActive,
      icon: PlayCircle,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: isProgressActive
        ? 'bg-blue-50 dark:bg-blue-950/35 border-blue-500 ring-2 ring-blue-500/25 shadow-xs'
        : 'bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-900 opacity-80',
    },
    {
      id: 'stat-blocked',
      label: 'Blocked',
      value: blockedCount,
      isActive: isBlockedActive,
      icon: AlertCircle,
      color: blockedCount > 0 ? 'text-amber-600 dark:text-amber-450 font-semibold' : 'text-slate-400 dark:text-slate-505',
      bgColor: isBlockedActive
        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/25 shadow-xs'
        : 'bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-900 opacity-80',
    },
    {
      id: 'stat-done',
      label: 'Done',
      value: doneCount,
      isActive: isDoneActive,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: isDoneActive
        ? 'bg-emerald-50 dark:bg-emerald-950/25 border-emerald-500 ring-2 ring-emerald-500/25 shadow-xs'
        : 'bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-900 opacity-80',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6" id="sts-stats-grid">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            id={stat.id}
            onClick={() => handleCardClick(stat.id)}
            className={`p-4 rounded-xl border ${stat.bgColor} flex items-center justify-between transition-all duration-200 shadow-3xs cursor-pointer hover:scale-[1.015] hover:shadow-xs hover:opacity-100 select-none`}
            title={stat.isActive ? "Click to toggle filter off" : `Filter by ${stat.label}`}
          >
            <div className="min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                  {stat.label}
                </p>
                {stat.isActive && stat.id !== 'stat-total' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse flex-shrink-0" />
                )}
              </div>
              <p className={`text-2xl font-bold mt-1 tracking-tight font-display ${stat.color}`}>
                {stat.value}
              </p>
            </div>
            <div className={`p-2.5 rounded-lg ${
              stat.isActive 
                ? 'bg-white/80 dark:bg-slate-900 shadow-3xs border border-slate-105 dark:border-slate-800' 
                : 'bg-slate-50/50 dark:bg-slate-900/30'
            } transition-colors flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
