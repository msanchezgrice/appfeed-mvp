import fs from 'fs';
import path from 'path';
import { apps as seedApps, creators as seedCreators, tags as seedTags } from './seed.js';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const defaultState = {
  users: [
    { id: 'u_alex', name: 'Alex', avatar: '/avatars/1.svg' },
    { id: 'u_jamie', name: 'Jamie', avatar: '/avatars/2.svg' }
  ],
  creators: seedCreators,
  tags: seedTags,
  apps: seedApps,
  variants: [],
  library: [],        // { userId, appId }
  follows: [],        // { userId, creatorId }
  secrets: [],        // { userId, provider, encPayload }
  runs: [],           // { id, appId, userId, status, inputs, trace, outputs, createdAt }
  todos: {}           // userId -> [{title, due, id, createdAt, done:false}]
};

let state = null;

function ensureLoaded() {
  if (state) return;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    try { state = JSON.parse(raw); }
    catch { state = structuredClone(defaultState); }
  } else {
    state = structuredClone(defaultState);
    flush();
  }
}

export function flush() {
  if (!state) return;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf8');
}

export function db() {
  ensureLoaded();
  return state;
}

export function resetDb() {
  state = structuredClone(defaultState);
  flush();
}

export function getAppById(id) {
  ensureLoaded();
  const base = state.apps.find(a => a.id === id);
  if (base) return base;
  const variant = state.variants.find(a => a.id === id);
  return variant || null;
}

export function addVariant(variant) {
  ensureLoaded();
  state.variants.push(variant);
  flush();
}

export function upsertSecret({ userId, provider, encPayload }) {
  ensureLoaded();
  const idx = state.secrets.findIndex(s => s.userId === userId && s.provider === provider);
  if (idx >= 0) state.secrets[idx] = { userId, provider, encPayload };
  else state.secrets.push({ userId, provider, encPayload });
  flush();
}

export function getSecret({ userId, provider }) {
  ensureLoaded();
  return state.secrets.find(s => s.userId === userId && s.provider === provider) || null;
}

export function addRun(run) {
  ensureLoaded();
  state.runs.push(run);
  flush();
}

export function addLibrary(userId, appId) {
  ensureLoaded();
  const exists = state.library.some(r => r.userId === userId && r.appId === appId);
  if (!exists) state.library.push({ userId, appId });
  flush();
}

export function removeLibrary(userId, appId) {
  ensureLoaded();
  state.library = state.library.filter(r => !(r.userId === userId && r.appId === appId));
  flush();
}

export function listUserTodos(userId) {
  ensureLoaded();
  if (!state.todos[userId]) state.todos[userId] = [];
  return state.todos[userId];
}

export function addUserTodo(userId, item) {
  ensureLoaded();
  if (!state.todos[userId]) state.todos[userId] = [];
  state.todos[userId].push(item);
  flush();
}
