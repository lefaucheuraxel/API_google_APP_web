import { getServerSession } from 'next-auth/next';
import { google } from 'googleapis';

import { authOptions } from '../../../../lib/auth';

function decodeBase64UrlToBuffer(data) {
  const normalized = (data || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.googleAccessToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const messageId = String(searchParams.get('messageId') || '').trim();
  const attachmentId = String(searchParams.get('attachmentId') || '').trim();
  const filename = String(searchParams.get('filename') || 'attachment').trim();
  const mimeType = String(searchParams.get('mimeType') || 'application/octet-stream').trim();

  if (!messageId || !attachmentId) return new Response('Missing params', { status: 400 });

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.googleAccessToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const att = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId,
    id: attachmentId,
  });

  const buf = decodeBase64UrlToBuffer(att.data.data);

  return new Response(buf, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename.replace(/\"/g, '')}"`,
      'Cache-Control': 'no-store',
    },
  });
}
