export type TicketType = 'Ops' | 'Bug' | 'Lead' | 'Catalog' | 'System' | 'Task';

export type TicketPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type TicketStatus = 'Open' | 'In Progress' | 'Blocked' | 'Done';

export type TicketSource = 'Manual' | 'Sync' | 'System';

export interface Ticket {
  id: string;
  title: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  notes: string;
  tags: string[];
  source: TicketSource;
  dependencies?: string[];
  dueDate?: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  timestamp: string;
  ticketId: string;
  action: string;
  details: string;
}
