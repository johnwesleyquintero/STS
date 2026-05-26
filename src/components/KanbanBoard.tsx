import React, { useState } from 'react';
import { Ticket, TicketStatus, TicketPriority, TicketType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Tag,
  Search,
  Filter,
  ArrowRightLeft,
  X
} from 'lucide-react';

interface KanbanBoardProps {
  tickets: Ticket[];
  onUpdateStatus: (id: string, status: TicketStatus) => void;
  onSelectTicket: (ticket: Ticket) => void;

  // Lifted state filters
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  selectedTag: string | null;
  setSelectedTag: (val: string | null) => void;
}

export default function KanbanBoard({
  tickets,
  onUpdateStatus,
  onSelectTicket,

  // Subscribe to lifted status filters
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  typeFilter,
  setTypeFilter,
  selectedTag,
  setSelectedTag,
}: KanbanBoardProps) {
  // Active Drag and Drop visual column states
  const [activeOverCol, setActiveOverCol] = useState<TicketStatus | null>(null);

  const columns: { status: TicketStatus; label: string; icon: any; color: string; border: string; bg: string }[] = [
    {
      status: 'Open',
      label: 'Open',
      icon: HelpCircle,
      color: 'text-purple-600 dark:text-purple-400',
      border: 'border-slate-200 dark:border-slate-800/80',
      bg: 'bg-slate-50/40 dark:bg-slate-950/20',
    },
    {
      status: 'In Progress',
      label: 'In Progress',
      icon: PlayCircle,
      color: 'text-blue-600 dark:text-blue-400',
      border: 'border-slate-200 dark:border-slate-800/80',
      bg: 'bg-slate-50/40 dark:bg-slate-950/20',
    },
    {
      status: 'Blocked',
      label: 'Blocked',
      icon: AlertCircle,
      color: 'text-amber-600 dark:text-amber-400',
      border: 'border-slate-200 dark:border-slate-800/80',
      bg: 'bg-slate-50/40 dark:bg-slate-950/20',
    },
    {
      status: 'Done',
      label: 'Done',
      icon: CheckCircle2,
      color: 'text-emerald-500 dark:text-emerald-400',
      border: 'border-slate-200 dark:border-slate-800/80',
      bg: 'bg-emerald-50/10 dark:bg-emerald-950/10',
    },
  ];

  // Styles maps
  const priorityStyles: Record<TicketPriority, { text: string }> = {
    P0: { text: 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40' },
    P1: { text: 'text-blue-700 bg-blue-50 dark:text-blue-350 dark:bg-blue-950/30' },
    P2: { text: 'text-amber-755 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30' },
    P3: { text: 'text-slate-650 bg-slate-105 dark:text-slate-400 dark:bg-slate-900' },
  };

  const typeStyles: Record<TicketType, string> = {
    Task: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-900',
    Ops: 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/40',
    Bug: 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40',
    Lead: 'text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-950/30',
    Catalog: 'text-fuchsia-700 bg-fuchsia-50 dark:text-fuchsia-300 dark:bg-fuchsia-950/30',
    System: 'text-amber-705 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30',
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
    const matchesTag = !selectedTag || t.tags.includes(selectedTag);

    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesTag;
  });

  // Unique tags list
  const uniqueTags = Array.from(new Set(tickets.flatMap((t) => t.tags))).filter(Boolean);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    if (activeOverCol !== status) {
      setActiveOverCol(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Reset if we leave
    setActiveOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TicketStatus) => {
    e.preventDefault();
    setActiveOverCol(null);
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      onUpdateStatus(id, targetStatus);
    }
  };

  // Mobile accessibility shifter helper
  const shiftStatus = (ticket: Ticket, direction: 'left' | 'right') => {
    const statusOrder: TicketStatus[] = ['Open', 'In Progress', 'Blocked', 'Done'];
    const currentIndex = statusOrder.indexOf(ticket.status);
    let newIndex = currentIndex;
    if (direction === 'left' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'right' && currentIndex < statusOrder.length - 1) {
      newIndex = currentIndex + 1;
    }
    if (newIndex !== currentIndex) {
      onUpdateStatus(ticket.id, statusOrder[newIndex]);
    }
  };

  return (
    <div className="space-y-4" id="kanban-wrapper">
      
      {/* Search & filters for Kanban */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-xs p-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="kanban-search-input"
              type="text"
              className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-150 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search Kanban tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer transition-colors"
                title="Clear checking search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selector filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority filter */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-lg px-2.5 py-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Priority</span>
              <select
                id="kanban-priority-select"
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

            {/* Type filter */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-lg px-2.5 py-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Type</span>
              <select
                id="kanban-type-select"
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

        {/* Clickable Quick tags filtering inside Kanban */}
        {uniqueTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto min-h-8 pt-1 border-t border-slate-100 dark:border-slate-850">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
              Tags:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-hide">
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className={`px-2 py-0.5 text-[9px] font-mono leading-none font-bold rounded-full transition-all cursor-pointer ${
                  !selectedTag
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-slate-800 hover:bg-slate-150 border border-slate-205 dark:border-slate-805'
                }`}
              >
                All
              </button>
              {uniqueTags.map((tag) => {
                const isCurrent = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(isCurrent ? null : tag)}
                    className={`px-2 py-0.5 text-[9px] font-mono leading-none font-bold rounded-full transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:bg-slate-105 border border-slate-205 dark:border-slate-805'
                    }`}
                  >
                    <Tag className="w-2 h-2 text-slate-400" />
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Grid containing Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="kanban-board-grid">
        {columns.map((col) => {
          const colTickets = filteredTickets.filter((t) => t.status === col.status);
          const Icon = col.icon;
          const isOver = activeOverCol === col.status;

          return (
            <div
              key={col.status}
              id={`kanban-col-${col.status.toLowerCase().replace(' ', '-')}`}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`rounded-xl border p-4 flex flex-col min-h-[500px] transition-all duration-200 ${
                isOver
                  ? 'bg-blue-50/20 dark:bg-blue-950/20 border-blue-500 ring-2 ring-blue-500/20'
                  : `${col.border} ${col.bg}`
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${col.color}`} />
                  <h3 className="text-sm font-bold text-slate-750 dark:text-slate-100 tracking-tight font-display">{col.label}</h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 px-2.5 py-0.5 rounded-full shadow-2xs">
                  {colTickets.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="flex-1 space-y-3 overflow-y-auto min-h-72" id={`kanban-cards-${col.status.toLowerCase()}`}>
                <AnimatePresence initial={false}>
                  {colTickets.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-32 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center justify-center p-6 text-center text-[11px] text-slate-400/80 font-mono"
                    >
                      Drag tickets here
                    </motion.div>
                  ) : (
                    colTickets.map((ticket) => (
                      <motion.div
                        key={ticket.id}
                        id={`kanban-card-${ticket.id}`}
                        layoutId={`card-${ticket.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ticket.id)}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={{ y: -3, scale: 1.015, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.04)" }}
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                        className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl shadow-2xs hover:border-blue-600/30 dark:hover:border-blue-500/40 transition-shadow duration-100 group relative break-inside-avoid cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            {/* ID */}
                            <span
                              onClick={() => onSelectTicket(ticket)}
                              className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-blue-600 cursor-pointer transition-colors"
                            >
                              {ticket.id}
                            </span>

                            {/* Type */}
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border border-transparent ${typeStyles[ticket.type]}`}>
                              {ticket.type}
                            </span>
                          </div>

                          {/* Priority */}
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-transparent ${priorityStyles[ticket.priority].text}`}>
                            {ticket.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <p
                          onClick={() => onSelectTicket(ticket)}
                          className="text-xs font-bold text-slate-850 dark:text-slate-150 mt-2.5 line-clamp-2 leading-relaxed cursor-pointer group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                        >
                          {ticket.title}
                        </p>

                        {/* Tags list */}
                        {ticket.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {ticket.tags.slice(0, 3).map((tag, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTag(tag);
                                }}
                                className="inline-flex items-center gap-1 text-[8px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-805 px-1.5 py-0.5 rounded transition-all hover:bg-slate-100"
                              >
                                <Tag className="w-1.5 h-1.5 text-slate-400" />
                                {tag}
                              </button>
                            ))}
                            {ticket.tags.length > 3 && (
                              <span className="text-[8px] font-mono font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-1 py-0.5 rounded">
                                +{ticket.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Accessibility Buttons / Timestamp */}
                        <div className="mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              id={`card-left-btn-${ticket.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                shiftStatus(ticket, 'left');
                              }}
                              disabled={col.status === 'Open'}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-30 cursor-pointer text-slate-400"
                              title="Move Left"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`card-right-btn-${ticket.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                shiftStatus(ticket, 'right');
                              }}
                              disabled={col.status === 'Done'}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-30 cursor-pointer text-slate-400"
                              title="Move Right"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
