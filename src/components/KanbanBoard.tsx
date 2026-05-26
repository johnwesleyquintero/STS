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
  X,
  Copy,
  Download,
  Check,
  Link
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleExportToCSV = () => {
    const ticketsToExport = filteredTickets;
    if (ticketsToExport.length === 0) return;

    const headers = ['ID', 'Title', 'Type', 'Priority', 'Status', 'Notes', 'Tags', 'Source', 'CreatedAt', 'UpdatedAt'];
    const csvContent = [
      headers.join(','),
      ...ticketsToExport.map(t => [
        t.id,
        t.title,
        t.type,
        t.priority,
        t.status,
        t.notes || '',
        t.tags.join('; '),
        t.source,
        t.createdAt,
        t.updatedAt,
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tickets_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    P1: { text: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/30' },
    P2: { text: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30' },
    P3: { text: 'text-slate-650 bg-slate-105 dark:text-slate-400 dark:bg-slate-900' },
  };

  const typeStyles: Record<TicketType, string> = {
    Task: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-900',
    Ops: 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/40',
    Bug: 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40',
    Lead: 'text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-950/30',
    Catalog: 'text-fuchsia-700 bg-fuchsia-50 dark:text-fuchsia-300 dark:bg-fuchsia-950/30',
    System: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30',
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
              placeholder="Search Kanban tickets... (Press '/' or ⌘K to focus)"
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
                <option value="All" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">All Priorities</option>
                <option value="P0" className="bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 font-semibold">P0 - Critical</option>
                <option value="P1" className="bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-semibold">P1 - Active</option>
                <option value="P2" className="bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 font-semibold">P2 - Backlog</option>
                <option value="P3" className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold">P3 - Optional</option>
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
                <option value="All" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">All Types</option>
                <option value="Task" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold">Task</option>
                <option value="Ops" className="bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-semibold">Ops</option>
                <option value="Bug" className="bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 font-semibold">Bug</option>
                <option value="Lead" className="bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 font-semibold">Lead</option>
                <option value="Catalog" className="bg-white dark:bg-slate-900 text-fuchsia-700 dark:text-fuchsia-300 font-semibold">Catalog</option>
                <option value="System" className="bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 font-semibold">System</option>
              </select>
            </div>

            {/* Export CSV Button */}
            <button
              id="kanban-export-csv-btn"
              onClick={handleExportToCSV}
              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-3xs"
              title="Export visible Kanban tickets to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV</span>
            </button>
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
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-100 tracking-tight font-display">{col.label}</h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-0.5 rounded-full shadow-2xs">
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
                            {/* ID & Copy Button */}
                            <div className="flex items-center gap-1 group/kbid" onClick={(e) => e.stopPropagation()}>
                              <span
                                onClick={() => onSelectTicket(ticket)}
                                className="font-mono text-[10px] font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                                title="Click to view ticket details"
                              >
                                {ticket.id}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(ticket.id);
                                  setCopiedId(ticket.id);
                                  setTimeout(() => setCopiedId(null), 1500);
                                }}
                                className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-blue-650 dark:text-slate-500 dark:hover:text-blue-450 opacity-60 hover:opacity-100 transition-all cursor-pointer"
                                title="Copy Ticket ID to Clipboard"
                              >
                                {copiedId === ticket.id ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </div>

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

                        {/* Dependencies count on Kanban card */}
                        {ticket.dependencies && ticket.dependencies.length > 0 && (() => {
                          const totalDeps = ticket.dependencies.length;
                          const incompleteDeps = ticket.dependencies.filter(depId => {
                            const t = tickets.find(x => x.id === depId);
                            return t && t.status !== 'Done';
                          });
                          const isBlocked = incompleteDeps.length > 0;
                          return (
                            <div 
                              className={`mt-2 flex items-center gap-1 w-fit px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all ${
                                isBlocked 
                                  ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400' 
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400'
                              }`}
                              title={`Depends on: ${ticket.dependencies.join(', ')}. ${isBlocked ? `Incomplete blockers: ${incompleteDeps.join(', ')}` : 'All blockers resolved!'}`}
                            >
                              <Link className="w-2 h-2 shrink-0" />
                              <span>{isBlocked ? `Blocked (${incompleteDeps.length}/${totalDeps})` : `Ready (${totalDeps}/${totalDeps})`}</span>
                            </div>
                          );
                        })()}

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
