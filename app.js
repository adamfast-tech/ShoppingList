'use strict';
// ══════════════════════════════════════════════════════
//  ⚙️  CONFIGURATION
// ══════════════════════════════════════════════════════
const SUPABASE_URL  = 'https://uwghxfihxznhvhizujjn.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3Z2h4ZmloeHpuaHZoaXp1ampuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNTUxMjIsImV4cCI6MjA5NjczMTEyMn0.fPg0bcGYaGHrYOHKmAleR1gnjXjtxwqiIkpl3did_eA';
const ZXING_URL = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.20.0/umd/index.min.js';
const ZXING_SRI = 'sha384-DOP3OlIzNeWpufSZMxZihUYSqCAZFirsVmSAVg8ItvU9ac1FcQF6ZHjQ9CbCznNS';

// Lu avant que Supabase ne nettoie l'URL (retour d'email de confirmation, etc.)
const INITIAL_HASH = new URLSearchParams(location.hash.slice(1));

if (!window.supabase) {
  document.getElementById('boot-msg').textContent =
    '❌ Impossible de charger FreshList. Vérifie ta connexion puis recharge la page.';
  throw new Error('supabase-js non chargé');
}
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ══════════════════════════════════════════════════════
//  CONSTANTES
// ══════════════════════════════════════════════════════
const CATEGORIES = [
  { name: 'Fruits & Légumes',   emoji: '🥦', color: '#06D6A0' },
  { name: 'Viandes & Poissons', emoji: '🥩', color: '#FF6B6B' },
  { name: 'Produits laitiers',  emoji: '🧀', color: '#45B7D1' },
  { name: 'Épicerie',           emoji: '🛒', color: '#F5B700' },
  { name: 'Boissons',           emoji: '🧃', color: '#4ECDC4' },
  { name: 'Surgelés',           emoji: '🧊', color: '#A78BFA' },
  { name: 'Hygiène',            emoji: '🧴', color: '#FF8E53' },
  { name: 'Autre',              emoji: '📦', color: '#9CA3AF' },
];
const CAT = Object.fromEntries(CATEGORIES.map(c => [c.name, c]));
const catOf = name => CAT[name] || CAT['Autre'];

const EMOJIS = ['🛒','🍎','🥩','🥦','🍞','🧃','🧀','🧊','🛍️','🏠','💊','🎂','🌸','⚡','🎉','🐶'];
const THEME_KEY = 'freshlist-theme';
const MAX_QTY = 999;

// ══════════════════════════════════════════════════════
//  OUTILS
// ══════════════════════════════════════════════════════
const $ = id => document.getElementById(id);
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;
const clampQty = n => Math.min(MAX_QTY, Math.max(1, parseInt(n, 10) || 1));
const appUrl = () => location.origin + location.pathname;

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
  remove(key) { try { localStorage.removeItem(key); } catch {} },
};

// Couleur stable par liste (identique dans la grille et dans l'en-tête)
function gradIndex(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 4;
}

// ══════════════════════════════════════════════════════
//  ÉTAT
// ══════════════════════════════════════════════════════
const state = {
  user: null,
  lists: [],          // { id, name, emoji, owner_id, created_at }
  items: {},          // list_id → [{ id, list_id, name, qty, category, checked, created_at }]
  queue: [],          // modifications pas encore envoyées au serveur
  loaded: false,      // au moins une synchro réussie
  offline: false,     // démarré sans pouvoir vérifier la session
  currentListId: null,
  activeCat: 'Tous',
  view: 'lists',
};

const userKey = k => `fl:${state.user.id}:${k}`;
const isOwner = list => list.owner_id === state.user.id;
const getList = id => state.lists.find(l => l.id === id);
const itemsOf = id => state.items[id] || [];

function listStats(id) {
  const items = itemsOf(id);
  const done = items.filter(i => i.checked).length;
  return { total: items.length, done, pct: items.length ? Math.round(done / items.length * 100) : 0 };
}
function findItem(id) {
  for (const listId in state.items) {
    const item = state.items[listId].find(i => i.id === id);
    if (item) return item;
  }
  return null;
}
function saveCache() { store.set(userKey('data'), { lists: state.lists, items: state.items }); }
function saveQueue() { store.set(userKey('queue'), state.queue); }

// ══════════════════════════════════════════════════════
//  SYNCHRONISATION (optimiste + file d'attente hors-ligne)
// ══════════════════════════════════════════════════════
// Chaque modification est appliquée tout de suite à l'écran, mémorisée
// sur l'appareil, puis envoyée à Supabase dès que le réseau le permet.
function applyLocal(op) {
  const now = new Date().toISOString();
  switch (op.t) {
    case 'list.add':
      if (!getList(op.row.id)) state.lists.unshift({ created_at: now, ...op.row });
      state.items[op.row.id] ||= [];
      break;
    case 'list.update': {
      const list = getList(op.id);
      if (list) Object.assign(list, op.patch);
      break;
    }
    case 'list.delete':
      state.lists = state.lists.filter(l => l.id !== op.id);
      delete state.items[op.id];
      break;
    case 'items.add':
      for (const row of op.rows) {
        const arr = (state.items[row.list_id] ||= []);
        if (!arr.some(i => i.id === row.id)) arr.push({ created_at: now, ...row });
      }
      break;
    case 'item.update': {
      const item = findItem(op.id);
      if (item) Object.assign(item, op.patch);
      break;
    }
    case 'items.delete': {
      const ids = new Set(op.ids);
      for (const listId in state.items) state.items[listId] = state.items[listId].filter(i => !ids.has(i.id));
      break;
    }
  }
}

function sendOp(op) {
  switch (op.t) {
    case 'list.add':     return sb.from('lists').insert(op.row);
    case 'list.update':  return sb.from('lists').update(op.patch).eq('id', op.id);
    case 'list.delete':  return sb.from('lists').delete().eq('id', op.id);
    case 'items.add':    return sb.from('items').insert(op.rows);
    case 'item.update':  return sb.from('items').update(op.patch).eq('id', op.id);
    case 'items.delete': return sb.from('items').delete().in('id', op.ids);
  }
  return Promise.resolve({ error: null });
}

const opIds = op => op.rows ? op.rows.map(r => r.id) : op.ids || [op.id || op.row?.id];
const isRetryable = status => !status || status === 401 || status === 408 || status === 429 || status >= 500;

function commit(op) {
  applyLocal(op);
  state.queue.push(op);
  saveQueue();
  saveCache();
  render();
  flush();
}

let flushing = false;
let retryTimer = null;
let syncBlocked = false;
let syncSeq = 0;
const recentOwn = new Map(); // id → date : pour ignorer l'écho temps réel de nos propres modifs

async function flush() {
  if (flushing || !state.user) return;
  flushing = true;
  const uid = state.user.id;
  let rejected = false;
  try {
    while (state.queue.length && state.user?.id === uid) {
      const op = state.queue[0];
      let res;
      try { res = await sendOp(op); } catch (e) { res = { error: e, status: 0 }; }
      if (state.user?.id !== uid) break;
      if (res.error && isRetryable(res.status)) {
        syncBlocked = true;
        clearTimeout(retryTimer);
        retryTimer = setTimeout(flush, 15000);
        break;
      }
      state.queue.shift();
      saveQueue();
      syncSeq++;
      syncBlocked = false;
      if (recentOwn.size > 500) recentOwn.clear();
      opIds(op).forEach(id => recentOwn.set(id, Date.now()));
      // 23505 = déjà enregistré (envoi rejoué après une coupure) → considéré comme réussi
      if (res.error && res.error.code !== '23505') {
        rejected = true;
        console.warn('Modification refusée par le serveur', op, res.error);
        toast('❌ ' + friendlyError(res.error));
      }
    }
  } finally {
    flushing = false;
    updateSyncBanner();
  }
  if (rejected) refresh();
}

let refreshing = false;
let refreshTimer = null;
function scheduleRefresh(delay = 400) {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refresh, delay);
}

