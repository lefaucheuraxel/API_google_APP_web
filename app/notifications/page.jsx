'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

import AppShell from '../../components/AppShell.jsx';

export default function NotificationsPage() {
  const { status } = useSession();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const unreadCount = useMemo(() => items.filter((n) => !n.readAt).length, [items]);

  async function load() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur notifications');
      setItems(data.notifications || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur mark read');
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function markAllRead() {
    const unread = items.filter((n) => !n.readAt);
    for (const n of unread) {
      // sequential to keep it simple
      // eslint-disable-next-line no-await-in-loop
      await markRead(n.id);
    }
  }

  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status]);

  return (
    <AppShell title="Notifications">
      {status !== 'authenticated' ? (
        <section className="float-in rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-slate-300">Connecte-toi pour voir tes notifications.</div>
        </section>
      ) : (
        <section className="fade-in rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Boîte de notifications</div>
              <div className="mt-1 text-xs text-slate-300">
                {unreadCount} non lue(s) · {items.length} total
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                disabled={loading}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700 disabled:opacity-60"
              >
                Rafraîchir
              </button>
              <button
                onClick={markAllRead}
                disabled={loading || unreadCount === 0}
                className="rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold hover:bg-indigo-400 disabled:opacity-60"
              >
                Tout marquer lu
              </button>
            </div>
          </div>

          {error ? <div className="mt-4 text-xs text-red-300">{error}</div> : null}

          <div className="mt-6 grid gap-3">
            {loading && items.length === 0 ? <div className="shimmer h-24 rounded-xl" /> : null}

            {items.length === 0 && !loading ? (
              <div className="text-xs text-slate-400">Aucune notification.</div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => (n.readAt ? null : markRead(n.id))}
                  className={`text-left rounded-xl p-4 transition border ${
                    n.readAt
                      ? 'border-white/10 bg-slate-900/30 hover:bg-slate-900/40'
                      : 'border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/15'
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-100">{n.title}</div>
                  <div className="mt-1 text-xs text-slate-300">{n.body}</div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    {new Date(n.createdAt).toLocaleString()} {n.readAt ? '· lu' : '· non lu'}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      )}
    </AppShell>
  );
}
