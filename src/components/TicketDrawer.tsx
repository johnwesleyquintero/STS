import React, { useState, useEffect } from 'react';
import { Ticket, TicketType, TicketPriority, TicketStatus, TicketSource } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Calendar, Tag, FileText, CheckCircle, Clock, HelpCircle, Link, Check } from 'lucide-react';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeNotesTab, setActiveNotesTab] = useState<'edit' | 'preview'>('edit');
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShowDeleteConfirm(false);
    setActiveNotesTab('edit');
    setShowMarkdownHelp(false);
    setCopied(false);
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

  const handleCopyLink = () => {
    if (!ticket) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?ticketId=${ticket.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
    setShowDeleteConfirm(!showDeleteConfirm);
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
                    id="drawer-copy-link-btn"
                    type="button"
                    onClick={handleCopyLink}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                      copied 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400' 
                        : 'bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 shadow-3xs hover:shadow-2xs'
                    }`}
                    title="Copy shareable link to this ticket"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Link className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                )}
                {ticket && (
                  <button
                    id="drawer-delete-btn"
                    type="button"
                    onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
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

            {/* Danger Deletion Custom Confirmation Bar */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  id="drawer-delete-confirm-bar"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                  className="bg-rose-50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/40 overflow-hidden"
                >
                  <div className="p-4 flex flex-col gap-2">
                    <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                      Are you absolutely sure you want to delete Ticket {ticket?.id}? This action is irreversible.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (ticket) onDelete(ticket.id);
                        }}
                        className="p-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="p-2 py-1 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-all cursor-pointer shadow-2xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
              <div className="space-y-1.5 flex-1 flex flex-col relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5" htmlFor="ticket-notes-textarea">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Details & Notes (Markdown)
                    </label>
                    <button
                      id="markdown-notes-help-toggle"
                      type="button"
                      onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
                      className={`p-0.5 rounded-full transition-all text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer ${
                        showMarkdownHelp ? '!text-blue-500 !bg-blue-50 dark:!bg-blue-950/40' : ''
                      }`}
                      title="Markdown styling guide"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex border border-slate-200 dark:border-slate-800/80 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-950 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveNotesTab('edit')}
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                        activeNotesTab === 'edit'
                          ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-3xs border border-slate-200/50 dark:border-slate-800/40 font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveNotesTab('preview')}
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                        activeNotesTab === 'preview'
                          ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-3xs border border-slate-200/50 dark:border-slate-800/40 font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showMarkdownHelp && (
                    <motion.div
                      id="markdown-cheat-sheet-popover"
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-8 z-30 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-3.5 select-none"
                    >
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-blue-500" />
                          Markdown Format Guide
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowMarkdownHelp(false)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] text-slate-600 dark:text-slate-400 font-sans">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-400 dark:text-slate-500">SYNTAX</p>
                          <code className="block bg-slate-50 dark:bg-slate-950 p-1 rounded border border-slate-100 dark:border-slate-800/60 text-blue-600 dark:text-blue-400"># Header</code>
                          <code className="block bg-slate-50 dark:bg-slate-950 p-1 rounded border border-slate-100 dark:border-slate-800/60 text-blue-600 dark:text-blue-400">**bold**</code>
                          <code className="block bg-slate-50 dark:bg-slate-950 p-1 rounded border border-slate-100 dark:border-slate-800/60 text-blue-600 dark:text-blue-400">*italic*</code>
                          <code className="block bg-slate-50 dark:bg-slate-950 p-1 rounded border border-slate-100 dark:border-slate-800/60 text-blue-600 dark:text-blue-400">`code`</code>
                          <code className="block bg-slate-50 dark:bg-slate-950 p-1 rounded border border-slate-100 dark:border-slate-800/60 text-blue-600 dark:text-blue-400">- [ ] task</code>
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-400 dark:text-slate-500">PREVIEW</p>
                          <span className="block font-bold text-slate-800 dark:text-slate-200 mt-1 pb-0.5">Title Header</span>
                          <strong className="block font-bold text-slate-800 dark:text-slate-200">bold text</strong>
                          <em className="block italic">italic text</em>
                          <code className="block bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded text-[9px] w-fit font-mono font-bold text-blue-600 dark:text-blue-400">code</code>
                          <span className="block text-slate-500 dark:text-slate-400/90 font-medium">☐ task box</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] text-slate-600 dark:text-slate-400 font-sans mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/65">
                        <div className="space-y-1">
                          <code className="block bg-slate-50 dark:bg-slate-950 p-1 rounded border border-slate-100 dark:border-slate-800/60 text-blue-600 dark:text-blue-400">&gt; quote</code>
                          <code className="block bg-slate-50 dark:bg-slate-950 p-1 rounded border border-slate-100 dark:border-slate-800/60 text-blue-600 dark:text-blue-400">- list item</code>
                          <code className="block bg-slate-50 dark:bg-slate-950 p-1 rounded border border-slate-100 dark:border-slate-800/60 text-blue-600 dark:text-blue-400">[Label](url)</code>
                        </div>
                        <div className="space-y-1 justify-center flex flex-col">
                          <span className="block border-l-2 border-slate-300 dark:border-slate-600 pl-1.5 italic text-slate-500">quote block</span>
                          <span className="block pl-1 text-slate-600 dark:text-slate-300">• list item</span>
                          <span className="block text-blue-500 dark:text-blue-400 underline">Label</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {activeNotesTab === 'edit' ? (
                  <textarea
                    id="ticket-notes-textarea"
                    className="flex-1 min-h-[140px] w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-sm text-slate-900 dark:text-slate-150 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono text-xs leading-relaxed"
                    placeholder="Insert links, action items, descriptions, or observations here..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                ) : (
                  <div className="flex-1 min-h-[140px] max-h-[280px] w-full p-3.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-lg overflow-y-auto" id="markdown-preview-container">
                    {parseMarkdown(notes)}
                  </div>
                )}
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
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900"
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

function renderInlineMarkdown(text: string): string {
  let html = text;
  
  // Code pieces: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">$1</code>');
  
  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-slate-100">$1</strong>');
  
  // Italic: *text*
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  
  // Links: [label](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 font-semibold">$1</a>');
  
  return html;
}

function parseMarkdown(text: string) {
  if (!text || !text.trim()) {
    return <p className="text-slate-400 dark:text-slate-500 italic text-xs">No description or notes provided. Write some Markdown above!</p>;
  }
  
  // Safe simple escape to prevent script injection but let us draw custom tags
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
    
  const lines = escaped.split('\n');
  return (
    <div className="space-y-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-sans">
      {lines.map((line, idx) => {
        let content = line;
        
        // Checklist items: - [ ] or - [x]
        const isCheckedList = content.startsWith('- [x]') || content.startsWith('- [X]');
        const isUncheckedList = content.startsWith('- [ ]');
        if (isCheckedList) {
          const rawText = content.substring(5).trim();
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 select-none">
              <input type="checkbox" checked readOnly className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 pointer-events-none" />
              <span className="line-through text-slate-400 dark:text-slate-500" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(rawText) }} />
            </div>
          );
        }
        if (isUncheckedList) {
          const rawText = content.substring(5).trim();
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 select-none">
              <input type="checkbox" checked={false} readOnly className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 pointer-events-none" />
              <span className="text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(rawText) }} />
            </div>
          );
        }

        // Headers
        if (content.startsWith('### ')) {
          return <h5 key={idx} className="text-xs font-bold text-slate-900 dark:text-white mt-3 mb-1" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(content.substring(4)) }} />;
        }
        if (content.startsWith('## ')) {
          return <h4 key={idx} className="text-sm font-bold text-slate-900 dark:text-white mt-4 mb-1.5" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(content.substring(3)) }} />;
        }
        if (content.startsWith('# ')) {
          return <h3 key={idx} className="text-base font-bold text-slate-900 dark:text-white mt-5 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(content.substring(2)) }} />;
        }
        
        // Bullet list
        if (content.startsWith('- ') || content.startsWith('* ')) {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-0.5">
              <li className="text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(content.substring(2)) }} />
            </ul>
          );
        }

        // Blockquote
        if (content.startsWith('&gt; ') || content.startsWith('> ')) {
          const rawText = content.startsWith('&gt; ') ? content.substring(5) : content.substring(2);
          return (
            <blockquote key={idx} className="border-l-2 border-slate-400 dark:border-slate-600 pl-3 italic text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-950/40 p-1.5 rounded-r">
              <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(rawText) }} />
            </blockquote>
          );
        }
        
        // Plain paragraphs or empty lines
        if (content.trim() === '') {
          return <div key={idx} className="h-1.5" />;
        }
        
        return <p key={idx} className="text-slate-700 dark:text-slate-300 animate-fade-in" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(content) }} />;
      })}
    </div>
  );
}
