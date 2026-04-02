import { getServerSession } from 'next-auth/next';
import { google } from 'googleapis';

import { authOptions } from '../../../../lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.googleAccessToken) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.googleAccessToken });

  const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
  const me = await oauth2.userinfo.get();

  return Response.json({ user: me.data });
}
