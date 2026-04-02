import { google } from 'googleapis';

import { requireGoogle } from '../../../../lib/apiAuth';

export async function GET(req) {
  const auth = await requireGoogle(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: auth.googleAccessToken });

  const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
  const me = await oauth2.userinfo.get();

  return Response.json({ user: me.data });
}
