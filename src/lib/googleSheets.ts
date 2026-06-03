import { Ticket, TicketType, TicketPriority, TicketStatus, TicketSource, ActivityLog } from '../types';
import { refreshGoogleToken } from './firebase';

/**
 * Executes a function with a given token. If it throws a 401 (UNAUTHENTICATED) error,
 * attempts to silently refresh the token and retries the function exactly once with the new token.
 */
async function executeWithRetry<T>(
  initialToken: string,
  fn: (token: string) => Promise<T>
): Promise<T> {
  try {
    return await fn(initialToken);
  } catch (error: any) {
    if (error.message === 'UNAUTHENTICATED') {
      console.log('UNAUTHENTICATED (401) detected. Attempting to silently refresh Google OAuth token...');
      const newToken = await refreshGoogleToken();
      if (newToken) {
        console.log('Google OAuth token silently refreshed. Retrying request once...');
        return await fn(newToken);
      }
    }
    // Propagate the original error (which will force a full logout / re-login via handleAuthExpired)
    throw error;
  }
}

/**
 * Search the user's Google Drive for a spreadsheet named "ScaleSmart Ticketing System (STS)".
 */
export async function searchSpreadsheet(accessToken: string): Promise<string | null> {
  return executeWithRetry(accessToken, async (token) => {
    const q = encodeURIComponent("name = 'ScaleSmart Ticketing System (STS)' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHENTICATED');
      }
      const err = await response.json();
      console.error('Error searching spreadsheet:', err);
      return null;
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  }).catch((error) => {
    console.error('Network error during spreadsheet search:', error);
    if (error.message === 'UNAUTHENTICATED') {
      throw error;
    }
    return null;
  });
}

/**
 * Create a new spreadsheet with the correct schema tabs (Tickets and Activity Log).
 */
export async function createSpreadsheet(accessToken: string): Promise<string> {
  return executeWithRetry(accessToken, async (token) => {
    const body = {
      properties: {
        title: 'ScaleSmart Ticketing System (STS)',
      },
      sheets: [
        {
          properties: {
            title: 'Tickets',
            gridProperties: {
              frozenRowCount: 1,
              columnCount: 13,
            },
          },
        },
        {
          properties: {
            title: 'Activity Log',
            gridProperties: {
              frozenRowCount: 1,
              columnCount: 4,
            },
          },
        },
      ],
    };

    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHENTICATED');
      }
      const err = await response.json();
      throw new Error(err.error?.message || 'Failed to create spreadsheet');
    }

    const data = await response.json();
    const spreadsheetId = data.spreadsheetId;

    // Initialize the headers in both sheets
    await writeHeaders(token, spreadsheetId);

    return spreadsheetId;
  });
}

/**
 * Initialize headers for Tickets & Activity Log sheets
 */
async function writeHeaders(accessToken: string, spreadsheetId: string): Promise<void> {
  const ticketsHeaders = [
    'Ticket ID',
    'Title',
    'Type',
    'Priority',
    'Status',
    'Notes',
    'Tags',
    'Source',
    'Created At',
    'Updated At',
    'Dependencies',
    'Due Date',
    'Assignee',
  ];

  const logHeaders = ['Timestamp', 'Ticket ID', 'Action', 'Details'];

  // Write Tickets headers
  const tHeaderResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tickets!A1:M1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: 'Tickets!A1:M1',
      majorDimension: 'ROWS',
      values: [ticketsHeaders],
    }),
  });

  if (!tHeaderResp.ok && tHeaderResp.status === 401) {
    throw new Error('UNAUTHENTICATED');
  }

  // Write Log headers
  const lHeaderResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Activity Log!A1:D1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: 'Activity Log!A1:D1',
      majorDimension: 'ROWS',
      values: [logHeaders],
    }),
  });

  if (!lHeaderResp.ok && lHeaderResp.status === 401) {
    throw new Error('UNAUTHENTICATED');
  }
}

/**
 * Pull the list of tickets from Google Sheets
 */
export async function fetchSpreadsheetTickets(accessToken: string, spreadsheetId: string): Promise<Ticket[]> {
  return executeWithRetry(accessToken, async (token) => {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tickets!A2:M1000`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHENTICATED');
      }
      throw new Error('Failed to fetch tickets from spreadsheet');
    }

    const data = await response.json();
    const rows = data.values || [];

    return rows.map((row: any[]): Ticket => {
      return {
        id: row[0] || '',
        title: row[1] || '',
        type: (row[2] || 'Task') as TicketType,
        priority: (row[3] || 'P2') as TicketPriority,
        status: (row[4] || 'Open') as TicketStatus,
        notes: row[5] || '',
        tags: row[6]?.trim() ? row[6].split(',').map((t: string) => t.trim()).filter((t: string) => t !== '') : [],
        source: (row[7] || 'Manual') as TicketSource,
        createdAt: row[8] || new Date().toISOString(),
        updatedAt: row[9] || new Date().toISOString(),
        dependencies: row[10]?.trim() ? row[10].split(',').map((d: string) => d.trim()).filter(Boolean) : [],
        dueDate: row[11] || '',
        assignee: row[12] || '',
      };
    });
  });
}

/**
 * Synchronize the whole react ticket state back to the spreadsheet.
 * It clears everything starting from row 2 and overwrites with the current array.
 */
export async function syncSpreadsheetTickets(accessToken: string, spreadsheetId: string, tickets: Ticket[]): Promise<void> {
  return executeWithRetry(accessToken, async (token) => {
    // 1. Clear current values
    const clearResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tickets!A2:M1000:clear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!clearResponse.ok) {
      if (clearResponse.status === 401) {
        throw new Error('UNAUTHENTICATED');
      }
      throw new Error('Failed to clear spreadsheet tickets');
    }

    if (tickets.length === 0) {
      return;
    }

    // 2. Prepare the payload rows
    const rows = tickets.map((t) => [
      t.id,
      t.title,
      t.type,
      t.priority,
      t.status,
      t.notes,
      t.tags.join(', '),
      t.source,
      t.createdAt,
      t.updatedAt,
      (t.dependencies || []).join(', '),
      t.dueDate || '',
      t.assignee || '',
    ]);

    // 3. Write rows
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tickets!A2:M${tickets.length + 1}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `Tickets!A2:M${tickets.length + 1}`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHENTICATED');
      }
      throw new Error('Failed to update spreadsheet tickets');
    }
  });
}

/**
 * Append an activity record to the Activity Log sheet
 */
export async function logSpreadsheetActivity(accessToken: string, spreadsheetId: string, log: ActivityLog): Promise<void> {
  return executeWithRetry(accessToken, async (token) => {
    const row = [log.timestamp, log.ticketId, log.action, log.details];

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Activity Log!A:D:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'Activity Log!A:D',
        majorDimension: 'ROWS',
        values: [row],
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHENTICATED');
      }
      console.error('Failed to append activity log:', await response.text());
    }
  }).catch((error) => {
    console.error('Network error during activity logging:', error);
    if (error.message === 'UNAUTHENTICATED') {
      throw error;
    }
  });
}