async function refresh() {
  if (!state.user) return false;
  if (refreshing) { scheduleRefresh(800); return false; }
  refreshing = true;
  const uid = state.user.id;
  const seq = syncSeq;
  try {
    // Les règles de sécurité (RLS) ne renvoient que mes listes et celles partagées avec moi
    const [lists, items] = await Promise.all([
      sb.from('lists').select('id, name, emoji, owner_id, created_at').order('created_at', { ascending: false }),
      sb.from('items').select('id, list_id, name, qty, category, checked, created_at').order('created_at'),
    ]);
    if (state.user?.id !== uid) return false;
    if (lists.error || items.error) {
      const err = lists.error || items.error;
      if (!isRetryable(lists.error ? lists.status : items.status)) console.warn('Chargement impossible', err);
      updateSyncBanner();
      return false;
    }
    // Une modification a été envoyée pendant le chargement : on recharge pour l'inclure
    if (seq !== syncSeq) { scheduleRefresh(); return false; }

    state.lists = lists.data;
    state.items = Object.fromEntries(lists.data.map(l => [l.id, []]));
    for (const item of items.data) (state.items[item.list_id] ||= []).push(item);
    state.queue.forEach(applyLocal); // ré-applique ce qui n'est pas encore synchronisé
    state.loaded = true;

    if (state.currentListId && !getList(state.currentListId)) {
      state.currentListId = null;
      if (state.view === 'items') {
        navigate('lists');
        toast("ℹ️ Cette liste n'est plus disponible");
      }
    }
    saveCache();
    render();
    if (state.view === 'share') loadCollaborators();
    return true;
  } finally {
    refreshing = false;
  }
}

function updateSyncBanner() {
  const banner = $('offline-banner');
  if (!banner) return;
  const offline = !navigator.onLine;
  const pending = state.queue.length;
  banner.hidden = !state.user || !(offline || (pending && syncBlocked));
  $('offline-text').textContent = offline
    ? `Mode hors-ligne — ${pending ? `${plural(pending, 'modification')} en attente` : 'tes modifications seront synchronisées au retour du réseau'}`
    : `Synchronisation en attente (${plural(pending, 'modification')})…`;
}

// Temps réel : les changements faits par les collaborateurs arrivent tout seuls
let channel = null;
function subscribeRealtime() {
  if (channel) sb.removeChannel(channel);
  const onChange = payload => {
    const id = payload.new?.id || payload.old?.id;
    const own = id && recentOwn.get(id);
    if (own && Date.now() - own < 8000) return;
    if (payload.eventType === 'DELETE' && id && !getList(id) && !findItem(id)) return;
    scheduleRefresh();
  };
  channel = sb.channel('freshlist-' + state.user.id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, onChange)
    .subscribe();
}

// ══════════════════════════════════════════════════════
//  AUTHENTIFICATION
// ══════════════════════════════════════════════════════
let authMode = 'login';
let pendingRecovery = false;

function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll('.tab-btn').forEach(b => {
    const active = b.dataset.mode === mode;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active);
  });
  $('signup-extra').hidden = mode !== 'signup';
  $('forgot-btn').hidden = mode !== 'login';
  $('auth-password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('auth-btn').textContent = mode === 'login' ? 'Se connecter' : 'Créer mon compte';
  hideAuthMsg();
}

function showAuthMsg(msg, type = 'error') {
  const el = $('auth-msg');
  el.textContent = msg;
  el.className = 'auth-msg' + (type === 'info' ? ' info' : '');
  el.hidden = false;
}
function hideAuthMsg() { $('auth-msg').hidden = true; }

function friendlyError(error) {
  const code = error?.code || '';
  const msg = error?.message || String(error || '');
  if (!navigator.onLine || /fetch|network|load failed/i.test(msg)) return 'Connexion impossible. Vérifie ton réseau.';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) return 'Email ou mot de passe incorrect.';
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) return "Confirme d'abord ton email (pense à regarder dans les spams).";
  if (code === 'user_already_exists' || /already registered/i.test(msg)) return 'Un compte existe déjà avec cet email.';
  if (code === 'weak_password' || /password should be/i.test(msg)) return 'Mot de passe trop faible (6 caractères minimum).';
  if (code === 'same_password') return "Choisis un mot de passe différent de l'ancien.";
  if (/rate limit|too many/i.test(msg) || code === 'over_email_send_rate_limit') return 'Trop de tentatives, réessaie dans quelques minutes.';
  if (code === 'validation_failed' || /invalid format|unable to validate email/i.test(msg)) return 'Adresse email invalide.';
  if (code === '42501' || /row-level security/i.test(msg)) return "Tu n'as pas les droits pour faire ça.";
  return msg;
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = $('auth-email').value.trim();
  const password = $('auth-password').value;
  if (!email || !password) { showAuthMsg('Remplis tous les champs.'); return; }
  if (!/^\S+@\S+\.\S+$/.test(email)) { showAuthMsg('Adresse email invalide.'); $('auth-email').focus(); return; }
  if (authMode === 'signup' && password.length < 6) { showAuthMsg('Le mot de passe doit faire au moins 6 caractères.'); return; }

  const btn = $('auth-btn');
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Un instant…';
  hideAuthMsg();
  try {
    if (authMode === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) showAuthMsg(friendlyError(error));
      // en cas de succès, onAuthStateChange ouvre l'application
    } else {
      const name = $('auth-name').value.trim() || email.split('@')[0];
      const { data, error } = await sb.auth.signUp({
        email, password,
        options: { data: { full_name: name }, emailRedirectTo: appUrl() },
      });
      if (error) showAuthMsg(friendlyError(error));
      else if (!data.session) showAuthMsg('📧 Presque fini ! Clique sur le lien reçu par email pour activer ton compte.', 'info');
    }
  } catch (err) {
    showAuthMsg(friendlyError(err));
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
}

async function forgotPassword() {
  const email = $('auth-email').value.trim();
  if (!email) {
    showAuthMsg('Entre ton email ci-dessus, puis appuie de nouveau sur « Mot de passe oublié ? ».', 'info');
    $('auth-email').focus();
    return;
  }
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: appUrl() });
  if (error) showAuthMsg(friendlyError(error));
  else showAuthMsg('📧 Si un compte existe pour cet email, un lien pour changer ton mot de passe vient de t\'être envoyé.', 'info');
}

async function handlePasswordSubmit(e) {
  e.preventDefault();
  const password = $('new-password').value;
  if (password.length < 6) { toast('❌ 6 caractères minimum'); return; }
  const { error } = await sb.auth.updateUser({ password });
  if (error) { toast('❌ ' + friendlyError(error)); return; }
  $('dlg-password').close();
  $('new-password').value = '';
  toast('🔑 Mot de passe mis à jour');
}

async function handleAuthEvent(event, session) {
  if (event === 'INITIAL_SESSION') cleanAuthUrl();
  if (event === 'PASSWORD_RECOVERY') pendingRecovery = true;
  const user = session?.user || null;

  if (user) {
    if (state.user?.id !== user.id) {
      await startApp(user);
      if (INITIAL_HASH.get('type') === 'signup') toast('✅ Email confirmé, bienvenue !');
    } else {
      state.user = user;
      if (state.offline) resumeOnline();
    }
    if (pendingRecovery || INITIAL_HASH.get('type') === 'recovery') {
      pendingRecovery = false;
      INITIAL_HASH.delete('type');
      openDialog('dlg-password');
    }
    return;
  }

  if (event === 'INITIAL_SESSION') {
    // Hors-ligne avec une session expirée : on affiche quand même les données en cache
    const last = store.get('fl:lastUser', null);
    if (!navigator.onLine && last) {
      if (!state.user) await startApp(last, { offline: true });
      return;
    }
    if (state.user) stopApp(); else showScreen('auth');
    const err = INITIAL_HASH.get('error_description');
    if (err) showAuthMsg(/expired|invalid/i.test(err) ? '⏰ Ce lien a expiré ou a déjà été utilisé. Demande-en un nouveau.' : err);
    return;
  }
  if (event === 'SIGNED_OUT' && state.user) stopApp();
}

