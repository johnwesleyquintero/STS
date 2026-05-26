import React, { useState, useEffect } from 'react';
import { Ticket, TicketType, TicketPriority, TicketStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  AlertCircle,
  PlayCircle,
  CheckCircle2,
  ChevronRight,
  Tag,
  HelpCircle,
  FileClock,
  Trash2,
  Check,
  CheckSquare,
  Square,
  X,
  ArrowUpDown,
  CircleAlert
} from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onUpdateStatus: (id: string, status: TicketStatus) => void;
  onBulkUpdate: (ids: string[], updates: Partial<Ticket>) => void;
  onBulkDelete: (ids: string[]) => void;

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
  sortPreference: string;
  setSortPreference: (val: string) => void;
}

export default function TicketList({
  tickets,
  onSelectTicket,
  onUpdateStatus,
  onBulkUpdate,
  onBulkDelete,

  // De-duplicate local filters onto globally unified ones
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
  sortPreference,
  setSortPreference,
}: TicketListProps) {
  // Multi-selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkTagInput, setBulkTagInput] = useState('');

  // Styles maps
  const priorityStyles: Record<TicketPriority, { text: string, bg: string, border: string }> = {
    P0: { text: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-100/80 dark:border-rose-905/40' },
    P1: { text: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50/70 dark:bg-blue-950/30', border: 'border-blue-100/80 dark:border-blue-905/40' },
    P2: { text: 'text-amber-755 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-100/85 dark:border-amber-905/40' },
    P3: { text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900', border: 'border-slate-200 dark:border-slate-800' },
  };

  const statusConfig: Record<TicketStatus, { icon: any, color: string }> = {
    'Open': { icon: HelpCircle, color: 'text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900' },
    'In Progress': { icon: PlayCircle, color: 'text-blue-600 border-blue-150 bg-blue-50/60 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900' },
    'Blocked': { icon: AlertCircle, color: 'text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60' },
    'Done': { icon: CheckCircle2, color: 'text-emerald-600 border-emerald-150 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-305 dark:border-emerald-900' },
  };

  const typeStyles: Record<TicketType, string> = {
    Task: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-350 border-slate-205 dark:border-slate-800',
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
    const matchesTag = !selectedTag || t.tags.includes(selectedTag);

    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesTag;
  });

  // Reset multi-selectors whenever filters update to keep selection pristine and robust
  useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm, statusFilter, priorityFilter, typeFilter, selectedTag]);

  // Sorting logics
  const priorityWeight = { P0: 0, P1: 1, P2: 2, P3: 3 };

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    switch (sortPreference) {
      case 'updatedDesc':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'updatedAsc':
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      case 'createdDesc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'titleAsc':
        return a.title.localeCompare(b.title);
      case 'priority':
      default: {
        const aIsDone = a.status === 'Done';
        const bIsDone = b.status === 'Done';

        if (aIsDone && !bIsDone) return 1;
        if (!aIsDone && bIsDone) return -1;

        if (!aIsDone && !bIsDone) {
          if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
            return priorityWeight[a.priority] - priorityWeight[b.priority];
          }
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    }
  });

  // Gather unique tags
  const uniqueTags = Array.from(new Set(tickets.flatMap((t) => t.tags))).filter(Boolean);

  // Selector functions
  const toggleSelectTicket = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = sortedTickets.map((t) => t.id);
    const allSelectedAlready = visibleIds.every((id) => selectedIds.includes(id));

    if (allSelectedAlready) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkStatusChange = (status: TicketStatus) => {
    if (selectedIds.length === 0) return;
    onBulkUpdate(selectedIds, { status });
    setSelectedIds([]);
  };

  const handleBulkPriorityChange = (priority: TicketPriority) => {
    if (selectedIds.length === 0) return;
    onBulkUpdate(selectedIds, { priority });
    setSelectedIds([]);
  };

  const handleBulkAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = bulkTagInput.trim();
    if (!tag || selectedIds.length === 0) return;
    onBulkUpdate(selectedIds, { tags: [tag] });
    setBulkTagInput('');
    setSelectedIds([]);
  };

  const handleBulkDeleteSubmit = () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} tickets across your workflow?`
    );
    if (confirmed) {
      onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-4 relative" id="ticket-queue-wrapper">
      
      {/* Search, Filter & Sort Hub Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-xs overflow-hidden" id="ticket-queue-pane">
        
        {/* Row 1: Search & Dropdown Filters */}
        <div className="p-4 border-b border-slate-150 dark:border-slate-800/85 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="ticket-search-input"
              type="text"
              className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-150 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search by ID, title, tags, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer transition-colors"
                title="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Bar */}
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

            {/* Sort Preferences Selector */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-lg px-2.5 py-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SortBy</span>
              <select
                id="sorting-preference-select"
                className="bg-transparent text-xs text-slate-700 dark:text-slate-300 outline-hidden font-bold border-0 py-0.5 cursor-pointer"
                value={sortPreference}
                onChange={(e) => setSortPreference(e.target.value)}
              >
                <option value="priority">Priority (Default)</option>
                <option value="updatedDesc">Last Updated (Newest)</option>
                <option value="updatedAsc">Last Updated (Oldest)</option>
                <option value="createdDesc">Created Date (Newest)</option>
                <option value="titleAsc">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Premium Clickable Tag Pill Filter Hub */}
        {uniqueTags.length > 0 && (
          <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-850 flex items-center gap-2 overflow-x-auto min-h-11">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase flex-shrink-0 tracking-widest font-mono">
              Tags:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-hide">
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className={`px-2 py-0.5 text-[10px] font-mono leading-relaxed font-bold rounded-full transition-all cursor-pointer ${
                  !selectedTag
                    ? 'bg-blue-600 text-white shadow-xs border border-transparent'
                    : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800/80'
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
                    className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-xs border border-transparent'
                        : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80'
                    }`}
                  >
                    <Tag className="w-2.5 h-2.5 opacity-60" />
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md flex items-center gap-1 ml-auto cursor-pointer flex-shrink-0 border border-blue-100 dark:border-blue-900/60"
              >
                <X className="w-2.5 h-2.5" />
                Clear Reset
              </button>
            )}
          </div>
        )}

        {/* Master Selection Header Indicator */}
        {sortedTickets.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="p-1 hover:bg-slate-150 dark:hover:bg-slate-900 rounded text-slate-500 transition-all flex items-center gap-1.5 font-bold cursor-pointer"
                title="Toggle selection for all visible cards"
              >
                {sortedTickets.every((t) => selectedIds.includes(t.id)) ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>Check All Visible ({sortedTickets.length})</span>
              </button>
            </div>
            {selectedIds.length > 0 && (
              <div className="text-blue-600 dark:text-blue-400 font-bold animate-pulse flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{selectedIds.length} tickets queued for bulk updating</span>
              </div>
            )}
          </div>
        )}

        {/* Ticket List Viewport */}
        {sortedTickets.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/20 dark:bg-slate-950/20" id="empty-tickets-view">
            <CircleAlert className="w-10 h-10 mx-auto text-slate-350 dark:text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm font-bold">No operational tickets align with your parameters.</p>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">Try adjusting filters, clearing chosen tags, or capture a rapid ticket above.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setPriorityFilter('All');
                setTypeFilter('All');
                setSelectedTag(null);
              }}
              className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 dark:text-blue-300 text-xs font-bold rounded-lg border border-blue-105 dark:border-blue-900 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              Reset All Active Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-850/80 bg-white dark:bg-slate-900" id="queue-body-rows">
            <AnimatePresence initial={false}>
              {sortedTickets.map((ticket) => {
                const priorityInfo = priorityStyles[ticket.priority];
                const statusInfo = statusConfig[ticket.status];
                const StatusIcon = statusInfo.icon;
                const isDone = ticket.status === 'Done';
                const isSelected = selectedIds.includes(ticket.id);

                return (
                  <motion.div
                    key={ticket.id}
                    id={`ticket-row-${ticket.id}`}
                    layoutId={`row-${ticket.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 40 }}
                    className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-slate-55/40 dark:hover:bg-slate-950/20 transition-all group ${
                      isDone ? 'opacity-65 dark:opacity-45' : ''
                    } ${isSelected ? 'bg-blue-50/30 dark:bg-blue-950/15 border-l-2 border-blue-600' : ''}`}
                  >
                    {/* ID, Type & Title Area */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      
                      {/* Checkbox for mass selection */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectTicket(ticket.id);
                        }}
                        className="mt-0.5 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all cursor-pointer text-slate-400 hover:text-slate-600"
                        title="Mass Action Toggle"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-350 dark:text-slate-700" />
                        )}
                      </button>

                      {/* Quick toggle check status */}
                      <button
                        id={`row-status-toggle-${ticket.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(ticket.id, isDone ? 'Open' : 'Done');
                        }}
                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all shadow-2xs cursor-pointer ${
                          isDone
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                            : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900'
                        }`}
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5 animate-bounce" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 cursor-pointer" onClick={() => onSelectTicket(ticket)}>
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
                        <h4
                          onClick={() => onSelectTicket(ticket)}
                          className={`text-sm font-bold text-slate-800 dark:text-slate-100 mt-1.5 cursor-pointer leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${
                            isDone ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {ticket.title}
                        </h4>

                        {/* Tags and timestamp list */}
                        {(ticket.tags.length > 0 || ticket.notes) && (
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            {ticket.tags.map((tag, i) => (
                              <button
                                key={`${tag}-${i}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTag(tag);
                                }}
                                className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold leading-none px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                  selectedTag === tag
                                    ? 'bg-blue-650 border-transparent text-white'
                                    : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-slate-200/60 dark:border-slate-800/60'
                                }`}
                                title={`Filter by tag "${tag}"`}
                              >
                                <Tag className="w-2.5 h-2.5 opacity-60" />
                                {tag}
                              </button>
                            ))}
                            {ticket.notes && (
                              <span className="text-[10px] text-slate-550 dark:text-slate-400 bg-slate-55/40 dark:bg-slate-950/40 px-2 py-0.5 rounded border border-dotted border-slate-200 dark:border-slate-805 max-w-[200px] truncate">
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
                        <FileClock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                      </div>

                      {/* Status Dropdown selector */}
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border leading-none flex items-center gap-1.5 transition-all focus-within:ring-2 focus-within:ring-blue-500/10 ${statusInfo.color}`}>
                          <StatusIcon className="w-3.5 h-3.5 flex-shrink-0" />
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
                          className="p-1.5 text-slate-404 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 grid place-items-center transition-colors cursor-pointer"
                          title="Open Ticket Editor"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating Mass Bulk Update Actions Pane */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            id="floating-bulk-actions-bar"
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="fixed bottom-6 inset-x-6 z-40 max-w-4xl mx-auto p-4 bg-slate-900/95 dark:bg-zinc-950/95 border border-slate-750 dark:border-slate-800 text-white rounded-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xs shadow-xs text-white">
                {selectedIds.length}
              </div>
              <div>
                <p className="text-xs font-bold tracking-wide">Mass Action Executing</p>
                <p className="text-[10px] text-slate-400 font-mono tracking-tight">{selectedIds.length} tickets selected visually or programmatically.</p>
              </div>
            </div>

            {/* Mass update options layout */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-200">
              {/* Batch State Shift dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-800 dark:bg-slate-900 border border-slate-700 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Status</span>
                <select
                  id="bulk-status-select"
                  className="bg-transparent text-xs text-white outline-hidden font-bold border-0 cursor-pointer"
                  value=""
                  onChange={(e) => e.target.value && handleBulkStatusChange(e.target.value as TicketStatus)}
                >
                  <option value="" disabled className="text-slate-500">Shift...</option>
                  <option value="Open" className="text-slate-805">Open</option>
                  <option value="In Progress" className="text-slate-805">In Progress</option>
                  <option value="Blocked" className="text-slate-805">Blocked</option>
                  <option value="Done" className="text-slate-805">Done</option>
                </select>
              </div>

              {/* Batch Priority dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-800 dark:bg-slate-900 border border-slate-700 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Priority</span>
                <select
                  id="bulk-priority-select"
                  className="bg-transparent text-xs text-white outline-hidden font-bold border-0 cursor-pointer"
                  value=""
                  onChange={(e) => e.target.value && handleBulkPriorityChange(e.target.value as TicketPriority)}
                >
                  <option value="" disabled className="text-slate-500">Shift...</option>
                  <option value="P0" className="text-slate-805">P0 Critical</option>
                  <option value="P1" className="text-slate-805">P1 Active</option>
                  <option value="P2" className="text-slate-805">P2 Backlog</option>
                  <option value="P3" className="text-slate-805">P3 Optional</option>
                </select>
              </div>

              {/* Append custom tags */}
              <form onSubmit={handleBulkAddTagSubmit} className="flex items-center gap-1.5 bg-slate-800 dark:bg-slate-900 border border-slate-700 dark:border-slate-800 rounded-lg px-2 py-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-450" />
                <input
                  type="text"
                  placeholder="Append tag..."
                  className="bg-transparent text-xs text-white outline-hidden font-bold border-0 focus:ring-0 placeholder-slate-550 w-24"
                  value={bulkTagInput}
                  onChange={(e) => setBulkTagInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!bulkTagInput.trim()}
                  className="text-[10px] font-mono leading-none tracking-wider font-bold uppercase text-blue-450 hover:text-blue-300 disabled:opacity-40"
                >
                  Add
                </button>
              </form>

              {/* Mass Wipe database execution */}
              <button
                type="button"
                onClick={handleBulkDeleteSubmit}
                className="p-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-1 text-[11px] font-bold transition-all shadow-xs cursor-pointer ml-1"
                title="Mass delete selected tickets"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>

              <span className="h-6 w-[1.2px] bg-slate-700 self-center"></span>

              {/* Clear select buffer */}
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer font-bold font-mono text-[11px] flex items-center gap-1"
                title="Cancel selection"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
