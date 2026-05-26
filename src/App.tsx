import React, { useState, useEffect } from 'react';
import { Ticket, TicketType, TicketPriority, TicketStatus, ActivityLog } from './types';
import { initAuth, googleSignIn, logout, getAccessToken } from './lib/firebase';
import {
  searchSpreadsheet,
  createSpreadsheet,
  fetchSpreadsheetTickets,
  syncSpreadsheetTickets,
  logSpreadsheetActivity,
} from './lib/googleSheets';

import StatsGrid from './components/StatsGrid';
import QuickAdd from './components/QuickAdd';
import TicketList from './components/TicketList';
import KanbanBoard from './components/KanbanBoard';
import TicketDrawer from './components/TicketDrawer';

import {
  Inbox,
  LayoutGrid,
  RefreshCw,
  LogOut,
  FolderSync,
  Sparkles,
  Link2,
  FileSpreadsheet,
  WifiOff,
  History,
  X,
  Plus,
  User as UserIcon,
  Sun,
  Moon,
} from 'lucide-react';

const ScaleSmartLogo = ({ size = 24, className = "" }: { size?: number; className?: string }) => {
  return (
    <svg 
      viewBox="0 0 128 128" 
      width={size} 
      height={size} 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect x="12" y="12" width="104" height="104" rx="26" fill="url(#logo-grad)" />
      <path 
        d="M44 64 L58 78 L86 46" 
        stroke="#ffffff" 
        strokeWidth="11" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <circle cx="32" cy="32" r="5" fill="#ffffff" opacity="0.6" />
      <circle cx="96" cy="32" r="5" fill="#ffffff" opacity="0.6" />
    </svg>
  );
};

const SAMPLE_TICKETS: Ticket[] = [
  {
    id: 'STS-1001',
    title: 'Configure client staging environment deployment',
    type: 'Ops',
    priority: 'P0',
    status: 'In Progress',
    notes: 'Access keys are configured in Vault under STS-staging. Deployment needs verification in VPC subnets.',
    tags: ['deployment', 'staging', 'ops'],
    source: 'Manual',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'STS-1002',
    title: 'Fix auth token expiration on token refresh request',
    type: 'Bug',
    priority: 'P0',
    status: 'Blocked',
    notes: 'The refresh token request sometimes returns a 400 Bad Request if the token expired precisely at 00:00:00 UTC.',
    tags: ['auth', 'critical', 'api'],
    source: 'Manual',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'STS-1003',
    title: 'Draft master catalog classification spreadsheet for product list',
    type: 'Catalog',
    priority: 'P1',
    status: 'Open',
    notes: 'Use the standard categories schema. Ensure all entries have visual thumbnail properties.',
    tags: ['catalog', 'data-entry'],
    source: 'Manual',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'STS-1004',
    title: 'Warm outreach sequence to lead catalog targets',
    type: 'Lead',
    priority: 'P2',
    status: 'Done',
    notes: 'Emailed the first batch of 15 contacts. Got 3 active replies for scheduling discovery calls.',
    tags: ['leads', 'outreach', 'sales'],
    source: 'Manual',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  }
];