// Démarré hors-ligne : on vérifie la session puis on reprend la synchro
async function resumeOnline() {
  if (!state.user || !state.offline) return;
  const { data } = await sb.auth.getSession();
  if (!state.user) return;
  if (!data.session) {
    stopApp();
    showAuthMsg('Reconnecte-toi pour synchroniser tes modifications.', 'info');
    return;
  }
  state.offline = false;
  subscribeRealtime();
  flush();
  refresh();
}

function cleanAuthUrl() {
  if (/access_token|error|type=/.test(location.hash) || /[?&]code=/.test(location.search)) {
    history.replaceState(history.state, '', location.pathname);
  }
}

async function logout() {
  const pending = state.queue.length;
  const ok = await confirmDialog(
    pending
      ? `⚠️ ${plural(pending, 'modification')} pas encore ${pending > 1 ? 'synchronisées seront perdues' : 'synchronisée sera perdue'}. Se déconnecter quand même ?`
      : 'Se déconnecter de FreshList ?',
    { ok: 'Se déconnecter' }
  );
  if (!ok) return;
  store.remove(userKey('data'));
  store.remove(userKey('queue'));
  store.remove('fl:lastUser');
  await sb.auth.signOut({ scope: 'local' }).catch(() => {});
  stopApp();
}

// ══════════════════════════════════════════════════════
//  DÉMARRAGE DE L'APPLICATION
// ══════════════════════════════════════════════════════
function showScreen(name) {
  $('boot').hidden = true;
  $('auth-screen').hidden = name !== 'auth';
  $('app-screen').hidden = name !== 'app';
  document.body.classList.toggle('in-app', name === 'app');
}

async function startApp(user, { offline = false } = {}) {
  state.user = user;
  store.set('fl:lastUser', { id: user.id, email: user.email, user_metadata: user.user_metadata });
  const cached = store.get(userKey('data'), null);
  state.lists = cached?.lists || [];
  state.items = cached?.items || {};
  state.queue = store.get(userKey('queue'), []);
  state.loaded = !!cached;
  state.offline = offline;
  state.currentListId = null;
  state.activeCat = 'Tous';

  const name = user.user_metadata?.full_name || (user.email || '?').split('@')[0];
  const initial = (name.trim()[0] || '?').toUpperCase();
  $('user-avatar').textContent = initial;
  $('profile-avatar-big').textContent = initial;
  $('profile-name').textContent = name;
  $('profile-email').textContent = user.email || '';

  showScreen('app');
  history.replaceState({ view: 'lists' }, '');
  showView('lists');
  render();
  updateSyncBanner();
  if (!offline) {
    subscribeRealtime();
    flush();
    await refresh();
  }
}

function stopApp() {
  if (channel) { sb.removeChannel(channel); channel = null; }
  clearTimeout(retryTimer);
  clearTimeout(refreshTimer);
  Object.assign(state, { user: null, lists: [], items: {}, queue: [], loaded: false, offline: false, currentListId: null, activeCat: 'Tous' });
  collaborators = null;
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  closeScanner();
  releaseWakeLock();
  $('auth-password').value = '';
  setAuthMode('login');
  showScreen('auth');
}

// ══════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════
function showView(name) {
  if (name === 'items' && !getList(state.currentListId)) name = 'lists';
  state.view = name;
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
  document.querySelectorAll('.nav-item').forEach(n => {
    const active = n.dataset.view === name || (name === 'items' && n.dataset.view === 'lists');
    n.classList.toggle('active', active);
    if (active) n.setAttribute('aria-current', 'page'); else n.removeAttribute('aria-current');
  });
  closeAutocomplete();
  if (name === 'share') loadCollaborators();
  render();
  updateWakeLock();
  window.scrollTo(0, 0);
}

// « Mes listes » est la racine : le bouton retour du téléphone y ramène toujours
function navigate(view, listId) {
  if (view === 'items') state.currentListId = listId;
  if (view === state.view && view !== 'items') return;
  if (view === 'lists') {
    if (history.state?.view && history.state.view !== 'lists') history.back();
    else showView('lists');
    return;
  }
  const entry = { view, listId: state.currentListId };
  if (state.view === 'lists') history.pushState(entry, '');
  else history.replaceState(entry, '');
  showView(view);
}

window.addEventListener('popstate', e => {
  if (!state.user) return;
  const s = e.state || { view: 'lists' };
  if (s.listId) state.currentListId = s.listId;
  showView(s.view || 'lists');
});

// ══════════════════════════════════════════════════════
//  AFFICHAGE
// ══════════════════════════════════════════════════════
function render() {
  if (!state.user) return;
  renderLists();
  if (state.view === 'items') renderItemsView();
  if (state.view === 'share') renderShare();
  if (state.view === 'profile') renderProfile();
  if ($('dlg-catalog').open) renderCatalog();
}

function emptyState(emoji, title, text, button = '') {
  return `<div class="empty-state">
    <span class="emoji" aria-hidden="true">${emoji}</span>
    <h3>${title}</h3>
    <p>${text}</p>${button}
  </div>`;
}

