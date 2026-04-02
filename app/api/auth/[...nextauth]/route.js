import { nextAuthHandler } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

const handler = nextAuthHandler();

export { handler as GET, handler as POST };
