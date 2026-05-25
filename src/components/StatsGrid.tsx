import React from 'react';
import { Ticket } from '../types';
import { AlertCircle, PlayCircle, ShieldAlert, CheckCircle2, Inbox } from 'lucide-react';

interface StatsGridProps {
  tickets: Ticket[];
}

export default function StatsGrid({ tickets }: StatsGridProps) {
  const total = tickets.length;
  const p0Count = tickets.filter(t => t.priority === 'P0' && t.status !== 'Done').length;
  const activeCount = tickets.filter(t => t.status === 'In Progress').length;
  const blockedCount = tickets.filter(t => t.status === 'Blocked').length;
  const doneCount = tickets.filter(t => t.status === 'Done').length;

  const stats = [
    {
      id: 'stat-total',
      label: 'Queue Size',
      value: total,
      icon: Inbox,
      color: 'text-slate-700 dark:text-slate-355',
      bgColor: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80',
    },
    {
      id: 'stat-p0',
      label: 'P0 Critical',
      value: p0Count,
      icon: ShieldAlert,
      color: p0Count > 0 ? 'text-red-650 dark:text-red-400 font-bold animate-pulse' : 'text-slate-400/80',
      bgColor: p0Count > 0 ? 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-950/60' : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800/60',
    },
    {
      id: 'stat-progress',
      label: 'In Progress',
      value: activeCount,
      icon: PlayCircle,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-150/80 dark:border-blue-900/40',
    },
    {
      id: 'stat-blocked',
      label: 'Blocked',
      value: blockedCount,
      icon: AlertCircle,
      color: blockedCount > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-400/800',
      bgColor: blockedCount > 0 ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-950/50' : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800/60',
    },
    {
      id: 'stat-done',
      label: 'Done',
      value: doneCount,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/15 border-emerald-150/70 dark:border-emerald-900/30',
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
            className={`p-4 rounded-xl border ${stat.bgColor} flex items-center justify-between transition-all duration-200 shadow-sm`}
          >
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 tracking-tight font-display ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-950/50 border border-slate-100/50 dark:border-slate-850/50`}>
              <Icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
