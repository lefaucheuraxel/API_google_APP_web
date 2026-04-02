import { getToken } from 'next-auth/jwt';

function isAdminEmail(email) {
  if (!email) return false;
  const admin = (process.env.ADMIN_EMAIL || 'lefaucheuraxel@gmail.com').toLowerCase();
  return String(email).toLowerCase() === admin;
}

export async function requireAuth(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return { ok: false, status: 401, error: 'Not authenticated' };
  }

  const userId = token.userId;
  const email = token.email;
  const googleAccessToken = token.googleAccessToken;

  return {
    ok: true,
    token,
    userId,
    email,
    isAdmin: isAdminEmail(email),
    googleAccessToken,
  };
}

export async function requireGoogle(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth;
  if (!auth.googleAccessToken) {
    return { ok: false, status: 401, error: 'Missing Google access token' };
  }
  return auth;
}

export async function requireAdmin(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth;
  if (!auth.isAdmin) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }
  return auth;
}
