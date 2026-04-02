import { createRequire } from 'module';

import prisma from './prisma';

const require = createRequire(import.meta.url);

const NextAuthImport = require('next-auth');
const NextAuthFn = NextAuthImport?.default ?? NextAuthImport;

const GoogleProviderImport = require('next-auth/providers/google');
const GoogleProvider = GoogleProviderImport?.default ?? GoogleProviderImport;

const PrismaAdapterImport = require('@next-auth/prisma-adapter');
const PrismaAdapter = PrismaAdapterImport?.PrismaAdapter ?? PrismaAdapterImport;

async function refreshGoogleAccessToken(token) {
  try {
    if (!token?.googleRefreshToken) return { ...token, error: 'NoRefreshToken' };

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: token.googleRefreshToken,
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const refreshed = await res.json();
    if (!res.ok) throw refreshed;

    return {
      ...token,
      googleAccessToken: refreshed.access_token,
      googleAccessTokenExpiresAt: Date.now() + refreshed.expires_in * 1000,
      googleRefreshToken: refreshed.refresh_token ?? token.googleRefreshToken,
      error: undefined,
    };
  } catch (err) {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/contacts.readonly',
          ].join(' '),
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (user?.id) token.userId = user.id;

      if (account?.provider === 'google') {
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
        token.googleAccessTokenExpiresAt = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 60 * 60 * 1000;
      }

      if (token.googleAccessToken && token.googleAccessTokenExpiresAt) {
        const shouldRefresh = Date.now() >= token.googleAccessTokenExpiresAt - 60 * 1000;
        if (shouldRefresh) return refreshGoogleAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.userId) session.user.id = token.userId;
      session.googleAccessToken = token.googleAccessToken;
      session.googleTokenError = token.error;
      session.isAdmin =
        session?.user?.email &&
        session.user.email.toLowerCase() ===
          (process.env.ADMIN_EMAIL || 'lefaucheuraxel@gmail.com').toLowerCase();
      return session;
    },
  },
};

export function nextAuthHandler() {
  return NextAuthFn(authOptions);
}
