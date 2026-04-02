import { requireAuth } from '../../../../lib/apiAuth';
import prisma from '../../../../lib/prisma';

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return new Response('Unauthorized', { status: auth.status });
  const userId = auth.userId;
  if (!userId) return new Response('Missing userId', { status: 400 });

  let lastCount = null;
  let interval = null;
  let keepAlive = null;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (obj) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      send({ count: 0, ready: true });

      interval = setInterval(async () => {
        try {
          const count = await prisma.notification.count({
            where: { userId, readAt: null },
          });

          if (lastCount === null || count !== lastCount) {
            lastCount = count;
            send({ count });
          }
        } catch {
          // ignore
        }
      }, 5000);

      keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          // ignore
        }
      }, 15000);
    },
    cancel() {
      if (interval) clearInterval(interval);
      if (keepAlive) clearInterval(keepAlive);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
