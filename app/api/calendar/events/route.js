import { getServerSession } from 'next-auth/next';
import { google } from 'googleapis';

import { authOptions } from '../../../../lib/auth';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.googleAccessToken) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const maxResults = Number(searchParams.get('maxResults') || '15');

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.googleAccessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const now = new Date();
  const events = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const items = (events.data.items || []).map((e) => ({
    id: e.id,
    summary: e.summary || '',
    start: e.start?.dateTime || e.start?.date || '',
    end: e.end?.dateTime || e.end?.date || '',
    htmlLink: e.htmlLink || '',
  }));

  return Response.json({ events: items });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.googleAccessToken) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const summary = String(body?.summary || '').trim();
  const start = String(body?.start || '').trim();
  const end = String(body?.end || '').trim();
  const attendeesRaw = Array.isArray(body?.attendees) ? body.attendees : [];
  const attendees = attendeesRaw
    .map((email) => String(email || '').trim())
    .filter(Boolean)
    .map((email) => ({ email }));

  if (!summary) return Response.json({ error: 'Missing summary' }, { status: 400 });
  if (!start) return Response.json({ error: 'Missing start' }, { status: 400 });
  if (!end) return Response.json({ error: 'Missing end' }, { status: 400 });

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.googleAccessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const created = await calendar.events.insert({
    calendarId: 'primary',
    sendUpdates: attendees.length ? 'all' : 'none',
    requestBody: {
      summary,
      start: { dateTime: start },
      end: { dateTime: end },
      attendees: attendees.length ? attendees : undefined,
    },
  });

  return Response.json({ id: created.data.id, htmlLink: created.data.htmlLink || '' });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.googleAccessToken) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const eventId = String(body?.eventId || '').trim();
  const summary = body?.summary !== undefined ? String(body.summary).trim() : undefined;
  const start = body?.start !== undefined ? String(body.start).trim() : undefined;
  const end = body?.end !== undefined ? String(body.end).trim() : undefined;

  if (!eventId) return Response.json({ error: 'Missing eventId' }, { status: 400 });

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.googleAccessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const patch = {};
  if (summary !== undefined) patch.summary = summary;
  if (start !== undefined) patch.start = { dateTime: start };
  if (end !== undefined) patch.end = { dateTime: end };

  const updated = await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    sendUpdates: 'all',
    requestBody: patch,
  });

  return Response.json({ id: updated.data.id, htmlLink: updated.data.htmlLink || '' });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session?.googleAccessToken) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const eventId = String(searchParams.get('eventId') || '').trim();
  if (!eventId) return Response.json({ error: 'Missing eventId' }, { status: 400 });

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.googleAccessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
    sendUpdates: 'all',
  });

  return Response.json({ ok: true });
}
