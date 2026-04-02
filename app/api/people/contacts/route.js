import { google } from 'googleapis';

import { requireGoogle } from '../../../../lib/apiAuth';

export async function GET(req) {
  const auth = await requireGoogle(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: auth.googleAccessToken });

  const people = google.people({ version: 'v1', auth: oauth2Client });
  const connections = await people.people.connections.list({
    resourceName: 'people/me',
    pageSize: 20,
    personFields: 'names,emailAddresses,photos',
  });

  const items = connections.data.connections || [];
  const contacts = items
    .map((p) => {
      const name = p.names?.[0]?.displayName || '';
      const email = p.emailAddresses?.[0]?.value || '';
      const photo = p.photos?.[0]?.url || '';
      return { name, email, photo };
    })
    .filter((c) => c.name || c.email);

  return Response.json({ contacts });
}
