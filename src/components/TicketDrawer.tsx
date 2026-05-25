import React, { useState, useEffect } from 'react';
import { Ticket, TicketType, TicketPriority, TicketStatus, TicketSource } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Calendar, Tag, FileText, CheckCircle, Clock } from 'lucide-react';

interface TicketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null; // Null means creating a new ticket
  onSave: (ticket: Ticket) => void;
  onDelete: (id: string) => void;
}

export default function TicketDrawer({ isOpen, onClose, ticket, onSave, onDelete }: TicketDrawerProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TicketType>('Task');
  const [priority, setPriority] = useState<TicketPriority>('P2');
  const [status, setStatus] = useState<TicketStatus>('Open');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [source, setSource] = useState<TicketSource>('Manual');

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title);
      setType(ticket.type);
      setPriority(ticket.priority);
      setStatus(ticket.status);
      setNotes(ticket.notes);
      setTags(ticket.tags);
      setTagsInput(ticket.tags.join(', '));
      setSource(ticket.source);
    } else {
      // Clear form for new ticket
      setTitle('');
      setType('Task');
      setPriority('P2');
      setStatus('Open');
      setNotes('');
      setTags([]);
      setTagsInput('');
      setSource('Manual');
    }
  }, [ticket, isOpen]);

  const handleAddTag = () => {
    const freshTag = tagsInput.trim();
    if (!freshTag) return;
    const splitTags = freshTag
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '' && !tags.includes(t));
    
    if (splitTags.length > 0) {
      const updated = [...tags, ...splitTags];
      setTags(updated);
      setTagsInput('');
    }
  };

  const handleTagsKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Standardize id
    let id = ticket ? ticket.id : '';
    const now = new Date().toISOString();

    const updatedTicket: Ticket = {
      id,
      title: title.trim(),
      type,
      priority,
      status,
      notes,
      tags,
      source: ticket ? ticket.source : 'Manual',
      createdAt: ticket ? ticket.createdAt : now,
      updatedAt: now,
    };

    onSave(updatedTicket);
  };

  const handleDeleteClick = () => {
    if (!ticket) return;
    const confirmed = window.confirm(
      `Delete Ticket ${ticket.id}: "${ticket.title}"? This action cannot be undone.`
    );
    if (confirmed) {
      onDelete(ticket.id);
    }
  };

  const ticketTypes: TicketType[] = ['Task', 'Ops', 'Bug', 'Lead', 'Catalog', 'System'];
  const ticketPriorities: TicketPriority[] = ['P0', 'P1', 'P2', 'P3'];
  const ticketStatuses: TicketStatus[] = ['Open', 'In Progress', 'Blocked', 'Done'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            id="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            id="drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
              <div>
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                  {ticket ? `${ticket.id} • ${source} Source` : 'New Queue Ticket'}
                </span>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1 font-display">
                  {ticket ? 'Edit Ticket Details' : 'Create Operational Ticket'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {ticket && (
                  <button
                    id="drawer-delete-btn"
                    type="button"
                    onClick={handleDeleteClick}
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Delete Ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  id="drawer-close-btn"
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6 flex flex-col">
              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider" htmlFor="ticket-title-input">
                  Ticket Summarized Title <span className="text-rose-550 font-bold">*</span>
                </label>
                <input
                  id="ticket-title-input"
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-sm text-slate-900 dark:text-slate-150 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  placeholder="e.g. Set up deployment pipeline configuration"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Status and Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider" htmlFor="ticket-status-select">
                    Execution Status
                  </label>
                  <select
                    id="ticket-status-select"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-150 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TicketStatus)}
                  >
                    {ticketStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider" htmlFor="ticket-priority-select">
                    Priority Tier
                  </label>
                  <select
                    id="ticket-priority-select"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-150 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  >
                    <option value="P0">P0 • Critical / Blocking</option>
                    <option value="P1">P1 • Active Work</option>
                    <option value="P2">P2 • Backlog</option>
                    <option value="P3">P3 • Optional / Cleanup</option>
                  </select>
                </div>
              </div>

              {/* Type Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider">
                  Work Classification
                </label>
                <div className="grid grid-cols-3 gap-2" id="ticket-type-grid">
                  {ticketTypes.map((t) => {
                    const isSelected = type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notebooks/Markdown Notes section */}
              <div className="space-y-1.5 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5" htmlFor="ticket-notes-textarea">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Details & Notes (Markdown)
                  </label>
                </div>
                <textarea
                  id="ticket-notes-textarea"
                  className="flex-1 min-h-[140px] w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-sm text-slate-900 dark:text-slate-150 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono text-xs leading-relaxed"
                  placeholder="Insert links, action items, descriptions, or observations here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5" htmlFor="ticket-tags-input">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Execution Tags
                </label>
                <div className="flex gap-2">
                  <input
                    id="ticket-tags-input"
                    type="text"
                    className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs text-slate-900 dark:text-slate-150 focus:outline-hidden"
                    placeholder="Type tags separated by commas..."
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    onKeyDown={handleTagsKeyPress}
                  />
                  <button
                    id="ticket-tag-add-btn"
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5" id="drawer-tags-container">
                    {tags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-150 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(index)}
                          className="text-blue-500 hover:text-blue-700 cursor-pointer text-[12px] font-semibold leading-none ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity Timeline metadata if editing */}
              {ticket && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 mt-auto text-[11px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Updated: {new Date(ticket.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Drawer actions footer */}
              <div className="pt-4 border-t border-slate-150 dark:border-slate-800/80 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-950 p-4 -mx-6 -mb-6 rounded-b-xl sticky bottom-0 z-10">
                <button
                  id="drawer-cancel-btn"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="drawer-save-btn"
                  type="submit"
                  disabled={!title.trim()}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  {ticket ? 'Save Changes' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
