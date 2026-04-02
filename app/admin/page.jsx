import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';

import Shell from '../../components/Shell.jsx';
import { authOptions } from '../../lib/auth';
import prisma from '../../lib/prisma';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.isAdmin) redirect('/');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return (
    <Shell
      title="Admin"
      actions={
        <>
          <a
            href="/dashboard"
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
          >
            Dashboard
          </a>
          <a
            href="/"
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
          >
            Accueil
          </a>
        </>
      }
    >
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-sm font-semibold">Utilisateurs</div>
        <div className="mt-1 text-xs text-slate-300">
          Admin unique: {session?.user?.email}
        </div>

        <div className="mt-6 grid gap-3">
          {users.map((u) => (
            <div key={u.id} className="rounded-xl bg-slate-900/50 p-4">
              <div className="text-sm font-semibold text-slate-100">{u.email || '(no email)'}</div>
              <div className="mt-1 text-xs text-slate-300">{u.name || ''}</div>
              <div className="mt-1 text-xs text-slate-400">{new Date(u.createdAt).toLocaleString()}</div>
              <form action="/api/admin/message" method="post" className="mt-3 grid gap-2">
                <input type="hidden" name="userId" value={u.id} />
                <input
                  name="subject"
                  placeholder="Sujet"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                />
                <textarea
                  name="body"
                  placeholder="Message (notification + email optionnel)"
                  className="h-20 w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
                />
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input type="checkbox" name="sendEmail" className="accent-indigo-500" />
                  Envoyer aussi par email (via Gmail admin)
                </label>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold shadow hover:bg-indigo-400"
                >
                  Envoyer
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
