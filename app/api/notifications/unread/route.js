import { requireAuth } from '../../../../lib/apiAuth';
import prisma from '../../../../lib/prisma';

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  const userId = auth.userId;
  if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400 });

  const count = await prisma.notification.count({
    where: { userId, readAt: null },
  });

  return Response.json({ count });
}
