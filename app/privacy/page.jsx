import Shell from '../../components/Shell.jsx';

export default function PrivacyPage() {
  return (
    <Shell
      title="Politique de confidentialité"
      actions={
        <a
          href="/"
          className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
        >
          Retour
        </a>
      }
    >
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Règles de confidentialité</h1>
        <p className="mt-2 text-sm text-slate-300">
          Cette page décrit comment MonAPP traite les données lorsque tu utilises la connexion Google et les
          fonctionnalités liées (Calendar, Gmail, People).
        </p>

        <div className="mt-8 grid gap-6">
          <div>
            <h2 className="text-sm font-semibold">Données collectées</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-300">
              <li>Identité de base (profil, email) via OpenID Connect</li>
              <li>Gmail (lecture inbox/labels et envoi, si activé)</li>
              <li>Google Calendar (lecture et création d’événements, si activé)</li>
              <li>Contacts (lecture, si activé)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Utilisation</h2>
            <p className="mt-2 text-sm text-slate-300">
              Les données sont utilisées uniquement pour fournir les fonctionnalités de l’application.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Partage</h2>
            <p className="mt-2 text-sm text-slate-300">
              Les données ne sont pas vendues. Elles sont échangées uniquement avec Google pour exécuter les actions
              demandées.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Suppression / révocation</h2>
            <p className="mt-2 text-sm text-slate-300">
              Tu peux révoquer l’accès à tout moment depuis ton compte Google (Sécurité → Accès des applications
              tierces).
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}
