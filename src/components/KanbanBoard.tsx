import React from 'react';
import { Ticket, TicketStatus, TicketPriority, TicketType } from '../types';
import { HelpCircle, PlayCircle, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Tag } from 'lucide-react';

interface KanbanBoardProps {
  tickets: Ticket[];
  onUpdateStatus: (id: string, status: TicketStatus) => void;
  onSelectTicket: (ticket: Ticket) => void;
}

export default function KanbanBoard({ tickets, onUpdateStatus, onSelectTicket }: KanbanBoardProps) {
  const columns: { status: TicketStatus; label: string; icon: any; color: string; border: string; bg: string }[] = [
    {
      status: 'Open',
      label: 'Open',
      icon: HelpCircle,
      color: 'text-purple-600 dark:text-purple-400',
      border: 'border-slate-200 dark:border-slate-800/80',
      bg: 'bg-slate-100/30 dark:bg-slate-950/20',
    },
    {
      status: 'In Progress',
      label: 'In Progress',
      icon: PlayCircle,
      color: 'text-blue-600 dark:text-blue-400',
      border: 'border-slate-200 dark:border-slate-800/80',
      bg: 'bg-slate-100/30 dark:bg-slate-950/20',
    },
    {
      status: 'Blocked',
      label: 'Blocked',
      icon: AlertCircle,
      color: 'text-amber-650 dark:text-amber-400',
      border: 'border-slate-200 dark:border-slate-800/80',
      bg: 'bg-slate-100/30 dark:bg-slate-950/20',
    },
    {
      status: 'Done',
      label: 'Done',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-slate-200 dark:border-slate-800/80',
      bg: 'bg-slate-100/30 dark:bg-slate-950/20',
    },
  ];

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TicketStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      onUpdateStatus(id, targetStatus);
    }
  };

  const priorityStyles: Record<TicketPriority, { text: string }> = {
    P0: { text: 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40' },
    P1: { text: 'text-blue-700 bg-blue-50 dark:text-blue-350 dark:bg-blue-950/30' },
    P2: { text: 'text-amber-755 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30' },
    P3: { text: 'text-slate-650 bg-slate-100 dark:text-slate-400 dark:bg-slate-900' },
  };

  const typeStyles: Record<TicketType, string> = {
    Task: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-900',
    Ops: 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/40',
    Bug: 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40',
    Lead: 'text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-950/30',
    Catalog: 'text-fuchsia-700 bg-fuchsia-50 dark:text-fuchsia-300 dark:bg-fuchsia-950/30',
    System: 'text-amber-705 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30',
  };

  // Helper to move statuses programmatically (e.g. for accessibiltiy or mobile)
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="kanban-board-grid">
      {columns.map((col) => {
        const colTickets = tickets.filter((t) => t.status === col.status);
        const Icon = col.icon;

        return (
          <div
            key={col.status}
            id={`kanban-col-${col.status.toLowerCase().replace(' ', '-')}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.status)}
            className={`rounded-xl border ${col.border} ${col.bg} p-4 flex flex-col min-h-[450px] transition-all`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${col.color}`} />
                <h3 className="text-sm font-bold text-slate-750 dark:text-slate-100 tracking-tight font-display">{col.label}</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 px-2.5 py-0.5 rounded-full shadow-2xs">
                {colTickets.length}
              </span>
            </div>

            {/* Column Content */}
            <div className="flex-1 space-y-3 overflow-y-auto" id={`kanban-cards-${col.status.toLowerCase()}`}>
              {colTickets.length === 0 ? (
                <div className="h-full border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center justify-center p-6 text-center text-xs text-slate-400/80">
                  Drag tickets here
                </div>
              ) : (
                colTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    id={`kanban-card-${ticket.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                    className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing hover:border-blue-600/30 dark:hover:border-blue-500/40 transition-all group relative break-inside-avoid"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {/* ID Monospace */}
                        <span
                          onClick={() => onSelectTicket(ticket)}
                          className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-blue-600 cursor-pointer"
                        >
                          {ticket.id}
                        </span>

                        {/* Type Label */}
                        <span className={`px-1 rounded text-[8px] font-bold uppercase tracking-wide border border-transparent ${typeStyles[ticket.type]}`}>
                          {ticket.type}
                        </span>
                      </div>

                      {/* Priority Tag */}
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-transparent ${priorityStyles[ticket.priority].text}`}>
                        {ticket.priority}
                      </span>
                    </div>

                    {/* Title */}
                    <p
                      onClick={() => onSelectTicket(ticket)}
                      className="text-xs font-bold text-slate-800 dark:text-slate-150 mt-2.5 line-clamp-2 leading-relaxed cursor-pointer group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                    >
                      {ticket.title}
                    </p>

                    {/* Tags in card */}
                    {ticket.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {ticket.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[8px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 px-1.5 py-0.5 rounded"
                          >
                            <Tag className="w-1.5 h-1.5 text-slate-400" />
                            {tag}
                          </span>
                        ))}
                        {ticket.tags.length > 3 && (
                          <span className="text-[8px] font-bold text-slate-450 bg-slate-50 dark:bg-slate-900 px-1 py-0.5 rounded">
                            +{ticket.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Card Actions Footer (Shifting for Accessibility and Mobile) */}
                    <div className="mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          id={`card-left-btn-${ticket.id}`}
                          onClick={() => shiftStatus(ticket, 'left')}
                          disabled={col.status === 'Open'}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-30 cursor-pointer"
                          title="Move Left"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`card-right-btn-${ticket.id}`}
                          onClick={() => shiftStatus(ticket, 'right')}
                          disabled={col.status === 'Done'}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-30 cursor-pointer"
                          title="Move Right"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
