import { redirect } from 'next/navigation';

import { requireAdmin } from '../../../../lib/apiAuth';
import prisma from '../../../../lib/prisma';

export async function POST(req) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });

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
