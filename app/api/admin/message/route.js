import { getServerSession } from 'next-auth/next';
import { google } from 'googleapis';

import { authOptions } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

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
  const session = await getServerSession(authOptions);
  if (!session?.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!session?.googleAccessToken) {
    return Response.json({ error: 'Admin Google token missing' }, { status: 400 });
  }

  const form = await req.formData();
  const userId = String(form.get('userId') || '');
  const subject = String(form.get('subject') || '').trim();
  const body = String(form.get('body') || '').trim();
  const sendEmail = String(form.get('sendEmail') || '') === 'on';

  if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400 });
  if (!subject) return Response.json({ error: 'Missing subject' }, { status: 400 });
  if (!body) return Response.json({ error: 'Missing body' }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  await prisma.message.create({
    data: {
      toUserId: user.id,
      fromEmail: session.user.email || 'admin',
      subject,
      body,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: subject,
      body,
    },
  });

  if (sendEmail) {
    if (!user.email) return Response.json({ error: 'Target user has no email' }, { status: 400 });

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.googleAccessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const raw = encodeMessage({ to: user.email, subject, text: body });

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
  }

  return Response.redirect(new URL('/admin', req.url));
}
