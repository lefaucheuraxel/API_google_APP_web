'use client';

import { useEffect, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Shell from '../../components/Shell.jsx';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);

  const [me, setMe] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');

  const [eventSummary, setEventSummary] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [eventAttendees, setEventAttendees] = useState('');

  const [editingEvent, setEditingEvent] = useState(null);
  const [editSummary, setEditSummary] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [messageDetail, setMessageDetail] = useState(null);

  function isoPlusMinutes(mins) {
    return new Date(Date.now() + mins * 60 * 1000).toISOString().slice(0, 16);
  }

  async function loadMessage(id) {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/gmail/message?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur message');
      setSelectedMessageId(id);
      setMessageDetail(data.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function closeMessage() {
    setSelectedMessageId('');
    setMessageDetail(null);
  }

  function initEventDefaults() {
    setEventSummary('Réservation MonAPP');
    setEventStart(isoPlusMinutes(60));
    setEventEnd(isoPlusMinutes(90));
    setEventAttendees('');
  }

  async function loadInbox() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/gmail/inbox');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur inbox');
      setMessages(data.messages || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile() {
    try {
      const res = await fetch('/api/people/me');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur profil');
      setMe(data.user);
    } catch (e) {
      setError((prev) => prev || e.message);
    }
  }

  async function loadContacts() {
    try {
      const res = await fetch('/api/people/contacts');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur contacts');
      setContacts(data.contacts || []);
    } catch (e) {
      setError((prev) => prev || e.message);
    }
  }

  async function loadEvents() {
    try {
      const res = await fetch('/api/calendar/events');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur events');
      setEvents(data.events || []);
    } catch (e) {
      setError((prev) => prev || e.message);
    }
  }

  async function createEvent() {
    setError('');
    setLoading(true);
    try {
      const attendees = eventAttendees
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: eventSummary,
          start: new Date(eventStart).toISOString(),
          end: new Date(eventEnd).toISOString(),
          attendees,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur création event');
      await loadEvents();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEvent(eventId) {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/events?eventId=${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur suppression');
      await loadEvents();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function startEditEvent(e) {
    setEditingEvent(e);
    setEditSummary(e.summary || '');
    setEditStart(e.start ? new Date(e.start).toISOString().slice(0, 16) : isoPlusMinutes(60));
    setEditEnd(e.end ? new Date(e.end).toISOString().slice(0, 16) : isoPlusMinutes(90));
  }

  async function saveEditEvent() {
    if (!editingEvent?.id) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: editingEvent.id,
          summary: editSummary,
          start: new Date(editStart).toISOString(),
          end: new Date(editEnd).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur édition');
      setEditingEvent(null);
      await loadEvents();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur notifications');
      setNotifications(data.notifications || []);
    } catch (e) {
      setError((prev) => prev || e.message);
    }
  }

  async function markNotificationRead(id) {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur mark read');
      await loadNotifications();
    } catch (e) {
      setError((prev) => prev || e.message);
    }
  }

  async function sendEmail() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur send');
      setTo('');
      setSubject('');
      setText('');
      await loadInbox();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      initEventDefaults();
      loadProfile();
      loadInbox();
      loadContacts();
      loadEvents();
      loadNotifications();
    }
  }, [status]);

  return (
    <Shell
      title="Dashboard"
      actions={
        status === 'authenticated' ? (
          <>
            <a
              href="/"
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
            >
              Accueil
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
            Se connecter
          </button>
        )
      }
    >
      {status !== 'authenticated' ? (
        <section className="float-in rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-slate-300">Connecte-toi pour accéder à Gmail.</div>
        </section>
      ) : (
        <div className="fade-in grid gap-6">
          <section className="float-in rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Profil</div>
                <div className="mt-1 text-xs text-slate-300">Compte connecté</div>
              </div>
              <button
                onClick={loadProfile}
                disabled={loading}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700 disabled:opacity-60"
              >
                Rafraîchir
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              {me?.picture ? (
                <img src={me.picture} alt="" className="h-10 w-10 rounded-full" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-slate-800" />
              )}
              <div>
                <div className="text-sm font-semibold text-slate-100">{me?.name || session?.user?.name || 'Utilisateur'}</div>
                <div className="text-xs text-slate-300">{me?.email || session?.user?.email || ''}</div>
                {session?.googleTokenError ? (
                  <div className="mt-1 text-xs text-amber-300">Token: {session.googleTokenError}</div>
                ) : null}
              </div>
            </div>

            {error ? <div className="mt-4 text-xs text-red-300">{error}</div> : null}
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="float-in rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">Gmail Inbox</div>
                  <div className="mt-1 text-xs text-slate-300">Derniers messages (résumé)</div>
                </div>
                <button
                  onClick={loadInbox}
                  disabled={loading}
                  className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700 disabled:opacity-60"
                >
                  Rafraîchir
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                {loading && messages.length === 0 ? (
                  <div className="shimmer h-24 rounded-xl" />
                ) : messages.length === 0 ? (
                  <div className="text-xs text-slate-400">Aucun message trouvé.</div>
                ) : (
                  messages.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => loadMessage(m.id)}
                      className="text-left rounded-xl bg-slate-900/50 p-4 transition hover:bg-slate-900/70"
                    >
                      <div className="text-sm font-semibold text-slate-100">{m.subject || '(sans sujet)'}</div>
                      <div className="mt-1 text-xs text-slate-300">De: {m.from || '-'}</div>
                      <div className="mt-1 text-xs text-slate-400">{m.snippet || ''}</div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <aside className="float-in rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold">Envoyer un email</div>
              <div className="mt-4 grid gap-3">
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="Destinataire"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                />
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Sujet"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Message"
                  className="h-28 w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                />
                <button
                  onClick={sendEmail}
                  disabled={loading || !to || !subject || !text}
                  className="rounded-xl bg-fuchsia-500 px-4 py-2 text-sm font-semibold shadow hover:bg-fuchsia-400 disabled:opacity-60"
                >
                  Envoyer
                </button>
              </div>
            </aside>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="float-in rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">Calendar</div>
                  <div className="mt-1 text-xs text-slate-300">Prochains événements</div>
                </div>
                <button
                  onClick={loadEvents}
                  disabled={loading}
                  className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700 disabled:opacity-60"
                >
                  Rafraîchir
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                {events.length === 0 ? (
                  <div className="text-xs text-slate-400">Aucun événement à venir.</div>
                ) : (
                  events.map((e) => (
                    <div key={e.id} className="rounded-xl bg-slate-900/50 p-4 transition hover:bg-slate-900/70">
                      <div className="flex items-start justify-between gap-3">
                        <a
                          href={e.htmlLink || '#'}
                          target={e.htmlLink ? '_blank' : undefined}
                          rel={e.htmlLink ? 'noreferrer' : undefined}
                          className="min-w-0"
                        >
                          <div className="truncate text-sm font-semibold text-slate-100">{e.summary || '(sans titre)'}</div>
                          <div className="mt-1 text-xs text-slate-300">Début: {e.start || '-'}</div>
                        </a>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            onClick={() => startEditEvent(e)}
                            className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-semibold hover:bg-slate-700"
                          >
                            Éditer
                          </button>
                          <button
                            onClick={() => deleteEvent(e.id)}
                            className="rounded-lg bg-rose-500/20 px-2 py-1 text-[11px] font-semibold text-rose-200 hover:bg-rose-500/25"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <aside className="float-in rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold">Créer un événement</div>
              <div className="mt-4 grid gap-3">
                <input
                  value={eventSummary}
                  onChange={(e) => setEventSummary(e.target.value)}
                  placeholder="Titre"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="datetime-local"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                  />
                  <input
                    type="datetime-local"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                  />
                </div>
                <input
                  value={eventAttendees}
                  onChange={(e) => setEventAttendees(e.target.value)}
                  placeholder="Invités (emails, séparés par virgule)"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                />
                <button
                  onClick={createEvent}
                  disabled={loading || !eventSummary || !eventStart || !eventEnd}
                  className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold shadow hover:bg-indigo-400 disabled:opacity-60"
                >
                  Créer
                </button>
              </div>
            </aside>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="float-in rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">Contacts</div>
                  <div className="mt-1 text-xs text-slate-300">Premiers contacts Google</div>
                </div>
                <button
                  onClick={loadContacts}
                  disabled={loading}
                  className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700 disabled:opacity-60"
                >
                  Rafraîchir
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {contacts.length === 0 ? (
                  <div className="text-xs text-slate-400">Aucun contact trouvé.</div>
                ) : (
                  contacts.map((c, idx) => (
                    <div key={idx} className="rounded-xl bg-slate-900/50 p-4">
                      <div className="flex items-center gap-3">
                        {c.photo ? (
                          <img src={c.photo} alt="" className="h-8 w-8 rounded-full" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-slate-800" />
                        )}
                        <div>
                          <div className="text-sm font-semibold text-slate-100">{c.name || 'Contact'}</div>
                          <div className="text-xs text-slate-300">{c.email || ''}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <aside className="float-in rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold">Notifications</div>
              <div className="mt-1 text-xs text-slate-300">Messages envoyés depuis l’admin</div>

              <div className="mt-4 grid gap-3">
                {notifications.length === 0 ? (
                  <div className="text-xs text-slate-400">Aucune notification.</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => (n.readAt ? null : markNotificationRead(n.id))}
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
            </aside>
          </div>

          {editingEvent ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
              <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">Éditer événement</div>
                    <div className="mt-1 text-xs text-slate-300">{editingEvent.summary || ''}</div>
                  </div>
                  <button
                    onClick={() => setEditingEvent(null)}
                    className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700"
                  >
                    Fermer
                  </button>
                </div>

                <div className="mt-4 grid gap-3">
                  <input
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                    placeholder="Titre"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="datetime-local"
                      value={editStart}
                      onChange={(e) => setEditStart(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                    />
                    <input
                      type="datetime-local"
                      value={editEnd}
                      onChange={(e) => setEditEnd(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                    />
                  </div>
                  <button
                    onClick={saveEditEvent}
                    disabled={loading || !editSummary || !editStart || !editEnd}
                    className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold shadow hover:bg-indigo-400 disabled:opacity-60"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {messageDetail ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
              <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{messageDetail.subject || '(sans sujet)'}</div>
                    <div className="mt-1 text-xs text-slate-300 truncate">De: {messageDetail.from || '-'}</div>
                    <div className="mt-1 text-xs text-slate-400 truncate">{messageDetail.date || ''}</div>
                  </div>
                  <button
                    onClick={closeMessage}
                    className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700"
                  >
                    Fermer
                  </button>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 p-4">
                  {messageDetail.text ? (
                    <pre className="whitespace-pre-wrap text-xs text-slate-200">{messageDetail.text}</pre>
                  ) : messageDetail.html ? (
                    <div
                      className="prose prose-invert max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: messageDetail.html }}
                    />
                  ) : (
                    <div className="text-xs text-slate-400">Contenu indisponible.</div>
                  )}
                </div>

                {Array.isArray(messageDetail.attachments) && messageDetail.attachments.length ? (
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-200">Pièces jointes</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {messageDetail.attachments.map((a, idx) => (
                        <a
                          key={idx}
                          className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-700"
                          href={`/api/gmail/attachment?messageId=${encodeURIComponent(selectedMessageId)}&attachmentId=${encodeURIComponent(
                            a.attachmentId
                          )}&filename=${encodeURIComponent(a.filename)}&mimeType=${encodeURIComponent(a.mimeType)}`}
                        >
                          {a.filename}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Shell>
  );
}
