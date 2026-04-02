'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

import useNotificationCount from './useNotificationCount.js';

export default function AppShell({ title, children }) {
  const { data: session, status } = useSession();
  const enabled = status === 'authenticated';
  const { count } = useNotificationCount({ enabled });

  const isAdmin = !!session?.isAdmin;

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <header className="mx-auto max-w-6xl px-6 pt-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold leading-none">MonAPP</div>
              <div className="mt-1 text-xs text-slate-300">{title}</div>
            </div>

            <div className="flex items-center gap-2">
              {status === 'authenticated' ? (
                <>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold shadow hover:bg-indigo-400"
                >
                  Se connecter
                </button>
              )}
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <a href="/" className="rounded-xl bg-slate-900/40 px-3 py-2 text-xs font-semibold hover:bg-slate-900/60">
              Home
            </a>
            <a
              href="/dashboard"
              className="rounded-xl bg-slate-900/40 px-3 py-2 text-xs font-semibold hover:bg-slate-900/60"
            >
              Dashboard
            </a>
            <a
              href="/notifications"
              className="relative rounded-xl bg-slate-900/40 px-3 py-2 text-xs font-semibold hover:bg-slate-900/60"
            >
              Notifications
              {enabled && count > 0 ? (
                <span className="ml-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {count}
                </span>
              ) : null}
            </a>
            {isAdmin ? (
              <a
                href="/admin"
                className="rounded-xl bg-slate-900/40 px-3 py-2 text-xs font-semibold hover:bg-slate-900/60"
              >
                Admin
              </a>
            ) : null}
            <a
              href="/privacy"
              className="rounded-xl bg-slate-900/40 px-3 py-2 text-xs font-semibold hover:bg-slate-900/60"
            >
              Privacy
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-10">{children}</main>
    </div>
  );
}
