import { nextAuthHandler } from '../../../../lib/auth';

const handler = nextAuthHandler();

export { handler as GET, handler as POST };
