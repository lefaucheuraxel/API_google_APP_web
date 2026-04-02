import { google } from 'googleapis';

import { requireGoogle } from '../../../../lib/apiAuth';

function encodeMessage({ to, subject, text }) {
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    text,
  ];

  const message = messageParts.join('\r\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export async function POST(req) {
  const auth = await requireGoogle(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const to = (body?.to || '').trim();
  const subject = (body?.subject || '').trim();
  const text = (body?.text || '').trim();

  if (!to) return Response.json({ error: 'Missing to' }, { status: 400 });
  if (!subject) return Response.json({ error: 'Missing subject' }, { status: 400 });
  if (!text) return Response.json({ error: 'Missing text' }, { status: 400 });

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: auth.googleAccessToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const encodedMessage = encodeMessage({ to, subject, text });

  const sent = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage },
  });

  return Response.json({ id: sent.data.id });
}
