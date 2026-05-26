import { Ticket, TicketType, TicketPriority, TicketStatus, TicketSource, ActivityLog } from '../types';

/**
 * Search the user's Google Drive for a spreadsheet named "ScaleSmart Ticketing System (STS)".
 */
export async function searchSpreadsheet(accessToken: string): Promise<string | null> {
  try {
    const q = encodeURIComponent("name = 'ScaleSmart Ticketing System (STS)' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Error searching spreadsheet:', err);
      return null;
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('Network error during spreadsheet search:', error);
    return null;
  }
}

/**
 * Create a new spreadsheet with the correct schema tabs (Tickets and Activity Log).
 */
export async function createSpreadsheet(accessToken: string): Promise<string> {
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
            columnCount: 11,
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
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to create spreadsheet');
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;

  // Initialize the headers in both sheets
  await writeHeaders(accessToken, spreadsheetId);

  return spreadsheetId;
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
  ];

  const logHeaders = ['Timestamp', 'Ticket ID', 'Action', 'Details'];

  // Write Tickets headers
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tickets!A1:K1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: 'Tickets!A1:K1',
      majorDimension: 'ROWS',
      values: [ticketsHeaders],
    }),
  });

  // Write Log headers
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Activity Log!A1:D1?valueInputOption=USER_ENTERED`, {
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
}

/**
 * Pull the list of tickets from Google Sheets
 */
export async function fetchSpreadsheetTickets(accessToken: string, spreadsheetId: string): Promise<Ticket[]> {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tickets!A2:K1000`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
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
    };
  });
}

/**
 * Synchronize the whole react ticket state back to the spreadsheet.
 * It clears everything starting from row 2 and overwrites with the current array.
 */
export async function syncSpreadsheetTickets(accessToken: string, spreadsheetId: string, tickets: Ticket[]): Promise<void> {
  // 1. Clear current values
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tickets!A2:K1000:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

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
  ]);

  // 3. Write rows
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tickets!A2:K${tickets.length + 1}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `Tickets!A2:K${tickets.length + 1}`,
      majorDimension: 'ROWS',
      values: rows,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update spreadsheet tickets');
  }
}

/**
 * Append an activity record to the Activity Log sheet
 */
export async function logSpreadsheetActivity(accessToken: string, spreadsheetId: string, log: ActivityLog): Promise<void> {
  try {
    const row = [log.timestamp, log.ticketId, log.action, log.details];

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Activity Log!A:D:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'Activity Log!A:D',
        majorDimension: 'ROWS',
        values: [row],
      }),
    });

    if (!response.ok) {
      console.error('Failed to append activity log:', await response.text());
    }
  } catch (error) {
    console.error('Network error during activity logging:', error);
  }
}
