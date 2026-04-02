import { requireAuth } from '../../../lib/apiAuth';
import prisma from '../../../lib/prisma';

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  const userId = auth.userId;
  if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400 });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: { id: true, title: true, body: true, readAt: true, createdAt: true },
  });

  return Response.json({ notifications });
}

export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  const userId = auth.userId;
  if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id || '');
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });

  return Response.json({ ok: true });
}
