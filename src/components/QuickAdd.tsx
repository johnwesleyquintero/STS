import React, { useState } from 'react';
import { TicketType, TicketPriority } from '../types';
import { Plus, Zap } from 'lucide-react';

interface QuickAddProps {
  onAddTicket: (title: string, type: TicketType, priority: TicketPriority) => void;
}

export default function QuickAdd({ onAddTicket }: QuickAddProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TicketType>('Task');
  const [priority, setPriority] = useState<TicketPriority>('P1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTicket(title.trim(), type, priority);
    setTitle('');
  };

  const types: TicketType[] = ['Task', 'Ops', 'Bug', 'Lead', 'Catalog', 'System'];
  const priorities: { value: TicketPriority; label: string; class: string }[] = [
    { value: 'P0', label: 'P0 Critical', class: 'bg-rose-50 text-rose-700 hover:bg-rose-150 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900' },
    { value: 'P1', label: 'P1 Active', class: 'bg-sky-50 text-sky-700 hover:bg-sky-150 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900' },
    { value: 'P2', label: 'P2 Backlog', class: 'bg-amber-50 text-amber-700 hover:bg-amber-150 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900' },
    { value: 'P3', label: 'P3 Optional', class: 'bg-zinc-50 text-zinc-700 hover:bg-zinc-150 border-zinc-200 dark:bg-zinc-950/30 dark:text-zinc-300 dark:border-zinc-900' },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      id="quick-add-form"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl shadow-sm mb-6 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight font-display">Quick Ticket Capture</h3>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            id="quick-add-title-input"
            type="text"
            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
            placeholder="What needs to be done? Press Enter to capture instantly..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-2 md:self-stretch">
            {/* Type Selector Pill */}
            <select
              id="quick-add-type-select"
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
              value={type}
              onChange={(e) => setType(e.target.value as TicketType)}
            >
              {types.map((t) => (
                <option key={t} value={t} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  Type: {t}
                </option>
              ))}
            </select>

            {/* Priortiy Indicator selector */}
            <div className="flex items-center gap-1 border border-slate-150 dark:border-slate-800 rounded-lg p-1 bg-slate-50/50 dark:bg-slate-950/50">
              {priorities.map((p) => {
                const isSelected = priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all ${
                      isSelected
                        ? p.class
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {p.value}
                  </button>
                );
              })}
            </div>

            <button
              id="quick-add-submit-btn"
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Capture
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