function renderLists() {
  const grid = $('lists-grid');
  if (!state.lists.length) {
    grid.innerHTML = state.loaded
      ? emptyState('🎉', "Aucune liste pour l'instant", 'Crée ta première liste de courses, puis partage-la avec ta famille ou tes colocs.',
          '<button type="button" class="btn-secondary" data-action="new-list">+ Créer une liste</button>')
      : '<div class="skeleton"></div><div class="skeleton"></div>';
    return;
  }
  grid.innerHTML = state.lists.map(list => {
    const { total, done, pct } = listStats(list.id);
    const left = total - done;
    const meta = !total ? 'Liste vide'
      : !left ? 'Tout est pris ✓'
      : `${left} à prendre · ${pct}% fait`;
    const shared = isOwner(list) ? '' : ' <span class="badge">Partagée</span>';
    return `<div class="list-card grad-${gradIndex(list.id)}" role="button" tabindex="0" data-action="open-list" data-id="${esc(list.id)}">
      <button type="button" class="card-icon-btn" data-action="list-menu" data-id="${esc(list.id)}" aria-label="Options de la liste ${esc(list.name)}">⋯</button>
      <span class="list-card-emoji" aria-hidden="true">${esc(list.emoji || '🛒')}</span>
      <div class="list-card-name">${esc(list.name)}</div>
      <div class="list-card-meta">${meta}${shared}</div>
      <div class="list-card-progress" aria-hidden="true"><div class="list-card-progress-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

function renderItemsView() {
  const list = getList(state.currentListId);
  if (!list) return;
  $('items-header').className = `list-header-card grad-${gradIndex(list.id)}`;
  $('items-list-name').textContent = `${list.emoji || '🛒'} ${list.name}`;
  const { total, done, pct } = listStats(list.id);
  $('items-progress').textContent = total ? `${done} / ${plural(total, 'article')} dans le panier` : 'Liste vide';
  $('items-progress-bar').style.width = pct + '%';
  $('items-progressbar').setAttribute('aria-valuenow', pct);

  const items = itemsOf(list.id);
  renderCatChips(items);
  renderItemList(items);
}

function renderCatChips(items) {
  const counts = {};
  for (const item of items) {
    const c = catOf(item.category).name;
    counts[c] ??= 0;
    if (!item.checked) counts[c]++;
  }
  const present = CATEGORIES.filter(c => c.name in counts);
  if (state.activeCat !== 'Tous' && !(state.activeCat in counts)) state.activeCat = 'Tous';
  const el = $('cat-filter');
  el.hidden = present.length < 2;
  if (el.hidden) return;
  const chip = (name, label, color, count) =>
    `<button type="button" class="cat-chip" data-action="filter-cat" data-cat="${esc(name)}" aria-pressed="${state.activeCat === name}" style="--chip:${color}">${label}${count ? ` <span class="count">${count}</span>` : ''}</button>`;
  el.innerHTML = chip('Tous', 'Tous', 'var(--grad-btn)', 0) +
    present.map(c => chip(c.name, `${c.emoji} ${esc(c.name)}`, c.color, counts[c.name])).join('');
}

function renderItemList(items) {
  const container = $('items-container');
  if (!items.length) {
    container.innerHTML = emptyState('📭', 'Liste vide', "Tape un article ci-dessus, ou ajoute-le depuis le catalogue ou en scannant son code-barre.");
    return;
  }
  const all = state.activeCat === 'Tous';
  const filtered = all ? items : items.filter(i => catOf(i.category).name === state.activeCat);
  const todo = filtered.filter(i => !i.checked);
  const done = filtered.filter(i => i.checked);
  let html = '';

  if (!todo.length) {
    html += `<div class="all-done">🎉 ${all ? 'Tout est dans le panier !' : 'Rien à prendre dans ce rayon'}</div>`;
  } else if (!all) {
    html += `<ul class="item-list">${todo.map(itemHTML).join('')}</ul>`;
  } else {
    // Regroupé par rayon, dans l'ordre d'un parcours en magasin
    for (const c of CATEGORIES) {
      const group = todo.filter(i => catOf(i.category).name === c.name);
      if (!group.length) continue;
      html += `<h3 class="items-section-title">${c.emoji} ${esc(c.name)} <span class="count">· ${group.length}</span></h3>
        <ul class="item-list">${group.map(itemHTML).join('')}</ul>`;
    }
  }
  if (done.length) {
    html += `<div class="items-section-head">
        <h3 class="items-section-title">✅ Dans le panier · ${done.length}</h3>
        <button type="button" class="link-btn small" data-action="clear-checked">Retirer</button>
      </div>
      <ul class="item-list">${done.map(itemHTML).join('')}</ul>`;
  }
  container.innerHTML = html;
}

function itemHTML(item) {
  const c = catOf(item.category);
  const qty = item.qty > 1 ? `<span class="item-qty">×${item.qty}</span>` : '';
  return `<li class="item-row${item.checked ? ' checked' : ''}" style="--cat:${c.color}">
    <button type="button" class="item-main" role="checkbox" aria-checked="${!!item.checked}" data-action="toggle-item" data-id="${esc(item.id)}">
      <span class="item-check" aria-hidden="true">${item.checked ? '✓' : ''}</span>
      <span class="item-name">${esc(item.name)}</span>${qty}
    </button>
    <button type="button" class="item-edit" data-action="edit-item" data-id="${esc(item.id)}" aria-label="Modifier ${esc(item.name)}">✏️</button>
  </li>`;
}

function renderProfile() {
  let total = 0, done = 0;
  for (const list of state.lists) {
    const s = listStats(list.id);
    total += s.total;
    done += s.done;
  }
  $('stat-lists').textContent = state.lists.length;
  $('stat-items').textContent = total;
  $('stat-done').textContent = done;
  $('wakelock-toggle').checked = store.get('fl:wakelock', false);
}

// ══════════════════════════════════════════════════════
//  LISTES
// ══════════════════════════════════════════════════════
let editingListId = null;
let selectedEmoji = EMOJIS[0];

function openList(id) {
  if (!getList(id)) return;
  state.activeCat = 'Tous';
  $('new-item-name').value = '';
  navigate('items', id);
}

function openListDialog(id) {
  const list = id ? getList(id) : null;
  editingListId = list ? list.id : null;
  const owner = !list || isOwner(list);
  $('dlg-list-title').textContent = list ? `${list.emoji || '🛒'} ${list.name}` : 'Nouvelle liste ✨';
  $('list-edit-fields').hidden = !owner;
  $('list-extra').hidden = !list;
  $('menu-invite').hidden = !list || !owner;
  $('menu-delete').hidden = !list || !owner;
  $('menu-leave').hidden = !list || owner;
  $('list-submit').hidden = !owner;
  $('list-submit').textContent = list ? 'Enregistrer' : 'Créer 🎉';
  $('list-name').value = list ? list.name : '';
  selectEmoji(list?.emoji || EMOJIS[0]);
  openDialog('dlg-list');
  // En modification, on n'ouvre pas le clavier d'office
  if (list) { $('dlg-list-title').setAttribute('tabindex', '-1'); $('dlg-list-title').focus(); }
}

function selectEmoji(emoji) {
  selectedEmoji = emoji;
  document.querySelectorAll('.emoji-option').forEach(el => el.setAttribute('aria-checked', el.dataset.emoji === emoji));
}

function handleListSubmit(e) {
  e.preventDefault();
  const name = $('list-name').value.trim().replace(/\s+/g, ' ');
  if (!name) { toast('❌ Donne un nom à ta liste'); $('list-name').focus(); return; }
  $('dlg-list').close();
  if (editingListId) {
    const list = getList(editingListId);
    if (list && (list.name !== name || list.emoji !== selectedEmoji)) {
      commit({ t: 'list.update', id: list.id, patch: { name, emoji: selectedEmoji } });
      toast('✅ Liste modifiée');
    }
    return;
  }
  const row = { id: uuid(), name, emoji: selectedEmoji, owner_id: state.user.id };
  commit({ t: 'list.add', row });
  toast('🎉 Liste créée !');
  openList(row.id);
}

async function deleteList() {
  const list = getList(editingListId);
  if (!list) return;
  const { total } = listStats(list.id);
  const ok = await confirmDialog(
    `Supprimer « ${list.name} »${total ? ` et ${plural(total, 'article')}` : ''} ? Les personnes avec qui elle est partagée n'y auront plus accès.`,
    { ok: 'Supprimer' }
  );
  if (!ok) return;
  $('dlg-list').close();
  if (state.currentListId === list.id) navigate('lists');
  commit({ t: 'list.delete', id: list.id });
  toast('🗑️ Liste supprimée');
}

async function leaveList() {
  const list = getList(editingListId);
  if (!list) return;
  if (!navigator.onLine) { toast('📡 Connexion nécessaire pour quitter une liste'); return; }
  const ok = await confirmDialog(`Quitter « ${list.name} » ? Tu n'y auras plus accès.`, { ok: 'Quitter' });
  if (!ok) return;
  const { data, error } = await sb.from('list_collaborators').delete()
    .eq('list_id', list.id).eq('user_id', state.user.id).select('id');
  if (error || !data?.length) {
    toast('❌ Impossible de quitter la liste. Demande à son propriétaire de te retirer.');
    return;
  }
  $('dlg-list').close();
  if (state.currentListId === list.id) navigate('lists');
  state.lists = state.lists.filter(l => l.id !== list.id);
  delete state.items[list.id];
  saveCache();
  render();
  toast('🚪 Tu as quitté la liste');
}

async function shareListText() {
  const list = getList(editingListId);
  if (!list) return;
  const todo = itemsOf(list.id).filter(i => !i.checked);
  let text = `${list.emoji || '🛒'} ${list.name}\n`;
  for (const c of CATEGORIES) {
    const group = todo.filter(i => catOf(i.category).name === c.name);
    if (!group.length) continue;
    text += `\n${c.emoji} ${c.name}\n` + group.map(i => `• ${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join('\n') + '\n';
  }
  if (!todo.length) text += '\n(rien à acheter 🎉)\n';
  await shareOrCopy({ title: list.name, text: text.trim() }, '📋 Liste copiée, tu peux la coller dans un message');
}

async function shareOrCopy(data, copiedMsg) {
  if (navigator.share) {
    try { await navigator.share(data); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  try {
    await navigator.clipboard.writeText([data.text, data.url].filter(Boolean).join('\n'));
    toast(copiedMsg);
  } catch {
    toast('❌ Partage impossible sur cet appareil');
  }
}

// ══════════════════════════════════════════════════════
//  ARTICLES
// ══════════════════════════════════════════════════════
function addItemByName(rawName, qty = 1, category = null) {
  const name = String(rawName).trim().replace(/\s+/g, ' ').slice(0, 120);
  const listId = state.currentListId;
  if (!name || !getList(listId)) return false;
  qty = clampQty(qty);
  const key = norm(name);
  const existing = itemsOf(listId).find(i => norm(i.name) === key);
  if (existing) {
    if (existing.checked) {
      commit({ t: 'item.update', id: existing.id, patch: { checked: false, qty } });
      toast(`↩️ ${existing.name} remis dans la liste`);
    } else {
      const newQty = clampQty((existing.qty || 1) + qty);
      commit({ t: 'item.update', id: existing.id, patch: { qty: newQty } });
      toast(`➕ ${existing.name} : quantité ${newQty}`);
    }
    return true;
  }
  const row = { id: uuid(), list_id: listId, name, qty, category: category || guessCategory(name), checked: false };
  commit({ t: 'items.add', rows: [row] });
  toast(`✅ ${name} ajouté`);
  return true;
}

function handleAddSubmit(e) {
  e.preventDefault();
  const input = $('new-item-name');
  if (acIndex >= 0 && acItems[acIndex]) { pickSuggestion(acIndex); return; }
  if (addItemByName(input.value, $('new-item-qty').value, input.dataset.category || null)) resetAddForm();
}

function resetAddForm() {
  const input = $('new-item-name');
  input.value = '';
  delete input.dataset.category;
  $('new-item-qty').value = 1;
  closeAutocomplete();
  input.focus();
}

function toggleItem(id) {
  const item = findItem(id);
  if (!item) return;
  commit({ t: 'item.update', id, patch: { checked: !item.checked } });
  if (navigator.vibrate) navigator.vibrate(8);
}

function deleteItems(ids, message) {
  const rows = ids.map(findItem).filter(Boolean).map(item => ({ ...item }));
  if (!rows.length) return;
  commit({ t: 'items.delete', ids: rows.map(r => r.id) });
  toast(message, { label: 'Annuler', run: () => commit({ t: 'items.add', rows }) });
}

function clearChecked() {
  const ids = itemsOf(state.currentListId).filter(i => i.checked).map(i => i.id);
  if (ids.length) deleteItems(ids, `🧹 ${plural(ids.length, 'article')} ${ids.length > 1 ? 'retirés' : 'retiré'}`);
}

async function clearAllChecked() {
  const ids = Object.values(state.items).flat().filter(i => i.checked).map(i => i.id);
  if (!ids.length) { toast('Aucun article coché 👌'); return; }
  const ok = await confirmDialog(`Supprimer les ${plural(ids.length, 'article')} ${ids.length > 1 ? 'cochés' : 'coché'} de toutes tes listes ?`, { ok: 'Supprimer' });
  if (ok) deleteItems(ids, `🧹 ${plural(ids.length, 'article')} ${ids.length > 1 ? 'supprimés' : 'supprimé'}`);
}

let editingItemId = null;
function openItemEditor(id) {
  const item = findItem(id);
  if (!item) return;
  editingItemId = id;
  $('item-name').value = item.name;
  $('item-qty').value = item.qty || 1;
  $('item-cat').value = catOf(item.category).name;
  openDialog('dlg-item');
}

function handleItemSubmit(e) {
  e.preventDefault();
  const item = findItem(editingItemId);
  if (!item) { $('dlg-item').close(); return; }
  const name = $('item-name').value.trim().replace(/\s+/g, ' ');
  if (!name) { toast("❌ Le nom de l'article est vide"); $('item-name').focus(); return; }
  const patch = {};
  const qty = clampQty($('item-qty').value);
  const category = $('item-cat').value;
  if (name !== item.name) patch.name = name;
  if (qty !== item.qty) patch.qty = qty;
  if (category !== item.category) patch.category = category;
  $('dlg-item').close();
  if (Object.keys(patch).length) commit({ t: 'item.update', id: item.id, patch });
}

function deleteEditingItem() {
  const item = findItem(editingItemId);
  $('dlg-item').close();
  if (item) deleteItems([item.id], `🗑️ ${item.name} supprimé`);
}

function stepQty(btn) {
  const input = $(btn.dataset.target);
  input.value = clampQty((parseInt(input.value, 10) || 1) + Number(btn.dataset.step));
}

function setFilter(cat) {
  state.activeCat = cat;
  renderItemsView();
}

// ══════════════════════════════════════════════════════
//  RAYON AUTOMATIQUE
// ══════════════════════════════════════════════════════
const STOPWORDS = new Set(['de', 'du', 'des', 'd', 'la', 'le', 'les', 'l', 'un', 'une', 'au', 'aux', 'a', 'en', 'et',
  'ou', 'avec', 'sans', 'pour', 'bio', 'gros', 'grand', 'grande', 'petit', 'petite', 'paquet', 'sachet', 'boite',
  'pot', 'bouteille', 'pack', 'lot', 'kg', 'g', 'ml', 'cl', 'x', 'frais', 'fraiche']);
const singular = w => (w.length > 3 ? w.replace(/[sx]$/, '') : w);
const wordsOf = s => norm(s).split(/[^a-z0-9]+/).filter(w => w && !STOPWORDS.has(w)).map(singular);

// Index construit à partir du catalogue : nom exact, premier mot, puis n'importe quel mot
const CATALOG = (typeof PRODUCT_FLAT !== 'undefined' ? PRODUCT_FLAT : []).map(p => ({ ...p, n: norm(p.name) }));
const CATALOG_EXACT = new Map();
const CATALOG_FIRST = new Map();
const CATALOG_ANY = new Map();
for (const p of CATALOG) {
  if (!CATALOG_EXACT.has(p.n)) CATALOG_EXACT.set(p.n, p.category);
  const words = wordsOf(p.name);
  if (words[0] && !CATALOG_FIRST.has(words[0])) CATALOG_FIRST.set(words[0], p.category);
  for (const w of words) if (!CATALOG_ANY.has(w)) CATALOG_ANY.set(w, p.category);
}

function guessCategory(name) {
  const n = norm(name);
  // 1. ce que l'utilisateur a déjà choisi pour ce produit
  for (const listId in state.items) {
    const known = state.items[listId].find(i => norm(i.name) === n);
    if (known) return catOf(known.category).name;
  }
  // 2. le catalogue
  if (CATALOG_EXACT.has(n)) return CATALOG_EXACT.get(n);
  const words = wordsOf(name);
  for (const w of words) if (CATALOG_FIRST.has(w)) return CATALOG_FIRST.get(w);
  for (const w of words) if (CATALOG_ANY.has(w)) return CATALOG_ANY.get(w);
  // 3. le rayon affiché, sinon « Autre »
  return state.activeCat !== 'Tous' ? state.activeCat : 'Autre';
}

// ══════════════════════════════════════════════════════
//  SUGGESTIONS (autocomplétion)
// ══════════════════════════════════════════════════════
let acItems = [];
let acIndex = -1;

function suggestionsFor(query) {
  const q = norm(query);
  if (!q) return [];
  // Historique perso d'abord (produits déjà ajoutés dans n'importe quelle liste), puis catalogue
  const history = [];
  const seen = new Set();
  for (const listId in state.items) {
    for (const i of state.items[listId]) {
      const n = norm(i.name);
      if (!seen.has(n)) { seen.add(n); history.push({ name: i.name, category: catOf(i.category).name, n }); }
    }
  }
  const pool = history.concat(CATALOG.filter(p => !seen.has(p.n)));
  const scored = [];
  for (const p of pool) {
    let score = -1;
    if (p.n.startsWith(q)) score = 0;
    else if (p.n.includes(' ' + q)) score = 1;
    else if (p.n.includes(q)) score = 2;
    if (score >= 0) scored.push({ ...p, score });
  }
  return scored.sort((a, b) => a.score - b.score).slice(0, 8);
}

function highlight(name, query) {
  const n = norm(name);
  const q = norm(query);
  const idx = n.indexOf(q);
  // la normalisation conserve la longueur pour les lettres accentuées françaises
  if (idx < 0 || n.length !== name.length) return esc(name);
  return esc(name.slice(0, idx)) + '<mark>' + esc(name.slice(idx, idx + q.length)) + '</mark>' + esc(name.slice(idx + q.length));
}

function updateAutocomplete() {
  const input = $('new-item-name');
  delete input.dataset.category;
  acItems = suggestionsFor(input.value);
  acIndex = -1;
  const list = $('autocomplete-list');
  if (!acItems.length) { closeAutocomplete(); return; }
  const current = new Set(itemsOf(state.currentListId).filter(i => !i.checked).map(i => norm(i.name)));
  list.innerHTML = acItems.map((p, i) => `<li role="option" id="ac-${i}" class="autocomplete-item" aria-selected="false" data-action="ac-pick" data-index="${i}">
      <span class="ac-cat-dot" style="background:${catOf(p.category).color}"></span>
      <span class="ac-name">${highlight(p.name, input.value)}</span>
      ${current.has(p.n) ? '<span class="ac-in">✓ déjà dans la liste</span>' : `<span class="ac-cat">${esc(p.category)}</span>`}
    </li>`).join('');
  list.hidden = false;
  input.setAttribute('aria-expanded', 'true');
  input.removeAttribute('aria-activedescendant');
}

function closeAutocomplete() {
  const list = $('autocomplete-list');
  if (!list || list.hidden) return;
  list.hidden = true;
  list.innerHTML = '';
  acItems = [];
  acIndex = -1;
  $('new-item-name').setAttribute('aria-expanded', 'false');
  $('new-item-name').removeAttribute('aria-activedescendant');
}

function moveSuggestion(delta) {
  if (!acItems.length) return;
  const n = acItems.length + 1; // position supplémentaire (-1) = retour au texte tapé
  acIndex = ((acIndex + 1 + delta + n) % n) - 1;
  document.querySelectorAll('.autocomplete-item').forEach((el, i) => el.setAttribute('aria-selected', i === acIndex));
  const input = $('new-item-name');
  if (acIndex >= 0) {
    input.setAttribute('aria-activedescendant', 'ac-' + acIndex);
    $('ac-' + acIndex).scrollIntoView({ block: 'nearest' });
  } else {
    input.removeAttribute('aria-activedescendant');
  }
}

function pickSuggestion(index) {
  const p = acItems[index];
  if (!p) return;
  if (addItemByName(p.name, $('new-item-qty').value, p.category)) resetAddForm();
}

function handleAddKeydown(e) {
  const open = !$('autocomplete-list').hidden;
  if (e.key === 'ArrowDown' && open) { e.preventDefault(); moveSuggestion(1); }
  else if (e.key === 'ArrowUp' && open) { e.preventDefault(); moveSuggestion(-1); }
  else if (e.key === 'Escape' && open) { e.preventDefault(); closeAutocomplete(); }
}

// ══════════════════════════════════════════════════════
//  CATALOGUE
// ══════════════════════════════════════════════════════
let catalogCat = CATEGORIES[0].name;

function openCatalog() {
  if (typeof PRODUCT_CATALOG === 'undefined') { toast('❌ Catalogue indisponible, recharge la page'); return; }
  $('catalog-search').value = '';
  catalogCat = state.activeCat !== 'Tous' && PRODUCT_CATALOG[state.activeCat] ? state.activeCat : Object.keys(PRODUCT_CATALOG)[0];
  renderCatalog();
  openDialog('dlg-catalog');
  $('catalog-products').scrollTop = 0;
}

function renderCatalog() {
  const q = norm($('catalog-search').value);
  $('catalog-cats').innerHTML = Object.keys(PRODUCT_CATALOG).map(cat => {
    const c = catOf(cat);
    return `<button type="button" class="catalog-cat-btn" data-action="catalog-cat" data-cat="${esc(cat)}" aria-pressed="${!q && cat === catalogCat}" style="--chip:${c.color}">${c.emoji} ${esc(cat)}</button>`;
  }).join('');

  const products = q
    ? CATALOG.filter(p => p.n.includes(q))
    : PRODUCT_CATALOG[catalogCat].map(name => ({ name, category: catalogCat }));
  const grid = $('catalog-products');
  const scroll = grid.scrollTop;
  if (!products.length) {
    const typed = $('catalog-search').value.trim();
    grid.innerHTML = `<div class="catalog-empty">Aucun produit trouvé
      <br><button type="button" class="btn-secondary" data-action="catalog-add-custom">+ Ajouter « ${esc(typed)} »</button></div>`;
    return;
  }
  const inList = new Map(itemsOf(state.currentListId).filter(i => !i.checked).map(i => [norm(i.name), i.qty || 1]));
  grid.innerHTML = products.map(p => {
    const qty = inList.get(norm(p.name));
    return `<button type="button" class="catalog-product-btn${qty ? ' added' : ''}" data-action="catalog-add" data-name="${esc(p.name)}" data-cat="${esc(p.category)}">
      <span>${esc(p.name)}</span>
      <span class="add-icon" aria-label="${qty ? `déjà dans la liste, quantité ${qty}` : 'ajouter'}">${qty ? `✓${qty > 1 ? ' ×' + qty : ''}` : '+'}</span>
    </button>`;
  }).join('');
  grid.scrollTop = scroll;
}

// ══════════════════════════════════════════════════════
//  SCANNER (ZXing chargé seulement à la première utilisation)
// ══════════════════════════════════════════════════════
let zxingReader = null;
let scanActive = false;

function loadScript(src, integrity) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    if (integrity) { s.integrity = integrity; s.crossOrigin = 'anonymous'; }
    s.onload = resolve;
    s.onerror = () => reject(new Error('module de scan indisponible (connexion ?)'));
    document.head.appendChild(s);
  });
}

async function openScanner() {
  if (!navigator.mediaDevices?.getUserMedia) { toast('❌ Caméra non disponible sur cet appareil'); return; }
  closeAutocomplete();
  $('scanner-overlay').hidden = false;
  document.body.classList.add('no-scroll');
  scanActive = true;
  try {
    if (!window.ZXing) await loadScript(ZXING_URL, ZXING_SRI);
    if (!scanActive) return;
    const hints = new Map();
    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
      ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8,
      ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E,
      ZXing.BarcodeFormat.CODE_128, ZXing.BarcodeFormat.CODE_39,
      ZXing.BarcodeFormat.QR_CODE,
    ]);
    zxingReader = new ZXing.BrowserMultiFormatReader(hints);
    await zxingReader.decodeFromConstraints(
      { video: { facingMode: 'environment' } },
      $('scanner-video'),
      result => {
        if (!scanActive || !result) return;
        scanActive = false;
        if (navigator.vibrate) navigator.vibrate(40);
        closeScanner();
        handleBarcode(result.getText());
      }
    );
  } catch (e) {
    if (scanActive) {
      toast(e?.name === 'NotAllowedError'
        ? "❌ Autorise l'accès à la caméra pour scanner"
        : '❌ Caméra inaccessible : ' + (e?.message || e));
    }
    closeScanner();
  }
}

function closeScanner() {
  scanActive = false;
  $('scanner-overlay').hidden = true;
  document.body.classList.remove('no-scroll');
  if (zxingReader) {
    try { zxingReader.reset(); } catch {}
    zxingReader = null;
  }
}

// Correspondance entre les catégories Open Food Facts et nos rayons
const OFF_RULES = [
  ['Surgelés', ['en:frozen-foods', 'en:frozen-desserts', 'en:ice-creams']],
  ['Boissons', ['en:beverages', 'en:waters', 'en:alcoholic-beverages', 'en:wines', 'en:beers', 'en:sodas', 'en:fruit-juices', 'en:coffees', 'en:teas']],
  ['Produits laitiers', ['en:dairies', 'en:cheeses', 'en:milks', 'en:yogurts', 'en:eggs', 'en:butters', 'en:creams']],
  ['Viandes & Poissons', ['en:meats', 'en:poultries', 'en:fishes', 'en:seafood', 'en:hams', 'en:sausages', 'en:prepared-meats']],
  ['Fruits & Légumes', ['en:fresh-fruits', 'en:fresh-vegetables', 'en:fresh-plant-based-foods']],
];
function offCategory(tags) {
  if (!Array.isArray(tags) || !tags.length) return null;
  const set = new Set(tags);
  for (const [cat, keys] of OFF_RULES) if (keys.some(k => set.has(k))) return cat;
  return 'Épicerie';
}

async function handleBarcode(code) {
  const input = $('new-item-name');
  code = String(code).trim();
  if (!/^\d{6,14}$/.test(code)) {
    // QR code ou code non alimentaire : on propose le texte tel quel
    input.value = code.slice(0, 120);
    input.focus();
    return;
  }
  toast('⏳ Recherche du produit…', { duration: 10000 });
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name_fr,product_name,generic_name_fr,brands,categories_tags`);
    const json = await res.json();
    const p = json.product;
    const name = (p?.product_name_fr || p?.product_name || p?.generic_name_fr || '').trim();
    if (json.status === 1 && name) {
      const brand = (p.brands || '').split(',')[0].trim();
      const label = (brand && !norm(name).includes(norm(brand)) ? `${name} ${brand}` : name).slice(0, 120);
      input.value = label;
      const cat = offCategory(p.categories_tags);
      if (cat) input.dataset.category = cat;
      toast(`✅ ${label} — appuie sur + pour l'ajouter`);
    } else {
      input.value = `Produit ${code}`;
      toast('⚠️ Produit inconnu — corrige le nom si besoin');
    }
  } catch {
    input.value = `Produit ${code}`;
    toast('⚠️ Impossible de récupérer le produit (hors-ligne ?)');
  }
  input.focus();
  input.select();
}

// ══════════════════════════════════════════════════════
//  PARTAGE
// ══════════════════════════════════════════════════════
let shareListId = null;

function renderShare() {
  const sel = $('share-list-select');
  const owned = state.lists.filter(isOwner);
  const previous = shareListId || sel.value;
  sel.innerHTML = owned.length
    ? owned.map(l => `<option value="${esc(l.id)}">${esc(l.emoji || '🛒')} ${esc(l.name)}</option>`).join('')
    : '<option value="">Crée d\'abord une liste</option>';
  if (owned.some(l => l.id === previous)) sel.value = previous;
  sel.disabled = !owned.length;
  $('invite-btn').disabled = !owned.length;
  shareListId = null;

  const shared = state.lists.filter(l => !isOwner(l));
  $('shared-with-me').innerHTML = shared.length
    ? shared.map(l => `<div class="collab-row">
        <div class="collab-avatar emoji" aria-hidden="true">${esc(l.emoji || '🛒')}</div>
        <div class="collab-info"><div class="collab-email">${esc(l.name)}</div><div class="collab-role">${plural(listStats(l.id).total, 'article')}</div></div>
        <button type="button" class="collab-remove" data-action="leave-shared" data-id="${esc(l.id)}">Quitter</button>
      </div>`).join('')
    : '<p class="muted-note">Personne ne t\'a encore partagé de liste.</p>';
}

let collaborators = null;
async function loadCollaborators() {
  const el = $('collaborators-list');
  if (!state.user) return;
  if (collaborators === null) el.innerHTML = '<p class="muted-note">Chargement…</p>';
  const { data, error } = await sb.rpc('my_collaborators');
  if (error) {
    collaborators = null;
    el.innerHTML = `<p class="muted-note">${navigator.onLine ? 'Liste des collaborateurs indisponible pour le moment.' : '📡 Disponible une fois en ligne.'}</p>`;
    return;
  }
  collaborators = data || [];
  renderCollaborators();
}

function renderCollaborators() {
  const el = $('collaborators-list');
  const rows = (collaborators || []).filter(c => getList(c.list_id));
  if (!rows.length) {
    el.innerHTML = '<p class="muted-note">Aucun collaborateur pour l\'instant.</p>';
    return;
  }
  el.innerHTML = rows.map(c => {
    const list = getList(c.list_id);
    const who = c.full_name || c.email || 'Utilisateur';
    return `<div class="collab-row">
      <div class="collab-avatar" aria-hidden="true">${esc((who[0] || '?').toUpperCase())}</div>
      <div class="collab-info">
        <div class="collab-email">${esc(who)}</div>
        <div class="collab-role">${c.full_name && c.email ? esc(c.email) + ' · ' : ''}${esc(list.emoji || '🛒')} ${esc(list.name)}</div>
      </div>
      <button type="button" class="collab-remove" data-action="remove-collab" data-list="${esc(c.list_id)}" data-user="${esc(c.user_id)}" aria-label="Retirer ${esc(who)} de ${esc(list.name)}">Retirer</button>
    </div>`;
  }).join('');
}

async function findUserId(email) {
  const { data, error } = await sb.rpc('find_user_by_email', { p_email: email });
  if (!error) return data || null;
  // Base pas encore mise à jour (fonction absente) : ancienne méthode
  if (error.code === 'PGRST202' || error.code === '42883') {
    const res = await sb.from('profiles').select('id').eq('email', email.toLowerCase()).maybeSingle();
    if (res.error) throw res.error;
    return res.data?.id || null;
  }
  throw error;
}

async function handleInviteSubmit(e) {
  e.preventDefault();
  const email = $('invite-email').value.trim().toLowerCase();
  const listId = $('share-list-select').value;
  if (!listId) { toast('❌ Choisis une liste'); return; }
  if (!/^\S+@\S+\.\S+$/.test(email)) { toast('❌ Email invalide'); $('invite-email').focus(); return; }
  if (email === (state.user.email || '').toLowerCase()) { toast('😄 Tu as déjà accès à ta propre liste'); return; }
  if (!navigator.onLine) { toast('📡 Connexion nécessaire pour inviter'); return; }
  if (state.queue.some(op => op.t === 'list.add' && op.row.id === listId)) { toast('⏳ Liste pas encore synchronisée, réessaie dans un instant'); flush(); return; }

  const btn = $('invite-btn');
  btn.disabled = true;
  try {
    const userId = await findUserId(email);
    if (!userId) {
      toast("🤷 Aucun compte FreshList avec cet email. Envoie-lui le lien de l'app !");
      return;
    }
    const { error } = await sb.from('list_collaborators').insert({ list_id: listId, user_id: userId });
    if (error && error.code === '23505') { toast('ℹ️ Cette personne a déjà accès à la liste'); return; }
    if (error) throw error;
    $('invite-email').value = '';
    toast('✅ Liste partagée !');
    loadCollaborators();
  } catch (err) {
    toast('❌ ' + friendlyError(err));
  } finally {
    btn.disabled = false;
  }
}

async function removeCollaborator(listId, userId) {
  const c = (collaborators || []).find(x => x.list_id === listId && x.user_id === userId);
  const list = getList(listId);
  const ok = await confirmDialog(`Retirer ${c?.full_name || c?.email || 'cette personne'} de « ${list?.name || 'la liste'} » ?`, { ok: 'Retirer' });
  if (!ok) return;
  const { error } = await sb.from('list_collaborators').delete().eq('list_id', listId).eq('user_id', userId);
  if (error) { toast('❌ ' + friendlyError(error)); return; }
  toast('👋 Accès retiré');
  loadCollaborators();
}

function shareApp() {
  shareOrCopy({
    title: 'FreshList',
    text: 'Crée ton compte FreshList pour qu\'on partage nos listes de courses 🛒',
    url: appUrl(),
  }, '🔗 Lien copié !');
}

// ══════════════════════════════════════════════════════
//  PROFIL
// ══════════════════════════════════════════════════════
function exportData() {
  const data = {
    app: 'FreshList',
    exported_at: new Date().toISOString(),
    lists: state.lists.map(l => ({
      name: l.name,
      emoji: l.emoji,
      shared_with_me: !isOwner(l),
      items: itemsOf(l.id).map(({ name, qty, category, checked }) => ({ name, qty, category, checked })),
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `freshlist-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('📥 Export téléchargé');
}

// Thème
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
function themePref() {
  try { return localStorage.getItem(THEME_KEY) || 'auto'; } catch { return 'auto'; }
}
function applyTheme() {
  const pref = themePref();
  const dark = pref === 'dark' || (pref === 'auto' && darkQuery.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('theme-btn').textContent = dark ? '☀️' : '🌙';
  $('theme-btn').setAttribute('aria-label', dark ? 'Passer en mode clair' : 'Passer en mode sombre');
  document.querySelector('meta[name="theme-color"]').content = dark ? '#1F1B2E' : '#FFFFFF';
  document.querySelectorAll('[data-action="set-theme"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.theme === pref));
}
function setTheme(pref) {
  try {
    if (pref === 'auto') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {}
  applyTheme();
}
darkQuery.addEventListener?.('change', applyTheme);

// Écran toujours allumé pendant les courses
let wakeLock = null;
async function updateWakeLock() {
  const want = state.user && state.view === 'items' && store.get('fl:wakelock', false) && document.visibilityState === 'visible';
  if (want && !wakeLock && 'wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch {}
  } else if (!want) {
    releaseWakeLock();
  }
}
function releaseWakeLock() {
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}

// Installation (Android / ordinateur)
let installPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installPrompt = e;
  $('install-btn').hidden = false;
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  $('install-btn').hidden = true;
  toast('📲 FreshList est installée !');
});
async function installApp() {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice.catch(() => {});
  installPrompt = null;
  $('install-btn').hidden = true;
}

// ══════════════════════════════════════════════════════
//  FENÊTRES & NOTIFICATIONS
// ══════════════════════════════════════════════════════
function openDialog(id) {
  const dlg = $(id);
  if (!dlg.open) dlg.showModal();
}

function confirmDialog(message, { ok = 'Confirmer', danger = true } = {}) {
  return new Promise(resolve => {
    const dlg = $('dlg-confirm');
    $('confirm-msg').textContent = message;
    $('confirm-ok').textContent = ok;
    $('confirm-ok').classList.toggle('danger', danger);
    dlg.returnValue = '';
    dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true });
    dlg.showModal();
    $('confirm-ok').focus();
  });
}

let toastTimer = null;
function toast(msg, { label, run, duration } = {}) {
  const el = $('toast');
  const btn = $('toast-action');
  $('toast-msg').textContent = msg;
  btn.hidden = !label;
  btn.textContent = label || '';
  btn.onclick = label ? () => { hideToast(); run(); } : null;
  el.classList.remove('show');
  // En « popover », la notification reste visible au-dessus des fenêtres ouvertes
  if (typeof el.showPopover === 'function') {
    try { if (el.matches(':popover-open')) el.hidePopover(); el.showPopover(); } catch {}
  }
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, duration || (label ? 5000 : 2600));
}
function hideToast() { $('toast').classList.remove('show'); }

// ══════════════════════════════════════════════════════
//  ÉVÉNEMENTS
// ══════════════════════════════════════════════════════
const actions = {
  'auth-tab': el => setAuthMode(el.dataset.mode),
  'forgot-password': forgotPassword,
  'toggle-password': el => {
    const input = $(el.dataset.target);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    el.setAttribute('aria-pressed', show);
    el.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
  },
  'nav': el => navigate(el.dataset.view),
  'toggle-theme': () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'),
  'set-theme': el => setTheme(el.dataset.theme),
  'new-list': () => openListDialog(null),
  'open-list': el => openList(el.dataset.id),
  'list-menu': el => openListDialog(el.dataset.id || state.currentListId),
  'pick-emoji': el => selectEmoji(el.dataset.emoji),
  'delete-list': deleteList,
  'leave-list': leaveList,
  'leave-shared': el => { editingListId = el.dataset.id; leaveList(); },
  'share-list-text': shareListText,
  'invite-to-list': () => {
    shareListId = editingListId;
    $('dlg-list').close();
    navigate('share');
    $('invite-email').focus();
  },
  'toggle-item': el => toggleItem(el.dataset.id),
  'edit-item': el => openItemEditor(el.dataset.id),
  'delete-item': deleteEditingItem,
  'qty-step': stepQty,
  'filter-cat': el => setFilter(el.dataset.cat),
  'clear-checked': clearChecked,
  'ac-pick': el => pickSuggestion(Number(el.dataset.index)),
  'open-catalog': openCatalog,
  'catalog-cat': el => { catalogCat = el.dataset.cat; $('catalog-search').value = ''; renderCatalog(); $('catalog-products').scrollTop = 0; },
  'catalog-add': el => addItemByName(el.dataset.name, 1, el.dataset.cat),
  'catalog-add-custom': () => { if (addItemByName($('catalog-search').value, 1)) { $('catalog-search').value = ''; renderCatalog(); } },
  'open-scanner': openScanner,
  'close-scanner': closeScanner,
  'remove-collab': el => removeCollaborator(el.dataset.list, el.dataset.user),
  'share-app': shareApp,
  'clear-all-checked': clearAllChecked,
  'export-data': exportData,
  'install-app': installApp,
  'logout': logout,
  'close-modal': el => el.closest('dialog')?.close(),
};

function bindEvents() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (el && !el.disabled && actions[el.dataset.action]) actions[el.dataset.action](el, e);
    // (Entrée dans le champ déclenche un clic sur « + » : ne pas fermer les suggestions avant l'envoi)
    if (!e.target.closest('#add-item-form')) closeAutocomplete();
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-action]')) {
      e.preventDefault();
      e.target.click();
    }
    if (e.key === 'Escape' && !$('scanner-overlay').hidden) closeScanner();
  });

  // Clic sur le fond d'une fenêtre = fermeture
  document.querySelectorAll('dialog').forEach(dlg => {
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  });

  $('auth-form').addEventListener('submit', handleAuthSubmit);
  $('list-form').addEventListener('submit', handleListSubmit);
  $('item-form').addEventListener('submit', handleItemSubmit);
  $('password-form').addEventListener('submit', handlePasswordSubmit);
  $('invite-form').addEventListener('submit', handleInviteSubmit);
  $('add-item-form').addEventListener('submit', handleAddSubmit);
  $('new-item-name').addEventListener('input', updateAutocomplete);
  $('new-item-name').addEventListener('keydown', handleAddKeydown);
  $('catalog-search').addEventListener('input', renderCatalog);
  $('wakelock-toggle').addEventListener('change', e => {
    store.set('fl:wakelock', e.target.checked);
    updateWakeLock();
  });

  window.addEventListener('online', () => {
    updateSyncBanner();
    if (!state.user) return;
    if (state.offline) { resumeOnline(); return; }
    flush();
    refresh().then(ok => { if (ok) toast('✅ De retour en ligne, tout est synchronisé'); });
  });
  window.addEventListener('offline', updateSyncBanner);
  document.addEventListener('visibilitychange', () => {
    updateWakeLock();
    if (document.visibilityState === 'visible' && state.user && navigator.onLine) {
      flush();
      scheduleRefresh(0);
    }
  });
}

function buildStaticUI() {
  $('emoji-picker').innerHTML = EMOJIS.map(e =>
    `<button type="button" class="emoji-option" role="radio" aria-checked="false" aria-label="${e}" data-action="pick-emoji" data-emoji="${e}">${e}</button>`
  ).join('');
  $('item-cat').innerHTML = CATEGORIES.map(c => `<option value="${esc(c.name)}">${c.emoji} ${esc(c.name)}</option>`).join('');
  $('wakelock-row').hidden = !('wakeLock' in navigator);
}

// ══════════════════════════════════════════════════════
//  LANCEMENT
// ══════════════════════════════════════════════════════
buildStaticUI();
bindEvents();
applyTheme();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(err => console.warn('Service worker non enregistré', err));
}

// Supabase gère la session (y compris le retour depuis un lien reçu par email)
sb.auth.onAuthStateChange((event, session) => {
  // Différé : les appels Supabase à l'intérieur de ce callback peuvent bloquer
  setTimeout(() => handleAuthEvent(event, session), 0);
});

// Réseau très lent : on n'attend pas indéfiniment sur l'écran de chargement
setTimeout(() => {
  if ($('boot').hidden) return;
  const last = store.get('fl:lastUser', null);
  if (last) startApp(last, { offline: true });
  else $('boot-msg').textContent = 'Connexion lente… patiente encore un peu.';
}, 6000);
