import { Ticket } from '../types';
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
      console.log('UNAUTHENTICATED (401) detected in Gmail request. Attempting to silently refresh token...');
      const newToken = await refreshGoogleToken();
      if (newToken) {
        console.log('Google OAuth token silently refreshed. Retrying Gmail request once...');
        return await fn(newToken);
      }
    }
    throw error;
  }
}

/**
 * Encodes a string into base64url format.
 */
function encodeBase64Url(str: string): string {
  try {
    // Escape unicode characters for safe base64 encoding in browser
    const utf8Bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < utf8Bytes.byteLength; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    console.error('Base64 encoding error:', e);
    // Fallback standard btoa for basic character sets
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}

/**
 * Send a due-tasks notification email summary through Gmail API.
 */
export async function sendGmailNotification(
  accessToken: string,
  recipient: string,
  tickets: Ticket[],
  username?: string
): Promise<boolean> {
  return executeWithRetry(accessToken, async (token) => {
    if (!tickets || tickets.length === 0) {
      console.log('No tickets to summarize.');
      return false;
    }

    const todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Count by status/priority
    const priorityCounts = tickets.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Construct the HTML Email Body
    let htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em; }
        .header p { margin: 4px 0 0 0; opacity: 0.85; font-size: 13px; font-weight: 500; }
        .content { padding: 24px; }
        .summary-pill-container { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .summary-pill { background: #f1f5f9; padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #475569; border: 1px solid #cbd5e1; }
        .summary-pill.p0 { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
        .summary-pill.p1 { background: #fff7ed; color: #ea580c; border-color: #ffedd5; }
        .ticket-list { margin-top: 16px; }
        .ticket-item { border: 1px solid #ebd5e1; background: #fafbfe; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #3b82f6; }
        .ticket-item.p0 { border-left-color: #ef4444; }
        .ticket-item.p1 { border-left-color: #f97316; }
        .ticket-item.p2 { border-left-color: #3b82f6; }
        .ticket-item.p3 { border-left-color: #10b981; }
        .ticket-title { font-weight: 700; font-size: 14px; margin: 0 0 4px 0; color: #0f172a; }
        .meta-line { font-size: 12px; color: #64748b; margin: 2px 0; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-right: 4px; }
        .badge-p0 { background: #fee2e2; color: #991b1b; }
        .badge-p1 { background: #ffedd5; color: #9a3412; }
        .badge-p2 { background: #dbeafe; color: #1e40af; }
        .badge-p3 { background: #d1fae5; color: #065f46; }
        .footer { background: #f1f5f9; text-align: center; color: #64748b; font-size: 11px; padding: 16px; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>ScaleSmart STS Due Task Alert</h1>
          <p>Task summary generated on ${todayDate}</p>
        </div>
        
        <div class="content">
          <p style="margin-top: 0; font-size: 14px; line-height: 1.5;">
            Hello ${username || 'Operator'},<br/>
            You have <strong>${tickets.length} urgent active task(s)</strong> due today or approaching their deadlines soon. Please review and process them promptly in the ScaleSmart STS Queue:
          </p>
          
          <div style="margin: 16px 0;">
            <strong>Urgent Count by Priority:</strong>
            <div style="display: flex; gap: 8px; margin-top: 8px;">
              ${Object.entries(priorityCounts).map(([pr, count]) => `
                <span class="summary-pill ${pr.toLowerCase()}">${pr}: <strong>${count}</strong></span>
              `).join(' ')}
            </div>
          </div>
          
          <div class="ticket-list">
            ${tickets.map((t) => {
              const dueStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Date';
              return `
                <div class="ticket-item ${t.priority.toLowerCase()}">
                  <div class="ticket-title">[${t.id}] ${t.title}</div>
                  <div class="meta-line">
                    <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
                    <span class="badge" style="background-color: #cbd5e1; color: #334155;">${t.type}</span>
                    <span class="badge" style="background-color: #e2e8f0; color: #475569;">${t.status}</span>
                  </div>
                  <div class="meta-line" style="margin-top: 8px;">
                    <strong>Due Date:</strong> <span style="color: #ef4444; font-weight: 600;">${dueStr}</span>
                    ${t.assignee ? `&nbsp;|&nbsp; <strong>Assignee:</strong> ${t.assignee}` : ''}
                  </div>
                  ${t.notes ? `
                    <div style="background: #ffffff; border: 1px solid #f1f5f9; padding: 8px; border-radius: 4px; margin-top: 8px; font-size: 11.5px; max-height: 100px; overflow-y: auto; color: #475569;">
                      ${t.notes.replace(/\n/g, '<br/>')}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
          
          <p style="font-size: 12.5px; color: #475569; margin-top: 24px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 16px;">
            To update status, view dependencies, or modify descriptions, please open your <strong>ScaleSmart STS workspace</strong>.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>ScaleSmart Ticketing System (STS)</strong></p>
          <p>This automated summary notification of urgent milestones was triggered securely via Gmail API.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Strip any leading whitespaces/newlines from headers
    const emailHeaderLines = [
      `To: ${recipient}`,
      `Subject: ScaleSmart STS: ${tickets.length} Task(s) Due / Approaching Deadline`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      'X-Mailer: ScaleSmart-STS-App',
      '',
      htmlBody
    ];

    const mimeMessage = emailHeaderLines.join('\r\n');
    const rawEncoded = encodeBase64Url(mimeMessage);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: rawEncoded,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHENTICATED');
      }
      const err = await response.json();
      console.error('Gmail send API failed:', err);
      throw new Error(err.error?.message || 'Failed to send Gmail message');
    }

    console.log('Gmail notification email sent successfully!');
    return true;
  });
}
