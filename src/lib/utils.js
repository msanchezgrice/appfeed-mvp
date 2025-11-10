export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export function redact(str) {
  if (!str) return str;
  return String(str).slice(0, 4) + "••••" + String(str).slice(-2);
}

export function uidPrefix(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function nowIso() { return new Date().toISOString(); }

export function generateForkId(baseId) {
  const rand = Math.random().toString(36).slice(2, 7);
  return baseId + "-fork-" + rand;
}

export function getCurrentUserIdFromHeaders(headers) {
  // Simulated auth: accept x-user-id from client; fallback to u_jamie
  const hdr = headers.get('x-user-id');
  return hdr || 'u_jamie';
}
