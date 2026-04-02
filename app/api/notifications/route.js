import { getServerSession } from 'next-auth/next';

import { authOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: { id: true, title: true, body: true, readAt: true, createdAt: true },
  });

  return Response.json({ notifications });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id || '');
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });

  return Response.json({ ok: true });
}
