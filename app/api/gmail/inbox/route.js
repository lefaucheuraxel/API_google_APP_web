import { google } from 'googleapis';

import { requireGoogle } from '../../../../lib/apiAuth';

export async function GET(req) {
  const auth = await requireGoogle(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: auth.googleAccessToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const list = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 10,
    labelIds: ['INBOX'],
  });

  const ids = list.data.messages || [];

  const messages = await Promise.all(
    ids.map(async (m) => {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: m.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      });

      const headers = msg.data.payload?.headers || [];
      const subject = headers.find((h) => h.name === 'Subject')?.value || '';
      const from = headers.find((h) => h.name === 'From')?.value || '';
      const date = headers.find((h) => h.name === 'Date')?.value || '';

      return {
        id: msg.data.id,
        subject,
        from,
        date,
        snippet: msg.data.snippet || '',
      };
    })
  );

  return Response.json({ messages });
}
