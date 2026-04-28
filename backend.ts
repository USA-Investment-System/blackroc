import type { User } from './store';

const LOCAL_USERS_KEY = 'br10-users';
const ENV = (import.meta as any).env || {};
const SUPABASE_URL = ENV.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = ENV.VITE_SUPABASE_ANON_KEY as string | undefined;
const REMOTE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Supabase table required when remote mode is enabled:
// create table br_users (
//   id text primary key,
//   username text unique not null,
//   code text unique not null,
//   payload jsonb not null,
//   updated_at timestamptz default now()
// );

export function backendMode() {
  return REMOTE_ENABLED ? 'supabase' : 'local';
}

export async function sha256(text: string) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function normalizeUser<T extends Partial<User> & Record<string, any>>(u: T): User {
  const inviteLink = (code: string) => {
    try {
      const basePath = location.pathname.replace(/\/?index\.html$/i, '').replace(/\/$/, '');
      return `${location.origin}${basePath || ''}?code=${code}`;
    } catch {
      return 'blackrock.app?code=' + code;
    }
  };
  const out: any = {
    id: Date.now(), un: '', pw: '', code: '', ref: '', phone: '', wilaya: '',
    balance: 0, taskBal: 0, refEarn: 0, teamCount: 0,
    wheelSpins: 0, m1Refs: 0, level: null, totalEarned: 0,
    avatar: null, joined: new Date().toISOString(), joinedVia: null,
    notifs: [], investments: [], investEarned: 0, withdrawals: [],
    upgradeRequests: [], team: [], loginStreak: 0, badges: [], activityLog: [],
    showLiveActivity: true, profileCompleted: false,
    ...u,
  };
  out.investments ||= [];
  out.withdrawals ||= [];
  out.upgradeRequests ||= [];
  out.team ||= [];
  out.notifs ||= [];
  out.activityLog ||= [];
  out.badges ||= [];
  if (!out.ref || String(out.ref).includes('?ref=') || String(out.ref).includes('/ref/') || String(out.ref).includes('/invite')) out.ref = inviteLink(out.code);
  return out as User;
}

function localUsers(): User[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]').map(normalizeUser); }
  catch { return []; }
}

function saveLocalUsers(users: User[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

async function remoteFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}

async function remoteFetchRaw(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res;
}

async function remoteGetBy(field: 'username' | 'code', value: string): Promise<User | null> {
  const rows = await remoteFetch(`br_users?select=payload&${field}=eq.${encodeURIComponent(value)}&limit=1`);
  return rows?.[0]?.payload ? normalizeUser(rows[0].payload) : null;
}

async function remoteUpsert(user: User) {
  await remoteFetch('br_users?on_conflict=id', {
    method: 'POST',
    body: JSON.stringify({
      id: String(user.id),
      username: user.un,
      code: user.code,
      payload: user,
      updated_at: new Date().toISOString(),
    }),
    headers: { Prefer: 'resolution=merge-duplicates' },
  });
}

export async function loginUser(username: string, password: string): Promise<User | null> {
  const hash = await sha256(password);
  if (REMOTE_ENABLED) {
    const user = await remoteGetBy('username', username);
    if (!user) return null;
    const storedHash = (user as any).passwordHash;
    if (storedHash ? storedHash === hash : user.pw === password) return normalizeUser(user);
    return null;
  }
  const user = localUsers().find(u => u.un === username);
  if (!user) return null;
  const storedHash = (user as any).passwordHash;
  if (storedHash ? storedHash === hash : user.pw === password) return normalizeUser(user);
  return null;
}

export async function usernameExists(username: string) {
  if (REMOTE_ENABLED) return Boolean(await remoteGetBy('username', username));
  return localUsers().some(u => u.un === username);
}

export async function findUserByCode(code: string) {
  const clean = code.toUpperCase();
  if (REMOTE_ENABLED) return remoteGetBy('code', clean);
  return localUsers().find(u => String(u.code).toUpperCase() === clean || String(u.id).toUpperCase() === clean || String(u.ref).toUpperCase().includes(`CODE=${clean}`) || String(u.ref).toUpperCase().includes(clean)) || null;
}

export async function createUser(user: User, password: string) {
  const payload = normalizeUser({ ...user, pw: '', passwordHash: await sha256(password) } as any);
  if (REMOTE_ENABLED) await remoteUpsert(payload);
  else {
    const users = localUsers();
    users.push(payload);
    saveLocalUsers(users);
  }
  return payload;
}

export async function saveUser(user: User) {
  const payload = normalizeUser(user);
  if (REMOTE_ENABLED) await remoteUpsert(payload);
  else {
    const users = localUsers();
    const i = users.findIndex(u => u.id === payload.id);
    if (i >= 0) users[i] = payload; else users.push(payload);
    saveLocalUsers(users);
  }
}

export async function updateUserByCode(code: string, updater: (user: User) => User) {
  const current = await findUserByCode(code);
  if (!current) return null;
  const next = normalizeUser(updater(current));
  await saveUser(next);
  return next;
}

function maskName(name: string) {
  const clean = (name || '').trim();
  if (!clean) return 'مستخدم';
  if (clean.length <= 3) return clean[0] + '**';
  return clean.slice(0, 2) + '***' + clean.slice(-1);
}

export async function getPublicStats(currentUser?: User | null): Promise<{ count: number; latestName: string }> {
  if (REMOTE_ENABLED) {
    const countRes = await remoteFetchRaw('br_users?select=id', {
      method: 'GET',
      headers: { Prefer: 'count=exact', Range: '0-0' },
    });
    const range = countRes.headers.get('content-range') || '0-0/0';
    const count = parseInt(range.split('/')[1] || '0', 10) || 0;
    const latest = await remoteFetch('br_users?select=username&order=updated_at.desc&limit=1');
    return { count, latestName: maskName(latest?.[0]?.username || currentUser?.un || 'مستخدم') };
  }
  const users = localUsers();
  const latest = users[users.length - 1] || currentUser;
  return { count: users.length || (currentUser ? 1 : 0), latestName: maskName(latest?.un || 'مستخدم') };
}
