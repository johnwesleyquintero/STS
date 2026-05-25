import React, { useState } from 'react';
import { Ticket, TicketType, TicketPriority, TicketStatus } from '../types';
import { Search, Filter, ShieldAlert, AlertCircle, PlayCircle, CheckCircle2, ChevronRight, Tag, HelpCircle, FileClock } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onUpdateStatus: (id: string, status: TicketStatus) => void;
}

export default function TicketList({ tickets, onSelectTicket, onUpdateStatus }: TicketListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Priority mapping color classes
  const priorityStyles: Record<TicketPriority, { text: string, bg: string, border: string }> = {
    P0: { text: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-100/80 dark:border-rose-900/40' },
    P1: { text: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50/70 dark:bg-blue-950/30', border: 'border-blue-100/80 dark:border-blue-900/40' },
    P2: { text: 'text-amber-750 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-100/85 dark:border-amber-900/40' },
    P3: { text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900', border: 'border-slate-200 dark:border-slate-800' },
  };

  // Status mapping colors/icons
  const statusConfig: Record<TicketStatus, { icon: any, color: string }> = {
    'Open': { icon: HelpCircle, color: 'text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900' },
    'In Progress': { icon: PlayCircle, color: 'text-blue-600 border-blue-150 bg-blue-50/60 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900' },
    'Blocked': { icon: AlertCircle, color: 'text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60' },
    'Done': { icon: CheckCircle2, color: 'text-emerald-600 border-emerald-150 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900' },
  };

  // Type color mappings
  const typeStyles: Record<TicketType, string> = {
    Task: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-350 border-slate-200 dark:border-slate-800',
    Ops: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-150 dark:border-indigo-900/60',
    Bug: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-150 dark:border-rose-900/60',
    Lead: 'bg-teal-50 text-teal-750 dark:bg-teal-950/30 dark:text-teal-300 border-teal-150 dark:border-teal-900/60',
    Catalog: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-300 border-fuchsia-150 dark:border-fuchsia-900/60',
    System: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border-amber-150 dark:border-amber-900/60',
  };

  // Perform filtering
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchesType = typeFilter === 'All' || t.type === typeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  // Sorting logic:
  // Active tickets sorted by Priority (P0 -> P3).
  // Within same priority, sorted by Updated At (newest first).
  // Done tickets always sorted last, by Updated At (newest first).
  const priorityWeight = { P0: 0, P1: 1, P2: 2, P3: 3 };

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const aIsDone = a.status === 'Done';
    const bIsDone = b.status === 'Done';

    if (aIsDone && !bIsDone) return 1;
    if (!aIsDone && bIsDone) return -1;

    if (!aIsDone && !bIsDone) {
      // Sort by priority weight
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[a.priority] - priorityWeight[b.priority];
      }
    }

    // Sort by Updated At descending
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const uniqueTags = Array.from(new Set(tickets.flatMap((t) => t.tags)));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden" id="ticket-queue-pane">
      {/* Search & Filters bar */}
      <div className="p-4 border-b border-slate-150 dark:border-slate-800/85 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            id="ticket-search-input"
            type="text"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs text-slate-800 dark:text-slate-150 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            placeholder="Search by ID, title, tags, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2" id="queue-filter-bar">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-lg px-2.5 py-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</span>
            <select
              id="filter-status-select"
              className="bg-transparent text-xs text-slate-700 dark:text-slate-300 outline-hidden font-bold border-0 py-0.5 cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Done">Done</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-lg px-2.5 py-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pri</span>
            <select
              id="filter-priority-select"
              className="bg-transparent text-xs text-slate-700 dark:text-slate-300 outline-hidden font-bold border-0 py-0.5 cursor-pointer"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="P0">P0 - Critical</option>
              <option value="P1">P1 - Active</option>
              <option value="P2">P2 - Backlog</option>
              <option value="P3">P3 - Optional</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-lg px-2.5 py-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Type</span>
            <select
              id="filter-type-select"
              className="bg-transparent text-xs text-slate-700 dark:text-slate-300 outline-hidden font-bold border-0 py-0.5 cursor-pointer"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Task">Task</option>
              <option value="Ops">Ops</option>
              <option value="Bug">Bug</option>
              <option value="Lead">Lead</option>
              <option value="Catalog">Catalog</option>
              <option value="System">System</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket List Viewport */}
      {sortedTickets.length === 0 ? (
        <div className="p-12 text-center bg-slate-50/20 dark:bg-slate-950/20" id="empty-tickets-view">
          <p className="text-slate-400 text-sm font-semibold">No tickets found matching current query.</p>
          <p className="text-slate-500 text-xs mt-1.5">Try resetting filters or use Quick Capture above to add one.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-850/80" id="queue-body-rows">
          {sortedTickets.map((ticket) => {
            const priorityInfo = priorityStyles[ticket.priority];
            const statusInfo = statusConfig[ticket.status];
            const StatusIcon = statusInfo.icon;
            const isDone = ticket.status === 'Done';

            return (
              <div
                key={ticket.id}
                id={`ticket-row-${ticket.id}`}
                className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all group ${
                  isDone ? 'opacity-65 dark:opacity-50' : ''
                }`}
              >
                {/* ID, Type & Title Area */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Quick toggle check status */}
                  <button
                    id={`row-status-toggle-${ticket.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(ticket.id, isDone ? 'Open' : 'Done');
                    }}
                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shadow-2xs cursor-pointer ${
                      isDone
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                        : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0 flex-1" onClick={() => onSelectTicket(ticket)}>
                    <div className="flex flex-wrap items-center gap-2 cursor-pointer">
                      {/* Ticket Key ID */}
                      <span className="font-mono text-xs font-bold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {ticket.id}
                      </span>

                      {/* Type Category Tag */}
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${typeStyles[ticket.type]}`}>
                        {ticket.type}
                      </span>

                      {/* Priority Tag */}
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}>
                        {ticket.priority}
                      </span>
                    </div>

                    {/* Title Text */}
                    <h4 className={`text-sm font-bold text-slate-800 dark:text-slate-100 mt-1.5 cursor-pointer leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${
                      isDone ? 'line-through text-slate-400' : ''
                    }`}>
                      {ticket.title}
                    </h4>

                    {/* Tags and timestamp list */}
                    {(ticket.tags.length > 0 || ticket.notes) && (
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        {ticket.tags.map((tag, i) => (
                          <span
                            key={`${tag}-${i}`}
                            className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-800/60"
                          >
                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                            {tag}
                          </span>
                        ))}
                        {ticket.notes && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/40 px-2 py-0.5 rounded border border-dotted border-slate-200 dark:border-slate-800 max-w-[200px] truncate">
                            {ticket.notes}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Indicator, Last Updated, Actions Area */}
                <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 dark:border-slate-800/80 pt-2.5 md:pt-0">
                  {/* Date updated indicator */}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <FileClock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                  </div>

                  {/* Status Dropdown selector */}
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border leading-none flex items-center gap-1.5 ${statusInfo.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <select
                        id={`row-status-select-${ticket.id}`}
                        className="bg-transparent text-xs font-bold outline-hidden border-0 py-0 cursor-pointer pr-1"
                        value={ticket.status}
                        onChange={(e) => onUpdateStatus(ticket.id, e.target.value as TicketStatus)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>

                    {/* Open drawer chevron helper */}
                    <button
                      id={`row-details-btn-${ticket.id}`}
                      onClick={() => onSelectTicket(ticket)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-305 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 grid place-items-center transition-colors cursor-pointer"
                      title="Open Ticket Editor"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