export default function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sessionMode, setSessionMode] = useState<'offline' | 'online' | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tickets & History logs state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Spreadsheet state
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [isSearchingDrive, setIsSearchingDrive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [customSheetInput, setCustomSheetInput] = useState('');
  const [showSheetLinker, setShowSheetLinker] = useState(false);

  // UI Navigation / Drawer State
  const [currentView, setCurrentView] = useState<'queue' | 'kanban'>('queue');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showLogsPanel, setShowLogsPanel] = useState(false);

  // Lifted filtering, search, and sorting states for global synchronization
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortPreference, setSortPreference] = useState<string>('priority');

  // Toast system
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);

  // Theme support
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('sts_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Sync theme class with document element for Tailwind dark: prefix
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sts_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sts_theme', 'light');
    }
  }, [isDarkMode]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // 1. Initialize Auth on Mount
  useEffect(() => {
    // Check if user already opted for offline or offline session
    const storedMode = localStorage.getItem('sts_session_mode') as 'offline' | 'online' | null;
    
    initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setIsAuthenticated(true);
        setSessionMode('online');
        localStorage.setItem('sts_session_mode', 'online');
        addToast(`Authenticated as ${currentUser.email || 'User'}`);
      },
      () => {
        // If not authenticated, check if offline was active
        if (storedMode === 'offline') {
          setSessionMode('offline');
          loadOfflineData();
        }
      }
    );
  }, []);

  // 2. Load tickets when session mode is active
  useEffect(() => {
    if (sessionMode === 'offline') {
      loadOfflineData();
    } else if (sessionMode === 'online' && accessToken) {
      detectAndLoadGSheetsDatabase();
    }
  }, [sessionMode, accessToken]);

  // Deep linking: Detect ticket ID in query params (e.g. ?ticketId=STS-xxxx) and open detail drawer automatically
  useEffect(() => {
    if (tickets.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const ticketIdFromUrl = params.get('ticketId') || params.get('id');
      if (ticketIdFromUrl) {
        const matchingTicket = tickets.find(
          (t) => t.id.toLowerCase() === ticketIdFromUrl.toLowerCase()
        );
        if (matchingTicket) {
          setSelectedTicket(matchingTicket);
          setIsDrawerOpen(true);
          // Gently clean up browser query parameters to avoid re-triggering on manual refresh
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, '', newUrl);
        }
      }
    }
  }, [tickets]);

  // Load offline tickets/logs from LocalStorage
  const loadOfflineData = () => {
    const storedTickets = localStorage.getItem('sts_offline_tickets');
    const storedLogs = localStorage.getItem('sts_offline_logs');

    if (storedTickets) {
      setTickets(JSON.parse(storedTickets));
    } else {
      // First boot gets default sample tickets so they have direct operational visibility
      setTickets(SAMPLE_TICKETS);
      localStorage.setItem('sts_offline_tickets', JSON.stringify(SAMPLE_TICKETS));
    }

    if (storedLogs) {
      setActivityLogs(JSON.parse(storedLogs));
    } else {
      const initialLog: ActivityLog = {
        timestamp: new Date().toISOString(),
        ticketId: 'SYSTEM',
        action: 'INIT',
        details: 'ScaleSmart Ticketing System initialized in offline isolated mode.',
      };
      setActivityLogs([initialLog]);
      localStorage.setItem('sts_offline_logs', JSON.stringify([initialLog]));
    }
    setLastSynced(new Date().toLocaleTimeString());
  };

  // Save changes locally in LocalStorage
  const saveOfflineTicketsAndLogs = (newTickets: Ticket[], newLogs?: ActivityLog[]) => {
    setTickets(newTickets);
    localStorage.setItem('sts_offline_tickets', JSON.stringify(newTickets));

    if (newLogs) {
      setActivityLogs(newLogs);
      localStorage.setItem('sts_offline_logs', JSON.stringify(newLogs));
    }
    setLastSynced(new Date().toLocaleTimeString());
  };

  // 3. Search Drive for the sheet
  const detectAndLoadGSheetsDatabase = async (overrideId?: string) => {
    if (!accessToken) return;
    setIsSearchingDrive(true);
    try {
      let sheetId = overrideId || localStorage.getItem('sts_spreadsheet_id');

      if (!sheetId) {
        addToast('Searching Drive for ScaleSmart database...', 'info');
        sheetId = await searchSpreadsheet(accessToken);
      }

      if (sheetId) {
        setSpreadsheetId(sheetId);
        localStorage.setItem('sts_spreadsheet_id', sheetId);
        addToast('Connected to Google Sheet database!', 'success');
        await syncFromGSheet(sheetId);
      } else {
        addToast('No database sheet found. Please create one below or link.', 'info');
      }
    } catch (err: any) {
      console.error(err);
      addToast('Error searching or accessing Google Drive.', 'error');
    } finally {
      setIsSearchingDrive(false);
    }
  };

  // Force pulling/syncing from Google Sheets (incorporate sheet changes)
  const syncFromGSheet = async (sheetId: string) => {
    if (!accessToken) return;
    setIsSyncing(true);
    try {
      const pulledTickets = await fetchSpreadsheetTickets(accessToken, sheetId);
      
      // If there are no tickets in the spreadsheet, let's offer to sync our local ones
      if (pulledTickets.length === 0 && tickets.length > 0) {
        addToast('Cloud sheet is empty. Synced current ticket state to it.', 'info');
        await syncSpreadsheetTickets(accessToken, sheetId, tickets);
        setLastSynced(new Date().toLocaleTimeString());
      } else {
        setTickets(pulledTickets);
        addToast(`${pulledTickets.length} tickets successfully pulled from GSheets!`);
        setLastSynced(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      console.error(err);
      addToast('Error synchronized from Google Sheet.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Push local tickets/logs up to GSheets
  const pushToGSheet = async (updatedTickets: Ticket[]) => {
    if (!accessToken || !spreadsheetId) return;
    try {
      await syncSpreadsheetTickets(accessToken, spreadsheetId, updatedTickets);
      setLastSynced(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error(err);
      addToast('Could not auto-save to cloud spreadsheet.', 'error');
    }
  };

  // Helper: Create a brand new Spreadsheet in Google Drive
  const handleCreateNewDatabase = async () => {
    if (!accessToken) return;
    setIsSyncing(true);
    try {
      addToast('Creating STS database sheet in Google Drive...', 'info');
      const newSheetId = await createSpreadsheet(accessToken);
      setSpreadsheetId(newSheetId);
      localStorage.setItem('sts_spreadsheet_id', newSheetId);
      addToast('Successfully created STS database spreadsheet in GSheets!', 'success');

      // Sync active tickets list to initialize it
      await syncSpreadsheetTickets(accessToken, newSheetId, tickets);
      setLastSynced(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error(err);
      addToast('Error creating STS database sheet.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper: Manually link a Spreadsheet URL or custom ID
  const handleLinkCustomSpreadsheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSheetInput.trim() || !accessToken) return;

    // Extract sheet id
    const match = customSheetInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const targetId = match ? match[1] : customSheetInput.trim();

    setIsSyncing(true);
    try {
      // Test fetch to confirm it exists
      await fetchSpreadsheetTickets(accessToken, targetId);
      setSpreadsheetId(targetId);
      localStorage.setItem('sts_spreadsheet_id', targetId);
      setShowSheetLinker(false);
      setCustomSheetInput('');
      addToast('Custom Spreadsheet linked successfully!', 'success');
      await syncFromGSheet(targetId);
    } catch (err: any) {
      console.error(err);
      addToast('Failed to link custom spreadsheet ID. Check sharing settings/permissions.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);
      setSpreadsheetId(null);
      setSessionMode(null);
      localStorage.removeItem('sts_spreadsheet_id');
      localStorage.removeItem('sts_session_mode');
      addToast('Logs logged out successfully.', 'info');
    } catch (err: any) {
      console.error(err);
    }
  };

  // Login handler
  const handleLoginClick = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const authResponse = await googleSignIn();
      if (authResponse) {
        setUser(authResponse.user);
        setAccessToken(authResponse.accessToken);
        setIsAuthenticated(true);
        setSessionMode('online');
        localStorage.setItem('sts_session_mode', 'online');
      }
    } catch (err: any) {
      console.error(err);
      if (err && (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('unauthorized-domain')))) {
        setAuthError('unauthorized-domain');
        addToast('Sign-In Fail: unauthorized-domain. Fix steps displayed below.', 'error');
      } else {
        setAuthError(err?.message || String(err));
        addToast('Google Auth failed or dismissed.', 'error');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Skip Login for offline evaluation
  const handleEnterIsolatedMode = () => {
    setSessionMode('offline');
    localStorage.setItem('sts_session_mode', 'offline');
    addToast('Entered isolated Local Storage mode.');
    loadOfflineData();
  };

  // --- CRUD TICKET ACTIONS ---

  // Helper to calculate next standard ID index
  const generateNextId = (items: Ticket[]): string => {
    const idNums = items
      .map((t) => {
        const match = t.id.match(/^STS-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0);
    const max = idNums.length > 0 ? Math.max(...idNums) : 1000;
    return `STS-${max + 1}`;
  };

  // Create Activity log helper
  const addActivityLog = (ticketId: string, action: string, details: string): ActivityLog => {
    const logItem: ActivityLog = {
      timestamp: new Date().toISOString(),
      ticketId,
      action,
      details,
    };

    setActivityLogs((prev) => [logItem, ...prev]);

    // Persist logs offline or append online
    if (sessionMode === 'offline') {
      const storedLogs = localStorage.getItem('sts_offline_logs');
      const currentLogs = storedLogs ? JSON.parse(storedLogs) : [];
      localStorage.setItem('sts_offline_logs', JSON.stringify([logItem, ...currentLogs]));
    } else if (sessionMode === 'online' && accessToken && spreadsheetId) {
      logSpreadsheetActivity(accessToken, spreadsheetId, logItem);
    }

    return logItem;
  };

  // Add Ticket via Quick Capture Row
  const handleQuickAddTicket = (title: string, type: TicketType, priority: TicketPriority) => {
    const nextId = generateNextId(tickets);
    const now = new Date().toISOString();

    const newTicket: Ticket = {
      id: nextId,
      title,
      type,
      priority,
      status: 'Open',
      notes: '',
      tags: [],
      source: sessionMode === 'online' ? 'Sync' : 'Manual',
      createdAt: now,
      updatedAt: now,
    };

    const updatedTickets = [newTicket, ...tickets];

    if (sessionMode === 'offline') {
      saveOfflineTicketsAndLogs(updatedTickets);
      addActivityLog(nextId, 'CREATE', `Quick added offline ticket: "${title}" as ${type} with ${priority}`);
      addToast(`Ticket ${nextId} quick added locally!`);
    } else {
      setTickets(updatedTickets);
      addActivityLog(nextId, 'CREATE', `Quick added synced ticket: "${title}" as ${type} with ${priority}`);
      addToast(`Ticket ${nextId} created in queue, syncing...`, 'info');
      pushToGSheet(updatedTickets).then(() => {
        addToast(`Ticket ${nextId} saved to Google Sheets!`);
      });
    }
  };

  // Save Ticket (Create new or Update existing)
  const handleSaveTicket = (updatedTicket: Ticket) => {
    let id = updatedTicket.id;
    let isNew = false;

    if (!id) {
      id = generateNextId(tickets);
      updatedTicket.id = id;
      isNew = true;
    }

    const updatedTickets = isNew
      ? [updatedTicket, ...tickets]
      : tickets.map((t) => (t.id === id ? updatedTicket : t));

    if (sessionMode === 'offline') {
      saveOfflineTicketsAndLogs(updatedTickets);
      addActivityLog(id, isNew ? 'CREATE' : 'UPDATE', `${isNew ? 'Created' : 'Updated'} details for "${updatedTicket.title}"`);
      addToast(`Ticket ${id} saved successfully!`);
    } else {
      setTickets(updatedTickets);
      addActivityLog(id, isNew ? 'CREATE' : 'UPDATE', `${isNew ? 'Created' : 'Updated'} details for "${updatedTicket.title}"`);
      addToast(`Saving ticket ${id} to GSheets...`, 'info');
      pushToGSheet(updatedTickets).then(() => {
        addToast(`Ticket ${id} saved to Google Sheets!`);
      });
    }

    setIsDrawerOpen(false);
    setSelectedTicket(null);
  };

  // Quick Inline Status Update
  const handleUpdateTicketStatus = (id: string, newStatus: TicketStatus) => {
    const target = tickets.find((t) => t.id === id);
    if (!target) return;

    if (target.status === newStatus) return;

    const updatedTickets = tickets.map((t) =>
      t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
    );

    if (sessionMode === 'offline') {
      saveOfflineTicketsAndLogs(updatedTickets);
      addActivityLog(id, 'STATUS', `Changed status to "${newStatus}"`);
      addToast(`Updated status of ${id} to ${newStatus}`);
    } else {
      setTickets(updatedTickets);
      addActivityLog(id, 'STATUS', `Changed status to "${newStatus}"`);
      addToast(`Updating status of ${id} to ${newStatus}...`, 'info');
      pushToGSheet(updatedTickets).then(() => {
        addToast(`Status of ${id} updated in GSheets!`);
      });
    }
  };

  // Delete Ticket
  const handleDeleteTicket = (id: string) => {
    const updatedTickets = tickets.filter((t) => t.id !== id);

    if (sessionMode === 'offline') {
      saveOfflineTicketsAndLogs(updatedTickets);
      addActivityLog(id, 'DELETE', `Deleted ticket ${id} offline.`);
      addToast(`Deleted ticket ${id} successfully.`);
    } else {
      setTickets(updatedTickets);
      addActivityLog(id, 'DELETE', `Deleted ticket ${id} from queue.`);
      addToast(`Deleting ticket ${id} from GSheets...`, 'info');
      pushToGSheet(updatedTickets).then(() => {
        addToast(`Deleted ticket ${id} from Google Sheets!`);
      });
    }

    setIsDrawerOpen(false);
    setSelectedTicket(null);
  };

  // Bulk / Mass Ticket Updates
  const handleBulkUpdateTickets = (ids: string[], updates: Partial<Ticket>) => {
    const now = new Date().toISOString();
    const updatedTickets = tickets.map((t) => {
      if (ids.includes(t.id)) {
        let updatedTags = t.tags;
        if (updates.tags) {
          // If tags are passed as updates, append unique ones
          updatedTags = Array.from(new Set([...t.tags, ...updates.tags]));
        }
        return {
          ...t,
          ...updates,
          tags: updatedTags,
          updatedAt: now,
        };
      }
      return t;
    });

    if (sessionMode === 'offline') {
      saveOfflineTicketsAndLogs(updatedTickets);
      addActivityLog('SYSTEM', 'BULK_UPDATE', `Bulk updated ${ids.length} tickets with details: ${JSON.stringify(updates)}`);
      addToast(`Bulk updated ${ids.length} tickets successfully!`);
    } else {
      setTickets(updatedTickets);
      addActivityLog('SYSTEM', 'BULK_UPDATE', `Bulk updated ${ids.length} tickets with details: ${JSON.stringify(updates)}`);
      addToast(`Syncing bulk updates for ${ids.length} tickets...`, 'info');
      pushToGSheet(updatedTickets).then(() => {
        addToast(`Bulk update saved to Google Sheets!`);
      });
    }
  };

  const handleBulkDeleteTickets = (ids: string[]) => {
    const updatedTickets = tickets.filter((t) => !ids.includes(t.id));

    if (sessionMode === 'offline') {
      saveOfflineTicketsAndLogs(updatedTickets);
      addActivityLog('SYSTEM', 'BULK_DELETE', `Bulk deleted ${ids.length} tickets.`);
      addToast(`Bulk deleted ${ids.length} tickets successfully.`);
    } else {
      setTickets(updatedTickets);
      addActivityLog('SYSTEM', 'BULK_DELETE', `Bulk deleted ${ids.length} tickets from queue.`);
      addToast(`Deleting ${ids.length} tickets from GSheets...`, 'info');
      pushToGSheet(updatedTickets).then(() => {
        addToast(`Bulk deletion synced to Google Sheets!`);
      });
    }
  };

  const handleManualSyncPress = () => {
    if (sessionMode === 'offline') {
      loadOfflineData();
      addToast('Local state parsed and refreshed.');
    } else if (sessionMode === 'online' && spreadsheetId) {
      addToast('Syncing changes with Google Sheets...', 'info');
      syncFromGSheet(spreadsheetId);
    }
  };

  // Open detail drawer for creation
  const handleOpenNewTicketDrawer = () => {
    setSelectedTicket(null);
    setIsDrawerOpen(true);
  };

  // Open detail drawer for editing
  const handleOpenEditTicketDrawer = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
  };

  // --- RENDERING VIEWS ---

  if (sessionMode === null) {
    // Elegant Auth Greeting Card Screen
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative" id="welcome-auth-viewport">
        {/* Floating Theme Toggle in top-right */}
        <div className="absolute top-4 right-4">
          <button
            id="auth-theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-slate-650 dark:text-slate-350 flex items-center justify-center cursor-pointer shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            {isDarkMode ? (
              <Sun className="w-4.5 h-4.5 text-amber-500" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-indigo-500" />
            )}
          </button>
        </div>

        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800/80 p-8 rounded-2xl shadow-xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 animate-pulse"></div>

          {/* Icon Logo */}
          <div className="space-y-3 text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center">
              <ScaleSmartLogo size={46} />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900 dark:text-slate-50 animate-fade-in">
              ScaleSmart STS
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs text-balance leading-relaxed">
              Lightweight visual execution queue & Jira-inspired operational task tracker to manage execution with velocity.
            </p>
          </div>

          <div className="space-y-3 font-semibold text-xs text-slate-550 dark:text-slate-400 text-left pt-2 border-t border-slate-105 dark:border-slate-800/60 font-mono text-[11px]">
            <h4 className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-2">Designed to:</h4>
            <ul className="space-y-1.5 list-disc pl-4" id="intro-bullets">
              <li>Deploy rapid workspaces in client environments lacking project tools.</li>
              <li>Provide a shadow tracker for personal task alignment.</li>
              <li>Maintain high execution speed without system complexity.</li>
            </ul>
          </div>

          <div className="space-y-3 pt-4 font-sans">
            {/* Google Sign-in material button styled strictly as Workspace Integration instruction */}
            <button
              id="gsi-sign-in-btn"
              onClick={handleLoginClick}
              disabled={isAuthenticating}
              className="w-full flex items-center justify-center gap-3 py-3 border border-slate-250 dark:border-slate-700/80 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isAuthenticating ? 'Connecting...' : 'Authorize with Google Sign-In'}</span>
            </button>

            {/* Offline execution button */}
            <button
              id="offline-isolated-btn"
              onClick={handleEnterIsolatedMode}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-650 dark:text-slate-300 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <WifiOff className="w-3.5 h-3.5 text-slate-500" />
              Isolated Preview Mode (Offline)
            </button>

            {/* Premium, Interactive Firebase Auth Diagnostic Help Card */}
            {authError && (
              <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-left space-y-3" id="auth-error-panel">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                    !
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-rose-800 dark:text-rose-300">
                      {authError === 'unauthorized-domain' ? 'Firebase Unauthorized Domain' : 'Sign-In Error'}
                    </h5>
                    <p className="text-[10px] text-rose-650 dark:text-rose-405 mt-1 leading-normal">
                      {authError === 'unauthorized-domain'
                        ? 'Your Firebase Authentication setup blocked this domain because it is not listed in your OAuth Authorized Domains list.'
                        : authError}
                    </p>
                  </div>
                </div>

                {authError === 'unauthorized-domain' && (
                  <div className="space-y-2.5 border-t border-rose-100 dark:border-rose-900/30 pt-2.5">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                      To enable live GSheets matching, add <code className="font-mono bg-rose-100/60 dark:bg-rose-950/80 px-1 py-0.5 rounded font-bold text-rose-700 dark:text-rose-300">{window.location.hostname}</code> to your Firebase project authorized domains list.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(window.location.hostname);
                            addToast('Domain copied to clipboard!');
                          } catch (e) {
                            addToast('Failed to copy. Type it manually.', 'error');
                          }
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded text-[9.5px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer shadow-3xs flex items-center gap-1 transition-colors"
                      >
                        Copy Domain Host
                      </button>
                      <a
                        href="https://console.firebase.google.com/project/gen-lang-client-0670451952/authentication/settings"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9.5px] font-bold cursor-pointer shadow-2xs inline-flex items-center gap-1 transition-colors"
                      >
                        Go to Firebase Auth Settings
                      </a>
                    </div>

                    <div className="text-[9.5px] leading-relaxed text-slate-500 dark:text-slate-400 space-y-1.5 pt-1 border-t border-rose-100/50 dark:border-rose-900/20">
                      <div className="flex gap-1.5"><span className="text-blue-500 font-bold">1.</span> <span>Copy the host using the <b>Copy Domain Host</b> button.</span></div>
                      <div className="flex gap-1.5"><span className="text-blue-500 font-bold">2.</span> <span>Click <b>Go to Firebase Auth Settings</b> (sign in to your console).</span></div>
                      <div className="flex gap-1.5"><span className="text-blue-500 font-bold">3.</span> <span>Scroll to <b>Authorized domains</b>, click <b>Add domain</b>, paste and click Save.</span></div>
                      <div className="flex gap-1.5"><span className="text-blue-500 font-bold">4.</span> <span>Refresh this tab and retry. Or, click below to try offline local storage.</span></div>
                    </div>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => setAuthError(null)}
                  className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 dark:text-slate-550 dark:hover:text-slate-405 font-bold border-t border-slate-105 dark:border-slate-800/60 pt-2 block cursor-pointer transition-colors"
                >
                  Clear Info & Retry Sign-In
                </button>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 dark:text-slate-505 text-center uppercase tracking-wider font-mono">
            Powered by Google Sheets Integration
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-slate-800 dark:text-slate-100 relative bg-slate-50 dark:bg-slate-950 pb-16" id="sts-app-view">
      
      {/* Toast notifications */}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none" id="toast-viewport">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`p-3.5 rounded-xl text-xs font-bold border shadow-lg flex items-center justify-between cursor-pointer pointer-events-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`}
            role="alert"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                toast.type === 'success'
                  ? 'bg-emerald-500 animate-pulse'
                  : toast.type === 'error'
                  ? 'bg-rose-500 animate-bounce'
                  : 'bg-blue-500'
              }`} />
              <span className="text-slate-650 dark:text-slate-300 font-semibold">{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-3 text-slate-400 hover:text-slate-600 font-bold"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Main Top Header */}
      <header className="bg-white/90 backdrop-blur-md dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-805 px-6 py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 sticky top-0 z-35 shadow-xs" id="sts-app-header">
        
        {/* Title, Brand, and Mode status */}
        <div className="flex items-center gap-2">
          <ScaleSmartLogo size={36} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-display font-bold text-slate-800 dark:text-slate-100">
                ScaleSmart STS
              </h1>
              {sessionMode === 'offline' ? (
                <span className="bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200/65 dark:border-amber-900/60 flex items-center gap-1 uppercase tracking-wider">
                  <WifiOff className="w-2.5 h-2.5 text-amber-550" />
                  Isolated Preview
                </span>
              ) : (
                <span className="bg-emerald-50/50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-900/60 flex items-center gap-1 uppercase tracking-wider">
                  Cloud Live
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Visual Queue & Jira-Inspired Execution Workspace</p>
          </div>
        </div>

        {/* Database state indicator or Linking panel */}
        {sessionMode === 'online' && (
          <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800/80" id="google-db-bar">
            {spreadsheetId ? (
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-slate-600 dark:text-slate-400 max-w-[190px] truncate" title={spreadsheetId}>
                  DB Sheet Connected
                </span>
                <span className="opacity-40">|</span>
                <span className="text-slate-450 dark:text-slate-500 text-[10px]/none">
                  Refreshed: {lastSynced || 'Never'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <FolderSync className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  Database Needed
                </span>
                <button
                  id="btn-create-db"
                  onClick={handleCreateNewDatabase}
                  disabled={isSyncing}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded cursor-pointer transition-all"
                >
                  Create DB in Drive
                </button>
                <span className="text-slate-400">or</span>
                <button
                  id="btn-show-linker"
                  onClick={() => setShowSheetLinker(!showSheetLinker)}
                  className="text-blue-600 hover:underline hover:text-blue-700 cursor-pointer text-[10px] font-bold"
                >
                  Link ID
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sync, Logs, and User Profile menu */}
        <div className="flex items-center justify-end gap-2.5">
          {/* Theme toggler button */}
          <button
            id="header-theme-toggle-btn"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-all cursor-pointer shadow-3xs hover:shadow-2xs font-semibold select-none"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-500" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          {/* Manual sync button */}
          <button
            id="header-manual-sync-btn"
            onClick={handleManualSyncPress}
            title="Refresh database state"
            disabled={isSyncing}
            className="px-3 py-1.5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs flex items-center gap-2 transition-all cursor-pointer shadow-3xs hover:shadow-2xs font-semibold select-none disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-500' : ''}`} />
            <span>Sync</span>
          </button>

          {/* Activity Logs history drawer button */}
          <button
            id="header-activity-logs-btn"
            onClick={() => setShowLogsPanel(true)}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer shadow-3xs hover:shadow-2xs font-semibold select-none"
          >
            <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Activity Log</span>
          </button>

          {sessionMode === 'online' && user && (
            <div className="flex items-center gap-2 border-l border-slate-250 dark:border-slate-800 pl-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full border border-slate-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 grid place-items-center">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 max-w-[100px] truncate leading-tight">
                  {user.displayName || 'Operator'}
                </p>
                <p className="text-[8px] text-slate-500 dark:text-slate-400 truncate leading-none max-w-[100px]">
                  {user.email}
                </p>
              </div>

              <button
                id="header-logout-btn"
                onClick={handleLogout}
                title="Disconnect Account"
                className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/20 text-slate-650 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-3xs hover:shadow-2xs select-none"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          )}

          {sessionMode === 'offline' && (
            <button
              id="header-offline-exit-btn"
              onClick={handleLogout}
              className="px-3 py-1.5 text-slate-650 hover:text-rose-650 dark:text-slate-300 dark:hover:text-rose-450 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer flex items-center gap-2 text-xs font-semibold hover:bg-rose-50/50 dark:hover:bg-rose-950/10 transition-all shadow-3xs hover:shadow-2xs select-none"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Exit Isolated Mode</span>
            </button>
          )}
        </div>
      </header>

      {/* Database URL linking modal overlay */}
      {showSheetLinker && sessionMode === 'online' && (
        <div id="sheet-linker-overlay" className="fixed inset-0 z-45 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-blue-600" />
              Link Custom Google Spreadsheet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Paste the Spreadsheet URL or exact Spreadsheet ID below. Make sure your Google Account has Edit permissions to it.
            </p>
            <form onSubmit={handleLinkCustomSpreadsheet} className="space-y-4">
              <input
                id="linking-sheet-input"
                type="text"
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder-slate-400"
                placeholder="https://docs.google.com/spreadsheets/d/your-spreadsheet-id/edit"
                value={customSheetInput}
                onChange={(e) => setCustomSheetInput(e.target.value)}
              />
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSheetLinker(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all shadow-sm"
                >
                  Link Spreadsheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6" id="sts-app-content">
        
        {/* Isolated Banner warning if offline */}
        {sessionMode === 'offline' && (
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs" id="isolated-mode-warning">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
              <p>
                <strong>Offline Preview Mode:</strong> Current tasks are saved in browser LocalStorage.
                Google Sign-In is required to securely back up your tickets into editable Google Sheets spreadsheets.
              </p>
            </div>
            <button
              id="warning-claim-auth-btn"
              onClick={() => {
                setSessionMode(null);
                localStorage.removeItem('sts_session_mode');
              }}
              className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3 rounded-lg cursor-pointer flex-shrink-0 ml-auto transition-all shadow-sm"
            >
              Connect Cloud Database
            </button>
          </div>
        )}

        {/* Stats Summary Counter line */}
        <StatsGrid
          tickets={tickets}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          setTypeFilter={setTypeFilter}
          setSelectedTag={setSelectedTag}
          setSearchTerm={setSearchTerm}
        />

        {/* Quick Ticket Input Form */}
        <QuickAdd onAddTicket={handleQuickAddTicket} />

        {/* Navigation Tab Header and Create CTA */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2.5" id="workspace-tabs-menu">
          <div className="flex items-center gap-2">
            <button
              id="tab-btn-queue"
              onClick={() => setCurrentView('queue')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'queue'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <Inbox className="w-4 h-4" />
              Queue View
            </button>

            <button
              id="tab-btn-kanban"
              onClick={() => setCurrentView('kanban')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'kanban'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban Board
            </button>
          </div>

          <button
            id="top-cta-new-ticket-btn"
            onClick={handleOpenNewTicketDrawer}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg transition-all transform active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Ticket
          </button>
        </div>

        {/* Render View Area */}
        <div id="render-view-viewport">
          {currentView === 'queue' ? (
            <TicketList
              tickets={tickets}
              onSelectTicket={handleOpenEditTicketDrawer}
              onUpdateStatus={handleUpdateTicketStatus}
              onBulkUpdate={handleBulkUpdateTickets}
              onBulkDelete={handleBulkDeleteTickets}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              sortPreference={sortPreference}
              setSortPreference={setSortPreference}
            />
          ) : (
            <KanbanBoard
              tickets={tickets}
              onSelectTicket={handleOpenEditTicketDrawer}
              onUpdateStatus={handleUpdateTicketStatus}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
            />
          )}
        </div>
      </main>

      {/* Right Drawer Panel for Ticket Dialog CRUD */}
      <TicketDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        ticket={selectedTicket}
        onSave={handleSaveTicket}
        onDelete={handleDeleteTicket}
      />
      {/* Side slide activity logs list drawer */}
      <div id="logs-slide-viewport" className={`fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-y-auto flex flex-col transition-transform transform ${
        showLogsPanel ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 sticky top-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display">Queue Activity Log</span>
          </div>
          <button
            onClick={() => setShowLogsPanel(false)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs font-mono" id="logs-viewport-body">
          {activityLogs.length === 0 ? (
            <p className="p-8 text-center text-slate-450 dark:text-slate-505">No activity logs recorded yet.</p>
          ) : (
            activityLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-lg border border-slate-200 dark:border-slate-805 flex flex-col gap-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                  <span className="font-bold text-blue-600">{log.action}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-305 leading-normal font-sans text-xs">{log.details}</p>
                {log.ticketId && log.ticketId !== 'SYSTEM' && (
                  <span className="text-[10px] font-bold text-slate-405 self-start bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 px-2 py-0.5 rounded">
                    Ticket: {log.ticketId}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
