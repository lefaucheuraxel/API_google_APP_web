function getAuth() {
  try {
    const raw = sessionStorage.getItem('google_auth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setAuth(data) {
  sessionStorage.setItem('google_auth', JSON.stringify(data));
}

function clearAuth() {
  sessionStorage.removeItem('google_auth');
}

function token() {
  const auth = getAuth();
  return auth?.tokens?.access_token || null;
}

function qs(id) {
  return document.getElementById(id);
}

function log(obj) {
  const el = qs('console');
  const text =
    typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
  el.textContent = (el.textContent ? el.textContent + '\n\n' : '') + text;
  el.scrollTop = el.scrollHeight;
}

function setStatus(connected) {
  const pill = qs('statusPill');
  const btnLogin = qs('btnLogin');
  const btnLogout = qs('btnLogout');

  if (connected) {
    pill.textContent = 'Connecté';
    pill.className =
      'inline-flex rounded-full bg-emerald-500/15 text-emerald-200 px-3 py-1';
    btnLogin.classList.add('hidden');
    btnLogout.classList.remove('hidden');
  } else {
    pill.textContent = 'Non connecté';
    pill.className = 'inline-flex rounded-full bg-slate-800 px-3 py-1';
    btnLogin.classList.remove('hidden');
    btnLogout.classList.add('hidden');
  }
}

async function api(path, { method = 'GET', body } = {}) {
  const t = token();
  if (!t) throw new Error('Pas de token: connecte-toi d\'abord');

  const res = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const msg = typeof data === 'string' ? data : data?.error || 'Erreur API';
    throw new Error(msg);
  }

  return data;
}

function renderProfile() {
  const auth = getAuth();
  const box = qs('profileBox');

  if (!auth?.user) {
    box.textContent = 'Connecte-toi pour voir ton profil.';
    return;
  }

  const name = auth.user.name || auth.user.given_name || 'Utilisateur';
  const email = auth.user.email || '';
  const picture = auth.user.picture || '';

  box.innerHTML = `
    <div class="flex items-center gap-3">
      <img src="${picture}" class="h-10 w-10 rounded-full" alt="" />
      <div>
        <div class="text-sm font-semibold text-slate-100">${name}</div>
        <div class="text-xs text-slate-300">${email}</div>
      </div>
    </div>
  `;
}

function isoPlusMinutes(mins) {
  return new Date(Date.now() + mins * 60 * 1000).toISOString();
}

function wire() {
  qs('btnLogin').addEventListener('click', () => {
    window.location.href = '/auth/google';
  });

  qs('btnLogout').addEventListener('click', () => {
    clearAuth();
    setStatus(false);
    renderProfile();
    log('Déconnecté.');
  });

  qs('btnClear').addEventListener('click', () => {
    qs('console').textContent = '';
  });

  qs('btnPeople').addEventListener('click', async () => {
    try {
      const data = await api('/people/me');
      log({ people_me: data });
    } catch (e) {
      log({ error: e.message });
    }
  });

  qs('btnGmailLabels').addEventListener('click', async () => {
    try {
      const data = await api('/gmail/labels');
      log({ gmail_labels: data });
    } catch (e) {
      log({ error: e.message });
    }
  });

  qs('btnSendEmail').addEventListener('click', async () => {
    try {
      const to = qs('inputTo').value.trim();
      const subject = qs('inputSubject').value.trim();
      const text = qs('inputText').value.trim();
      const data = await api('/gmail/send', {
        method: 'POST',
        body: { to, subject, text },
      });
      log({ gmail_send: data });
    } catch (e) {
      log({ error: e.message });
    }
  });

  qs('btnListEvents').addEventListener('click', async () => {
    try {
      const now = new Date();
      const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const data = await api('/events', {
        method: 'POST',
        body: { timeMin, timeMax, maxResults: 20 },
      });
      log({ calendar_events: data });
    } catch (e) {
      log({ error: e.message });
    }
  });

  qs('btnCreateEvent').addEventListener('click', async () => {
    try {
      const summary = 'Réservation MonAPP';
      const start = isoPlusMinutes(60);
      const end = isoPlusMinutes(90);
      const data = await api('/create-event', {
        method: 'POST',
        body: { summary, start, end },
      });
      log({ calendar_create_event: data });
    } catch (e) {
      log({ error: e.message });
    }
  });
}

(function init() {
  const auth = getAuth();
  setStatus(!!auth?.tokens?.access_token);
  renderProfile();
  wire();

  if (auth?.tokens?.access_token) {
    log('Token présent. Tu peux appeler People / Gmail / Calendar.');
  } else {
    log('Clique sur "Se connecter avec Google" pour démarrer.');
  }
})();
