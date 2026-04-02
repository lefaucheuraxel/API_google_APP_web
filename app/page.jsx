'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Shell from '../components/Shell.jsx';

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <Shell
      title="Google APIs Playground"
      actions={
        status === 'authenticated' ? (
          <>
            <a
              href="/dashboard"
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
            >
              Dashboard
            </a>
            {session?.isAdmin ? (
              <a
                href="/admin"
                className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
              >
                Admin
              </a>
            ) : null}
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
            Se connecter avec Google
          </button>
        )
      }
    >
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Site moderne + APIs Google</h1>
        <p className="mt-2 text-sm text-slate-300">
          Connecte-toi pour accéder au dashboard (Gmail inbox + envoi, Calendar, Contacts) et aux notifications.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-900/50 p-4">
            <div className="text-sm font-semibold">Gmail</div>
            <div className="mt-1 text-xs text-slate-300">Lister la boîte de réception et envoyer des emails.</div>
          </div>
          <div className="rounded-xl bg-slate-900/50 p-4">
            <div className="text-sm font-semibold">Calendar</div>
            <div className="mt-1 text-xs text-slate-300">Créer des événements et inviter des participants.</div>
          </div>
        </div>

        <div className="mt-6 text-xs text-slate-400">
          <a href="/privacy" className="hover:text-slate-200">Politique de confidentialité</a>
        </div>
      </section>
    </Shell>
  );
}
