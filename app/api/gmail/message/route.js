import { google } from 'googleapis';

import { requireGoogle } from '../../../../lib/apiAuth';

function decodeBase64Url(data) {
  if (!data) return '';
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function findBodies(payload) {
  let text = '';
  let html = '';

  function walk(part) {
    if (!part) return;

    const mime = part.mimeType;
    const bodyData = part.body?.data;

    if (mime === 'text/plain' && bodyData && !text) text = decodeBase64Url(bodyData);
    if (mime === 'text/html' && bodyData && !html) html = decodeBase64Url(bodyData);

    const parts = part.parts || [];
    for (const p of parts) walk(p);
  }

  walk(payload);

  return { text, html };
}

function findAttachments(payload) {
  const out = [];

  function walk(part) {
    if (!part) return;
    const filename = part.filename;
    const attachmentId = part.body?.attachmentId;
    const size = part.body?.size;
    if (filename && attachmentId) {
      out.push({ filename, attachmentId, mimeType: part.mimeType || '', size: size || 0 });
    }
    const parts = part.parts || [];
    for (const p of parts) walk(p);
  }

  walk(payload);
  return out;
}

export async function GET(req) {
  const auth = await requireGoogle(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get('id') || '').trim();
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: auth.googleAccessToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const msg = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });

  const headers = msg.data.payload?.headers || [];
  const subject = headers.find((h) => h.name === 'Subject')?.value || '';
  const from = headers.find((h) => h.name === 'From')?.value || '';
  const to = headers.find((h) => h.name === 'To')?.value || '';
  const date = headers.find((h) => h.name === 'Date')?.value || '';

  const { text, html } = findBodies(msg.data.payload);
  const attachments = findAttachments(msg.data.payload);

  return Response.json({
    message: {
      id: msg.data.id,
      threadId: msg.data.threadId,
      subject,
      from,
      to,
      date,
      snippet: msg.data.snippet || '',
      text,
      html,
      attachments,
    },
  });
}
