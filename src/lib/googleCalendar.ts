import { Ticket } from '../types';

/**
 * Calculates the day after a given YYYY-MM-DD date string.
 * This is timezone-safe as it processes parameters explicitly.
 */
export function getNextDayDateString(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  d.setDate(d.getDate() + 1);
  
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const r = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${r}`;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: {
    date?: string;
    dateTime?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
  };
  htmlLink?: string;
}

/**
 * Search the user's primary calendar for an event matching the ticket ID.
 */
export async function searchCalendarEvent(accessToken: string, ticketId: string): Promise<GoogleCalendarEvent | null> {
  try {
    const q = encodeURIComponent(ticketId);
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?q=${q}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('INSUFFICIENT_SCOPES');
      }
      console.error('Failed to search calendar events:', await response.text());
      return null;
    }

    const data = await response.json();
    const items: GoogleCalendarEvent[] = data.items || [];
    
    // Fine-tune filter to find the exact match where the description or summary matches our ticket ID
    const exactMatch = items.find(event => 
      (event.description && event.description.includes(ticketId)) ||
      (event.summary && event.summary.includes(ticketId))
    );

    return exactMatch || null;
  } catch (error) {
    console.error('Error searching calendar event:', error);
    return null;
  }
}

/**
 * Create a new all-day Google Calendar event for a ticket.
 */
export async function createCalendarEvent(accessToken: string, ticket: Ticket): Promise<GoogleCalendarEvent> {
  if (!ticket.dueDate) {
    throw new Error('Ticket does not have a due date');
  }

  const startDay = ticket.dueDate;
  const endDay = getNextDayDateString(ticket.dueDate);

  const eventBody = {
    summary: `STS: [${ticket.priority}] ${ticket.title} (${ticket.id})`,
    description: `Ticket Details:
• ID: ${ticket.id}
• Priority: ${ticket.priority}
• Type: ${ticket.type}
• Status: ${ticket.status}
• Assignee: ${ticket.assignee || 'Unassigned'}

Notes:
${ticket.notes || 'No added notes.'}

Created via ScaleSmart Ticketing System (STS).`,
    start: {
      date: startDay,
    },
    end: {
      date: endDay,
    },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('INSUFFICIENT_SCOPES');
    }
    const errorMsg = await response.text();
    throw new Error(`Failed to create calendar event: ${errorMsg}`);
  }

  return response.json();
}

/**
 * Update an existing Google Calendar event.
 */
export async function updateCalendarEvent(accessToken: string, eventId: string, ticket: Ticket): Promise<GoogleCalendarEvent> {
  if (!ticket.dueDate) {
    throw new Error('Ticket does not have a due date to schedule');
  }

  const startDay = ticket.dueDate;
  const endDay = getNextDayDateString(ticket.dueDate);

  const eventBody = {
    summary: `STS: [${ticket.priority}] ${ticket.title} (${ticket.id})`,
    description: `Ticket Details:
• ID: ${ticket.id}
• Priority: ${ticket.priority}
• Type: ${ticket.type}
• Status: ${ticket.status}
• Assignee: ${ticket.assignee || 'Unassigned'}

Notes:
${ticket.notes || 'No added notes.'}

Created via ScaleSmart Ticketing System (STS).`,
    start: {
      date: startDay,
    },
    end: {
      date: endDay,
    },
  };

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('INSUFFICIENT_SCOPES');
    }
    const errorMsg = await response.text();
    throw new Error(`Failed to update calendar event: ${errorMsg}`);
  }

  return response.json();
}

/**
 * Delete a Google Calendar event.
 */
export async function deleteCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    if (response.status === 403) {
      throw new Error('INSUFFICIENT_SCOPES');
    }
    const errorMsg = await response.text();
    throw new Error(`Failed to delete calendar event: ${errorMsg}`);
  }
}
