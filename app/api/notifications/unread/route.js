import { getServerSession } from 'next-auth/next';

import { authOptions } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const count = await prisma.notification.count({
    where: { userId, readAt: null },
  });

  return Response.json({ count });
}
