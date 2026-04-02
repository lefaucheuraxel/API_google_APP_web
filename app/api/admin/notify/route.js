import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';

import { authOptions } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const form = await req.formData();
  const userId = String(form.get('userId') || '');
  const title = String(form.get('title') || '').trim();
  const body = String(form.get('body') || '').trim();

  if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400 });
  if (!title) return Response.json({ error: 'Missing title' }, { status: 400 });
  if (!body) return Response.json({ error: 'Missing body' }, { status: 400 });

  await prisma.notification.create({
    data: {
      userId,
      title,
      body,
    },
  });

  redirect('/admin');
}
